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

describe("Events with Enhanced Context", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("Event handlers with enhanced context", () => {
    it("should check if click is available on context", async () => {
      const button = createTestElement("button");
      let contextChecked = false;

      watch(button, function* (ctx) {
        // Check if event handlers are attached to context
        contextChecked = true;

        // These might not exist yet
        console.log("Context has click?", typeof ctx.click);
        console.log("Context has on?", typeof ctx.on);
        console.log("Context has input?", typeof ctx.input);
        console.log("Context has change?", typeof ctx.change);
        console.log("Context has submit?", typeof ctx.submit);
        console.log("Context has onMount?", typeof ctx.onMount);
        console.log("Context has onUnmount?", typeof ctx.onUnmount);

        // For now, expect them to be undefined since we haven't added them
        expect(ctx.click).toBeUndefined();
        expect(ctx.on).toBeUndefined();
        expect(ctx.input).toBeUndefined();
        expect(ctx.change).toBeUndefined();
        expect(ctx.submit).toBeUndefined();
        expect(ctx.onMount).toBeUndefined();
        expect(ctx.onUnmount).toBeUndefined();
      });

      await waitForMutation();
      expect(contextChecked).toBe(true);
    });

    it("should work with traditional event pattern (yield without context)", async () => {
      const button = createTestElement("button");
      let clicked = false;

      // Import event functions directly
      const { click } = await import("../src");

      watch(button, function* () {
        // Traditional pattern should still work
        yield click(() => {
          clicked = true;
        });
      });

      await waitForMutation();

      // Simulate click
      button.click();
      expect(clicked).toBe(true);
    });

    it("should work with generator event handlers", async () => {
      const button = createTestElement("button");
      let clickCount = 0;

      const { click, text } = await import("../src");

      watch(button, function* () {
        yield text("Click me!");

        // Generator event handler
        yield click(function* () {
          clickCount++;
          yield text(`Clicked ${clickCount} times`);
        });
      });

      await waitForMutation();
      expect(button.textContent).toBe("Click me!");

      // First click
      button.click();
      await waitForMutation();
      expect(button.textContent).toBe("Clicked 1 times");
      expect(clickCount).toBe(1);

      // Second click
      button.click();
      await waitForMutation();
      expect(button.textContent).toBe("Clicked 2 times");
      expect(clickCount).toBe(2);
    });

    it("should work with async generator event handlers", async () => {
      const button = createTestElement("button");
      let processing = false;
      let processed = false;

      const { click, text, addClass, removeClass } = await import("../src");

      watch(button, function* () {
        yield text("Submit");

        yield click(async function* () {
          processing = true;
          yield text("Processing...");
          yield addClass("loading");

          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 10));

          yield text("Done!");
          yield removeClass("loading");
          processing = false;
          processed = true;
        });
      });

      await waitForMutation();
      expect(button.textContent).toBe("Submit");

      // Click and wait for async processing
      button.click();
      await waitForMutation();
      expect(processing).toBe(true);
      expect(button.textContent).toBe("Processing...");
      expect(button.classList.contains("loading")).toBe(true);

      // Wait for async completion
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(processing).toBe(false);
      expect(processed).toBe(true);
      expect(button.textContent).toBe("Done!");
      expect(button.classList.contains("loading")).toBe(false);
    });

    it("should work with input events", async () => {
      const inputElement = createTestElement("input") as HTMLInputElement;
      let lastValue = "";

      const { input } = await import("../src");

      watch(inputElement, function* () {
        yield input((event) => {
          lastValue = (event.target as HTMLInputElement).value;
        });
      });

      await waitForMutation();

      // Simulate input
      inputElement.value = "test";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      expect(lastValue).toBe("test");

      // Another input
      inputElement.value = "updated";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      expect(lastValue).toBe("updated");
    });

    it("should work with custom events", async () => {
      const div = createTestElement("div");
      let eventData: any = null;

      const { on } = await import("../src");

      watch(div, function* () {
        yield on("custom-event", (event: CustomEvent) => {
          eventData = event.detail;
        });
      });

      await waitForMutation();

      // Dispatch custom event
      div.dispatchEvent(new CustomEvent("custom-event", {
        detail: { message: "Hello" }
      }));

      expect(eventData).toEqual({ message: "Hello" });
    });

    it("should work with lifecycle events", async () => {
      const div = createTestElement("div");
      let mounted = false;
      let unmounted = false;

      const { onMount, onUnmount } = await import("../src");

      const controller = watch(div, function* () {
        yield onMount(() => {
          mounted = true;
        });

        yield onUnmount(() => {
          unmounted = true;
        });
      });

      await waitForMutation();
      expect(mounted).toBe(true);
      expect(unmounted).toBe(false);

      // Cleanup
      controller.destroy();
      expect(unmounted).toBe(true);
    });

    it("should work with event delegation", async () => {
      const container = createTestElement("div");
      const button1 = createTestElement("button", { class: "btn" });
      const button2 = createTestElement("button", { class: "btn" });
      container.appendChild(button1);
      container.appendChild(button2);

      let clickedButton: HTMLElement | null = null;

      const { on } = await import("../src");

      watch(container, function* () {
        yield on("click", (event) => {
          const target = event.target as HTMLElement;
          if (target.classList.contains("btn")) {
            clickedButton = target;
          }
        });
      });

      await waitForMutation();

      // Click first button
      button1.click();
      expect(clickedButton).toBe(button1);

      // Click second button
      button2.click();
      expect(clickedButton).toBe(button2);
    });

    it("should work with observer events", async () => {
      const div = createTestElement("div");
      let attrChanged = false;
      let textChanged = false;
      let visibilityChanged = false;

      const { onAttr, onText, onVisible } = await import("../src");

      watch(div, function* () {
        yield onAttr((change) => {
          if (change.attributeName === "data-test") {
            attrChanged = true;
          }
        });

        yield onText(() => {
          textChanged = true;
        });

        yield onVisible((visible) => {
          visibilityChanged = visible;
        });
      });

      await waitForMutation();

      // Change attribute
      div.setAttribute("data-test", "value");
      await waitForMutation();
      expect(attrChanged).toBe(true);

      // Change text
      div.textContent = "New text";
      await waitForMutation();
      expect(textChanged).toBe(true);

      // Change visibility
      div.style.display = "none";
      await waitForMutation();
      expect(visibilityChanged).toBe(false);

      div.style.display = "block";
      await waitForMutation();
      expect(visibilityChanged).toBe(true);
    });

    it("should work with parent/child relationship and events", async () => {
      const parent = createTestElement("div", { class: "parent" });
      const child = createTestElement("button", { class: "child" });
      parent.appendChild(child);

      let parentClicked = false;
      let childClicked = false;

      const { click } = await import("../src");

      // Watch parent
      watch(parent, function* () {
        yield click(() => {
          parentClicked = true;
        });
      });

      // Watch child
      watch(child, function* () {
        yield click((event) => {
          childClicked = true;
          event.stopPropagation(); // Prevent bubbling
        });
      });

      await waitForMutation();

      // Click child
      child.click();
      expect(childClicked).toBe(true);
      expect(parentClicked).toBe(false); // Stopped propagation

      // Reset
      childClicked = false;

      // Click parent directly
      parent.click();
      expect(parentClicked).toBe(true);
      expect(childClicked).toBe(false);
    });

    it("should work with scoped watch and events", async () => {
      const container = createTestElement("div");
      let clickCounts: Record<string, number> = {};

      const { click, attr } = await import("../src");
      const { scopedWatch } = await import("../src");

      scopedWatch(container, ".item", function* () {
        const id = yield attr("data-id");
        if (typeof id === "string") {
          clickCounts[id] = 0;

          yield click(() => {
            clickCounts[id]++;
          });
        }
      });

      await waitForMutation();

      // Add items dynamically
      const item1 = createTestElement("div", { class: "item", "data-id": "1" });
      const item2 = createTestElement("div", { class: "item", "data-id": "2" });
      container.appendChild(item1);
      container.appendChild(item2);

      await waitForMutation();

      // Click items
      item1.click();
      expect(clickCounts["1"]).toBe(1);

      item2.click();
      item2.click();
      expect(clickCounts["2"]).toBe(2);
    });
  });

  describe("Event options", () => {
    it("should support debouncing", async () => {
      const input = createTestElement("input") as HTMLInputElement;
      let callCount = 0;
      let lastValue = "";

      const { input: inputEvent } = await import("../src");

      watch(input, function* () {
        yield inputEvent(
          (event) => {
            callCount++;
            lastValue = (event.target as HTMLInputElement).value;
          },
          { debounce: 50 }
        );
      });

      await waitForMutation();

      // Rapid inputs
      input.value = "a";
      input.dispatchEvent(new Event("input"));
      input.value = "ab";
      input.dispatchEvent(new Event("input"));
      input.value = "abc";
      input.dispatchEvent(new Event("input"));

      // Should not have been called yet
      expect(callCount).toBe(0);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callCount).toBe(1);
      expect(lastValue).toBe("abc");
    });

    it("should support throttling", async () => {
      const button = createTestElement("button");
      let callCount = 0;

      const { click } = await import("../src");

      watch(button, function* () {
        yield click(
          () => {
            callCount++;
          },
          { throttle: 50 }
        );
      });

      await waitForMutation();

      // Rapid clicks
      button.click();
      button.click();
      button.click();

      // Should only be called once immediately
      expect(callCount).toBe(1);

      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 60));

      // Click again
      button.click();
      expect(callCount).toBe(2);
    });

    it("should support once option", async () => {
      const button = createTestElement("button");
      let callCount = 0;

      const { click } = await import("../src");

      watch(button, function* () {
        yield click(
          () => {
            callCount++;
          },
          { once: true }
        );
      });

      await waitForMutation();

      // Multiple clicks
      button.click();
      button.click();
      button.click();

      // Should only be called once
      expect(callCount).toBe(1);
    });
  });
});
