import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { watch, destroy } from "../src/watch";
import {
  addClass,
  removeClass,
  text,
  setState,
  getState,
  click,
  self,
} from "../src/index";

describe("Verify Direct yield* Pattern Works", () => {
  let controllers: any[] = [];

  beforeEach(() => {
    document.body.innerHTML = "";
    controllers = [];
  });

  afterEach(() => {
    // Destroy all watch controllers
    controllers.forEach((controller) => {
      if (controller && typeof controller.destroy === "function") {
        controller.destroy();
      }
    });
    controllers = [];
    document.body.innerHTML = "";
  });

  it("should work with direct yield* pattern - no wrapper needed", async () => {
    const button = document.createElement("button");
    button.id = "test-button";
    document.body.appendChild(button);

    const controller = watch(button, async function* () {
      // Direct yield* pattern with unified API
      yield* text("Click me!");
      yield* addClass("interactive");
      yield* setState("clicks", 0);

      yield* click(async function* () {
        const clicks = yield* getState<number>("clicks", 0);
        const newClicks = clicks + 1;
        yield* setState("clicks", newClicks);
        yield* text(`Clicked ${newClicks} times`);
        yield* addClass("clicked");
      });
    });

    controllers.push(controller);

    // Wait for DOM updates
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(button.textContent).toBe("Click me!");
    expect(button.classList.contains("interactive")).toBe(true);

    // Simulate click
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(button.textContent).toBe("Clicked 1 times");
    expect(button.classList.contains("clicked")).toBe(true);
  });

  it("should provide perfect type safety with yield*", async () => {
    const div = document.createElement("div");
    div.id = "type-test";
    document.body.appendChild(div);

    let capturedElement: HTMLElement | null = null;
    let capturedText: string;
    let capturedState: number;

    const controller = watch(div, async function* () {
      // These should be perfectly typed through yield* delegation
      capturedElement = yield* self();
      yield* setState("counter", 42);
      capturedState = yield* getState<number>("counter", 0);
      yield* text(`Count: ${capturedState}`);
      capturedText = yield* text(); // Get current text
    });

    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(capturedElement).toBe(div);
    expect(capturedState).toBe(42);
    expect(capturedText).toBe("Count: 42");
    expect(div.textContent).toBe("Count: 42");
  });

  it("should work with class manipulation through yield*", async () => {
    const div = document.createElement("div");
    div.className = "original";
    document.body.appendChild(div);

    const controller = watch(div, async function* () {
      yield* addClass("added");
      yield* removeClass("original");

      // Verify changes
      const hasAdded = yield* addClass("test"); // addClass returns boolean indicating success
      const hasOriginal = yield* removeClass("nonexistent"); // removeClass returns boolean
    });

    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(div.classList.contains("added")).toBe(true);
    expect(div.classList.contains("original")).toBe(false);
    expect(div.classList.contains("test")).toBe(true);
  });

  it("should work with state operations through yield*", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    let finalValue: any;

    const controller = watch(div, async function* () {
      // Set initial state
      yield* setState("data", { count: 0, name: "test" });

      // Get state
      const data = yield* getState<{ count: number; name: string }>("data");

      // Update state
      yield* setState("data", { ...data, count: data.count + 1 });

      // Get final value
      finalValue = yield* getState("data");
    });

    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(finalValue).toEqual({ count: 1, name: "test" });
  });

  it("should work with complex composition", async () => {
    const container = document.createElement("div");
    const button = document.createElement("button");
    container.appendChild(button);
    document.body.appendChild(container);

    let sequence: string[] = [];

    const controller = watch(button, async function* () {
      sequence.push("start");

      yield* text("Ready");
      yield* addClass("ready");
      sequence.push("setup");

      yield* setState("phase", "initialized");

      yield* click(async function* () {
        sequence.push("clicked");

        const currentPhase = yield* getState<string>("phase", "");
        yield* setState("phase", "clicked");
        yield* text(`Phase: ${currentPhase} -> clicked`);
        yield* addClass("active");

        sequence.push("complete");
      });
    });

    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sequence).toEqual(["start", "setup"]);
    expect(button.textContent).toBe("Ready");
    expect(button.classList.contains("ready")).toBe(true);

    // Trigger click
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(sequence).toEqual(["start", "setup", "clicked", "complete"]);
    expect(button.textContent).toBe("Phase: initialized -> clicked");
    expect(button.classList.contains("active")).toBe(true);
  });

  it("should handle errors gracefully in yield* operations", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    let errorCaught = false;

    try {
      const controller = watch(div, async function* () {
        yield* text("Before operations");
        yield* addClass("test-class");
        yield* setState("test", "value");

        // These should all work fine
        const value = yield* getState("test");
        yield* text(`Value: ${value}`);
      });

      controllers.push(controller);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(div.textContent).toBe("Value: value");
      expect(div.classList.contains("test-class")).toBe(true);
    } catch (error) {
      errorCaught = true;
      console.error("Unexpected error:", error);
    }

    expect(errorCaught).toBe(false);
  });

  it("should support nested generator patterns", async () => {
    const div = document.createElement("div");
    document.body.appendChild(div);

    const helperWorkflow = async function* () {
      yield* addClass("helper");
      yield* setState("helper", true);
      return "helper-result";
    };

    let result: string;

    const controller = watch(div, async function* () {
      yield* text("Starting");

      // Use nested workflow
      result = yield* helperWorkflow();

      const helperState = yield* getState<boolean>("helper", false);
      yield* text(`Result: ${result}, Helper: ${helperState}`);
    });

    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(result).toBe("helper-result");
    expect(div.textContent).toBe("Result: helper-result, Helper: true");
    expect(div.classList.contains("helper")).toBe(true);
  });
});
