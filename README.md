[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Deno](https://img.shields.io/badge/Deno-Compatible-green.svg)](https://deno.land/)
[![JSR](https://img.shields.io/badge/JSR-Published-orange.svg)](https://jsr.io/)

# Watch 🕶️

**A type-safe, performant DOM observation library with dual APIs and generator composition.**
Watch is a bare-bones web component alternative. It runs a function, and adds event listeners to elements that match a given selector. That's basically it. 

Since each match of a given selector is given it's own state, it enables light-weight components for small bits of interactivity. A common use-case in server-driven websites, user-scripts, or Chrome Extensions, basically anywhere where you don't control the markup think Astro, e-commerce templates, blogs, htmx sites, etc...

## Table of Contents

- [Quick Start](#quick-start)
- [Why Watch?](#why-watch)
- [Design Philosophy: Why These Choices Matter](#design-philosophy-why-these-choices-matter)
- [Core Concepts](#core-concepts)
- [Component Composition: Building Hierarchies](#component-composition-building-hierarchies)
- [Building Higher-Level Abstractions](#building-higher-level-abstractions)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Complete API Reference](#complete-api-reference)
- [Examples](#examples)
- [Installation](#installation)
- [Browser Support](#browser-support)
- [Performance](#performance)
- [Gotchas & Performance Considerations](#gotchas--performance-considerations)
- [License](#license)

<br>

## Quick Start

```typescript
import { watch, text, addClass, click } from 'watch-selector';

// Watch buttons and make them interactive
watch('button', function* () {
  yield addClass('interactive');
  yield click((e, el) => {
    text(el, 'Clicked!');
  });
});
```

<br>

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

<br>

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

<br>

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

### **Advanced Generator Patterns**
Watch supports advanced generator features for sophisticated composition:

```typescript
// Async generators for data fetching
watch('.user-profile', async function* () {
  yield text('Loading...');
  
  const response = await fetch('/api/user');
  const user = await response.json();
  
  yield text(`Welcome, ${user.name}!`);
  yield template('<img src="{{avatar}}" />', user);
});

// Generator delegation with yield*
function* clickBehavior() {
  yield click(() => console.log('Clicked!'));
}

function* hoverBehavior() {
  yield on('hover', () => console.log('Hovered!'));
}

watch('button', function* () {
  yield* clickBehavior();  // Delegate to another generator
  yield* hoverBehavior();  // Compose multiple behaviors
  
  // Mix with regular yields
  yield addClass('interactive');
});

// Promise-based operations
watch('.async-button', function* () {
  yield click(async () => {
    // Return promises from yields - they'll be awaited
    yield new Promise(resolve => {
      setTimeout(() => {
        yield text('Delayed update!');
        resolve();
      }, 1000);
    });
  });
});

// Nested generator composition
function* withLogging(innerGenerator) {
  console.log('Starting component...');
  yield* innerGenerator();
  console.log('Component initialized!');
}

watch('.logged-component', function* () {
  yield* withLogging(function* () {
    yield text('This component is logged');
    yield click(() => console.log('Logged click'));
  });
});
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

<br>

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
import { watch, child, click } from 'watch-selector';

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
import { getParentContext, on, self } from 'watch-selector';

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

<br>

## Building Higher-Level Abstractions

Watch's primitive functions are designed to be composable building blocks for more sophisticated abstractions. You can integrate templating engines, routing libraries, state management solutions, and domain-specific tools while maintaining Watch's ergonomic patterns.

### Writing Custom Abstractions

The key to building great abstractions with Watch is following the established patterns:

#### 1. Dual API Pattern

Make your functions work both directly and in generators:

```typescript
// Custom templating integration
export function template(templateOrElement: string | HTMLElement, data?: any): any {
  // Direct usage
  if (arguments.length === 2 && (typeof templateOrElement === 'string' || templateOrElement instanceof HTMLElement)) {
    const element = resolveElement(templateOrElement);
    if (element) {
      element.innerHTML = renderTemplate(templateOrElement as string, data);
    }
    return;
  }
  
  // Generator usage
  if (arguments.length === 1) {
    const templateStr = templateOrElement as string;
    return ((element: HTMLElement) => {
      element.innerHTML = renderTemplate(templateStr, data || {});
    }) as ElementFn<HTMLElement>;
  }
  
  // Selector + data usage
  const [templateStr, templateData] = arguments;
  return ((element: HTMLElement) => {
    element.innerHTML = renderTemplate(templateStr, templateData);
  }) as ElementFn<HTMLElement>;
}

// Usage examples
const element = document.querySelector('.content');
template(element, '<h1>{{title}}</h1>', { title: 'Hello' });

// Or in generators
watch('.dynamic-content', function* () {
  yield template('<div>{{message}}</div>', { message: 'Dynamic!' });
});
```

#### 2. Context-Aware Functions

Create functions that understand the current element context:

```typescript
// Custom router integration
export function route(pattern: string, handler: () => void): ElementFn<HTMLElement> {
  return (element: HTMLElement) => {
    const currentPath = window.location.pathname;
    const matches = matchRoute(pattern, currentPath);
    
    if (matches) {
      // Store route params in element context
      if (!element.dataset.routeParams) {
        element.dataset.routeParams = JSON.stringify(matches.params);
      }
      handler();
    }
  };
}

// Route parameters helper
export function routeParams<T = Record<string, string>>(): T {
  const element = self();
  const params = element.dataset.routeParams;
  return params ? JSON.parse(params) : {};
}

// Usage
watch('[data-route]', function* () {
  yield route('/users/:id', () => {
    const { id } = routeParams<{ id: string }>();
    yield template('<div>User ID: {{id}}</div>', { id });
  });
});
```

#### 3. State Integration

Build abstractions that work with Watch's state system:

```typescript
// Custom form validation abstraction
export function validateForm(schema: ValidationSchema): ElementFn<HTMLFormElement> {
  return (form: HTMLFormElement) => {
    const errors = createState('validation-errors', {});
    const isValid = createComputed(() => Object.keys(errors.get()).length === 0, ['validation-errors']);
    
    // Validate on input changes
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        const fieldErrors = validateField(input.name, input.value, schema);
        errors.update(current => ({
          ...current,
          [input.name]: fieldErrors
        }));
      });
    });
    
    // Expose validation state
    form.dataset.valid = isValid().toString();
  };
}

// Usage
watch('form.needs-validation', function* () {
  yield validateForm({
    email: { required: true, email: true },
    password: { required: true, minLength: 8 }
  });
  
  yield submit((e) => {
    const isValid = getState('validation-errors');
    if (Object.keys(isValid).length > 0) {
      e.preventDefault();
    }
  });
});
```

### Templating Engine Integration

Here's how to integrate popular templating engines:

#### Handlebars Integration

```typescript
import Handlebars from 'handlebars';

// Create a templating abstraction
export function handlebars(templateSource: string, data?: any): ElementFn<HTMLElement>;
export function handlebars(element: HTMLElement, templateSource: string, data: any): void;
export function handlebars(...args: any[]): any {
  if (args.length === 3) {
    // Direct usage: handlebars(element, template, data)
    const [element, templateSource, data] = args;
    const template = Handlebars.compile(templateSource);
    element.innerHTML = template(data);
    return;
  }
  
  if (args.length === 2) {
    // Generator usage: yield handlebars(template, data)
    const [templateSource, data] = args;
    return (element: HTMLElement) => {
      const template = Handlebars.compile(templateSource);
      element.innerHTML = template(data);
    };
  }
  
  // Template only - data from state
  const [templateSource] = args;
  return (element: HTMLElement) => {
    const template = Handlebars.compile(templateSource);
    const data = getAllState(); // Get all state as template context
    element.innerHTML = template(data);
  };
}

// Helper for reactive templates
export function reactiveTemplate(templateSource: string, dependencies: string[]): ElementFn<HTMLElement> {
  return (element: HTMLElement) => {
    const template = Handlebars.compile(templateSource);
    
    const render = () => {
      const data = getAllState();
      element.innerHTML = template(data);
    };
    
    // Re-render when dependencies change
    dependencies.forEach(dep => {
      watchState(dep, render);
    });
    
    // Initial render
    render();
  };
}

// Usage
watch('.user-profile', function* () {
  const user = createState('user', { name: 'John', email: 'john@example.com' });
  
  // Template updates automatically when user state changes
  yield reactiveTemplate(`
    <h2>{{user.name}}</h2>
    <p>{{user.email}}</p>
  `, ['user']);
  
  yield click('.edit-btn', () => {
    user.update(u => ({ ...u, name: 'Jane' }));
  });
});
```

#### Lit-html Integration

```typescript
import { html, render } from 'lit-html';

export function litTemplate(template: TemplateResult): ElementFn<HTMLElement>;
export function litTemplate(element: HTMLElement, template: TemplateResult): void;
export function litTemplate(...args: any[]): any {
  if (args.length === 2) {
    const [element, template] = args;
    render(template, element);
    return;
  }
  
  const [template] = args;
  return (element: HTMLElement) => {
    render(template, element);
  };
}

// Usage with reactive updates
watch('.todo-list', function* () {
  const todos = createState('todos', [
    { id: 1, text: 'Learn Watch', done: false },
    { id: 2, text: 'Build something awesome', done: false }
  ]);
  
  // Template function that uses current state
  const todoTemplate = () => html`
    <ul>
      ${todos.get().map(todo => html`
        <li class="${todo.done ? 'done' : ''}">
          <input type="checkbox" .checked=${todo.done} 
                 @change=${() => toggleTodo(todo.id)}>
          ${todo.text}
        </li>
      `)}
    </ul>
  `;
  
  // Re-render when todos change
  watchState('todos', () => {
    yield litTemplate(todoTemplate());
  });
  
  // Initial render
  yield litTemplate(todoTemplate());
});
```

### Router Integration

Create routing abstractions that work seamlessly with Watch:

```typescript
// Simple router abstraction
class WatchRouter {
  private routes = new Map<string, RouteHandler>();
  
  route(pattern: string, handler: RouteHandler): ElementFn<HTMLElement> {
    this.routes.set(pattern, handler);
    
    return (element: HTMLElement) => {
      const checkRoute = () => {
        const path = window.location.pathname;
        const match = this.matchRoute(pattern, path);
        
        if (match) {
          // Store route context
          element.dataset.routeParams = JSON.stringify(match.params);
          element.dataset.routeQuery = JSON.stringify(match.query);
          
          // Execute handler with route context
          handler(match);
        }
      };
      
      // Check on load and route changes
      checkRoute();
      window.addEventListener('popstate', checkRoute);
      
      // Cleanup
      cleanup(() => {
        window.removeEventListener('popstate', checkRoute);
      });
    };
  }
  
  private matchRoute(pattern: string, path: string) {
    // Route matching logic...
    return { params: {}, query: {} };
  }
}

const router = new WatchRouter();

// Route-aware helper functions
export function routeParams<T = Record<string, any>>(): T {
  const element = self();
  const params = element.dataset.routeParams;
  return params ? JSON.parse(params) : {};
}

export function routeQuery<T = Record<string, any>>(): T {
  const element = self();
  const query = element.dataset.routeQuery;
  return query ? JSON.parse(query) : {};
}

export const route = router.route.bind(router);

// Usage
watch('[data-route="/users/:id"]', function* () {
  yield route('/users/:id', ({ params }) => {
    const userId = params.id;
    
    // Load user data
    const user = createState('user', null);
    
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(userData => user.set(userData));
    
    // Reactive template
    watchState('user', (userData) => {
      if (userData) {
        yield handlebars(`
          <div class="user-profile">
            <h1>{{name}}</h1>
            <p>{{email}}</p>
          </div>
        `, userData);
      }
    });
  });
});
```

### State Management Integration

Integrate with external state management libraries:

```typescript
// Redux integration
import { Store } from 'redux';

export function connectRedux<T>(
  store: Store<T>, 
  selector: (state: T) => any,
  mapDispatchToProps?: any
): ElementFn<HTMLElement> {
  return (element: HTMLElement) => {
    let currentValue = selector(store.getState());
    
    const handleChange = () => {
      const newValue = selector(store.getState());
      if (newValue !== currentValue) {
        currentValue = newValue;
        // Update element state
        setState('redux-state', newValue);
      }
    };
    
    const unsubscribe = store.subscribe(handleChange);
    
    // Initial state
    setState('redux-state', currentValue);
    
    // Provide dispatch function
    if (mapDispatchToProps) {
      const dispatchers = mapDispatchToProps(store.dispatch);
      setState('redux-dispatch', dispatchers);
    }
    
    cleanup(() => unsubscribe());
  };
}

// Usage
watch('.connected-component', function* () {
  yield connectRedux(
    store,
    state => state.user,
    dispatch => ({
      updateUser: (user) => dispatch({ type: 'UPDATE_USER', user })
    })
  );
  
  // Use Redux state in templates
  watchState('redux-state', (user) => {
    yield template('<div>Hello {{name}}</div>', user);
  });
  
  yield click('.update-btn', () => {
    const { updateUser } = getState('redux-dispatch');
    updateUser({ name: 'New Name' });
  });
});
```

### Domain-Specific Abstractions

Create specialized tools for specific use cases:

```typescript
// E-commerce specific abstractions
export function cart(): ElementFn<HTMLElement> {
  return (element: HTMLElement) => {
    const items = createState('cart-items', []);
    const total = createComputed(
      () => items.get().reduce((sum, item) => sum + item.price * item.quantity, 0),
      ['cart-items']
    );
    
    // Expose cart API globally
    window.cart = {
      add: (item) => items.update(current => [...current, item]),
      remove: (id) => items.update(current => current.filter(i => i.id !== id)),
      getTotal: () => total()
    };
  };
}

export function addToCart(productId: string, price: number): ElementFn<HTMLButtonElement> {
  return (button: HTMLButtonElement) => {
    button.addEventListener('click', () => {
      window.cart.add({ id: productId, price, quantity: 1 });
      
      // Visual feedback
      addClass(button, 'added');
      setTimeout(() => removeClass(button, 'added'), 1000);
    });
  };
}

// Data fetching abstraction
export function fetchData<T>(
  url: string, 
  options?: RequestInit
): ElementFn<HTMLElement> {
  return (element: HTMLElement) => {
    const data = createState<T | null>('fetch-data', null);
    const loading = createState('fetch-loading', true);
    const error = createState<Error | null>('fetch-error', null);
    
    fetch(url, options)
      .then(response => response.json())
      .then(result => {
        data.set(result);
        loading.set(false);
      })
      .catch(err => {
        error.set(err);
        loading.set(false);
      });
  };
}

// Usage of domain abstractions
watch('.product-page', function* () {
  // Initialize cart
  yield cart();
  
  // Fetch product data
  yield fetchData('/api/products/123');
  
  // Reactive content based on loading state
  watchState('fetch-loading', (isLoading) => {
    if (isLoading) {
      yield template('<div class="loading">Loading...</div>');
    }
  });
  
  // Reactive content based on data
  watchState('fetch-data', (product) => {
    if (product) {
      yield template(`
        <div class="product">
          <h1>{{name}}</h1>
          <p>{{description}}</p>
          <span class="price">${{price}}</span>
          <button class="add-to-cart">Add to Cart</button>
        </div>
      `, product);
    }
  });
  
  // Add to cart functionality
  yield click('.add-to-cart', () => {
    const product = getState('fetch-data');
    yield addToCart(product.id, product.price);
  });
});
```

### Creating Reusable Component Libraries

Build component libraries that follow Watch's patterns:

```typescript
// UI Component library built on Watch
export const UI = {
  // Modal component
  modal(options: { title?: string, closable?: boolean } = {}): ElementFn<HTMLElement> {
    return (element: HTMLElement) => {
      const isOpen = createState('modal-open', false);
      
      // Setup modal structure
      yield template(`
        <div class="modal-backdrop" style="display: none;">
          <div class="modal-content">
            ${options.title ? `<h2>${options.title}</h2>` : ''}
            <div class="modal-body"></div>
            ${options.closable ? '<button class="modal-close">×</button>' : ''}
          </div>
        </div>
      `);
      
      // Show/hide logic
      watchState('modal-open', (open) => {
        const backdrop = el('.modal-backdrop');
        if (backdrop) {
          backdrop.style.display = open ? 'flex' : 'none';
        }
      });
      
      if (options.closable) {
        yield click('.modal-close', () => {
          isOpen.set(false);
        });
      }
      
      // Expose modal API
      return {
        open: () => isOpen.set(true),
        close: () => isOpen.set(false),
        toggle: () => isOpen.update(current => !current)
      };
    };
  },
  
  // Tabs component
  tabs(): ElementFn<HTMLElement> {
    return (element: HTMLElement) => {
      const activeTab = createState('active-tab', 0);
      
      // Setup tab navigation
      const tabButtons = all('.tab-button');
      const tabPanels = all('.tab-panel');
      
      tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
          activeTab.set(index);
        });
      });
      
      // Show/hide panels based on active tab
      watchState('active-tab', (active) => {
        tabPanels.forEach((panel, index) => {
          panel.style.display = index === active ? 'block' : 'none';
        });
        
        tabButtons.forEach((button, index) => {
          button.classList.toggle('active', index === active);
        });
      });
    };
  }
};

// Usage
watch('.my-modal', function* () {
  const modalApi = yield UI.modal({ title: 'Settings', closable: true });
  
  yield click('.open-modal', () => {
    modalApi.open();
  });
});

watch('.tab-container', function* () {
  yield UI.tabs();
});
```

### Best Practices for Abstractions

1. **Follow the Dual API Pattern**: Make functions work both directly and in generators
2. **Use Element-Scoped State**: Keep component state isolated per element instance
3. **Provide Type Safety**: Use TypeScript generics and proper typing
4. **Compose with Existing Functions**: Build on Watch's primitive functions
5. **Handle Cleanup**: Always clean up external resources
6. **Maintain Context**: Use `self()`, `el()`, and context functions appropriately
7. **Return APIs**: Let components expose public interfaces through return values

This approach lets you build powerful, domain-specific libraries while maintaining Watch's ergonomic patterns and type safety guarantees.

### Generator Abstractions: When to Wrap the Generator Itself

Sometimes you need to wrap or transform the generator pattern itself, not just individual functions. This is useful for cross-cutting concerns, meta-functionality, and standardizing behaviors across components.

#### When to Use Generator Abstractions vs Function Abstractions

**Use Function Abstractions When:**
- Adding specific functionality (templating, validation, etc.)
- Building domain-specific operations
- Creating reusable behaviors
- Extending the dual API pattern

**Use Generator Abstractions When:**
- Adding cross-cutting concerns (logging, performance, error handling)
- Standardizing component patterns across teams
- Injecting behavior into ALL components
- Creating meta-frameworks or higher-level patterns
- Managing component lifecycles uniformly

#### Performance Monitoring Generator

```typescript
// Wraps any generator to add performance monitoring
export function withPerformanceMonitoring<T extends HTMLElement>(
  name: string,
  generator: () => Generator<ElementFn<T>, any, unknown>
): () => Generator<ElementFn<T>, any, unknown> {
  return function* () {
    const startTime = performance.now();
    console.log(`🚀 Component "${name}" starting...`);
    
    try {
      // Execute the original generator
      const originalGen = generator();
      let result = originalGen.next();
      
      while (!result.done) {
        // Time each yielded operation
        const opStart = performance.now();
        yield result.value;
        const opEnd = performance.now();
        
        // Log slow operations
        if (opEnd - opStart > 10) {
          console.warn(`⚠️ Slow operation in "${name}": ${opEnd - opStart}ms`);
        }
        
        result = originalGen.next();
      }
      
      const endTime = performance.now();
      console.log(`✅ Component "${name}" initialized in ${endTime - startTime}ms`);
      
      return result.value; // Return the original generator's return value
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ Component "${name}" failed after ${endTime - startTime}ms:`, error);
      throw error;
    }
  };
}

// Usage
const monitoredButton = withPerformanceMonitoring('InteractiveButton', function* () {
  yield addClass('interactive');
  yield click(() => console.log('Clicked!'));
  
  return {
    disable: () => yield addClass('disabled')
  };
});

watch('button', monitoredButton);
```

#### Error Boundary Generator

```typescript
// Wraps generators with error handling and fallback UI
export function withErrorBoundary<T extends HTMLElement>(
  generator: () => Generator<ElementFn<T>, any, unknown>,
  fallbackContent?: string,
  onError?: (error: Error, element: T) => void
): () => Generator<ElementFn<T>, any, unknown> {
  return function* () {
    try {
      yield* generator();
    } catch (error) {
      console.error('Component error:', error);
      
      // Show fallback UI
      if (fallbackContent) {
        yield text(fallbackContent);
        yield addClass('error-state');
      }
      
      // Call custom error handler
      if (onError) {
        const element = self() as T;
        onError(error as Error, element);
      }
      
      // Return safe fallback API
      return {
        hasError: true,
        retry: () => {
          // Could implement retry logic here
          window.location.reload();
        }
      };
    }
  };
}

// Usage
const safeComponent = withErrorBoundary(
  function* () {
    // This might throw an error
    const data = JSON.parse(self().dataset.config || '');
    yield template('<div>{{message}}</div>', data);
    
    throw new Error('Something went wrong!'); // Simulated error
  },
  'Something went wrong. Please try again.',
  (error, element) => {
    // Send error to logging service
    console.error('Logging error for element:', element.id, error);
  }
);

watch('.risky-component', safeComponent);
```

#### Feature Flag Generator

```typescript
// Wraps generators with feature flag checks
export function withFeatureFlag<T extends HTMLElement>(
  flagName: string,
  generator: () => Generator<ElementFn<T>, any, unknown>,
  fallbackGenerator?: () => Generator<ElementFn<T>, any, unknown>
): () => Generator<ElementFn<T>, any, unknown> {
  return function* () {
    const isEnabled = await checkFeatureFlag(flagName);
    
    if (isEnabled) {
      console.log(`🎯 Feature "${flagName}" enabled`);
      yield* generator();
    } else if (fallbackGenerator) {
      console.log(`🚫 Feature "${flagName}" disabled, using fallback`);
      yield* fallbackGenerator();
    } else {
      console.log(`🚫 Feature "${flagName}" disabled, no fallback`);
      // Component does nothing
    }
  };
}

// Usage
const newButtonBehavior = withFeatureFlag(
  'enhanced-buttons',
  function* () {
    // New enhanced behavior
    yield addClass('enhanced');
    yield style({ 
      background: 'linear-gradient(45deg, #007bff, #0056b3)',
      transition: 'all 0.3s ease'
    });
    yield click(() => {
      yield addClass('clicked');
      setTimeout(() => yield removeClass('clicked'), 300);
    });
  },
  function* () {
    // Fallback to old behavior
    yield addClass('basic');
    yield click(() => console.log('Basic click'));
  }
);

watch('button.enhanced', newButtonBehavior);
```

#### Lifecycle Management Generator

```typescript
// Adds standardized lifecycle hooks to any generator
export function withLifecycle<T extends HTMLElement, R = any>(
  generator: () => Generator<ElementFn<T>, R, unknown>,
  options: {
    onMount?: (element: T) => void;
    onUnmount?: (element: T) => void;
    onUpdate?: (element: T) => void;
    enableDebug?: boolean;
  } = {}
): () => Generator<ElementFn<T>, R, unknown> {
  return function* () {
    const element = self() as T;
    const componentName = element.className || element.tagName.toLowerCase();
    
    // Mount lifecycle
    if (options.onMount) {
      options.onMount(element);
    }
    
    if (options.enableDebug) {
      console.log(`🔧 Mounting component: ${componentName}`);
    }
    
    // Setup unmount cleanup
    if (options.onUnmount) {
      cleanup(() => {
        if (options.enableDebug) {
          console.log(`🗑️ Unmounting component: ${componentName}`);
        }
        options.onUnmount!(element);
      });
    }
    
    // Track updates if enabled
    if (options.onUpdate) {
      const observer = new MutationObserver(() => {
        options.onUpdate!(element);
      });
      
      observer.observe(element, {
        attributes: true,
        childList: true,
        subtree: true
      });
      
      cleanup(() => observer.disconnect());
    }
    
    // Execute the wrapped generator
    const result = yield* generator();
    
    if (options.enableDebug) {
      console.log(`✅ Component initialized: ${componentName}`);
    }
    
    return result;
  };
}

// Usage
const lifecycleComponent = withLifecycle(
  function* () {
    const clickCount = createState('clicks', 0);
    
    yield click(() => {
      clickCount.update(c => c + 1);
      yield text(`Clicked ${clickCount.get()} times`);
    });
    
    return {
      getClicks: () => clickCount.get()
    };
  },
  {
    onMount: (el) => console.log(`Component mounted on:`, el),
    onUnmount: (el) => console.log(`Component unmounted from:`, el),
    onUpdate: (el) => console.log(`Component updated:`, el),
    enableDebug: true
  }
);

watch('.lifecycle-component', lifecycleComponent);
```

#### A/B Testing Generator

```typescript
// Enables A/B testing at the component level
export function withABTest<T extends HTMLElement>(
  testName: string,
  variants: Record<string, () => Generator<ElementFn<T>, any, unknown>>,
  options: {
    userIdGetter?: () => string;
    onVariantShown?: (variant: string, userId: string) => void;
  } = {}
): () => Generator<ElementFn<T>, any, unknown> {
  return function* () {
    const userId = options.userIdGetter?.() || 'anonymous';
    const variant = selectVariant(testName, userId, Object.keys(variants));
    
    // Track which variant was shown
    if (options.onVariantShown) {
      options.onVariantShown(variant, userId);
    }
    
    // Store variant info on element for debugging
    const element = self() as T;
    element.dataset.abTest = testName;
    element.dataset.abVariant = variant;
    
    console.log(`🧪 A/B Test "${testName}": showing variant "${variant}" to user ${userId}`);
    
    // Execute the selected variant
    const selectedGenerator = variants[variant];
    if (selectedGenerator) {
      yield* selectedGenerator();
    } else {
      console.warn(`⚠️ A/B Test "${testName}": variant "${variant}" not found`);
    }
  };
}

// Usage
const abTestButton = withABTest(
  'button-style-test',
  {
    control: function* () {
      yield addClass('btn-primary');
      yield text('Click Me');
      yield click(() => console.log('Control clicked'));
    },
    
    variant_a: function* () {
      yield addClass('btn-success');
      yield text('Take Action!');
      yield style({ fontSize: '18px', fontWeight: 'bold' });
      yield click(() => console.log('Variant A clicked'));
    },
    
    variant_b: function* () {
      yield addClass('btn-warning');
      yield text('Get Started');
      yield style({ borderRadius: '25px' });
      yield click(() => console.log('Variant B clicked'));
    }
  },
  {
    userIdGetter: () => getCurrentUserId(),
    onVariantShown: (variant, userId) => {
      analytics.track('ab_test_variant_shown', {
        test: 'button-style-test',
        variant,
        userId
      });
    }
  }
);

watch('.ab-test-button', abTestButton);
```

#### Permission-Based Generator

```typescript
// Wraps generators with permission checks
export function withPermissions<T extends HTMLElement>(
  requiredPermissions: string[],
  generator: () => Generator<ElementFn<T>, any, unknown>,
  unauthorizedGenerator?: () => Generator<ElementFn<T>, any, unknown>
): () => Generator<ElementFn<T>, any, unknown> {
  return function* () {
    const hasPermission = await checkPermissions(requiredPermissions);
    
    if (hasPermission) {
      yield* generator();
    } else {
      console.log(`🔒 Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
      
      if (unauthorizedGenerator) {
        yield* unauthorizedGenerator();
      } else {
        // Default unauthorized behavior
        yield addClass('unauthorized');
        yield text('Access Denied');
        yield click(() => {
          alert('You do not have permission to use this feature.');
        });
      }
    }
  };
}

// Usage
const adminButton = withPermissions(
  ['admin', 'user_management'],
  function* () {
    yield text('Delete User');
    yield addClass('btn-danger');
    yield click(() => {
      if (confirm('Are you sure?')) {
        deleteUser();
      }
    });
  },
  function* () {
    yield text('Contact Admin');
    yield addClass('btn-secondary');
    yield click(() => {
      window.location.href = 'mailto:admin@company.com';
    });
  }
);

watch('.admin-action', adminButton);
```

#### Higher-Order Generator Composition

```typescript
// Combine multiple generator wrappers
export function compose<T extends HTMLElement>(
  ...wrappers: Array<(gen: () => Generator<ElementFn<T>, any, unknown>) => () => Generator<ElementFn<T>, any, unknown>>
) {
  return (generator: () => Generator<ElementFn<T>, any, unknown>) => {
    return wrappers.reduceRight((acc, wrapper) => wrapper(acc), generator);
  };
}

// Usage - apply multiple concerns to a component
const enhancedComponent = compose(
  // Applied in reverse order (inside-out)
  gen => withPerformanceMonitoring('MyComponent', gen),
  gen => withErrorBoundary(gen, 'Component failed to load'),
  gen => withLifecycle(gen, { enableDebug: true }),
  gen => withFeatureFlag('new-ui', gen, () => function* () {
    yield text('Feature disabled');
  })
)(function* () {
  // The actual component logic
  const count = createState('count', 0);
  
  yield click(() => {
    count.update(c => c + 1);
    yield text(`Count: ${count.get()}`);
  });
  
  return {
    getCount: () => count.get()
  };
});

watch('.enhanced-component', enhancedComponent);
```

#### Component Factory Generator

```typescript
// Creates standardized component patterns
export function createComponent<T extends HTMLElement>(
  name: string,
  config: {
    template?: string;
    styles?: Record<string, string>;
    state?: Record<string, any>;
    methods?: Record<string, (...args: any[]) => any>;
    lifecycle?: {
      onMount?: (element: T) => void;
      onUnmount?: (element: T) => void;
    };
  }
): () => Generator<ElementFn<T>, any, unknown> {
  return function* () {
    const element = self() as T;
    
    // Apply template
    if (config.template) {
      yield html(config.template);
    }
    
    // Apply styles
    if (config.styles) {
      yield style(config.styles);
    }
    
    // Initialize state
    const componentState: Record<string, any> = {};
    if (config.state) {
      Object.entries(config.state).forEach(([key, initialValue]) => {
        componentState[key] = createState(key, initialValue);
      });
    }
    
    // Lifecycle hooks
    if (config.lifecycle?.onMount) {
      config.lifecycle.onMount(element);
    }
    
    if (config.lifecycle?.onUnmount) {
      cleanup(() => config.lifecycle!.onUnmount!(element));
    }
    
    // Create public API
    const api: Record<string, any> = {};
    if (config.methods) {
      Object.entries(config.methods).forEach(([methodName, method]) => {
        api[methodName] = (...args: any[]) => {
          return method.call({ element, state: componentState }, ...args);
        };
      });
    }
    
    // Add state getters
    Object.keys(componentState).forEach(key => {
      api[`get${key.charAt(0).toUpperCase() + key.slice(1)}`] = () => {
        return componentState[key].get();
      };
    });
    
    console.log(`🏗️ Component "${name}" created with API:`, Object.keys(api));
    
    return api;
  };
}

// Usage - declarative component creation
const counterComponent = createComponent('Counter', {
  template: '<div class="counter">Count: 0</div>',
  styles: {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px'
  },
  state: {
    count: 0
  },
  methods: {
    increment() {
      this.state.count.update(c => c + 1);
      this.element.textContent = `Count: ${this.state.count.get()}`;
    },
    
    reset() {
      this.state.count.set(0);
      this.element.textContent = 'Count: 0';
    }
  },
  lifecycle: {
    onMount: (el) => {
      el.addEventListener('click', () => {
        // Access the component API through return value
      });
    }
  }
});

watch('.auto-counter', counterComponent);
```

### When NOT to Use Generator Abstractions

**Avoid generator wrapping when:**

1. **Simple functionality** - Use function abstractions instead
2. **One-off behaviors** - Don't abstract what you won't reuse
3. **Performance critical** - Each wrapper adds overhead
4. **Team confusion** - If it makes code harder to understand
5. **Over-engineering** - Start simple, abstract when patterns emerge

**Rule of thumb:** If you find yourself copying the same generator patterns across multiple components, consider a generator abstraction. If you're just adding functionality to elements, use function abstractions.

<br>

## Frequently Asked Questions

### Why doesn't Watch include templating?

**Short answer:** We believe in "bring your own templating" for maximum flexibility.

**Long answer:** Watch is designed to integrate into existing pages where you don't control the DOM structure. This is common in:

- **Server-driven websites** (Rails, Django, PHP applications)
- **E-commerce platforms** with fixed templates
- **CMS systems** like WordPress or Drupal
- **Legacy applications** being modernized incrementally
- **Browser extensions** working with arbitrary websites

By not including templating, Watch can focus on what it does best: reactive DOM observation and element lifecycle management. You can use any templating solution you prefer - Handlebars, Mustache, lit-html, or even just string concatenation.

That said, we may add an opinionated templating module in the future that integrates seamlessly with watch-selector's patterns, but it would be optional and composable with existing solutions.

### Isn't this just jQuery `.live()` but more confusing?

**Yes!** But with significant improvements:

```javascript
// jQuery .live() (deprecated)
$(document).on('click', '.button', function() {
  var clickCount = 0; // This doesn't work - shared across all buttons!
  clickCount++;
  $(this).text('Clicked ' + clickCount + ' times');
});

// Watch equivalent
watch('button', function* () {
  let clickCount = 0; // This works - scoped per button instance
  
  yield click(() => {
    clickCount++; // Each button has its own counter
    yield text(`Clicked ${clickCount} times`);
  });
});
```

**Key improvements over jQuery:**

1. **Type Safety**: Full TypeScript support with element type inference
2. **Element-Scoped State**: Each element gets its own isolated state
3. **Composable Behavior**: Generators can be mixed, matched, and reused  
4. **Automatic Cleanup**: No memory leaks from forgotten event handlers
5. **Modern JavaScript**: Uses generators, async/await, and ES modules
6. **Performance**: Single global observer vs multiple event delegations

### Why not React/Vue/Svelte/Alpine/htmx/Mithril?

**I respect all those libraries!** They're excellent for their intended use cases. But they have different assumptions:

**React/Vue/Svelte:**
- Want complete control of rendering and state
- Assume you're building a Single Page Application
- Require build tools and complex toolchains
- Don't play well with server-rendered markup you can't control

**Alpine.js:**
- Great library! Very similar philosophy to Watch
- Less type-safe, more limited state management
- Watch provides more sophisticated component composition

**htmx:**
- Excellent for server-driven interactions
- Requires server-side coordination
- Watch works purely client-side with any backend

**Mithril:**
- Lightweight and fast
- Still assumes control over rendering
- Not designed for enhancing existing markup

**Watch is designed for different scenarios:**
- Enhancing existing server-rendered pages
- Adding interactivity without controlling the entire page
- Working with legacy systems or third-party markup
- Building browser extensions or user scripts
- Gradual modernization of existing applications

### Why not just use Web Components?

Web Components are great, but they have limitations for Watch's use cases:

**Composition Challenges:**
```javascript
// Web Components - hard to compose behaviors
class MyButton extends HTMLElement {
  connectedCallback() {
    // How do you mix in other behaviors?
    // How do you share this logic with other components?
  }
}

// Watch - easy composition
function* clickBehavior() { yield click(() => console.log('Clicked')); }
function* hoverBehavior() { yield on('hover', () => console.log('Hovered')); }

watch('button', function* () {
  yield* clickBehavior();
  yield* hoverBehavior();
  // Easy to mix and match behaviors
});
```

**Pre-existing Markup:**
```html
<!-- You can't easily turn this into a web component -->
<div class="legacy-widget" data-product-id="123">
  <span class="price">$29.99</span>
  <button class="add-to-cart">Add to Cart</button>
</div>

<!-- But you can easily enhance it with Watch -->
<script>
watch('.legacy-widget', function* () {
  const productId = self().dataset.productId;
  yield click('.add-to-cart', () => addToCart(productId));
});
</script>
```

**Other Web Component limitations:**
- Require defining custom elements upfront
- Don't work well with server-rendered content
- Limited cross-component communication
- Heavyweight for simple enhancements
- Browser compatibility considerations

### How does this compare to arrive.js or mount-observer?

You're right - the core observation pattern is very similar! Watch builds on that foundation:

**arrive.js:**
```javascript
// arrive.js
document.arrive('.button', function() {
  var element = this;
  element.addEventListener('click', function() {
    // No built-in state management
    // No automatic cleanup
    // No composition patterns
  });
});
```

**mount-observer:**
```javascript
// mount-observer  
mountObserver.observe('.button', {
  mount(element) {
    // Similar observation pattern
    // But no state, no composition, no generators
  }
});
```

**Watch adds:**

1. **Lifecycle Context**: Persistent generator scope for each element
2. **State Management**: Built-in element-scoped state with reactivity
3. **Pseudo-Components**: Components with APIs, parent-child relationships
4. **Type Safety**: Full TypeScript integration with element type inference
5. **Composition**: Generators can be mixed, matched, and reused
6. **Automatic Cleanup**: Memory leak prevention
7. **Performance**: Optimized observation and delegation patterns

**Think of it as:** arrive.js + state management + component composition + type safety + modern JavaScript patterns.

### When should I NOT use Watch?

Watch isn't the right choice for every project:

**Don't use Watch when:**

- **Building a new SPA from scratch** - Use React, Vue, or Svelte
- **You control the entire page** - Modern frameworks might be better
- **Server-side rendering is critical** - Use Next.js, Nuxt, or SvelteKit  
- **You need complex routing** - Use a full framework with routing
- **Team prefers component-based architecture** - Stick with what works
- **Performance is absolutely critical** - Vanilla JS might be better
- **You don't need reactivity** - Simple event listeners might suffice

**DO use Watch when:**

- Enhancing existing server-rendered pages
- Building browser extensions or user scripts
- Adding interactivity to CMS or e-commerce sites
- Modernizing legacy applications gradually
- Working with third-party markup you can't control
- Building reusable behaviors for multiple projects
- You want type safety without build complexity

### Is Watch suitable for large applications?

**Yes, with the right patterns:**

**For large applications, use:**
- Component composition with parent-child APIs
- Generator abstractions for cross-cutting concerns
- Custom higher-level abstractions for your domain
- Performance optimization patterns (scoped observers, delegation)
- TypeScript for type safety at scale

**Watch scales well because:**
- Each component is isolated and independently testable
- Behaviors can be composed and reused across teams
- Performance stays consistent regardless of component count
- TypeScript catches integration issues early
- No global state management complexity

Many teams use Watch successfully in production applications with hundreds of components.

### Does Watch support async generators and yield*?

**Yes!** Watch v5+ has full support for advanced generator patterns:

```typescript
// ✅ Async generators
watch('.data-component', async function* () {
  yield text('Loading...');
  
  const data = await fetch('/api/data').then(r => r.json());
  yield template('<div>{{message}}</div>', data);
});

// ✅ Generator delegation with yield*
function* reusableBehavior() {
  yield addClass('interactive');
  yield click(() => console.log('Reusable click!'));
}

watch('button', function* () {
  yield* reusableBehavior();  // Delegate to another generator
  yield text('Enhanced Button');
});

// ✅ Promise yields
watch('.promise-component', function* () {
  yield new Promise(resolve => {
    setTimeout(() => {
      yield text('Delayed content');
      resolve();
    }, 1000);
  });
});

// ✅ Nested composition
function* withErrorHandling(innerGen) {
  try {
    yield* innerGen();
  } catch (error) {
    yield text('Error occurred');
    yield addClass('error');
  }
}
```

**Supported patterns:**
- **Async generators** with `async function*`
- **Generator delegation** with `yield*`
- **Promise yields** - automatically awaited
- **Nested generators** - full recursion support
- **Mixed sync/async** - seamless composition

<br>

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

<br>

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

<br>

## Installation

### npm/pnpm/yarn

```bash
npm install watch-selector
```

### ESM CDN (no build required)

```typescript
import { watch } from 'https://esm.sh/watch-selector';

// Start using immediately
watch('button', function* () {
  yield click(() => console.log('Hello from CDN!'));
});
```

<br>

## Browser Support

Watch v5 supports all modern browsers with:
- MutationObserver
- IntersectionObserver  
- ResizeObserver
- Proxy
- WeakMap/WeakSet

<br>

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

<br>

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

<br>

## License

MIT License - see [LICENSE](../LICENSE) file.
