/**
 * API Comparison Example
 *
 * This example demonstrates the three different API styles available in watch-selector:
 * 1. Overloaded API - The default flexible API with context-aware overloading
 * 2. Explicit API - Non-overloaded functions with clear, unambiguous names
 * 3. Fluent API - Chainable jQuery-like interface
 */

import { watch, text, addClass, click, attr, style } from 'watch-selector';
import * as explicit from 'watch-selector/explicit';
import { selector, element, $ } from 'watch-selector/fluent';

// ============================================================================
// SCENARIO: Enhance a button with text, classes, styles, and click handler
// ============================================================================

// ----------------------------------------------------------------------------
// 1. OVERLOADED API (Default)
/**
 * Demonstrates the overloaded (default) watch-selector API by updating buttons and selectors in the DOM.
 *
 * Performs three example flows: direct element manipulation (sets text, classes, style, and a click handler on the first <button>),
 * selector-based updates for the `#submit` element (text, class, and an ARIA attribute), and a generator-based watch that
 * applies a sequence of text, class, style, and click actions to matching `button.dynamic` elements.
 *
 * Side effects: mutates DOM elements and registers event listeners.
 */

function enhanceButtonOverloaded() {
  // Direct element manipulation
  const button = document.querySelector('button');
  if (button) {
    text(button, 'Click me!');
    addClass(button, 'primary', 'large');
    style(button as HTMLElement, 'backgroundColor', 'blue');
    click(button as HTMLElement, () => console.log('Clicked!'));
  }

  // Selector-based manipulation
  text('#submit', 'Submit Form');
  addClass('#submit', 'btn-submit');
  attr('#submit', 'aria-label', 'Submit the form');

  // Generator pattern within watch
  watch('button.dynamic', function* () {
    yield text('Dynamic Button');
    yield addClass('interactive');
    yield style({ cursor: 'pointer', padding: '10px' });
    yield click(() => {
      console.log('Dynamic button clicked');
    });
  });
}

// ----------------------------------------------------------------------------
// 2. EXPLICIT API - Clear, unambiguous function names
/**
 * Demonstrates using the Explicit API to perform clear, unambiguous DOM updates and watches.
 *
 * Performs three kinds of operations:
 * - Direct element manipulation (text, classes, style, click handler) when an element is present.
 * - Selector-scoped updates (first-only, all-matches, attribute updates).
 * - Generator-based dynamic updates via `watch` using the explicit generator helpers.
 *
 * Side effects: mutates DOM, registers an event handler, and registers a watch for dynamic elements.
 *
 * Notes:
 * - The explicit getters used here return concrete types: `getTextElement` -> `string`, `getTextFirst` -> `string | null`, `getTextAll` -> `string[]`.
 */

function enhanceButtonExplicit() {
  // Direct element operations - clear intent
  const button = document.querySelector('button');
  if (button) {
    explicit.setTextElement(button, 'Click me!');
    explicit.addClassElement(button, 'primary', 'large');
    explicit.setStyleElement(button as HTMLElement, 'backgroundColor', 'blue');
    explicit.clickElement(button as HTMLElement, () => console.log('Clicked!'));
  }

  // Selector operations - explicit about scope
  explicit.setTextFirst('#submit', 'Submit Form');      // Only first match
  explicit.setTextAll('.status', 'Ready');              // All matches
  explicit.addClassSelector('.items', 'found');         // All matches
  explicit.setAttrSelector('#submit', 'aria-label', 'Submit the form');

  // Get operations - clear return expectations
  const buttonText = explicit.getTextElement(button!);          // Returns string
  const firstText = explicit.getTextFirst('.message');          // Returns string | null
  const allTexts = explicit.getTextAll('.item');                // Returns string[]

  // Generator operations - explicit generator functions
  watch('button.dynamic', function* () {
    yield explicit.textGen('Dynamic Button');
    yield explicit.addClassGen('interactive');
    yield explicit.setStyleGen('cursor', 'pointer');
  });
}

// ----------------------------------------------------------------------------
// 3. FLUENT API - Chainable jQuery-like interface
/**
 * Demonstrates the Fluent API for common DOM updates using chainable calls.
 *
 * Uses element(), selector(), and $() helpers to show single-element chaining,
 * selector-based operations, collection-style (jQuery-like) chaining, and
 * complex traversal (find/parent/siblings). Effects include setting text/html,
 * attributes, styles, classes, and registering event handlers — i.e., it mutates
 * the DOM and attaches listeners as shown.
 */

function enhanceButtonFluent() {
  // Chain operations on single element
  const button = document.querySelector('button');
  if (button) {
    element(button)
      .text('Click me!')
      .addClass('primary', 'large')
      .style('backgroundColor', 'blue')
      .click(() => console.log('Clicked!'))
      .attr('aria-pressed', 'false');
  }

  // Chain operations on selector
  selector('#submit')
    .text('Submit Form')
    .addClass('btn-submit')
    .attr('aria-label', 'Submit the form')
    .style({
      padding: '10px 20px',
      borderRadius: '4px',
      border: 'none'
    })
    .click((e) => {
      e.preventDefault();
      console.log('Form submitted');
    });

  // jQuery-like $ syntax
  $('.items')
    .addClass('found')
    .each((el, i) => {
      console.log(`Item ${i}:`, el);
    })
    .filter('.active')
    .addClass('highlighted');

  // Complex traversal and manipulation
  $('#container')
    .find('.card')
    .addClass('enhanced')
    .find('.title')
    .text('Enhanced Card')
    .parent()
    .find('.content')
    .html('<p>New content</p>')
    .siblings()
    .hide();
}

// ============================================================================
// COMPARISON: Different approaches for common tasks
// ============================================================================

// Task 1: Toggle a class based on current state
/**
 * Toggle the "active" class on three example buttons using three API styles.
 *
 * Performs the following mutations:
 * - Overloaded API: reads and toggles the `active` class on element `#btn1`.
 * - Explicit API: reads and toggles the `active` class on element `#btn2` using the explicit helpers.
 * - Fluent API: toggles the `active` class on selector `#btn3` and updates its text to "Active" or "Inactive" based on the new state.
 *
 * This function has side effects on DOM elements with IDs `btn1`, `btn2`, and `btn3`.
 */

function toggleActiveClass() {
  // Overloaded API
  const button1 = document.querySelector('#btn1');
  if (button1) {
    const isActive = hasClass(button1, 'active');
    toggleClass(button1, 'active', !isActive);
  }

  // Explicit API
  const button2 = document.querySelector('#btn2');
  if (button2) {
    const isActive = explicit.hasClassElement(button2, 'active');
    explicit.toggleClassElement(button2, 'active', !isActive);
  }

  // Fluent API
  selector('#btn3')
    .toggleClass('active')
    .text(selector('#btn3').hasClass('active') ? 'Active' : 'Inactive');
}

// Task 2: Get and set multiple attributes
/**
 * Update anchor elements to open in a new tab and append a referral query param.
 *
 * Uses three API styles shown in this file:
 * - Overloaded: updates the first `a` element (reads and rewrites `href`, sets `target` and `rel`).
 * - Explicit: updates the first `a.external` element via the explicit API equivalents.
 * - Fluent: updates all `a.external` elements with fluent chaining and per-element `href` adjustment.
 *
 * Side effects: mutates DOM elements' `href`, `target`, and `rel` attributes.
 */

function manipulateAttributes() {
  // Overloaded API
  const link1 = document.querySelector('a');
  if (link1) {
    const href = attr(link1, 'href');
    attr(link1, 'href', href + '?ref=app');
    attr(link1, 'target', '_blank');
    attr(link1, 'rel', 'noopener');
  }

  // Explicit API
  const link2 = document.querySelector('a.external');
  if (link2) {
    const href = explicit.getAttrElement(link2, 'href');
    explicit.setAttrElement(link2, 'href', (href || '') + '?ref=app');
    explicit.setAttrElement(link2, 'target', '_blank');
    explicit.setAttrElement(link2, 'rel', 'noopener');
  }

  // Fluent API
  selector('a.external')
    .attr('target', '_blank')
    .attr('rel', 'noopener')
    .each((el) => {
      const href = el.getAttribute('href');
      el.setAttribute('href', (href || '') + '?ref=app');
    });
}

// Task 3: Process a list of items
/**
 * Process elements with the `.item` selector: mark them processed, flag "special" items, and attach a click handler that toggles selection.
 *
 * This demo runs the same workflow three ways:
 * - Overloaded API: uses `watch` + generator yields to add the `processed` class, set `data-processed="true"`, detect `"special"` in text to add `special-item`, and register a click handler that toggles `selected`.
 * - Explicit API: performs the same steps via the `explicit` generator helpers and element utilities.
 * - Fluent API: performs the processing immediately on the matched collection, using chaining and `.each` for per-element checks and `.click` for the toggle handler.
 */

function processItemList() {
  // Overloaded API
  watch('.item', function* () {
    yield addClass('processed');
    yield attr('data-processed', 'true');

    const text = yield text();
    if (text.includes('special')) {
      yield addClass('special-item');
    }

    yield click(function* () {
      yield toggleClass('selected');
    });
  });

  // Explicit API with watch
  watch('.item', function* () {
    yield explicit.addClassGen('processed');
    yield explicit.setAttrGen('data-processed', 'true');

    const text = yield explicit.textGetGen();
    if (text.includes('special')) {
      yield explicit.addClassGen('special-item');
    }

    yield explicit.clickGen(() => {
      const el = this as HTMLElement;
      explicit.toggleClassElement(el, 'selected');
    });
  });

  // Fluent API for immediate processing
  selector('.item')
    .addClass('processed')
    .attr('data-processed', 'true')
    .each((el, i) => {
      const text = el.textContent || '';
      if (text.includes('special')) {
        element(el).addClass('special-item');
      }
    })
    .click(function() {
      element(this).toggleClass('selected');
    });
}

// ============================================================================
// PROS AND CONS OF EACH APPROACH
// ============================================================================

/**
 * OVERLOADED API
 *
 * Pros:
 * - Flexible and context-aware
 * - Concise syntax
 * - Works seamlessly in different contexts
 * - Good TypeScript inference
 *
 * Cons:
 * - Can be ambiguous which overload is called
 * - May have unexpected behavior with certain types
 * - Harder to debug when things go wrong
 * - Complex type definitions
 */

/**
 * EXPLICIT API
 *
 * Pros:
 * - Crystal clear intent
 * - No ambiguity about behavior
 * - Better error messages
 * - Easier to test and mock
 * - Better for learning/onboarding
 *
 * Cons:
 * - More verbose
 * - Need to remember more function names
 * - Less elegant in simple cases
 */

/**
 * FLUENT API
 *
 * Pros:
 * - Elegant chaining syntax
 * - Familiar to jQuery users
 * - Great for multiple operations
 * - Readable flow
 *
 * Cons:
 * - Always returns FluentSelector (not actual values)
 * - Need to break chain for complex logic
 * - Less efficient for single operations
 * - May encourage overly long chains
 */

// ============================================================================
// MIXING APIS - They can work together!
/**
 * Demonstrates mixing the Overloaded, Explicit, and Fluent watch-selector APIs in one flow.
 *
 * Uses the Fluent API to initialize a collection of `.card` elements, the Explicit API for
 * clear per-element checks and targeted mutations, and the Overloaded API inside a `watch`
 * generator for concise event-driven updates. Side effects: mutates DOM (classes, attributes,
 * visibility) and registers a `watch` handler that attaches click behavior to `.card` elements.
 */

function mixedApiExample() {
  // Start with fluent for setup
  const $cards = selector('.card')
    .addClass('initialized')
    .attr('role', 'article');

  // Use explicit for clear operations
  $cards.get().forEach(card => {
    const title = explicit.getTextFirst('.title');
    if (title && title.length > 50) {
      explicit.addClassElement(card, 'long-title');
    }
  });

  // Use overloaded within watch for elegance
  watch('.card', function* () {
    yield click(function* () {
      // Mix explicit for clarity
      const isExpanded = explicit.hasClassElement(this, 'expanded');

      // Use overloaded for conciseness
      yield toggleClass('expanded');
      yield attr('aria-expanded', String(!isExpanded));

      // Use fluent for complex traversal
      element(this)
        .find('.content')
        .toggle(!isExpanded);
    });
  });
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * When to use OVERLOADED API:
 * - General purpose code
 * - Within watch generators
 * - When context is clear
 * - For experienced users
 *
 * When to use EXPLICIT API:
 * - Learning the library
 * - Code reviews and documentation
 * - When debugging issues
 * - Critical/sensitive code paths
 * - Team with varying experience levels
 *
 * When to use FLUENT API:
 * - Multiple operations on same elements
 * - jQuery migration
 * - Interactive prototyping
 * - When readability is priority
 */

// Export functions for testing
export {
  enhanceButtonOverloaded,
  enhanceButtonExplicit,
  enhanceButtonFluent,
  toggleActiveClass,
  manipulateAttributes,
  processItemList,
  mixedApiExample
};
