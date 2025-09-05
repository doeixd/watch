/**
 * @fileoverview State and events integration tests for the unified API
 *
 * These tests verify that state management and event handling work correctly
 * with yield* patterns in generator contexts.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { watch } from "../../src/watch";
import {
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
  clearAllState,
  watchState,
  createState,
  createTypedState,
} from "../../src/core/state";
import {
  click,
  input,
  change,
  submit,
  on,
  emit,
  onMount,
  onUnmount,
} from "../../src/index";
import {
  text,
  addClass,
  removeClass,
  getValue,
  value,
  self,
  query,
  queryAll,
} from "../../src/index";

describe("Unified API State and Events Integration Tests", () => {
  let testContainer: HTMLElement;

  beforeEach(() => {
    testContainer = document.createElement("div");
    testContainer.id = "test-container";
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    if (testContainer && testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    document.body.innerHTML = "";
  });

  describe("State Management Integration", () => {
    it("should handle state across multiple elements", async () => {
      const counter = document.createElement("div");
      const button = document.createElement("button");
      const display = document.createElement("span");

      counter.appendChild(button);
      counter.appendChild(display);
      testContainer.appendChild(counter);

      await watch(counter, function* () {
        // Initialize shared state
        yield* setState("count", 0);
        yield* setState("total", 0);

        // Set up initial display
        const initialCount = yield* getState<number>("count", 0);
        yield* text(display, `Count: ${initialCount}`);
        yield* text(button, "Increment");
      });

      await watch(button, function* () {
        yield* click(function* () {
          // Update state
          const currentCount = yield* getState<number>("count", 0);
          const newCount = currentCount + 1;
          yield* setState("count", newCount);

          // Update total
          yield* updateState("total", (total: number) => total + newCount);

          // Update display - need to target display element
          const displayElement = yield* query("span");
          if (displayElement) {
            yield* text(displayElement, `Count: ${newCount}`);
          }
        });
      });

      // Wait for setup
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(button.textContent).toBe("Increment");
      expect(display.textContent).toBe("Count: 0");

      // Click button
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(display.textContent).toBe("Count: 1");

      // Click again
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(display.textContent).toBe("Count: 2");
    });

    it("should handle state persistence across DOM changes", async () => {
      const container = document.createElement("div");
      testContainer.appendChild(container);

      // Initial watch
      await watch(container, async function* () {
        yield* setState("persistent", "initial value");
        yield* text("Initial content");
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify initial state
      expect(container.textContent).toBe("Initial content");

      // Modify DOM
      container.innerHTML = "<span>New content</span>";

      // Watch again - state should persist
      await watch(container, async function* () {
        const persistentValue = yield* getState<string>("persistent", "");
        expect(persistentValue).toBe("initial value");

        yield* setState("persistent", "updated value");
        const span = yield* query("span");
        if (span) {
          yield* text(span, `Persistent: ${persistentValue}`);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(container.querySelector("span")?.textContent).toBe(
        "Persistent: initial value",
      );
    });

    it("should handle complex state objects", async () => {
      const form = document.createElement("form");
      form.innerHTML = `
        <input type="text" name="name" />
        <input type="email" name="email" />
        <button type="submit">Submit</button>
        <div class="status"></div>
      `;
      testContainer.appendChild(form);

      interface FormData {
        name: string;
        email: string;
        isValid: boolean;
        errors: string[];
      }

      await watch(form, async function* () {
        // Initialize form state
        const initialState: FormData = {
          name: "",
          email: "",
          isValid: false,
          errors: [],
        };

        yield* setState("formData", initialState);

        // Watch name input
        const nameInput = yield* query('input[name="name"]');
        if (nameInput) {
          yield* input(nameInput, async function* (event) {
            const value = (event.target as HTMLInputElement).value;

            yield* updateState("formData", (current: FormData) => ({
              ...current,
              name: value,
              errors: value.length < 2 ? ["Name too short"] : [],
            }));

            // Update validation
            const formData = yield* getState<FormData>("formData");
            const isValid =
              formData.name.length >= 2 && formData.email.includes("@");

            yield* updateState("formData", (current: FormData) => ({
              ...current,
              isValid,
            }));
          });
        }

        // Watch email input
        const emailInput = yield* query('input[name="email"]');
        if (emailInput) {
          yield* input(emailInput, async function* (event) {
            const value = (event.target as HTMLInputElement).value;

            yield* updateState("formData", (current: FormData) => ({
              ...current,
              email: value,
            }));
          });
        }

        // Watch form submission
        yield* submit(async function* (event) {
          event.preventDefault();

          const formData = yield* getState<FormData>("formData");
          const status = yield* query(".status");

          if (status) {
            if (formData.isValid) {
              yield* text(status, "Form submitted successfully!");
              yield* addClass(status, "success");
            } else {
              yield* text(status, `Errors: ${formData.errors.join(", ")}`);
              yield* addClass(status, "error");
            }
          }
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate form interaction
      const nameInput = form.querySelector(
        'input[name="name"]',
      ) as HTMLInputElement;
      const emailInput = form.querySelector(
        'input[name="email"]',
      ) as HTMLInputElement;

      nameInput.value = "John";
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      emailInput.value = "john@example.com";
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Submit form
      form.dispatchEvent(new Event("submit"));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const status = form.querySelector(".status");
      expect(status?.textContent).toBe("Form submitted successfully!");
      expect(status?.classList.contains("success")).toBe(true);
    });
  });

  describe("Event Handling Integration", () => {
    it("should handle event composition with state", async () => {
      const widget = document.createElement("div");
      widget.innerHTML = `
        <button class="toggle">Toggle</button>
        <div class="content">Content</div>
        <div class="counter">0</div>
      `;
      testContainer.appendChild(widget);

      await watch(counter, function* () {
        // Initialize state
        yield* setState("isOpen", false);
        yield* setState("clickCount", 0);

        // Initial setup
        const content = yield* query(".content");
        if (content) {
          yield* addClass(content, "hidden");
        }

        // Toggle functionality
        const toggleButton = yield* query(".toggle");
        if (toggleButton) {
          yield* click(toggleButton, async function* () {
            // Update click count
            const clicks = yield* getState<number>("clickCount", 0);
            yield* setState("clickCount", clicks + 1);

            // Update counter display
            const counter = yield* query(".counter");
            if (counter) {
              yield* text(counter, `${clicks + 1}`);
            }

            // Toggle content visibility
            const isOpen = yield* getState<boolean>("isOpen", false);
            const contentEl = yield* query(".content");

            if (contentEl) {
              if (isOpen) {
                yield* addClass(contentEl, "hidden");
                yield* removeClass(contentEl, "visible");
                yield* text(toggleButton, "Show");
              } else {
                yield* removeClass(contentEl, "hidden");
                yield* addClass(contentEl, "visible");
                yield* text(toggleButton, "Hide");
              }
            }

            yield* setState("isOpen", !isOpen);
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const button = widget.querySelector(".toggle") as HTMLButtonElement;
      const content = widget.querySelector(".content") as HTMLElement;
      const counter = widget.querySelector(".counter") as HTMLElement;

      expect(button.textContent).toBe("Toggle");
      expect(content.classList.contains("hidden")).toBe(true);
      expect(counter.textContent).toBe("0");

      // First click - show content
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(button.textContent).toBe("Hide");
      expect(content.classList.contains("visible")).toBe(true);
      expect(content.classList.contains("hidden")).toBe(false);
      expect(counter.textContent).toBe("1");

      // Second click - hide content
      button.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(button.textContent).toBe("Show");
      expect(content.classList.contains("hidden")).toBe(true);
      expect(content.classList.contains("visible")).toBe(false);
      expect(counter.textContent).toBe("2");
    });

    it("should handle multiple event types with shared state", async () => {
      const app = document.createElement("div");
      app.innerHTML = `
        <input type="text" class="search" placeholder="Type to search" />
        <div class="filters">
          <button data-filter="all">All</button>
          <button data-filter="active">Active</button>
          <button data-filter="completed">Completed</button>
        </div>
        <ul class="results"></ul>
        <div class="stats"></div>
      `;
      testContainer.appendChild(app);

      interface AppState {
        query: string;
        filter: string;
        items: Array<{ id: number; text: string; completed: boolean }>;
        filteredItems: Array<{ id: number; text: string; completed: boolean }>;
      }

      await watch(app, async function* () {
        // Initialize state
        const initialState: AppState = {
          query: "",
          filter: "all",
          items: [
            { id: 1, text: "Learn TypeScript", completed: true },
            { id: 2, text: "Build watch-selector", completed: false },
            { id: 3, text: "Write tests", completed: false },
          ],
          filteredItems: [],
        };

        yield* setState("appState", initialState);

        // Function to update filtered items
        const updateFilteredItems = async function* () {
          const state = yield* getState<AppState>("appState");
          let filtered = state.items;

          // Apply search filter
          if (state.query) {
            filtered = filtered.filter((item) =>
              item.text.toLowerCase().includes(state.query.toLowerCase()),
            );
          }

          // Apply status filter
          if (state.filter === "active") {
            filtered = filtered.filter((item) => !item.completed);
          } else if (state.filter === "completed") {
            filtered = filtered.filter((item) => item.completed);
          }

          yield* updateState("appState", (current: AppState) => ({
            ...current,
            filteredItems: filtered,
          }));

          // Update UI
          const resultsList = yield* query(".results");
          const stats = yield* query(".stats");

          if (resultsList) {
            const html = filtered
              .map(
                (item) =>
                  `<li class="${item.completed ? "completed" : ""}">${item.text}</li>`,
              )
              .join("");
            yield* (resultsList.innerHTML = html);
          }

          if (stats) {
            yield* text(
              stats,
              `Showing ${filtered.length} of ${state.items.length} items`,
            );
          }
        };

        // Handle search input
        const searchInput = yield* query(".search");
        if (searchInput) {
          yield* input(searchInput, async function* (event) {
            const query = (event.target as HTMLInputElement).value;

            yield* updateState("appState", (current: AppState) => ({
              ...current,
              query,
            }));

            yield* updateFilteredItems();
          });
        }

        // Handle filter buttons
        const filterButtons = yield* queryAll(".filters button");
        for (const button of filterButtons) {
          yield* click(button, async function* () {
            const filter = button.getAttribute("data-filter") || "all";

            // Update active button
            const allFilterButtons = yield* queryAll(".filters button");
            for (const btn of allFilterButtons) {
              yield* removeClass(btn, "active");
            }
            yield* addClass(button, "active");

            yield* updateState("appState", (current: AppState) => ({
              ...current,
              filter,
            }));

            yield* updateFilteredItems();
          });
        }

        // Initial render
        yield* updateFilteredItems();

        // Set default active filter
        const allButton = yield* query('[data-filter="all"]');
        if (allButton) {
          yield* addClass(allButton, "active");
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const searchInput = app.querySelector(".search") as HTMLInputElement;
      const activeButton = app.querySelector(
        '[data-filter="active"]',
      ) as HTMLButtonElement;
      const resultsList = app.querySelector(".results") as HTMLElement;
      const stats = app.querySelector(".stats") as HTMLElement;

      // Initial state
      expect(resultsList.children.length).toBe(3);
      expect(stats.textContent).toBe("Showing 3 of 3 items");

      // Test search
      searchInput.value = "TypeScript";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(resultsList.children.length).toBe(1);
      expect(stats.textContent).toBe("Showing 1 of 3 items");

      // Clear search
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Test filter
      activeButton.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(resultsList.children.length).toBe(2); // Two incomplete items
      expect(stats.textContent).toBe("Showing 2 of 3 items");
      expect(activeButton.classList.contains("active")).toBe(true);
    });
  });

  describe("Event and State Lifecycle", () => {
    it("should handle mount and unmount events with state cleanup", async () => {
      const container = document.createElement("div");
      testContainer.appendChild(container);

      let mountedCount = 0;
      let unmountedCount = 0;
      const mountedElements: HTMLElement[] = [];

      await watch(container, function* () {
        yield* setState("componentState", { initialized: true, data: [] });

        yield* onUnmount(function* () {
          mountedCount++;
          const element = yield* self();
          mountedElements.push(element);

          yield* setState("mountTime", Date.now());
          yield* addClass("mounted");
        });

        yield* onUnmount(() => {
          unmountedCount++;
        });

        yield* text("Component mounted");
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mountedCount).toBe(1);
      expect(mountedElements[0]).toBe(container);
      expect(container.classList.contains("mounted")).toBe(true);
      expect(container.textContent).toBe("Component mounted");

      // Remove element to trigger unmount
      container.remove();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(unmountedCount).toBe(1);
    });

    it("should handle state watchers with event integration", async () => {
      const widget = document.createElement("div");
      widget.innerHTML = `
        <input type="range" min="0" max="100" value="50" />
        <div class="value-display">50</div>
        <div class="status">Normal</div>
      `;
      testContainer.appendChild(widget);

      await watch(widget, async function* () {
        // Initialize state
        yield* setState("sliderValue", 50);

        // Watch state changes
        yield* watchState(
          "sliderValue",
          async (newValue: number, oldValue: number) => {
            const valueDisplay = widget.querySelector(".value-display");
            const status = widget.querySelector(".status");

            if (valueDisplay) {
              valueDisplay.textContent = newValue.toString();
            }

            if (status) {
              if (newValue < 25) {
                status.textContent = "Low";
                status.className = "status low";
              } else if (newValue > 75) {
                status.textContent = "High";
                status.className = "status high";
              } else {
                status.textContent = "Normal";
                status.className = "status normal";
              }
            }
          },
        );

        // Handle slider input
        const slider = yield* query("input[type='range']");
        if (slider) {
          yield* input(slider, async function* (event) {
            const value = parseInt((event.target as HTMLInputElement).value);
            yield* setState("sliderValue", value);
          });
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const slider = widget.querySelector(
        "input[type='range']",
      ) as HTMLInputElement;
      const valueDisplay = widget.querySelector(
        ".value-display",
      ) as HTMLElement;
      const status = widget.querySelector(".status") as HTMLElement;

      expect(valueDisplay.textContent).toBe("50");
      expect(status.textContent).toBe("Normal");

      // Test low value
      slider.value = "20";
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(valueDisplay.textContent).toBe("20");
      expect(status.textContent).toBe("Low");
      expect(status.classList.contains("low")).toBe(true);

      // Test high value
      slider.value = "90";
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(valueDisplay.textContent).toBe("90");
      expect(status.textContent).toBe("High");
      expect(status.classList.contains("high")).toBe(true);
    });
  });

  describe("Custom Events Integration", () => {
    it("should handle custom events with state", async () => {
      const eventBus = document.createElement("div");
      const subscriber1 = document.createElement("div");
      const subscriber2 = document.createElement("div");

      subscriber1.className = "subscriber-1";
      subscriber2.className = "subscriber-2";

      testContainer.appendChild(eventBus);
      testContainer.appendChild(subscriber1);
      testContainer.appendChild(subscriber2);

      interface EventData {
        type: string;
        payload: any;
        timestamp: number;
      }

      // Event bus
      await watch(eventBus, async function* () {
        yield* setState("eventHistory", []);

        yield* on("custom-event", async function* (event: CustomEvent) {
          const eventData: EventData = {
            type: event.type,
            payload: event.detail,
            timestamp: Date.now(),
          };

          yield* updateState("eventHistory", (history: EventData[]) => [
            ...history,
            eventData,
          ]);

          // Re-broadcast to subscribers
          yield* emit("event-broadcast", eventData);
        });
      });

      // Subscriber 1
      await watch(subscriber1, async function* () {
        yield* setState("receivedEvents", []);

        yield* on("event-broadcast", async function* (event: CustomEvent) {
          const eventData = event.detail;

          yield* updateState("receivedEvents", (events: EventData[]) => [
            ...events,
            eventData,
          ]);

          yield* text(`Sub1: ${eventData.payload.message || "No message"}`);
          yield* addClass("event-received");
        });
      });

      // Subscriber 2
      await watch(subscriber2, async function* () {
        yield* setState("eventCount", 0);

        yield* on("event-broadcast", async function* (event: CustomEvent) {
          yield* updateState("eventCount", (count: number) => count + 1);

          const newCount = yield* getState<number>("eventCount");
          yield* text(`Sub2: ${newCount} events`);
          yield* addClass("event-counted");
        });
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Emit custom events
      eventBus.dispatchEvent(
        new CustomEvent("custom-event", {
          detail: { message: "Hello World", id: 1 },
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(subscriber1.textContent).toBe("Sub1: Hello World");
      expect(subscriber1.classList.contains("event-received")).toBe(true);
      expect(subscriber2.textContent).toBe("Sub2: 1 events");
      expect(subscriber2.classList.contains("event-counted")).toBe(true);

      // Emit another event
      eventBus.dispatchEvent(
        new CustomEvent("custom-event", {
          detail: { message: "Second Event", id: 2 },
        }),
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(subscriber1.textContent).toBe("Sub1: Second Event");
      expect(subscriber2.textContent).toBe("Sub2: 2 events");
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle real-world application pattern", async () => {
      const app = document.createElement("div");
      app.innerHTML = `
        <div class="todo-app">
          <h1>Todo App</h1>
          <form class="add-form">
            <input type="text" placeholder="Add new todo..." />
            <button type="submit">Add</button>
          </form>
          <div class="filters">
            <button data-filter="all" class="active">All</button>
            <button data-filter="active">Active</button>
            <button data-filter="completed">Completed</button>
          </div>
          <ul class="todo-list"></ul>
          <div class="stats">
            <span class="count">0 items</span>
            <button class="clear-completed">Clear Completed</button>
          </div>
        </div>
      `;
      testContainer.appendChild(app);

      interface Todo {
        id: number;
        text: string;
        completed: boolean;
        createdAt: number;
      }

      interface AppState {
        todos: Todo[];
        filter: "all" | "active" | "completed";
        nextId: number;
      }

      await watch(app, async function* () {
        // Initialize state
        const initialState: AppState = {
          todos: [],
          filter: "all",
          nextId: 1,
        };

        yield* setState("appState", initialState);

        // Render function
        const renderTodos = async function* () {
          const state = yield* getState<AppState>("appState");
          let filteredTodos = state.todos;

          if (state.filter === "active") {
            filteredTodos = state.todos.filter((todo) => !todo.completed);
          } else if (state.filter === "completed") {
            filteredTodos = state.todos.filter((todo) => todo.completed);
          }

          const todoList = yield* query(".todo-list");
          if (todoList) {
            const html = filteredTodos
              .map(
                (todo) => `
                <li data-id="${todo.id}" class="${todo.completed ? "completed" : ""}">
                  <input type="checkbox" ${todo.completed ? "checked" : ""} />
                  <span class="text">${todo.text}</span>
                  <button class="delete">×</button>
                </li>
              `,
              )
              .join("");

            todoList.innerHTML = html;
          }

          // Update stats
          const stats = yield* query(".count");
          if (stats) {
            const activeCount = state.todos.filter(
              (todo) => !todo.completed,
            ).length;
            yield* text(
              stats,
              `${activeCount} item${activeCount !== 1 ? "s" : ""}`,
            );
          }

          // Show/hide clear completed button
          const clearButton = yield* query(".clear-completed");
          if (clearButton) {
            const hasCompleted = state.todos.some((todo) => todo.completed);
            if (hasCompleted) {
              clearButton.style.display = "inline-block";
            } else {
              clearButton.style.display = "none";
            }
          }
        };

        // Add todo form
        const form = yield* query(".add-form");
        if (form) {
          yield* submit(form, async function* (event) {
            event.preventDefault();

            const input = yield* query("input[type='text']");
            const text = input ? (input as HTMLInputElement).value.trim() : "";

            if (text) {
              const state = yield* getState<AppState>("appState");
              const newTodo: Todo = {
                id: state.nextId,
                text,
                completed: false,
                createdAt: Date.now(),
              };

              yield* updateState("appState", (current: AppState) => ({
                ...current,
                todos: [...current.todos, newTodo],
                nextId: current.nextId + 1,
              }));

              if (input) {
                (input as HTMLInputElement).value = "";
              }

              yield* renderTodos();
            }
          });
        }

        // Filter buttons
        const filterButtons = yield* queryAll(".filters button");
        for (const button of filterButtons) {
          yield* click(button, async function* () {
            const filter = button.getAttribute("data-filter") as
              | "all"
              | "active"
              | "completed";

            // Update active button
            const allButtons = yield* queryAll(".filters button");
            for (const btn of allButtons) {
              yield* removeClass(btn, "active");
            }
            yield* addClass(button, "active");

            yield* updateState("appState", (current: AppState) => ({
              ...current,
              filter,
            }));

            yield* renderTodos();
          });
        }

        // Clear completed
        const clearCompleted = yield* query(".clear-completed");
        if (clearCompleted) {
          yield* click(clearCompleted, async function* () {
            yield* updateState("appState", (current: AppState) => ({
              ...current,
              todos: current.todos.filter((todo) => !todo.completed),
            }));

            yield* renderTodos();
          });
        }

        // Delegate events for todo items (checkboxes and delete buttons)
        const todoList = yield* query(".todo-list");
        if (todoList) {
          yield* on("change", todoList, async function* (event) {
            if ((event.target as HTMLElement).type === "checkbox") {
              const li = (event.target as HTMLElement).closest("li");
              const todoId = li
                ? parseInt(li.getAttribute("data-id") || "0")
                : 0;

              yield* updateState("appState", (current: AppState) => ({
                ...current,
                todos: current.todos.map((todo) =>
                  todo.id === todoId
                    ? { ...todo, completed: !todo.completed }
                    : todo,
                ),
              }));

              yield* renderTodos();
            }
          });

          yield* on("click", todoList, async function* (event) {
            if ((event.target as HTMLElement).classList.contains("delete")) {
              const li = (event.target as HTMLElement).closest("li");
              const todoId = li
                ? parseInt(li.getAttribute("data-id") || "0")
                : 0;

              yield* updateState("appState", (current: AppState) => ({
                ...current,
                todos: current.todos.filter((todo) => todo.id !== todoId),
              }));

              yield* renderTodos();
            }
          });
        }

        // Initial render
        yield* renderTodos();
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Test the app
      const input = app.querySelector(".add-form input") as HTMLInputElement;
      const addButton = app.querySelector(
        ".add-form button",
      ) as HTMLButtonElement;
      const todoList = app.querySelector(".todo-list") as HTMLElement;
      const count = app.querySelector(".count") as HTMLElement;

      expect(count.textContent).toBe("0 items");
      expect(todoList.children.length).toBe(0);

      // Add first todo
      input.value = "Learn watch-selector";
      addButton.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(todoList.children.length).toBe(1);
      expect(count.textContent).toBe("1 item");
      expect(input.value).toBe("");

      // Add second todo
      input.value = "Write tests";
      addButton.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(todoList.children.length).toBe(2);
      expect(count.textContent).toBe("2 items");

      // Complete first todo
      const firstCheckbox = todoList.querySelector(
        "input[type='checkbox']",
      ) as HTMLInputElement;
      firstCheckbox.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(count.textContent).toBe("1 item"); // Only active items counted
      expect(firstCheckbox.checked).toBe(true);

      // Test filter
      const activeFilter = app.querySelector(
        '[data-filter="active"]',
      ) as HTMLButtonElement;
      activeFilter.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(todoList.children.length).toBe(1); // Only active todos shown
      expect(activeFilter.classList.contains("active")).toBe(true);
    });
  });
});
