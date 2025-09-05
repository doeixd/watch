/**
 * @fileoverview Basic integration tests for the unified API
 *
 * These tests verify that the unified API functions work correctly
 * with yield* patterns in generator contexts.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { watch } from "../../src/watch";
import {
  text,
  html,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  style,
  attr,
  hasAttr,
  removeAttr,
  prop,
  data,
  value,
  checked,
  focus,
  blur,
  show,
  hide,
  self,
  query,
  queryAll,
  parent,
  children,
  siblings,
} from "../../src/index";
import { delay } from "../../src/core/async-wrapper";
import {
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
  clearAllState,
  watchState,
  createState,
  createTypedState,
} from "../../src/core/state";
import {
  click,
  input,
  change,
  submit,
  on,
  emit,
  onMount,
  onUnmount,
} from "../../src/index";

describe("Unified API Basic Integration Tests", () => {
  let testContainer: HTMLElement;

  beforeEach(() => {
    testContainer = document.createElement("div");
    testContainer.id = "test-container";
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    document.body.innerHTML = "";
  });

  describe("DOM Manipulation with yield*", () => {
    it("should handle text operations", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Set text
        yield* text("Hello World");

        // Get text
        const content = yield* text();
        expect(content).toBe("Hello World");

        // Update text
        yield* text("Updated Text");
      });

      expect(div.textContent).toBe("Updated Text");
    });

    it("should handle HTML operations", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Set HTML
        yield* html("<span>HTML Content</span>");

        // Get HTML
        const content = yield* html();
        expect(content).toBe("<span>HTML Content</span>");
      });

      expect(div.innerHTML).toBe("<span>HTML Content</span>");
    });

    it("should handle class operations", async () => {
      const div = document.createElement("div");
      div.className = "original";
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Add class
        yield* addClass("added");

        // Check class
        const hasAdded = yield* hasClass("added");
        expect(hasAdded).toBe(true);

        // Remove class
        yield* removeClass("original");

        // Toggle class
        yield* toggleClass("toggled");

        // Verify final state
        const hasOriginal = yield* hasClass("original");
        const hasToggled = yield* hasClass("toggled");

        expect(hasOriginal).toBe(false);
        expect(hasToggled).toBe(true);
      });

      expect(div.classList.contains("added")).toBe(true);
      expect(div.classList.contains("original")).toBe(false);
      expect(div.classList.contains("toggled")).toBe(true);
    });

    it("should handle style operations", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Set style
        yield* style("color", "red");
        yield* style("fontSize", "16px");

        // Get style
        const color = yield* style("color");
        expect(color).toBe("red");
      });

      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("16px");
    });

    it("should handle attribute operations", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Set attribute
        yield* attr("data-test", "value1");

        // Check attribute exists
        const hasAttr1 = yield* hasAttr("data-test");
        expect(hasAttr1).toBe(true);

        // Get attribute
        const value = yield* attr("data-test");
        expect(value).toBe("value1");

        // Remove attribute
        yield* removeAttr("data-test");

        // Check attribute removed
        const hasAttr2 = yield* hasAttr("data-test");
        expect(hasAttr2).toBe(false);
      });

      expect(div.hasAttribute("data-test")).toBe(false);
    });

    it("should handle property operations", async () => {
      const input = document.createElement("input") as HTMLInputElement;
      input.type = "text";
      testContainer.appendChild(input);

      await watch(input, async function* () {
        // Set property
        yield* prop("value", "test value");

        // Get property
        const value = yield* prop("value");
        expect(value).toBe("test value");
      });

      expect(input.value).toBe("test value");
    });

    it("should handle data operations", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Set data attribute
        yield* data("test", "data-value");

        // Get data attribute
        const value = yield* data("test");
        expect(value).toBe("data-value");
      });

      expect(div.dataset.test).toBe("data-value");
    });

    it("should handle form value operations", async () => {
      const input = document.createElement("input") as HTMLInputElement;
      input.type = "text";
      testContainer.appendChild(input);

      await watch(input, async function* () {
        // Set value
        yield* value("form value");

        // Get value
        const val = yield* value();
        expect(val).toBe("form value");
      });

      expect(input.value).toBe("form value");
    });

    it("should handle checkbox operations", async () => {
      const checkbox = document.createElement("input") as HTMLInputElement;
      checkbox.type = "checkbox";
      testContainer.appendChild(checkbox);

      await watch(checkbox, async function* () {
        // Set checked
        yield* checked(true);

        // Get checked
        const isChecked = yield* checked();
        expect(isChecked).toBe(true);

        // Uncheck
        yield* checked(false);

        // Verify unchecked
        const isUnchecked = yield* checked();
        expect(isUnchecked).toBe(false);
      });

      expect(checkbox.checked).toBe(false);
    });

    it("should handle visibility operations", async () => {
      const div = document.createElement("div");
      div.style.display = "block";
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Hide element
        yield* hide();

        // Show element
        yield* show();
      });

      expect(div.style.display).not.toBe("none");
    });
  });

  describe("Context Operations with yield*", () => {
    it("should handle self operations", async () => {
      const button = document.createElement("button");
      button.id = "test-button";
      testContainer.appendChild(button);

      await watch(button, async function* () {
        // Get self element
        const element = yield* self();
        expect(element).toBe(button);
        expect(element.id).toBe("test-button");
      });
    });

    it("should handle query operations", async () => {
      const container = document.createElement("div");
      const child = document.createElement("span");
      child.className = "child";
      child.textContent = "Child Element";
      container.appendChild(child);
      testContainer.appendChild(container);

      await watch(container, async function* () {
        // Query child element
        const foundChild = yield* query(".child");
        expect(foundChild).toBe(child);
        expect(foundChild?.textContent).toBe("Child Element");

        // Query all (should return array)
        const allChildren = yield* queryAll("span");
        expect(allChildren).toHaveLength(1);
        expect(allChildren[0]).toBe(child);
      });
    });

    it("should handle traversal operations", async () => {
      const grandparent = document.createElement("div");
      const parentEl = document.createElement("div");
      const child1 = document.createElement("span");
      const child2 = document.createElement("span");

      child1.className = "child";
      child2.className = "sibling";

      parentEl.appendChild(child1);
      parentEl.appendChild(child2);
      grandparent.appendChild(parentEl);
      testContainer.appendChild(grandparent);

      await watch(child1, async function* () {
        // Get parent
        const parentElement = yield* parent();
        expect(parentElement).toBe(parentEl);

        // Get siblings
        const siblingElements = yield* siblings();
        expect(siblingElements).toHaveLength(1);
        expect(siblingElements[0]).toBe(child2);
      });

      await watch(parentEl, async function* () {
        // Get children
        const childElements = yield* children();
        expect(childElements).toHaveLength(2);
        expect(childElements[0]).toBe(child1);
        expect(childElements[1]).toBe(child2);
      });
    });
  });

  describe("State Management with yield*", () => {
    it("should handle basic state operations", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Set state
        yield* setState("test", "value");

        // Check state exists
        const exists = yield* hasState("test");
        expect(exists).toBe(true);

        // Get state
        const value = yield* getState("test");
        expect(value).toBe("value");

        // Update state
        yield* updateState("test", (current: string) => current + "!");

        // Verify update
        const updated = yield* getState("test");
        expect(updated).toBe("value!");

        // Delete state
        yield* deleteState("test");

        // Verify deletion
        const stillExists = yield* hasState("test");
        expect(stillExists).toBe(false);
      });
    });

    it("should handle complex state objects", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      interface UserData {
        name: string;
        age: number;
        active: boolean;
      }

      await watch(div, async function* () {
        const userData: UserData = { name: "John", age: 25, active: true };

        // Set complex state
        yield* setState("user", userData);

        // Get complex state
        const retrievedUser = yield* getState<UserData>("user");
        expect(retrievedUser).toEqual(userData);

        // Update complex state
        yield* updateState("user", (current: UserData) => ({
          ...current,
          age: current.age + 1,
        }));

        // Verify complex update
        const updatedUser = yield* getState<UserData>("user");
        expect(updatedUser.age).toBe(26);
        expect(updatedUser.name).toBe("John");
      });
    });
  });

  describe("Event Handling with yield*", () => {
    it("should handle click events", async () => {
      const button = document.createElement("button");
      button.textContent = "Click me";
      testContainer.appendChild(button);

      let clicked = false;

      await watch(button, async function* () {
        yield* click(() => {
          clicked = true;
        });
      });

      // Wait for DOM updates
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate click
      button.click();
      expect(clicked).toBe(true);
    });

    it("should handle input events", async () => {
      const input = document.createElement("input") as HTMLInputElement;
      input.type = "text";
      testContainer.appendChild(input);

      let lastValue = "";

      await watch(input, async function* () {
        yield* input((event) => {
          lastValue = (event.target as HTMLInputElement).value;
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate input
      input.value = "test input";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(lastValue).toBe("test input");
    });

    it("should handle submit events", async () => {
      const form = document.createElement("form");
      testContainer.appendChild(form);

      let submitted = false;

      await watch(form, async function* () {
        yield* submit((event) => {
          event.preventDefault();
          submitted = true;
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate submit
      form.dispatchEvent(new Event("submit"));
      expect(submitted).toBe(true);
    });

    it("should handle custom events", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      let eventData: any = null;

      await watch(div, async function* () {
        yield* on("custom-event", (event: CustomEvent) => {
          eventData = event.detail;
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Dispatch custom event
      div.dispatchEvent(
        new CustomEvent("custom-event", {
          detail: { message: "Hello from unified API" },
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(eventData).toEqual({ message: "Hello from unified API" });
    });

    it("should handle lifecycle events", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      let mounted = false;
      let unmounted = false;

      const controller = watch(div, async function* () {
        yield* onMount(() => {
          mounted = true;
        });

        yield* onUnmount(() => {
          unmounted = true;
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mounted).toBe(true);
      expect(unmounted).toBe(false);

      // Cleanup
      controller.destroy();
      expect(unmounted).toBe(true);
    });

    it("should handle generator event handlers", async () => {
      const button = document.createElement("button");
      testContainer.appendChild(button);

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

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("Count: 0");

      // First click
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("Count: 1");
      expect(button.classList.contains("clicked")).toBe(true);

      // Second click
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("Count: 2");
    });
  });

  describe("Complex Workflow Composition", () => {
    it("should support complex application patterns", async () => {
      const app = document.createElement("div");
      const input = document.createElement("input");
      const button = document.createElement("button");
      const list = document.createElement("ul");

      input.type = "text";
      input.placeholder = "Enter item";
      button.textContent = "Add Item";

      app.appendChild(input);
      app.appendChild(button);
      app.appendChild(list);
      testContainer.appendChild(app);

      await watch(app, async function* () {
        // Initialize state
        yield* setState("items", []);

        // Handle input changes
        const inputElement = yield* query("input");
        if (inputElement) {
          yield* input(inputElement as HTMLElement, async function* (event) {
            const value = (event.target as HTMLInputElement).value;
            yield* setState("currentInput", value);
          });
        }

        // Handle button clicks
        const buttonElement = yield* query("button");
        if (buttonElement) {
          yield* click(buttonElement as HTMLElement, async function* () {
            const currentInput = yield* getState<string>("currentInput", "");
            const items = yield* getState<string[]>("items", []);

            if (currentInput.trim()) {
              const newItems = [...items, currentInput];
              yield* setState("items", newItems);

              // Clear input
              const inputEl = yield* query("input");
              if (inputEl) {
                yield* value(inputEl as HTMLElement, "");
              }

              // Update list
              const listElement = yield* query("ul");
              if (listElement) {
                const listHtml = newItems
                  .map((item) => `<li>${item}</li>`)
                  .join("");
                yield* html(listElement as HTMLElement, listHtml);
              }
            }
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate adding items
      (input as HTMLInputElement).value = "Item 1";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      await new Promise((resolve) => setTimeout(resolve, 10));

      button.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(list.children.length).toBe(1);
      expect(list.children[0].textContent).toBe("Item 1");
      expect((input as HTMLInputElement).value).toBe("");
    });

    it("should handle async operations with delay", async () => {
      const button = document.createElement("button");
      testContainer.appendChild(button);

      await watch(button, async function* () {
        yield* text("Ready");

        yield* click(async function* () {
          yield* text("Loading...");
          yield* addClass("loading");

          // Simulate async operation
          await delay(50);

          yield* text("Complete!");
          yield* removeClass("loading");
          yield* addClass("complete");
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("Ready");

      // Trigger click
      button.click();

      // Should show loading immediately
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(button.textContent).toBe("Loading...");
      expect(button.classList.contains("loading")).toBe(true);

      // Should complete after delay
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(button.textContent).toBe("Complete!");
      expect(button.classList.contains("loading")).toBe(false);
      expect(button.classList.contains("complete")).toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should maintain type safety with yield*", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

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

        // Type-safe element operations
        const element: HTMLElement = yield* self();
        expect(element).toBe(div);

        // Type-safe text operations
        yield* text("type test");
        const textContent: string = yield* text();
        expect(textContent).toBe("type test");
      });
    });
  });
});
