/**
 * @fileoverview Minimal test to debug generator execution
 */

import { describe, it, expect } from "vitest";

describe("Minimal Generator Test", () => {
  it("should test raw sync generator execution", () => {
    // Create a simple sync generator that yields a function
    const simpleGenerator = function* () {
      yield (context: any) => {
        return "result";
      };
    };

    // Execute the generator manually
    const gen = simpleGenerator();
    const { value, done } = gen.next();

    // Call the function with a mock context
    if (typeof value === "function") {
      const result = value({ element: { textContent: "" } });
    }

    expect(typeof value).toBe("function");
  });

  it("should test yield* delegation", () => {
    // Create a workflow that returns a sync generator
    const workflow = () => {
      return (function* () {
        yield (context: any) => {
          context.element.textContent = "Set by workflow";
          return "workflow result";
        };
        return "generator result";
      })();
    };

    // Create a generator that uses yield*
    const mainGenerator = function* () {
      const result = yield* workflow();
      return result;
    };

    // Execute the generator
    const gen = mainGenerator();
    const { value: firstValue, done: firstDone } = gen.next();

    // Mock context
    const mockContext = { element: { textContent: "" } };

    // Call the yielded function
    let functionResult;
    if (typeof firstValue === "function") {
      functionResult = firstValue(mockContext);
    }

    // Continue generator with the function result
    const { value: finalValue, done: finalDone } = gen.next(functionResult);

    expect(mockContext.element.textContent).toBe("Set by workflow");
    expect(finalValue).toBe("generator result");
  });

  it("should test the actual text function structure", async () => {
    // Import the actual text function
    const { text } = await import("../../src/generator-sync/dom");

    // Get the workflow
    const workflow = text("Hello");

    // Execute the workflow
    const iterator = workflow[Symbol.iterator]();
    const { value, done } = iterator.next();

    // Execute the operation
    const mockContext = {
      element: { textContent: "" },
      state: new Map(),
      selector: "test",
      index: 0,
      array: [],
    };

    if (typeof value === "function") {
      const result = value(mockContext);
    }

    expect(mockContext.element.textContent).toBe("Hello");
  });

  it("should test watch integration", async () => {
    const { watch } = await import("../../src/watch");

    // Create a test element
    let button = document.createElement("button");
    button.id = "test-button-watch";
    document.body.appendChild(button);

    try {
      // Test with a simple generator that yields a function directly
      await watch(button, function* () {
        // Yield a simple operation function
        yield (context: any) => {
          context.element.textContent = "Direct";
        };
      });

      // Get fresh reference from DOM
      const freshButton = document.getElementById("test-button-watch");

      // The test should check the actual DOM element
      expect(freshButton?.textContent).toBe("Direct");
    } finally {
      const elementToRemove = document.getElementById("test-button-watch");
      if (elementToRemove) {
        document.body.removeChild(elementToRemove);
      }
    }
  });

  it("should test watch with imported text function", async () => {
    const { watch } = await import("../../src/watch");
    const { text } = await import("../../src/generator-sync/dom");

    // Create a test element
    const button = document.createElement("button");
    button.id = "test-button-module";
    document.body.appendChild(button);

    try {
      await watch(button, function* () {
        // Use yield* to delegate to the text workflow
        const workflow = text("From Module");
        yield* workflow;
      });

      // Get fresh reference from DOM
      const freshButton = document.getElementById("test-button-module");
      expect(freshButton?.textContent).toBe("From Module");
    } finally {
      const elementToRemove = document.getElementById("test-button-module");
      if (elementToRemove) {
        document.body.removeChild(elementToRemove);
      }
    }
  });
});
