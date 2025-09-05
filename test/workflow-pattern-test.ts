/**
 * Simple test to validate the new workflow pattern
 *
 * This test validates that our new Workflow<T> pattern works correctly
 * with direct yield* syntax, independent of the full watch system.
 */

import type { Workflow, WatchContext } from "../src/types";

// Mock DOM setup
const mockElement = {
  textContent: "",
  classList: {
    add: (className: string) => {},
    remove: (className: string) => {},
    contains: (className: string) => false,
    toggle: (className: string) => true,
  },
  setAttribute: (name: string, value: string) => {},
  getAttribute: (name: string) => null,
  style: {},
} as any;

const mockContext: WatchContext = {
  element: mockElement,
  selector: ".test",
  state: new Map(),
} as any;

// Import our workflow functions
import {
  text,
  addClass,
  removeClass,
  hasClass,
  self,
  getState,
  setState,
} from "../src/generator-sync/index";

// Simple workflow executor - simulates what the runtime would do
async function executeWorkflow<T>(
  workflow: Workflow<T>,
  context: WatchContext = mockContext,
): Promise<T> {
  const iterator = workflow;
  let result = await iterator.next();

  while (!result.done) {
    const operation = result.value;

    // Execute the operation with the context
    let operationResult: any;
    if (typeof operation === "function") {
      operationResult = await operation(context);
    }

    // Send the result back to the workflow
    result = await iterator.next(operationResult);
  }

  return result.value;
}

// Test the workflow pattern
async function testWorkflowPattern() {
  console.log("Testing workflow pattern...");

  // Test 1: Simple text operation
  console.log("Test 1: Text operation");
  try {
    await executeWorkflow(text("Hello World"));
    console.log("✓ Text operation completed");
  } catch (error) {
    console.error("✗ Text operation failed:", error);
  }

  // Test 2: Class operations
  console.log("Test 2: Class operations");
  try {
    await executeWorkflow(addClass("test-class"));
    const hasTestClass = await executeWorkflow(hasClass("test-class"));
    console.log("✓ Class operations completed, hasClass result:", hasTestClass);
  } catch (error) {
    console.error("✗ Class operations failed:", error);
  }

  // Test 3: Element access
  console.log("Test 3: Element access");
  try {
    const element = await executeWorkflow(self());
    console.log("✓ Element access completed, element:", !!element);
  } catch (error) {
    console.error("✗ Element access failed:", error);
  }

  // Test 4: State operations
  console.log("Test 4: State operations");
  try {
    await executeWorkflow(setState("count", 42));
    const count = await executeWorkflow(getState<number>("count", 0));
    console.log("✓ State operations completed, count:", count);
  } catch (error) {
    console.error("✗ State operations failed:", error);
  }

  // Test 5: Composed workflow
  console.log("Test 5: Composed workflow");
  try {
    const composedWorkflow: Workflow<string> = (async function* () {
      yield* addClass("composed");
      yield* text("Composed Text");
      const element = yield* self<HTMLElement>();
      yield* setState("composed", true);
      const state = yield* getState<boolean>("composed", false);
      return `Element: ${!!element}, State: ${state}`;
    })();

    const result = await executeWorkflow(composedWorkflow);
    console.log("✓ Composed workflow completed, result:", result);
  } catch (error) {
    console.error("✗ Composed workflow failed:", error);
  }

  console.log("Workflow pattern tests completed!");
}

// Run the tests
testWorkflowPattern().catch(console.error);
