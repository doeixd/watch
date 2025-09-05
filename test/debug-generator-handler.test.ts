import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { watch, click } from "../src/index";

describe("Debug Generator Event Handler", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "debug-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("should debug generator handler execution", async () => {
    const button = document.createElement("button");
    container.appendChild(button);

    let regularHandlerCalled = false;
    let generatorHandlerCalled = false;
    let generatorYieldExecuted = false;

    console.log("=== DEBUGGING GENERATOR HANDLER EXECUTION ===");

    await watch(button, function* () {
      console.log("Setting up handlers...");

      // Test 1: Regular function handler
      yield* click((event) => {
        console.log("Regular handler called!");
        regularHandlerCalled = true;
      });

      // Test 2: Generator function handler
      yield* click(function* (event) {
        console.log("Generator handler called!");
        generatorHandlerCalled = true;

        // Yield some operation
        yield* (() => {
          console.log("Generator yield executed!");
          generatorYieldExecuted = true;
          button.textContent = "Generator executed!";
        })();
      });

      console.log("Handlers set up successfully");
    });

    console.log("About to simulate click...");
    button.click();
    console.log("Click simulated");

    // Give some time for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    console.log("=== RESULTS ===");
    console.log("Regular handler called:", regularHandlerCalled);
    console.log("Generator handler called:", generatorHandlerCalled);
    console.log("Generator yield executed:", generatorYieldExecuted);
    console.log("Button text content:", button.textContent);

    // Check what actually worked
    expect(regularHandlerCalled).toBe(true);
    expect(generatorHandlerCalled).toBe(true);
    expect(generatorYieldExecuted).toBe(true);
  });

  it("should test minimal generator handler", async () => {
    const button = document.createElement("button");
    container.appendChild(button);

    let executed = false;

    await watch(button, function* () {
      yield* click(function* (event) {
        executed = true;
        console.log("Minimal generator handler executed");
      });
    });

    button.click();
    await new Promise(resolve => setTimeout(resolve, 10));

    console.log("Minimal test - executed:", executed);
    expect(executed).toBe(true);
  });

  it("should test what the handler function actually returns", async () => {
    const button = document.createElement("button");
    container.appendChild(button);

    let handlerResult: any = null;

    await watch(button, function* () {
      yield* click(function* (event) {
        console.log("Inside generator handler");
        return "generator return value";
      });
    });

    // Manually call the handler to see what it returns
    const testHandler = function* (event: Event) {
      console.log("Test generator handler called");
      return "test return";
    };

    const result = testHandler(new Event("click"));
    console.log("Handler result type:", typeof result);
    console.log("Handler result:", result);
    console.log("Has Symbol.iterator:", typeof result[Symbol.iterator]);
    console.log("Has next method:", typeof result.next);

    if (result && typeof result[Symbol.iterator] === "function") {
      console.log("Result is iterable");
      const next1 = result.next();
      console.log("First next():", next1);
    }

    button.click();
  });
});
