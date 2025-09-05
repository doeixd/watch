/**
 * @fileoverview Direct yield* Example - No $ Wrapper Needed
 *
 * This example demonstrates the new generator API where operations can be used
 * directly with yield* without needing the $ wrapper. This provides clean,
 * type-safe code with perfect inference.
 */

import {
  watch,
  // DOM operations that return Workflows
  addClass,
  removeClass,
  text,
  style as setStyle,
  self,

  // State operations that return Workflows
  getState,
  setState,

  // Utility operations
  delay,
} from "../src/index";

// ============================================================================
// EXAMPLE 1: Basic yield* usage without $ wrapper
// ============================================================================

console.log("🎯 Example 1: Direct yield* usage");

// Create test button
document.body.innerHTML += `
  <button id="direct-button">Click me!</button>
  <div id="output"></div>
`;

watch("#direct-button", function* () {
  // Direct yield* usage - no $ wrapper needed!
  yield* addClass("interactive");
  yield* text("Ready to click!");

  // Get the element with perfect typing
  const button = self() as HTMLButtonElement;
  console.log("Button element:", button.tagName); // TypeScript knows this is HTMLButtonElement

  // Style the button
  yield* setStyle({
    background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.2s",
  });

  // Initialize state
  yield* setState("clickCount", 0);

  yield* log("Button initialized with direct yield*");
});

// ============================================================================
// EXAMPLE 2: Counter with state management
// ============================================================================

console.log("🔢 Example 2: Counter with state management");

document.body.innerHTML += `
  <div id="counter-container">
    <h3>Counter with Direct yield*</h3>
    <button id="increment-btn">+</button>
    <span id="count-display">0</span>
    <button id="decrement-btn">-</button>
    <div id="counter-info"></div>
  </div>
`;

watch("#counter-container", async function* () {
  // Initialize counter state
  yield* setState("count", 0);
  yield* setState("totalClicks", 0);

  const updateDisplay = async function* () {
    // Get state values with perfect typing
    const count = yield* getState<number>("count", 0);
    const totalClicks = yield* getState<number>("totalClicks", 0);

    // Update display
    const display = document.getElementById("count-display");
    const info = document.getElementById("counter-info");

    if (display) {
      display.textContent = count.toString();
      display.style.fontSize = `${Math.max(16, 16 + Math.abs(count) * 2)}px`;
      display.style.color = count > 0 ? "green" : count < 0 ? "red" : "black";
    }

    if (info) {
      info.innerHTML = `
        <p>Current: ${count}</p>
        <p>Total clicks: ${totalClicks}</p>
        <p>Status: ${count === 0 ? "neutral" : count > 0 ? "positive" : "negative"}</p>
      `;
    }

    yield* log(`Counter updated: ${count}`);
  };

  // Initial display
  yield* updateDisplay();
});

// Handle increment button
watch("#increment-btn", async function* () {
  yield* text("+");
  yield* setStyle({
    background: "#27ae60",
    color: "white",
    border: "none",
    padding: "8px 16px",
    margin: "0 8px",
    cursor: "pointer",
    borderRadius: "4px",
  });

  // Click handler would go here (events need to be implemented in generator module)
  // For now, we'll simulate with a manual trigger
});

// ============================================================================
// EXAMPLE 3: Form validation with direct yield*
// ============================================================================

console.log("📝 Example 3: Form validation");

document.body.innerHTML += `
  <form id="validation-form">
    <h3>Form with Direct yield* Validation</h3>
    <div>
      <label for="username-input">Username:</label>
      <input type="text" id="username-input" name="username">
      <span id="username-status"></span>
    </div>
    <div>
      <label for="email-input">Email:</label>
      <input type="email" id="email-input" name="email">
      <span id="email-status"></span>
    </div>
    <button type="submit" id="submit-form">Submit</button>
    <div id="form-status"></div>
  </form>
`;

watch("#validation-form", async function* () {
  // Initialize form state
  yield* setState("isValid", false);
  yield* setState("errors", {} as Record<string, string>);

  // Style the form
  yield* setStyle({
    maxWidth: "400px",
    padding: "20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontFamily: "Arial, sans-serif",
  });

  yield* log("Form initialized with direct yield*");

  const validateForm = async function* () {
    const errors = yield* getState<Record<string, string>>("errors", {});
    const isValid = Object.keys(errors).length === 0;

    yield* setState("isValid", isValid);

    // Update submit button state
    const submitBtn = document.getElementById(
      "submit-form",
    ) as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.disabled = !isValid;
      submitBtn.style.opacity = isValid ? "1" : "0.5";
      submitBtn.style.cursor = isValid ? "pointer" : "not-allowed";
    }

    // Update form status
    const status = document.getElementById("form-status");
    if (status) {
      if (isValid && Object.keys(errors).length === 0) {
        status.innerHTML = '<p style="color: green;">✅ Form is valid!</p>';
      } else {
        status.innerHTML =
          '<p style="color: red;">❌ Please fix the errors above.</p>';
      }
    }

    yield* log(`Form validation: ${isValid ? "valid" : "invalid"}`);
  };

  // Initial validation
  yield* validateForm();
});

// ============================================================================
// EXAMPLE 4: Animated sequence with direct yield*
// ============================================================================

console.log("✨ Example 4: Animated sequence");

document.body.innerHTML += `
  <div id="animation-demo">
    <h3>Animation with Direct yield*</h3>
    <div id="animated-box">Click to animate!</div>
  </div>
`;

watch("#animated-box", async function* () {
  // Initial styling
  yield* setStyle({
    width: "100px",
    height: "100px",
    background: "#3498db",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    margin: "20px 0",
  });

  yield* addClass("animated-box");
  yield* setState("isAnimating", false);

  const animate = async function* () {
    const isAnimating = yield* getState<boolean>("isAnimating", false);
    if (isAnimating) return;

    yield* setState("isAnimating", true);
    yield* text("Animating...");

    // Animation sequence with direct yield*
    yield* setStyle({ transform: "scale(1.2)", background: "#e74c3c" });
    yield* delay(300);

    yield* setStyle({
      transform: "rotate(45deg) scale(1.2)",
      background: "#f39c12",
    });
    yield* delay(300);

    yield* setStyle({
      transform: "rotate(90deg) scale(0.8)",
      background: "#27ae60",
    });
    yield* delay(300);

    yield* setStyle({
      transform: "rotate(0deg) scale(1)",
      background: "#3498db",
    });
    yield* text("Click to animate!");

    yield* setState("isAnimating", false);
    yield* log("Animation sequence completed");
  };

  // We'd trigger this animation on click when events are implemented
  // For now, let's run it once after a delay
  setTimeout(async () => {
    // This would normally be triggered by a click event
    // yield* animate();
  }, 2000);
});

// ============================================================================
// EXAMPLE 5: Component composition with direct yield*
// ============================================================================

console.log("🧩 Example 5: Component composition");

document.body.innerHTML += `
  <div id="component-demo">
    <h3>Component Composition with Direct yield*</h3>
    <div id="card-1" class="demo-card">Card 1</div>
    <div id="card-2" class="demo-card">Card 2</div>
    <div id="card-3" class="demo-card">Card 3</div>
  </div>
`;

// Reusable card enhancement workflow
const enhanceCard = async function* (cardIndex: number) {
  // Style the card
  yield* setStyle({
    width: "200px",
    height: "100px",
    background: `hsl(${cardIndex * 60}, 70%, 85%)`,
    border: "2px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    margin: "8px",
    display: "inline-block",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  // Add interactive classes
  yield* addClass("enhanced-card");
  yield* addClass("interactive");

  // Initialize card state
  yield* setState("cardIndex", cardIndex);
  yield* setState("interactionCount", 0);

  // Update text with card info
  const interactionCount = yield* getState<number>("interactionCount", 0);
  yield* text(`Card ${cardIndex} (${interactionCount} interactions)`);

  yield* log(`Card ${cardIndex} enhanced with direct yield*`);
};

// Apply card enhancement to each card
watch("#card-1", async function* () {
  yield* enhanceCard(1);
});

watch("#card-2", async function* () {
  yield* enhanceCard(2);
});

watch("#card-3", async function* () {
  yield* enhanceCard(3);
});

// ============================================================================
// STYLING
// ============================================================================

// Add some basic styling
const style = document.createElement("style");
style.textContent = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
  }

  h3 {
    color: #333;
    border-bottom: 2px solid #667eea;
    padding-bottom: 8px;
  }

  #counter-container, #validation-form, #animation-demo, #component-demo {
    margin: 30px 0;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
  }

  input {
    padding: 8px;
    margin: 4px 8px 4px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin: 4px;
    background: #667eea;
    color: white;
    transition: all 0.2s;
  }

  button:hover {
    background: #5a6fd8;
    transform: translateY(-1px);
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }

  #count-display {
    display: inline-block;
    min-width: 50px;
    text-align: center;
    margin: 0 8px;
    padding: 8px;
    background: white;
    border: 2px solid #667eea;
    border-radius: 4px;
    font-weight: bold;
  }

  .demo-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;
document.head.appendChild(style);

console.log("🎉 Direct yield* examples loaded!");
console.log("💡 Key benefits:");
console.log("   - No $ wrapper needed");
console.log("   - Clean, readable code");
console.log("   - Perfect type inference");
console.log(
  "   - Direct yield* syntax: yield* self(), yield* addClass(), etc.",
);
