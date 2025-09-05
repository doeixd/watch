# Sync Generators in watch-selector

## Overview

The watch-selector library has been updated to use **sync generators** with the `yield*` pattern by default, replacing the previous async generator approach. This change provides better type safety, cleaner syntax, and more predictable behavior.

## Key Changes

### 1. Sync Generators by Default

All generator functions now use sync generators (`function*`) instead of async generators (`async function*`):

```typescript
// ✅ NEW: Sync generator with yield*
watch('button', function* () {
  yield* text('Click me');
  yield* addClass('interactive');
  
  yield* click(function* () {
    const count = yield* getState<number>('clicks', 0);
    yield* setState('clicks', count + 1);
    yield* text(`Clicked ${count + 1} times`);
  });
});

// ❌ OLD: Async generator (no longer used)
watch('button', async function* () {
  yield text('Click me'); // Used to yield ElementFn
});
```

### 2. Yield* Pattern for Type Safety

The new approach uses `yield*` with Workflow generators for perfect type inference:

```typescript
// Each function returns a Workflow<T> generator
const content = yield* text();        // Returns string
const hasActive = yield* hasClass('active'); // Returns boolean
const count = yield* getState<number>('count', 0); // Returns number
```

### 3. Branded Types for Selectors

To improve type safety and distinguish between CSS selectors and class names, the library now includes branded types:

```typescript
import { selector, className, elementId } from 'watch-selector';

// Create branded types
const buttonSel = selector('button.primary');
const activeClass = className('active');
const headerId = elementId('main-header');

// Use with DOM functions - TypeScript knows these are the right types
text(buttonSel, 'Click me');
addClass(buttonSel, activeClass);
```

### 4. Enhanced Selector Detection

The library uses improved heuristics to automatically detect whether a string is a CSS selector or a class name:

```typescript
// Automatically detected as selectors
addClass('#button', 'active');      // ID selector
addClass('.card', 'highlighted');   // Class selector
addClass('div > span', 'nested');   // Complex selector
addClass('button', 'primary');      // Tag name

// Automatically detected as class names
addClass(element, 'btn-primary');   // Not a selector pattern
addClass(element, 'user-active');   // Plain class name
```

## API Patterns

The library supports multiple usage patterns, all using sync generators:

### Pattern 1: Direct Element Manipulation
```typescript
const button = document.querySelector('button');
text(button, 'Click me');
addClass(button, 'active');
```

### Pattern 2: CSS Selector Manipulation
```typescript
text('button', 'Click me');
addClass('.cards', 'visible');
```

### Pattern 3: Generator with yield*
```typescript
watch('button', function* () {
  yield* text('Click me');
  yield* addClass('active');
});
```

## Event Handling

Event handlers now support sync generators with proper context execution:

```typescript
watch('button', function* () {
  yield* click(function* (event) {
    // Sync generator event handler
    yield* addClass('clicked');
    yield* text('Clicked!');
    
    // Can yield other operations
    const count = yield* getState<number>('count', 0);
    yield* setState('count', count + 1);
  });
  
  // Event options still supported
  yield* input(function* (e) {
    const value = (e.target as HTMLInputElement).value;
    yield* text(`.output`, value);
  }, { debounce: 500 });
});
```

## State Management

State operations use sync workflows:

```typescript
watch('.counter', function* () {
  // Initialize state
  yield* setState('count', 0);
  
  // Get state with type safety
  const count = yield* getState<number>('count', 0);
  
  // Update state with function
  yield* updateState<number>('count', c => (c || 0) + 1);
  
  // Watch state changes
  yield* watchState<number>('count', function* (newCount, oldCount) {
    yield* text(`Count changed from ${oldCount} to ${newCount}`);
  });
  
  // Persist to localStorage
  yield* persistState('count', 'counter-storage-key');
  
  // Restore from localStorage
  const restored = yield* restoreState<number>('count', 'counter-storage-key', 0);
});
```

## Lifecycle Events

Lifecycle events work with sync generators:

```typescript
watch('.component', function* () {
  // On mount
  yield* onMount(function* () {
    yield* addClass('mounted');
    console.log('Component mounted');
  });
  
  // On unmount - returns cleanup function
  const cleanup = yield* onUnmount(function* () {
    console.log('Component unmounting');
  });
  
  // Visibility observer
  yield* onVisible(function* () {
    yield* addClass('in-viewport');
  }, { threshold: 0.5 });
  
  // Resize observer
  yield* onResize(function* (event) {
    const { width, height } = event.detail.contentRect;
    yield* text(`.size`, `${width}x${height}`);
  }, { debounce: 100 });
});
```

## Migration Guide

### Converting from Async to Sync Generators

1. **Remove async keyword**: Change `async function*` to `function*`
2. **Use yield* instead of yield**: Change `yield text()` to `yield* text()`
3. **Update event handlers**: Ensure handlers use sync generators

```typescript
// Before (async)
watch('button', async function* () {
  yield text('Click me');
  yield click(async function* () {
    yield addClass('clicked');
  });
});

// After (sync)
watch('button', function* () {
  yield* text('Click me');
  yield* click(function* () {
    yield* addClass('clicked');
  });
});
```

### Type Safety Improvements

The sync generator approach provides better type inference:

```typescript
watch('.form', function* () {
  // Type is correctly inferred as string
  const currentValue = yield* value('#input');
  
  // Type is correctly inferred as boolean
  const isChecked = yield* checked('#checkbox');
  
  // Type is correctly inferred as T
  const data = yield* getState<MyDataType>('data');
});
```

## Performance Benefits

1. **No async overhead**: Sync generators are faster than async generators
2. **Immediate execution**: No promise scheduling delays
3. **Smaller bundle size**: No async/await transpilation needed
4. **Better debugging**: Simpler call stacks without promise chains

## Browser Compatibility

Sync generators are supported in all modern browsers:
- Chrome 39+
- Firefox 26+
- Safari 10+
- Edge 13+

For older browsers, use a transpiler like Babel or TypeScript.

## Best Practices

1. **Always use yield* with library functions** for proper type inference
2. **Use branded types** when you need explicit selector/class distinction
3. **Prefer sync generators** over async for better performance
4. **Initialize state early** in your watch functions
5. **Clean up resources** using onUnmount when needed

## Examples

### Complete Counter Example
```typescript
import { watch, text, addClass, click, setState, getState } from 'watch-selector';

watch('button.counter', function* () {
  // Initialize
  yield* setState('count', 0);
  yield* text('Count: 0');
  
  // Handle clicks
  yield* click(function* () {
    // Update state
    const count = yield* getState<number>('count', 0);
    const newCount = count + 1;
    yield* setState('count', newCount);
    
    // Update UI
    yield* text(`Count: ${newCount}`);
    
    // Add animation class
    yield* addClass('pulse');
    setTimeout(() => {
      removeClass('button.counter', 'pulse');
    }, 200);
  });
});
```

### Form Validation Example
```typescript
watch('form.signup', function* () {
  // Email validation
  yield* input('#email', function* (event) {
    const email = (event.target as HTMLInputElement).value;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    if (isValid) {
      yield* removeClass('#email', 'error');
      yield* addClass('#email', 'valid');
    } else {
      yield* removeClass('#email', 'valid');
      yield* addClass('#email', 'error');
    }
  }, { debounce: 300 });
  
  // Form submission
  yield* submit(function* (event) {
    event.preventDefault();
    
    yield* addClass('loading');
    yield* attr('aria-busy', 'true');
    
    // Simulate API call
    setTimeout(() => {
      removeClass('form.signup', 'loading');
      attr('form.signup', 'aria-busy', 'false');
    }, 1000);
  });
});
```

## Troubleshooting

### Common Issues

1. **Type errors with yield**: Make sure to use `yield*` not `yield`
2. **Event handlers not working**: Ensure they're sync generators (`function*`)
3. **State not persisting**: Check localStorage permissions and key names
4. **Selectors not matching**: Use branded types or check selector syntax

### Debug Tips

```typescript
// Enable debug logging
watch('.debug', function* () {
  const state = yield* getStateObject();
  console.log('Current state:', state);
  
  yield* click(function* () {
    console.log('Click handler executed');
  });
});
```

## Summary

The move to sync generators with `yield*` makes watch-selector more powerful, type-safe, and performant. The API remains familiar while providing better developer experience through improved type inference and cleaner syntax.