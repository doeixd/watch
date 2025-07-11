[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Deno](https://img.shields.io/badge/Deno-Compatible-green.svg)](https://deno.land/)
[![JSR](https://img.shields.io/badge/JSR-Published-orange.svg)](https://jsr.io/)

# Watch 🕶️

**A type-safe, performant DOM observation library with dual APIs and generator composition.**
Watch is a bare-bones web component alternative. It runs a function, and adds event listeners to elements that match a given selector. That's basically it. 

Since each match of a given selector is given it's own state, it enables light-weight components for small bits of interactivity. A common use-case in server-driven websites, user-scripts, or Chrome Extensions, basically anywhere where you don't control the markup think Astro, e-commerce templates, blogs, htmx sites, etc...

## Quick Start

```typescript
import { watch, text, addClass, click } from '@doeixd/watch';

// Watch buttons and make them interactive
watch('button', function* () {
  yield addClass('interactive');
  yield click((e, el) => {
    text(el, 'Clicked!');
  });
});
```

## Why Watch?

### 🎯 **Type-Safe by Design**
Automatic element type inference from selectors:
```typescript
watch('input[type="email"]', function* () {
  // TypeScript knows this is HTMLInputElement
  const email = self(); // HTMLInputElement
  yield on('blur', (e, el) => {
    if (!el.value.includes('@')) { // ✅ .value is typed
      yield addClass('error');
    }
  });
});
```

### 🔄 **Dual API Pattern** 
Every function works both directly and in generators:
```typescript
// Direct usage
text(element, 'Hello');
addClass(element, 'active');

// Generator usage  
watch('.button', function* () {
  yield text('Hello');
  yield addClass('active');
});

// Even with selectors
text('.button', 'Hello');  // Works on first match
addClass('.buttons', 'active'); // Works on first match
```

### ⚡ **High Performance**
- **Single global observer** for the entire application
- **Efficient batch processing** of DOM changes
- **Minimal memory footprint** with WeakMap storage
- **Automatic cleanup** prevents memory leaks

### 🧩 **Composable & Extensible**
```typescript
// Create reusable contexts
const saveButton = withDebounce(
  withData(
    button('.save'),
    { saved: false }
  ),
  300
);

// Apply execution helpers
watch('.expensive-operation', function* () {
  yield safely(expensiveFunction);
  yield throttle(1000, updateUI);
  yield once(initializeComponent);
});
```

## Core Concepts

### **Watchers**
Observe DOM elements and run generators when they appear:
```typescript
watch('selector', function* () {
  // Generator runs for each matching element
  yield elementFunction;
});
```

### **Generators**
Composable functions that describe element behavior:
```typescript
function* makeInteractive() {
  yield addClass('interactive');
  yield click(handleClick);
  yield onVisible(trackView);
}

watch('.component', makeInteractive);
```

### **Context Functions**
Access current element and state within generators:
```typescript
watch('.counter', function* () {
  const counter = createState('count', 0);
  
  yield click((e, el) => {
    counter.update(c => c + 1);
    text(self(), `Count: ${counter.get()}`);
  });
});
```

### **State Management**
Type-safe, element-scoped state:
```typescript
const counter = createState('count', 0);
const doubled = createComputed(() => counter.get() * 2, ['count']);

// Reactive updates
watchState('count', (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`);
});
```

## Complete API Reference

### Core Functions

| Function | Type | Description |
|----------|------|-------------|
| `watch` | `(target, generator) => CleanupFunction` | Watch for elements and run generators |
| `run` | `(selector, generator) => void` | Run generator on existing elements |
| `runOn` | `(element, generator) => void` | Run generator on specific element |

### DOM Manipulation

| Function | Type | Description |
|----------|------|-------------|
| `text` | `(el?, content?) => void \| string \| ElementFn` | Get/set text content |
| `html` | `(el?, content?) => void \| string \| ElementFn` | Get/set inner HTML |
| `addClass` | `(el?, ...classes) => void \| ElementFn` | Add CSS classes |
| `removeClass` | `(el?, ...classes) => void \| ElementFn` | Remove CSS classes |
| `toggleClass` | `(el?, class, force?) => boolean \| ElementFn` | Toggle CSS class |
| `hasClass` | `(el?, class) => boolean \| ElementFn` | Check if has CSS class |
| `style` | `(el?, prop\|styles, val?) => void \| ElementFn` | Get/set styles |
| `attr` | `(el?, name, val?) => void \| string \| ElementFn` | Get/set attributes |
| `removeAttr` | `(el?, name) => void \| ElementFn` | Remove attribute |
| `hasAttr` | `(el?, name) => boolean \| ElementFn` | Check if has attribute |
| `prop` | `(el?, prop, val?) => void \| any \| ElementFn` | Get/set properties |
| `data` | `(el?, key, val?) => void \| string \| ElementFn` | Get/set data attributes |
| `value` | `(el?, val?) => void \| string \| ElementFn` | Get/set form values |
| `checked` | `(el?, checked?) => void \| boolean \| ElementFn` | Get/set checkbox state |
| `focus` | `(el?) => void \| ElementFn` | Focus element |
| `blur` | `(el?) => void \| ElementFn` | Blur element |
| `show` | `(el?) => void \| ElementFn` | Show element |
| `hide` | `(el?) => void \| ElementFn` | Hide element |

### DOM Traversal

| Function | Type | Description |
|----------|------|-------------|
| `query` / `el` | `(el?, selector) => Element \| ElementFn` | Query single element |
| `queryAll` / `all` | `(el?, selector) => Element[] \| ElementFn` | Query all elements |
| `parent` | `(selector?) => ElementFn` | Get parent element |
| `children` | `() => ElementFn` | Get child elements |
| `siblings` | `(selector?) => ElementFn` | Get sibling elements |

### Event Handling

| Function | Type | Description |
|----------|------|-------------|
| `on` | `(el?, event, handler, options?) => CleanupFn \| ElementFn` | Add event listener |
| `emit` | `(el?, event, detail?, options?) => void \| ElementFn` | Dispatch custom event |
| `click` | `(el?, handler, options?) => CleanupFn \| ElementFn` | Click event shortcut |
| `change` | `(el?, handler, options?) => CleanupFn \| ElementFn` | Change event shortcut |
| `input` | `(el?, handler, options?) => CleanupFn \| ElementFn` | Input event shortcut |
| `submit` | `(el?, handler, options?) => CleanupFn \| ElementFn` | Submit event shortcut |

### Observer Events

| Function | Type | Description |
|----------|------|-------------|
| `onAttr` | `(el?, filter, handler) => CleanupFn \| ElementFn` | Watch attribute changes |
| `onText` | `(el?, handler) => CleanupFn \| ElementFn` | Watch text changes |
| `onVisible` | `(el?, handler, options?) => CleanupFn \| ElementFn` | Watch visibility changes |
| `onResize` | `(el?, handler) => CleanupFn \| ElementFn` | Watch resize changes |
| `onMount` | `(el?, handler) => CleanupFn \| ElementFn` | Element mount event |
| `onUnmount` | `(el?, handler) => CleanupFn \| ElementFn` | Element unmount event |

### Context Functions (Generator Only)

| Function | Type | Description |
|----------|------|-------------|
| `self` | `() => Element` | Get current element |
| `el` | `(selector) => Element \| null` | Query within current element |
| `all` | `(selector) => Element[]` | Query all within current element |
| `cleanup` | `(fn) => void` | Register cleanup function |
| `ctx` | `() => WatchContext` | Get full context object |

### State Management

| Function | Type | Description |
|----------|------|-------------|
| `createState` | `(key, initial) => TypedState` | Create element-scoped state |
| `createComputed` | `(fn, deps) => () => T` | Create computed value |
| `getState` | `(key) => T` | Get state value |
| `setState` | `(key, val) => void` | Set state value |
| `updateState` | `(key, fn) => void` | Update state value |
| `watchState` | `(key, handler) => CleanupFn` | Watch state changes |
| `createPersistedState` | `(key, initial, storageKey?) => TypedState` | Create localStorage-backed state |

### Execution Helpers

| Function | Type | Description |
|----------|------|-------------|
| `once` | `(fn) => ElementFn` | Execute only once per element |
| `delay` | `(ms, fn) => ElementFn` | Delay execution |
| `throttle` | `(ms, fn) => ElementFn` | Throttle execution |
| `debounce` | `(ms, fn) => ElementFn` | Debounce execution |
| `when` | `(condition, then, else?) => ElementFn` | Conditional execution |
| `safely` | `(fn, fallback?, onError?) => ElementFn` | Safe execution with error handling |
| `batch` | `(...fns) => ElementFn` | Batch multiple operations |
| `retry` | `(fn, attempts?, backoff?) => ElementFn` | Retry with exponential backoff |
| `memoize` | `(fn, keyFn?) => ElementFn` | Memoize function results |

### Context Factories

| Function | Type | Description |
|----------|------|-------------|
| `context` | `(selector, options?) => PreDefinedWatchContext` | Create watch context |
| `button` | `(selector, options?) => PreDefinedWatchContext` | Button context |
| `input` | `(selector, options?) => PreDefinedWatchContext` | Input context |
| `form` | `(selector, options?) => PreDefinedWatchContext` | Form context |
| `div` | `(selector, options?) => PreDefinedWatchContext` | Div context |
| `span` | `(selector, options?) => PreDefinedWatchContext` | Span context |

### Context Combinators

| Function | Type | Description |
|----------|------|-------------|
| `withData` | `(ctx, data) => PreDefinedWatchContext` | Add custom data |
| `withDebounce` | `(ctx, ms) => PreDefinedWatchContext` | Add debouncing |
| `withThrottle` | `(ctx, ms) => PreDefinedWatchContext` | Add throttling |
| `once` | `(ctx) => PreDefinedWatchContext` | Execute only once |
| `withFilter` | `(ctx, filterFn) => PreDefinedWatchContext` | Add element filter |

### Generator Utilities

| Function | Type | Description |
|----------|------|-------------|
| `createGenerator` | `(fn) => GeneratorFn` | Create typed generator |
| `gen` | `(fn) => GeneratorFn` | Generator alias |
| `watchGenerator` | `(selector, fn) => GeneratorFn` | Create selector-specific generator |

### Utilities

| Function | Type | Description |
|----------|------|-------------|
| `isElement` | `(value) => boolean` | Check if value is HTMLElement |
| `isElementLike` | `(value) => boolean` | Check if value is element or selector |
| `resolveElement` | `(elementLike) => Element \| null` | Resolve element from selector |
| `batchAll` | `(elements, ...fns) => void` | Apply functions to multiple elements |

## Examples

### Interactive Components
```typescript
// Make all buttons interactive
watch('button', function* () {
  yield addClass('interactive');
  yield style('cursor', 'pointer');
  
  yield click((e, el) => {
    addClass(el, 'clicked');
    setTimeout(() => removeClass(el, 'clicked'), 200);
  });
});
```

### Form Validation
```typescript
watch('input[type="email"]', function* () {
  const isValid = createState('valid', true);
  
  yield on('blur', (e, el) => {
    const valid = el.value.includes('@');
    isValid.set(valid);
    
    if (valid) {
      removeClass(el, 'error');
    } else {
      addClass(el, 'error');
    }
  });
});
```

### Advanced Context Usage
```typescript
const searchInput = withDebounce(
  withData(
    input('.search'),
    { searchHistory: [] }
  ),
  300
);

watch(searchInput, function* () {
  const history = createState('history', []);
  
  yield on('input', (e, el) => {
    const query = el.value;
    if (query.length > 2) {
      history.update(h => [...h, query].slice(-10));
      // Perform search...
    }
  });
});
```

### State Management
```typescript
watch('.counter', function* () {
  const count = createState('count', 0);
  const doubled = createComputed(() => count.get() * 2, ['count']);
  
  // Update display when count changes
  watchState('count', (newCount) => {
    text(self(), `Count: ${newCount} (×2: ${doubled()})`);
  });
  
  yield click((e, el) => {
    count.update(c => c + 1);
  });
});
```

## Installation

```bash
npm install watch-selector
```

## Browser Support

Watch v5 supports all modern browsers with:
- MutationObserver
- IntersectionObserver  
- ResizeObserver
- Proxy
- WeakMap/WeakSet

## Performance

- **Minimal runtime overhead**: Single global observer
- **Efficient batching**: DOM changes processed in batches
- **Memory safe**: Automatic cleanup with WeakMaps
- **Type-safe**: No runtime type checking needed

## Gotchas & Performance Considerations

### Performance Bottlenecks

Because `watch` uses a global MutationObserver to detect DOM changes, it needs to check every added element against all active selectors. This can cause performance issues when:

1. **Adding many elements at once** - Each new element is tested against all watchers
2. **Using broad selectors** - Generic selectors like `div` or `*` match more frequently
3. **Deep DOM mutations** - Adding elements with many children triggers multiple checks

### Optimization Strategies

#### 1. Use Event Delegation for Dynamic Content

Instead of watching individual elements, use event delegation when adding lots of similar elements:

```typescript
// ❌ Slow: Each button gets its own watcher
watch('button', function* () {
  yield click(() => console.log('Clicked!'));
});

// ✅ Fast: Single delegation handler
watch(document.body, 'button', function* () {
  yield click(() => console.log('Clicked!'));
});
```

#### 2. Scope Watchers to Specific Parents

Limit the observation scope by using more specific selectors or the event delegation API:

```typescript
// ❌ Slow: Observes entire document
watch('todo-item', function* () {
  yield click(() => {
    // This will cause lag when adding many elements elsewhere
    document.querySelector('.lag-container').innerHTML += 
      '<button>Lag</button>'.repeat(100000);
  });
});

// ✅ Fast: Scoped to specific parent
watch(document.querySelector('.todo-list'), 'todo-item', function* () {
  yield click(() => {
    // Only checks elements within .todo-list
    document.querySelector('.lag-container').innerHTML += 
      '<button>Lag</button>'.repeat(100000);
  });
});
```

#### 3. Use Specific Selectors

More specific selectors reduce the number of false matches:

```typescript
// ❌ Slow: Matches many elements
watch('div', function* () {
  yield addClass('processed');
});

// ✅ Fast: Specific selector
watch('.specific-component', function* () {
  yield addClass('processed');
});
```

#### 4. Batch DOM Operations

When adding many elements, batch them in a single operation:

```typescript
// ❌ Slow: Individual additions trigger observer repeatedly
for (let i = 0; i < 1000; i++) {
  container.appendChild(createButton());
}

// ✅ Fast: Single batch operation
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  fragment.appendChild(createButton());
}
container.appendChild(fragment);
```

### Troubleshooting Performance Issues

1. **Profile using DevTools**: Use Performance tab to identify bottlenecks
2. **Check selector specificity**: Ensure selectors are as specific as possible
3. **Monitor mutation frequency**: High mutation rates may indicate over-watching
4. **Consider `run()` for static content**: Use `run()` instead of `watch()` for elements that won't change

## License

MIT License - see [LICENSE](../LICENSE) file.
