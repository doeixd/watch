// Test file for parent-child component composition
import { watch, createChildWatcher, getParentContext, click, text, self } from '../src/index.ts';

// Child component generator that returns an API
function* counterButtonLogic() {
  let count = 0;
  
  // Set initial text
  yield text(`Count: ${count}`);
  
  // Handle click events
  yield click(() => {
    count++;
    yield text(`Count: ${count}`);
  });
  
  // Return public API
  return {
    getCount: () => count,
    reset: () => {
      count = 0;
      yield text(`Count: ${count}`);
      console.log(`Button ${self().id} was reset.`);
    },
    increment: () => {
      count++;
      yield text(`Count: ${count}`);
    }
  };
}

// Parent component that manages child buttons
function* parentContainer() {
  console.log('Parent container initialized');
  
  // Create child watcher - this will track all button.counter-btn elements
  const childApis = createChildWatcher('button.counter-btn', counterButtonLogic);
  
  // Add a reset all button functionality
  yield click('.reset-all-btn', () => {
    console.log('Resetting all child buttons...');
    for (const childApi of childApis.values()) {
      childApi.reset();
    }
  });
  
  // Add a sum button functionality  
  yield click('.sum-btn', () => {
    const total = Array.from(childApis.values()).reduce((sum, api) => sum + api.getCount(), 0);
    console.log(`Total count across all buttons: ${total}`);
  });
  
  // Return parent API
  return {
    getChildrenCount: () => childApis.size,
    getTotalCount: () => {
      return Array.from(childApis.values()).reduce((sum, api) => sum + api.getCount(), 0);
    }
  };
}

// Child component that accesses parent context
function* childWithParentAccess() {
  const parent = getParentContext<HTMLDivElement, { getChildrenCount: () => number }>();
  
  if (parent) {
    console.log(`Child found parent with ${parent.api.getChildrenCount()} children`);
  }
  
  yield click(() => {
    if (parent) {
      console.log(`Parent now has total count: ${parent.api.getTotalCount()}`);
    }
  });
}

// Example usage setup
export function setupParentChildTest() {
  // Create test HTML structure
  const container = document.createElement('div');
  container.className = 'parent-container';
  container.innerHTML = `
    <h2>Parent-Child Component Test</h2>
    <button class="counter-btn" id="btn1">Counter 1</button>
    <button class="counter-btn" id="btn2">Counter 2</button>
    <button class="counter-btn" id="btn3">Counter 3</button>
    <button class="reset-all-btn">Reset All</button>
    <button class="sum-btn">Show Total</button>
    <button class="child-with-parent">Child with Parent Access</button>
  `;
  
  document.body.appendChild(container);
  
  // Set up watchers
  watch('.parent-container', parentContainer);
  watch('.child-with-parent', childWithParentAccess);
  
  console.log('Parent-child test setup complete');
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', setupParentChildTest);
}
