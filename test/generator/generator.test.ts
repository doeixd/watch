/**
 * @fileoverview Tests for the generator submodule
 *
 * This test file verifies that the generator submodule functions correctly
 * create Workflows that can be used with yield* syntax.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { watch } from "../../src/watch";
import {
  text,
  getText,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  attr,
  getAttr,
  style,
  getStyle,
  self,
  query,
  queryAll,
  delay,
  show,
  hide,
  focus,
  blur,
} from "../../src/generator/dom";
import {
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
  incrementState,
  decrementState,
  toggleState,
  appendToState,
  prependToState,
  removeFromState,
  mergeState,
} from "../../src/generator/state";
import {
  click,
  input,
  change,
  submit,
  onFocus,
  onBlur,
  on,
  emit,
  onMount,
  onUnmount,
} from "../../src/generator/events";

describe("Generator Submodule", () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container for test elements
    container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up after each test
    document.body.removeChild(container);
  });

  describe("DOM Operations", () => {
    it("should set and get text content using yield*", async () => {
      const button = document.createElement("button");
      container.appendChild(button);

      await watch(button, async function* () {
        // Set text using yield*
        yield* text("Hello World");

        // Get text using yield*
        const content = yield* getText();
        expect(content).toBe("Hello World");
      });
    });

    it("should manipulate classes using yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      await watch(div, async function* () {
        // Add a class
        yield* addClass("active");
        expect(div.classList.contains("active")).toBe(true);

        // Check if class exists
        const hasActive = yield* hasClass("active");
        expect(hasActive).toBe(true);

        // Toggle class
        const toggleResult = yield* toggleClass("highlighted");
        expect(toggleResult).toBe(true);
        expect(div.classList.contains("highlighted")).toBe(true);

        // Remove class
        yield* removeClass("active");
        expect(div.classList.contains("active")).toBe(false);
      });
    });

    it("should manipulate attributes using yield*", async () => {
      const inputElement = document.createElement("input");
      container.appendChild(inputElement);

      await watch(inputElement, async function* () {
        // Set attribute
        yield* attr("placeholder", "Enter text...");
        expect(inputElement.getAttribute("placeholder")).toBe("Enter text...");

        // Get attribute
        const placeholder = yield* getAttr("placeholder");
        expect(placeholder).toBe("Enter text...");
      });
    });

    it("should manipulate styles using yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      await watch(div, async function* () {
        // Set style
        yield* style("color", "red");
        expect(div.style.color).toBe("red");

        // Get computed style
        const color = yield* getStyle("color");
        expect(color).toBeTruthy(); // Computed style format may vary
      });
    });

    it("should get element reference using yield*", async () => {
      const button = document.createElement("button");
      button.textContent = "Test Button";
      container.appendChild(button);

      await watch(button, async function* () {
        // Get self reference
        const element = yield* self<HTMLButtonElement>();
        expect(element).toBe(button);
        expect(element.tagName).toBe("BUTTON");
        expect(element.textContent).toBe("Test Button");
      });
    });

    it("should query child elements using yield*", async () => {
      const parent = document.createElement("div");
      parent.innerHTML = `
        <span class="child">Child 1</span>
        <span class="child">Child 2</span>
        <div class="other">Other</div>
      `;
      container.appendChild(parent);

      await watch(parent, async function* () {
        // Query single element
        const firstChild = yield* query<HTMLSpanElement>(".child");
        expect(firstChild?.textContent).toBe("Child 1");

        // Query all elements
        const allChildren = yield* queryAll<HTMLSpanElement>(".child");
        expect(allChildren.length).toBe(2);
        expect(allChildren[0].textContent).toBe("Child 1");
        expect(allChildren[1].textContent).toBe("Child 2");
      });
    });

    it("should handle visibility operations using yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      await watch(div, async function* () {
        // Hide element
        yield* hide();
        expect(div.style.display).toBe("none");

        // Show element
        yield* show();
        expect(div.style.display).toBe("block");
      });
    });

    it("should handle focus operations using yield*", async () => {
      const inputElement = document.createElement("input");
      container.appendChild(inputElement);

      const focusSpy = vi.spyOn(inputElement, "focus");
      const blurSpy = vi.spyOn(inputElement, "blur");

      await watch(inputElement, async function* () {
        // Focus element
        yield* focus();
        expect(focusSpy).toHaveBeenCalled();

        // Blur element
        yield* blur();
        expect(blurSpy).toHaveBeenCalled();
      });
    });
  });

  describe("State Operations", () => {
    it("should manage state using yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      await watch(div, async function* () {
        // Set state
        yield* setState("counter", 0);

        // Get state
        const counter = yield* getState<number>("counter");
        expect(counter).toBe(0);

        // Update state
        const newValue = yield* updateState<number>(
          "counter",
          (val) => (val || 0) + 1,
        );
        expect(newValue).toBe(1);

        // Check if state exists
        const hasCounter = yield* hasState("counter");
        expect(hasCounter).toBe(true);

        // Delete state
        const deleted = yield* deleteState("counter");
        expect(deleted).toBe(true);
      });
    });

    it("should handle numeric state operations using yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      await watch(div, async function* () {
        // Initialize counter
        yield* setState("count", 5);

        // Increment
        const incremented = yield* incrementState("count", 3);
        expect(incremented).toBe(8);

        // Decrement
        const decremented = yield* decrementState("count", 2);
        expect(decremented).toBe(6);
      });
    });

    it("should handle boolean state operations using yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      await watch(div, async function* () {
        // Set initial state
        yield* setState("isActive", false);

        // Toggle state
        const toggled1 = yield* toggleState("isActive");
        expect(toggled1).toBe(true);

        const toggled2 = yield* toggleState("isActive");
        expect(toggled2).toBe(false);
      });
    });

    it("should handle array state operations using yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      await watch(div, async function* () {
        // Initialize array
        yield* setState("items", ["a", "b"]);

        // Append to array
        const appended = yield* appendToState("items", "c");
        expect(appended).toEqual(["a", "b", "c"]);

        // Prepend to array
        const prepended = yield* prependToState("items", "z");
        expect(prepended).toEqual(["z", "a", "b", "c"]);

        // Remove from array
        const removed = yield* removeFromState("items", "b");
        expect(removed).toEqual(["z", "a", "c"]);
      });
    });

    it("should handle object state operations using yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      await watch(div, async function* () {
        // Initialize object
        yield* setState("user", { name: "John", age: 30 });

        // Merge object
        const merged = yield* mergeState("user", { age: 31, city: "NYC" });
        expect(merged).toEqual({ name: "John", age: 31, city: "NYC" });
      });
    });
  });

  describe("Event Operations", () => {
    it("should handle click events using yield*", async () => {
      const button = document.createElement("button");
      container.appendChild(button);

      let clicked = false;

      await watch(button, async function* () {
        yield* click(() => {
          clicked = true;
        });
      });

      // Simulate click
      button.click();
      expect(clicked).toBe(true);
    });

    it("should handle click events with generator handlers using yield*", async () => {
      const button = document.createElement("button");
      container.appendChild(button);

      await watch(button, async function* () {
        yield* setState("clickCount", 0);

        yield* click(async function* (event) {
          const count = yield* getState<number>("clickCount", 0);
          yield* setState("clickCount", count + 1);
          yield* text(`Clicked ${count + 1} times`);
        });
      });

      // Simulate clicks
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("Clicked 1 times");

      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("Clicked 2 times");
    });

    it("should handle input events using yield*", async () => {
      const inputElement = document.createElement("input");
      container.appendChild(inputElement);

      let inputValue = "";

      await watch(inputElement, async function* () {
        yield* input((event) => {
          inputValue = (event.target as HTMLInputElement).value;
        });
      });

      // Simulate input
      inputElement.value = "test";
      inputElement.dispatchEvent(new Event("input"));
      expect(inputValue).toBe("test");
    });

    it("should handle custom events using yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      let eventData: any = null;

      await watch(div, async function* () {
        yield* on("customEvent", (event: CustomEvent) => {
          eventData = event.detail;
        });

        // Emit custom event
        yield* emit("customEvent", { message: "Hello" });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(eventData).toEqual({ message: "Hello" });
    });

    it("should handle mount events using yield*", async () => {
      const div = document.createElement("div");
      let mounted = false;

      await watch(div, async function* () {
        yield* onMount(() => {
          mounted = true;
        });
      });

      // Wait for mount handler to execute
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mounted).toBe(true);
    });

    it("should handle focus events using yield*", async () => {
      const inputElement = document.createElement("input");
      container.appendChild(inputElement);

      let focused = false;
      let blurred = false;

      await watch(inputElement, async function* () {
        yield* onFocus(() => {
          focused = true;
        });

        yield* onBlur(() => {
          blurred = true;
        });
      });

      // Simulate focus
      inputElement.dispatchEvent(new FocusEvent("focus"));
      expect(focused).toBe(true);

      // Simulate blur
      inputElement.dispatchEvent(new FocusEvent("blur"));
      expect(blurred).toBe(true);
    });
  });

  describe("Complex Workflows", () => {
    it("should compose multiple operations using yield*", async () => {
      const button = document.createElement("button");
      container.appendChild(button);

      await watch(button, async function* () {
        // Initialize
        yield* text("Click me");
        yield* addClass("btn");
        yield* addClass("btn-primary");
        yield* setState("clicks", 0);

        // Set up click handler
        yield* click(async function* () {
          // Update state
          const clicks = yield* getState<number>("clicks", 0);
          yield* setState("clicks", clicks + 1);

          // Update UI
          yield* text(`Clicked ${clicks + 1} times`);
          yield* toggleClass("clicked");

          // Add visual feedback
          yield* addClass("animating");
          yield* delay(300);
          yield* removeClass("animating");
        });
      });

      // Verify initial state
      expect(button.textContent).toBe("Click me");
      expect(button.classList.contains("btn")).toBe(true);
      expect(button.classList.contains("btn-primary")).toBe(true);

      // Simulate click
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("Clicked 1 times");
      expect(button.classList.contains("clicked")).toBe(true);
      expect(button.classList.contains("animating")).toBe(true);

      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 310));
      expect(button.classList.contains("animating")).toBe(false);
    });

    it("should handle async workflows with yield*", async () => {
      const div = document.createElement("div");
      container.appendChild(div);

      await watch(div, async function* () {
        yield* text("Loading...");

        // Simulate async operation
        yield* delay(10);

        yield* text("Loaded!");
        yield* addClass("loaded");
      });

      // Check initial state
      expect(div.textContent).toBe("Loading...");

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(div.textContent).toBe("Loaded!");
      expect(div.classList.contains("loaded")).toBe(true);
    });
  });
});
