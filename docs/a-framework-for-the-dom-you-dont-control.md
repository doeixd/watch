# The JavaScript Library for the DOM You Don't Control

Your JavaScript breaks every Tuesday.

Not because you wrote bad code, but because the server-rendered app you're enhancing just loaded new content, and none of your event listeners survived. Users click buttons that do nothing. Forms submit without validation. The "Add to Cart" functionality that worked perfectly on Monday is now dead code.

I want you to think about a specific, and very common, kind of web development. It’s not the pristine, greenfield world of a brand-new Next.js or SvelteKit application. It’s messier. I’m talking about adding features to a big, server-rendered Rails or Django app. I’m talking about writing a user script to enhance a third-party website. I’m talking about building a Chrome extension that needs to inject life into pages you have no control over.

In this world, the classic JavaScript approach falls apart.

```javascript
// You write this on Monday. It works.
document.querySelectorAll('.product-card .add-to-cart').forEach(button => {
  button.addEventListener('click', () => { /* ... */ });
});

// On Tuesday, a new feature loads more products.
// None of the new buttons work. Your JavaScript is broken.
```

The fundamental issue is that most JavaScript assumes a stable DOM. Components mount once, manage their own lifecycle, and live in a world where they control their own rendering. But what if you don't control the rendering? What if the server can replace your DOM at any moment?

You could reach for a full framework like React, but then you're committed to client-side rendering, build tools, and explaining to your team why a simple form enhancement now requires a complete architectural overhaul.

For years, jQuery offered a elegant solution to this exact problem with `.live()`. You could attach event listeners to elements that didn't exist yet:

```javascript
// jQuery's magical .live() - worked on future elements
$('.add-to-cart').live('click', handleAddToCart);
```

It was brilliant. No matter when those `.add-to-cart` buttons appeared in the DOM, they would automatically have click handlers. But `.live()` had its own problems: state management was a nightmare, cleanup was manual and error-prone, and performance suffered as the DOM grew larger.

When jQuery deprecated `.live()` in favor of `.on()`, we lost the intuitive "just make it work" approach that made dynamic content feel manageable.

<br />

## Introducing Watch

Watch is a JavaScript library that embraces DOM chaos rather than fighting it. It's the spiritual successor to jQuery's `.live()`, rebuilt for the modern era with components, state management, and automatic cleanup. Watch is built on a simple premise: you declare behaviors for CSS selectors, and those behaviors persist no matter what the server throws at you.

```javascript
import { watch } from 'watch-selector';

// This works on Monday, Tuesday, and every day after
watch('.product-card .add-to-cart', function* () {
  yield on('click', handleAddToCart);
});
```
<br />

## The Secret Sauce: Generators as Component Contexts

Here's where Watch makes its most important design decision. Instead of callbacks or classes, it uses **generators** as the foundation for component behavior. This is the key that makes everything else work so elegantly.

Let's look at the classic "click counter" problem. The traditional, intuitive first draft fails spectacularly because the state is shared across all instances:

```javascript
// This fails. The `clicks` variable is shared by all buttons.
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
  let count = 0; // State is scoped to this button only

  yield text(`Clicked ${count} times`); // Set initial text

  yield click(() => {
    count++; // State persists across clicks
    yield text(`Clicked ${count} times`);
  });

  // Automatic cleanup when element is removed from DOM
});
```

This is the "aha!" moment. The generator function creates a **persistent execution context** for *each matching element*. Unlike callbacks that execute and disappear, generators maintain their state between `yield`s, creating a perfect, lightweight component lifecycle with three crucial properties:

1.  **Isolated State**: Each button gets its own `count` variable.
2.  **Persistent Context**: The state survives across multiple interactions and events.
3.  **Automatic Cleanup**: When an element is removed, its generator instance is discarded. No memory leaks.

It's everything `.live()` promised, but with a modern component model you're used to.

<br />

## The "Un-Component" Philosophy

Watch represents a different philosophy from Web Components or framework-based approaches. Instead of replacing HTML with custom elements, Watch enhances existing HTML with rich behavior.

You're not creating new *kinds* of elements; you're creating new *behaviors* for existing ones. This "enhancement over replacement" approach solves real problems:

- **No Build Tools Required**: Drop in a script tag and start writing components
- **Works with Any Backend**: Your Rails, Django, or PHP app doesn't need to change
- **CSS Just Works**: No Shadow DOM isolation to fight with
- **Progressive Enhancement**: Start simple, add complexity only where needed
- **Team Friendly**: Different teams can enhance the same elements without conflicts

Compare this to Web Components, which require you to define custom elements, manage Shadow DOM, and convince your entire stack to adopt new HTML tags. Or framework approaches, which require you to abandon server-side rendering and commit to client-side architecture. It’s like jQuery’s ethos, but with modern primitives and a real component model.

<br />

## A System for Composition

Where most tools give you components that render DOM, Watch gives you behaviors that **attach** to it. That shift unlocks a surprising amount of composability.

### 🧱 Layering Behavior

Let’s say Team A owns cart logic, and Team B wants to track analytics. Watch lets both teams enhance the same element—no coordination required.

```ts
// Cart logic
const productCard = watch('.product-card', function* () {
  const inCart = createState('inCart', false);
  yield on('click', '.add-btn', () => inCart.set(true));
});

// Analytics logic
productCard.layer(function* () {
  const productId = self().dataset.productId;
  yield onVisible(() => analytics.track('product-viewed', { id: productId }));
});
```

✅ **Takeaway:** Layers let you stack behaviors like middleware—cleanly, safely, and independently.


### 🌲 Parent-Child Composition

Need interaction between components? Watch handles parent-child structure through **functional composition**, not global state or props.

```ts
// A reusable counter component
function* counterWidget() {
  let count = 0;
  yield text(`Count: ${count}`);
  yield click(() => {
    count++;
    yield text(`Count: ${count}`);
  });

  return {
    getCount: () => count,
    reset: () => {
      count = 0;
      yield text(`Count: ${count}`);
    }
  };
}
```

In the parent:

```ts
watch('.dashboard', function* () {
  const counters = child('.counter', counterWidget);

  yield click('.reset-all', () => {
    for (const api of counters.values()) api.reset();
  });
});
```

✅ **Takeaway:** Components don’t just render—they expose APIs. You get clean, scoped communication without a framework.


### 🧩 Higher-Order Behavior

Now imagine you want error handling, feature flags, and performance tracking—without jamming it into every component manually.

Watch supports **behavior composition** out of the box:

```ts
const composedEnhancer = compose(
  gen => withFeatureFlag('new-widget-ui', gen),
  gen => withErrorBoundary(gen, '<p>Widget failed to load.</p>'),
  gen => withPerformanceMonitoring('MySuperWidget', gen)
);
```

Your core logic stays focused:

```ts
const enhancedWidget = composedEnhancer(function* mySuperWidget() {
  const count = createState('count', 0);
  yield text(`Clicked ${count.get()} times`);
  yield click(() => {
    count.update(c => c + 1);
    yield text(`Clicked ${count.get()} times`);
  });
});

watch('.super-widget', enhancedWidget);
```

✅ **Takeaway:** `compose()` gives you declarative pipelines for UI behavior—just like middleware, but for components.


<br />

## Finding Watch's Niche

These are valid alternatives, and I considered them carefully when building Watch. Here's why I chose a different path:

**Alpine.js** is excellent for declarative interactions. The key difference is architectural: Alpine encourages you to place logic and state directly in your HTML (`<div x-data="{ count: 0 }" x-on:click="count++">`), while Watch keeps all logic in JavaScript using selectors to connect it to the DOM.

```html
<!-- Alpine approach -->
<div x-data="{ count: 0 }" x-on:click="count++">
  <span x-text="count"></span>
</div>
```

```javascript
// Watch approach
watch('[data-counter]', function* () {
  let count = 0;
  yield text(count);
  yield on('click', () => {
    count++;
    yield text(count);
  });
});
```

Watch is a better fit if you prefer clean separation of concerns, want the full power of TypeScript for complex logic, or need the kind of programmatic composition patterns I've shown above.

**Web Components** work well when you control the entire application, but they're a non-starter for our use cases. You can't get third-party sites to adopt your `<my-awesome-button>` custom elements. Watch enhances existing HTML instead of requiring custom tags.

More importantly, Web Components come with significant overhead:
- Shadow DOM isolation fights with existing CSS
- Custom element registration requires polyfills in older browsers  
- The imperative lifecycle API (`connectedCallback`, `disconnectedCallback`) is verbose compared to Watch's declarative approach

Watch sidesteps these issues by working with standard HTML and CSS, making it perfect for browser extensions, userscripts, and server-rendered applications.

<br />

## When Watch Shines (And When It Doesn't)

So, who is this for? Watch sits in a fascinating middle-ground, somewhere between the "bag of utilities" feel of jQuery and the structured component model of modern frameworks. It provides structure without forcing a complete architectural commitment.
It works well when you find yourself in these scenarios:
- **Browser extensions** that enhance third-party sites
- **Userscripts** that add functionality to existing pages
- **HTMX applications** where the server controls rendering
- **Legacy modernization** where you're gradually replacing jQuery

**Not ideal for:**
- **Single-page applications** where you control the entire rendering pipeline
- **Performance-critical applications** that need virtual DOM optimizations
- **Teams fully committed to React/Vue ecosystems**
- **Simple sites** that don't need complex interactions

Watch isn't trying to replace React—it's here to solve a different class of problems. The ones that exist in the messy, unpredictable, and often uncontrollable reality of web development.

<br />

## The Bigger Picture

Watch represents a return to the web's core philosophy: progressive enhancement. The idea that you start with working HTML and gradually layer on richer interactions.

In a time where frameworks own everything on the page, Watch suggests a different approach: embrace the chaos, listen to the DOM, and build behaviors that adapt.

Sometimes the most elegant solution isn't to own the DOM, but to *watch* it come to life.

Ready to give it a try? Check out the [documentation](../README.md) and let me know what you think. Watch is still evolving, and feedback from real-world usage helps make it better.
