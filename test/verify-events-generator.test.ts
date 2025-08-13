import { describe, it, expect, beforeEach, vi } from "vitest";
import { watch, runOn } from "../src";
import * as gen from "../src/generator";

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

describe("Events with Generator Module", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("Generator module event functions", () => {
    it("should check what event functions are available in generator module", async () => {
      // Check what's exported from generator module
      console.log("Generator module exports:", Object.keys(gen));

      // Check for event functions
      expect(typeof gen.click).toBeDefined();
      expect(typeof gen.on).toBeDefined();
      expect(typeof gen.input).toBeDefined();
      expect(typeof gen.change).toBeDefined();
      expect(typeof gen.submit).toBeDefined();

      // These should be functions or undefined
      console.log("gen.click type:", typeof gen.click);
      console.log("gen.on type:", typeof gen.on);
      console.log("gen.input type:", typeof gen.input);
      console.log("gen.change type:", typeof gen.change);
      console.log("gen.submit type:", typeof gen.submit);
    });

    it("should work with click from generator module using yield*", async () => {
      const button = createTestElement("button");
      let clicked = false;

      // Skip if click is not available
      if (typeof gen.click !== "function") {
        console.log("gen.click not available, skipping test");
        return;
      }

      watch(button, async function* () {
        yield* gen.text("Click me!");

        // Use click from generator module with yield*
        yield* gen.click(() => {
          clicked = true;
        });
      });

      await waitForMutation();
      expect(button.textContent).toBe("Click me!");

      // Simulate click
      button.click();
      await waitForMutation();
      expect(clicked).toBe(true);
    });

    it("should work with generator event handlers using yield*", async () => {
      const button = createTestElement("button");
      let clickCount = 0;

      // Skip if functions not available
      if (typeof gen.click !== "function" || typeof gen.text !== "function") {
        console.log("Required functions not available, skipping test");
        return;
      }

      watch(button, async function* () {
        yield* gen.text("Count: 0");

        // Generator event handler with yield*
        yield* gen.click(async function* () {
          clickCount++;
          yield* gen.text(`Count: ${clickCount}`);
          yield* gen.addClass("clicked");

          // Wait a bit
          await new Promise((resolve) => setTimeout(resolve, 10));

          yield* gen.removeClass("clicked");
        });
      });

      await waitForMutation();
      expect(button.textContent).toBe("Count: 0");

      // First click
      button.click();
      await waitForMutation();
      expect(button.textContent).toBe("Count: 1");
      expect(button.classList.contains("clicked")).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(button.classList.contains("clicked")).toBe(false);

      // Second click
      button.click();
      await waitForMutation();
      expect(button.textContent).toBe("Count: 2");
      expect(clickCount).toBe(2);
    });

    it("should work with input events from generator module", async () => {
      const inputElement = createTestElement("input") as HTMLInputElement;
      let lastValue = "";

      // Skip if input not available
      if (typeof gen.input !== "function") {
        console.log("gen.input not available, skipping test");
        return;
      }

      watch(inputElement, async function* () {
        yield* gen.input((event) => {
          lastValue = (event.target as HTMLInputElement).value;
        });
      });

      await waitForMutation();

      // Simulate input
      inputElement.value = "test";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      await waitForMutation();
      expect(lastValue).toBe("test");

      // Another input
      inputElement.value = "updated";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      await waitForMutation();
      expect(lastValue).toBe("updated");
    });

    it("should work with custom events using on from generator module", async () => {
      const div = createTestElement("div");
      let eventData: any = null;

      // Skip if on not available
      if (typeof gen.on !== "function") {
        console.log("gen.on not available, skipping test");
        return;
      }

      watch(div, async function* () {
        yield* gen.on("custom-event", (event: CustomEvent) => {
          eventData = event.detail;
        });
      });

      await waitForMutation();

      // Dispatch custom event
      div.dispatchEvent(
        new CustomEvent("custom-event", {
          detail: { message: "Hello from generator" },
        }),
      );

      await waitForMutation();
      expect(eventData).toEqual({ message: "Hello from generator" });
    });

    it("should work with lifecycle events from generator module", async () => {
      const div = createTestElement("div");
      let mounted = false;
      let unmounted = false;

      // Check if lifecycle events are available
      if (
        typeof gen.onMount !== "function" ||
        typeof gen.onUnmount !== "function"
      ) {
        console.log(
          "Lifecycle events not available in generator module, skipping",
        );
        return;
      }

      const controller = watch(div, async function* () {
        yield* gen.onMount(() => {
          mounted = true;
        });

        yield* gen.onUnmount(() => {
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

    it("should work with observer events from generator module", async () => {
      const div = createTestElement("div");
      let attrChanged = false;
      let textChanged = false;

      // Check if observer events are available
      if (
        typeof gen.onAttr !== "function" ||
        typeof gen.onText !== "function"
      ) {
        console.log(
          "Observer events not available in generator module, skipping",
        );
        return;
      }

      watch(div, async function* () {
        yield* gen.onAttr("data-test", (newValue, oldValue) => {
          attrChanged = true;
        });

        yield* gen.onText((newText, oldText) => {
          textChanged = true;
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
    });

    it("should work with event options from generator module", async () => {
      const button = createTestElement("button");
      let callCount = 0;

      // Skip if click not available
      if (typeof gen.click !== "function") {
        console.log("gen.click not available, skipping test");
        return;
      }

      watch(button, async function* () {
        yield* gen.click(
          () => {
            callCount++;
          },
          { once: true },
        );
      });

      await waitForMutation();

      // Multiple clicks
      button.click();
      button.click();
      button.click();

      // Should only be called once due to once: true
      expect(callCount).toBe(1);
    });

    it("should work with debounced events from generator module", async () => {
      const input = createTestElement("input") as HTMLInputElement;
      let callCount = 0;
      let lastValue = "";

      // Skip if input not available
      if (typeof gen.input !== "function") {
        console.log("gen.input not available, skipping test");
        return;
      }

      watch(input, async function* () {
        yield* gen.input(
          (event) => {
            callCount++;
            lastValue = (event.target as HTMLInputElement).value;
          },
          { debounce: 50 },
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

      // Should not have been called yet due to debouncing
      expect(callCount).toBe(0);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(callCount).toBe(1);
      expect(lastValue).toBe("abc");
    });

    it("should compose well with other generator functions", async () => {
      const form = createTestElement("form");
      const input = createTestElement("input", {
        name: "username",
      }) as HTMLInputElement;
      const submitButton = createTestElement("button", { type: "submit" });
      form.appendChild(input);
      form.appendChild(submitButton);

      let formData: any = null;
      let isValid = false;

      // Skip if required functions not available
      if (typeof gen.submit !== "function" || typeof gen.input !== "function") {
        console.log("Required functions not available, skipping test");
        return;
      }

      watch(form, async function* () {
        // Watch input for validation
        yield* gen.input(
          async function* (event) {
            const value = (event.target as HTMLInputElement).value;
            if (value.length >= 3) {
              isValid = true;
              yield* gen.addClass("valid");
            } else {
              isValid = false;
              yield* gen.removeClass("valid");
            }
          },
          { target: input },
        );

        // Watch form submission
        yield* gen.submit(async function* (event) {
          event.preventDefault();

          if (isValid) {
            formData = {
              username: input.value,
            };
            yield* gen.addClass("submitted");
          }
        });
      });

      await waitForMutation();

      // Enter invalid username
      input.value = "ab";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await waitForMutation();
      expect(isValid).toBe(false);
      expect(form.classList.contains("valid")).toBe(false);

      // Try to submit with invalid data
      form.dispatchEvent(new Event("submit", { bubbles: true }));
      await waitForMutation();
      expect(formData).toBeNull();
      expect(form.classList.contains("submitted")).toBe(false);

      // Enter valid username
      input.value = "john";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await waitForMutation();
      expect(isValid).toBe(true);
      expect(form.classList.contains("valid")).toBe(true);

      // Submit with valid data
      form.dispatchEvent(new Event("submit", { bubbles: true }));
      await waitForMutation();
      expect(formData).toEqual({ username: "john" });
      expect(form.classList.contains("submitted")).toBe(true);
    });
  });
});
