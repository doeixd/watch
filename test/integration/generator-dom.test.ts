/**
 * @fileoverview Comprehensive integration tests for the generator module DOM operations
 *
 * These tests verify that the generator module functions correctly manipulate the DOM
 * and maintain proper state across various operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
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
  styleProperty,
  // styleProperty is used instead of getStyle
  removeStyle,
  attr,
  getAttr,
  removeAttr,
  hasAttr,
  prop,
  getProp,
  data,
  getData,
  removeData,
  value,
  getValue,
  checked,
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
  delay,
  run,
} from "../../src/generator/dom";

describe("Generator DOM Integration Tests", () => {
  let container: HTMLElement;
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    document.body.removeChild(container);
  });

  describe("Text Content Operations", () => {
    it("should set and get text content correctly", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Test setting text
        yield* text("Hello World");
        expect(element.textContent).toBe("Hello World");

        // Test getting text
        const content = yield* getText();
        expect(content).toBe("Hello World");

        // Test appending text
        yield* appendText(" - Appended");
        expect(element.textContent).toBe("Hello World - Appended");

        // Test prepending text
        yield* prependText("Prepended - ");
        expect(element.textContent).toBe("Prepended - Hello World - Appended");
      });
    });

    it("should handle empty and special characters in text", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Test empty string
        yield* text("");
        expect(element.textContent).toBe("");

        // Test special characters
        yield* text('<script>alert("XSS")</script>');
        expect(element.textContent).toBe('<script>alert("XSS")</script>');
        expect(element.innerHTML).not.toContain("<script>");

        // Test unicode
        yield* text("Hello 世界 🌍");
        expect(element.textContent).toBe("Hello 世界 🌍");
      });
    });
  });

  describe("HTML Content Operations", () => {
    it("should set and get HTML content correctly", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Set HTML
        yield* html("<strong>Bold</strong> <em>Italic</em>");
        expect(element.innerHTML).toBe("<strong>Bold</strong> <em>Italic</em>");

        // Get HTML
        const htmlContent = yield* getHtml();
        expect(htmlContent).toBe("<strong>Bold</strong> <em>Italic</em>");

        // Verify DOM structure
        const strong = element.querySelector("strong");
        const em = element.querySelector("em");
        expect(strong?.textContent).toBe("Bold");
        expect(em?.textContent).toBe("Italic");
      });
    });

    it("should append and prepend HTML correctly", async () => {
      const element = document.createElement("div");
      element.innerHTML = "<span>Middle</span>";
      container.appendChild(element);

      await watch(element, async function* () {
        // Append HTML
        yield* appendHtml("<span>End</span>");
        expect(element.children.length).toBe(2);
        expect(element.lastElementChild?.textContent).toBe("End");

        // Prepend HTML
        yield* prependHtml("<span>Start</span>");
        expect(element.children.length).toBe(3);
        expect(element.firstElementChild?.textContent).toBe("Start");

        // Verify order
        const spans = element.querySelectorAll("span");
        expect(spans[0].textContent).toBe("Start");
        expect(spans[1].textContent).toBe("Middle");
        expect(spans[2].textContent).toBe("End");
      });
    });
  });

  describe("Class Manipulation Operations", () => {
    it("should add, remove, and toggle classes correctly", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Add single class
        yield* addClass("active");
        expect(element.classList.contains("active")).toBe(true);

        // Add multiple classes
        yield* addClass("primary large");
        expect(element.classList.contains("primary")).toBe(true);
        expect(element.classList.contains("large")).toBe(true);

        // Check class existence
        const hasActive = yield* hasClass("active");
        expect(hasActive).toBe(true);

        const hasInactive = yield* hasClass("inactive");
        expect(hasInactive).toBe(false);

        // Toggle class
        const toggleResult1 = yield* toggleClass("active");
        expect(toggleResult1).toBe(false);
        expect(element.classList.contains("active")).toBe(false);

        const toggleResult2 = yield* toggleClass("active");
        expect(toggleResult2).toBe(true);
        expect(element.classList.contains("active")).toBe(true);

        // Force toggle
        yield* toggleClass("forced", true);
        expect(element.classList.contains("forced")).toBe(true);

        yield* toggleClass("forced", true);
        expect(element.classList.contains("forced")).toBe(true);

        yield* toggleClass("forced", false);
        expect(element.classList.contains("forced")).toBe(false);

        // Remove classes
        yield* removeClass("primary large");
        expect(element.classList.contains("primary")).toBe(false);
        expect(element.classList.contains("large")).toBe(false);
      });
    });

    it("should replace and set classes correctly", async () => {
      const element = document.createElement("div");
      element.className = "old-class another-class";
      container.appendChild(element);

      await watch(element, async function* () {
        // Replace class
        const replaced = yield* replaceClass("old-class", "new-class");
        expect(replaced).toBe(true);
        expect(element.classList.contains("old-class")).toBe(false);
        expect(element.classList.contains("new-class")).toBe(true);
        expect(element.classList.contains("another-class")).toBe(true);

        // Try to replace non-existent class
        const notReplaced = yield* replaceClass("non-existent", "replacement");
        expect(notReplaced).toBe(false);

        // Set entire class list (string)
        yield* setClasses("class1 class2 class3");
        expect(element.className).toBe("class1 class2 class3");

        // Set entire class list (array)
        yield* setClasses(["classA", "classB", "classC"]);
        expect(element.className).toBe("classA classB classC");
      });
    });
  });

  describe("Style Manipulation Operations", () => {
    it("should set and get styles correctly", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Set single style
        yield* style({ color: "red" });
        expect(element.style.color).toBe("red");

        // Set multiple styles
        yield* style({
          backgroundColor: "blue",
          padding: "10px",
          fontSize: "16px",
        });
        expect(element.style.backgroundColor).toBe("blue");
        expect(element.style.padding).toBe("10px");
        expect(element.style.fontSize).toBe("16px");

        // Get style property
        const color = yield* styleProperty("color");
        expect(color).toBeTruthy(); // Computed style format may vary

        // Get style (alternative)
        const bgColor = yield* styleProperty("background-color");
        expect(bgColor).toBeTruthy();

        // Remove style
        yield* removeStyle("padding");
        expect(element.style.padding).toBe("");
      });
    });

    it("should handle kebab-case and camelCase style properties", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Test kebab-case
        yield* style("font-size", "20px");
        expect(element.style.fontSize).toBe("20px");

        // Test camelCase
        yield* style("marginTop", "15px");
        expect(element.style.marginTop).toBe("15px");

        // Test batch with mixed cases
        yield* style({
          "border-radius": "5px",
          paddingLeft: "10px",
        });
        expect(element.style.borderRadius).toBe("5px");
        expect(element.style.paddingLeft).toBe("10px");
      });
    });
  });

  describe("Attribute Operations", () => {
    it("should set, get, and remove attributes correctly", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Set single attribute
        yield* attr("id", "test-id");
        expect(element.getAttribute("id")).toBe("test-id");

        // Set multiple attributes
        yield* attr({
          "data-test": "value",
          "aria-label": "Test Label",
          role: "button",
        });
        expect(element.getAttribute("data-test")).toBe("value");
        expect(element.getAttribute("aria-label")).toBe("Test Label");
        expect(element.getAttribute("role")).toBe("button");

        // Get attribute
        const id = yield* getAttr("id");
        expect(id).toBe("test-id");

        const nonExistent = yield* getAttr("non-existent");
        expect(nonExistent).toBe(null);

        // Check attribute existence
        const hasId = yield* hasAttr("id");
        expect(hasId).toBe(true);

        const hasNonExistent = yield* hasAttr("non-existent");
        expect(hasNonExistent).toBe(false);

        // Remove attribute
        yield* removeAttr("role");
        expect(element.hasAttribute("role")).toBe(false);
      });
    });

    it("should handle boolean attributes correctly", async () => {
      const input = document.createElement("input");
      input.type = "checkbox";
      container.appendChild(input);

      await watch(input, async function* () {
        // Set boolean attributes
        yield* attr("disabled", "");
        expect(input.hasAttribute("disabled")).toBe(true);
        expect(input.disabled).toBe(true);

        yield* attr("required", "required");
        expect(input.hasAttribute("required")).toBe(true);
        expect(input.required).toBe(true);

        // Remove boolean attributes
        yield* removeAttr("disabled");
        expect(input.hasAttribute("disabled")).toBe(false);
        expect(input.disabled).toBe(false);
      });
    });
  });

  describe("Property Operations", () => {
    it("should set and get properties correctly", async () => {
      const input = document.createElement("input");
      input.type = "text";
      container.appendChild(input);

      await watch(input, async function* () {
        // Set property
        yield* prop("value", "Test Value");
        expect(input.value).toBe("Test Value");

        // Get property
        const value = yield* getProp("value");
        expect(value).toBe("Test Value");

        // Set complex property
        const customData = { id: 1, name: "Test" };
        yield* prop("customData", customData);
        expect((input as any).customData).toEqual(customData);
      });
    });

    it("should handle checkbox and radio properties", async () => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      container.appendChild(checkbox);

      await watch(checkbox, async function* () {
        // Set checked property
        yield* prop("checked", true);
        expect(checkbox.checked).toBe(true);

        // Set indeterminate
        yield* prop("indeterminate", true);
        expect(checkbox.indeterminate).toBe(true);

        // Get checked property
        const isChecked = yield* getProp("checked");
        expect(isChecked).toBe(true);
      });
    });
  });

  describe("Data Attribute Operations", () => {
    it("should set, get, and remove data attributes", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Set data attribute
        yield* data("user-id", "12345");
        expect(element.getAttribute("data-user-id")).toBe("12345");

        // Get data attribute
        const userId = yield* getData("user-id");
        expect(userId).toBe("12345");

        // Set multiple data attributes
        yield* data("role", "admin");
        yield* data("status", "active");
        expect(element.getAttribute("data-role")).toBe("admin");
        expect(element.getAttribute("data-status")).toBe("active");

        // Remove data attribute
        yield* removeData("status");
        expect(element.hasAttribute("data-status")).toBe(false);

        // Get non-existent data
        const nonExistent = yield* getData("non-existent");
        expect(nonExistent).toBe(null);
      });
    });
  });

  describe("Form Value Operations", () => {
    it("should handle input values correctly", async () => {
      const input = document.createElement("input");
      input.type = "text";
      container.appendChild(input);

      await watch(input, async function* () {
        // Set value
        yield* value("Test Input");
        expect(input.value).toBe("Test Input");

        // Get value
        const val = yield* getValue();
        expect(val).toBe("Test Input");

        // Update value
        yield* value("Updated Value");
        const updatedVal = yield* getValue();
        expect(updatedVal).toBe("Updated Value");
      });
    });

    it("should handle textarea values correctly", async () => {
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);

      await watch(textarea, async function* () {
        // Set multiline value
        yield* value("Line 1\nLine 2\nLine 3");
        expect(textarea.value).toBe("Line 1\nLine 2\nLine 3");

        // Get value
        const val = yield* getValue();
        expect(val).toBe("Line 1\nLine 2\nLine 3");
      });
    });

    it("should handle select values correctly", async () => {
      const select = document.createElement("select");
      const option1 = document.createElement("option");
      option1.value = "opt1";
      option1.textContent = "Option 1";
      const option2 = document.createElement("option");
      option2.value = "opt2";
      option2.textContent = "Option 2";
      select.appendChild(option1);
      select.appendChild(option2);
      container.appendChild(select);

      await watch(select, async function* () {
        // Set value
        yield* value("opt2");
        expect(select.value).toBe("opt2");

        // Get value
        const val = yield* getValue();
        expect(val).toBe("opt2");

        // Verify selected option
        expect(option2.selected).toBe(true);
        expect(option1.selected).toBe(false);
      });
    });

    it("should handle checkbox checked state", async () => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      container.appendChild(checkbox);

      await watch(checkbox, async function* () {
        // Set checked
        yield* checked(true);
        expect(checkbox.checked).toBe(true);

        // Get checked state
        const isCheckedResult = yield* isChecked();
        expect(isCheckedResult).toBe(true);

        // Uncheck
        yield* checked(false);
        expect(checkbox.checked).toBe(false);

        const isUnchecked = yield* isChecked();
        expect(isUnchecked).toBe(false);
      });
    });
  });

  describe("Focus Operations", () => {
    it("should handle focus and blur correctly", async () => {
      const input = document.createElement("input");
      container.appendChild(input);

      await watch(input, async function* () {
        // Focus element
        yield* focus();
        expect(document.activeElement).toBe(input);

        // Blur element
        yield* blur();
        expect(document.activeElement).not.toBe(input);
      });
    });
  });

  describe("Visibility Operations", () => {
    it("should show and hide elements correctly", async () => {
      const element = document.createElement("div");
      element.textContent = "Visible Content";
      container.appendChild(element);

      await watch(element, async function* () {
        // Hide element
        yield* hide();
        expect(element.style.display).toBe("none");

        // Show element
        yield* show();
        expect(element.style.display).toBe("");

        // Toggle visibility
        yield* toggle();
        expect(element.style.display).toBe("none");

        yield* toggle();
        expect(element.style.display).toBe("");

        // Toggle visibility
        const hidden = yield* toggle();
        expect(hidden).toBe(false);
        expect(element.style.display).toBe("none");

        const shown = yield* toggle();
        expect(shown).toBe(true);
        expect(element.style.display).toBe("");
      });
    });

    it("should preserve original display value when showing", async () => {
      const element = document.createElement("div");
      element.style.display = "flex";
      container.appendChild(element);

      await watch(element, async function* () {
        // Store original display
        const originalDisplay = element.style.display;

        // Hide and show
        yield* hide();
        expect(element.style.display).toBe("none");

        yield* show("flex");
        expect(element.style.display).toBe("flex");
      });
    });
  });

  describe("Element Selection Operations", () => {
    it("should get self reference correctly", async () => {
      const element = document.createElement("div");
      element.id = "test-element";
      container.appendChild(element);

      await watch(element, async function* () {
        const selfElement = yield* self();
        expect(selfElement).toBe(element);
        expect(selfElement.id).toBe("test-element");

        // Type assertion
        const typedSelf = yield* self<HTMLDivElement>();
        expect(typedSelf).toBe(element);
      });
    });

    it("should query child elements correctly", async () => {
      const parent = document.createElement("div");
      parent.innerHTML = `
        <span class="first">First</span>
        <span class="second">Second</span>
        <div class="nested">
          <span class="third">Third</span>
        </div>
      `;
      container.appendChild(parent);

      await watch(parent, async function* () {
        // Query single element
        const first = yield* query(".first");
        expect(first?.textContent).toBe("First");

        // Query nested element
        const third = yield* query(".nested .third");
        expect(third?.textContent).toBe("Third");

        // Query non-existent
        const nonExistent = yield* query(".non-existent");
        expect(nonExistent).toBe(null);

        // Query all elements
        const allSpans = yield* queryAll("span");
        expect(allSpans.length).toBe(3);
        expect(allSpans[0].textContent).toBe("First");
        expect(allSpans[1].textContent).toBe("Second");
        expect(allSpans[2].textContent).toBe("Third");

        // Query with no matches
        const noMatches = yield* queryAll(".no-match");
        expect(noMatches.length).toBe(0);
      });
    });

    it("should get parent and siblings correctly", async () => {
      const parentDiv = document.createElement("div");
      parentDiv.className = "parent";
      const child1 = document.createElement("span");
      child1.className = "child1";
      child1.textContent = "Child 1";
      const child2 = document.createElement("span");
      child2.className = "child2";
      child2.textContent = "Child 2";
      const child3 = document.createElement("span");
      child3.className = "child3";
      child3.textContent = "Child 3";

      parentDiv.appendChild(child1);
      parentDiv.appendChild(child2);
      parentDiv.appendChild(child3);
      container.appendChild(parentDiv);

      await watch(child2, async function* () {
        // Get parent
        const parentElement = yield* parent();
        expect(parentElement).toBe(parentDiv);
        expect(parentElement?.className).toBe("parent");

        // Get siblings
        const siblingsArray = yield* siblings();
        expect(siblingsArray.length).toBe(2);
        expect(siblingsArray[0]).toBe(child1);
        expect(siblingsArray[1]).toBe(child3);
      });
    });

    it("should get children correctly", async () => {
      const parentDiv = document.createElement("div");
      const child1 = document.createElement("span");
      child1.textContent = "Child 1";
      const child2 = document.createElement("div");
      child2.textContent = "Child 2";
      const textNode = document.createTextNode("Text node");

      parentDiv.appendChild(child1);
      parentDiv.appendChild(textNode);
      parentDiv.appendChild(child2);
      container.appendChild(parentDiv);

      await watch(parentDiv, async function* () {
        // Get children (only elements, not text nodes)
        const childrenArray = yield* children();
        expect(childrenArray.length).toBe(2);
        expect(childrenArray[0]).toBe(child1);
        expect(childrenArray[1]).toBe(child2);
      });
    });
  });

  describe("Utility Operations", () => {
    it("should handle delay correctly", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      const startTime = Date.now();

      await watch(element, async function* () {
        yield* text("Before delay");
        yield* delay(100);
        yield* text("After delay");
      });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some margin
      expect(element.textContent).toBe("After delay");
    });

    it("should run arbitrary functions correctly", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      let sideEffectValue = 0;
      const results: any[] = [];

      await watch(element, async function* () {
        // Run function with return value
        const result1 = yield* run(() => {
          sideEffectValue = 42;
          return "done";
        });
        results.push(result1);

        // Run async function
        const result2 = yield* run(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return "async done";
        });
        results.push(result2);

        // Run function that accesses element
        const result3 = yield* run(() => {
          element.dataset.test = "value";
          return element.dataset.test;
        });
        results.push(result3);
      });

      expect(sideEffectValue).toBe(42);
      expect(results[0]).toBe("done");
      expect(results[1]).toBe("async done");
      expect(results[2]).toBe("value");
      expect(element.dataset.test).toBe("value");
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle complex form interactions", async () => {
      const form = document.createElement("form");
      form.innerHTML = `
        <input type="text" name="username" placeholder="Username">
        <input type="email" name="email" placeholder="Email">
        <input type="checkbox" name="subscribe" value="yes">
        <select name="role">
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Submit</button>
      `;
      container.appendChild(form);

      const usernameInput = form.querySelector(
        'input[name="username"]',
      ) as HTMLInputElement;
      const emailInput = form.querySelector(
        'input[name="email"]',
      ) as HTMLInputElement;
      const subscribeCheckbox = form.querySelector(
        'input[name="subscribe"]',
      ) as HTMLInputElement;
      const roleSelect = form.querySelector(
        'select[name="role"]',
      ) as HTMLSelectElement;

      // Watch individual inputs
      await watch(usernameInput, async function* () {
        yield* value("testuser");
        yield* addClass("valid");
        yield* attr("aria-invalid", "false");
      });

      await watch(emailInput, async function* () {
        yield* value("test@example.com");
        yield* addClass("valid");
        yield* attr("aria-invalid", "false");
      });

      await watch(subscribeCheckbox, async function* () {
        yield* checked(true);
        yield* attr("aria-describedby", "subscribe-help");
      });

      await watch(roleSelect, async function* () {
        yield* value("admin");
      });

      // Verify values
      expect(usernameInput.value).toBe("testuser");
      expect(emailInput.value).toBe("test@example.com");
      expect(subscribeCheckbox.checked).toBe(true);
      expect(roleSelect.value).toBe("admin");

      // Verify final state
      expect(form.dataset.formState).toBe("complete");
      expect(usernameInput.classList.contains("valid")).toBe(true);
      expect(emailInput.classList.contains("valid")).toBe(true);
    });

    it("should handle dynamic list manipulation", async () => {
      const list = document.createElement("ul");
      list.className = "todo-list";
      container.appendChild(list);

      const todos = [
        { id: 1, text: "First task", done: false },
        { id: 2, text: "Second task", done: true },
        { id: 3, text: "Third task", done: false },
      ];

      await watch(list, async function* () {
        // Build list HTML
        const todoHTML = todos
          .map(
            (todo) => `
          <li data-id="${todo.id}" class="${todo.done ? "done" : ""}">
            <span class="text">${todo.text}</span>
            <input type="checkbox" ${todo.done ? "checked" : ""}>
          </li>
        `,
          )
          .join("");

        yield* html(todoHTML);

        // Verify structure
        const items = yield* queryAll("li");
        expect(items.length).toBe(3);

        // Update item states
        for (const item of items) {
          const checkbox = item.querySelector(
            'input[type="checkbox"]',
          ) as HTMLInputElement;
          if (checkbox?.checked) {
            await watch(item, async function* () {
              yield* addClass("completed");
              yield* style({ "text-decoration": "line-through" });
            });
          }
        }

        // Add summary
        const completedCount = yield* queryAll("li.completed");
        yield* appendHtml(
          `<li class="summary">Completed: ${completedCount.length}/${todos.length}</li>`,
        );
      });

      // Verify final state
      const summaryItem = list.querySelector(".summary");
      expect(summaryItem?.textContent).toBe("Completed: 1/3");
    });

    it("should handle cascading style updates", async () => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-header">Header</div>
        <div class="card-body">Body</div>
        <div class="card-footer">Footer</div>
      `;
      container.appendChild(card);

      await watch(card, async function* () {
        // Apply theme
        const theme = "dark";

        if (theme === "dark") {
          yield* addClass("theme-dark");
          yield* style({
            backgroundColor: "#1a1a1a",
            color: "white",
            borderColor: "#333",
          });

          // Style children
          const header = yield* query(".card-header");
          if (header) {
            await watch(header, async function* () {
              yield* style({
                backgroundColor: "#2a2a2a",
                borderBottom: "1px solid #444",
              });
            });
          }

          const body = yield* query(".card-body");
          if (body) {
            await watch(body, async function* () {
              yield* style({ padding: "20px" });
            });
          }

          const footer = yield* query(".card-footer");
          if (footer) {
            await watch(footer, async function* () {
              yield* style({
                backgroundColor: "#2a2a2a",
                borderTop: "1px solid #444",
              });
            });
          }
        }

        // Add interactive states
        yield* attr("tabindex", "0");
        yield* attr("role", "article");
        yield* data("theme", theme);
      });

      // Verify styles applied
      expect(card.classList.contains("theme-dark")).toBe(true);
      expect(card.style.backgroundColor).toBe("rgb(26, 26, 26)");
      expect(card.dataset.theme).toBe("dark");
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle operations on null/undefined gracefully", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Query non-existent element
        const nonExistent = yield* query(".does-not-exist");
        expect(nonExistent).toBe(null);

        // Safe operations on null
        if (nonExistent) {
          // This block should not execute since nonExistent is null
        }

        // Get attribute that doesn't exist
        const noAttr = yield* getAttr("non-existent-attr");
        expect(noAttr).toBe(null);

        // Get data that doesn't exist
        const noData = yield* getData("non-existent-data");
        expect(noData).toBe(null);
      });
    });

    it("should handle rapid sequential updates", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Rapid text updates
        for (let i = 0; i < 100; i++) {
          yield* text(`Update ${i}`);
        }

        expect(element.textContent).toBe("Update 99");
      });
    });
  });
});
