# Actual Difference: Generator Module vs Enhanced Context

## The Truth: They're Almost Identical

The difference is **purely organizational** - both approaches do the exact same thing under the hood.

## Technical Comparison

### Generator Module
```typescript
// Import standalone functions
import { text, addClass, click } from 'watch-selector/generator';

watch('button', async function* () {
  // Call functions directly with yield*
  yield* text('Hello');
  yield* addClass('active');
  yield* click(() => console.log('clicked'));
});
```

### Enhanced Context
```typescript
// Import just watch
import { watch } from 'watch-selector';

watch('button', async function* (ctx) {
  // Call methods on context with yield*
  yield* ctx.text('Hello');
  yield* ctx.addClass('active');
  yield* ctx.click(() => console.log('clicked'));  // if we add events
});
```

## What's Actually Happening

### Both Return the Same Thing
```typescript
// Generator module's text function
export function text(content: string): Workflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.textContent = content;
    });
  })();
}

// Enhanced context's text method
text: (content: string) => {
  return domNew.text(content);  // Returns the same Workflow<void>
}
```

Both return `Workflow<void>` - an async generator that yields operations.

### Both Use yield* the Same Way
```typescript
// Generator module
yield* text('Hello');  // Yields from Workflow<void>

// Enhanced context  
yield* ctx.text('Hello');  // Also yields from Workflow<void>
```

### Both Execute in the Same Context
When the generator runs, both approaches:
1. Yield an operation function
2. The watch system executes it with the current element
3. The operation modifies the DOM

## The ONLY Real Differences

### 1. Import Style
```typescript
// Generator module - import what you need
import { text, addClass } from 'watch-selector/generator';

// Enhanced context - everything via context
import { watch } from 'watch-selector';  // ctx has everything
```

### 2. Access Pattern
```typescript
// Generator module - standalone functions
yield* text('Hello');
yield* addClass('active');

// Enhanced context - methods on object
yield* ctx.text('Hello');
yield* ctx.addClass('active');
```

### 3. Discoverability
```typescript
// Generator module
// ❌ Need to know what to import
// ❌ No autocomplete until imported

// Enhanced context
// ✅ Type `ctx.` and see all available methods
// ✅ IDE shows everything available
```

### 4. Bundle Size (Theoretical)
```typescript
// Generator module
// ✅ Tree-shaking can remove unused functions
import { text } from 'watch-selector/generator';  // Only text in bundle

// Enhanced context
// ⚠️ Context object has all methods attached
// (Though in practice, the difference is negligible)
```

## Why Do We Have Both?

### Historical Reasons
1. Generator module came first as a clean API for `yield*` patterns
2. Enhanced context added later for better ergonomics
3. Never consolidated because both work fine

### Not Technical Reasons
- It's not about performance (identical)
- It's not about capabilities (identical) 
- It's not about type safety (both fully typed)

## The Bottom Line

**They do the exact same thing.** The choice is purely stylistic:

```typescript
// These are functionally identical:
yield* text('Hello');        // Generator module
yield* ctx.text('Hello');    // Enhanced context

// Both create the same Workflow<void>
// Both modify the DOM the same way
// Both have the same performance
```

## Current State

### What Enhanced Context Has
- ✅ All DOM manipulation (text, html, addClass, etc.)
- ✅ All traversal (parent, children, siblings, etc.)
- ✅ All state management (via imports, not on ctx yet)

### What Enhanced Context is Missing
- ❌ Event handlers (click, input, etc.)
- ❌ Lifecycle events (onMount, onUnmount)
- ❌ Observer events (onAttr, onText, etc.)

### What Generator Module Has
- ✅ Everything including events

## The Real Question

Should we maintain two ways to do the exact same thing?

**No technical reason to keep both.** It's purely about:
- Migration burden
- User preference  
- Documentation complexity

## Recommendation

Since they're functionally identical, we should:
1. Add missing events to enhanced context
2. Deprecate generator module
3. Have one clear way to do things

This reduces confusion without losing any functionality.