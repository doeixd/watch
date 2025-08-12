import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { on, click, input, change, submit } from "../src/api/events";

describe("Event Functions CSS Selector Support", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("on() with CSS selectors", () => {
    it("should attach event listener using CSS selector", () => {
      document.body.innerHTML = '<button id="test-btn">Click me</button>';
      const handler = vi.fn((...args) => {
        console.log("Handler called with args:", args);
        console.log("Number of args:", args.length);
        console.log("First arg type:", args[0]?.constructor?.name);
      });

      const cleanup = on("#test-btn", "click", handler);
      expect(cleanup).toBeTruthy();

      const button = document.getElementById("test-btn") as HTMLButtonElement;
      button.click();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent), button);

      // Cleanup should work
      cleanup?.();
      button.click();
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it("should return null if selector finds no element", () => {
      const handler = vi.fn();

      const cleanup = on("#non-existent", "click", handler);
      expect(cleanup).toBeNull();
      expect(handler).not.toHaveBeenCalled();
    });

    it("should support event options with CSS selector", () => {
      document.body.innerHTML = '<button class="once-btn">Click once</button>';
      const handler = vi.fn();

      on(".once-btn", "click", handler, { once: true });

      const button = document.querySelector(".once-btn") as HTMLButtonElement;
      button.click();
      button.click();
      button.click();

      expect(handler).toHaveBeenCalledTimes(1); // Only once due to option
    });

    it("should support custom events with CSS selector", () => {
      document.body.innerHTML = '<div id="custom-target">Target</div>';
      const handler = vi.fn((...args) => {
        console.log("Custom event handler called with args:", args);
        console.log("Number of args:", args.length);
        console.log("First arg:", args[0]);
        console.log("First arg type:", args[0]?.constructor?.name);
        if (args[0]) {
          console.log("Event type:", args[0].type);
          console.log("Event detail:", args[0].detail);
        }
      });

      on("#custom-target", "custom-event", handler);

      const element = document.getElementById("custom-target");
      const customEvent = new CustomEvent("custom-event", {
        detail: { message: "Hello" },
      });
      element?.dispatchEvent(customEvent);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "custom-event",
          detail: { message: "Hello" },
        }),
        element,
      );
    });
  });

  describe("click() with CSS selectors", () => {
    it("should attach click listener using CSS selector", () => {
      document.body.innerHTML = '<button id="click-btn">Click me</button>';
      const handler = vi.fn();

      const cleanup = click("#click-btn", handler);
      expect(cleanup).toBeTruthy();

      const button = document.getElementById("click-btn") as HTMLButtonElement;
      button.click();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
    });

    it("should support class selectors", () => {
      document.body.innerHTML = `
        <button class="action-btn">Button 1</button>
        <button class="action-btn">Button 2</button>
      `;
      const handler = vi.fn();

      // Note: querySelector returns first match only
      const cleanup = click(".action-btn", handler);
      expect(cleanup).toBeTruthy();

      const buttons = document.querySelectorAll(".action-btn");
      (buttons[0] as HTMLButtonElement).click();

      expect(handler).toHaveBeenCalledTimes(1);

      // Second button won't have the handler (querySelector returns first only)
      (buttons[1] as HTMLButtonElement).click();
      expect(handler).toHaveBeenCalledTimes(1); // Still 1
    });

    it("should support complex selectors", () => {
      document.body.innerHTML = `
        <div class="container">
          <button data-action="save">Save</button>
          <button data-action="cancel">Cancel</button>
        </div>
      `;
      const handler = vi.fn();

      click('.container button[data-action="save"]', handler);

      const saveBtn = document.querySelector(
        '[data-action="save"]',
      ) as HTMLButtonElement;
      const cancelBtn = document.querySelector(
        '[data-action="cancel"]',
      ) as HTMLButtonElement;

      saveBtn.click();
      expect(handler).toHaveBeenCalledTimes(1);

      cancelBtn.click();
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, only save button has handler
    });

    it("should warn and return null for non-existent selector", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const handler = vi.fn();

      const cleanup = click("#non-existent-button", handler);

      expect(cleanup).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "No element found for selector: #non-existent-button",
      );
      expect(handler).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("input() with CSS selectors", () => {
    it("should attach input listener using CSS selector", () => {
      document.body.innerHTML = '<input id="text-input" type="text" />';
      const handler = vi.fn();

      const cleanup = input("#text-input", handler);
      expect(cleanup).toBeTruthy();

      const inputElement = document.getElementById(
        "text-input",
      ) as HTMLInputElement;
      inputElement.value = "Hello";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should work with textarea selector", () => {
      document.body.innerHTML = '<textarea id="comment"></textarea>';
      const handler = vi.fn();

      input("#comment", handler);

      const textarea = document.getElementById(
        "comment",
      ) as HTMLTextAreaElement;
      textarea.value = "Test comment";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("change() with CSS selectors", () => {
    it("should attach change listener using CSS selector", () => {
      document.body.innerHTML = `
        <select id="options">
          <option value="1">One</option>
          <option value="2">Two</option>
        </select>
      `;
      const handler = vi.fn();

      const cleanup = change("#options", handler);
      expect(cleanup).toBeTruthy();

      const select = document.getElementById("options") as HTMLSelectElement;
      select.value = "2";
      select.dispatchEvent(new Event("change", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should work with checkbox selector", () => {
      document.body.innerHTML = '<input type="checkbox" id="agree" />';
      const handler = vi.fn();

      change("#agree", handler);

      const checkbox = document.getElementById("agree") as HTMLInputElement;
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("submit() with CSS selectors", () => {
    it("should attach submit listener using CSS selector", () => {
      document.body.innerHTML = `
        <form id="test-form">
          <input type="text" name="name" />
          <button type="submit">Submit</button>
        </form>
      `;
      const handler = vi.fn((e) => e.preventDefault());

      const cleanup = submit("#test-form", handler);
      expect(cleanup).toBeTruthy();

      const form = document.getElementById("test-form") as HTMLFormElement;
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toBeInstanceOf(Event);
    });
  });

  describe("Event options with CSS selectors", () => {
    it("should support debounce option", async () => {
      document.body.innerHTML = '<button id="debounced">Click me</button>';
      const handler = vi.fn();

      click("#debounced", handler, { debounce: 50 });

      const button = document.getElementById("debounced") as HTMLButtonElement;

      // Click multiple times rapidly
      button.click();
      button.click();
      button.click();

      // Handler shouldn't be called immediately
      expect(handler).toHaveBeenCalledTimes(0);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be called once after debounce
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should support throttle option", async () => {
      document.body.innerHTML = '<button id="throttled">Click me</button>';
      const handler = vi.fn();

      click("#throttled", handler, { throttle: 50 });

      const button = document.getElementById("throttled") as HTMLButtonElement;

      // First click should work immediately
      button.click();
      expect(handler).toHaveBeenCalledTimes(1);

      // Rapid clicks within throttle period should be ignored
      button.click();
      button.click();
      expect(handler).toHaveBeenCalledTimes(1);

      // After throttle period, should work again
      await new Promise((resolve) => setTimeout(resolve, 60));
      button.click();
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should support capture option", () => {
      document.body.innerHTML = `
        <div id="parent">
          <button id="child">Click me</button>
        </div>
      `;
      const parentHandler = vi.fn();
      const childHandler = vi.fn();

      on("#parent", "click", parentHandler, { capture: true });
      on("#child", "click", childHandler);

      const child = document.getElementById("child") as HTMLButtonElement;
      child.click();

      // Parent with capture should be called first
      const parentCallOrder = parentHandler.mock.invocationCallOrder[0];
      const childCallOrder = childHandler.mock.invocationCallOrder[0];
      expect(parentCallOrder).toBeLessThan(childCallOrder);
    });
  });

  describe("Integration with all event shortcuts", () => {
    it("should support all event shortcuts with CSS selectors", () => {
      document.body.innerHTML = `
        <button id="btn">Button</button>
        <input id="inp" type="text" />
        <select id="sel"><option>1</option></select>
        <form id="frm"></form>
      `;

      const handlers = {
        click: vi.fn(),
        input: vi.fn(),
        change: vi.fn(),
        submit: vi.fn((e) => e.preventDefault()),
      };

      // All shortcuts should support CSS selectors
      const cleanups = [
        click("#btn", handlers.click),
        input("#inp", handlers.input),
        change("#sel", handlers.change),
        submit("#frm", handlers.submit),
      ];

      // All should return cleanup functions (not null)
      cleanups.forEach((cleanup) => {
        expect(cleanup).toBeTruthy();
        expect(typeof cleanup).toBe("function");
      });

      // Trigger events
      (document.getElementById("btn") as HTMLButtonElement).click();
      const inp = document.getElementById("inp") as HTMLInputElement;
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      const sel = document.getElementById("sel") as HTMLSelectElement;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      const frm = document.getElementById("frm") as HTMLFormElement;
      frm.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );

      // All handlers should be called
      expect(handlers.click).toHaveBeenCalledTimes(1);
      expect(handlers.input).toHaveBeenCalledTimes(1);
      expect(handlers.change).toHaveBeenCalledTimes(1);
      expect(handlers.submit).toHaveBeenCalledTimes(1);

      // Cleanup all
      cleanups.forEach((cleanup) => cleanup?.());

      // Trigger events again
      (document.getElementById("btn") as HTMLButtonElement).click();
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      frm.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );

      // Handlers should not be called again after cleanup
      expect(handlers.click).toHaveBeenCalledTimes(1);
      expect(handlers.input).toHaveBeenCalledTimes(1);
      expect(handlers.change).toHaveBeenCalledTimes(1);
      expect(handlers.submit).toHaveBeenCalledTimes(1);
    });
  });
});
