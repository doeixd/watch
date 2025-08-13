/**
 * Type safety tests for watch-enhanced.ts
 *
 * These tests verify that the enhanced watch function provides proper
 * type inference and context typing with all DOM functions attached.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Window } from "happy-dom";
import {
  watchEnhanced,
  runOnEnhanced,
  scopedWatchEnhanced,
} from "../../src/watch-enhanced";
import type { EnhancedTypedGeneratorContext } from "../../src/core/enhanced-context/context-with-dom";
import type { Operation } from "../../src/types";

describe("Watch Enhanced Type Safety", () => {
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
    global.MutationObserver = window.MutationObserver as any;
  });

  afterEach(() => {
    window.close();
  });

  describe("Enhanced Context Type Inference", () => {
    it("should provide properly typed context with all DOM functions", () => {
      document.body.innerHTML = `
        <button id="btn">Click me</button>
      `;

      const controller = watchEnhanced("button", function* (ctx) {
        // Context should have all DOM functions attached
        expect(typeof ctx.text).toBe("function");
        expect(typeof ctx.html).toBe("function");
        expect(typeof ctx.addClass).toBe("function");
        expect(typeof ctx.removeClass).toBe("function");
        expect(typeof ctx.toggleClass).toBe("function");
        expect(typeof ctx.hasClass).toBe("function");
        expect(typeof ctx.style).toBe("function");
        expect(typeof ctx.attr).toBe("function");
        expect(typeof ctx.prop).toBe("function");
        expect(typeof ctx.data).toBe("function");
        expect(typeof ctx.query).toBe("function");
        expect(typeof ctx.queryAll).toBe("function");
        expect(typeof ctx.parent).toBe("function");
        expect(typeof ctx.children).toBe("function");
        expect(typeof ctx.siblings).toBe("function");

        // Event functions
        expect(typeof ctx.on).toBe("function");
        expect(typeof ctx.click).toBe("function");
        expect(typeof ctx.input).toBe("function");
        expect(typeof ctx.change).toBe("function");
        expect(typeof ctx.submit).toBe("function");

        // State functions
        expect(typeof ctx.setState).toBe("function");
        expect(typeof ctx.getState).toBe("function");
        expect(typeof ctx.updateState).toBe("function");

        // Lifecycle functions
        expect(typeof ctx.onMount).toBe("function");
        expect(typeof ctx.onUnmount).toBe("function");
        expect(typeof ctx.cleanup).toBe("function");
      });

      // Cleanup
      controller.destroy();
    });

    it("should infer element type from selector", () => {
      document.body.innerHTML = `
        <button id="btn">Button</button>
        <input id="input" value="test" />
        <form id="form"></form>
      `;

      // Button selector should provide HTMLButtonElement context
      const buttonController = watchEnhanced("button", function* (ctx) {
        // ctx.self() should return HTMLButtonElement
        const self = ctx.self();
        expect(self).toBeInstanceOf(window.HTMLButtonElement);
      });

      // Input selector should provide HTMLInputElement context
      const inputController = watchEnhanced("input", function* (ctx) {
        const self = ctx.self();
        expect(self).toBeInstanceOf(window.HTMLInputElement);

        // Value function should work
        const value = yield* ctx.value();
        expect(value).toBe("test");
      });

      // Form selector should provide HTMLFormElement context
      const formController = watchEnhanced("form", function* (ctx) {
        const self = ctx.self();
        expect(self).toBeInstanceOf(window.HTMLFormElement);
      });

      buttonController.destroy();
      inputController.destroy();
      formController.destroy();
    });
  });

  describe("Generator Return Types", () => {
    it("should support typed generator return values", () => {
      document.body.innerHTML = `<div id="test">Content</div>`;

      interface Result {
        processed: boolean;
        message: string;
      }

      const controller = watchEnhanced<string, Result>(
        "#test",
        function* (ctx): Generator<Operation<any>, Result, unknown> {
          yield* ctx.addClass("processing");

          return {
            processed: true,
            message: "Complete",
          };
        },
      );

      controller.destroy();
    });

    it("should support async generator return types", () => {
      document.body.innerHTML = `<div id="test">Content</div>`;

      interface AsyncResult {
        data: string[];
        timestamp: number;
      }

      const controller = watchEnhanced<string, AsyncResult>(
        "#test",
        async function* (
          ctx,
        ): AsyncGenerator<Operation<any>, AsyncResult, unknown> {
          yield* ctx.addClass("loading");

          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 10));

          yield* ctx.removeClass("loading");

          return {
            data: ["item1", "item2"],
            timestamp: Date.now(),
          };
        },
      );

      controller.destroy();
    });
  });

  describe("Event Delegation Type Safety", () => {
    it("should handle parent-child selector with proper types", () => {
      document.body.innerHTML = `
        <div class="container">
          <button class="btn">Button 1</button>
          <button class="btn">Button 2</button>
        </div>
      `;

      const container = document.querySelector(".container") as HTMLDivElement;

      const controller = watchEnhanced(container, ".btn", function* (ctx) {
        // Context should be for button elements
        const self = ctx.self();
        expect(self).toBeInstanceOf(window.HTMLButtonElement);

        yield* ctx.click(function* () {
          yield* ctx.addClass("clicked");
        });
      });

      controller.destroy();
    });
  });

  describe("Scoped Watch Enhanced", () => {
    it("should provide enhanced context in scoped watch", () => {
      document.body.innerHTML = `
        <div id="parent">
          <span class="child">Child 1</span>
          <span class="child">Child 2</span>
        </div>
      `;

      const parent = document.getElementById("parent") as HTMLDivElement;

      const controller = scopedWatchEnhanced(parent, ".child", function* (ctx) {
        // All enhanced context functions should be available
        expect(typeof ctx.text).toBe("function");
        expect(typeof ctx.addClass).toBe("function");
        expect(typeof ctx.on).toBe("function");

        const self = ctx.self();
        expect(self).toBeInstanceOf(window.HTMLSpanElement);

        yield* ctx.addClass("observed");
      });

      controller.destroy();
    });
  });

  describe("Run On Enhanced", () => {
    it("should run generator on specific element with enhanced context", async () => {
      document.body.innerHTML = `
        <button id="btn">Click me</button>
      `;

      const button = document.getElementById("btn") as HTMLButtonElement;

      const result = await runOnEnhanced(button, function* (ctx) {
        // Enhanced context should be available
        expect(typeof ctx.text).toBe("function");
        expect(typeof ctx.addClass).toBe("function");

        yield* ctx.text("Processing...");
        yield* ctx.addClass("loading");

        const text = yield* ctx.text();
        expect(text).toBe("Processing...");

        return "complete";
      });

      expect(result).toBe("complete");
      expect(button.textContent).toBe("Processing...");
      expect(button.classList.contains("loading")).toBe(true);
    });

    it("should handle async generators in runOnEnhanced", async () => {
      document.body.innerHTML = `
        <div id="status">Ready</div>
      `;

      const status = document.getElementById("status") as HTMLDivElement;

      interface AsyncData {
        success: boolean;
        count: number;
      }

      const result = await runOnEnhanced<HTMLDivElement, AsyncData>(
        status,
        async function* (ctx) {
          yield* ctx.text("Loading...");
          yield* ctx.addClass("loading");

          // Simulate async work
          await new Promise((resolve) => setTimeout(resolve, 10));

          yield* ctx.text("Complete");
          yield* ctx.removeClass("loading");
          yield* ctx.addClass("complete");

          return {
            success: true,
            count: 42,
          };
        },
      );

      expect(result?.success).toBe(true);
      expect(result?.count).toBe(42);
      expect(status.textContent).toBe("Complete");
      expect(status.classList.contains("complete")).toBe(true);
      expect(status.classList.contains("loading")).toBe(false);
    });
  });

  describe("Complex Type Scenarios", () => {
    it("should handle nested generators with proper typing", () => {
      document.body.innerHTML = `
        <div class="card">
          <button class="expand">Expand</button>
          <div class="content" style="display: none;">Content</div>
        </div>
      `;

      const controller = watchEnhanced(".card", function* (ctx) {
        const button = yield* ctx.query<HTMLButtonElement>(".expand");
        const content = yield* ctx.query<HTMLDivElement>(".content");

        if (button && content) {
          yield* ctx.click(button, function* () {
            const isHidden = (yield* ctx.style(content, "display")) === "none";

            if (isHidden) {
              yield* ctx.show(content);
              yield* ctx.text(button, "Collapse");
            } else {
              yield* ctx.hide(content);
              yield* ctx.text(button, "Expand");
            }
          });
        }
      });

      controller.destroy();
    });

    it("should handle state management with proper typing", () => {
      document.body.innerHTML = `
        <div class="counter">
          <span class="display">0</span>
          <button class="increment">+</button>
          <button class="decrement">-</button>
        </div>
      `;

      interface CounterState {
        count: number;
        lastAction: "increment" | "decrement" | null;
      }

      const controller = watchEnhanced(".counter", function* (ctx) {
        // Initialize typed state
        yield* ctx.setState<CounterState>("counter", {
          count: 0,
          lastAction: null,
        });

        const display = yield* ctx.query<HTMLSpanElement>(".display");
        const increment = yield* ctx.query<HTMLButtonElement>(".increment");
        const decrement = yield* ctx.query<HTMLButtonElement>(".decrement");

        if (display && increment && decrement) {
          yield* ctx.click(increment, function* () {
            const state = yield* ctx.getState<CounterState>("counter");
            if (state) {
              const newCount = state.count + 1;
              yield* ctx.setState<CounterState>("counter", {
                count: newCount,
                lastAction: "increment",
              });
              yield* ctx.text(display, String(newCount));
            }
          });

          yield* ctx.click(decrement, function* () {
            const state = yield* ctx.getState<CounterState>("counter");
            if (state) {
              const newCount = state.count - 1;
              yield* ctx.setState<CounterState>("counter", {
                count: newCount,
                lastAction: "decrement",
              });
              yield* ctx.text(display, String(newCount));
            }
          });
        }
      });

      controller.destroy();
    });

    it("should handle batch operations through context", () => {
      document.body.innerHTML = `
        <ul class="list">
          <li class="item">Item 1</li>
          <li class="item">Item 2</li>
          <li class="item">Item 3</li>
        </ul>
      `;

      const controller = watchEnhanced(".list", function* (ctx) {
        const items = yield* ctx.queryAll<HTMLLIElement>(".item");

        // Batch operations on queried elements
        yield* ctx.batchAll(items, [
          (el) => ctx.addClass(el, "processed"),
          (el) => ctx.attr(el, "data-index", String(items.indexOf(el))),
          (el) => ctx.style(el, "cursor", "pointer"),
        ]);

        // Add click handlers to all items
        for (const item of items) {
          yield* ctx.click(item, function* () {
            // Deselect all siblings
            const siblings = yield* ctx.siblings(item);
            for (const sibling of siblings) {
              yield* ctx.removeClass(sibling, "selected");
            }

            // Select clicked item
            yield* ctx.addClass(item, "selected");
          });
        }
      });

      controller.destroy();
    });
  });

  describe("Error Handling", () => {
    it("should handle errors in generators gracefully", () => {
      document.body.innerHTML = `<div id="test">Test</div>`;

      const controller = watchEnhanced("#test", function* (ctx) {
        try {
          // This should not throw but return null
          const missing = yield* ctx.query(".non-existent");
          expect(missing).toBeNull();

          // Operations on null should be handled
          if (missing) {
            yield* ctx.text(missing, "This should not execute");
          }
        } catch (error) {
          // Should not reach here
          expect(error).toBeUndefined();
        }
      });

      controller.destroy();
    });
  });
});
