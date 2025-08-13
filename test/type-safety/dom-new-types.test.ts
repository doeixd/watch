/**
 * Type safety tests for dom-new.ts
 *
 * These tests verify that the enhanced type system in dom-new.ts
 * provides proper type inference and constraints.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Window } from "happy-dom";
import {
  text,
  html,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  style,
  attr,
  removeAttr,
  hasAttr,
  prop,
  data,
  value,
  checked,
  focus,
  blur,
  show,
  hide,
  query,
  queryAll,
  parent,
  children,
  siblings,
  batchAll,
  safeHtml,
  type CSSLength,
  type CSSColor,
  type DisplayValue,
  type PositionValue,
  type StyleObject,
  type AttributeObject,
  type DataObject,
  type FormElement,
  type FocusableElement,
  type ValueElement,
  type InferElementFromSelector,
} from "../../src/api/dom-new";

describe("DOM API Type Safety", () => {
  let window: Window;
  let document: Document;

  beforeEach(() => {
    window = new Window();
    document = window.document;
    global.document = document as any;
    global.HTMLElement = window.HTMLElement as any;
    global.Element = window.Element as any;
    global.Node = window.Node as any;
    global.Document = window.Document as any;
  });

  afterEach(() => {
    window.close();
  });

  describe("Type Inference", () => {
    it("should infer element types from selectors", () => {
      document.body.innerHTML = `
        <button id="btn">Click me</button>
        <input id="input" value="test" />
        <div id="div">Content</div>
      `;

      // Type inference tests
      const button = document.getElementById("btn") as HTMLButtonElement;
      const input = document.getElementById("input") as HTMLInputElement;
      const div = document.getElementById("div") as HTMLDivElement;

      // Direct element manipulation should preserve types
      text(button, "New Text");
      const buttonText = text(button);
      expect(buttonText).toBe("New Text");

      // Value should work with ValueElement types
      value(input, "new value");
      const inputValue = value(input);
      expect(inputValue).toBe("new value");

      // Style should accept StyleObject with proper types
      const styles: StyleObject = {
        display: "block",
        color: "red",
        padding: "10px",
      };
      style(div, styles);

      // Attribute should accept AttributeObject
      const attrs: AttributeObject = {
        "data-test": "value",
        "aria-label": "Test Label",
        disabled: true,
      };
      attr(div, attrs);
    });

    it("should handle CSS type literals correctly", () => {
      document.body.innerHTML = '<div id="test">Test</div>';
      const div = document.getElementById("test") as HTMLDivElement;

      // CSSLength types
      const validLengths: CSSLength[] = [
        "10px",
        "2em",
        "50%",
        "100vh",
        0,
        "0",
        "auto",
        "inherit",
      ];

      validLengths.forEach((length) => {
        style(div, "width", length as any);
      });

      // CSSColor types
      const validColors: CSSColor[] = [
        "#ff0000",
        "rgb(255, 0, 0)",
        "rgba(255, 0, 0, 0.5)",
        "hsl(0, 100%, 50%)",
        "transparent",
        "currentColor",
      ];

      validColors.forEach((color) => {
        style(div, "color", color as any);
      });

      // DisplayValue types
      const displayValues: DisplayValue[] = [
        "none",
        "block",
        "inline",
        "flex",
        "grid",
      ];

      displayValues.forEach((display) => {
        style(div, "display", display);
      });

      // PositionValue types
      const positionValues: PositionValue[] = [
        "static",
        "relative",
        "absolute",
        "fixed",
        "sticky",
      ];

      positionValues.forEach((position) => {
        style(div, "position", position);
      });
    });

    it("should handle form element types correctly", () => {
      document.body.innerHTML = `
        <input id="text-input" type="text" value="test" />
        <textarea id="textarea">content</textarea>
        <select id="select">
          <option value="1">One</option>
          <option value="2">Two</option>
        </select>
        <input id="checkbox" type="checkbox" />
      `;

      const textInput = document.getElementById(
        "text-input",
      ) as HTMLInputElement;
      const textarea = document.getElementById(
        "textarea",
      ) as HTMLTextAreaElement;
      const select = document.getElementById("select") as HTMLSelectElement;
      const checkbox = document.getElementById("checkbox") as HTMLInputElement;

      // FormElement type should work with all form controls
      const formElements: FormElement[] = [textInput, textarea, select];

      formElements.forEach((el) => {
        value(el, "new value");
        const val = value(el);
        expect(typeof val).toBe("string");
      });

      // Checked should only work with checkbox/radio inputs
      checked(checkbox, true);
      expect(checked(checkbox)).toBe(true);
    });

    it("should handle focusable element types", () => {
      document.body.innerHTML = `
        <button id="button">Button</button>
        <input id="input" />
        <a href="#" id="link">Link</a>
      `;

      const button = document.getElementById("button") as HTMLButtonElement;
      const input = document.getElementById("input") as HTMLInputElement;
      const link = document.getElementById("link") as HTMLAnchorElement;

      const focusableElements: FocusableElement[] = [button, input, link];

      focusableElements.forEach((el) => {
        // These should work with FocusableElement
        focus(el);
        blur(el);
      });
    });
  });

  describe("Query Functions with Type Safety", () => {
    it("should return properly typed elements from queries", () => {
      document.body.innerHTML = `
        <div class="container">
          <button class="btn">Button 1</button>
          <button class="btn">Button 2</button>
          <input class="field" />
          <span class="text">Text</span>
        </div>
      `;

      const container = document.querySelector(".container") as HTMLDivElement;

      // Query with type parameter
      const button = query<HTMLButtonElement>(container, ".btn");
      expect(button).toBeInstanceOf(window.HTMLButtonElement);

      // QueryAll with type parameter
      const buttons = queryAll<HTMLButtonElement>(container, ".btn");
      expect(buttons).toHaveLength(2);
      buttons.forEach((btn) => {
        expect(btn).toBeInstanceOf(window.HTMLButtonElement);
      });

      // Parent traversal
      if (button) {
        const parentDiv = parent(button);
        expect(parentDiv).toBe(container);
      }

      // Children traversal
      const allChildren = children(container);
      expect(allChildren).toHaveLength(4);

      // Siblings traversal
      const firstButton = buttons[0];
      if (firstButton) {
        const sibs = siblings(firstButton);
        expect(sibs).toHaveLength(3);
      }
    });

    it("should handle selector-based queries", () => {
      document.body.innerHTML = `
        <div id="parent">
          <div class="child">Child 1</div>
          <div class="child">Child 2</div>
        </div>
      `;

      // Direct selector queries
      const parent = query("#parent");
      expect(parent).toBeInstanceOf(window.HTMLDivElement);

      const children = queryAll(".child");
      expect(children).toHaveLength(2);

      // Parent-child selector queries
      const child = query("#parent", ".child");
      expect(child).toBeInstanceOf(window.HTMLDivElement);

      const allChildren = queryAll("#parent", ".child");
      expect(allChildren).toHaveLength(2);
    });
  });

  describe("Batch Operations", () => {
    it("should handle batch operations with type safety", () => {
      document.body.innerHTML = `
        <div class="item">Item 1</div>
        <div class="item">Item 2</div>
        <div class="item">Item 3</div>
      `;

      const items = document.querySelectorAll(".item");
      const itemsArray = Array.from(items) as HTMLDivElement[];

      // Batch operations with element array
      batchAll(itemsArray, [
        (el) => addClass(el, "processed"),
        (el) => attr(el, "data-processed", "true"),
        (el) => style(el, "color", "blue"),
      ]);

      itemsArray.forEach((item) => {
        expect(item.classList.contains("processed")).toBe(true);
        expect(item.getAttribute("data-processed")).toBe("true");
        expect(item.style.color).toBe("blue");
      });

      // Batch operations with selectors
      batchAll([".item"], [(el) => addClass(el, "batch-processed")]);

      itemsArray.forEach((item) => {
        expect(item.classList.contains("batch-processed")).toBe(true);
      });
    });
  });

  describe("Safe HTML", () => {
    it("should sanitize HTML content", () => {
      document.body.innerHTML = '<div id="target"></div>';
      const target = document.getElementById("target") as HTMLDivElement;

      // Should remove script tags
      safeHtml(target, '<p>Safe content</p><script>alert("xss")</script>');
      expect(target.innerHTML).not.toContain("<script>");
      expect(target.innerHTML).toContain("<p>Safe content</p>");

      // Should remove event handlers
      safeHtml(target, "<div onclick=\"alert('xss')\">Click me</div>");
      expect(target.innerHTML).not.toContain("onclick");

      // Should preserve safe attributes
      safeHtml(target, '<div class="safe" id="safe-id">Content</div>');
      expect(target.innerHTML).toContain('class="safe"');
      expect(target.innerHTML).toContain('id="safe-id"');
    });
  });

  describe("Data Operations", () => {
    it("should handle data operations with proper typing", () => {
      document.body.innerHTML = '<div id="test"></div>';
      const div = document.getElementById("test") as HTMLDivElement;

      // Set and get typed data
      interface UserData {
        name: string;
        age: number;
        active: boolean;
      }

      const userData: DataObject<UserData> = {
        user: {
          name: "John",
          age: 30,
          active: true,
        },
      };

      data(div, userData);

      // Individual data attributes
      data(div, "test-key", "test-value");
      expect(div.dataset.testKey).toBe("test-value");

      data(div, "numeric", 42);
      expect(div.dataset.numeric).toBe("42");

      data(div, "boolean", true);
      expect(div.dataset.boolean).toBe("true");
    });
  });

  describe("Class Operations", () => {
    it("should handle class operations with type safety", () => {
      document.body.innerHTML = '<div id="test" class="initial"></div>';
      const div = document.getElementById("test") as HTMLDivElement;

      // Add single class
      addClass(div, "new-class");
      expect(div.classList.contains("new-class")).toBe(true);

      // Add multiple classes
      addClass(div, "class1 class2 class3");
      expect(div.classList.contains("class1")).toBe(true);
      expect(div.classList.contains("class2")).toBe(true);
      expect(div.classList.contains("class3")).toBe(true);

      // Remove classes
      removeClass(div, "class1 class2");
      expect(div.classList.contains("class1")).toBe(false);
      expect(div.classList.contains("class2")).toBe(false);
      expect(div.classList.contains("class3")).toBe(true);

      // Toggle classes
      toggleClass(div, "toggle-class");
      expect(div.classList.contains("toggle-class")).toBe(true);
      toggleClass(div, "toggle-class");
      expect(div.classList.contains("toggle-class")).toBe(false);

      // Check class
      expect(hasClass(div, "class3")).toBe(true);
      expect(hasClass(div, "non-existent")).toBe(false);
    });
  });

  describe("Visibility Operations", () => {
    it("should handle show/hide operations", () => {
      document.body.innerHTML = '<div id="test">Content</div>';
      const div = document.getElementById("test") as HTMLDivElement;

      // Hide element
      hide(div);
      expect(div.style.display).toBe("none");

      // Show element
      show(div);
      expect(div.style.display).toBe("");

      // Hide with selector
      hide("#test");
      const hiddenDiv = document.getElementById("test") as HTMLDivElement;
      expect(hiddenDiv.style.display).toBe("none");

      // Show with selector
      show("#test");
      const shownDiv = document.getElementById("test") as HTMLDivElement;
      expect(shownDiv.style.display).toBe("");
    });
  });

  describe("Property Operations", () => {
    it("should handle property operations with type safety", () => {
      document.body.innerHTML = '<input id="test" type="text" />';
      const input = document.getElementById("test") as HTMLInputElement;

      // Set properties
      prop(input, "disabled", true);
      expect(input.disabled).toBe(true);

      prop(input, "readOnly", true);
      expect(input.readOnly).toBe(true);

      prop(input, "value", "test value");
      expect(input.value).toBe("test value");

      // Set multiple properties
      prop(input, {
        disabled: false,
        readOnly: false,
        placeholder: "Enter text",
      });
      expect(input.disabled).toBe(false);
      expect(input.readOnly).toBe(false);
      expect(input.placeholder).toBe("Enter text");
    });
  });
});
