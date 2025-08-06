/**
 * Test file for the new generator API implementation
 *
 * This file tests the new type-safe generator API pattern with direct yield*
 * syntax, ensuring it works correctly alongside the existing API.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { watch } from "../src/index";
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
import { destroy } from "../src/watch";

// Helper function to wait for watch() to process mutations
const waitForWatcher = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Generator API - Direct yield* Pattern", () => {
  // happy-dom provides a global document object, so we just need to clean it
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    // Clean up any remaining watchers
    destroy(watch('.*'));
    document.body.innerHTML = "";
  });

  describe("Direct yield* syntax", () => {
    it("should execute workflows directly with yield* - no wrapper needed", async () => {
      document.body.innerHTML = '<button id="test">Test</button>';
      const button = document.getElementById("test") as HTMLButtonElement;

      let executed = false;

      watch("#test", async function* () {
        // Direct yield* syntax - no $ wrapper needed!
        yield* addClass("test-class");
        yield* text("Updated");

        executed = true;
      });

      await waitForWatcher();

      expect(executed).toBe(true);
      expect(button.classList.contains("test-class")).toBe(true);
      expect(button.textContent).toBe("Updated");
    });

    it("should provide perfect type safety for return values", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';

      let capturedElement: HTMLElement | null = null;
      let capturedText: string | undefined;

      watch("#test", async function* () {
        // These should be perfectly typed through yield* delegation
        capturedElement = yield* self<HTMLDivElement>();
        yield* setState("test", "value");
        const state = yield* getState<string>("test", "default");
        capturedText = state;
      });

      await waitForWatcher();

      expect(capturedElement).toBeInstanceOf(window.HTMLDivElement);
      expect(capturedText).toBe("value");
    });
  });

  describe("Pure DOM operations", () => {
    it("should manipulate DOM through direct workflows", async () => {
      document.body.innerHTML = '<div id="test">Original</div>';
      const div = document.getElementById("test") as HTMLDivElement;

      watch("#test", async function* () {
        yield* addClass("new-class");
        yield* text("New Text");
        yield* attr("data-test", "value");
        yield* style("color", "red");
        yield* style("fontSize", "16px");
      });

      await waitForWatcher();

      expect(div.classList.contains("new-class")).toBe(true);
      expect(div.textContent).toBe("New Text");
      expect(div.getAttribute("data-test")).toBe("value");
      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("16px");
    });

    it("should handle class manipulation operations", async () => {
      document.body.innerHTML = '<div id="test" class="original">Test</div>';
      const div = document.getElementById("test") as HTMLDivElement;

      watch("#test", async function* () {
        yield* addClass("added-class");
        yield* removeClass("original");

        const hasAdded = yield* hasClass("added-class");
        expect(hasAdded).toBe(true);

        const hasOriginal = yield* hasClass("original");
        expect(hasOriginal).toBe(false);
      });

      await waitForWatcher();

      expect(div.classList.contains("added-class")).toBe(true);
      expect(div.classList.contains("original")).toBe(false);
    });

    it("should handle element access operations", async () => {
      document.body.innerHTML =
        '<div id="test"><span class="child">Child</span></div>';

      let capturedSelf: HTMLElement | null = null;
      let capturedChild: HTMLElement | null = null;

      watch("#test", async function* () {
        capturedSelf = yield* self<HTMLDivElement>();
        capturedChild = yield* query<HTMLSpanElement>(".child");
      });

      await waitForWatcher();

      expect(capturedSelf).toBeInstanceOf(window.HTMLDivElement);
      expect(capturedChild).toBeInstanceOf(window.HTMLSpanElement);
      expect((capturedChild as HTMLSpanElement | null)?.textContent).toBe(
        "Child",
      );
    });
  });

  describe("Pure state operations", () => {
    it("should manage state through direct workflows", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';

      let finalCount: number | undefined;

      watch("#test", async function* () {
        yield* setState("count", 0);

        const newCount = yield* updateState<number>(
          "count",
          (current = 0) => current + 5,
        );
        expect(newCount).toBe(5);

        finalCount = yield* getState<number>("count");

        const hasCount = yield* hasState("count");
        expect(hasCount).toBe(true);
      });

      await waitForWatcher();

      expect(finalCount).toBe(5);
    });

    it("should handle advanced state operations", async () => {
      document.body.innerHTML = '<div id="test">Test</div>';

      watch("#test", async function* () {
        yield* setState("counter", 10);

        const afterIncrement = yield* incrementState("counter", 3);
        expect(afterIncrement).toBe(13);

        const afterDecrement = yield* decrementState("counter", 5);
        expect(afterDecrement).toBe(8);

        yield* setState("flag", false);
        const toggled = yield* toggleState("flag");
        expect(toggled).toBe(true);

        yield* setState("items", ["a", "b"]);
        const newItems = yield* appendToState<string>("items", "c");
        expect(newItems).toEqual(["a", "b", "c"]);
      });

      await waitForWatcher();
    });
  });

  describe("Pure event operations", () => {
    it("should set up event handlers through direct workflows", async () => {
      document.body.innerHTML = '<button id="test">Click me</button>';
      const button = document.getElementById("test") as HTMLButtonElement;
      let clickCount = 0;

      watch("#test", async function* () {
        yield* click((event) => {
          clickCount++;
          expect(event.type).toBe("click");
        });
      });

      await waitForWatcher();

      button.click();
      expect(clickCount).toBe(1);

      button.click();
      expect(clickCount).toBe(2);
    });

    it("should support generator event handlers", async () => {
      document.body.innerHTML = '<button id="test">Click me</button>';
      const button = document.getElementById("test") as HTMLButtonElement;
      let sequence: string[] = [];

      watch("#test", async function* () {
        yield* click(async function* (event) {
          sequence.push("start");
          yield* addClass("clicked");
          sequence.push("class-added");
          yield* text("Clicked!");
          sequence.push("text-set");
        });
      });

      await waitForWatcher();

      button.click();
      await waitForWatcher();

      expect(sequence).toEqual(["start", "class-added", "text-set"]);
      expect(button.classList.contains("clicked")).toBe(true);
      expect(button.textContent).toBe("Clicked!");
    });
  });

  describe("Real-world patterns", () => {
    it("should support counter component pattern", async () => {
      document.body.innerHTML = '<button id="counter">0</button>';
      const button = document.getElementById("counter") as HTMLButtonElement;

      watch("#counter", async function* () {
        yield* setState("count", 0);
        yield* click(async function* (event) {
          const newCount = yield* incrementState("count", 1);
          yield* text(newCount.toString());
          yield* addClass("clicked");
        });
      });

      await waitForWatcher();

      button.click();
      await waitForWatcher();
      expect(button.textContent).toBe("1");

      button.click();
      await waitForWatcher();
      expect(button.textContent).toBe("2");
    });

    it("should support form handling pattern", async () => {
      document.body.innerHTML = `
        <form id="test-form">
          <input type="text" name="name" required />
          <button type="submit">Submit</button>
        </form>
      `;
      let submittedData: any = null;

      watch("#test-form", async function* () {
        yield* submit(async function* (event) {
          event.preventDefault();
          const form = yield* self<HTMLFormElement>();
          const formData = new FormData(form);
          submittedData = Object.fromEntries(formData.entries());
          yield* addClass("submitted");
        });
      });

      await waitForWatcher();

      const form = document.getElementById("test-form") as HTMLFormElement;
      const input = form.querySelector("input") as HTMLInputElement;

      input.value = "John Doe";
      // Manually create and dispatch event for happy-dom
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

      await waitForWatcher();

      expect(submittedData).toEqual({ name: "John Doe" });
      expect(form.classList.contains("submitted")).toBe(true);
    });
  });
});