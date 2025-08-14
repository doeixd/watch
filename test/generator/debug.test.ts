/**
 * @fileoverview Comprehensive debug tests for the unified API with yield* support
 *
 * Tests verify that all unified API functions work correctly with yield* patterns
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runOn } from "../../src/watch";
import {
  setState,
  getState,
  updateState,
  hasState,
} from "../../src/api/state-sync";
import {
  text,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  style,
  attr,
} from "../../src/api/dom-new";

describe("Unified API Debug Tests", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should test basic generator execution with yield*", async () => {
    const button = document.createElement("button");
    container.appendChild(button);

    await runOn(button, function* () {
      yield* text("Hello World");
    });

    expect(button.textContent).toBe("Hello World");
  });

  it("should test multiple DOM operations with yield*", async () => {
    const div = document.createElement("div");
    container.appendChild(div);

    await runOn(div, function* () {
      yield* text("Testing");
      yield* addClass("active");

      const hasActive = yield* hasClass("active");
      expect(hasActive).toBe(true);

      const content = yield* text();
      expect(content).toBe("Testing");
    });

    expect(div.textContent).toBe("Testing");
    expect(div.classList.contains("active")).toBe(true);
  });

  it("should test state operations with yield*", async () => {
    const div = document.createElement("div");
    container.appendChild(div);

    await runOn(div, function* () {
      yield* setState("test", "value");
      const value = yield* getState("test");

      yield* text(`State: ${value}`);
    });

    expect(div.textContent).toBe("State: value");
  });

  it("should test complex DOM manipulation workflow", async () => {
    const button = document.createElement("button");
    container.appendChild(button);

    await runOn(button, function* () {
      yield* text("Click me");
      yield* addClass("interactive");
      yield* style("background-color", "blue");
      yield* attr("data-test", "true");
    });

    expect(button.textContent).toBe("Click me");
    expect(button.classList.contains("interactive")).toBe(true);
    expect(button.style.backgroundColor).toBe("blue");
    expect(button.getAttribute("data-test")).toBe("true");
  });

  it("should test state and DOM combination", async () => {
    const div = document.createElement("div");
    container.appendChild(div);

    await runOn(div, function* () {
      yield* setState("count", 0);

      yield* updateState("count", (n: number) => (n || 0) + 1);
      const count = yield* getState("count");

      yield* text(`Count: ${count}`);
      yield* addClass(`count-${count}`);
    });

    expect(div.textContent).toBe("Count: 1");
    expect(div.classList.contains("count-1")).toBe(true);
  });

  it("should test class manipulation operations", async () => {
    const element = document.createElement("div");
    container.appendChild(element);

    await runOn(element, function* () {
      yield* addClass("first");
      yield* addClass("second");

      let hasFirst = yield* hasClass("first");
      expect(hasFirst).toBe(true);

      yield* removeClass("first");
      hasFirst = yield* hasClass("first");
      expect(hasFirst).toBe(false);

      yield* toggleClass("third");
      const hasThird = yield* hasClass("third");
      expect(hasThird).toBe(true);
    });

    expect(element.classList.contains("second")).toBe(true);
    expect(element.classList.contains("third")).toBe(true);
    expect(element.classList.contains("first")).toBe(false);
  });

  it("should test error handling gracefully", async () => {
    const div = document.createElement("div");
    container.appendChild(div);

    try {
      await runOn(div, function* () {
        yield* text("Before operations");
        yield* addClass("test");
        yield* setState("status", "complete");
        yield* text("After operations");
      });

      expect(div.textContent).toBe("After operations");
      expect(div.classList.contains("test")).toBe(true);
    } catch (error) {
      throw error;
    }
  });

  it("should test advanced state operations", async () => {
    const div = document.createElement("div");
    container.appendChild(div);

    await runOn(div, function* () {
      yield* setState("user", { name: "John", age: 30 });
      yield* setState("active", true);

      const hasUser = yield* hasState("user");
      const hasActive = yield* hasState("active");

      expect(hasUser).toBe(true);
      expect(hasActive).toBe(true);

      const user = yield* getState("user");
      yield* text(`Hello ${user.name}`);
    });

    expect(div.textContent).toBe("Hello John");
  });
});
