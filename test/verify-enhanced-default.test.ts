import { describe, it, expect, beforeEach, vi } from "vitest";
import { watch, runOn } from "../src";

// Helper to create test elements
function createTestElement(
  tag: string = "div",
  attributes: Record<string, string> = {},
): HTMLElement {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  document.body.appendChild(element);
  return element;
}

// Helper to wait for DOM mutations
function waitForMutation(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

describe("Enhanced API as Default", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("Watch with enhanced context by default", () => {
    it("should have DOM helpers attached to context", async () => {
      const button = createTestElement("button");
      let contextChecked = false;

      watch(button, function* (ctx) {
        // Check that context has DOM helpers attached
        expect(ctx.text).toBeDefined();
        expect(ctx.addClass).toBeDefined();
        expect(ctx.removeClass).toBeDefined();
        expect(ctx.style).toBeDefined();
        expect(ctx.attr).toBeDefined();
        expect(ctx.parent).toBeDefined();
        expect(ctx.children).toBeDefined();
        expect(ctx.siblings).toBeDefined();
        contextChecked = true;
      });

      await waitForMutation();
      expect(contextChecked).toBe(true);
    });

    it("should allow using context DOM helpers with yield*", async () => {
      const div = createTestElement("div");

      watch(div, function* (ctx) {
        // Use attached DOM helpers
        yield* ctx.text("Hello Enhanced!");
        yield* ctx.addClass("enhanced-class");
        yield* ctx.style("color", "blue");
      });

      await waitForMutation();
      expect(div.textContent).toBe("Hello Enhanced!");
      expect(div.classList.contains("enhanced-class")).toBe(true);
      expect(div.style.color).toBe("blue");
    });

    it("should support reading values with context helpers", async () => {
      const input = createTestElement("input") as HTMLInputElement;
      input.value = "initial";
      let readValue = "";

      await runOn(input, function* (ctx) {
        // Set and read value using context
        yield* ctx.value("updated");
        readValue = yield* ctx.value();
      });

      expect(readValue).toBe("updated");
      expect(input.value).toBe("updated");
    });

    it("should support DOM traversal with context helpers", async () => {
      const parent = createTestElement("div", { class: "parent" });
      const child1 = createTestElement("span", { class: "child" });
      const child2 = createTestElement("button", { class: "child" });
      parent.appendChild(child1);
      parent.appendChild(child2);

      await runOn(child1, function* (ctx) {
        // Test parent traversal
        const parentEl = yield* ctx.parent();
        expect(parentEl).toBe(parent);

        // Test sibling traversal
        const siblings = yield* ctx.siblings();
        expect(siblings).toHaveLength(1);
        expect(siblings[0]).toBe(child2);
      });

      await runOn(parent, function* (ctx) {
        // Test children traversal
        const children = yield* ctx.children();
        expect(children).toHaveLength(2);
        expect(children).toContain(child1);
        expect(children).toContain(child2);

        // Test query
        const button = yield* ctx.query("button");
        expect(button).toBe(child2);
      });
    });

    it("should maintain type safety with enhanced context", async () => {
      const button = createTestElement("button", { id: "test-btn" });

      watch("button", function* (ctx) {
        // TypeScript should know ctx is EnhancedTypedGeneratorContext<HTMLButtonElement>
        const btn = ctx.self();
        expect(btn).toBeInstanceOf(HTMLButtonElement);

        // Element property should also be typed
        expect(ctx.element).toBeInstanceOf(HTMLButtonElement);
      });

      await waitForMutation();
    });
  });

  describe("Backward compatibility", () => {
    it("should still allow yielding functions directly (without context)", async () => {
      const div = createTestElement("div");

      // Import functions directly
      const { text, addClass } = await import("../src");

      watch(div, function* () {
        // Old pattern should still work
        yield text("Old Pattern");
        yield addClass("old-class");
      });

      await waitForMutation();
      expect(div.textContent).toBe("Old Pattern");
      expect(div.classList.contains("old-class")).toBe(true);
    });

    it("should allow mixing patterns", async () => {
      const div = createTestElement("div");

      // Import functions for old pattern
      const { text, addClass } = await import("../src");

      watch(div, function* (ctx) {
        // Mix both patterns
        yield text("Mixed"); // Old pattern
        yield* ctx.addClass("mixed-class"); // New pattern with context
      });

      await waitForMutation();
      expect(div.textContent).toBe("Mixed");
      expect(div.classList.contains("mixed-class")).toBe(true);
    });
  });

  describe("Generator module compatibility", () => {
    it("should work with pure generator imports", async () => {
      const button = createTestElement("button");

      // Import from generator submodule
      const { text, addClass } = await import("../src/generator");

      watch(button, async function* () {
        // Direct yield* without context
        yield* text("Generator Module");
        yield* addClass("gen-class");
      });

      await waitForMutation();
      expect(button.textContent).toBe("Generator Module");
      expect(button.classList.contains("gen-class")).toBe(true);
    });
  });

  describe("Parent/Child/Sibling helpers", () => {
    it("should work with enhanced context", async () => {
      const container = createTestElement("div", { class: "container" });
      const card1 = createTestElement("div", { class: "card" });
      const card2 = createTestElement("div", { class: "card" });
      const card3 = createTestElement("div", { class: "card" });

      container.appendChild(card1);
      container.appendChild(card2);
      container.appendChild(card3);

      await runOn(card2, function* (ctx) {
        // Get parent using context
        const parent = yield* ctx.parent();
        expect(parent).toBe(container);
        expect(parent?.classList.contains("container")).toBe(true);

        // Get siblings using context
        const siblings = yield* ctx.siblings(".card");
        expect(siblings).toHaveLength(2);
        expect(siblings).toContain(card1);
        expect(siblings).toContain(card3);
        expect(siblings).not.toContain(card2);
      });

      await runOn(container, function* (ctx) {
        // Get children using context
        const allChildren = yield* ctx.children();
        expect(allChildren).toHaveLength(3);

        // Get filtered children
        const cards = yield* ctx.children(".card");
        expect(cards).toHaveLength(3);
        expect(cards).toContain(card1);
        expect(cards).toContain(card2);
        expect(cards).toContain(card3);
      });
    });

    it("should handle edge cases for parent/child/sibling", async () => {
      const orphan = createTestElement("div");

      await runOn(orphan, function* (ctx) {
        // Orphan element has no parent (body doesn't count in test env)
        const parent = yield* ctx.parent();
        expect(parent?.tagName).toBe("BODY");

        // No siblings if no parent or only child
        const siblings = yield* ctx.siblings();
        // In test environment, might have other elements
        expect(Array.isArray(siblings)).toBe(true);

        // No children for empty element
        const children = yield* ctx.children();
        expect(children).toHaveLength(0);
      });
    });
  });

  describe("Type inference verification", () => {
    it("should infer correct element types from selectors", async () => {
      createTestElement("button", { id: "btn1" });
      createTestElement("input", { type: "text", id: "input1" });
      createTestElement("form", { id: "form1" });

      // Button selector should give HTMLButtonElement context
      watch("button", function* (ctx) {
        const btn = ctx.self();
        expect(btn).toBeInstanceOf(HTMLButtonElement);
      });

      // Input selector should give HTMLInputElement context
      watch('input[type="text"]', function* (ctx) {
        const input = ctx.self();
        expect(input).toBeInstanceOf(HTMLInputElement);
      });

      // Form selector should give HTMLFormElement context
      watch("form", function* (ctx) {
        const form = ctx.self();
        expect(form).toBeInstanceOf(HTMLFormElement);
      });

      await waitForMutation();
    });
  });

  describe("Legacy API access", () => {
    it("should provide access to legacy watch through explicit import", async () => {
      // Import legacy version
      const { watchLegacy } = await import("../src");

      const div = createTestElement("div");
      let executed = false;

      watchLegacy(div, function* () {
        executed = true;
        // Legacy version might not have context parameter or might be different
        yield () => {
          div.textContent = "Legacy";
        };
      });

      await waitForMutation();
      expect(executed).toBe(true);
      expect(div.textContent).toBe("Legacy");
    });
  });
});
