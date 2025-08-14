/**
 * @fileoverview Standalone Module Usage Examples
 *
 * This file demonstrates how to use the new standalone explicit and fluent modules
 * introduced in watch-selector v2.1.0. These modules provide dedicated import paths
 * for specific API styles, enabling better tree shaking and clearer intent.
 */

// ============================================================================
// EXPLICIT MODULE USAGE
// ============================================================================

/**
 * The explicit module provides unambiguous function names that clearly indicate
 * what they operate on and what they do. Perfect when you need predictable behavior
 * without overloading ambiguity.
 */

import {
  // Text manipulation
  setTextElement,
  setTextSelector,
  setTextAll,
  getTextElement,

  // Class manipulation
  addClassElement,
  addClassSelector,
  removeClassElement,
  hasClassElement,

  // Event handling
  clickElement,
  clickSelector,

  // Generator workflow functions for yield* usage
  setTextFlow,
  addClassFlow,
  clickFlow,

  // Form handling
  setValueElement,
  getValueElement,
  setCheckedElement,

  // Style manipulation
  setStyleElement,
  setStylesElement,

  // Attribute manipulation
  setAttrElement,
  getAttrElement,
  removeAttrElement,
} from "watch-selector/explicit";

// Main watch function and context functions for integration
import { watch, self } from "watch-selector";

// Example 1: Direct Element Manipulation
function explicitElementExample() {
  const button = document.getElementById("submit-btn") as HTMLButtonElement;
  const form = document.querySelector("form") as HTMLFormElement;

  // Crystal clear function names - no ambiguity about what they do
  setTextElement(button, "Submit Form");
  addClassElement(button, "primary");
  setAttrElement(button, "aria-label", "Submit the form");

  // Event handling with explicit targeting
  clickElement(button, (event) => {
    console.log("Button clicked explicitly");
    addClassElement(button, "clicked");
  });

  // Form manipulation
  const emailInput = document.getElementById("email") as HTMLInputElement;
  setValueElement(emailInput, "user@example.com");
  setCheckedElement(
    document.getElementById("newsletter") as HTMLInputElement,
    true,
  );
}

// Example 2: Selector-Based Operations
function explicitSelectorExample() {
  // Operate on first matching element
  setTextSelector(".status", "Ready");
  addClassSelector("#main-nav", "active");

  // Operate on all matching elements
  setTextAll(".card-title", "Updated Title");
  addClassSelector(".item", "processed");

  // Query and manipulate
  const statusText = getTextElement(document.querySelector(".status")!);
  console.log("Current status:", statusText);

  // Batch operations with explicit targeting
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    addClassElement(card, "enhanced");
    setAttrElement(card, "data-enhanced", "true");
  });
}

// Example 3: Generator Integration with Explicit Functions
function explicitGeneratorExample() {
  watch(".interactive-element", function* () {
    // Within watch generators, use the main API functions that support yield*
    // The explicit module is for direct usage outside of generators
    const currentElement = self();
    
    // Use explicit functions directly on known elements
    setTextElement(currentElement, "Interactive Element Ready");
    addClassElement(currentElement, "initialized");

    // For event handlers within generators, use main API
    yield click(async (event) => {
      const element = event.target as HTMLElement;

      // Use explicit functions directly on known elements
      addClassElement(element, "clicked");
      setTextElement(element, "Clicked!");
      addClassElement(element, "processed");
    });
  });
}

// ============================================================================
// FLUENT MODULE USAGE
// ============================================================================

/**
 * The fluent module provides jQuery-like method chaining for elegant DOM manipulation.
 * Perfect for complex operations that benefit from readable chaining syntax.
 */

import {
  selector,
  element,
  elements,
  $fluent,
  FluentSelector,
} from "watch-selector/fluent";

// Example 4: Basic Fluent Chaining
function fluentBasicExample() {
  // jQuery-like selector chaining
  selector("#main-button")
    .text("Click Me!")
    .addClass("primary", "large")
    .style("backgroundColor", "blue")
    .attr("aria-expanded", "false")
    .click(() => console.log("Fluent button clicked!"));

  // Work with existing elements
  const existingButton = document.querySelector("button") as HTMLButtonElement;
  element(existingButton).addClass("enhanced").text("Enhanced Button").focus();

  // Work with multiple elements
  const allCards = document.querySelectorAll(".card");
  elements(allCards)
    .addClass("styled")
    .style("border", "1px solid #ccc")
    .each((el, index) => {
      element(el).text(`Card ${index + 1}`);
    });
}

// Example 5: Complex DOM Traversal with Chaining
function fluentTraversalExample() {
  // Navigate complex DOM structures with chaining
  selector(".article")
    .find(".header")
    .addClass("article-header")
    .text("Article Header")
    .siblings(".content")
    .addClass("article-content")
    .show()
    .parent()
    .find(".footer")
    .addClass("article-footer")
    .text("Last updated: today");

  // Form handling with traversal
  selector(".form-group")
    .find("label")
    .addClass("required")
    .parent()
    .find("input")
    .attr("required", "true")
    .focus()
    .parent()
    .find(".help-text")
    .show();
}

// Example 6: Integration with Watch System
function fluentWatchIntegration() {
  watch(".dynamic-card", function* () {
    // Use fluent API for initial setup
    const selfElement = self();
    const card = selector(selfElement)
      .addClass("mounted")
      .text("Loading...")
      .style("opacity", "0");

    // Animate in
    setTimeout(() => {
      card.text("Card Loaded!").style("opacity", "1").addClass("loaded");
    }, 100);

    // Add interactive behavior
    yield click(async (event) => {
      const target = event.target as Element;

      // Mix fluent and explicit approaches
      element(target)
        .toggleClass("expanded")
        .style("transition", "all 0.3s ease");

      const isExpanded = hasClassElement(target, "expanded");
      setAttrElement(target, "aria-expanded", String(isExpanded));
    });
  });
}

// Example 7: Advanced Fluent Patterns
function fluentAdvancedExample() {
  // Conditional chaining
  const isDarkMode = document.body.classList.contains("dark-mode");

  selector(".theme-aware")
    .addClass(isDarkMode ? "dark" : "light")
    .style("color", isDarkMode ? "#fff" : "#000")
    .find(".icon")
    .style("filter", isDarkMode ? "invert(1)" : "none")
    .parent()
    .find(".text")
    .text(isDarkMode ? "Dark Mode" : "Light Mode");

  // Event delegation with fluent chaining
  selector(".list-container")
    .on("click", (event) => {
      const target = event.target as Element;
      if (target.matches(".list-item")) {
        element(target)
          .toggleClass("selected")
          .siblings()
          .removeClass("selected");
      }
    })
    .addClass("interactive");

  // Form validation with chaining
  selector(".contact-form")
    .find("input[required]")
    .on("blur", function () {
      const input = this as HTMLInputElement;
      element(input)
        .toggleClass("error", !input.value)
        .siblings(".error-message")
        .toggle(!input.value);
    })
    .parent()
    .find('button[type="submit"]')
    .click((event) => {
      event.preventDefault();

      const formEl = (event.target as Element).closest("form")!;
      const inputs = formEl.querySelectorAll(
        "input[required]",
      ) as NodeListOf<HTMLInputElement>;
      const isValid = Array.from(inputs).every(
        (input) => input.value.length > 0,
      );

      if (isValid) {
        selector(formEl).addClass("submitting");
        // Submit form...
      }
    });
}

// ============================================================================
// HYBRID USAGE PATTERNS
// ============================================================================

/**
 * You can mix and match different module styles based on the task at hand.
 * Each module excels in different scenarios.
 */

// Example 8: Mixed API Usage
function hybridExample() {
  // Use explicit for clear, single operations
  const button = document.getElementById("action-btn") as HTMLButtonElement;
  setTextElement(button, "Action");
  addClassElement(button, "ready");

  // Use fluent for complex chaining
  selector(".sidebar")
    .addClass("collapsible")
    .find(".toggle")
    .click(() => {
      selector(".sidebar").toggleClass("collapsed");
    })
    .parent()
    .find(".content")
    .style("transition", "all 0.3s ease");

  // Use main API for watch/generator patterns
  watch(".notification", function* () {
    const notification = self();
    
    // Use explicit functions directly on the element
    setTextElement(notification, "New notification");
    addClassElement(notification, "show");

    // Mix explicit within generators
    setTimeout(() => {
      addClassElement(notification, "fade-out");

      setTimeout(() => {
        removeClassElement(notification, "show");
        removeClassElement(notification, "fade-out");
      }, 300);
    }, 3000);
  });
}

// Example 9: Tree Shaking Benefits
function treeShakingExample() {
  // When you only need specific functions, import just those modules
  // Bundlers can eliminate unused code from other modules
  // Only need text manipulation? Import explicit
  // Bundle will only include text-related functions
  // Only need chaining? Import fluent
  // Bundle will only include FluentSelector and related code
  // Need full watch system? Import main module
  // Gets complete functionality
}

// Run examples (commented out to prevent execution)
// explicitElementExample();
// explicitSelectorExample();
// explicitGeneratorExample();
// fluentBasicExample();
// fluentTraversalExample();
// fluentWatchIntegration();
// fluentAdvancedExample();
// hybridExample();
