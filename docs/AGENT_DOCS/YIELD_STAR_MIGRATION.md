# Yield* Migration Guide for Watch-Selector

## Overview

The watch-selector library is migrating from `yield` to `yield*` patterns for improved type safety and better developer experience. This guide explains the changes needed and how to migrate your code.

## Why Migrate to yield*?

### Type Safety
- `yield*` preserves return types through generator delegation
- Full TypeScript inference for returned values
- Better IDE support with accurate IntelliSense

### Cleaner API
- No need for `$` wrapper functions
- Direct use of library functions
- Standard JavaScript generator delegation

## Migration Patterns

### Basic DOM Manipulation

**Before (yield):**
```typescript
watch('button', function* () {
  yield text('Click me');
  yield addClass('interactive');
  yield style('color', 'blue');
});
```

**After (yield*):**
```typescript
watch('button', function* () {
  yield* text('Click me');
  yield* addClass('interactive');
  yield* style('color', 'blue');
});
```

### Event Handlers

**Before (yield):**
```typescript
watch('.counter', function* () {
  yield click(function* () {
    yield addClass('clicked');
    yield text('Clicked!');
  });
});
```

**After (yield*):**
```typescript
watch('.counter', function* () {
  yield* click(function* () {
    yield* addClass('clicked');
    yield* text('Clicked!');
  });
});
```

### Getting Values with Type Safety

**Before (yield) - No type inference:**
```typescript
watch('.input-field', function* () {
  const currentText = yield text(); // Type: any
  const hasActive = yield hasClass('active'); // Type: any
  const element = yield query('.child'); // Type: any
});
```

**After (yield*) - Full type inference:**
```typescript
watch('.input-field', function* () {
  const currentText = yield* text(); // Type: string
  const hasActive = yield* hasClass('active'); // Type: boolean
  const element = yield* query<HTMLButtonElement>('.child'); // Type: HTMLButtonElement | null
});
```

### State Management

**Before (yield):**
```typescript
watch('.stateful', function* () {
  yield setState('count', 0);
  const count = yield getState('count'); // Type: any
  yield updateState('count', c => c + 1);
});
```

**After (yield*):**
```typescript
watch('.stateful', function* () {
  yield* setState('count', 0);
  const count = yield* getState<number>('count', 0); // Type: number
  yield* updateState('count', (c: number) => c + 1);
});
```

### Complex Compositions

**Before (yield):**
```typescript
watch('.card', function* () {
  yield addClass('loading');
  
  yield click(function* () {
    const isExpanded = yield hasClass('expanded');
    if (isExpanded) {
      yield removeClass('expanded');
      yield hide('.details');
    } else {
      yield addClass('expanded');
      yield show('.details');
    }
  });
});
```

**After (yield*):**
```typescript
watch('.card', function* () {
  yield* addClass('loading');
  
  yield* click(function* () {
    const isExpanded = yield* hasClass('expanded');
    if (isExpanded) {
      yield* removeClass('expanded');
      yield* hide('.details');
    } else {
      yield* addClass('expanded');
      yield* show('.details');
    }
  });
});
```

## Removing $ Wrapper

The `$` wrapper is no longer needed with yield*:

**Before (with $ wrapper):**
```typescript
import { watch, $, text, addClass } from 'watch-selector';

watch('button', async function* () {
  yield* $(text('Click me'));
  yield* $(addClass('interactive'));
});
```

**After (direct yield*):**
```typescript
import { watch, text, addClass } from 'watch-selector';

watch('button', function* () {
  yield* text('Click me');
  yield* addClass('interactive');
});
```

## Enhanced Context Pattern

The enhanced context already uses yield* correctly:

```typescript
import { watch } from 'watch-selector';

watch('.component', function* (ctx) {
  // Context methods already return proper workflows
  yield* ctx.text('Hello');
  yield* ctx.addClass('ready');
  
  const parent = yield* ctx.parent();
  const hasActive = yield* ctx.hasClass('active');
  
  yield* ctx.click(function* () {
    yield* ctx.toggleClass('expanded');
  });
});
```

## Observer and Lifecycle Events

Once implemented, observer events will also use yield*:

```typescript
watch('.observed', function* () {
  // Mount/unmount lifecycle
  yield* onMount(function* () {
    yield* addClass('mounted');
  });
  
  yield* onUnmount(() => {
    console.log('Element removed');
  });
  
  // Attribute observer
  yield* onAttr('data-state', (oldVal, newVal) => {
    console.log(`State changed from ${oldVal} to ${newVal}`);
  });
  
  // Visibility observer
  yield* onVisible(() => {
    yield* addClass('in-view');
  });
});
```

## Quick Migration Steps

### 1. Find and Replace

For most cases, a simple find and replace will work:
- Find: `yield ([a-zA-Z])`
- Replace: `yield* $1`

### 2. Remove $ Wrappers

Find and remove $ wrapper usage:
- Find: `yield* $(` 
- Replace: `yield* `
- Don't forget to remove the closing `)`

### 3. Update Event Handlers

Ensure event handlers also use yield*:
```typescript
// Update nested generators too
yield* click(function* () {
  yield* addClass('clicked'); // Don't forget these!
});
```

### 4. Add Type Annotations

Take advantage of improved type safety:
```typescript
// Add type parameters where helpful
const button = yield* query<HTMLButtonElement>('.btn');
const count = yield* getState<number>('count', 0);
```

## Common Pitfalls

### 1. Forgetting Nested Yields

Don't forget to update yield inside event handlers:
```typescript
// ❌ Wrong - nested yield not updated
yield* click(function* () {
  yield addClass('clicked'); // Missing *
});

// ✅ Correct
yield* click(function* () {
  yield* addClass('clicked');
});
```

### 2. Mixing Patterns

Avoid mixing yield and yield* in the same generator:
```typescript
// ❌ Inconsistent
watch('button', function* () {
  yield* text('Click');
  yield addClass('ready'); // Inconsistent!
});

// ✅ Consistent
watch('button', function* () {
  yield* text('Click');
  yield* addClass('ready');
});
```

### 3. Async Generators

Regular generators (function*) are preferred over async generators:
```typescript
// ✅ Preferred - sync generator
watch('button', function* () {
  yield* text('Click me');
});

// ⚠️ Avoid unless needed for async operations
watch('button', async function* () {
  yield* text('Click me');
});
```

## Benefits After Migration

### 1. Type Inference Works
```typescript
const value = yield* text(); // TypeScript knows this is string
const element = yield* query('.child'); // TypeScript knows this is Element | null
```

### 2. Better IDE Support
- Autocomplete shows correct return types
- Hover information is accurate
- Refactoring tools work better

### 3. Cleaner Code
- No $ wrapper needed
- Consistent pattern throughout
- Standard JavaScript syntax

## Gradual Migration

Both patterns are currently supported during the transition period:

```typescript
// Both work during transition
watch('button', function* () {
  yield text('Old pattern'); // Still works but no type inference
  yield* addClass('new-pattern'); // Recommended with type safety
});
```

However, it's recommended to migrate fully to yield* for consistency and type safety.

## Tools and Scripts

### VSCode Find & Replace

Use these regex patterns in VSCode:
1. Open Find & Replace (Ctrl+Shift+H)
2. Enable regex mode (Alt+R)
3. Find: `yield ([a-zA-Z_$][\w$]*\()`
4. Replace: `yield* $1`

### Automated Migration

For large codebases, consider using a codemod or AST-based tool to ensure consistent migration.

## FAQ

### Q: Do I have to migrate immediately?
A: No, both patterns work during the transition period, but yield* is recommended for new code.

### Q: What about the generator module?
A: The separate `/generator` module has been removed. All functions now work with yield* from the main export.

### Q: Will yield pattern be removed?
A: Eventually yes, but with deprecation warnings first to give time for migration.

### Q: Does this affect performance?
A: No performance impact. The yield* pattern is standard JavaScript and may even be slightly more efficient.

## Conclusion

Migrating to yield* provides better type safety, cleaner code, and improved developer experience. The migration is straightforward - primarily adding `*` after `yield` keywords. Take advantage of this migration to also add type annotations where helpful for even better type safety.