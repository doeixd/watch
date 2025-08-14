/**
 * Test file for the unified API implementation with yield* support
 *
 * This file tests the unified type-safe API pattern with direct yield*
 * syntax, ensuring it works correctly with all DOM and state functions.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { watch } from "../src/index";
import {
  addClass,
  removeClass,
  hasClass,
  text,
  getState,
  setState,
  updateState,
  hasState,
  self,
  query,
  click,
  submit,
  attr,
  style,
} from "../src/index";
import { destroy } from "../src/watch";

// Helper function to wait for watch() to process mutations
const waitForWatcher = (ms = 10) =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe("Unified API - Direct yield* Pattern", () => {
  // happy-dom provides a global document object, so we just need to clean it
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    // Clean up any remaining watchers - destroy all controllers
    try {
      destroy("*"); // Destroy all watchers
    } catch (e) {
      // Ignore errors if no watchers exist
    }
    document.body.innerHTML = "";
  });

  describe("Basic DOM Operations with yield*", () => {
    it("should support text manipulation with yield*", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      await watch(div, async function* () {
        // Set text using yield*
        yield* text("Hello World");

        // Get text using yield*
        const content = yield* text();
        expect(content).toBe("Hello World");
      });

      expect(div.textContent).toBe("Hello World");
    });

    it("should support class manipulation with yield*", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      await watch(div, async function* () {
        // Add class
        yield* addClass("test-class");

        // Check if class exists
        const hasTestClass = yield* hasClass("test-class");
        expect(hasTestClass).toBe(true);

        // Add another class
        yield* addClass("another-class");

        // Remove first class
        yield* removeClass("test-class");

        // Check states
        const stillHasTest = yield* hasClass("test-class");
        const hasAnother = yield* hasClass("another-class");

        expect(stillHasTest).toBe(false);
        expect(hasAnother).toBe(true);
      });

      expect(div.classList.contains("test-class")).toBe(false);
      expect(div.classList.contains("another-class")).toBe(true);
    });

    it("should support attribute manipulation with yield*", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      await watch(div, async function* () {
        // Set attribute
        yield* attr("data-test", "value1");

        // Get attribute
        const value = yield* attr("data-test");
        expect(value).toBe("value1");

        // Update attribute
        yield* attr("data-test", "value2");

        // Verify update
        const newValue = yield* attr("data-test");
        expect(newValue).toBe("value2");
      });

      expect(div.getAttribute("data-test")).toBe("value2");
    });

    it("should support style manipulation with yield*", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      await watch(div, async function* () {
        // Set style property
        yield* style("color", "red");
        yield* style("fontSize", "16px");

        // Get style property
        const color = yield* style("color");
        expect(color).toBe("red");
      });

      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("16px");
    });
  });

  describe("State Management with yield*", () => {
    it("should support basic state operations with yield*", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      await watch(div, async function* () {
        // Set state
        yield* setState("counter", 0);

        // Check if state exists
        const exists = yield* hasState("counter");
        expect(exists).toBe(true);

        // Get state
        const value = yield* getState("counter");
        expect(value).toBe(0);

        // Update state
        yield* setState("counter", 5);

        // Verify update
        const newValue = yield* getState("counter");
        expect(newValue).toBe(5);
      });
    });

    it("should support updateState with yield*", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      await watch(div, async function* () {
        // Initialize state
        yield* setState("counter", 10);

        // Update state with function
        yield* updateState("counter", (current: number) => current + 5);

        // Verify update
        const value = yield* getState("counter");
        expect(value).toBe(15);
      });
    });

    it("should support complex state objects with yield*", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      interface UserState {
        name: string;
        age: number;
        active: boolean;
      }

      await watch(div, async function* () {
        // Set complex state
        const user: UserState = { name: "John", age: 25, active: true };
        yield* setState("user", user);

        // Get state
        const retrievedUser = yield* getState<UserState>("user");
        expect(retrievedUser).toEqual(user);

        // Update state
        yield* updateState("user", (current: UserState) => ({
          ...current,
          age: current.age + 1,
        }));

        // Verify update
        const updatedUser = yield* getState<UserState>("user");
        expect(updatedUser.age).toBe(26);
        expect(updatedUser.name).toBe("John");
      });
    });
  });

  describe("Context Functions with yield*", () => {
    it("should support self() with yield*", async () => {
      const div = document.createElement("div");
      div.id = "test-div";
      document.body.appendChild(div);

      await watch(div, async function* () {
        // Get self element
        const element = yield* self();
        expect(element).toBe(div);
        expect(element.id).toBe("test-div");
      });
    });

    it("should support query with yield*", async () => {
      const container = document.createElement("div");
      const child = document.createElement("span");
      child.className = "child";
      child.textContent = "Child Element";
      container.appendChild(child);
      document.body.appendChild(container);

      await watch(container, async function* () {
        // Query child element
        const foundChild = yield* query(".child");
        expect(foundChild).toBe(child);
        expect(foundChild?.textContent).toBe("Child Element");
      });
    });
  });

  describe("Event Handling with yield*", () => {
    it("should support click events with yield*", async () => {
      const button = document.createElement("button");
      button.textContent = "Click me";
      document.body.appendChild(button);

      let clicked = false;

      await watch(button, async function* () {
        yield* click(() => {
          clicked = true;
        });
      });

      await waitForWatcher();

      // Simulate click
      button.click();
      expect(clicked).toBe(true);
    });

    it("should support submit events with yield*", async () => {
      const form = document.createElement("form");
      document.body.appendChild(form);

      let submitted = false;

      await watch(form, async function* () {
        yield* submit((event) => {
          event.preventDefault();
          submitted = true;
        });
      });

      await waitForWatcher();

      // Simulate submit
      form.dispatchEvent(new Event("submit"));
      expect(submitted).toBe(true);
    });

    it("should support generator event handlers with yield*", async () => {
      const button = document.createElement("button");
      document.body.appendChild(button);

      await watch(button, async function* () {
        yield* text("Count: 0");
        yield* setState("clicks", 0);

        yield* click(async function* () {
          // Update state in generator
          const currentClicks = yield* getState<number>("clicks", 0);
          const newClicks = currentClicks + 1;
          yield* setState("clicks", newClicks);

          // Update display
          yield* text(`Count: ${newClicks}`);

          // Add visual feedback
          yield* addClass("clicked");
        });
      });

      await waitForWatcher();
      expect(button.textContent).toBe("Count: 0");

      // First click
      button.click();
      await waitForWatcher();
      expect(button.textContent).toBe("Count: 1");
      expect(button.classList.contains("clicked")).toBe(true);

      // Second click
      button.click();
      await waitForWatcher();
      expect(button.textContent).toBe("Count: 2");
    });
  });

  describe("Complex Composition with yield*", () => {
    it("should support complex workflow composition", async () => {
      const container = document.createElement("div");
      const input = document.createElement("input");
      const button = document.createElement("button");
      const output = document.createElement("div");

      input.type = "text";
      input.placeholder = "Enter text";
      button.textContent = "Process";
      output.className = "output";

      container.appendChild(input);
      container.appendChild(button);
      container.appendChild(output);
      document.body.appendChild(container);

      await watch(container, async function* () {
        // Initialize state
        yield* setState("inputValue", "");
        yield* setState("processed", false);

        // Watch input changes
        const inputElement = yield* query("input");
        if (inputElement) {
          yield* click(inputElement as HTMLElement, async function* () {
            const value = (inputElement as HTMLInputElement).value;
            yield* setState("inputValue", value);
          });
        }

        // Watch button clicks
        const buttonElement = yield* query("button");
        if (buttonElement) {
          yield* click(buttonElement as HTMLElement, async function* () {
            const inputValue = yield* getState<string>("inputValue", "");

            if (inputValue.trim()) {
              // Process the input
              const processed = inputValue.toUpperCase();
              yield* setState("processed", true);

              // Update output
              const outputElement = yield* query(".output");
              if (outputElement) {
                yield* text(
                  outputElement as HTMLElement,
                  `Processed: ${processed}`,
                );
                yield* addClass(outputElement as HTMLElement, "success");
              }
            }
          });
        }
      });

      await waitForWatcher();

      // Simulate interaction
      (input as HTMLInputElement).value = "hello world";
      input.click(); // Trigger the click handler to update state

      await waitForWatcher();

      button.click(); // Process the input

      await waitForWatcher();
      expect(output.textContent).toBe("Processed: HELLO WORLD");
      expect(output.classList.contains("success")).toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety with yield*", async () => {
      const div = document.createElement("div");
      document.body.appendChild(div);

      await watch(div, async function* () {
        // Type-safe state operations
        yield* setState<number>("count", 42);
        const count: number = yield* getState<number>("count", 0);
        expect(typeof count).toBe("number");
        expect(count).toBe(42);

        // Type-safe string operations
        yield* setState<string>("message", "hello");
        const message: string = yield* getState<string>("message", "");
        expect(typeof message).toBe("string");
        expect(message).toBe("hello");

        // Type-safe boolean operations
        yield* setState<boolean>("flag", true);
        const flag: boolean = yield* getState<boolean>("flag", false);
        expect(typeof flag).toBe("boolean");
        expect(flag).toBe(true);
      });
    });
  });
});
