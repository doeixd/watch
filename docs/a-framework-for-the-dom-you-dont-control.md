# The JavaScript Library for the DOM You Don't Control

I want you to think about a specific kind of web development. It’s not the pristine, greenfield world of a brand-new Next.js or SvelteKit application. It’s messier.

I’m talking about adding features to a big, server-rendered Rails or Django app. I’m talking about writing a user script to enhance a third-party website. I’m talking about building a Chrome extension that needs to inject life into pages you have no control over. I'm talking about the world of HTMX, where the server sends you HTML and you just have to *deal with it*.

In this world, the classic JavaScript approach falls apart instantly:

```javascript
// You write this code on Monday. It works.
document.querySelectorAll('.product-card .add-to-cart').forEach(button => {
  button.addEventListener('click', () => {
    // ... logic to add to cart
  });
});

// On Tuesday, a new feature loads more products onto the page.
// None of the new buttons work. Your JavaScript is broken.
```

For years, the solution was jQuery's magical `.live()` (and later, the more performant `.on()`). You could attach an event listener to elements that didn't exist yet. It was a game-changer. But it had its own problems: state management was a nightmare, and cleanup was a manual, leaky process.

Today, I want to show you a library that feels like the spiritual successor to `.live()`, rebuilt for the modern era with components, state management, and type safety. It's called **Watch**, and it’s a functional and composable tool for the unruly DOM.

## The Ghost of `.live()` Past

The core idea of Watch is simple: you declare behaviors for CSS selectors, and it ensures those behaviors are applied to all matching elements, whether they exist now or are added to the DOM ten minutes from now.

Under the hood, Watch uses a **single global MutationObserver** to efficiently track DOM changes. When elements matching your selectors are added or removed, Watch automatically manages the lifecycle. This scales beautifully—whether you're watching 10 elements or 10,000, the performance overhead remains minimal.

## The Secret Sauce: Generators as Persistent Contexts

Here's where Watch makes its most important design decision. Instead of callbacks or classes, it uses **JavaScript generators** (`function*`) as the foundation for component behavior. This isn't just a clever trick—it's the key insight that makes everything else possible.

Let's see why with the classic "click counter" problem.

Here’s the old, broken way:

```javascript
// This fails spectacularly. The `clicks` variable is shared
// by all buttons, and it's lost if the buttons are re-rendered.
let clicks = 0;
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    clicks++;
    btn.textContent = `Clicked ${clicks} times`;
  });
});
```

Here is the Watch way:

```typescript
// Each button gets its own persistent, isolated world.
watch('.counter-btn', function* () {
  let count = 0; // This state is scoped ONLY to this one button!

  yield click(() => {
    count++; // The state persists across clicks.
    yield text(`Clicked ${count} times`);
  });

  // When the button is removed from the DOM, this entire context,
  // including the state and event listener, is automatically garbage collected.
});
```

This is the "aha!" moment. The generator function creates a persistent execution context for *each matching element*. Unlike callbacks that execute and disappear, generators maintain their state between yields, creating a perfect component lifecycle.

> **Why generators are the perfect choice:** They provide isolated state, declarative syntax, and automatic cleanup—all in one language feature. No classes, no lifecycle methods, no manual memory management.

1.  **Isolated State:** `let count = 0` is unique to every single button.
2.  **Declarative API:** `yield click(...)` and `yield text(...)` clearly describe the behavior.
3.  **Automatic Cleanup:** When an element is removed, its generator instance is discarded. No memory leaks.

It's everything `.live()` promised, but with a proper component model.

## The "Un-Component" Philosophy: An Alternative to Web Components

When we think of components, we often think of Web Components—custom tags like `<my-widget>` with their own encapsulated Shadow DOM and styles. This is great when you control the entire application, but it's a non-starter for the use cases we're talking about. You can't just tell a third-party site to start using your `<my-awesome-button>` tag.

Watch offers a different philosophy: **behavioral components**. It enhances existing HTML instead of replacing it.

This approach gracefully sidesteps the common frustrations of Web Components:

*   **No Custom Tags:** You don't need to define or use custom elements. You attach behavior to a standard `<div class="product-card">`. This is perfect for server-rendered HTML and legacy systems.
*   **No Shadow DOM Drama:** Forget fighting with CSS custom properties to style your component or piercing the shadow boundary to access an inner element. Your global CSS works just as you'd expect.
*   **No Boilerplate:** There’s no `class MyComponent extends HTMLElement { connectedCallback() { ... } }`. You just write a generator function and point it at a selector. It’s lightweight and functional.

You're not creating new *kinds* of elements; you're creating new *behaviors* for existing ones.

> **How does this compare to Alpine.js?** Both libraries excel at enhancing server-rendered HTML. The key difference is where the logic lives: Alpine encourages you to place declarative logic and state inside your HTML (`<div x-data="...">`). Watch keeps all logic and state firmly in your JavaScript, using selectors to connect it to the HTML. Watch is a strong choice if you prefer a clean separation of concerns, the full power of TypeScript, and programmatic composition for more complex behaviors.

## More Than a Utility: A System for Composition

Because Watch is functional at its core, it’s not just for simple event listeners. It's a complete system for building complex, decoupled components.

It starts with **layering**. Imagine you have a core product card component:

```typescript
// --- Core product card functionality (product-card.ts) ---
export const productController = watch('.product-card', function* () {
  // Core logic: add to cart, manage quantity, etc.
  const inCart = createState('inCart', false);
  yield on('click', '.add-btn', () => inCart.set(true));
});
```

Now, a different team needs to add analytics. They don't need to touch the original file. They can simply import the controller and layer a new behavior on top:

```typescript
// --- Analytics layer (analytics.ts) ---
import { productController } from './product-card.js';

productController.layer(function* () {
  yield onVisible(() => {
    analytics.track('product-viewed', { id: self().dataset.productId });
  });
});
```

These two pieces of logic can live in different files, be maintained by different teams, and are completely decoupled. The analytics team can add their tracking layer without ever touching the core component code.

This is powerful **separation of concerns**. But layering is just the beginning. The system naturally scales up to full **component hierarchies**, where parents can orchestrate their children.

This is accomplished by having a child component `return` an API from its generator.

Let's build an interactive dashboard with multiple counters. First, the child component:

```typescript
// Child Component: a single counter button
function* counterWidget() {
  let count = 0;
  yield text(`Count: ${count}`); // Set initial text

  yield click(() => {
    count++;
    yield text(`Count: ${count}`);
  });

  // Expose a public API for the parent
  return {
    getCount: () => count,
    reset: () => {
      count = 0;
      yield text(`Count: ${count}`); // Yield still works inside API methods!
    },
  };
}
```

Now, the parent dashboard can find all its `counterWidget` children and manage them:

```typescript
// Parent Component: the dashboard
watch('.counter-dashboard', function* () {
  // `child` finds all matching elements and gives us a live Map of their APIs.
  // This Map automatically updates as children are added or removed!
  const counterApis = child('.counter-widget', counterWidget);

  // Now the parent can orchestrate its children
  yield click('.reset-all-btn', () => {
    for (const api of counterApis.values()) {
      api.reset();
    }
  });

  yield click('.show-total-btn', () => {
    const total = Array.from(counterApis.values())
                      .reduce((sum, api) => sum + api.getCount(), 0);
    alert(`Total across all counters: ${total}`);
  });
});
```

This is a true component hierarchy. The parent has a clean, type-safe way to interact with its children, all without a virtual DOM and while remaining resilient to the server swapping out the HTML.

This is the ultimate expression of the library's philosophy: it provides a powerful, unopinionated foundation that lets you build the exact abstractions your project needs.

## Finding its Niche

So, who is this for?

Watch sits in a fascinating middle-ground, somewhere between the "bag of utilities" feel of jQuery and the pure, unopinionated minimalism of a library like vanJS. It provides structure and a component model without forcing a full virtual DOM or a complex build process.

It works well when you find yourself in these scenarios:

*   **Progressive Enhancement:** You have a server-rendered site and want to "sprinkle" on rich, stateful interactivity.
*   **Userscripts & Extensions:** You need to reliably and robustly manipulate pages you don't own.
*   **HTMX-Driven Apps:** You need a client-side companion that understands that the DOM is ephemeral and can be replaced at any moment.
*   **Legacy Modernization:** You're slowly refactoring an old jQuery-based app and need a bridge to a more modern, component-based way of thinking without a full rewrite.

Watch isn't here to replace React. It's here to solve a different class of problems—the ones that exist in the messy, unpredictable, and often uncontrollable reality of the web. It’s a reminder that sometimes the most elegant solution isn’t to replace the DOM, but simply to listen to it, and watch it come to life.

> Sometimes the most elegant solution isn't to replace the DOM, but simply to listen to it, and watch it come to life.