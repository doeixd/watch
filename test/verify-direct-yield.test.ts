import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { watch, destroy } from "../src/watch";
import {
  addClass,
  removeClass,
  text,
  getText,
  setState,
  getState,
  click,
  self,
} from "../src/generator/index";

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

  it("should execute basic yield* operations", async () => {
    document.body.innerHTML = '<div id="test">Initial</div>';
    const element = document.getElementById("test") as HTMLDivElement;

    let executed = false;

    const controller = watch("#test", async function* () {
      executed = true;
      yield* addClass("test-class");
      yield* text("Updated");
    });
    controllers.push(controller);

    // Wait for async execution
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(executed).toBe(true);
    expect(element.classList.contains("test-class")).toBe(true);
    expect(element.textContent).toBe("Updated");
  });

  it("should handle state operations with yield*", async () => {
    document.body.innerHTML = '<div id="test">Test</div>';
    const element = document.getElementById("test") as HTMLDivElement;

    let stateValue: number | undefined;

    const controller = watch("#test", async function* () {
      yield* setState("count", 42);
      stateValue = yield* getState<number>("count");
      yield* text(`Count: ${stateValue}`);
    });
    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(stateValue).toBe(42);
    expect(element.textContent).toBe("Count: 42");
  });

  it("should handle nested generators in event handlers", async () => {
    document.body.innerHTML = '<button id="test">Click me</button>';
    const button = document.getElementById("test") as HTMLButtonElement;

    let clickCount = 0;
    let finalText = "";

    const controller = watch("#test", async function* () {
      yield* setState("clicks", 0);

      yield* click(async function* (event) {
        clickCount++;
        const count = yield* getState<number>("clicks", 0);
        yield* setState("clicks", count + 1);
        finalText = `Clicked ${count + 1} times`;
        yield* text(finalText);
      });
    });
    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simulate click
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(clickCount).toBe(1);
    expect(button.textContent).toBe("Clicked 1 times");

    // Click again
    button.click();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(clickCount).toBe(2);
    expect(button.textContent).toBe("Clicked 2 times");
  });

  it("should properly pass context through yield* operations", async () => {
    document.body.innerHTML = '<div id="test">Test</div>';

    let capturedElement: HTMLElement | null = null;
    let capturedText: string | undefined;

    const controller = watch("#test", async function* () {
      // These operations should all work on the same element
      yield* addClass("context-test");
      capturedElement = yield* self<HTMLDivElement>();
      yield* setState("testKey", "testValue");
      capturedText = yield* getState<string>("testKey");
      const currentText = yield* getText();
      yield* text(currentText + " - Modified");
    });
    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(capturedElement).toBeInstanceOf(HTMLDivElement);
    expect(capturedElement?.id).toBe("test");
    expect(capturedText).toBe("testValue");
    expect(capturedElement?.textContent).toBe("Test - Modified");
    expect(capturedElement?.classList.contains("context-test")).toBe(true);
  });

  it("should handle multiple elements with same selector", async () => {
    document.body.innerHTML = `
      <div class="item">Item 1</div>
      <div class="item">Item 2</div>
      <div class="item">Item 3</div>
    `;

    const items = document.querySelectorAll(".item");
    let processedCount = 0;

    const controller = watch(".item", async function* () {
      processedCount++;
      const element = yield* self<HTMLDivElement>();
      const index = Array.from(items).indexOf(element);
      yield* addClass(`processed-${index}`);
      yield* text(`Processed: ${element.textContent}`);
    });
    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(processedCount).toBe(3);
    expect(items[0].textContent).toBe("Processed: Item 1");
    expect(items[1].textContent).toBe("Processed: Item 2");
    expect(items[2].textContent).toBe("Processed: Item 3");
    expect(items[0].classList.contains("processed-0")).toBe(true);
    expect(items[1].classList.contains("processed-1")).toBe(true);
    expect(items[2].classList.contains("processed-2")).toBe(true);
  });

  it("should handle errors gracefully", async () => {
    document.body.innerHTML = '<div id="test">Test</div>';

    let errorCaught = false;
    const consoleError = console.error;
    console.error = () => {
      errorCaught = true;
    };

    const controller = watch("#test", async function* () {
      yield* text("Before error");
      // This should cause an error but not crash
      yield* setState("key", { circular: null } as any);
      (yield* getState("key")).circular = yield* getState("key"); // Create circular reference
      yield* text("After error"); // This might not execute
    });
    controllers.push(controller);

    await new Promise((resolve) => setTimeout(resolve, 50));

    const element = document.getElementById("test");
    expect(element?.textContent).toBeTruthy(); // Should have some text

    console.error = consoleError;
  });
});
