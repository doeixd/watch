/**
 * @fileoverview Basic integration tests for the generator module
 *
 * These tests verify that the generator module functions work correctly
 * with the actual exported functions.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { watch } from "../../src/watch";
import {
  text,
  getText,
  appendText,
  prependText,
  html,
  getHtml,
  appendHtml,
  prependHtml,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  replaceClass,
  setClasses,
  style,
  getStyle,
  removeStyle,
  attr,
  getAttr,
  hasAttr,
  removeAttr,
  prop,
  getProp,
  data,
  getData,
  removeData,
  value,
  getValue,
  setChecked,
  isChecked,
  focus,
  blur,
  show,
  hide,
  toggle,
  self,
  query,
  queryAll,
  parent,
  children,
  siblings,
  run,
} from "../../src/generator/dom";
import { delay } from "../../src/core/async-wrapper";
import {
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
  clearState,
  incrementState,
  decrementState,
  toggleState,
  appendToState,
  prependToState,
  removeFromState,
  mergeState,
  watchState,
  getStateSnapshot,
  computedState,
} from "../../src/generator/state";
import {
  click,
  input,
  change,
  submit,
  on,
  emit,
  onMount,
  onUnmount,
} from "../../src/generator/events";

describe("Generator Module Basic Integration Tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("Text and HTML Operations", () => {
    it("should manipulate text content", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Set text
        yield* text("Hello World");
        expect(element.textContent).toBe("Hello World");

        // Get text
        const content = yield* getText();
        expect(content).toBe("Hello World");

        // Append text
        yield* appendText(" - Appended");
        expect(element.textContent).toBe("Hello World - Appended");

        // Prepend text
        yield* prependText("Prepended - ");
        expect(element.textContent).toBe("Prepended - Hello World - Appended");
      });
    });

    it("should manipulate HTML content", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Set HTML
        yield* html("<strong>Bold</strong> text");
        expect(element.innerHTML).toBe("<strong>Bold</strong> text");

        // Get HTML
        const htmlContent = yield* getHtml();
        expect(htmlContent).toBe("<strong>Bold</strong> text");

        // Append HTML
        yield* appendHtml(" <em>italic</em>");
        expect(element.querySelector("em")?.textContent).toBe("italic");

        // Prepend HTML
        yield* prependHtml("<span>Start</span> ");
        expect(element.querySelector("span")?.textContent).toBe("Start");
      });
    });
  });

  describe("Class Operations", () => {
    it("should manipulate CSS classes", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Add class
        yield* addClass("active");
        expect(element.classList.contains("active")).toBe(true);

        // Check class
        const hasActive = yield* hasClass("active");
        expect(hasActive).toBe(true);

        // Toggle class
        const toggleResult = yield* toggleClass("highlighted");
        expect(toggleResult).toBe(true);
        expect(element.classList.contains("highlighted")).toBe(true);

        // Remove class
        yield* removeClass("active");
        expect(element.classList.contains("active")).toBe(false);

        // Replace class
        yield* addClass("old-class");
        const replaced = yield* replaceClass("old-class", "new-class");
        expect(replaced).toBe(true);
        expect(element.classList.contains("new-class")).toBe(true);

        // Set all classes
        yield* setClasses("class1 class2 class3");
        expect(element.className).toBe("class1 class2 class3");
      });
    });
  });

  describe("Style Operations", () => {
    it("should manipulate inline styles", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Set single style
        yield* style("color", "red");
        expect(element.style.color).toBe("red");

        // Set multiple styles
        yield* style({
          backgroundColor: "blue",
          padding: "10px",
        });
        expect(element.style.backgroundColor).toBe("blue");
        expect(element.style.padding).toBe("10px");

        // Remove style
        yield* removeStyle("padding");
        expect(element.style.padding).toBe("");
      });
    });
  });

  describe("Attribute Operations", () => {
    it("should manipulate attributes", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Set attribute
        yield* attr("data-id", "123");
        expect(element.getAttribute("data-id")).toBe("123");

        // Get attribute
        const id = yield* getAttr("data-id");
        expect(id).toBe("123");

        // Check attribute
        const hasId = yield* hasAttr("data-id");
        expect(hasId).toBe(true);

        // Set multiple attributes
        yield* attr({
          role: "button",
          "aria-label": "Click me",
        });
        expect(element.getAttribute("role")).toBe("button");
        expect(element.getAttribute("aria-label")).toBe("Click me");

        // Remove attribute
        yield* removeAttr("data-id");
        expect(element.hasAttribute("data-id")).toBe(false);
      });
    });
  });

  describe("Property Operations", () => {
    it("should manipulate DOM properties", async () => {
      const inputElement = document.createElement("input");
      inputElement.type = "text";
      container.appendChild(inputElement);

      await watch(inputElement as HTMLElement, function* (ctx) {
        // Set property
        yield* prop("value", "Test Value");
        expect(inputElement.value).toBe("Test Value");

        // Get property
        const val = yield* getProp("value");
        expect(val).toBe("Test Value");

        // Set complex property
        yield* prop("disabled", true);
        expect(inputElement.disabled).toBe(true);
      });
    });
  });

  describe("Data Attribute Operations", () => {
    it("should manipulate data attributes", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Set data attribute
        yield* data("user-id", "456");
        expect(element.dataset.userId).toBe("456");

        // Get data attribute
        const userId = yield* getData("user-id");
        expect(userId).toBe("456");

        // Remove data attribute
        yield* removeData("user-id");
        expect(element.dataset.userId).toBeUndefined();
      });
    });
  });

  describe("Form Value Operations", () => {
    it("should handle input values", async () => {
      const inputElement = document.createElement("input");
      inputElement.type = "text";
      container.appendChild(inputElement);

      await watch(inputElement as HTMLElement, function* (ctx) {
        // Set value
        yield* value("Test Input");
        expect(inputElement.value).toBe("Test Input");

        // Get value
        const val = yield* getValue();
        expect(val).toBe("Test Input");
      });
    });

    it("should handle checkbox values", async () => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      container.appendChild(checkbox);

      await watch(checkbox as HTMLElement, function* (ctx) {
        // Set checked
        yield* setChecked(true);
        expect(checkbox.checked).toBe(true);

        // Get checked state
        const isCheckedResult = yield* isChecked();
        expect(isCheckedResult).toBe(true);

        // Uncheck
        yield* setChecked(false);
        expect(checkbox.checked).toBe(false);
      });
    });
  });

  describe("Visibility Operations", () => {
    it("should show and hide elements", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Hide
        yield* hide();
        expect(element.style.display).toBe("none");

        // Show
        yield* show();
        // After show(), display should be removed (empty string when reading style.display)
        expect(element.style.display).toBe("");

        // Toggle
        yield* toggle();
        expect(element.style.display).toBe("none");

        yield* toggle();
        // Toggle should restore to empty/removed display
        expect(element.style.display).toBe("");
      });
    });
  });

  describe("DOM Query Operations", () => {
    it("should query elements", async () => {
      const parent = document.createElement("div");
      parent.innerHTML = `
        <span class="child1">Child 1</span>
        <span class="child2">Child 2</span>
        <div class="nested">
          <span class="child3">Child 3</span>
        </div>
      `;
      container.appendChild(parent);

      await watch(parent as HTMLElement, function* (ctx) {
        // Get self
        const selfEl = yield* self();
        expect(selfEl).toBe(parent);

        // Query single element
        const child1 = yield* query(".child1");
        expect(child1?.textContent).toBe("Child 1");

        // Query all elements
        const allSpans = yield* queryAll("span");
        expect(allSpans.length).toBe(3);

        // Get children
        const childrenEls = yield* children();
        expect(childrenEls.length).toBe(3);
      });
    });

    it("should navigate DOM relationships", async () => {
      const parentDiv = document.createElement("div");
      parentDiv.className = "parent";

      const child1 = document.createElement("span");
      const child2 = document.createElement("div");
      const child3 = document.createElement("span");

      parentDiv.appendChild(child1);
      parentDiv.appendChild(child2);
      parentDiv.appendChild(child3);
      container.appendChild(parentDiv);

      await watch(child2 as HTMLElement, function* (ctx) {
        // Get parent
        const parentEl = yield* parent();
        expect(parentEl).toBe(parentDiv);

        // Get siblings
        const siblingsEls = yield* siblings();
        expect(siblingsEls.length).toBe(2);
        expect(siblingsEls[0]).toBe(child1);
        expect(siblingsEls[1]).toBe(child3);
      });
    });
  });

  describe("State Management", () => {
    it("should manage element state", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Set state
        yield* setState("count", 0);
        yield* setState("name", "Test");

        // Get state
        const count = yield* getState<number>("count");
        expect(count).toBe(0);

        const name = yield* getState<string>("name");
        expect(name).toBe("Test");

        // Check state existence
        const hasCount = yield* hasState("count");
        expect(hasCount).toBe(true);

        // Update state
        const newCount = yield* updateState<number>("count", (c = 0) => c + 1);
        expect(newCount).toBe(1);

        // Delete state
        const deleted = yield* deleteState("name");
        expect(deleted).toBe(true);
        expect(yield* hasState("name")).toBe(false);

        // Clear all state
        yield* setState("temp", "value");
        yield* clearState();
        expect(yield* hasState("count")).toBe(false);
        expect(yield* hasState("temp")).toBe(false);
      });
    });

    it("should handle specialized state operations", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Increment/decrement
        yield* setState("counter", 5);
        const inc = yield* incrementState("counter", 2);
        expect(inc).toBe(7);

        const dec = yield* decrementState("counter", 3);
        expect(dec).toBe(4);

        // Toggle boolean
        const toggle1 = yield* toggleState("flag");
        expect(toggle1).toBe(true);

        const toggle2 = yield* toggleState("flag");
        expect(toggle2).toBe(false);

        // Array operations
        yield* setState("items", ["a", "b"]);

        const appended = yield* appendToState("items", "c");
        expect(appended).toEqual(["a", "b", "c"]);

        const prepended = yield* prependToState("items", "z");
        expect(prepended).toEqual(["z", "a", "b", "c"]);

        // Object merge
        yield* setState("config", { theme: "light", size: 14 });
        const merged = yield* mergeState("config", {
          theme: "dark",
          newProp: true,
        });
        expect(merged).toEqual({ theme: "dark", size: 14, newProp: true });
      });
    });

    it("should compute and snapshot state", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element as HTMLElement, function* (ctx) {
        // Set some state
        yield* setState("firstName", "John");
        yield* setState("lastName", "Doe");
        yield* setState("age", 30);

        // Computed state
        const fullName = yield* computedState(
          ["firstName", "lastName"],
          (deps) => {
            return `${deps.firstName} ${deps.lastName}`;
          },
        );
        expect(fullName).toBe("John Doe");

        // Get snapshot
        const snapshot = yield* getStateSnapshot();
        expect(snapshot).toEqual({
          firstName: "John",
          lastName: "Doe",
          age: 30,
        });
      });
    });
  });

  describe("Event Handling", () => {
    it("should handle click events", async () => {
      const button = document.createElement("button");
      button.textContent = "Click me";
      container.appendChild(button);

      let clicked = false;

      await watch(button as HTMLElement, function* (ctx) {
        yield* click(function* (event) {
          clicked = true;
          yield* text("Clicked!");
          yield* addClass("clicked");
        });
      });

      // Simulate click
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(clicked).toBe(true);
      expect(button.textContent).toBe("Clicked!");
      expect(button.classList.contains("clicked")).toBe(true);
    });

    it("should handle input events", async () => {
      const inputElement = document.createElement("input");
      inputElement.type = "text";
      container.appendChild(inputElement);

      let lastValue = "";

      await watch(inputElement as HTMLElement, function* (ctx) {
        yield* input(function* (event) {
          const target = event.target as HTMLInputElement;
          lastValue = target.value;

          if (target.value.length > 5) {
            yield* addClass("valid");
          } else {
            yield* removeClass("valid");
          }
        });
      });

      // Simulate input
      inputElement.value = "test";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(lastValue).toBe("test");
      expect(inputElement.classList.contains("valid")).toBe(false);

      // More input
      inputElement.value = "testing";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(lastValue).toBe("testing");
      expect(inputElement.classList.contains("valid")).toBe(true);
    });

    it("should handle form submission", async () => {
      const form = document.createElement("form");
      form.innerHTML = `
        <input type="text" name="username" value="john">
        <button type="submit">Submit</button>
      `;
      container.appendChild(form);

      let submitted = false;
      let formData: any = null;

      await watch(form as HTMLElement, function* (ctx) {
        yield* submit(function* (event) {
          event.preventDefault();
          submitted = true;

          const data = new FormData(event.target as HTMLFormElement);
          formData = Object.fromEntries(data.entries());

          yield* addClass("submitted");
        });
      });

      // Submit form
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(submitted).toBe(true);
      expect(formData).toEqual({ username: "john" });
      expect(form.classList.contains("submitted")).toBe(true);
    });

    it("should handle custom events", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      let received = false;
      let eventData: any = null;

      await watch(element as HTMLElement, function* (ctx) {
        yield* on("custom", function* (event: Event) {
          received = true;
          eventData = (event as CustomEvent).detail;
          yield* text(`Received: ${(event as CustomEvent).detail.message}`);
        });

        // Emit event
        yield* emit("custom", { message: "Hello", value: 42 });
      });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(received).toBe(true);
      expect(eventData).toEqual({ message: "Hello", value: 42 });
      expect(element.textContent).toBe("Received: Hello");
    });
  });

  describe("Utility Operations", () => {
    it("should handle delays", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      const start = Date.now();

      await watch(element as HTMLElement, function* (ctx) {
        yield* text("Before");
        yield* delay(50);
        yield* text("After");
      });

      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some margin
      expect(element.textContent).toBe("After");
    });

    it("should run arbitrary functions", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      let sideEffect = 0;

      await watch(element as HTMLElement, function* (ctx) {
        const result = yield* run(() => {
          sideEffect = 42;
          return "done";
        });

        expect(result).toBe("done");
        expect(sideEffect).toBe(42);

        // Run async function
        const asyncResult = yield* run(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return "async done";
        });

        expect(asyncResult).toBe("async done");
      });
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle a complete interactive component", async () => {
      const component = document.createElement("div");
      component.className = "todo-container";
      component.innerHTML = `
        <input type="text" class="input" placeholder="Enter text">
        <button class="add">Add</button>
        <ul class="list"></ul>
        <div class="status">0 item(s)</div>
      `;
      container.appendChild(component);

      // Set up state on the container
      await watch(component as HTMLElement, function* (ctx) {
        yield* setState<string[]>("items", []);
      });

      // Watch the button for clicks
      const button = component.querySelector(".add") as HTMLButtonElement;
      const inputElement = component.querySelector(
        ".input",
      ) as HTMLInputElement;
      const list = component.querySelector(".list") as HTMLUListElement;
      const status = component.querySelector(".status") as HTMLDivElement;

      await watch(button as HTMLElement, function* (ctx) {
        yield* click(function* (event) {
          // Get items from parent container's state
          const container = document.querySelector(
            ".todo-container",
          ) as HTMLDivElement;

          // Since we're in button context, we need to work with the button
          // For this test, let's simplify by using the button's state
          const items = yield* getState<string[]>("items", []);
          const value = inputElement.value.trim();

          if (value) {
            const newItems = [...items, value];
            yield* setState("items", newItems);

            // Update list HTML directly
            list.innerHTML = newItems
              .map((item) => `<li>${item}</li>`)
              .join("");
            status.textContent = `${newItems.length} item(s)`;
            inputElement.value = "";
          }
        });
      });

      // Watch input for changes
      await watch(inputElement as HTMLElement, function* (ctx) {
        yield* on("input", function* (event) {
          const value = (yield* self<HTMLInputElement>()).value;
          if (value.length > 0) {
            button.classList.add("ready");
          } else {
            button.classList.remove("ready");
          }
        });
      });

      // Test the component
      inputElement.value = "First item";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(button.classList.contains("ready")).toBe(true);

      button.click();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const listItems = list.querySelectorAll("li");
      expect(listItems.length).toBe(1);
      expect(listItems[0].textContent).toBe("First item");
      expect(status.textContent).toBe("1 item(s)");
    });
  });
});
