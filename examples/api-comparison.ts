/**
 * API Comparison Example
 *
 * This example demonstrates the three different API styles available in watch-selector:
 * 1. Overloaded API - The default flexible API with context-aware overloading
 * 2. Explicit API - Non-overloaded functions with clear, unambiguous names
 * 3. Fluent API - Chainable jQuery-like interface
 */

import {
  watch,
  text,
  addClass,
  click,
  attr,
  style,
  hasClass,
  toggleClass,
} from "watch-selector";
// import * as explicit from 'watch-selector/explicit';
// import { selector, element, $fluent } from 'watch-selector/fluent';

// ============================================================================
// SCENARIO: Enhance a button with text, classes, styles, and click handler
// ============================================================================

// ----------------------------------------------------------------------------
// 1. OVERLOADED API (Default)
// ----------------------------------------------------------------------------

function enhanceButtonOverloaded() {
  // Direct element manipulation
  const button = document.querySelector("button");
  if (button) {
    text(button, "Click me!");
    addClass(button, "primary", "large");
    style(button as HTMLElement, "backgroundColor", "blue");
    click(button as HTMLElement, () => console.log("Clicked!"));
  }

  // Selector-based manipulation
  text("#submit", "Submit Form");
  addClass("#submit", "btn-submit");
  attr("#submit", "aria-label", "Submit the form");

  // Generator pattern within watch
  watch("button.dynamic", function* () {
    yield text("Dynamic Button");
    yield addClass("interactive");
    yield style({ cursor: "pointer", padding: "10px" });
    yield click(() => {
      console.log("Dynamic button clicked");
    });
  });
}

// ----------------------------------------------------------------------------
// 2. EXPLICIT API - Clear, unambiguous function names
// ----------------------------------------------------------------------------

function enhanceButtonExplicit() {
  // Commented out - explicit module not available yet
  // // Direct element operations - clear intent
  // const button = document.querySelector("button");
  // if (button) {
  //   explicit.setTextElement(button, "Click me!");
  //   explicit.addClassElement(button, "primary", "large");
  //   explicit.setStyleElement(button as HTMLElement, "backgroundColor", "blue");
  //   explicit.clickElement(button as HTMLElement, () => console.log("Clicked!"));
  // }
  // // Selector operations - explicit about scope
  // explicit.setTextFirst("#submit", "Submit Form"); // Only first match
  // explicit.setTextAll(".status", "Ready"); // All matches
  // explicit.addClassSelector(".items", "found"); // All matches
  // explicit.setAttrSelector("#submit", "aria-label", "Submit the form");
  // // Get operations - clear return expectations
  // const buttonText = explicit.getTextElement(button!); // Returns string
  // const firstText = explicit.getTextFirst(".message"); // Returns string | null
  // const allTexts = explicit.getTextAll(".item"); // Returns string[]
  // // Generator operations - explicit generator functions
  // watch("button.dynamic", function* () {
  //   yield explicit.textGen("Dynamic Button");
  //   yield explicit.addClassGen("interactive");
  //   yield explicit.setStyleGen("cursor", "pointer");
  // });
}

// ----------------------------------------------------------------------------
// 3. FLUENT API - Chainable jQuery-like interface
// ----------------------------------------------------------------------------

function enhanceButtonFluent() {
  // Commented out - fluent module not available yet
  // // Chain operations on single element
  // const button = document.querySelector("button");
  // if (button) {
  //   element(button)
  //     .text("Click me!")
  //     .addClass("primary", "large")
  //     .style("backgroundColor", "blue")
  //     .click(() => console.log("Clicked!"))
  //     .attr("aria-pressed", "false");
  // }
  // // Chain operations on selector
  // selector("#submit")
  //   .text("Submit Form")
  //   .addClass("btn-submit")
  //   .attr("aria-label", "Submit the form")
  //   .style({
  //     padding: "10px 20px",
  //     borderRadius: "4px",
  //     border: "none",
  //   })
  //   .click((e) => {
  //     e.preventDefault();
  //     console.log("Form submitted");
  //   });
  // // jQuery-like $ syntax
  // $(".items")
  //   .addClass("found")
  //   .each((el, i) => {
  //     console.log(`Item ${i}:`, el);
  //   })
  //   .filter(".active")
  //   .addClass("highlighted");
  // // Complex traversal and manipulation
  // $("#container")
  //   .find(".card")
  //   .addClass("enhanced")
  //   .find(".title")
  //   .text("Enhanced Card")
  //   .parent()
  //   .find(".content")
  //   .html("<p>New content</p>")
  //   .siblings()
  //   .hide();
}

// ============================================================================
// COMPARISON: Different approaches for common tasks
// ============================================================================

// Task 1: Toggle a class based on current state
// ----------------------------------------------------------------------------

function toggleActiveClass() {
  // Overloaded API
  const button1 = document.querySelector("#btn1") as HTMLElement;
  if (button1) {
    const isActive = hasClass(button1, "active");
    toggleClass(button1, "active", !isActive);
  }

  // Explicit API - commented out
  // const button2 = document.querySelector("#btn2");
  // if (button2) {
  //   const isActive = explicit.hasClassElement(button2, "active");
  //   explicit.toggleClassElement(button2, "active", !isActive);
  // }

  // Fluent API - commented out
  // selector("#btn3")
  //   .toggleClass("active")
  //   .text(selector("#btn3").hasClass("active") ? "Active" : "Inactive");
}

// Task 2: Get and set multiple attributes
// ----------------------------------------------------------------------------

function manipulateAttributes() {
  // Overloaded API
  const link1 = document.querySelector("a");
  if (link1) {
    const href = attr(link1, "href");
    attr(link1, "href", href + "?ref=app");
    attr(link1, "target", "_blank");
    attr(link1, "rel", "noopener");
  }

  // Explicit API - commented out
  // const link2 = document.querySelector("a.external");
  // if (link2) {
  //   const href = explicit.getAttrElement(link2, "href");
  //   explicit.setAttrElement(link2, "href", (href || "") + "?ref=app");
  //   explicit.setAttrElement(link2, "target", "_blank");
  //   explicit.setAttrElement(link2, "rel", "noopener");
  // }

  // Fluent API - commented out
  // selector("a.external")
  //   .attr("target", "_blank")
  //   .attr("rel", "noopener")
  //   .each((el) => {
  //     const href = el.getAttribute("href");
  //     el.setAttribute("href", (href || "") + "?ref=app");
  //   });
}

// Task 3: Process a list of items
// ----------------------------------------------------------------------------

function processItemList() {
  // Overloaded API
  watch(".item", function* () {
    yield addClass("processed");
    yield attr("data-processed", "true");

    const _text = yield text();
    if (_text && _text.includes("special")) {
      yield addClass("special-item");
    }

    yield click(function* () {
      yield toggleClass("selected");
    });
  });

  // Explicit API with watch (commented out - module not available yet)
  // watch('.item', function* () {
  //   yield explicit.addClassGen('processed');
  //   yield explicit.setAttrGen('data-processed', 'true');

  //   const text = yield explicit.textGetGen();
  //   if (text.includes('special')) {
  //     yield explicit.addClassGen('special-item');
  //   }

  //   yield explicit.clickGen(() => {
  //     const el = this as HTMLElement;
  //     explicit.toggleClassElement(el, 'selected');
  //   });
  // });

  // Fluent API for immediate processing (commented out - module not available yet)
  // selector('.item')
  //   .addClass('processed')
  //   .attr('data-processed', 'true')
  //   .each((el) => {
  //     const itemText = element(el).text();
  //     if (itemText.includes('special')) {
  //       element(el).addClass('special-item');
  //     }
  //   })
  //   .click((e, el) => {
  //     element(el).toggleClass('selected');
  //   });
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
// ============================================================================

function mixedApiExample() {
  // Commented out - requires fluent and explicit modules
  // // Start with fluent for setup
  // const $cards = selector(".card")
  //   .addClass("initialized")
  //   .attr("role", "article");

  // // Use explicit for clear operations
  // $cards.get().forEach((card) => {
  //   const title = card.querySelector('.title')?.textContent;
  //   if (title && title.length > 50) {
  //     explicit.addClassElement(card, "long-title");
  //   }
  // });

  // Use overloaded within watch for elegance
  watch(".card", function* () {
    yield click(function* () {
      // // Mix explicit for clarity
      // const isExpanded = explicit.hasClassElement(this, "expanded");

      // Use overloaded for conciseness
      yield toggleClass("selected");
      yield attr("aria-expanded", "false");

      // // Use fluent for complex traversal
      // element(this).find(".content").toggle(!isExpanded);
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
  mixedApiExample,
};
