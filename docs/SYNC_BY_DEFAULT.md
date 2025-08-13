# Sync-By-Default Design Philosophy

## Overview

The `watch-selector` library uses **synchronous generators by default** for better performance and simpler code. Async operations are supported through an explicit wrapper when needed.

## Why Sync by Default?

### 1. **Most DOM Operations Are Synchronous**
```typescript
// These operations don't need async overhead:
yield* text('Hello');           // Setting text is sync
yield* addClass('active');      // Adding a class is sync
yield* setState('count', 5);    // Setting state is sync
yield* style({ color: 'red' }); // Setting styles is sync
```

### 2. **Better Performance**
- No promise creation/resolution overhead for each yield
- Simpler call stack
- Less memory usage
- Faster execution

### 3. **Cleaner Mental Model**
- Operations do what they say immediately
- No hidden async complexity
- Easier to reason about

## Using Async When Needed

When you need async operations (fetch, delays, etc.), use the `async` wrapper:

```typescript
import { watch } from 'watch-selector';
import { text, addClass } from 'watch-selector/generator';
import { async, delay } from 'watch-selector/async';

watch('.notification', function*() {  // Sync generator
  // Sync operations
  yield* text('Hello!');
  yield* addClass('visible');
  
  // Async operation wrapped
  yield* async(delay(3000));
  
  // Back to sync
  yield* removeClass('visible');
});
```

## Common Patterns

### Pattern 1: Simple DOM Manipulation (All Sync)
```typescript
watch('.button', function*() {
  yield* text('Click me');
  yield* addClass('interactive');
  
  yield* click(function*() {
    yield* toggleClass('active');
    yield* text('Clicked!');
  });
});
```

### Pattern 2: Data Fetching (Async Wrapped)
```typescript
watch('.user-card', function*() {
  // Show loading (sync)
  yield* text('Loading...');
  yield* addClass('loading');
  
  // Fetch data (async wrapped)
  const user = yield* async(async () => {
    const response = await fetch('/api/user');
    return response.json();
  });
  
  // Update UI (sync)
  yield* removeClass('loading');
  yield* text(user.name);
});
```

### Pattern 3: Animation Sequences
```typescript
watch('.animated', function*() {
  yield* addClass('fade-in');
  
  // Wait for animation
  yield* async(delay(300));
  
  yield* text('Animation complete');
  yield* removeClass('fade-in');
});
```

### Pattern 4: Parallel Async Operations
```typescript
watch('.dashboard', function*() {
  yield* text('Loading...');
  
  // Fetch multiple resources in parallel
  const [user, posts, stats] = yield* async(
    parallel([
      fetch('/api/user').then(r => r.json()),
      fetch('/api/posts').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ])
  );
  
  // Update UI with all data
  yield* text(`Welcome ${user.name}!`);
});
```

## Async Utilities

The library provides several async utilities that return sync workflows:

### `async(operation)`
Wraps any async operation for use in sync generators:
```typescript
const data = yield* async(someAsyncFunction());
```

### `delay(ms)`
Creates a delay:
```typescript
yield* delay(1000); // Wait 1 second
```

### `fetchData(url, options)`
Wrapper for fetch:
```typescript
const response = yield* fetchData('/api/data');
const json = yield* async(response.json());
```

### `parallel(operations)`
Run multiple async operations in parallel:
```typescript
const [a, b, c] = yield* parallel([
  fetchA(),
  fetchB(),
  fetchC()
]);
```

### `race(operations)`
Get the first result:
```typescript
const result = yield* race([
  fetch('/api/fast'),
  delay(5000).then(() => ({ timeout: true }))
]);
```

### `retry(operation, options)`
Retry with exponential backoff:
```typescript
const data = yield* retry(
  () => fetch('/api/flaky').then(r => r.json()),
  { maxAttempts: 3, delay: 1000 }
);
```

## When to Use Sync vs Async Generators

### Use Sync Generators (Default)
- DOM manipulation
- State management
- Event handling
- Class/style changes
- Most UI updates

### Wrap Async Operations
- Network requests (fetch, XMLHttpRequest)
- Timers (setTimeout, setInterval)
- File operations
- Animation delays
- Any Promise-based API

## Migration Guide

### From Async Generators
```typescript
// Before: Everything async
watch('.button', async function*() {
  yield* text('Click me');     // Unnecessary async
  yield* addClass('active');   // Unnecessary async
  await delay(1000);           // Actually async
  yield* text('Ready');        // Unnecessary async
});

// After: Sync with async wrapped
watch('.button', function*() {
  yield* text('Click me');     // Sync
  yield* addClass('active');   // Sync
  yield* async(delay(1000));   // Async wrapped
  yield* text('Ready');        // Sync
});
```

### From Mixed Patterns
```typescript
// Before: Confusing mix
watch('.loader', async function*() {
  yield text('Loading...');      // Old pattern
  yield* addClass('spinner');    // New pattern
  const data = await fetch(...); // Direct await
  yield setText(data.message);   // Mixed naming
});

// After: Consistent sync-first
watch('.loader', function*() {
  yield* text('Loading...');     // Consistent pattern
  yield* addClass('spinner');    // Consistent pattern
  
  const data = yield* async(     // Explicit async
    fetch(...).then(r => r.json())
  );
  
  yield* text(data.message);     // Consistent pattern
});
```

## Performance Comparison

### Sync Generator (Default)
```typescript
watch('.element', function*() {
  yield* text('1');
  yield* text('2');
  yield* text('3');
});
// ✅ No promise overhead
// ✅ Direct execution
// ✅ Minimal memory usage
```

### Async Generator (Old Way)
```typescript
watch('.element', async function*() {
  yield* text('1');  // Creates promise
  yield* text('2');  // Creates promise
  yield* text('3');  // Creates promise
});
// ❌ Promise for each yield
// ❌ Async machinery overhead
// ❌ More memory usage
```

## Best Practices

1. **Start with sync generators** - Only add async when needed
2. **Wrap async operations explicitly** - Makes async boundaries clear
3. **Group related async operations** - Reduce context switches
4. **Use parallel for independent operations** - Better performance
5. **Keep async sections small** - Most code should be sync

## FAQ

### Q: Why not make everything async for consistency?
A: Async has overhead. Most DOM operations are synchronous, so making them async adds unnecessary complexity and performance cost.

### Q: Can I still use async generators if I want?
A: Yes! The runtime supports both. This is just about defaults and best practices.

### Q: What about TypeScript types?
A: Everything is fully typed. The `async` wrapper preserves types perfectly.

### Q: Is this a breaking change?
A: No, existing async generators still work. This just changes the default for new code.

## Summary

- **Sync by default** = Better performance, simpler code
- **Async when needed** = Explicit, clear boundaries
- **Best of both worlds** = Performance + flexibility