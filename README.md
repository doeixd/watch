[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Deno](https://img.shields.io/badge/Deno-Compatible-green.svg)](https://deno.land/)
[![JSR](https://img.shields.io/badge/JSR-Published-orange.svg)](https://jsr.io/)

# Watch 🕶️

**A type-safe DOM observation library that keeps your JavaScript working when the HTML changes.**

Ever tried adding interactivity to a server-rendered site? You write event listeners, but then the DOM updates and your JavaScript stops working. Or you need different behavior for each instance of an element, but managing that state gets messy fast.

Watch solves this by letting you attach persistent behaviors to CSS selectors. When new elements match your selector, they automatically get the behavior. When they're removed, everything cleans up automatically.

**Perfect for:** Server-rendered sites, Chrome extensions, e-commerce templates, htmx apps, and anywhere you don't control the markup.

## The Problem Watch Solves

Traditional DOM manipulation breaks when content changes:

```typescript
// ❌ This stops working when buttons are re-rendered
document.querySelectorAll('button').forEach(btn => {
  let clicks = 0;
  btn.addEventListener('click', () => {
    clicks++; // State is lost if button is removed/added
    btn.textContent = `Clicked ${clicks} times`;
  });
});
```

Server-rendered sites, Chrome extensions, and dynamic content make this worse. You need:
- **Persistent behavior** that survives DOM changes
- **Instance-specific state** for each element
- **Automatic cleanup** to prevent memory leaks
- **Type safety** so you know what elements you're working with

Watch handles all of this automatically.

<br>

## Table of Contents

- [Quick Start](#quick-start)
- [Why Choose Watch?](#why-choose-watch)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Real-World Examples](#real-world-examples)
- [Advanced Features](#advanced-features)
  - [Advanced Composition: Controllers & Behavior Layering](#advanced-composition-controllers--behavior-layering)
  - [Component Composition: Building Hierarchies](#component-composition-building-hierarchies)
  - [Building Higher-Level Abstractions](#building-higher-level-abstractions)
  - [Scoped Watch: Isolated DOM Observation](#scoped-watch-isolated-dom-observation)
- [Complete API Reference](#complete-api-reference)
- [Performance & Browser Support](#performance--browser-support)
- [Frequently Asked Questions](#frequently-asked-questions)
- [License](#license)

<br>

## Quick Start

```typescript
import { watch, click, text } from 'watch-selector';

// Make all buttons interactive
watch('button', function* () {
  yield click(() => {
    yield text('Button clicked!');
  });
});

// Each button gets its own click counter
watch('.counter-btn', function* (ctx) {
  let count = 0;
  yield click(() => {
    count++;
    yield text(`Clicked ${count} times`);
  });
});
```

That's it! Watch handles all the DOM observation, state management, and cleanup automatically.

<br>

## Why Choose Watch?

### 🔍 **Persistent Element Behavior**
Your code keeps working even when the DOM changes:
```typescript
// Traditional approach breaks when elements are added/removed
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', handler); // Lost if button is re-rendered
});

// Watch approach persists automatically
watch('button', function* () {
  yield click(handler); // Works for all buttons, present and future
});
```

### 🎯 **Type-Safe by Design**
TypeScript knows what element you're working with:
```typescript
watch('input[type="email"]', function* () {
  // TypeScript knows this is HTMLInputElement
  yield on('blur', () => {
    if (!self().value.includes('@')) { // .value is typed
      yield addClass('error');
    }
  });
});
```

### 🧠 **Element-Scoped State**
Each element gets its own isolated state:
```typescript
watch('.counter', function* () {
  let count = 0; // This variable is unique to each counter element
  yield click(() => {
    count++; // Each counter maintains its own count
    yield text(`Count: ${count}`);
  });
});
```

### 🔄 **Works Both Ways**
Functions work directly on elements and in generators:
```typescript
// Direct usage
const button = document.querySelector('button');
text(button, 'Hello');

// Generator usage
watch('button', function* () {
  yield text('Hello');
});
```

### ⚡ **High Performance**
- Single global observer for the entire application
- Efficient batch processing of DOM changes
- Automatic cleanup prevents memory leaks
- Minimal memory footprint with WeakMap storage

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

## Core Concepts

### Watchers
Observe DOM elements and run generators when they appear:
```typescript
const controller = watch('selector', function* () {
  // This runs for each matching element
  yield elementFunction;
});
```

### Generators & Yield
Generators create persistent contexts that survive DOM changes:
```typescript
watch('.component', function* () {
  let state = 0; // Persists for each element's lifetime
  
  yield click(() => {
    state++; // State is maintained across events
    yield text(`State: ${state}`);
  });
  
  // Cleanup happens automatically when element is removed
});
```

**Why generators?** They provide:
- **Persistent execution context** that lives with the element
- **Declarative behavior** through yield statements
- **Automatic cleanup** when elements are removed
- **Composable patterns** for building complex behaviors

### Element Context
Access the current element and its state:
```typescript
watch('.counter', function* () {
  const counter = createState('count', 0);
  const element = self(); // Get current element
  
  yield click(() => {
    counter.update(c => c + 1);
    yield text(`Count: ${counter.get()}`);
  });
});
```

#### Context Parameter
Generators can optionally receive a context parameter for enhanced ergonomics:
```typescript
// Traditional approach (still works)
watch('button', function* () {
  const element = self();
  yield click(() => console.log('Clicked!'));
});

// New context parameter approach
watch('button', function* (ctx) {
  const element = ctx.self(); // Direct access via context
  yield click(() => console.log('Clicked!'));
});
```

**Benefits:**
- **Better discoverability** - TypeScript autocomplete shows all available methods
- **Explicit context** - No reliance on hidden global state
- **Backward compatible** - Existing code continues to work unchanged
- **Mixed usage** - You can use both patterns in the same generator

All primitives support both patterns:
```typescript
watch('form', function* (ctx) {
  // Context object provides direct access to element functions
  const element = ctx.self();
  const input = ctx.el('input');
  const allInputs = ctx.all('input');
  
  // State functions accept optional context parameter
  setState('valid', false, ctx);
  const isValid = getState('valid', ctx);
  
  // Global functions still work (use getCurrentContext internally)
  setState('backup', true);
  const backup = getState('backup');
  
  // Both access the same element's state
  expect(isValid).toBe(getState('valid')); // true - same element
});
```

### State Management
Type-safe, element-scoped reactive state:
```typescript
const counter = createState('count', 0);
const doubled = createComputed(() => counter.get() * 2, ['count']);

watchState('count', (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`);
});
```

<br>

## Real-World Examples

### E-commerce Product Cards
```typescript
watch('.product-card', function* () {
  const inCart = createState('inCart', false);
  
  yield click('.add-to-cart', () => {
    inCart.set(true);
    yield text('.add-to-cart', 'Added to Cart!');
    yield addClass('in-cart');
  });
  
  yield click('.remove-from-cart', () => {
    inCart.set(false);
    yield text('.add-to-cart', 'Add to Cart');
    yield removeClass('in-cart');
  });
});
```

### Form Validation
```typescript
watch('input[required]', function* () {
  yield on('blur', () => {
    if (!self().value.trim()) {
      yield addClass('error');
      yield text('.error-message', 'This field is required');
    } else {
      yield removeClass('error');
      yield text('.error-message', '');
    }
  });
});
```

### Dynamic Content Loading
```typescript
watch('.lazy-content', async function* () {
  yield text('Loading...');
  
  yield onVisible(async () => {
    const response = await fetch(self().dataset.url);
    const html = await response.text();
    yield html(html);
  });
});
```

<br>

## Advanced Features

### Advanced Composition: Controllers & Behavior Layering

Watch introduces **WatchController** objects that transform the traditional fire-and-forget watch operations into managed, extensible systems. Controllers enable **Behavior Layering** - the ability to add multiple independent behaviors to the same set of elements.

### **WatchController Fundamentals**

Every `watch()` call returns a `WatchController` instead of a simple cleanup function:

```typescript
import { watch, layer, getInstances, destroy } from 'watch-selector';

// Basic controller usage
const cardController = watch('.product-card', function* () {
  // Core business logic
  const inCart = createState('inCart', false);
  yield on('click', '.add-btn', () => inCart.set(true));
  yield text('Add to Cart');
});

// The controller provides a handle to the watch operation
console.log(`Watching ${cardController.getInstances().size} product cards`);
```

### **Behavior Layering**

Add multiple independent behaviors to the same elements:

```typescript
// Layer 1: Core functionality
const cardController = watch('.product-card', function* () {
  const inCart = createState('inCart', false);
  yield on('click', '.add-btn', () => inCart.set(true));
});

// Layer 2: Analytics (added later, different module)
cardController.layer(function* () {
  yield onVisible(() => analytics.track('product-view', {
    id: self().dataset.productId
  }));
});

// Layer 3: Animations (added conditionally)
if (enableAnimations) {
  cardController.layer(function* () {
    yield watchState('inCart', (inCart) => {
      if (inCart) {
        yield addClass('animate-add-to-cart');
      }
    });
  });
}
```

### **Dual API: Methods vs Functions**

Controllers support both object-oriented and functional patterns:

```typescript
// Method-based (OOP style)
const controller = watch('.component', baseGenerator);
controller.layer(enhancementGenerator);
controller.layer(analyticsGenerator);

const instances = controller.getInstances();
controller.destroy();

// Function-based (FP style)
const controller = watch('.component', baseGenerator);
layer(controller, enhancementGenerator);
layer(controller, analyticsGenerator);

const instances = getInstances(controller);
destroy(controller);
```

### **Instance Introspection**

Controllers provide read-only access to managed instances:

```typescript
const controller = watch('button', function* () {
  const clickCount = createState('clicks', 0);
  yield click(() => clickCount.update(n => n + 1));
});

// Inspect all managed instances
const instances = controller.getInstances();
instances.forEach((instance, element) => {
  console.log(`Button ${element.id}:`, instance.getState());
});

// State is read-only from the outside
const buttonState = instances.get(someButton)?.getState();
// { clicks: 5 } - snapshot of current state
```

### **Real-World Example: Composable Product Cards**

This example demonstrates how behavior layering enables clean separation of concerns:

```typescript
// --- Core product card functionality ---
// File: components/product-card.ts
export const productController = watch('.product-card', function* () {
  const inCart = createState('inCart', false);
  const quantity = createState('quantity', 1);
  
  yield on('click', '.add-btn', () => {
    inCart.set(true);
    // Update cart through global state or API
  });
  
  yield on('click', '.quantity-btn', (e) => {
    const delta = e.target.dataset.delta;
    quantity.update(q => Math.max(1, q + parseInt(delta)));
  });
});

// --- Analytics layer ---
// File: analytics/product-tracking.ts
import { productController } from '../components/product-card';

productController.layer(function* () {
  // Track product views
  yield onVisible(() => {
    analytics.track('product_viewed', {
      product_id: self().dataset.productId,
      category: self().dataset.category
    });
  });
  
  // Track cart additions
  yield watchState('inCart', (inCart, wasInCart) => {
    if (inCart && !wasInCart) {
      analytics.track('product_added_to_cart', {
        product_id: self().dataset.productId,
        quantity: getState('quantity')
      });
    }
  });
});

// --- Animation layer ---
// File: animations/product-animations.ts
import { productController } from '../components/product-card';

productController.layer(function* () {
  // Animate cart additions
  yield watchState('inCart', (inCart) => {
    if (inCart) {
      yield addClass('animate-add-to-cart');
      yield delay(300);
      yield removeClass('animate-add-to-cart');
    }
  });
  
  // Hover effects
  yield on('mouseenter', () => yield addClass('hover-highlight'));
  yield on('mouseleave', () => yield removeClass('hover-highlight'));
});

// --- Usage in main application ---
// File: main.ts
import './components/product-card';
import './analytics/product-tracking';
import './animations/product-animations';

// All layers are automatically active
// Analytics and animations are completely independent
// Each can be enabled/disabled or modified without affecting others
```

### **State Communication Between Layers**

Layers communicate through shared element state:

```typescript
// Layer 1: Set up shared state
const formController = watch('form', function* () {
  const isValid = createState('isValid', false);
  const errors = createState('errors', []);
  
  yield on('input', () => {
    const validation = validateForm(self());
    isValid.set(validation.isValid);
    errors.set(validation.errors);
  });
});

// Layer 2: React to validation state
formController.layer(function* () {
  yield watchState('isValid', (valid) => {
    yield toggleClass('form-invalid', !valid);
  });
  
  yield watchState('errors', (errors) => {
    yield text('.error-display', errors.join(', '));
  });
});

// Layer 3: Conditional behavior based on state
formController.layer(function* () {
  yield on('submit', (e) => {
    if (!getState('isValid')) {
      e.preventDefault();
      yield addClass('shake-animation');
    }
  });
});
```

### **Controller Lifecycle Management**

Controllers are singleton instances per target - calling `watch()` multiple times with the same selector returns the same controller:

```typescript
// These all return the same controller instance
const controller1 = watch('.my-component', generator1);
const controller2 = watch('.my-component', generator2); // Same controller!
const controller3 = watch('.my-component', generator3); // Same controller!

// All generators are layered onto the same controller
console.log(controller1 === controller2); // true
console.log(controller1 === controller3); // true

// Clean up destroys all layers
controller1.destroy(); // Removes all behaviors for '.my-component'
```

### **Integration with Scoped Utilities**

Controllers work seamlessly with scoped watchers:

```typescript
// Create a scoped controller
const container = document.querySelector('#dashboard');
const scopedController = scopedWatchWithController(container, '.widget', function* () {
  yield addClass('widget-base');
});

// Layer additional behaviors on the scoped controller
scopedController.controller.layer(function* () {
  yield addClass('widget-enhanced');
  yield on('click', () => console.log('Scoped widget clicked'));
});

// Inspect scoped instances
const scopedInstances = scopedController.controller.getInstances();
console.log(`Managing ${scopedInstances.size} widgets in container`);
```

<br>

### Component Composition: Building Hierarchies

Watch supports full parent-child component communication, allowing you to build complex, nested, and encapsulated UIs with reactive relationships.

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

### Building Higher-Level Abstractions

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

### Scoped Watch: Isolated DOM Observation

When you need precise control over DOM observation scope, **scoped watch** creates isolated observers for specific parent elements without event delegation.

### **Key Benefits**

- **🔒 Isolated Observation**: Each watcher has its own MutationObserver scoped to a specific parent
- **🚫 No Event Delegation**: Direct DOM observation without event bubbling overhead  
- **⚡ Better Performance**: Only watches the specific subtree you care about
- **🧹 Automatic Cleanup**: Automatically disconnects when parent is removed from DOM
- **🎛️ Granular Control**: Fine-tune what changes to observe (attributes, character data, etc.)

### **Basic Usage**

```typescript
import { scopedWatch, addClass, text } from 'watch-selector';

// Watch for buttons only within a specific container
const container = document.querySelector('#my-container');
const watcher = scopedWatch(container, 'button', function* () {
  yield addClass('scoped-button');
  yield text('I was found by scoped watch!');
});

// Later cleanup
watcher.disconnect();
```

### **Advanced Options**

```typescript
// Watch attributes and character data within a form
const form = document.querySelector('form');
const formWatcher = scopedWatch(form, 'input', function* () {
  yield addClass('monitored-input');
  yield* setValue(''); // Clear on detection
}, {
  attributes: true,
  attributeFilter: ['value', 'disabled'],
  characterData: true,
  subtree: true // Watch descendants (default: true)
});
```

### **Batch Scoped Watching**

```typescript
// Watch multiple selectors within the same parent
const dashboard = document.querySelector('#dashboard');
const watchers = scopedWatchBatch(dashboard, [
  {
    selector: '.chart',
    generator: function* () {
      yield addClass('chart-initialized');
      yield* setupChart();
    }
  },
  {
    selector: '.widget',
    generator: function* () {
      yield addClass('widget-ready');
      yield* setupWidget();
    },
    options: { attributes: true }
  }
]);

// Later cleanup all watchers
watchers.forEach(watcher => watcher.disconnect());
```

### **One-Time and Timeout Watchers**

```typescript
// Process only the first 3 matching elements
const firstThreeWatcher = scopedWatchOnce(list, '.item', function* () {
  yield addClass('first-batch');
  yield* setupSpecialBehavior();
}, 3);

// Auto-disconnect after 5 seconds
const tempWatcher = scopedWatchTimeout(container, '.temp-element', function* () {
  yield addClass('temporary-highlight');
  yield* animateIn();
}, 5000);
```

### **Matcher Functions**

```typescript
// Use custom logic instead of CSS selectors
const submitButtonMatcher = (el: HTMLElement): el is HTMLButtonElement => {
  return el.tagName === 'BUTTON' && 
         el.getAttribute('type') === 'submit' && 
         el.dataset.important === 'true';
};

const watcher = scopedWatch(container, submitButtonMatcher, function* () {
  yield addClass('important-submit');
  yield style({ backgroundColor: 'red', color: 'white' });
});
```

### **Full Context Integration**

Scoped watchers work seamlessly with all Watch primitives:

```typescript
const watcher = scopedWatch(container, 'li', function* () {
  // Context primitives work perfectly
  const element = yield* self();
  const siblings = yield* all('li');
  const parentContext = yield* ctx();
  
  // State management
  yield* createState('itemIndex', siblings.indexOf(element));
  
  // Event handling
  yield onClick(function* () {
    const index = yield* getState('itemIndex');
    yield text(`Item ${index} clicked`);
  });
  
  // Execution helpers
  yield onClick(debounce(function* () {
    yield addClass('debounced-click');
  }, 300));
});
```

### **When to Use Scoped Watch**

**Use scoped watch when:**
- You need to observe a specific container or component
- Performance is critical (avoid global observer overhead)
- You want isolated behavior that doesn't affect other parts of the page
- You need fine-grained control over what changes to observe

**Use regular watch when:**
- You want to observe elements across the entire document
- You need event delegation for dynamic content
- You want the simplest possible setup

### **Utility Functions**

```typescript
// Get all active watchers for a parent
const activeWatchers = getScopedWatchers(parent);

// Disconnect all watchers for a parent
disconnectScopedWatchers(parent);

// Check watcher status
console.log('Active:', watcher.isActive());
console.log('Parent:', watcher.getParent());
console.log('Selector:', watcher.getSelector());
```

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

**Yes!** Watch has full support for advanced generator patterns:

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

> **Context Parameter Support**: Most generator context functions accept an optional `ctx?` parameter. This allows you to explicitly pass context instead of relying on `getCurrentContext()`. Both patterns work: `self()` uses global context, `self(ctx)` uses passed context.

### Core Functions

| Function | Type | Description |
|----------|------|-------------|
| `watch` | `(target, generator) => WatchController` | Watch for elements and run generators (generators can accept optional context parameter) |
| `run` | `(selector, generator) => void` | Run generator on existing elements (generators can accept optional context parameter) |
| `runOn` | `(element, generator) => void` | Run generator on specific element (generators can accept optional context parameter) |
| `layer` | `(controller, generator) => void` | Add behavior layer to controller |
| `getInstances` | `(controller) => ReadonlyMap<Element, ManagedInstance>` | Get controller's managed instances |
| `destroy` | `(controller) => void` | Destroy controller and all layers |

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
| `on` | `(el?, event\|CustomEvent, handler, options?) => CleanupFn \| ElementFn` | Advanced event listener with generators, queuing, delegation, debounce/throttle, AbortSignal |
| `emit` | `(el?, event, detail?, options?) => void \| ElementFn` | Dispatch custom event with full API support |
| `createCustomEvent` | `(type, detail, options?) => CustomEvent<T>` | Create typed CustomEvent with type inference |
| `click` | `(el?, handler, options?) => CleanupFn \| ElementFn` | Click event with generator support and advanced options |
| `change` | `(el?, handler, options?) => CleanupFn \| ElementFn` | Change event with generator support and advanced options |
| `input` | `(el?, handler, options?) => CleanupFn \| ElementFn` | Input event with generator support and advanced options |
| `submit` | `(el?, handler, options?) => CleanupFn \| ElementFn` | Submit event with generator support and advanced options |
| `createEventBehavior` | `(eventType, behavior, options?) => () => Generator` | Create typed reusable event behavior |
| `composeEventHandlers` | `(...handlers) => EventHandler` | Compose multiple event handlers with async support |
| `delegate` | `(selector, eventType, handler, options?) => ElementFn` | Create delegated event handler with capture/bubble support |

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
| `self` | `(ctx?) => Element` | Get current element (optionally pass context) |
| `el` | `(selector, ctx?) => Element \| null` | Query within current element (optionally pass context) |
| `all` | `(selector, ctx?) => Element[]` | Query all within current element (optionally pass context) |
| `cleanup` | `(fn, ctx?) => void` | Register cleanup function (optionally pass context) |
| `ctx` | `(passedCtx?) => WatchContext` | Get full context object (optionally pass context) |
| `getParentContext` | `(ctx?) => ParentContext \| null` | Get parent component context (optionally pass context) |
| `getCurrentElement` | `() => Element \| null` | Get current element (low-level) |
| `getCurrentContext` | `(ctx?) => WatchContext \| null` | Get current context (low-level, optionally pass context) |

### State Management

| Function | Type | Description |
|----------|------|-------------|
| `createState` | `(key, initial) => TypedState` | Create element-scoped state |
| `createTypedState` | `(key, initial) => TypedState` | Create typed element-scoped state |
| `createComputed` | `(fn, deps) => () => T` | Create computed value |
| `getState` | `(key, ctx?) => T` | Get state value (optionally pass context) |
| `setState` | `(key, val, ctx?) => void` | Set state value (optionally pass context) |
| `updateState` | `(key, fn, ctx?) => void` | Update state value (optionally pass context) |
| `hasState` | `(key, ctx?) => boolean` | Check if state exists (optionally pass context) |
| `deleteState` | `(key, ctx?) => void` | Delete state value (optionally pass context) |
| `watchState` | `(key, handler) => CleanupFn` | Watch state changes |
| `setStateReactive` | `(key, val) => void` | Set state with automatic reactivity |
| `batchStateUpdates` | `(fn) => void` | Batch multiple state updates |
| `createPersistedState` | `(key, initial, storageKey?) => TypedState` | Create localStorage-backed state |
| `clearAllState` | `() => void` | Clear all state for element |
| `debugState` | `() => void` | Debug state for current element |
| `logState` | `() => void` | Log state for current element |

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
| `rateLimit` | `(fn, windowMs, maxCalls) => ElementFn` | Rate limit function calls |
| `timeout` | `(ms, fn) => ElementFn` | Execute with timeout |
| `compose` | `(...fns) => ElementFn` | Compose multiple functions |
| `unless` | `(condition, fn) => ElementFn` | Execute unless condition is true |
| `async` | `(fn) => ElementFn` | Execute async function |

### Context Factories

| Function | Type | Description |
|----------|------|-------------|
| `context` | `(selector, options?) => PreDefinedWatchContext` | Create watch context |
| `contextFor` | `(selector, options?) => PreDefinedWatchContext` | Create context for specific selector |
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
| `debounceGenerator` | `(ms, gen) => GeneratorFn` | Create debounced generator |
| `throttleGenerator` | `(ms, gen) => GeneratorFn` | Create throttled generator |
| `onceGenerator` | `(gen) => GeneratorFn` | Create once-only generator |
| `delayGenerator` | `(ms, gen) => GeneratorFn` | Create delayed generator |
| `batchGenerator` | `(...gens) => GeneratorFn` | Create batched generator |

### Utilities

| Function | Type | Description |
|----------|------|-------------|
| `isElement` | `(value) => boolean` | Check if value is HTMLElement |
| `isElementLike` | `(value) => boolean` | Check if value is element or selector |
| `resolveElement` | `(elementLike) => Element \| null` | Resolve element from selector |
| `batchAll` | `(elements, ...fns) => void` | Apply functions to multiple elements |
| `elDOM` | `(selector) => Element \| null` | Alias for DOM query |
| `allDOM` | `(selector) => Element[]` | Alias for DOM queryAll |
| `$` | `(selector) => Element \| null` | Convenience alias for `el` |

### Component Composition

| Function | Type | Description |
|----------|------|-------------|
| `createChildWatcher` | `(selector, generator, ctx?) => Map<ChildEl, ChildApi>` | Create a reactive collection of child component APIs (optionally pass context) |
| `child` | `(selector, generator, ctx?) => Map<ChildEl, ChildApi>` | Alias for `createChildWatcher` - shorter and more intuitive (optionally pass context) |
| `getParentContext` | `(ctx?) => { element: ParentEl, api: ParentApi } \| null` | Get the context of the parent watcher (optionally pass context) |

### WatchController Interface

```typescript
interface WatchController<El extends HTMLElement = HTMLElement> {
  readonly subject: WatchTarget<El>;
  getInstances(): ReadonlyMap<El, ManagedInstance>;
  layer(generator: () => Generator<ElementFn<El, any>, any, unknown>): void;
  destroy(): void;
}

interface ManagedInstance {
  readonly element: HTMLElement;
  getState(): Readonly<Record<string, any>>;
}
```

### Scoped Controller Functions

| Function | Type | Description |
|----------|------|-------------|
| `scopedWatch` | `(parent, selector, generator, options?) => ScopedWatcher` | Create scoped watcher |
| `scopedWatchWithController` | `(parent, selector, generator, options?) => ScopedWatcher & { controller: WatchController }` | Create scoped watcher with controller |
| `scopedWatchBatch` | `(parent, watchers[]) => ScopedWatcher[]` | Create multiple scoped watchers |
| `scopedWatchBatchWithController` | `(parent, watchers[]) => ScopedWatcher[]` | Create multiple scoped watchers with controllers |
| `scopedWatchTimeout` | `(parent, selector, generator, timeout, options?) => ScopedWatcher` | Create scoped watcher with timeout |
| `scopedWatchOnce` | `(parent, selector, generator, options?) => ScopedWatcher` | Create scoped watcher that runs once |
| `createScopedWatcher` | `(parent, options?) => ScopedWatcher` | Create scoped watcher instance |
| `disconnectScopedWatchers` | `(parent) => void` | Disconnect all scoped watchers for parent |
| `getScopedWatchers` | `(parent) => ScopedWatcher[]` | Get all scoped watchers for parent |

### Observer Utilities

| Function | Type | Description |
|----------|------|-------------|
| `register` | `(element, generator) => void` | Register element with observer |
| `getObserverStatus` | `() => ObserverStatus` | Get current observer status |
| `cleanupObserver` | `() => void` | Cleanup observer resources |

### Enhanced Event Options

```typescript
interface WatchEventListenerOptions extends AddEventListenerOptions {
  /** Enable delegation - listen on parent and match against selector */
  delegate?: string;
  /** Debounce the event handler (milliseconds) */
  debounce?: number;
  /** Throttle the event handler (milliseconds) */
  throttle?: number;
  /** Only handle events from specific elements */
  filter?: (event: Event, element: HTMLElement) => boolean;
  /** All standard AddEventListenerOptions (passive, once, capture, signal) */
}
```

<br>

## Examples

### WatchController & Behavior Layering
```typescript
// Create a controller for product cards
const productController = watch('.product-card', function* () {
  const inCart = createState('inCart', false);
  yield on('click', '.add-btn', () => inCart.set(true));
});

// Layer analytics behavior
productController.layer(function* () {
  yield onVisible(() => {
    analytics.track('product_viewed', { 
      id: self().dataset.productId 
    });
  });
});

// Layer animation behavior conditionally
if (enableAnimations) {
  productController.layer(function* () {
    yield watchState('inCart', (inCart) => {
      if (inCart) yield addClass('animate-bounce');
    });
  });
}

// Inspect managed instances
const instances = productController.getInstances();
console.log(`Managing ${instances.size} product cards`);
```

### Enhanced Event Handling
```typescript
import { watch, on, createCustomEvent } from 'watch-selector';

// 1. CustomEvent with type safety
const userEvent = createCustomEvent('user:login', { 
  userId: 123, 
  username: 'john_doe' 
});

watch('.dashboard', function* () {
  // TypeScript infers the detail type automatically
  yield on(userEvent, (event, element) => {
    console.log(event.detail.userId); // ✅ Type-safe access
    console.log(event.detail.username); // ✅ Type-safe access
  });
});

// 2. Event delegation
watch('.list-container', function* () {
  yield on('click', (event, delegatedElement) => {
    // delegatedElement is the matched .list-item, not .list-container
    console.log('Item clicked:', delegatedElement.textContent);
  }, {
    delegate: '.list-item' // Only handle clicks on list items
  });
});

// 3. Debounced input handling
watch('input[type="search"]', function* () {
  yield on('input', (event, input) => {
    performSearch(input.value);
  }, {
    debounce: 300 // Wait 300ms after user stops typing
  });
});

// 4. AbortSignal support
const controller = new AbortController();

watch('.temporary-element', function* () {
  yield on('click', handler, {
    signal: controller.signal // Automatically cleanup when aborted
  });
});

// Later: controller.abort(); // Removes all listeners

// 5. Throttled scroll events
watch('.scroll-container', function* () {
  yield on('scroll', (event, container) => {
    updateScrollIndicator(container.scrollTop);
  }, {
    throttle: 16 // 60fps throttling
  });
});

// 6. Event filtering
watch('.interactive-area', function* () {
  yield on('click', handler, {
    filter: (event, element) => {
      // Only handle clicks with Ctrl+Click
      return event.ctrlKey;
    }
  });
});

// 7. Multiple options combined
watch('.advanced-button', function* () {
  yield on('click', handler, {
    delegate: '.clickable',
    debounce: 100,
    filter: (event) => !event.defaultPrevented,
    once: true,
    passive: true
  });
});
```

### Advanced Event Handling with Generators

The event handling system provides a powerful, generator-first approach while maintaining full backward compatibility with traditional event listeners:

```typescript
import { watch, on, click } from 'watch-selector';

// 1. Generator Event Handlers with Full Context Access
watch('.interactive-button', function* () {
  yield click(function* (event) {
    // Full access to Watch context!
    const button = self();
    const allButtons = all('.interactive-button');
    
    // Can yield other Watch functions seamlessly
    yield addClass('clicked');
    yield style({ transform: 'scale(0.95)' });
    
    // Async operations with yield
    yield delay(150);
    
    // State management works naturally
    const clickCount = getState('clicks') || 0;
    setState('clicks', clickCount + 1);
    
    yield removeClass('clicked');
    yield style({ transform: 'scale(1)' });
    yield text(`Clicked ${clickCount + 1} times`);
    
    // Can register cleanup for this specific click
    cleanup(() => {
      console.log('Click handler cleaned up');
    });
  });
  
  // Traditional handlers also work and have context access
  yield click((event) => {
    const button = self(); // Works! Context is provided automatically
    const clickCount = getState('traditionalClicks') || 0;
    setState('traditionalClicks', clickCount + 1);
    text(button, `Traditional: ${clickCount + 1}`);
  });
});

// 2. Async Operations Made Simple
watch('.data-loader', function* () {
  yield click(async function* (event) {
    const button = self();
    
    yield addClass('loading');
    yield text('Loading...');
    
    try {
      // Async operation
      const response = await fetch('/api/data');
      const data = await response.json();
      
      yield removeClass('loading');
      yield addClass('success');
      yield text(`Loaded: ${data.name}`);
      
      // Auto-reset after delay
      yield delay(2000);
      yield removeClass('success');
      yield text('Load Data');
      
    } catch (error) {
      yield removeClass('loading');
      yield addClass('error');
      yield text('Failed to load');
      
      yield delay(2000);
      yield removeClass('error');
      yield text('Load Data');
    }
  });
});

// 3. Complex Interactive Components
watch('.hover-card', function* () {
  // Mouse enter with nested event handling
  yield on('mouseenter', function* (event) {
    yield addClass('hovered');
    yield style({
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    });
    
    // Set up temporary mouse leave handler
    yield on('mouseleave', function* () {
      yield removeClass('hovered');
      yield style({
        transform: 'translateY(0)',
        boxShadow: 'none'
      });
    }, { once: true });
  });
});

// 4. Form Handling with Real-time Validation
watch('.smart-form', function* () {
  // Real-time validation with advanced debouncing
  yield on('input', function* (event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Validation logic
    const isValid = value.length >= 3;
    const errorMsg = all('.error-message')[0];
    
    if (isValid) {
      yield removeClass('invalid');
      yield addClass('valid');
      if (errorMsg) yield text(errorMsg, '');
    } else {
      yield removeClass('valid');
      yield addClass('invalid');
      if (errorMsg) yield text(errorMsg, 'Minimum 3 characters required');
    }
    
    // Update form state
    setState('formValid', isValid);
  }, { 
    // Advanced debouncing with leading/trailing edge control
    debounce: { wait: 300, leading: false, trailing: true },
    delegate: 'input[required]',
    delegatePhase: 'bubble', // or 'capture' for capture phase
    queue: 'latest' // Only process the latest input change
  });
});

// 5. Event Composition and Reusability
const clickRippleEffect = createEventBehavior('click', function* (event) {
  const clickX = (event as MouseEvent).clientX;
  const clickY = (event as MouseEvent).clientY;
  const rect = self().getBoundingClientRect();
  
  // Create ripple element
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = `${clickX - rect.left}px`;
  ripple.style.top = `${clickY - rect.top}px`;
  
  self().appendChild(ripple);
  
  yield delay(600);
  ripple.remove();
});

// Apply composed behavior
watch('.material-button', function* () {
  yield click(clickRippleEffect);
});
```

#### Advanced Options Example:

```typescript
watch('.advanced-component', function* () {
  yield on('click', function* (event) {
    // Complex interaction logic
    yield addClass('processing');
    yield delay(100);
    yield removeClass('processing');
  }, {
    // Advanced debouncing with leading edge
    debounce: { wait: 300, leading: true, trailing: false },
    
    // Event delegation with capture phase
    delegate: '.clickable-child',
    delegatePhase: 'capture',
    
    // Queue management for concurrent executions
    queue: 'latest', // 'all' | 'latest' | 'none'
    
    // Event filtering
    filter: (event, element) => !element.disabled,
    
    // Standard addEventListener options
    once: false,
    passive: false,
    signal: abortController.signal
  });
});
```

#### Key Features:

- **Generator-First**: Event handlers can be generators that yield Watch functions
- **Full Context Access**: Access to `self()`, `all()`, `getState()`, `setState()`, etc.
- **Async Support**: Native support for async operations with yield
- **Composable**: Create reusable event behaviors
- **Type-Safe**: Full TypeScript support with proper inference
- **Performance**: Efficient debouncing, throttling, and delegation
- **Queue Control**: Manage concurrent async generator execution
- **Capture/Bubble**: Support for both event phases in delegation

### Interactive Components
```typescript
// Make all buttons interactive
const buttonController = watch('button', function* () {
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

## Performance & Browser Support

### Browser Support
Watch supports all modern browsers with:
- MutationObserver
- IntersectionObserver  
- ResizeObserver
- Proxy
- WeakMap/WeakSet

### Performance

Watch is designed for maximum performance with several key optimizations:

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
