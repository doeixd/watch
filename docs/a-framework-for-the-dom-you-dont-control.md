# Watch: The JavaScript Library for the DOM You Don't Control

Your JavaScript breaks every Tuesday. Not because you wrote bad code, but because the server-rendered app you're working on just loaded new content, and none of your event listeners survived. Users click buttons that do nothing. Forms submit without validation. The "Add to Cart" functionality that worked perfectly yesterday is now dead code.

This is the reality of building for the DOM you don't control—the world of server-rendered Rails apps, Chrome extensions, userscripts, and HTMX applications. It's messy, unpredictable, and surprisingly common. Yet most JavaScript frameworks pretend this world doesn't exist.

<br />

## The Problem with "Just Use React"

Here's what happens when you try to solve this with traditional approaches:

```javascript
// Monday: This works perfectly
document.querySelectorAll('.product-card .add-to-cart').forEach(button => {
  button.addEventListener('click', handleAddToCart);
});

// Tuesday: Server loads more products via AJAX
// Wednesday: Bug reports start rolling in
// Thursday: You're manually re-running initialization code
// Friday: You're googling "how to detect DOM changes"
```

The fundamental issue is that most JavaScript assumes a stable DOM. Components mount once, manage their own lifecycle, and live in a world where they control their own rendering. But what if you don't control the rendering? What if the server can replace your DOM at any moment?

You could reach for a full framework like React, but then you're committed to client-side rendering, build tools, and explaining to your team why a simple form enhancement now requires a complete architectural overhaul.

For years, jQuery offered a elegant solution to this exact problem with `.live()`. You could attach event listeners to elements that didn't exist yet:

```javascript
// jQuery's magical .live() - worked on future elements
$('.add-to-cart').live('click', handleAddToCart);
```

It was brilliant. No matter when those `.add-to-cart` buttons appeared in the DOM, they would automatically have click handlers. But `.live()` had its own problems: state management was a nightmare, cleanup was manual and error-prone, and performance suffered as the DOM grew larger.

<br />

## Enter Watch

Watch is a JavaScript library that embraces DOM chaos rather than fighting it. It's the spiritual successor to jQuery's `.live()`, rebuilt for the modern era with components, state management, and automatic cleanup. Watch is built on a simple premise: you declare behaviors for CSS selectors, and those behaviors persist no matter what the server throws at you.

```javascript
import { watch } from 'watch-selector';

// This works on Monday, Tuesday, and every day after
watch('.product-card .add-to-cart', function* () {
  yield on('click', handleAddToCart);
});
```

When elements matching your selector are added to the DOM, Watch automatically applies your behavior. When they're removed, it cleans up. When they're replaced, it starts over. Your code becomes resilient to the chaos of dynamic content.

<br />

## The Generator

Watch's secret weapon is generators—JavaScript's most underutilized feature. Instead of callbacks or classes, Watch uses generator functions to create persistent, isolated contexts for each DOM element.

Here's why this is revolutionary. The traditional approach to a click counter fails spectacularly:

```javascript
// This breaks: state is shared across all buttons
let clicks = 0;
document.querySelectorAll('.counter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    clicks++;
    btn.textContent = `Clicked ${clicks} times`;
  });
});
```

The Watch approach succeeds elegantly:

```javascript
// Each button gets its own isolated world
watch('.counter-btn', function* () {
  let count = 0; // This state belongs ONLY to this button
  
  yield text(`Clicked ${count} times`);
  
  yield on('click', () => {
    count++;
    yield text(`Clicked ${count} times`);
  });
});
```

The generator function creates a persistent execution context for each matching element. Unlike callbacks that execute and disappear, generators maintain their state between yields, creating a perfect component lifecycle with three crucial properties:

1. **Isolated State**: Each button has its own `count` variable
2. **Persistent Context**: The state survives across interactions
3. **Automatic Cleanup**: When an element is removed, its generator is garbage collected

This isn't just cleaner code—it's a fundamentally different approach to DOM interaction that makes complex behaviors simple and reliable.

<br />

## Beyond Basic Behaviors

The real power emerges when you start composing behaviors. Because Watch is functional at its core, you can layer, combine, and orchestrate components in ways that would be impossible with traditional DOM manipulation.

### Layering: Adding Features Without Friction

The most common pattern is layering—adding new behaviors to existing ones without touching the original code. Perfect for teams, A/B testing, or progressive enhancement.

```javascript
// Core functionality (maintained by Team A)
const productCard = watch('.product-card', function* () {
  const inCart = yield state('inCart', false);
  
  yield on('click', '.add-btn', () => {
    inCart.set(true);
    yield class('added-to-cart', inCart.get());
  });
});

// Analytics layer (maintained by Team B)
productCard.layer(function* () {
  yield onVisible(() => {
    analytics.track('product-viewed', {
      id: yield attr('data-product-id')
    });
  });
  
  yield on('click', '.add-btn', () => {
    analytics.track('add-to-cart', {
      id: yield attr('data-product-id')
    });
  });
});
```

Two teams, two concerns, zero coupling. The analytics team doesn't need to understand cart logic, and the product team doesn't need to think about tracking. Yet both behaviors work seamlessly together.

### Composition: Building Component Hierarchies

Sometimes you need true parent-child relationships where components communicate. Watch handles this through functional composition—child components return APIs that their parents can use.

```javascript
// Child: A counter widget with an API
function* counterWidget() {
  let count = 0;
  
  yield text(`Count: ${count}`);
  yield on('click', () => {
    count++;
    yield text(`Count: ${count}`);
  });
  
  // Return an API for parent components
  return {
    getCount: () => count,
    reset: () => {
      count = 0;
      yield text(`Count: ${count}`);
    }
  };
}

// Parent: A dashboard that orchestrates its children
watch('.dashboard', function* () {
  const counters = yield children('.counter', counterWidget);
  
  yield on('click', '.reset-all', () => {
    counters.forEach(api => api.reset());
  });
  
  yield on('click', '.show-total', () => {
    const total = counters.reduce((sum, api) => sum + api.getCount(), 0);
    yield text(`.total`, `Total: ${total}`);
  });
});
```

This gives you real component hierarchies with type-safe communication, all while staying resilient to DOM changes.

<br />

## The Philosophy: Enhancement Over Replacement

Watch represents a fundamentally different philosophy from Web Components or framework-based approaches. Instead of replacing HTML with custom elements, Watch enhances existing HTML with rich behavior.

This "enhancement over replacement" approach solves real problems:

- **No Build Tools Required**: Drop in a script tag and start writing components
- **Works with Any Backend**: Your Rails, Django, or PHP app doesn't need to change
- **CSS Just Works**: No Shadow DOM isolation to fight with
- **Progressive Enhancement**: Start simple, add complexity only where needed
- **Team Friendly**: Different teams can enhance the same elements without conflicts

Compare this to Web Components, which require you to define custom elements, manage Shadow DOM, and convince your entire stack to adopt new HTML tags. Or framework approaches, which require you to abandon server-side rendering and commit to client-side architecture.

Watch meets you where you are. It works with your existing HTML, your existing CSS, and your existing deployment process.

<br />

## Why Not Alpine.js or Web Components?

These are valid alternatives, and we considered them carefully when building Watch. Here's why we chose a different path:

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

Watch is a better fit if you prefer keeping state and logic in TypeScript, or need complex programmatic composition patterns.

**Web Components** work well when you control the application, but often you can't get third-party sites to adopt your `<my-awesome-button>` custom elements. Watch enhances existing HTML instead of requiring custom tags.

More importantly, Web Components come with significant overhead:
- Shadow DOM isolation fights with existing CSS
- Custom element registration requires polyfills in older browsers  
- The imperative lifecycle API (`connectedCallback`, `disconnectedCallback`) is verbose compared to Watch's declarative approach

Watch sidesteps these issues by working with standard HTML and CSS, making it perfect for browser extensions, userscripts, and server-rendered applications.

<br />

## When Watch Shines (And When It Doesn't)

Watch excels in specific scenarios:
**Perfect for:**
- **Browser extensions** that enhance third-party sites
- **Userscripts** that add functionality to existing pages
- **HTMX applications** where the server controls rendering
- **Legacy modernization** where you're gradually replacing jQuery

**Not ideal for:**
- **Single-page applications** where you control the entire rendering pipeline
- **Performance-critical applications** that need virtual DOM optimizations
- **Teams fully committed to React/Vue ecosystems**
- **Simple sites** that don't need complex interactions

Watch isn't trying to replace React. It's solving a different class of problems—the ones that exist in the messy, unpredictable reality of web development where you don't control everything.

<br />

## The Bigger Picture

Watch represents a return to the web's core philosophy: progressive enhancement. The idea that you start with working HTML and gradually layer on richer interactions. That you build for resilience, not just for the happy path.

In a world obsessed with controlling every pixel and every interaction, Watch suggests a different approach: embrace the chaos, listen to the DOM, and build behaviors that adapt rather than break.

Sometimes the most elegant solution isn't to replace the DOM, but to watch it come to life.

Ready to try Watch? Check out the [documentation](../README.md) or experiment with it in your next server-rendered project. The DOM is waiting.
