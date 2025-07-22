/**
 * Test file for the new generator API implementation
 *
 * This file tests the new type-safe generator API pattern with direct yield*
 * syntax, ensuring it works correctly alongside the existing API.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";
import { watch, addClass as classicAddClass } from "../src/index";
import {
  addClass,
  removeClass,
  hasClass,
  text,
  getText,
  getState,
  setState,
  updateState,
  hasState,
  incrementState,
  decrementState,
  toggleState,
  appendToState,
  self,
  query,
  click,
  submit,
  attr,
  style,
} from "../src/generator/index";

describe("Generator API - Direct yield* Pattern", () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    document = dom.window.document;
    global.document = document;
    global.window = dom.window as any;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;
    global.Node = dom.window.Node;
    global.MutationObserver = dom.window.MutationObserver;
    global.IntersectionObserver = class IntersectionObserver {
      constructor(
        callback: IntersectionObserverCallback,
        options?: IntersectionObserverInit,
      ) {}
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
    global.ResizeObserver = class ResizeObserver {
      constructor(callback: ResizeObserverCallback) {}
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  afterEach(() => {
    // Clean up watchers and DOM
    document.body.innerHTML = "";
  });

  describe("Direct yield* syntax", () => {
    it("should execute workflows directly with yield* - no wrapper needed", async () => {
      document.body.innerHTML = '<button id="test">Test</button>';
      const button = document.getElementById("test") as HTMLButtonElement;

      let executed = false;

      const controller = watch("#test", async function* () {
        // Direct yield* syntax - no $ wrapper needed!
        yield* addClass("test-class");
        yield* text("Updated");

        executed = true;
      });

      // Wait for the generator to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(executed).toBe(true);
      expect(button.classList.contains("test-class")).toBe(true);
      expect(button.textContent).toBe("Updated");

      controller.destroy();
    });

    it("should provide perfect type safety for return values", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';

      let capturedElement: HTMLElement | null = null;
      let capturedText: string | null = null;

      const controller = watch("#test", async function* () {
        // These should be perfectly typed through yield* delegation
        capturedElement = yield* self<HTMLDivElement>();
        yield* setState("test", "value");
        const state = yield* getState<string>("test", "default");
        capturedText = state;
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedElement).toBeInstanceOf(dom.window.HTMLDivElement);
      expect(capturedText).toBe("value");

      controller.destroy();
    });
  });

  describe("Pure DOM operations", () => {
    it("should manipulate DOM through direct workflows", async () => {
      document.body.innerHTML = '<div id="test">Original</div>';
      const div = document.getElementById("test") as HTMLDivElement;

      const controller = watch("#test", async function* () {
        yield* addClass("new-class");
        yield* text("New Text");
        yield* attr("data-test", "value");
        yield* style("color", "red");
        yield* style("fontSize", "16px");
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(div.classList.contains("new-class")).toBe(true);
      expect(div.textContent).toBe("New Text");
      expect(div.getAttribute("data-test")).toBe("value");
      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("16px");

      controller.destroy();
    });

    it("should handle class manipulation operations", async () => {
      document.body.innerHTML = '<div id="test" class="original">Test</div>';
      const div = document.getElementById("test") as HTMLDivElement;

      const controller = watch("#test", async function* () {
        yield* addClass("added-class");
        yield* removeClass("original");

        // Test has operation - should return boolean
        const hasAdded = yield* hasClass("added-class");
        expect(hasAdded).toBe(true);

        const hasOriginal = yield* hasClass("original");
        expect(hasOriginal).toBe(false);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(div.classList.contains("added-class")).toBe(true);
      expect(div.classList.contains("original")).toBe(false);

      controller.destroy();
    });

    it("should handle element access operations", async () => {
      document.body.innerHTML =
        '<div id="test"><span class="child">Child</span></div>';

      let capturedSelf: HTMLElement | null = null;
      let capturedChild: HTMLElement | null = null;

      const controller = watch("#test", async function* () {
        // Get self element
        capturedSelf = yield* self<HTMLDivElement>();

        // Query for child
        capturedChild = yield* query<HTMLSpanElement>(".child");
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(capturedSelf).toBeInstanceOf(dom.window.HTMLDivElement);
      expect(capturedChild).toBeInstanceOf(dom.window.HTMLSpanElement);
      expect((capturedChild as HTMLSpanElement | null)?.textContent).toBe(
        "Child",
      );

      controller.destroy();
    });
  });

  describe("Pure state operations", () => {
    it("should manage state through direct workflows", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';

      let finalCount: number | undefined;

      const controller = watch("#test", async function* () {
        // Initialize state
        yield* setState("count", 0);

        // Update state functionally
        const newCount = yield* updateState<number>(
          "count",
          (current) => (current || 0) + 5,
        );
        expect(newCount).toBe(5);

        // Get final state
        finalCount = yield* getState<number>("count");

        // Test state existence
        const hasCount = yield* hasState("count");
        expect(hasCount).toBe(true);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(finalCount).toBe(5);

      controller.destroy();
    });

    it("should handle advanced state operations", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';

      const controller = watch("#test", async function* () {
        // Test increment/decrement
        yield* setState("counter", 10);

        const afterIncrement = yield* incrementState("counter", 3);
        expect(afterIncrement).toBe(13);

        const afterDecrement = yield* decrementState("counter", 5);
        expect(afterDecrement).toBe(8);

        // Test toggle
        yield* setState("flag", false);
        const toggled = yield* toggleState("flag");
        expect(toggled).toBe(true);

        // Test array operations
        yield* setState("items", ["a", "b"]);
        const newItems = yield* appendToState<string>("items", "c");
        expect(newItems).toEqual(["a", "b", "c"]);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      controller.destroy();
    });
  });

  describe("Pure event operations", () => {
    it("should set up event handlers through direct workflows", async () => {
      document.body.innerHTML = '<button id="test">Click me</button>';
      const button = document.getElementById("test") as HTMLButtonElement;

      let clickCount = 0;

      const controller = watch("#test", async function* () {
        yield* click((event) => {
          clickCount++;
          expect(event.type).toBe("click");
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate click
      button.click();
      expect(clickCount).toBe(1);

      // Click again
      button.click();
      expect(clickCount).toBe(2);

      controller.destroy();
    });

    it("should support generator event handlers", async () => {
      document.body.innerHTML = '<button id="test">Click me</button>';
      const button = document.getElementById("test") as HTMLButtonElement;

      let sequence: string[] = [];

      const controller = watch("#test", async function* () {
        yield* click(async function* (event) {
          // Event handlers can also use the generator API!
          sequence.push("start");
          yield* addClass("clicked");
          sequence.push("class-added");
          yield* text("Clicked!");
          sequence.push("text-set");
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate click
      button.click();

      // Wait for async generator to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(sequence).toEqual(["start", "class-added", "text-set"]);
      expect(button.classList.contains("clicked")).toBe(true);
      expect(button.textContent).toBe("Clicked!");

      controller.destroy();
    });
  });

  describe("Composition and advanced patterns", () => {
    it("should support workflow composition", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';
      const div = document.getElementById("test") as HTMLDivElement;

      const controller = watch("#test", async function* () {
        // Compose multiple workflows
        yield* addClass("step-1");
        yield* text("Step 1");
        yield* setState("step", 1);

        yield* addClass("step-2");
        yield* text("Step 2");
        yield* setState("step", 2);

        const finalStep = yield* getState<number>("step");
        expect(finalStep).toBe(2);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(div.classList.contains("step-1")).toBe(true);
      expect(div.classList.contains("step-2")).toBe(true);
      expect(div.textContent).toBe("Step 2");

      controller.destroy();
    });

    it("should work alongside the classic API", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';
      const div = document.getElementById("test") as HTMLDivElement;

      const controller = watch("#test", function* () {
        // Classic API still works - use a simple function that returns ElementFn
        yield (element: HTMLElement) => {
          element.classList.add("classic");
        };

        // But you could also mix in the new API if needed
        // (though in practice, you'd probably pick one style per watcher)
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(div.classList.contains("classic")).toBe(true);

      controller.destroy();
    });

    it("should handle error cases gracefully", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';

      const controller = watch("#test", async function* () {
        try {
          // Operations that might fail
          yield* attr("data-test", "value");

          // This should work fine
          const element = yield* self();
          expect(element).toBeInstanceOf(dom.window.HTMLDivElement);
        } catch (error) {
          // Error handling should work
          console.error("Operation failed:", error);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      controller.destroy();
    });
  });

  describe("Type safety", () => {
    it("should maintain element type inference", async () => {
      document.body.innerHTML = '<input type="text" id="test" />';

      const controller = watch("input#test", async function* () {
        // Element should be inferred as HTMLInputElement
        const input = yield* self<HTMLInputElement>();
        expect(input.type).toBe("text");

        // Should be able to access input-specific properties
        yield* attr("placeholder", "Enter text");
        expect(input.placeholder).toBe("Enter text");
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      controller.destroy();
    });

    it("should infer return types correctly", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';

      const controller = watch("#test", async function* () {
        // String operations
        const textContent = yield* getText();
        expect(typeof textContent).toBe("string");

        // Boolean operations
        const hasClassResult = yield* hasClass("test");
        expect(typeof hasClassResult).toBe("boolean");

        // Element operations
        const element = yield* self();
        expect(element).toBeInstanceOf(dom.window.HTMLDivElement);

        // State operations with generics
        yield* setState("count", 42);
        const count = yield* getState<number>("count", 0);
        expect(typeof count).toBe("number");
        expect(count).toBe(42);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      controller.destroy();
    });
  });

  describe("Real-world patterns", () => {
    it("should support counter component pattern", async () => {
      document.body.innerHTML = '<button id="counter">0</button>';
      const button = document.getElementById("counter") as HTMLButtonElement;

      const controller = watch("#counter", async function* () {
        // Initialize counter state
        yield* setState("count", 0);

        // Set up click handler
        yield* click(async function* (event) {
          // Increment count
          const newCount = yield* incrementState("count", 1);

          // Update display
          yield* text(newCount.toString());

          // Add visual feedback
          yield* addClass("clicked");

          // Remove feedback after delay
          setTimeout(async () => {
            // Note: In a real implementation, you'd want proper cleanup
            await removeClass("clicked");
          }, 150);
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Test the counter
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("1");

      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("2");

      controller.destroy();
    });

    it("should support form handling pattern", async () => {
      document.body.innerHTML = `
        <form id="test-form">
          <input type="text" name="name" required />
          <button type="submit">Submit</button>
        </form>
      `;

      let submittedData: any = null;

      const controller = watch("#test-form", async function* () {
        yield* submit(async function* (event) {
          event.preventDefault();

          // Get form data
          const form = yield* self<HTMLFormElement>();
          const formData = new FormData(form);
          submittedData = Object.fromEntries(formData.entries());

          // Show success state
          yield* addClass("submitted");
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Test form submission
      const form = document.getElementById("test-form") as HTMLFormElement;
      const input = form.querySelector("input") as HTMLInputElement;

      input.value = "John Doe";
      form.dispatchEvent(new dom.window.Event("submit"));

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(submittedData).toEqual({ name: "John Doe" });
      expect(form.classList.contains("submitted")).toBe(true);

      controller.destroy();
    });
  });
});
