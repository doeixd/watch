import { describe, it, expect, beforeEach, vi } from "vitest";
import { watch, runOn } from "../src";
import {
  click,
  input,
  change,
  submit,
  on,
  onMount,
  onUnmount,
  onAttr,
  onText,
  text,
  addClass,
  removeClass,
} from "../src";

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

describe("Events with Unified API", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  describe("Unified API event functions with yield*", () => {
    it("should work with click using yield*", async () => {
      const button = createTestElement("button");
      let clicked = false;

      watch(button, async function* () {
        yield* text("Click me!");

        // Use click with yield*
        yield* click(() => {
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

      watch(button, async function* () {
        yield* text("Count: 0");

        // Generator event handler with yield*
        yield* click(async function* () {
          clickCount++;
          yield* text(`Count: ${clickCount}`);
          yield* addClass("clicked");

          // Wait a bit
          await new Promise((resolve) => setTimeout(resolve, 10));

          yield* removeClass("clicked");
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

    it("should work with input events using yield*", async () => {
      const inputElement = createTestElement("input") as HTMLInputElement;
      let lastValue = "";

      watch(inputElement, async function* () {
        yield* input((event) => {
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

    it("should work with custom events using on", async () => {
      const div = createTestElement("div");
      let eventData: any = null;

      watch(div, async function* () {
        yield* on("custom-event", (event: CustomEvent) => {
          eventData = event.detail;
        });
      });

      await waitForMutation();

      // Dispatch custom event
      div.dispatchEvent(
        new CustomEvent("custom-event", {
          detail: { message: "Hello from unified API" },
        }),
      );

      await waitForMutation();
      expect(eventData).toEqual({ message: "Hello from unified API" });
    });

    it("should work with lifecycle events", async () => {
      const div = createTestElement("div");
      let mounted = false;
      let unmounted = false;

      const controller = watch(div, async function* () {
        yield* onMount(() => {
          mounted = true;
        });

        yield* onUnmount(() => {
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

    it("should work with observer events", async () => {
      const div = createTestElement("div");
      let attrChanged = false;
      let textChanged = false;

      watch(div, async function* () {
        yield* onAttr("data-test", (newValue, oldValue) => {
          attrChanged = true;
        });

        yield* onText((newText, oldText) => {
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

    it("should work with event options", async () => {
      const button = createTestElement("button");
      let callCount = 0;

      watch(button, async function* () {
        yield* click(
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

    it("should work with debounced events", async () => {
      const inputEl = createTestElement("input") as HTMLInputElement;
      let callCount = 0;
      let lastValue = "";

      watch(inputEl, async function* () {
        yield* input(
          (event) => {
            callCount++;
            lastValue = (event.target as HTMLInputElement).value;
          },
          { debounce: 50 },
        );
      });

      await waitForMutation();

      // Rapid inputs
      inputEl.value = "a";
      inputEl.dispatchEvent(new Event("input"));
      inputEl.value = "ab";
      inputEl.dispatchEvent(new Event("input"));
      inputEl.value = "abc";
      inputEl.dispatchEvent(new Event("input"));

      // Should not have been called yet due to debouncing
      expect(callCount).toBe(0);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(callCount).toBe(1);
      expect(lastValue).toBe("abc");
    });

    it("should compose well with other unified API functions", async () => {
      const form = createTestElement("form");
      const inputEl = createTestElement("input", {
        name: "username",
      }) as HTMLInputElement;
      const submitButton = createTestElement("button", { type: "submit" });
      form.appendChild(inputEl);
      form.appendChild(submitButton);

      let formData: any = null;
      let isValid = false;

      watch(form, async function* () {
        // Watch input for validation
        yield* input(
          async function* (event) {
            const value = (event.target as HTMLInputElement).value;
            if (value.length >= 3) {
              isValid = true;
              yield* addClass("valid");
            } else {
              isValid = false;
              yield* removeClass("valid");
            }
          },
          { target: inputEl },
        );

        // Watch form submission
        yield* submit(async function* (event) {
          event.preventDefault();

          if (isValid) {
            formData = {
              username: inputEl.value,
            };
            yield* addClass("submitted");
          }
        });
      });

      await waitForMutation();

      // Enter invalid username
      inputEl.value = "ab";
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      await waitForMutation();
      expect(isValid).toBe(false);
      expect(form.classList.contains("valid")).toBe(false);

      // Try to submit with invalid data
      form.dispatchEvent(new Event("submit", { bubbles: true }));
      await waitForMutation();
      expect(formData).toBeNull();
      expect(form.classList.contains("submitted")).toBe(false);

      // Enter valid username
      inputEl.value = "john";
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
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
