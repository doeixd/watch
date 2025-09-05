# Direct yield* Pattern - New Generator API

This document describes the new direct `yield*` pattern implemented for the watch-selector library, which eliminates the need for wrapper functions and provides a cleaner, more intuitive API.

## Overview

The new pattern allows you to use generator functions directly with `yield*` syntax, without needing wrapper functions like the previous `$` helper. This provides:

- **Cleaner syntax** - No wrapper functions needed
- **Perfect type safety** - TypeScript infers return types through `yield*` delegation
- **Better performance** - Direct execution without intermediate wrappers
- **Intuitive API** - Natural async/await-like flow

## Pattern Comparison

### Old Pattern (with $ helper)
```typescript
import { watch, $ } from 'watch-selector';
import { addClass, getState, setText } from 'watch-selector/generator';

watch('.button', async function*() {
  // Required $ wrapper for type safety
  yield* $(addClass('interactive'));
  const count = yield* $(getState<number>('clicks', 0));
  yield* $(setState('clicks', count + 1));
  yield* $(setText(`Clicked ${count + 1} times`));
});
```

### New Pattern (direct yield*)
```typescript
import { watch } from 'watch-selector';
import { addClass, getState, setState, text } from 'watch-selector/generator';

watch('.button', async function*() {
  // Direct yield* - no wrapper needed!
  yield* addClass('interactive');
  const count = yield* getState<number>('clicks', 0);
  yield* setState('clicks', count + 1);
  yield* text(`Clicked ${count + 1} times`);
});
```

## Implementation Details

### Core Types

```typescript
// Workflow is an async generator that yields operations and returns typed results
type Workflow<TReturn = void, El extends HTMLElement = HTMLElement> = 
  AsyncGenerator<Operation<any, any>, TReturn, any>;

// Operations are functions that take context and return results
type Operation<TReturn, El extends HTMLElement = HTMLElement> = 
  (context: WatchContext<El>) => TReturn | Promise<TReturn>;
```

### Function Structure

All generator functions follow this pattern:

```typescript
export function functionName(...args): Workflow<ReturnType> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Perform operation with context
      // Return the result
      return operationResult;
    };
    return result;
  })();
}
```

### Example Implementation

```typescript
// DOM operation example
export function addClass(className: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.classList.add(className);
      return undefined;
    };
    return result;
  })();
}

// State operation example with return value
export function getState<T = any>(key: string, defaultValue?: T): Workflow<T> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const state = (context as any).state || new Map();
      return state.has(key) ? state.get(key) : defaultValue;
    };
    return result;
  })();
}
```

## Usage Examples

### Basic DOM Manipulation

```typescript
import { watch } from 'watch-selector';
import { addClass, removeClass, text, self } from 'watch-selector/generator';

watch('.interactive-button', async function*() {
  // Get the element with perfect typing
  const button = yield* self<HTMLButtonElement>();
  
  // Manipulate DOM directly
  yield* addClass('ready');
  yield* text('Click me!');
  
  // Conditional logic
  if (button.disabled) {
    yield* addClass('disabled');
  }
});
```

### State Management

```typescript
import { watch } from 'watch-selector';
import { getState, setState, incrementState, updateState } from 'watch-selector/generator';

watch('.counter', async function*() {
  // Initialize state
  yield* setState('count', 0);
  
  // Get current state
  const currentCount = yield* getState<number>('count', 0);
  
  // Increment state and get new value
  const newCount = yield* incrementState('count', 1);
  
  // Functional state updates
  const doubledCount = yield* updateState<number>(
    'doubled',
    (prev) => (prev || 0) * 2
  );
});
```

### Event Handling

```typescript
import { watch } from 'watch-selector';
import { click, addClass, removeClass, delay } from 'watch-selector/generator';

watch('.ripple-button', async function*() {
  // Set up event handler that can also use generators
  yield* click(async function*(event) {
    // Add ripple effect
    yield* addClass('ripple');
    yield* delay(300);
    yield* removeClass('ripple');
  });
});
```

### Complex Composition

```typescript
import { watch } from 'watch-selector';
import { 
  self, addClass, removeClass, text, 
  getState, setState, incrementState,
  click, onMount 
} from 'watch-selector/generator';

watch('.todo-item', async function*() {
  // Setup on mount
  yield* onMount(() => {
    console.log('Todo item mounted');
  });
  
  // Initialize state
  yield* setState('completed', false);
  
  // Handle click to toggle completion
  yield* click(async function*(event) {
    const isCompleted = yield* getState<boolean>('completed', false);
    
    if (isCompleted) {
      yield* setState('completed', false);
      yield* removeClass('completed');
      yield* text('Mark as done');
    } else {
      yield* setState('completed', true);
      yield* addClass('completed');
      yield* text('Completed!');
      
      // Increment global counter
      yield* incrementState('totalCompleted', 1);
    }
  });
});
```

### Error Handling

```typescript
watch('.safe-component', async function*() {
  try {
    // Operations that might fail
    yield* addClass('processing');
    const data = yield* getState<any>('userData');
    
    if (!data) {
      throw new Error('No user data');
    }
    
    yield* text(`Hello, ${data.name}!`);
    yield* addClass('success');
    
  } catch (error) {
    yield* addClass('error');
    yield* text('Something went wrong');
    console.error('Component error:', error);
  } finally {
    yield* removeClass('processing');
  }
});
```

## Available Functions

### DOM Manipulation

```typescript
// Text content
yield* text(content: string): void
yield* getText(): string
yield* appendText(content: string): void
yield* prependText(content: string): void

// HTML content
yield* html(content: string): void
yield* getHtml(): string
yield* appendHtml(content: string): void
yield* prependHtml(content: string): void

// Class manipulation
yield* addClass(className: string): void
yield* removeClass(className: string): void
yield* toggleClass(className: string, force?: boolean): boolean
yield* hasClass(className: string): boolean
yield* setClasses(classes: string | string[]): void

// Attributes
yield* attr(name: string, value: string): void
yield* attr(attributes: Record<string, string>): void
yield* getAttr(name: string): string | null
yield* removeAttr(name: string): void
yield* hasAttr(name: string): boolean

// Styles
yield* style(property: string, value: string): void
yield* style(styles: Record<string, string>): void
yield* getStyle(property: string): string
yield* removeStyle(property: string): void

// Element access
yield* self<El extends HTMLElement>(): El
yield* query<T extends HTMLElement>(selector: string): T | null
yield* queryAll<T extends HTMLElement>(selector: string): T[]
yield* parent<T extends HTMLElement>(): T | null
yield* children<T extends HTMLElement>(): T[]
yield* siblings<T extends HTMLElement>(): T[]
```

### State Management

```typescript
// Basic state operations
yield* getState<T>(key: string, defaultValue?: T): T
yield* setState<T>(key: string, value: T): void
yield* updateState<T>(key: string, updater: (current: T | undefined) => T): T
yield* hasState(key: string): boolean
yield* deleteState(key: string): boolean

// Advanced state operations
yield* initState<T>(key: string, defaultValue: T): T
yield* incrementState(key: string, amount?: number): number
yield* decrementState(key: string, amount?: number): number
yield* toggleState(key: string): boolean
yield* appendToState<T>(key: string, value: T): T[]
yield* prependToState<T>(key: string, value: T): T[]
yield* removeFromState<T>(key: string, value: T): T[]
yield* mergeState<T extends Record<string, any>>(key: string, updates: Partial<T>): T
```

### Event Handling

```typescript
// Basic events
yield* click(handler: (event: MouseEvent) => void | Promise<void>): void
yield* input(handler: (event: Event) => void | Promise<void>): void
yield* change(handler: (event: Event) => void | Promise<void>): void
yield* submit(handler: (event: SubmitEvent) => void | Promise<void>): void

// Focus events
yield* onFocus(handler: (event: FocusEvent) => void | Promise<void>): void
yield* onBlur(handler: (event: FocusEvent) => void | Promise<void>): void

// Keyboard events
yield* keydown(handler: (event: KeyboardEvent) => void | Promise<void>): void
yield* keyup(handler: (event: KeyboardEvent) => void | Promise<void>): void

// Mouse events
yield* mouseenter(handler: (event: MouseEvent) => void | Promise<void>): void
yield* mouseleave(handler: (event: MouseEvent) => void | Promise<void>): void

// Generic events
yield* on(eventType: string, handler: (event: Event) => void | Promise<void>): void
yield* onCustom<T>(eventType: string, handler: (event: CustomEvent<T>) => void | Promise<void>): void

// Observer events
yield* onAttr(attributeName?: string, handler: (mutation: MutationRecord) => void): void
yield* onText(handler: (mutation: MutationRecord) => void): void
yield* onVisible(handler: (isVisible: boolean, entry: IntersectionObserverEntry) => void): void
yield* onResize(handler: (entry: ResizeObserverEntry) => void): void

// Lifecycle events
yield* onMount(handler: () => void | Promise<void>): void
yield* onUnmount(handler: () => void | Promise<void>): void
```

### Utilities

```typescript
// Timing
yield* delay(ms: number): void

// Logging
yield* log(message: string): void

// Custom operations
yield* run<T>(fn: (context: WatchContext) => T | Promise<T>): T
```

## Type Safety

The new pattern maintains perfect type safety through TypeScript's `yield*` delegation:

```typescript
// Return types are automatically inferred
const element = yield* self<HTMLButtonElement>(); // HTMLButtonElement
const text = yield* getText(); // string
const hasClass = yield* hasClass('active'); // boolean
const count = yield* getState<number>('count', 0); // number
const newCount = yield* incrementState('count', 1); // number
```

## Migration Guide

### From $ Helper Pattern

**Before:**
```typescript
const result = yield* $(operation(...args));
```

**After:**
```typescript
const result = yield* operation(...args);
```

### From Classic Generator Pattern

**Before:**
```typescript
watch('.element', function*() {
  yield addClass('class');
  yield setText('text');
});
```

**After:**
```typescript
watch('.element', async function*() {
  yield* addClass('class');
  yield* text('text');
});
```

## Runtime Integration

The runtime system processes these workflows by:

1. Iterating through the async generator
2. Executing yielded operation functions with the current context
3. Sending results back to the generator via `.next(result)`
4. Continuing until the generator completes
5. Returning the final typed result

## Benefits

1. **Cleaner Syntax** - No wrapper functions needed
2. **Perfect Type Safety** - Full TypeScript inference maintained
3. **Better Performance** - Direct execution without wrappers
4. **Intuitive Flow** - Natural async/await-like experience
5. **Composability** - Easy to compose workflows
6. **Error Handling** - Standard try/catch works naturally
7. **Debugging** - Stack traces are cleaner and more readable

## Next Steps

1. **Runtime Integration** - Update the watch function to handle Workflow<T> patterns
2. **Event Handler Support** - Enable event handlers to use generator patterns
3. **Testing** - Complete test suite for the new pattern
4. **Documentation** - Update all examples and guides
5. **Migration Tools** - Provide codemods for easy migration from old patterns

The new direct `yield*` pattern represents a significant improvement in the developer experience while maintaining all the power and type safety of the watch-selector library.