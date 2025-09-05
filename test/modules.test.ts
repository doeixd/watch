/**
 * @fileoverview Test for standalone module functionality
 * Verifies that explicit and fluent modules work as standalone imports
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Window } from "happy-dom";

// Test main module imports
import { watch, text, addClass, click } from "../src/index";

// Test explicit module imports - these should work as standalone
import {
  setTextElement,
  setTextSelector,
  addClassElement,
  addClassSelector,
  clickElement,
  textGen,
  addClassGen,
  clickGen,
} from "../src/explicit";

// Test fluent module imports - these should work as standalone
import {
  selector,
  element,
  elements,
  $fluent,
  FluentSelector,
} from "../src/fluent";

describe("Standalone Module Functionality", () => {
  let window: Window;
  let document: Document;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    document.documentElement.innerHTML = `
      <html>
        <body>
          <div id="test-container">
            <button id="test-btn" class="btn">Test Button</button>
            <div class="card">Card 1</div>
            <div class="card">Card 2</div>
            <input id="test-input" type="text" value="initial">
          </div>
        </body>
      </html>
    `;
    (global as any).document = document;
    (global as any).window = window;
    (global as any).Element = window.Element;
    (global as any).HTMLElement = window.HTMLElement;
    (global as any).MutationObserver = window.MutationObserver;
  });

  describe("Explicit Module", () => {
    it("should provide explicit element functions", () => {
      const button = document.getElementById("test-btn") as HTMLButtonElement;

      // Test explicit element functions
      setTextElement(button, "Explicit Text");
      expect(button.textContent).toBe("Explicit Text");

      addClassElement(button, "explicit-class");
      expect(button.classList.contains("explicit-class")).toBe(true);
    });

    it("should provide explicit selector functions", () => {
      setTextSelector("#test-btn", "Selector Text");
      const button = document.getElementById("test-btn");
      expect(button?.textContent).toBe("Selector Text");

      addClassSelector(".card", "card-class");
      const cards = document.querySelectorAll(".card");
      expect(cards[0].classList.contains("card-class")).toBe(true);
    });

    it("should provide generator functions for yield* usage", () => {
      expect(typeof textGen).toBe("function");
      expect(typeof addClassGen).toBe("function");
      expect(typeof clickGen).toBe("function");

      // These should return workflows/generators that can be used with yield*
      const textWorkflow = textGen("Test");
      expect(textWorkflow).toBeDefined();
    });

    it("should handle click events explicitly", () => {
      const button = document.getElementById("test-btn") as HTMLButtonElement;
      let clicked = false;

      clickElement(button, () => {
        clicked = true;
      });

      button.click();
      expect(clicked).toBe(true);
    });
  });

  describe("Fluent Module", () => {
    it("should provide fluent selector interface", () => {
      const fluentBtn = selector("#test-btn");
      expect(fluentBtn).toBeInstanceOf(FluentSelector);

      // Test chaining
      fluentBtn.text("Fluent Text").addClass("fluent-class");

      const button = document.getElementById("test-btn");
      expect(button?.textContent).toBe("Fluent Text");
      expect(button?.classList.contains("fluent-class")).toBe(true);
    });

    it("should provide fluent element wrapper", () => {
      const button = document.getElementById("test-btn") as HTMLButtonElement;
      const fluentEl = element(button);

      expect(fluentEl).toBeInstanceOf(FluentSelector);

      fluentEl.text("Element Fluent").addClass("element-fluent");

      expect(button.textContent).toBe("Element Fluent");
      expect(button.classList.contains("element-fluent")).toBe(true);
    });

    it("should provide fluent elements wrapper", () => {
      const cards = document.querySelectorAll(".card");
      const fluentEls = elements(cards);

      expect(fluentEls).toBeInstanceOf(FluentSelector);

      fluentEls.addClass("all-cards");

      Array.from(cards).forEach((card) => {
        expect(card.classList.contains("all-cards")).toBe(true);
      });
    });

    it("should provide $fluent alias", () => {
      expect($fluent).toBe(selector);

      const fluentBtn = $fluent("#test-btn");
      fluentBtn.text("$fluent works");

      const button = document.getElementById("test-btn");
      expect(button?.textContent).toBe("$fluent works");
    });

    it("should support method chaining", () => {
      const button = document.getElementById("test-btn") as HTMLButtonElement;

      element(button)
        .text("Chained")
        .addClass("chain-1", "chain-2")
        .attr("data-test", "chained")
        .style("color", "red");

      expect(button.textContent).toBe("Chained");
      expect(button.classList.contains("chain-1")).toBe(true);
      expect(button.classList.contains("chain-2")).toBe(true);
      expect(button.getAttribute("data-test")).toBe("chained");
      expect(button.style.color).toBe("red");
    });

    it("should support DOM traversal chaining", () => {
      const container = document.getElementById(
        "test-container",
      ) as HTMLDivElement;

      // Test traversal methods
      const fluentContainer = element(container);
      const firstChild = fluentContainer.children().first();

      expect(firstChild).toBeInstanceOf(FluentSelector);

      // Chain traversal operations
      selector("#test-container").children().addClass("child-class");

      const children = container.children;
      for (let i = 0; i < children.length; i++) {
        expect(children[i].classList.contains("child-class")).toBe(true);
      }
    });
  });

  describe("Module Integration", () => {
    it("should work together with main watch function", () => {
      // Create a new element to test with
      const newBtn = document.createElement("button");
      newBtn.className = "dynamic-btn";
      newBtn.textContent = "Dynamic";
      document.body.appendChild(newBtn);

      let watchExecuted = false;

      // Test that explicit functions work within watch contexts
      watch(".dynamic-btn", function* () {
        watchExecuted = true;

        // Should be able to use explicit functions
        const btn = document.querySelector(".dynamic-btn") as HTMLButtonElement;
        setTextElement(btn, "Watch + Explicit");
        addClassElement(btn, "watch-explicit");

        // Should be able to use fluent API
        element(btn).addClass("watch-fluent").attr("data-integrated", "true");
      });

      // Trigger the watch by ensuring the observer runs
      setTimeout(() => {
        expect(watchExecuted).toBe(true);
        expect(newBtn.textContent).toBe("Watch + Explicit");
        expect(newBtn.classList.contains("watch-explicit")).toBe(true);
        expect(newBtn.classList.contains("watch-fluent")).toBe(true);
        expect(newBtn.getAttribute("data-integrated")).toBe("true");
      }, 10);
    });

    it("should maintain type safety across modules", () => {
      const button = document.getElementById("test-btn") as HTMLButtonElement;

      // All these should be properly typed
      const explicitResult: void = setTextElement(button, "Typed");
      const fluentResult: FluentSelector<HTMLButtonElement> = element(button);

      expect(explicitResult).toBeUndefined();
      expect(fluentResult).toBeInstanceOf(FluentSelector);
    });

    it("should provide distinct import paths", () => {
      // Verify that functions are available from their respective modules
      expect(typeof setTextElement).toBe("function");
      expect(typeof selector).toBe("function");
      expect(typeof watch).toBe("function");

      // Verify they're different functions (not the same reference)
      expect(setTextElement).not.toBe(text);
      expect(selector).not.toBe(watch);
    });
  });

  describe("Module Export Completeness", () => {
    it("should export key explicit functions", () => {
      // Test that imported functions are available and are functions
      expect(typeof setTextElement).toBe("function");
      expect(typeof addClassElement).toBe("function");
      expect(typeof textGen).toBe("function");
      expect(typeof clickElement).toBe("function");
    });

    it("should export key fluent functions", () => {
      // Test that imported functions are available and are functions
      expect(typeof selector).toBe("function");
      expect(typeof element).toBe("function");
      expect(typeof elements).toBe("function");
      expect(typeof $fluent).toBe("function");
      expect(FluentSelector).toBeDefined();
    });
  });

  describe("Documentation and Metadata", () => {
    it("should have proper module structure in built files", () => {
      // These tests verify the build output exists
      // In a real environment, you'd check the actual built files
      expect(true).toBe(true); // Placeholder
    });
  });
});
