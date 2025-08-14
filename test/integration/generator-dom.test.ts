/**
 * @fileoverview DOM integration tests for the unified API
 *
 * These tests verify that the unified API DOM functions work correctly
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
  async,
  queryAll,
  parent,
  children,
  siblings,
} from "../../src/index";
import { delay } from "../../src/core/async-wrapper";

describe("Unified API DOM Integration Tests", () => {
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

  describe("Text Manipulation", () => {
    it("should handle text operations with yield*", async () => {
      const div = document.createElement("div");
      div.textContent = "Original";
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Get original text
        const original = yield* text();
        expect(original).toBe("Original");

        // Set new text
        yield* text("New Text");

        // Verify change
        const newText = yield* text();
        expect(newText).toBe("New Text");

        // Update with dynamic content
        yield* text(`Updated: ${original}`);
      });

      expect(div.textContent).toBe("Updated: Original");
    });

    it("should handle complex text updates", async () => {
      const span = document.createElement("span");
      testContainer.appendChild(span);

      let counter = 0;

      await watch(span, async function* () {
        yield* text("Counter: 0");

        // Simulate multiple updates
        for (let i = 1; i <= 3; i++) {
          await delay(10);
          counter = i;
          yield* text(`Counter: ${counter}`);
        }
      });

      expect(span.textContent).toBe("Counter: 3");
      expect(counter).toBe(3);
    });
  });

  describe("HTML Manipulation", () => {
    it("should handle HTML operations with yield*", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Set HTML
        yield* html("<strong>Bold</strong> text");

        // Get HTML
        const content = yield* html();
        expect(content).toBe("<strong>Bold</strong> text");

        // Update HTML
        yield* html("<em>Italic</em> content");
      });

      expect(div.innerHTML).toBe("<em>Italic</em> content");
      expect(div.querySelector("em")?.textContent).toBe("Italic");
    });

    it("should handle nested HTML structures", async () => {
      const container = document.createElement("div");
      testContainer.appendChild(container);

      await watch(container, async function* () {
        yield* html(`
          <div class="header">
            <h1>Title</h1>
            <nav>
              <a href="#1">Link 1</a>
              <a href="#2">Link 2</a>
            </nav>
          </div>
          <div class="content">
            <p>Paragraph content</p>
          </div>
        `);

        // Verify structure
        const header = yield* query(".header");
        const title = yield* query("h1");
        const links = yield* queryAll("nav a");

        expect(header).toBeTruthy();
        expect(title?.textContent).toBe("Title");
        expect(links).toHaveLength(2);
        expect(links[0].getAttribute("href")).toBe("#1");
      });

      expect(container.querySelector(".header")).toBeTruthy();
      expect(container.querySelector("h1")?.textContent).toBe("Title");
      expect(container.querySelectorAll("nav a")).toHaveLength(2);
    });
  });

  describe("Class Manipulation", () => {
    it("should handle class operations with yield*", async () => {
      const div = document.createElement("div");
      div.className = "original existing";
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Check existing class
        const hasOriginal = yield* hasClass("original");
        expect(hasOriginal).toBe(true);

        // Add new class
        yield* addClass("new-class");
        const hasNew = yield* hasClass("new-class");
        expect(hasNew).toBe(true);

        // Toggle class
        yield* toggleClass("toggled");
        const hasToggled = yield* hasClass("toggled");
        expect(hasToggled).toBe(true);

        // Remove class
        yield* removeClass("original");
        const stillHasOriginal = yield* hasClass("original");
        expect(stillHasOriginal).toBe(false);

        // Multiple operations
        yield* addClass("class1");
        yield* addClass("class2");
        yield* removeClass("existing");
      });

      expect(div.classList.contains("original")).toBe(false);
      expect(div.classList.contains("existing")).toBe(false);
      expect(div.classList.contains("new-class")).toBe(true);
      expect(div.classList.contains("toggled")).toBe(true);
      expect(div.classList.contains("class1")).toBe(true);
      expect(div.classList.contains("class2")).toBe(true);
    });

    it("should handle conditional class application", async () => {
      const button = document.createElement("button");
      testContainer.appendChild(button);

      await watch(button, async function* () {
        // Simulate different states
        const states = ["loading", "success", "error"];

        for (const state of states) {
          // Clear previous state classes
          yield* removeClass("loading");
          yield* removeClass("success");
          yield* removeClass("error");

          // Add current state
          yield* addClass(state);
          yield* text(`State: ${state}`);

          // Verify state
          const hasState = yield* hasClass(state);
          expect(hasState).toBe(true);

          await delay(10);
        }
      });

      expect(button.classList.contains("error")).toBe(true);
      expect(button.classList.contains("loading")).toBe(false);
      expect(button.classList.contains("success")).toBe(false);
      expect(button.textContent).toBe("State: error");
    });
  });

  describe("Style Manipulation", () => {
    it("should handle style operations with yield*", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      await watch(div, async function* () {
        // Set individual styles
        yield* style("color", "red");
        yield* style("fontSize", "16px");
        yield* style("display", "block");

        // Get styles
        const color = yield* style("color");
        const fontSize = yield* style("fontSize");

        expect(color).toBe("red");
        expect(fontSize).toBe("16px");

        // Update styles
        yield* style("color", "blue");
        yield* style("padding", "10px");
      });

      expect(div.style.color).toBe("blue");
      expect(div.style.fontSize).toBe("16px");
      expect(div.style.padding).toBe("10px");
    });

    it("should handle complex styling scenarios", async () => {
      const card = document.createElement("div");
      card.className = "card";
      testContainer.appendChild(card);

      await watch(card, async function* () {
        // Apply theme styles
        const theme = "dark";

        if (theme === "dark") {
          yield* style("backgroundColor", "#333");
          yield* style("color", "#fff");
          yield* style("border", "1px solid #555");
        } else {
          yield* style("backgroundColor", "#fff");
          yield* style("color", "#333");
          yield* style("border", "1px solid #ddd");
        }

        // Add responsive styles
        yield* style("padding", "20px");
        yield* style("borderRadius", "8px");
        yield* style("boxShadow", "0 2px 4px rgba(0,0,0,0.1)");

        // Verify applied styles
        const bgColor = yield* style("backgroundColor");
        const textColor = yield* style("color");

        expect(bgColor).toBe("rgb(51, 51, 51)");
        expect(textColor).toBe("rgb(255, 255, 255)");
      });

      expect(card.style.backgroundColor).toBe("rgb(51, 51, 51)");
      expect(card.style.padding).toBe("20px");
      expect(card.style.borderRadius).toBe("8px");
    });
  });

  describe("Attribute Manipulation", () => {
    it("should handle attribute operations with yield*", async () => {
      const input = document.createElement("input");
      testContainer.appendChild(input);

      await watch(input, async function* () {
        // Set attributes
        yield* attr("type", "email");
        yield* attr("placeholder", "Enter email");
        yield* attr("required", "");
        yield* attr("data-validation", "email");

        // Check attributes
        const hasRequired = yield* hasAttr("required");
        expect(hasRequired).toBe(true);

        // Get attributes
        const type = yield* attr("type");
        const placeholder = yield* attr("placeholder");
        const validation = yield* attr("data-validation");

        expect(type).toBe("email");
        expect(placeholder).toBe("Enter email");
        expect(validation).toBe("email");

        // Remove attribute
        yield* removeAttr("required");
        const stillRequired = yield* hasAttr("required");
        expect(stillRequired).toBe(false);

        // Update attribute
        yield* attr("placeholder", "Email address");
      });

      expect(input.getAttribute("type")).toBe("email");
      expect(input.getAttribute("placeholder")).toBe("Email address");
      expect(input.getAttribute("data-validation")).toBe("email");
      expect(input.hasAttribute("required")).toBe(false);
    });

    it("should handle ARIA attributes", async () => {
      const button = document.createElement("button");
      testContainer.appendChild(button);

      await watch(button, async function* () {
        // Set ARIA attributes
        yield* attr("aria-label", "Close dialog");
        yield* attr("aria-expanded", "false");
        yield* attr("aria-controls", "menu");
        yield* attr("role", "button");

        // Simulate state change
        yield* attr("aria-expanded", "true");
        yield* addClass("expanded");

        // Verify ARIA state
        const expanded = yield* attr("aria-expanded");
        const label = yield* attr("aria-label");
        const controls = yield* attr("aria-controls");

        expect(expanded).toBe("true");
        expect(label).toBe("Close dialog");
        expect(controls).toBe("menu");
      });

      expect(button.getAttribute("aria-expanded")).toBe("true");
      expect(button.getAttribute("aria-label")).toBe("Close dialog");
      expect(button.classList.contains("expanded")).toBe(true);
    });
  });

  describe("Property Manipulation", () => {
    it("should handle property operations with yield*", async () => {
      const input = document.createElement("input") as HTMLInputElement;
      input.type = "text";
      testContainer.appendChild(input);

      await watch(input, function* () {
        // Set properties
        yield* prop("value", "initial value");
        yield* prop("disabled", false);
        yield* prop("readOnly", false);

        // Get properties
        const value = yield* prop("value");
        const disabled = yield* prop("disabled");

        expect(value).toBe("initial value");
        expect(disabled).toBe(false);

        // Update properties
        yield* prop("value", "updated value");
        yield* prop("disabled", true);
      });

      expect(input.value).toBe("updated value");
      expect(input.disabled).toBe(true);
    });

    it("should handle complex form properties", async () => {
      const select = document.createElement("select") as HTMLSelectElement;
      select.innerHTML = `
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
      `;
      testContainer.appendChild(select);

      await watch(select, async function* () {
        // Set selection
        yield* prop("selectedIndex", 1);

        // Get selection
        const selectedIndex = yield* prop("selectedIndex");
        const value = yield* prop("value");

        expect(selectedIndex).toBe(1);
        expect(value).toBe("2");

        // Change selection
        yield* prop("value", "3");
        const newValue = yield* prop("value");
        expect(newValue).toBe("3");
      });

      expect(select.value).toBe("3");
      expect(select.selectedIndex).toBe(2);
    });
  });

  describe("Data Attributes", () => {
    it("should handle data operations with yield*", async () => {
      const div = document.createElement("div");
      testContainer.appendChild(div);

      await watch(div, function* () {
        // Set data attributes
        yield* data("user-id", "123");
        yield* data("role", "admin");
        yield* data("config", "{}");

        // Get data attributes
        const userId = yield* data("user-id");
        const role = yield* data("role");
        const config = yield* data("config");

        expect(userId).toBe("123");
        expect(role).toBe("admin");
        expect(config).toBe("{}");

        // Update data
        yield* data("user-id", "456");
        yield* data("last-updated", new Date().toISOString());
      });

      expect(div.dataset.userId).toBe("456");
      expect(div.dataset.role).toBe("admin");
      expect(div.dataset.lastUpdated).toBeTruthy();
    });
  });

  describe("Form Value Operations", () => {
    it("should handle form values with yield*", async () => {
      const input = document.createElement("input") as HTMLInputElement;
      input.type = "text";
      testContainer.appendChild(input);

      await watch(input, async function* () {
        // Set value
        yield* value("test input");

        // Get value
        const val = yield* value();
        expect(val).toBe("test input");

        // Update value
        yield* value("updated input");
      });

      expect(input.value).toBe("updated input");
    });

    it("should handle checkbox states with yield*", async () => {
      const checkbox = document.createElement("input") as HTMLInputElement;
      checkbox.type = "checkbox";
      testContainer.appendChild(checkbox);

      await watch(checkbox, async function* () {
        // Set checked
        yield* checked(true);

        // Get checked state
        const isChecked = yield* checked();
        expect(isChecked).toBe(true);

        // Toggle
        yield* checked(false);
        const isUnchecked = yield* checked();
        expect(isUnchecked).toBe(false);
      });

      expect(checkbox.checked).toBe(false);
    });

    it("should handle complex form scenarios", async () => {
      const form = document.createElement("form");
      form.innerHTML = `
        <input type="text" name="name" />
        <input type="email" name="email" />
        <select name="country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="uk">United Kingdom</option>
        </select>
        <input type="checkbox" name="newsletter" />
        <textarea name="message"></textarea>
      `;
      testContainer.appendChild(form);

      await watch(form, function* () {
        // Fill out form
        const nameInput = yield* query('input[name="name"]');
        const emailInput = yield* query('input[name="email"]');
        const countrySelect = yield* query('select[name="country"]');
        const newsletterCheck = yield* query('input[name="newsletter"]');
        const messageTextarea = yield* query('textarea[name="message"]');

        if (nameInput) {
          yield* value(nameInput as HTMLElement, "John Doe");
        }
        if (emailInput) {
          yield* value(emailInput as HTMLElement, "john@example.com");
        }
        if (countrySelect) {
          yield* prop(countrySelect as HTMLElement, "value", "ca");
        }
        if (newsletterCheck) {
          yield* checked(newsletterCheck as HTMLElement, true);
        }
        if (messageTextarea) {
          yield* value(messageTextarea as HTMLElement, "Hello world!");
        }

        // Verify values
        const name = nameInput ? yield* value(nameInput as HTMLElement) : "";
        const email = emailInput ? yield* value(emailInput as HTMLElement) : "";
        const country = countrySelect
          ? yield* prop(countrySelect as HTMLElement, "value")
          : "";
        const newsletter = newsletterCheck
          ? yield* checked(newsletterCheck as HTMLElement)
          : false;
        const message = messageTextarea
          ? yield* value(messageTextarea as HTMLElement)
          : "";

        expect(name).toBe("John Doe");
        expect(email).toBe("john@example.com");
        expect(country).toBe("ca");
        expect(newsletter).toBe(true);
        expect(message).toBe("Hello world!");
      });

      const nameInput = form.querySelector(
        'input[name="name"]',
      ) as HTMLInputElement;
      const emailInput = form.querySelector(
        'input[name="email"]',
      ) as HTMLInputElement;
      const countrySelect = form.querySelector(
        'select[name="country"]',
      ) as HTMLSelectElement;
      const newsletterCheck = form.querySelector(
        'input[name="newsletter"]',
      ) as HTMLInputElement;
      const messageTextarea = form.querySelector(
        'textarea[name="message"]',
      ) as HTMLTextAreaElement;

      expect(nameInput.value).toBe("John Doe");
      expect(emailInput.value).toBe("john@example.com");
      expect(countrySelect.value).toBe("ca");
      expect(newsletterCheck.checked).toBe(true);
      expect(messageTextarea.value).toBe("Hello world!");
    });
  });

  describe("Visibility Operations", () => {
    it("should handle show/hide with yield*", async () => {
      const div = document.createElement("div");
      div.style.display = "block";
      div.textContent = "Visible content";
      testContainer.appendChild(div);

      await watch(div, function* () {
        // Hide element
        yield* hide();

        yield* async(delay(10));

        // Show element
        yield* show();
      });

      expect(div.style.display).not.toBe("none");
    });

    it("should handle conditional visibility", async () => {
      const modal = document.createElement("div");
      modal.className = "modal";
      modal.innerHTML = `
        <div class="backdrop"></div>
        <div class="content">
          <h2>Modal Title</h2>
          <p>Modal content</p>
          <button class="close">Close</button>
        </div>
      `;
      testContainer.appendChild(modal);

      await watch(modal, function* () {
        // Start hidden
        yield* hide();
        yield* addClass("modal-hidden");

        // Show modal
        yield* show();
        yield* removeClass("modal-hidden");
        yield* addClass("modal-visible");

        // Add animation classes
        yield* addClass("fade-in");

        await delay(100);

        // Hide modal
        yield* removeClass("fade-in");
        yield* addClass("fade-out");

        await delay(50);

        yield* hide();
        yield* removeClass("modal-visible");
        yield* removeClass("fade-out");
        yield* addClass("modal-hidden");
      });

      expect(modal.style.display).toBe("none");
      expect(modal.classList.contains("modal-hidden")).toBe(true);
      expect(modal.classList.contains("modal-visible")).toBe(false);
    });
  });

  describe("DOM Traversal", () => {
    it("should handle traversal operations with yield*", async () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <div class="parent">
          <span class="child1">Child 1</span>
          <span class="child2">Child 2</span>
          <div class="nested">
            <span class="grandchild">Grandchild</span>
          </div>
        </div>
      `;
      testContainer.appendChild(container);

      const parentDiv = container.querySelector(".parent") as HTMLElement;
      const child2 = container.querySelector(".child2") as HTMLElement;

      await watch(child2, function* () {
        // Get parent
        const parentElement = yield* parent();
        expect(parentElement).toBe(parentDiv);

        // Get siblings
        const siblingElements = yield* siblings();
        expect(siblingElements).toHaveLength(2); // child1 and nested div

        // Verify sibling content
        const child1 = siblingElements.find((el) =>
          el.classList.contains("child1"),
        );
        const nested = siblingElements.find((el) =>
          el.classList.contains("nested"),
        );

        expect(child1?.textContent).toBe("Child 1");
        expect(nested?.querySelector(".grandchild")?.textContent).toBe(
          "Grandchild",
        );
      });

      await watch(parentDiv, function* () {
        // Get children
        const childElements = yield* children();
        expect(childElements).toHaveLength(3);

        // Query within context
        const child1 = yield* query(".child1");
        const grandchild = yield* query(".grandchild");

        expect(child1?.textContent).toBe("Child 1");
        expect(grandchild?.textContent).toBe("Grandchild");

        // Query all spans
        const allSpans = yield* queryAll("span");
        expect(allSpans).toHaveLength(3);
      });
    });
  });

  describe("Focus Management", () => {
    it("should handle focus operations with yield*", async () => {
      const input = document.createElement("input") as HTMLInputElement;
      input.type = "text";
      input.placeholder = "Focus test";
      testContainer.appendChild(input);

      await watch(input, function* () {
        // Focus element
        yield* focus();

        await delay(10);

        // Blur element
        yield* blur();
      });

      // Note: In test environment, actual focus behavior may vary
      // but the functions should execute without error
      expect(input.placeholder).toBe("Focus test");
    });
  });

  describe("Complex DOM Workflows", () => {
    it("should handle complex DOM manipulation workflow", async () => {
      const app = document.createElement("div");
      app.className = "app";
      testContainer.appendChild(app);

      await watch(app, function* () {
        // Build app structure
        yield* html(`
          <header class="header">
            <h1>My App</h1>
            <nav class="nav"></nav>
          </header>
          <main class="main">
            <div class="content"></div>
          </main>
          <footer class="footer">
            <p>&copy; 2024</p>
          </footer>
        `);

        // Style the app
        yield* style("minHeight", "100vh");
        yield* style("display", "flex");
        yield* style("flexDirection", "column");

        // Enhance header
        const header = yield* query(".header");
        if (header) {
          yield* style(header as HTMLElement, "padding", "20px");
          yield* style(header as HTMLElement, "backgroundColor", "#f0f0f0");
          yield* addClass(header as HTMLElement, "app-header");
        }

        // Add navigation items
        const nav = yield* query(".nav");
        if (nav) {
          yield* html(
            nav as HTMLElement,
            `
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          `,
          );

          const navLinks = yield* queryAll(nav as HTMLElement, "a");
          for (const link of navLinks) {
            yield* style(link, "margin", "0 10px");
            yield* style(link, "textDecoration", "none");
            yield* addClass(link, "nav-link");
          }
        }

        // Style main content
        const main = yield* query(".main");
        if (main) {
          yield* style(main as HTMLElement, "flex", "1");
          yield* style(main as HTMLElement, "padding", "20px");
          yield* addClass(main as HTMLElement, "app-main");
        }

        // Add content
        const content = yield* query(".content");
        if (content) {
          yield* html(
            content as HTMLElement,
            `
            <h2>Welcome</h2>
            <p>This is a complex DOM manipulation example.</p>
            <button class="cta">Get Started</button>
          `,
          );

          const button = yield* query(content as HTMLElement, ".cta");
          if (button) {
            yield* style(button, "padding", "10px 20px");
            yield* style(button, "backgroundColor", "#007bff");
            yield* style(button, "color", "white");
            yield* style(button, "border", "none");
            yield* style(button, "borderRadius", "4px");
            yield* addClass(button, "primary-button");
          }
        }

        // Final app class
        yield* addClass("initialized");
      });

      // Verify final structure
      expect(app.classList.contains("initialized")).toBe(true);
      expect(app.querySelector(".header")).toBeTruthy();
      expect(app.querySelector("h1")?.textContent).toBe("My App");
      expect(app.querySelectorAll(".nav a")).toHaveLength(3);
      expect(app.querySelector(".cta")).toBeTruthy();
      expect(app.style.minHeight).toBe("100vh");
    });
  });
});
