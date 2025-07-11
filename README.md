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

## Design Philosophy: Why These Choices Matter

Understanding Watch's design decisions helps you build better, more maintainable applications. Every choice was made to solve real problems developers face when building interactive UIs.

### Why Generators? The Context Revolution

**The Problem**: Traditional event handlers lose context and become difficult to compose:

```typescript
// ❌ Traditional approach - context is lost, hard to compose
document.querySelectorAll('button').forEach(button => {
  let clickCount = 0; // Where does this live? How do you clean it up?
  
  button.addEventListener('click', () => {
    clickCount++; // What if the button is removed from DOM?
    button.textContent = `Clicked ${clickCount} times`;
  });
  
  // How do you add more behavior? How do you ensure proper cleanup?
  // How do you share state between different event handlers?
});
```

**The Solution**: Generators provide persistent, composable context:

```typescript
// ✅ Watch approach - context is preserved, behavior is composable
watch('button', function* () {
  let clickCount = 0; // Scoped to this specific button
  
  yield text(`Clicked ${clickCount} times`);
  
  yield click(() => {
    clickCount++; // Context persists across events
    yield text(`Clicked ${clickCount} times`);
  });
  
  // More behavior can be added naturally
  yield onVisible(() => console.log('Button is visible'));
  yield onMount(() => console.log('Button mounted'));
  
  // Cleanup happens automatically when element is removed
});
```

**How Generators Work Here**:

1. **Persistent Execution Context**: The generator function's scope stays alive for the lifetime of the element
2. **Yield Points**: Each `yield` is a declarative statement about what the element should do
3. **Composable Behavior**: You can yield different types of functions to build complex behaviors
4. **Automatic Cleanup**: When the element is removed, the generator's context is automatically cleaned up

### Why `yield`? Making Behavior Declarative

**The Problem**: Imperative code becomes hard to reason about:

```typescript
// ❌ Imperative - order matters, side effects are hidden
function setupButton(button) {
  button.classList.add('interactive');
  button.style.cursor = 'pointer';
  button.addEventListener('click', handleClick);
  button.addEventListener('focus', handleFocus);
  // What happens if this throws? What if the element is removed?
}
```

**The Solution**: `yield` makes behavior declarative and composable:

```typescript
// ✅ Declarative - each yield is a clear statement of intent
function* buttonBehavior() {
  yield addClass('interactive');    // "This button should have this class"
  yield style('cursor', 'pointer'); // "This button should look clickable"
  yield click(handleClick);         // "This button should respond to clicks"
  yield focus(handleFocus);         // "This button should respond to focus"
  
  // Order doesn't matter for most operations
  // Each yield is isolated and safe
  // TypeScript knows exactly what each yield does
}
```

**How `yield` Provides Type Safety**:

```typescript
watch('input[type="email"]', function* () {
  // TypeScript infers this is HTMLInputElement from the selector
  const emailInput = self(); // Type: HTMLInputElement
  
  yield on('blur', (event, element) => {
    // Both event and element are properly typed
    // element is HTMLInputElement, so .value is available
    if (!element.value.includes('@')) {
      yield addClass('error'); // This yield knows it's working on HTMLInputElement
    }
  });
  
  // Every yield gets the correct element type automatically
  yield value('user@example.com'); // ✅ Valid for input elements
  // yield value would error on a div element
});
```

### Why Element-Scoped State? Solving the Instance Problem

**The Problem**: Managing state for multiple instances is complex:

```typescript
// ❌ Global state doesn't work for multiple instances
let buttonClickCount = 0; // This is shared across ALL buttons!

document.querySelectorAll('.counter-button').forEach(button => {
  button.addEventListener('click', () => {
    buttonClickCount++; // All buttons share the same counter
    button.textContent = `Count: ${buttonClickCount}`;
  });
});
```

**The Solution**: Each element gets its own isolated state:

```typescript
// ✅ Each button gets its own state automatically
watch('.counter-button', function* () {
  let clickCount = 0; // This variable is scoped to THIS specific button
  
  yield click(() => {
    clickCount++; // Each button maintains its own count
    yield text(`Count: ${clickCount}`);
  });
  
  // Or use the state API for more advanced features
  const count = createState('count', 0);
  const doubled = createComputed(() => count.get() * 2, ['count']);
});
```

**How This Works**:
- Each time `watch` matches an element, it creates a new generator instance
- Each generator has its own scope and variables
- Variables and state are automatically isolated per element
- Cleanup happens automatically when elements are removed

### Why Dual APIs? Developer Experience at Scale

**The Problem**: Different use cases need different APIs:

```typescript
// Sometimes you want to work directly with elements
const button = document.getElementById('myButton');
button.textContent = 'Click me';

// Sometimes you want declarative, reactive behavior
// How do you use the same functions in both contexts?
```

**The Solution**: Functions work both directly and in generators:

```typescript
// ✅ Direct usage when you have an element reference
const button = document.getElementById('myButton');
text(button, 'Click me');
addClass(button, 'primary');

// ✅ Generator usage for reactive behavior
watch('button', function* () {
  yield text('Click me');
  yield addClass('primary');
});

// ✅ Even with selectors for one-off operations
text('.status', 'Ready');
addClass('.buttons', 'loaded');
```

**How This Provides Type Safety**:

```typescript
// TypeScript tracks context automatically
watch('input[type="email"]', function* () {
  // Inside a generator, functions know the current element type
  yield value('test@example.com'); // ✅ TypeScript knows this is valid
  
  const currentValue = yield (() => value()); // Gets value, returns string
  // TypeScript knows currentValue is string
});

// Outside generators, you specify the element
const input = document.querySelector('input[type="email"]') as HTMLInputElement;
value(input, 'test@example.com'); // ✅ TypeScript validates the element type
```

### Why Component Composition? Solving the Hierarchy Problem

**The Problem**: Building component hierarchies is hard:

```typescript
// ❌ No clear parent-child relationship
let parentState = { children: [] };

document.querySelectorAll('.child').forEach(child => {
  // How does the child communicate with the parent?
  // How does the parent manage multiple children?
  // How do you ensure type safety across the boundary?
});
```

**The Solution**: Explicit parent-child APIs:

```typescript
// ✅ Clear, type-safe parent-child relationships
watch('.parent', function* () {
  // Type-safe collection of child APIs
  const children = child('.child-button', function* () {
    let count = 0;
    yield click(() => count++);
    
    // Child exposes a typed API
    return {
      getCount: () => count,
      reset: () => { count = 0; yield text(`Count: 0`); }
    };
  });
  
  // Parent can coordinate children with full type safety
  yield click('.reset-all', () => {
    children.forEach(api => api.reset()); // TypeScript knows these methods exist
  });
  
  // Parent can also expose an API
  return {
    getTotalCount: () => Array.from(children.values()).reduce((sum, api) => sum + api.getCount(), 0)
  };
});
```

**How This Builds Intuition**:

1. **Clear Ownership**: Parents own and manage their children
2. **Explicit APIs**: What a component exposes is clearly defined in its return value
3. **Type Safety**: TypeScript ensures API contracts are maintained
4. **Reactive Updates**: The `child()` function returns a live Map that updates automatically
5. **Scoped Observation**: Each parent only watches for changes within its own scope

### Why This Architecture? The Bigger Picture

This design solves several fundamental problems in web development:

1. **Context Loss**: Traditional event handlers lose context when elements are removed/added
2. **State Management**: No clear way to manage state per element instance
3. **Composition**: Difficult to build reusable, composable behaviors
4. **Type Safety**: Runtime errors from incorrect element assumptions
5. **Performance**: Many global event listeners and observers hurt performance
6. **Memory Leaks**: Forgotten event listeners and observers accumulate over time

Watch's generator-based approach with `yield` provides:

- **Persistent Context**: Generator scope lives with the element
- **Declarative Behavior**: Each `yield` states what should happen
- **Automatic Cleanup**: Generators are cleaned up when elements are removed
- **Type Safety**: Element types are inferred and maintained throughout
- **Performance**: Single global observer with scoped component watchers
- **Composability**: Behaviors can be mixed, matched, and reused

This creates a development experience that's both powerful and intuitive, letting you focus on what your components should do rather than how to manage their lifecycle.

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

## Component Composition: Building Hierarchies

Watch v5 supports full parent-child component communication, allowing you to build complex, nested, and encapsulated UIs with reactive relationships.

### Child-to-Parent: Exposing APIs with `createChildWatcher`

A child component can `return` an API from its generator. The parent can then use `createChildWatcher` to get a live collection of these APIs.

**Child Component**
```typescript
// Counter button that exposes an API
function* counterButton() {
  let count = 0;
  
  // Set initial text and handle clicks
  yield text(`Count: ${count}`);
  yield click(() => {
    count++;
    yield text(`Count: ${count}`);
  });

  // Define and return a public API
  return {
    getCount: () => count,
    reset: () => {
      count = 0;
      yield text(`Count: ${count}`);
      console.log(`Button ${self().id} was reset.`);
    },
    increment: () => {
      count++;
      yield text(`Count: ${count}`);
    }
  };
}
```

**Parent Component**
```typescript
import { watch, child, click } from '@doeixd/watch';

watch('.button-container', function*() {
  // `childApis` is a reactive Map: Map<HTMLButtonElement, { getCount, reset, increment }>
  const childApis = child('button.counter', counterButton);

  // Parent can interact with children's APIs
  yield click('.reset-all-btn', () => {
    console.log('Resetting all child buttons...');
    for (const api of childApis.values()) {
      api.reset();
    }
  });
  
  yield click('.sum-btn', () => {
    const total = Array.from(childApis.values()).reduce((sum, api) => sum + api.getCount(), 0);
    console.log(`Total count across all buttons: ${total}`);
  });
});
```

### Parent-to-Child: Accessing the Parent with `getParentContext`

A child can access its parent's context and API, creating a top-down communication channel.

**Parent Component**
```typescript
watch('form#main-form', function*() {
  const isValid = createState('valid', false);
  
  // Form validation logic...
  
  // The parent's API
  return {
    submitForm: () => {
      if (isValid.get()) {
        self().submit();
      }
    },
    isValid: () => isValid.get()
  };
});
```

**Child Component (inside the form)**
```typescript
import { getParentContext, on, self } from '@doeixd/watch';

watch('input.submit-on-enter', function*() {
  // Get the parent form's context and API with full type safety
  const parentForm = getParentContext<HTMLFormElement, { 
    submitForm: () => void; 
    isValid: () => boolean 
  }>();

  yield on('keydown', (e) => {
    if (e.key === 'Enter' && parentForm) {
      e.preventDefault();
      if (parentForm.api.isValid()) {
        parentForm.api.submitForm(); // Call the parent's API method
      }
    }
  });
});
```

### Real-World Example: Interactive Counter Dashboard

```typescript
// Child counter component
function* counterWidget() {
  let count = 0;
  const startTime = Date.now();
  
  yield addClass('counter-widget');
  yield text(`Count: ${count}`);
  
  yield click(() => {
    count++;
    yield text(`Count: ${count}`);
    yield addClass('updated');
    setTimeout(() => yield removeClass('updated'), 200);
  });
  
  // Public API for parent interaction
  return {
    getCount: () => count,
    getRate: () => count / ((Date.now() - startTime) / 1000),
    reset: () => {
      count = 0;
      yield text(`Count: ${count}`);
    },
    setCount: (newCount: number) => {
      count = newCount;
      yield text(`Count: ${count}`);
    }
  };
}

// Parent dashboard component
function* counterDashboard() {
  const counters = child('.counter', counterWidget);
  
  // Dashboard controls
  yield click('.reset-all', () => {
    counters.forEach(api => api.reset());
  });
  
  yield click('.show-stats', () => {
    const stats = Array.from(counters.values()).map(api => ({
      count: api.getCount(),
      rate: api.getRate()
    }));
    console.log('Dashboard stats:', stats);
  });
  
  yield click('.distribute-evenly', () => {
    const total = Array.from(counters.values()).reduce((sum, api) => sum + api.getCount(), 0);
    const perCounter = Math.floor(total / counters.size);
    counters.forEach(api => api.setCount(perCounter));
  });
  
  // Parent API
  return {
    getTotalCount: () => Array.from(counters.values()).reduce((sum, api) => sum + api.getCount(), 0),
    getCounterCount: () => counters.size,
    resetAll: () => counters.forEach(api => api.reset())
  };
}

// Usage
watch('.dashboard', counterDashboard);
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

### Component Composition

| Function | Type | Description |
|----------|------|-------------|
| `createChildWatcher` | `(selector, generator) => Map<ChildEl, ChildApi>` | Create a reactive collection of child component APIs |
| `child` | `(selector, generator) => Map<ChildEl, ChildApi>` | Alias for `createChildWatcher` - shorter and more intuitive |
| `getParentContext` | `() => { element: ParentEl, api: ParentApi } \| null` | Get the context of the parent watcher |

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

### Component Hierarchies
```typescript
// Child counter component with API
function* smartCounter() {
  let count = 0;
  yield text(`Smart Counter: ${count}`);
  
  yield click(() => {
    count++;
    yield text(`Smart Counter: ${count}`);
  });
  
  // Return API for parent to use
  return {
    getCount: () => count,
    reset: () => {
      count = 0;
      yield text(`Smart Counter: ${count}`);
    }
  };
}

// Parent dashboard managing multiple counters
watch('.counter-dashboard', function* () {
  const counters = child('.smart-counter', smartCounter);
  
  yield click('.reset-all', () => {
    // Reset all child counters
    for (const api of counters.values()) {
      api.reset();
    }
  });
  
  yield click('.show-total', () => {
    const total = Array.from(counters.values())
      .reduce((sum, api) => sum + api.getCount(), 0);
    alert(`Total: ${total}`);
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

Watch v5 is designed for maximum performance with several key optimizations:

- **Single global observer**: One MutationObserver handles all DOM changes
- **Efficient batching**: DOM changes processed in batches to minimize layout thrashing
- **Memory safe**: Automatic cleanup with WeakMaps prevents memory leaks
- **Type-safe**: No runtime type checking needed - all validation at compile time
- **Event delegation**: Built-in support for efficient event handling on dynamic content
- **Scoped observation**: Parent-based watching reduces unnecessary element checks

### How the Observer System Works

Watch uses a sophisticated observation strategy that balances performance with functionality:

#### Global MutationObserver
```typescript
// All these watchers share a single global observer
watch('button', buttonHandler);
watch('.dropdown', dropdownHandler); 
watch('input[type="email"]', emailHandler);

// The observer checks each added element against ALL active selectors
// This can be expensive with many watchers or frequent DOM changes
```

#### Event Delegation for Performance
```typescript
// ❌ Creates individual watchers for each button (expensive)
watch('button', function* () {
  yield click(() => console.log('Clicked!'));
});

// ✅ Uses event delegation - single event listener (fast)
watch(document.body, 'button', function* () {
  yield click(() => console.log('Clicked!'));
});
```

#### Scoped Observation
```typescript
// ❌ Observes entire document - all DOM changes trigger checks
watch('.todo-item', todoHandler);

// ✅ Scoped to specific container - only changes in .todo-list trigger checks
watch(document.querySelector('.todo-list'), '.todo-item', todoHandler);
```

#### Component Composition Optimization
```typescript
// child() uses scoped MutationObserver for optimal performance
watch('.parent', function* () {
  // This creates a scoped observer that only watches within this parent
  const children = child('.child', childHandler);
  
  // Adding children elsewhere doesn't trigger this observer
  // Only changes within this .parent element are monitored
});
```

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

#### 5. Use Component Composition for Complex UIs

For complex applications, use parent-child composition to create scoped observers:

```typescript
// ❌ Slow: Many global watchers
watch('.todo-item', todoItemHandler);
watch('.todo-checkbox', checkboxHandler);
watch('.todo-delete', deleteHandler);
watch('.todo-edit', editHandler);

// ✅ Fast: Scoped component composition
watch('.todo-list', function* () {
  const todos = child('.todo-item', function* () {
    // All child handlers are scoped to individual todo items
    yield child('.checkbox', checkboxHandler);
    yield child('.delete-btn', deleteHandler);
    yield child('.edit-btn', editHandler);
    
    return { 
      markComplete: () => { /* API */ },
      delete: () => { /* API */ }
    };
  });
  
  // Parent can coordinate all todo items efficiently
  yield click('.complete-all', () => {
    todos.forEach(api => api.markComplete());
  });
});
```

#### 6. Prefer Parent Context Over Event Bubbling

Use `getParentContext()` for direct parent communication instead of custom events:

```typescript
// ❌ Slower: Custom events bubble through DOM
watch('.child', function* () {
  yield click(() => {
    emit('child-action', { data: 'value' });
  });
});

watch('.parent', function* () {
  yield on('child-action', (e) => {
    // Handle bubbled event
  });
});

// ✅ Faster: Direct parent access
watch('.parent', function* () {
  return {
    handleChildAction: (data) => { /* handle directly */ }
  };
});

watch('.child', function* () {
  const parent = getParentContext();
  
  yield click(() => {
    parent?.api.handleChildAction('value');
  });
});
```

### Troubleshooting Performance Issues

1. **Profile using DevTools**: Use Performance tab to identify bottlenecks
2. **Check selector specificity**: Ensure selectors are as specific as possible
3. **Monitor mutation frequency**: High mutation rates may indicate over-watching
4. **Consider `run()` for static content**: Use `run()` instead of `watch()` for elements that won't change

### Composition Best Practices

#### 1. Avoid Tight Coupling with `getParentContext`

While `getParentContext()` is powerful, it makes a child component dependent on its parent. This can reduce reusability.

- **DO** use `getParentContext()` when a child is intrinsically part of a parent (e.g., a custom `<option>` inside a custom `<select>`)
- **PREFER** using `emit()` to send custom events from the child up to the parent for more decoupled communication

**Decoupled Example:**
```typescript
// Child: Emits an event
watch('.child', function*() {
  yield click(() => emit('child-action', { detail: 'data' }));
});

// Parent: Listens for the event
watch('.parent', function*() {
  yield on('child-action', (e) => {
    console.log('Child action occurred:', e.detail);
  });
});
```

#### 2. Generator Return Value is the API

Remember that only the `return` value of a generator is exposed as its public API. Internal state or functions are kept private, which is good for encapsulation.

```typescript
function* myComponent() {
  let privateState = 0; // Not accessible from parent
  
  const privateFunction = () => { /* private */ }; // Not accessible
  
  // Only this object is accessible to parents
  return {
    publicMethod: () => privateState,
    anotherPublicMethod: () => privateFunction()
  };
}
```

#### 3. Avoid Circular Dependencies

Be careful not to create infinite loops. A parent calling a child's API which in turn calls the parent's API can lead to a stack overflow if not handled correctly. Always ensure there is a clear, unidirectional flow of control for any given action.

```typescript
// ❌ Dangerous: Potential infinite loop
function* parent() {
  const children = child('.child', childComponent);
  return {
    triggerChild: () => children.forEach(api => api.triggerParent())
  };
}

function* childComponent() {
  const parent = getParentContext();
  return {
    triggerParent: () => parent?.api.triggerChild() // 💥 Infinite loop!
  };
}

// ✅ Safe: Clear unidirectional flow
function* parent() {
  const children = child('.child', childComponent);
  return {
    reset: () => children.forEach(api => api.reset())
  };
}

function* childComponent() {
  const parent = getParentContext();
  return {
    reset: () => { /* reset logic */ },
    notifyParent: () => parent?.api.onChildNotification()
  };
}
```

## License

MIT License - see [LICENSE](../LICENSE) file.
