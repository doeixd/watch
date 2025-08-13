/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { watch } from "../src/watch";
import * as explicit from "../src/explicit";
import * as fluent from "../src/fluent";

describe("Generator Support", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("Explicit API - Generator Support", () => {
    it("should support yield* pattern with Flow functions", async () => {
      document.body.innerHTML = '<div class="test">Original</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Test setTextFlow
      const textFlow = explicit.setTextFlow("Updated");
      const textGen = await textFlow.next();
      expect(textGen.done).toBe(false);

      // Execute the yielded function
      const textFn = textGen.value;
      if (typeof textFn === "function") {
        textFn(mockContext.element);
      }

      expect(mockContext.element.textContent).toBe("Updated");
    });

    it("should support getting values with yield* pattern", async () => {
      document.body.innerHTML = '<div class="test">Test Content</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Test getTextFlow
      const textFlow = explicit.getTextFlow();
      const gen1 = await textFlow.next();
      expect(gen1.done).toBe(false);

      // Execute the yielded function and get result
      const fn = gen1.value;
      let result: string = "";
      if (typeof fn === "function") {
        result = fn(mockContext.element) as unknown as string;
      }

      // Feed result back to generator
      const gen2 = await textFlow.next(result);
      expect(gen2.done).toBe(true);
      expect(gen2.value).toBe("Test Content");
    });

    it("should support class operations with Flow functions", async () => {
      document.body.innerHTML = '<div class="test">Test</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Test addClassFlow
      const classFlow = explicit.addClassFlow("active", "highlighted");
      const gen = await classFlow.next();

      const fn = gen.value;
      if (typeof fn === "function") {
        fn(mockContext.element);
      }

      expect(mockContext.element.classList.contains("active")).toBe(true);
      expect(mockContext.element.classList.contains("highlighted")).toBe(true);
    });

    it("should support toggle operations returning values", async () => {
      document.body.innerHTML = '<div class="test">Test</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Test toggleClassFlow
      const toggleFlow = explicit.toggleClassFlow("active");
      const gen1 = await toggleFlow.next();

      const fn = gen1.value;
      let result: boolean = false;
      if (typeof fn === "function") {
        result = fn(mockContext.element) as unknown as boolean;
      }

      const gen2 = await toggleFlow.next(result);
      expect(gen2.done).toBe(true);
      expect(gen2.value).toBe(true); // Should be active now
      expect(mockContext.element.classList.contains("active")).toBe(true);
    });

    it("should support attribute operations", async () => {
      document.body.innerHTML = '<div class="test">Test</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Test setAttrFlow
      const attrFlow = explicit.setAttrFlow("data-id", "123");
      const gen = await attrFlow.next();

      const fn = gen.value;
      if (typeof fn === "function") {
        fn(mockContext.element);
      }

      expect(mockContext.element.getAttribute("data-id")).toBe("123");
    });

    it("should support style operations", async () => {
      document.body.innerHTML = '<div class="test">Test</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Test setStylesFlow
      const styleFlow = explicit.setStylesFlow({
        backgroundColor: "red",
        padding: "10px",
      });
      const gen = await styleFlow.next();

      const fn = gen.value;
      if (typeof fn === "function") {
        fn(mockContext.element);
      }

      const htmlElement = mockContext.element as HTMLElement;
      expect(htmlElement.style.backgroundColor).toBe("red");
      expect(htmlElement.style.padding).toBe("10px");
    });

    it("should support form operations", async () => {
      document.body.innerHTML = '<input type="text" class="test" />';

      const mockContext = {
        element: document.querySelector(".test")! as HTMLInputElement,
      };

      // Test setValueFlow
      const valueFlow = explicit.setValueFlow("test value");
      const gen = await valueFlow.next();

      const fn = gen.value;
      if (typeof fn === "function") {
        fn(mockContext.element);
      }

      expect(mockContext.element.value).toBe("test value");
    });

    it("should support visibility operations", async () => {
      document.body.innerHTML = '<div class="test">Test</div>';

      const mockContext = {
        element: document.querySelector(".test")! as HTMLElement,
      };

      // Test hideFlow
      const hideFlow = explicit.hideFlow();
      const gen = await hideFlow.next();

      const fn = gen.value;
      if (typeof fn === "function") {
        fn(mockContext.element);
      }

      expect(mockContext.element.style.display).toBe("none");
    });

    it("should support selfFlow to get current element", async () => {
      document.body.innerHTML = '<button class="test">Click</button>';

      const mockContext = {
        element: document.querySelector(".test")! as HTMLButtonElement,
      };

      // Test selfFlow
      const selfFlow = explicit.selfFlow<HTMLButtonElement>();
      const gen1 = await selfFlow.next();

      const fn = gen1.value;
      let result: HTMLButtonElement | null = null;
      if (typeof fn === "function") {
        result = fn(mockContext.element) as unknown as HTMLButtonElement | null;
      }

      const gen2 = await selfFlow.next(result);
      expect(gen2.done).toBe(true);
      expect(gen2.value).toBe(mockContext.element);
      expect((gen2.value as HTMLButtonElement).tagName).toBe("BUTTON");
    });
  });

  describe("Fluent API - Generator Support", () => {
    it("should create fluent chains that return workflows", async () => {
      document.body.innerHTML = '<div class="test">Original</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Create fluent chain
      const workflow = fluent
        .gen()
        .addClass("active")
        .text("Updated")
        .style({ color: "blue" })
        .flow();

      // Execute workflow
      const gen = await workflow.next();
      expect(gen.done).toBe(false);

      const fn = gen.value;
      if (typeof fn === "function") {
        await fn(mockContext.element);
      }

      // Verify all operations were applied
      expect(mockContext.element.classList.contains("active")).toBe(true);
      expect(mockContext.element.textContent).toBe("Updated");
      expect((mockContext.element as HTMLElement).style.color).toBe("blue");
    });

    it("should support flowReturn to get values", async () => {
      document.body.innerHTML =
        '<input type="text" value="test" class="test" />';

      const mockContext = {
        element: document.querySelector(".test")! as HTMLInputElement,
      };

      // Create chain that returns a value
      const workflow = fluent
        .gen<HTMLInputElement>()
        .addClass("processed")
        .flowReturn((el) => el.value);

      // Execute workflow
      const gen1 = await workflow.next();
      const fn = gen1.value;

      let result = "";
      if (typeof fn === "function") {
        result = fn(mockContext.element);
      }

      const gen2 = await workflow.next(result);
      expect(gen2.done).toBe(true);
      expect(gen2.value).toBe("test");
      expect(mockContext.element.classList.contains("processed")).toBe(true);
    });

    it("should support conditional execution with if", async () => {
      document.body.innerHTML = `
        <div class="test active">Active</div>
        <div class="test">Inactive</div>
      `;

      const activeEl = document.querySelector(".test.active")!;
      const inactiveEl = document.querySelectorAll(".test")[1]!;

      // Create conditional chain
      const workflow = fluent
        .gen()
        .if((el) => !el.classList.contains("active"))
        .addClass("needs-activation")
        .text("Activated")
        .flow();

      // Test on active element (should not execute)
      const gen = await workflow.next();
      const fn = gen.value;
      if (typeof fn === "function") {
        await fn(activeEl);
      }
      expect(activeEl.classList.contains("needs-activation")).toBe(false);
      expect(activeEl.textContent).toBe("Active");

      // Test on inactive element (should execute)
      const workflow2 = fluent
        .gen()
        .if((el) => !el.classList.contains("active"))
        .addClass("needs-activation")
        .text("Activated")
        .flow();

      const gen2 = await workflow2.next();
      const fn2 = gen2.value;
      if (typeof fn2 === "function") {
        await fn2(inactiveEl);
      }
      expect(inactiveEl.classList.contains("needs-activation")).toBe(true);
      expect(inactiveEl.textContent).toBe("Activated");
    });

    it("should support find to operate on children", async () => {
      document.body.innerHTML = `
        <div class="container">
          <span class="child">Child 1</span>
          <span class="child">Child 2</span>
        </div>
      `;

      const container = document.querySelector(".container")!;

      // Create chain that operates on children
      const workflow = fluent.gen().find(".child").addClass("found").flow();

      // Execute workflow
      const gen = await workflow.next();
      const fn = gen.value;
      if (typeof fn === "function") {
        await fn(container);
      }

      // Verify children were modified
      const children = container.querySelectorAll(".child");
      children.forEach((child) => {
        expect(child.classList.contains("found")).toBe(true);
      });
    });

    it("should support genFor with type inference", async () => {
      document.body.innerHTML = '<button class="test">Click</button>';

      const mockContext = {
        element: document.querySelector(".test")! as HTMLButtonElement,
      };

      // Use genFor for type inference
      const workflow = fluent
        .genFor("button")
        .prop("disabled", true)
        .text("Disabled")
        .flow();

      // Execute workflow
      const gen = await workflow.next();
      const fn = gen.value;
      if (typeof fn === "function") {
        await fn(mockContext.element);
      }

      expect(mockContext.element.disabled).toBe(true);
      expect(mockContext.element.textContent).toBe("Disabled");
    });

    it("should support combine to merge workflows", async () => {
      document.body.innerHTML = '<div class="test">Original</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Create multiple workflows
      const workflow1 = explicit.setTextFlow("Step 1");
      const workflow2 = explicit.addClassFlow("step-1");
      const workflow3 = explicit.setAttrFlow("data-step", "1");

      // Combine them
      const combined = fluent.combine([workflow1, workflow2, workflow3]);

      // Execute each step
      for await (const fn of combined) {
        if (typeof fn === "function") {
          fn(mockContext.element);
        }
      }

      // Verify all operations were applied
      expect(mockContext.element.textContent).toBe("Step 1");
      expect(mockContext.element.classList.contains("step-1")).toBe(true);
      expect(mockContext.element.getAttribute("data-step")).toBe("1");
    });

    it("should support when for conditional execution", async () => {
      document.body.innerHTML = '<div class="test">Test</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Test when condition is true
      const workflow1 = fluent.when(true, explicit.addClassFlow("added"));
      for await (const fn of workflow1) {
        if (typeof fn === "function") {
          fn(mockContext.element);
        }
      }
      expect(mockContext.element.classList.contains("added")).toBe(true);

      // Test when condition is false
      const workflow2 = fluent.when(false, explicit.addClassFlow("not-added"));
      let executed = false;
      for await (const fn of workflow2) {
        executed = true;
        if (typeof fn === "function") {
          fn(mockContext.element);
        }
      }
      expect(executed).toBe(false);
      expect(mockContext.element.classList.contains("not-added")).toBe(false);
    });

    it("should support $gen alias", async () => {
      document.body.innerHTML = '<div class="test">Original</div>';

      const mockContext = {
        element: document.querySelector(".test")!,
      };

      // Use $gen alias
      const workflow = fluent
        .$gen()
        .addClass("jquery-style")
        .text("jQuery-like!")
        .flow();

      // Execute workflow
      const gen = await workflow.next();
      const fn = gen.value;
      if (typeof fn === "function") {
        await fn(mockContext.element);
      }

      expect(mockContext.element.classList.contains("jquery-style")).toBe(true);
      expect(mockContext.element.textContent).toBe("jQuery-like!");
    });
  });

  describe("Integration with Watch", () => {
    it("should work with watch and yield* pattern", async () => {
      // This is a conceptual test showing how it would work
      // In real usage, watch would handle the generator execution

      document.body.innerHTML = '<div class="watched">Initial</div>';

      // Simulate what would happen inside a watch generator
      const mockGeneratorContext = async function () {
        const element = document.querySelector(".watched")!;

        // Using explicit Flow functions
        const textGen = explicit.setTextFlow("Updated via yield*");
        for await (const fn of textGen) {
          if (typeof fn === "function") {
            fn(element);
          }
        }

        // Using fluent gen
        const fluentGen = fluent
          .gen()
          .addClass("processed")
          .style({ fontWeight: "bold" })
          .flow();

        for await (const fn of fluentGen) {
          if (typeof fn === "function") {
            fn(element);
          }
        }
      };

      // Execute the mock function
      await mockGeneratorContext();

      // Verify results
      const element = document.querySelector(".watched")! as HTMLElement;
      expect(element.textContent).toBe("Updated via yield*");
      expect(element.classList.contains("processed")).toBe(true);
      expect(element.style.fontWeight).toBe("bold");
    });
  });
});
