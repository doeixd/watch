/**
 * @fileoverview Minimal test to debug generator execution
 */

import { describe, it, expect } from "vitest";

describe("Minimal Generator Test", () => {
  it("should test raw sync generator execution", () => {
    // Create a simple sync generator that yields a function
    const simpleGenerator = function* () {
      yield (context: any) => {
        console.log("Function executed with context:", context);
        return "result";
      };
    };

    // Execute the generator manually
    const gen = simpleGenerator();
    const { value, done } = gen.next();

    console.log("Yielded value type:", typeof value);
    console.log("Is function?", typeof value === "function");
    console.log("Done?", done);

    // Call the function with a mock context
    if (typeof value === "function") {
      const result = value({ element: { textContent: "" } });
      console.log("Function result:", result);
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
      console.log("Before yield*");
      const result = yield* workflow();
      console.log("After yield*, result:", result);
      return result;
    };

    // Execute the generator
    const gen = mainGenerator();
    const { value: firstValue, done: firstDone } = gen.next();

    console.log("First yielded value type:", typeof firstValue);
    console.log("First done?", firstDone);

    // Mock context
    const mockContext = { element: { textContent: "" } };

    // Call the yielded function
    let functionResult;
    if (typeof firstValue === "function") {
      functionResult = firstValue(mockContext);
      console.log("Function result:", functionResult);
      console.log("Element textContent:", mockContext.element.textContent);
    }

    // Continue generator with the function result
    const { value: finalValue, done: finalDone } = gen.next(functionResult);
    console.log("Final value:", finalValue);
    console.log("Final done?", finalDone);

    expect(mockContext.element.textContent).toBe("Set by workflow");
    expect(finalValue).toBe("generator result");
  });

  it("should test the actual text function structure", async () => {
    // Import the actual text function
    const { text } = await import("../../src/generator/dom");

    // Get the workflow
    const workflow = text("Hello");
    console.log("Workflow type:", typeof workflow);
    console.log("Has Symbol.iterator?", Symbol.iterator in workflow);

    // Execute the workflow
    const iterator = workflow[Symbol.iterator]();
    const { value, done } = iterator.next();

    console.log("Yielded value type:", typeof value);
    console.log("Done?", done);

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
      console.log("Operation result:", result);
      console.log(
        "Element textContent after:",
        mockContext.element.textContent,
      );
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
      // Store original reference
      const originalButton = button;
      console.log("Original button:", originalButton);

      // Test with a simple generator that yields a function directly
      await watch(button, function* () {
        console.log("Generator started");
        console.log("Button at generator start:", button);

        // Yield a simple operation function
        yield (context: any) => {
          console.log("Operation executed with context:", context);
          console.log("Context element:", context.element);
          console.log("Button variable:", button);
          console.log("Original button:", originalButton);
          console.log("Are they the same?", context.element === button);
          console.log(
            "Context vs original?",
            context.element === originalButton,
          );

          console.log("Setting text to Direct");
          context.element.textContent = "Direct";
          console.log(
            "Text content after setting:",
            context.element.textContent,
          );
          console.log("Button text after setting:", button.textContent);
          console.log("Original button text:", originalButton.textContent);
        };

        console.log("After yield");
      });

      // Check both references
      console.log("Final button text:", button.textContent);
      console.log("Original button text:", originalButton.textContent);

      // Get fresh reference from DOM
      const freshButton = document.getElementById("test-button-watch");
      console.log("Fresh button from DOM:", freshButton);
      console.log("Fresh button text:", freshButton?.textContent);

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
    const { text } = await import("../../src/generator/dom");

    // Create a test element
    const button = document.createElement("button");
    button.id = "test-button-module";
    document.body.appendChild(button);

    try {
      await watch(button, function* () {
        console.log("About to use text function");

        // Get the workflow
        const workflow = text("From Module");
        console.log("Got workflow:", workflow);
        console.log("Is sync iterable?", Symbol.iterator in workflow);

        // Try to manually execute the workflow first
        const iterator = workflow[Symbol.iterator]();
        const { value, done } = iterator.next();
        console.log("First yield from workflow:", value);
        console.log("Type of yielded value:", typeof value);

        // Reset and use yield* to delegate to it
        const freshWorkflow = text("From Module");
        yield* freshWorkflow;

        console.log("After yield*");
      });

      // Get fresh reference from DOM
      const freshButton = document.getElementById("test-button-module");
      console.log("Button text after watch:", freshButton?.textContent);
      expect(freshButton?.textContent).toBe("From Module");
    } finally {
      const elementToRemove = document.getElementById("test-button-module");
      if (elementToRemove) {
        document.body.removeChild(elementToRemove);
      }
    }
  });
});
