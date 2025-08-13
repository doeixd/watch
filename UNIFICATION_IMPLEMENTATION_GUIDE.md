# Watch-Selector Library Unification Implementation Guide

## Executive Summary

This guide outlines the complete unification of the watch-selector library to eliminate redundancy by integrating ALL generator module functionality into the main library. The goal is to give the main library (watch-enhanced, dom-new, events) all the functionality currently exclusive to the generator module, then remove the generator module entirely. This will create a single, unified API that supports all usage patterns (direct, selector, generator) through smart function overloading.

## IMPORTANT: Implementation Agent Context

**To the agent implementing this guide:**

1. **DO NOT create new files** - We are enhancing existing files only
2. **The generator module will be DELETED** - Don't preserve it, integrate everything into the main API
3. **Test everything** - Each function must work in all three modes (direct, selector, generator)
4. **Preserve type safety** - Use proper TypeScript overloads, don't use `any` except in implementation
5. **Copy the good parts** - The generator module has robust event handling with debounce/throttle and proper cleanup - preserve these features
6. **Fix the issues** - The generator module had bugs we fixed (see LIFECYCLE_ISSUES.md) - implement the fixed versions

## Current State Analysis

### Architecture Overview

```
watch-selector/
├── src/api/
│   ├── dom-new.ts        # ✅ Already supports direct, selector, AND generator patterns
│   └── events.ts          # ❌ Only supports direct/selector patterns (no generator)
├── src/generator/
│   ├── dom.ts            # 🔄 Redundant - duplicates dom-new.ts generator support
│   ├── events.ts         # ⚠️ Unique - has generator support for events + lifecycle
│   └── state.ts          # 🔄 Redundant - state management exists elsewhere
├── src/watch-enhanced.ts  # Enhanced context wrapping dom-new
└── src/core/enhanced-context/
    └── context-with-dom.ts # ❌ Missing events, lifecycle, observers
```

### Key Discoveries

1. **dom-new.ts is already complete** - It supports all three patterns (direct, selector, generator)
2. **api/events.ts lacks generator support** - This is the main gap that needs filling
3. **Generator module has unique event implementations** - These need to be ported to api/events.ts
4. **Enhanced context is incomplete** - Missing events and lifecycle
5. **Generator module has fixes** - Recent fixes for onUnmount, debounce, etc. must be preserved

### Critical Files to Edit

1. **src/api/events.ts** - Add generator overloads and new event functions
2. **src/core/enhanced-context/context-with-dom.ts** - Add event methods
3. **src/index.ts** - Export new functions, remove generator exports
4. **DELETE src/generator/** - After integration is complete

## Implementation Plan

### Phase 1: Add Generator Overloads to api/events.ts

**Goal**: Make api/events.ts as smart as dom-new.ts with full pattern support.

#### 1.1 Update Event Function Signatures

**IMPORTANT**: Copy the working implementations from src/generator/events.ts, including:
- Debounce/throttle support with event preservation
- Proper cleanup registration
- Support for async generator handlers
- The fixes from LIFECYCLE_ISSUES.md

```typescript
// api/events.ts - Add these overloads to EACH event function

// Example for click() - apply same pattern to all events
export function click(
  element: HTMLElement,
  handler: EventHandler,
  options?: EventOptions
): void;
export function click(
  selector: string,
  handler: EventHandler,
  options?: EventOptions
): void;
export function click(
  handler: EventHandler,
  options?: EventOptions
): Workflow<void>;
export function click(...args: any[]): any {
  // Direct element pattern
  if (args.length >= 2 && isHTMLElement(args[0])) {
    const [element, handler, options] = args;
    element.addEventListener('click', handler, options);
    return;
  }
  
  // Selector pattern
  if (args.length >= 2 && typeof args[0] === 'string') {
    const [selector, handler, options] = args;
    const elements = resolveElements(selector);
    elements.forEach(el => el.addEventListener('click', handler, options));
    return;
  }
  
  // Generator pattern - returns Workflow
  if (args.length >= 1 && typeof args[0] === 'function') {
    const [handler, options] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        // Support generator handlers like the generator module does
        const wrappedHandler = async (event: MouseEvent) => {
          const result = handler(event);
          if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
            await runOn(context.element, () => result);
          } else if (result && typeof result.then === 'function') {
            await result;
          }
        };
        
        // Apply debounce/throttle if specified
        let finalHandler = wrappedHandler;
        if (options?.debounce) {
          finalHandler = debounce(wrappedHandler, options.debounce);
        } else if (options?.throttle) {
          finalHandler = throttle(wrappedHandler, options.throttle);
        }
        
        // IMPORTANT: Preserve event data for debounced handlers (from generator module fix)
        if (options?.debounce) {
          const delay = options.debounce;
          let timeoutId: any;
          finalHandler = (event: MouseEvent) => {
            clearTimeout(timeoutId);
            // Clone event data before it becomes invalid
            const eventData = {
              target: event.target,
              type: event.type,
              currentTarget: event.currentTarget,
              clientX: event.clientX,
              clientY: event.clientY,
            };
            const preservedEvent = Object.assign({}, event, eventData);
            timeoutId = setTimeout(() => wrappedHandler(preservedEvent), delay);
          };
        }
        
        context.element.addEventListener('click', finalHandler, options);
        
        // Register cleanup (CRITICAL: must work with context.cleanup function)
        if (typeof context.cleanup === 'function') {
          context.cleanup(() => {
            context.element.removeEventListener('click', finalHandler, options);
          });
        }
      }) as Operation<void>;
    })();
  }
}
```

#### 1.2 Apply to All Event Functions

Apply the same pattern to:
- `input()`
- `change()`
- `submit()`
- `focus()`
- `blur()`
- `keydown()`
- `keyup()`
- `mouseenter()`
- `mouseleave()`
- `on()` (generic event handler)

### Phase 2: Add Lifecycle Events to api/events.ts

**Goal**: Move onMount, onUnmount from generator module to main API.

#### 2.1 Add Lifecycle Event Functions

```typescript
// api/events.ts - Add these new functions

export function onMount(
  element: HTMLElement,
  handler: () => void | Promise<void>
): void;
export function onMount(
  selector: string,
  handler: () => void | Promise<void>
): void;
export function onMount(
  handler: () => void | Promise<void> | AsyncGenerator<any, void, any>
): Workflow<void>;
export function onMount(...args: any[]): any {
  // Direct element pattern
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, handler] = args;
    if (element.isConnected) {
      queueMicrotask(() => handler());
    }
    return;
  }
  
  // Selector pattern
  if (args.length === 2 && typeof args[0] === 'string') {
    const [selector, handler] = args;
    const elements = resolveElements(selector);
    elements.forEach(el => {
      if (el.isConnected) {
        queueMicrotask(() => handler());
      }
    });
    return;
  }
  
  // Generator pattern
  if (args.length === 1) {
    const [handler] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        let hasBeenCalled = false;
        
        const wrappedHandler = async () => {
          if (hasBeenCalled) return;
          hasBeenCalled = true;
          
          const result = handler();
          if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
            await runOn(context.element, () => result);
          } else if (result && typeof result.then === 'function') {
            await result;
          }
        };
        
        // CRITICAL: Check if element is connected (from generator module fix)
        
        if (context.element.isConnected) {
          queueMicrotask(() => wrappedHandler());
        } else {
          // Wait for connection
          const observer = new MutationObserver(() => {
            if (context.element.isConnected) {
              wrappedHandler();
              observer.disconnect();
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          
          if (typeof context.cleanup === 'function') {
            context.cleanup(() => observer.disconnect());
          }
        }
      }) as Operation<void>;
    })();
  }
}

// Similar implementation for onUnmount
export function onUnmount(...args: any[]): any {
  // CRITICAL: Copy fixed implementation from src/generator/events.ts
  // Must fire on BOTH:
  // 1. Element removal from DOM (MutationObserver)
  // 2. Controller.destroy() call (cleanup registration)
  // Use hasBeenCalled flag to prevent double execution
  // Register cleanup with: context.cleanup(() => { wrappedHandler(); observer.disconnect(); })
}
```

### Phase 3: Add Observer Events to api/events.ts

**Goal**: Move observer events from generator module to main API.

#### 3.1 Add Observer Event Functions

```typescript
// api/events.ts - Add observer events with smart overloads

export function onAttr(
  element: HTMLElement,
  attributeName: string,
  handler: (newValue: string | null, oldValue: string | null) => void
): void;
export function onAttr(
  selector: string,
  attributeName: string,
  handler: (newValue: string | null, oldValue: string | null) => void
): void;
export function onAttr(
  attributeName: string,
  handler: (newValue: string | null, oldValue: string | null) => void
): Workflow<void>;
export function onAttr(...args: any[]): any {
  // CRITICAL: Copy from src/generator/events.ts
  // Must include:
  // - MutationObserver with attributeFilter
  // - Proper cleanup registration: context.cleanup(() => observer.disconnect())
  // - Support for attributeOldValue
}

// Similar for onText, onVisible, onResize
// ALL must register cleanup: context.cleanup(() => observer.disconnect())
```

### Phase 4: Update Enhanced Context

**Goal**: Ensure enhanced context exposes all new functionality.

#### 4.1 Update context-with-dom.ts Interface

```typescript
// src/core/enhanced-context/context-with-dom.ts

export interface EnhancedTypedGeneratorContext<El extends HTMLElement> 
  extends TypedGeneratorContext<El> {
  // ... existing DOM methods ...
  
  // Add event methods
  click(handler: EventHandler, options?: EventOptions): Workflow<void>;
  input(handler: EventHandler, options?: EventOptions): Workflow<void>;
  change(handler: EventHandler, options?: EventOptions): Workflow<void>;
  submit(handler: EventHandler, options?: EventOptions): Workflow<void>;
  focus(handler: EventHandler, options?: EventOptions): Workflow<void>;
  blur(handler: EventHandler, options?: EventOptions): Workflow<void>;
  keydown(handler: EventHandler, options?: EventOptions): Workflow<void>;
  keyup(handler: EventHandler, options?: EventOptions): Workflow<void>;
  mouseenter(handler: EventHandler, options?: EventOptions): Workflow<void>;
  mouseleave(handler: EventHandler, options?: EventOptions): Workflow<void>;
  on(event: string, handler: EventHandler, options?: EventOptions): Workflow<void>;
  
  // Add lifecycle events
  onMount(handler: () => void | Promise<void> | AsyncGenerator<any, void, any>): Workflow<void>;
  onUnmount(handler: () => void | Promise<void> | AsyncGenerator<any, void, any>): Workflow<void>;
  
  // Add observer events
  onAttr(name: string, handler: (newVal: string | null, oldVal: string | null) => void): Workflow<void>;
  onText(handler: (newText: string, oldText: string) => void): Workflow<void>;
  onVisible(handler: (isVisible: boolean) => void): Workflow<void>;
  onResize(handler: (entry: ResizeObserverEntry) => void): Workflow<void>;
}
```

#### 4.2 Update createEnhancedContext Implementation

```typescript
// src/core/enhanced-context/context-with-dom.ts

import * as events from '../../api/events';

export function createEnhancedContext<El extends HTMLElement>(
  baseContext: TypedGeneratorContext<El>
): EnhancedTypedGeneratorContext<El> {
  return {
    ...baseContext,
    
    // ... existing DOM methods ...
    
    // Add event methods
    click: (handler, options) => events.click(handler, options),
    input: (handler, options) => events.input(handler, options),
    change: (handler, options) => events.change(handler, options),
    submit: (handler, options) => events.submit(handler, options),
    // ... etc for all events ...
    
    // Add lifecycle events
    onMount: (handler) => events.onMount(handler),
    onUnmount: (handler) => events.onUnmount(handler),
    
    // Add observer events
    onAttr: (name, handler) => events.onAttr(name, handler),
    onText: (handler) => events.onText(handler),
    onVisible: (handler) => events.onVisible(handler),
    onResize: (handler) => events.onResize(handler),
  };
}
```

### Phase 5: Remove Generator Module

#### 5.1 Delete Generator Module Files

After completing integration and testing:

```bash
# Delete the entire generator module
rm -rf src/generator/
```

#### 5.2 Update Package Exports

```typescript
// package.json - Remove generator export
{
  "exports": {
    ".": "./dist/index.js",
    // DELETE THIS LINE: "./generator": "./dist/generator/index.js"
  }
}
```

#### 5.3 Update src/index.ts

```typescript
// src/index.ts
// Remove any imports from './generator'
// Add exports for new event functions:
export {
  // ... existing exports ...
  
  // Lifecycle events (NEW - from api/events.ts)
  onMount,
  onUnmount,
  
  // Observer events (NEW - from api/events.ts)  
  onAttr,
  onText,
  onVisible,
  onResize,
} from './api/events';
```

## Implementation Order

1. **Start with api/events.ts** - Add generator overloads to existing functions
2. **Add lifecycle events** - Port onMount/onUnmount WITH FIXES from LIFECYCLE_ISSUES.md
3. **Add observer events** - Port onAttr/onText/onVisible/onResize with cleanup
4. **Update enhanced context** - Wire up all new functionality
5. **Update TypeScript types** - Ensure full type safety
6. **Add tests** - Verify all patterns work, including:
   - Debounce/throttle in all modes
   - onUnmount fires on controller.destroy()
   - No memory leaks from observers
7. **Update src/index.ts** - Export new functions
8. **DELETE generator module** - Remove entirely, no deprecation period
9. **Update documentation** - Show unified API only

## Testing Strategy

### Test All Patterns for Each Function

```typescript
describe('Unified API', () => {
  describe('click event', () => {
    it('works with direct element', () => {
      const button = document.createElement('button');
      click(button, () => console.log('clicked'));
    });
    
    it('works with selector', () => {
      click('#button', () => console.log('clicked'));
    });
    
    it('works with generator', async () => {
      await runOn(button, function* () {
        yield* click(() => console.log('clicked'));
      });
    });
    
    it('works with enhanced context', async () => {
      watch('button', function* (ctx) {
        yield* ctx.click(() => console.log('clicked'));
      });
    });
    
    it('supports debounce in all patterns', () => {
      // Test debounce works in direct, selector, and generator modes
    });
  });
});
```

## Benefits of Unification

1. **Single Source of Truth** - One implementation for each feature
2. **Complete Flexibility** - All patterns supported everywhere
3. **Better Tree-Shaking** - Import only what you need
4. **Easier Maintenance** - No duplicate implementations
5. **Clear Mental Model** - Functions work the same everywhere
6. **Full Backward Compatibility** - No breaking changes

## Critical Implementation Details

### Must Preserve These Fixes from Generator Module

1. **Debounce Event Preservation**
   ```typescript
   // Events become invalid after handler returns
   // Must clone data before setTimeout
   const eventData = { target: event.target, type: event.type, ... };
   const preservedEvent = Object.assign({}, event, eventData);
   setTimeout(() => handler(preservedEvent), delay);
   ```

2. **onUnmount Double Execution Prevention**
   ```typescript
   let hasBeenCalled = false;
   const wrappedHandler = async () => {
     if (hasBeenCalled) return;
     hasBeenCalled = true;
     // ... handler logic ...
   };
   ```

3. **Cleanup Registration Pattern**
   ```typescript
   // Always use this pattern for observers:
   if (typeof context.cleanup === 'function') {
     context.cleanup(() => observer.disconnect());
   } else if (context.addObserver) {
     context.addObserver(observer);
   }
   ```

### Migration Examples

### Before (Generator Module)
```typescript
import { watch } from 'watch-selector';
import { click, onMount } from 'watch-selector/generator';

watch('button', function* () {
  yield* click(() => {});
  yield* onMount(() => {});
});
```

### After (Unified API)
```typescript
import { watch, click, onMount } from 'watch-selector';

watch('button', function* () {
  yield* click(() => {});   // Exact same behavior
  yield* onMount(() => {});  // Exact same behavior
});
```

### Or With Context
```typescript
import { watch } from 'watch-selector';

watch('button', function* (ctx) {
  yield* ctx.text('Click me');
  yield* ctx.click(() => {});  // All from context!
});
```

## Type Safety Considerations

### Ensure Proper Overloads
```typescript
// Each function needs careful overloading for TypeScript inference

export function click(
  element: HTMLElement,
  handler: (e: MouseEvent) => void,
  options?: AddEventListenerOptions
): void;

export function click(
  selector: string,
  handler: (e: MouseEvent) => void,
  options?: AddEventListenerOptions
): void;

export function click(
  handler: (e: MouseEvent) => void | Promise<void> | AsyncGenerator<any, void, any>,
  options?: AddEventListenerOptions & { debounce?: number; throttle?: number }
): Workflow<void>;
```

### Preserve Event Type Inference
```typescript
// Handler types should preserve event type
type ClickHandler = (event: MouseEvent) => void | Promise<void> | AsyncGenerator<any, void, any>;
type InputHandler = (event: InputEvent) => void | Promise<void> | AsyncGenerator<any, void, any>;
// etc.
```

## Testing Checklist

After implementation, verify:

- [ ] All events work in direct mode: `click(element, handler)`
- [ ] All events work in selector mode: `click('.button', handler)`  
- [ ] All events work in generator mode: `yield* click(handler)`
- [ ] All events work in context mode: `yield* ctx.click(handler)`
- [ ] Debounce works in all modes and preserves event data
- [ ] Throttle works in all modes
- [ ] onMount fires when element is connected
- [ ] onUnmount fires on element removal AND controller.destroy()
- [ ] All observers (onAttr, onText, etc.) properly cleanup
- [ ] No memory leaks from event listeners or observers
- [ ] TypeScript inference works correctly in all modes
- [ ] No imports from 'watch-selector/generator' remain
- [ ] src/generator/ directory is deleted

## Conclusion

This unification creates a single, powerful API that:
- **Eliminates ALL redundancy** - Generator module completely removed
- **Supports all patterns** - Direct, selector, and generator modes
- **Preserves all fixes** - Includes all bug fixes from generator module
- **Simplifies the library** - One way to do things, multiple ways to use it
- **Maintains type safety** - Full TypeScript support in all modes

The key is applying the `dom-new.ts` pattern (smart overloads) to EVERYTHING, creating a consistent, predictable API that "just works" however you want to use it.