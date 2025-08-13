/**
 * @fileoverview Comprehensive integration tests for the generator module state and event operations
 *
 * These tests verify that the generator module functions correctly handle state management
 * and event operations with proper DOM integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { watch } from "../../src/watch";
import {
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
  clearState,
  incrementState,
  decrementState,
  toggleState,
  appendToState,
  prependToState,
  removeFromState,
  mergeState,
  watchState,
  getStateSnapshot,
  computedState,
  logState,
  logStateKey,
} from "../../src/generator/state";
import {
  click,
  input,
  change,
  submit,
  // onFocus,
  // onBlur,
  on,
  emit,
  onMount,
  onUnmount,
} from "../../src/generator/events";
import {
  text,
  addClass,
  removeClass,
  getValue,
  value,
  self,
  query,
  queryAll,
} from "../../src/generator/dom";

describe("Generator State Integration Tests", () => {
  let container: HTMLElement;
  let cleanup: (() => void) | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    document.body.removeChild(container);
  });

  describe("Basic State Operations", () => {
    it("should set and get state correctly", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Set primitive values
        yield* setState("string", "hello");
        yield* setState("number", 42);
        yield* setState("boolean", true);
        yield* setState("null", null);

        // Get values
        const str = yield* getState<string>("string");
        const num = yield* getState<number>("number");
        const bool = yield* getState<boolean>("boolean");
        const nullVal = yield* getState("null");

        expect(str).toBe("hello");
        expect(num).toBe(42);
        expect(bool).toBe(true);
        expect(nullVal).toBe(null);

        // Get with default value
        const withDefault = yield* getState("nonexistent", "default");
        expect(withDefault).toBe("default");
      });
    });

    it("should handle complex state objects", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      interface User {
        id: number;
        name: string;
        email: string;
        preferences: {
          theme: string;
          notifications: boolean;
        };
      }

      await watch(element, async function* () {
        const user: User = {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          preferences: {
            theme: "dark",
            notifications: true,
          },
        };

        yield* setState("user", user);
        const retrievedUser = yield* getState<User>("user");

        expect(retrievedUser).toEqual(user);
        expect(retrievedUser?.preferences.theme).toBe("dark");
      });
    });

    it("should update state with updater function", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        yield* setState("counter", 0);

        // Update with function
        const newValue = yield* updateState<number>(
          "counter",
          (current = 0) => current + 1,
        );
        expect(newValue).toBe(1);

        // Multiple updates
        yield* updateState<number>("counter", (c) => (c || 0) + 5);
        const final = yield* getState<number>("counter");
        expect(final).toBe(6);

        // Update complex object
        yield* setState("config", { version: 1, features: ["a"] });
        yield* updateState("config", (current: any) => ({
          ...current,
          version: 2,
          features: [...current.features, "b"],
        }));

        const config = yield* getState("config");
        expect(config.version).toBe(2);
        expect(config.features).toEqual(["a", "b"]);
      });
    });

    it("should check state existence and delete state", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Check non-existent state
        const exists1 = yield* hasState("test");
        expect(exists1).toBe(false);

        // Set and check
        yield* setState("test", "value");
        const exists2 = yield* hasState("test");
        expect(exists2).toBe(true);

        // Delete state
        const deleted = yield* deleteState("test");
        expect(deleted).toBe(true);

        // Check after deletion
        const exists3 = yield* hasState("test");
        expect(exists3).toBe(false);

        // Delete non-existent
        const deleted2 = yield* deleteState("nonexistent");
        expect(deleted2).toBe(false);
      });
    });

    it("should clear all state", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Set multiple states
        yield* setState("a", 1);
        yield* setState("b", 2);
        yield* setState("c", 3);

        // Verify they exist
        expect(yield* hasState("a")).toBe(true);
        expect(yield* hasState("b")).toBe(true);
        expect(yield* hasState("c")).toBe(true);

        // Clear all
        yield* clearState();

        // Verify all cleared
        expect(yield* hasState("a")).toBe(false);
        expect(yield* hasState("b")).toBe(false);
        expect(yield* hasState("c")).toBe(false);
      });
    });
  });

  describe("Specialized State Operations", () => {
    it("should increment and decrement numeric state", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Start with initial value
        yield* setState("count", 10);

        // Increment
        const inc1 = yield* incrementState("count");
        expect(inc1).toBe(11);

        const inc2 = yield* incrementState("count", 5);
        expect(inc2).toBe(16);

        // Decrement
        const dec1 = yield* decrementState("count");
        expect(dec1).toBe(15);

        const dec2 = yield* decrementState("count", 3);
        expect(dec2).toBe(12);

        // Auto-initialize if not exists
        const newCount = yield* incrementState("newCount");
        expect(newCount).toBe(1);
      });
    });

    it("should toggle boolean state", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Toggle non-existent (defaults to true)
        const toggle1 = yield* toggleState("flag");
        expect(toggle1).toBe(true);

        // Toggle existing
        const toggle2 = yield* toggleState("flag");
        expect(toggle2).toBe(false);

        const toggle3 = yield* toggleState("flag");
        expect(toggle3).toBe(true);

        // Start with specific value
        yield* setState("switch", false);
        const toggle4 = yield* toggleState("switch");
        expect(toggle4).toBe(true);
      });
    });

    it("should append and prepend to array state", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Initialize array
        yield* setState("items", ["a", "b"]);

        // Append single item
        const appended1 = yield* appendToState("items", "c");
        expect(appended1).toEqual(["a", "b", "c"]);

        // Append multiple items
        const appended2 = yield* appendToState("items", ["d", "e"]);
        expect(appended2).toEqual(["a", "b", "c", "d", "e"]);

        // Prepend single item
        const prepended1 = yield* prependToState("items", "z");
        expect(prepended1).toEqual(["z", "a", "b", "c", "d", "e"]);

        // Prepend multiple items
        const prepended2 = yield* prependToState("items", ["x", "y"]);
        expect(prepended2).toEqual(["x", "y", "z", "a", "b", "c", "d", "e"]);

        // Auto-initialize if not exists
        const newArray = yield* appendToState("newItems", "first");
        expect(newArray).toEqual(["first"]);
      });
    });

    it("should remove items from array state", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Initialize array
        yield* setState("items", ["a", "b", "c", "b", "d"]);

        // Remove by value
        const removed1 = yield* removeFromState("items", "b");
        expect(removed1).toEqual(["a", "c", "b", "d"]); // Removes first occurrence

        // Remove by predicate
        const removed2 = yield* removeFromState(
          "items",
          (item: string) => item === "b",
        );
        expect(removed2).toEqual(["a", "c", "d"]); // Removes all matching

        // Remove by index
        const removed3 = yield* removeFromState("items", 1);
        expect(removed3).toEqual(["a", "d"]);

        // Remove non-existent
        const removed4 = yield* removeFromState("items", "z");
        expect(removed4).toEqual(["a", "d"]); // No change
      });
    });

    it("should merge state objects", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Initialize object
        yield* setState("config", {
          theme: "light",
          fontSize: 14,
          features: {
            autoSave: true,
            spellCheck: false,
          },
        });

        // Shallow merge
        const merged1 = yield* mergeState("config", {
          theme: "dark",
          newProp: "value",
        });

        expect(merged1.theme).toBe("dark");
        expect(merged1.fontSize).toBe(14);
        expect(merged1.newProp).toBe("value");
        expect(merged1.features.autoSave).toBe(true);

        // Deep merge
        const merged2 = yield* mergeState(
          "config",
          {
            features: {
              spellCheck: true,
              newFeature: true,
            },
          },
          true,
        );

        expect(merged2.features.autoSave).toBe(true);
        expect(merged2.features.spellCheck).toBe(true);
        expect(merged2.features.newFeature).toBe(true);
      });
    });
  });

  describe("State Observation", () => {
    it("should watch state changes", async () => {
      const element = document.createElement("div");
      container.appendChild(element);
      const changes: any[] = [];

      await watch(element, async function* () {
        // Set up watcher
        const unwatch = yield* watchState("value", (newVal, oldVal) => {
          changes.push({ new: newVal, old: oldVal });
        });

        // Initial value
        yield* setState("value", "initial");

        // Change value
        yield* setState("value", "updated");

        // Another change
        yield* setState("value", "final");

        // Stop watching
        unwatch();

        // This change should not be observed
        yield* setState("value", "not observed");
      });

      // Allow async callbacks to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(changes).toHaveLength(3);
      expect(changes[0]).toEqual({ new: "initial", old: undefined });
      expect(changes[1]).toEqual({ new: "updated", old: "initial" });
      expect(changes[2]).toEqual({ new: "final", old: "updated" });
    });
  });

  describe("State Utilities", () => {
    it("should get state snapshot", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Add some state
        yield* setState("a", 1);
        yield* setState("b", 2);
        yield* setState("c", 3);

        // Get snapshot
        const snapshot = yield* getStateSnapshot();
        expect(snapshot).toEqual({
          a: 1,
          b: 2,
          c: 3,
        });

        // After deletion
        yield* deleteState("b");
        const snapshot2 = yield* getStateSnapshot();
        expect(snapshot2).toEqual({
          a: 1,
          c: 3,
        });
      });
    });

    it("should use computed state", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      await watch(element, async function* () {
        // Set base values
        yield* setState("firstName", "John");
        yield* setState("lastName", "Doe");

        // Computed state
        const fullName = yield* computedState(
          ["firstName", "lastName"],
          (deps) => {
            return `${deps.firstName} ${deps.lastName}`;
          },
        );
        expect(fullName).toBe("John Doe");

        // Update and recompute
        yield* setState("firstName", "Jane");
        const fullName2 = yield* computedState(
          ["firstName", "lastName"],
          (deps) => {
            return `${deps.firstName} ${deps.lastName}`;
          },
        );
        expect(fullName2).toBe("Jane Doe");
      });
    });

    it("should log state for debugging", async () => {
      const element = document.createElement("div");
      container.appendChild(element);
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      await watch(element, async function* () {
        // Set some state
        yield* setState("debug", { count: 0, message: "test" });
        yield* setState("other", "value");

        // Log all state
        yield* logState("Debug");

        // Log specific key
        yield* logStateKey("debug", "Debug Value");

        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    // Tests for snapshot have been removed since those functions don't exist yet
  });

  describe("Event Handling", () => {
    it("should handle click events with generators", async () => {
      const button = document.createElement("button");
      button.textContent = "Click me";
      container.appendChild(button);

      let clickCount = 0;

      await watch(button, async function* () {
        yield* click(async function* (event) {
          clickCount++;
          yield* text(`Clicked ${clickCount} times`);
          yield* addClass("clicked");

          // Prevent default
          event.preventDefault();
        });
      });

      // Simulate click
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(button.textContent).toBe("Clicked 1 times");
      expect(button.classList.contains("clicked")).toBe(true);
      expect(clickCount).toBe(1);

      // Click again
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(button.textContent).toBe("Clicked 2 times");
      expect(clickCount).toBe(2);
    });

    it("should handle input events", async () => {
      const inputElement = document.createElement("input");
      inputElement.type = "text";
      container.appendChild(inputElement);

      const preview = document.createElement("div");
      preview.className = "preview";
      container.appendChild(preview);

      await watch(inputElement, async function* () {
        yield* input(async function* (event) {
          const input = event.target as HTMLInputElement;
          const value = input.value;

          // Update preview
          const previewEl = yield* query(".preview");
          if (previewEl) {
            yield* text(previewEl, `You typed: ${value}`);
          }

          // Add validation classes
          if (value.length > 10) {
            yield* addClass("valid");
            yield* removeClass("invalid");
          } else {
            yield* addClass("invalid");
            yield* removeClass("valid");
          }
        });
      });

      // Simulate typing
      inputElement.value = "Hello";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(preview.textContent).toBe("You typed: Hello");
      expect(inputElement.classList.contains("invalid")).toBe(true);
      expect(inputElement.classList.contains("valid")).toBe(false);

      // Type more
      inputElement.value = "Hello World!";
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(preview.textContent).toBe("You typed: Hello World!");
      expect(inputElement.classList.contains("valid")).toBe(true);
      expect(inputElement.classList.contains("invalid")).toBe(false);
    });

    it("should handle form submission", async () => {
      const form = document.createElement("form");
      form.innerHTML = `
        <input type="text" name="username" value="testuser">
        <input type="email" name="email" value="test@example.com">
        <button type="submit">Submit</button>
      `;
      container.appendChild(form);

      let formData: any = null;
      let submitted = false;

      await watch(form, async function* () {
        yield* submit(async function* (event) {
          event.preventDefault();
          submitted = true;

          // Get form data
          const data = new FormData(event.target as HTMLFormElement);
          formData = Object.fromEntries(data.entries());

          // Update UI
          yield* addClass("submitted");
          yield* text('button[type="submit"]', "Submitted!");

          // Store in state
          yield* setState("formData", formData);
        });
      });

      // Submit form
      form.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(submitted).toBe(true);
      expect(formData).toEqual({
        username: "testuser",
        email: "test@example.com",
      });
      expect(form.classList.contains("submitted")).toBe(true);
    });

    // Keyboard events test removed - functions don't exist yet

    // Mouse events test removed - functions don't exist yet

    it("should handle custom events", async () => {
      const element = document.createElement("div");
      container.appendChild(element);

      let customData: any = null;

      await watch(element, async function* () {
        yield* on("customEvent", async function* (event: CustomEvent) {
          customData = event.detail;
          yield* text(`Received: ${JSON.stringify(customData)}`);
          yield* addClass("event-received");
        });

        // Emit custom event after setup
        setTimeout(() => {
          emit("customEvent", { message: "Hello", value: 42 });
        }, 10);
      });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(customData).toEqual({ message: "Hello", value: 42 });
      expect(element.classList.contains("event-received")).toBe(true);
    });

    it("should handle lifecycle events", async () => {
      const element = document.createElement("div");
      let mounted = false;
      let unmounted = false;

      await watch(element, async function* () {
        yield* onMount(async function* () {
          mounted = true;
          yield* addClass("mounted");
          yield* setState("mountTime", Date.now());
        });

        yield* onUnmount(async function* () {
          unmounted = true;
          yield* clearState();
        });
      });

      // Add to DOM (triggers mount)
      container.appendChild(element);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mounted).toBe(true);
      expect(element.classList.contains("mounted")).toBe(true);

      // Remove from DOM (triggers unmount)
      container.removeChild(element);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(unmounted).toBe(true);
    });

    // Delegated events test removed - function doesn't exist yet
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle todo list with state and events", async () => {
      const app = document.createElement("div");
      app.innerHTML = `
        <input type="text" class="todo-input" placeholder="Add todo">
        <button class="add-btn">Add</button>
        <ul class="todo-list"></ul>
        <div class="stats">
          <span class="total">Total: 0</span>
          <span class="completed">Completed: 0</span>
        </div>
      `;
      container.appendChild(app);

      interface Todo {
        id: number;
        text: string;
        completed: boolean;
      }

      await watch(app, async function* () {
        // Initialize state
        yield* setState<Todo[]>("todos", []);
        yield* setState("nextId", 1);

        // Handle input and button
        const input = yield* query(".todo-input") as HTMLInputElement;
        const addBtn = yield* query(".add-btn");
        const list = yield* query(".todo-list");

        if (addBtn && input) {
          yield* click(addBtn, async function* () {
            const text = input.value.trim();
            if (!text) return;

            // Add todo
            const id = yield* getState<number>("nextId", 1);
            const todos = yield* getState<Todo[]>("todos", []);
            const newTodo: Todo = { id, text, completed: false };

            yield* setState("todos", [...todos, newTodo]);
            yield* setState("nextId", id + 1);

            // Clear input
            input.value = "";

            // Render todos
            yield* renderTodos();
          });
        }

        // Render function
        const renderTodos = async function* (): Workflow {
          const todos = yield* getState<any[]>("todos", []);
          const todosHtml = todos
            .map(
              (todo) => `
              <li class="${todo.completed ? "completed" : ""}">
                <input type="checkbox" ${todo.completed ? "checked" : ""}>
                <span>${todo.text}</span>
                <button class="delete">×</button>
              </li>
            `,
            )
            .join("");

          const list = yield* query<HTMLUListElement>(".todo-list");
          if (list) {
            yield* html(todosHtml);
          }
        };

        // Initial render
        yield* renderTodos();
      });

      // Add a todo
      const input = container.querySelector(
        'input[type="text"]',
      ) as HTMLInputElement;
      input.value = "Test todo";

      const form = container.querySelector("form") as HTMLFormElement;
      form.dispatchEvent(new Event("submit", { bubbles: true }));

      await waitFor(() => {
        const todos = container.querySelectorAll(".todo-list li");
        expect(todos.length).toBe(1);
        expect(todos[0].textContent).toContain("Test todo");
      });
    });
  });
});
