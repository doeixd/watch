/**
 * Comprehensive Example: New Direct yield* Pattern
 *
 * This example showcases the new direct yield* pattern for the watch-selector library.
 * The new pattern eliminates wrapper functions and provides a cleaner, more intuitive API
 * with perfect type safety.
 */

import { watch } from "../src/index";
import {
  // DOM Operations
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  text,
  getText,
  html,
  attr,
  getAttr,
  removeAttr,
  style,
  getStyle,
  show,
  hide,
  focus,
  blur,
  self,
  query,
  queryAll,
  parent,
  children,

  // State Operations
  getState,
  setState,
  updateState,
  hasState,
  incrementState,
  decrementState,
  toggleState,
  appendToState,
  mergeState,

  // Event Operations
  click,
  input,
  change,
  submit,
  onFocus,
  onBlur,
  keydown,
  mouseenter,
  mouseleave,
  on,
  onMount,
  onUnmount,
  onVisible,

  // Utilities
  delay,
  log,
} from "../src/generator/index";

// =============================================================================
// Example 1: Interactive Counter Component
// =============================================================================

watch(".counter", async function* () {
  // Initialize component
  yield* log("Counter component initializing");

  // Set up initial state
  yield* setState("count", 0);
  yield* setState("clicks", 0);
  yield* addClass("counter-ready");

  // Update display
  const initialCount = yield* getState<number>("count", 0);
  yield* text(`Count: ${initialCount}`);

  // Handle click events
  yield* click(async function* (event) {
    // Increment counters
    const newCount = yield* incrementState("count", 1);
    const totalClicks = yield* incrementState("clicks", 1);

    // Update display with animation
    yield* addClass("updating");
    yield* text(`Count: ${newCount}`);
    yield* attr("data-clicks", totalClicks.toString());

    // Visual feedback
    yield* delay(150);
    yield* removeClass("updating");

    // Milestone celebrations
    if (newCount % 10 === 0) {
      yield* addClass("milestone");
      yield* delay(500);
      yield* removeClass("milestone");
    }
  });

  // Handle reset on double-click
  yield* on("dblclick", async function* (event) {
    yield* setState("count", 0);
    yield* setState("clicks", 0);
    yield* text("Count: 0");
    yield* addClass("reset");
    yield* delay(300);
    yield* removeClass("reset");
  });
});

// =============================================================================
// Example 2: Form Validation Component
// =============================================================================

watch(".smart-form", async function* () {
  // Initialize form state
  yield* setState("isValid", false);
  yield* setState("errors", []);
  yield* addClass("form-initialized");

  // Handle input validation
  yield* input(async function* (event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const fieldName = target.name;

    // Validate field
    const errors = yield* getState<string[]>("errors", []);
    const updatedErrors = errors.filter(
      (error) => !error.startsWith(fieldName),
    );

    // Field-specific validation
    if (fieldName === "email" && value && !value.includes("@")) {
      updatedErrors.push(`${fieldName}: Invalid email format`);
    }

    if (fieldName === "password" && value && value.length < 6) {
      updatedErrors.push(`${fieldName}: Password too short`);
    }

    // Update state
    yield* setState("errors", updatedErrors);
    yield* setState("isValid", updatedErrors.length === 0);

    // Update UI
    const isValid = updatedErrors.length === 0;
    yield* toggleClass("form-valid", isValid);
    yield* toggleClass("form-invalid", !isValid);

    // Show/hide error messages
    const errorContainer = yield* query(".error-messages");
    if (errorContainer) {
      if (updatedErrors.length > 0) {
        yield* html(
          updatedErrors
            .map((error) => `<div class="error">${error}</div>`)
            .join(""),
        );
      } else {
        yield* html("");
      }
    }
  });

  // Handle form submission
  yield* submit(async function* (event) {
    event.preventDefault();

    const isValid = yield* getState<boolean>("isValid", false);

    if (!isValid) {
      yield* addClass("shake");
      yield* delay(300);
      yield* removeClass("shake");
      return;
    }

    // Show loading state
    yield* addClass("submitting");
    yield* attr("aria-busy", "true");

    // Simulate API call
    yield* delay(2000);

    // Show success
    yield* removeClass("submitting");
    yield* addClass("submitted");
    yield* attr("aria-busy", "false");
    yield* text("Form submitted successfully!");
  });
});

// =============================================================================
// Example 3: Dynamic List Component
// =============================================================================

watch(".todo-list", async function* () {
  // Initialize list state
  yield* setState("todos", [
    { id: 1, text: "Learn watch-selector", completed: false },
    { id: 2, text: "Build amazing apps", completed: false },
  ]);

  yield* setState("nextId", 3);

  // Render initial todos
  yield* renderTodos();

  // Handle add new todo
  const addButton = yield* query(".add-todo");
  if (addButton) {
    yield* click(async function* (event) {
      const input = yield* query<HTMLInputElement>(".new-todo-input");
      if (!input) return;

      const text = input.value.trim();
      if (!text) return;

      // Add new todo
      const todos = yield* getState<any[]>("todos", []);
      const nextId = yield* getState<number>("nextId", 1);

      const newTodo = { id: nextId, text, completed: false };
      const updatedTodos = [...todos, newTodo];

      yield* setState("todos", updatedTodos);
      yield* incrementState("nextId", 1);

      // Clear input
      input.value = "";

      // Re-render
      yield* renderTodos();

      // Focus back to input
      yield* focus();
    });
  }

  // Handle todo item interactions (delegated)
  yield* on("click", async function* (event) {
    const target = event.target as HTMLElement;

    if (target.classList.contains("todo-toggle")) {
      const todoId = parseInt(target.getAttribute("data-id") || "0");
      yield* toggleTodo(todoId);
    }

    if (target.classList.contains("todo-delete")) {
      const todoId = parseInt(target.getAttribute("data-id") || "0");
      yield* deleteTodo(todoId);
    }
  });

  // Helper function to render todos
  async function* renderTodos() {
    const todos = yield* getState<any[]>("todos", []);
    const listContainer = yield* query(".todo-items");

    if (listContainer) {
      const todoHtml = todos
        .map(
          (todo) => `
        <div class="todo-item ${todo.completed ? "completed" : ""}">
          <button class="todo-toggle" data-id="${todo.id}">
            ${todo.completed ? "✓" : "○"}
          </button>
          <span class="todo-text">${todo.text}</span>
          <button class="todo-delete" data-id="${todo.id}">×</button>
        </div>
      `,
        )
        .join("");

      yield* html(todoHtml);
    }

    // Update counter
    const completedCount = todos.filter((todo) => todo.completed).length;
    const totalCount = todos.length;

    const counter = yield* query(".todo-counter");
    if (counter) {
      yield* text(`${completedCount} of ${totalCount} completed`);
    }
  }

  // Helper function to toggle todo
  async function* toggleTodo(id: number) {
    const todos = yield* getState<any[]>("todos", []);
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    );

    yield* setState("todos", updatedTodos);
    yield* renderTodos();
  }

  // Helper function to delete todo
  async function* deleteTodo(id: number) {
    const todos = yield* getState<any[]>("todos", []);
    const updatedTodos = todos.filter((todo) => todo.id !== id);

    yield* setState("todos", updatedTodos);
    yield* renderTodos();
  }
});

// =============================================================================
// Example 4: Image Gallery with Lazy Loading
// =============================================================================

watch(".image-gallery", async function* () {
  // Initialize gallery state
  yield* setState("currentIndex", 0);
  yield* setState("isLoading", false);
  yield* addClass("gallery-ready");

  // Handle thumbnail clicks
  yield* on("click", async function* (event) {
    const target = event.target as HTMLElement;

    if (target.classList.contains("thumbnail")) {
      const index = parseInt(target.getAttribute("data-index") || "0");
      yield* showImage(index);
    }
  });

  // Handle keyboard navigation
  yield* keydown(async function* (event) {
    const currentIndex = yield* getState<number>("currentIndex", 0);
    const thumbnails = yield* queryAll(".thumbnail");
    const maxIndex = thumbnails.length - 1;

    if (event.key === "ArrowLeft" && currentIndex > 0) {
      yield* showImage(currentIndex - 1);
    } else if (event.key === "ArrowRight" && currentIndex < maxIndex) {
      yield* showImage(currentIndex + 1);
    } else if (event.key === "Escape") {
      yield* closeGallery();
    }
  });

  // Handle intersection observer for lazy loading
  yield* onVisible((isVisible) => {
    if (isVisible) {
      console.log("Gallery became visible, starting lazy load");
      // Note: Can't use yield* in non-generator callback
      // Would need to restructure to use generator pattern
    }
  });

  // Helper function to show image
  async function* showImage(index: number) {
    const isLoading = yield* getState<boolean>("isLoading", false);
    if (isLoading) return;

    yield* setState("isLoading", true);
    yield* setState("currentIndex", index);

    // Update active thumbnail
    const thumbnails = yield* queryAll(".thumbnail");
    thumbnails.forEach((thumb, i) => {
      if (i === index) {
        thumb.classList.add("active");
      } else {
        thumb.classList.remove("active");
      }
    });

    // Show loading state
    yield* addClass("loading");

    // Get image URL
    const activeThumb = thumbnails[index];
    const imageUrl = activeThumb?.getAttribute("data-full-image");

    if (imageUrl) {
      // Use generator-friendly pattern for image loading
      const element = yield* self();

      // Create promise for image loading
      const imageLoaded = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const mainImageEl =
            element.querySelector<HTMLImageElement>(".main-image");
          if (mainImageEl) {
            mainImageEl.src = imageUrl;
          }
          resolve();
        };
        img.src = imageUrl;
      });

      // Wait for image to load
      await imageLoaded;

      yield* removeClass("loading");
      yield* setState("isLoading", false);
    }
  }

  // Helper function for lazy loading
  async function* initializeLazyLoading() {
    const thumbnails = yield* queryAll<HTMLImageElement>(
      ".thumbnail[data-src]",
    );

    for (const thumb of thumbnails) {
      const src = thumb.getAttribute("data-src");
      if (src) {
        // Create intersection observer for each thumbnail
        yield* onVisible(async (isVisible) => {
          if (isVisible && !thumb.src) {
            thumb.src = src;
            thumb.classList.add("loaded");
          }
        });
      }
    }
  }

  // Helper function to close gallery
  async function* closeGallery() {
    yield* removeClass("active");
    yield* setState("currentIndex", 0);

    // Remove active state from all thumbnails
    const thumbnails = yield* queryAll(".thumbnail");
    thumbnails.forEach((thumb) => thumb.classList.remove("active"));
  }
});

// =============================================================================
// Example 5: Real-time Data Dashboard
// =============================================================================

watch(".dashboard", async function* () {
  // Initialize dashboard
  yield* setState("isConnected", false);
  yield* setState("lastUpdate", Date.now());
  yield* setState("metrics", {
    users: 0,
    revenue: 0,
    orders: 0,
    conversion: 0,
  });

  // Setup connection indicator
  yield* addClass("dashboard-initializing");

  // Mount handler to start real-time updates
  yield* onMount(async function* () {
    yield* log("Dashboard mounted, starting real-time updates");
    yield* startRealTimeUpdates();
  });

  // Unmount handler to cleanup
  yield* onUnmount(async function* () {
    yield* log("Dashboard unmounting, cleaning up");
    yield* stopRealTimeUpdates();
  });

  // Handle manual refresh
  yield* click(async function* (event) {
    const target = event.target as HTMLElement;

    if (target.classList.contains("refresh-btn")) {
      yield* refreshData();
    }
  });

  // Helper function to start real-time updates using generator pattern
  async function* startRealTimeUpdates() {
    yield* setState("isConnected", true);
    yield* removeClass("dashboard-initializing");
    yield* addClass("dashboard-connected");

    // Start the update loop using generator pattern
    yield* backgroundUpdateLoop();
  }

  // Background update loop using generator pattern
  async function* backgroundUpdateLoop() {
    while (true) {
      // Wait 3 seconds
      yield* delay(3000);

      // Check if still connected
      const isConnected = yield* getState<boolean>("isConnected", false);
      if (!isConnected) break;

      // Get current metrics and update them
      const currentMetrics = yield* getState<any>("metrics", {});
      const updatedMetrics = {
        users: currentMetrics.users + Math.floor(Math.random() * 10),
        revenue: currentMetrics.revenue + Math.floor(Math.random() * 1000),
        orders: currentMetrics.orders + Math.floor(Math.random() * 5),
        conversion: Math.random() * 100,
      };

      yield* setState("metrics", updatedMetrics);
      yield* setState("lastUpdate", Date.now());
      yield* updateDashboard();
    }
  }

  // Helper function to stop updates
  async function* stopRealTimeUpdates() {
    yield* setState("isConnected", false);
    yield* removeClass("dashboard-connected");
    yield* addClass("dashboard-disconnected");
  }

  // Helper function to refresh data
  async function* refreshData() {
    yield* addClass("refreshing");

    // Simulate API call
    yield* delay(1000);

    // Update with fresh data
    const freshMetrics = {
      users: Math.floor(Math.random() * 1000),
      revenue: Math.floor(Math.random() * 50000),
      orders: Math.floor(Math.random() * 200),
      conversion: Math.random() * 100,
    };

    yield* setState("metrics", freshMetrics);
    yield* setState("lastUpdate", Date.now());
    yield* updateDashboard();

    yield* removeClass("refreshing");
  }

  // Helper function to update dashboard display
  async function* updateDashboard() {
    const metrics = yield* getState<any>("metrics", {});
    const lastUpdate = yield* getState<number>("lastUpdate", Date.now());

    // Update metric displays
    const userCount = yield* query(".metric-users .value");
    if (userCount) {
      yield* text(metrics.users.toLocaleString());
    }

    const revenueDisplay = yield* query(".metric-revenue .value");
    if (revenueDisplay) {
      yield* text(`$${metrics.revenue.toLocaleString()}`);
    }

    const ordersDisplay = yield* query(".metric-orders .value");
    if (ordersDisplay) {
      yield* text(metrics.orders.toLocaleString());
    }

    const conversionDisplay = yield* query(".metric-conversion .value");
    if (conversionDisplay) {
      yield* text(`${metrics.conversion.toFixed(1)}%`);
    }

    // Update last update timestamp
    const timestampDisplay = yield* query(".last-update");
    if (timestampDisplay) {
      const timeStr = new Date(lastUpdate).toLocaleTimeString();
      yield* text(`Last updated: ${timeStr}`);
    }

    // Add pulse animation
    yield* addClass("updated");
    yield* delay(300);
    yield* removeClass("updated");
  }
});

// =============================================================================
// Example 6: Advanced Component Composition
// =============================================================================

// Reusable tooltip behavior
async function* tooltipBehavior(message: string) {
  yield* attr("title", ""); // Remove default tooltip
  yield* attr("data-tooltip", message);

  yield* mouseenter(async function* (event) {
    // Create tooltip element
    const tooltip = document.createElement("div");
    tooltip.className = "custom-tooltip";
    tooltip.textContent = message;
    document.body.appendChild(tooltip);

    // Position tooltip
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 10}px`;

    // Store reference for cleanup
    yield* setState("tooltip", tooltip);

    // Animate in
    yield* delay(10);
    tooltip.classList.add("visible");
  });

  yield* mouseleave(async function* (event) {
    const tooltip = yield* getState<HTMLElement>("tooltip");
    if (tooltip) {
      tooltip.classList.remove("visible");
      yield* delay(200);
      tooltip.remove();
      yield* setState("tooltip", null);
    }
  });
}

// Reusable loading behavior
async function* loadingBehavior() {
  yield* click(async function* (event) {
    const button = event.target as HTMLButtonElement;
    const originalText = button.textContent;

    // Show loading state
    yield* addClass("loading");
    yield* attr("disabled", "true");
    yield* text("Loading...");

    // Simulate async operation
    yield* delay(2000);

    // Restore original state
    yield* removeClass("loading");
    yield* removeAttr("disabled");
    yield* text(originalText || "Click me");
  });
}

// Compose behaviors
watch(".tooltip-button", async function* () {
  yield* tooltipBehavior("This is a helpful tooltip!");
  yield* loadingBehavior();
});

watch(".action-button", async function* () {
  yield* tooltipBehavior("Click to perform action");
  yield* loadingBehavior();

  // Add custom behavior
  yield* addClass("action-ready");
  yield* attr("data-action", "custom-action");
});

// =============================================================================
// Export for documentation
// =============================================================================

export {
  // Re-export everything to show the new pattern in action
  watch,
  addClass,
  removeClass,
  toggleClass,
  text,
  html,
  attr,
  style,
  getState,
  setState,
  updateState,
  click,
  input,
  change,
  submit,
  delay,
  log,
};
