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

For years, the solution was jQuery's magical `.live()`. You could attach an event listener to elements that didn't exist yet. It was a game-changer. But it had its own problems: state management was a nightmare, and cleanup was a manual, leaky process.

Today, I want to show you a library that feels like the spiritual successor to `.live()`, rebuilt for the modern era with components, state management, and type safety. It's called **Watch**, and it’s a functional and composable tool for the unruly DOM.

## The Ghost of `.live()` Past

The core idea of Watch is simple: you declare behaviors for CSS selectors, and it ensures those behaviors are applied to all matching elements, whether they exist now or are added to the DOM ten minutes from now.

Under the hood, Watch uses a MutationObserver to track DOM changes. When elements matching your selectors are added or removed, Watch automatically manages the lifecycle.

## The Secret Sauce: Generators as Persistent Contexts

Here's where Watch makes its most important design decision. Instead of callbacks or classes, it uses  generators as the foundation for component behavior. This is the key that makes everything else ergonomic.

Let's see how with the classic "click counter" problem.

Here’s the traditional, intuitive, first-draft way:

```javascript
// This fails. The `clicks` variable is shared
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

It's everything `.live()` promised, but with a modern component model you're used to.

## The "Un-Component" Philosophy: An Alternative to Web Components

When we think of components, we often think of Web Components—custom tags like `<my-widget>` with their own encapsulated Shadow DOM and styles. This is great when you control the entire application, but it's a non-starter for the use cases we're talking about. You often can't get a third-party  to start using your `<my-awesome-button>` tag.

Watch offers a different philosophy: **behavioral components**. It enhances existing HTML instead of replacing it.

This approach gracefully sidesteps the common frustrations of Web Components:

*   **No Custom Tags:** You don't need to define or use custom elements. You attach behavior to a standard `<div class="product-card">`. This is perfect for server-rendered HTML and legacy systems.
*   **No Shadow DOM:** Forget fighting with CSS custom properties to style your component or piercing the shadow boundary to access an inner element. Your global CSS works just as you'd expect.
*   **No Boilerplate:** There’s no `class MyComponent extends HTMLElement { connectedCallback() { ... } }`. You just write a function and point it at a selector. It’s lightweight and functional.

You're not creating new *kinds* of elements; you're creating new *behaviors* for existing ones.

> **How does this compare to Alpine.js?** Both libraries excel at enhancing server-rendered HTML. The key difference is where the logic lives: Alpine encourages you to place declarative logic and state inside your HTML (`<div x-data="...">`). Watch keeps all logic and state firmly in your JavaScript, using selectors to connect it to the HTML. Watch is a strong choice if you prefer a clean separation of concerns, the full power of TypeScript, and programmatic composition for more complex behaviors.

## More Than a Utility: A System for Composition

Because Watch is functional at its core, it’s not just for simple event listeners. It's a complete system for building complex, decoupled behaviors.

It starts with **layering**. Imagine you have a core product card behavior:

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

These two pieces of logic can live in different files, be maintained by different teams, and are completely decoupled. The analytics team can add their tracking layer without ever touching the core behavior's code.

This is powerful **separation of concerns**. But this is just one form of composition. The system also allows for **functional composition**, where a container behavior can aggregate and coordinate the behaviors of the elements within it.

This is achieved using a classic functional pattern: a function that returns other functions. The generator for an inner behavior can `return` a contract—a set of functions that control its internal state.

Let's build an interactive dashboard with multiple counters. First, the behavior for a single counter item:

```typescript
// Inner Behavior: a single counter widget
function* counterWidget() {
  let count = 0;
  yield text(`Count: ${count}`); // Set initial text

  yield click(() => {
    count++;
    yield text(`Count: ${count}`);
  });

  // Return a "contract" of functions for a consumer to use.
  return {
    getCount: () => count,
    reset: () => {
      count = 0;
      yield text(`Count: ${count}`); // Yield still works inside these functions!
    },
  };
}
```

Now, the container—the dashboard—can instantiate this behavior on all its inner elements and compose their returned functions:

```typescript
// Container Behavior: the dashboard
watch('.counter-dashboard', function* () {
  // `child` instantiates `counterWidget` on each matching element
  // and returns a live Map of their resulting "contracts".
  // This Map automatically updates as elements are added or removed!
  const counterContracts = child('.counter-widget', counterWidget);

  // Now the container can use the contracts to coordinate the inner widgets.
  yield click('.reset-all-btn', () => {
    for (const contract of counterContracts.values()) {
      contract.reset();
    }
  });

  yield click('.show-total-btn', () => {
    const total = Array.from(counterContracts.values())
                      .reduce((sum, contract) => sum + contract.getCount(), 0);
    alert(`Total across all counters: ${total}`);
  });
});
```

This is true functional composition, applied directly to the DOM. The container behavior isn't tightly coupled to the inner behavior; it just consumes the contract it returns. This creates a clean, decoupled system where complex UIs are built by composing smaller, independent functions, all without a virtual DOM and while remaining resilient to the server swapping out the HTML.

This is the ultimate expression of the library's philosophy: it provides a powerful, unopinionated foundation that lets you build the exact abstractions your project needs.

## Finding its Niche

So, who is this for?

Watch sits in a fascinating middle-ground, somewhere between the "bag of utilities" feel of jQuery and the pure, unopinionated minimalism of a library like VanJS. It provides structure and a component model without forcing a full virtual DOM or a complex build process.

It works well when you find yourself in these scenarios:

*   **Progressive Enhancement:** You have a server-rendered site and want to "sprinkle" on rich, stateful interactivity.
*   **Userscripts & Extensions:** You need to reliably and robustly manipulate pages you don't own.
*   **HTMX-Driven Apps:** You need a client-side companion that understands that the DOM is ephemeral and can be replaced at any moment.
*   **Legacy Modernization:** You're slowly refactoring an old jQuery-based app and need a bridge to a more modern, component-based way of thinking without a full rewrite.

Watch isn't here to replace React. It's here to solve a different class of problems—the ones that exist in the messy, unpredictable, and often uncontrollable reality of the web. It’s a reminder that sometimes the most elegant solution isn’t to replace the DOM, but simply to listen to it, and watch it come to life.

> Sometimes the most elegant solution isn't to replace the DOM, but simply to listen to it, and watch it come to life.

## Give it a Try

If this sounds useful for your project, I'd love for you to check out [the README](../README.md) and let me know what you think. Watch is still evolving, and feedback from real-world usage helps make it better.
