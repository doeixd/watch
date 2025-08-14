// Test the text function from generator/dom.ts
const { text } = require('./dist/generator/dom.js');

console.log('=== Testing text function ===');

// Create the workflow
const workflow = text('Hello');
console.log('Workflow type:', typeof workflow);
console.log('Workflow:', workflow);
console.log('Has Symbol.iterator?', Symbol.iterator in workflow);
console.log('Has Symbol.asyncIterator?', Symbol.asyncIterator in workflow);

// Try to iterate
if (Symbol.iterator in workflow) {
  console.log('\nUsing Symbol.iterator:');
  const iterator = workflow[Symbol.iterator]();
  console.log('Iterator:', iterator);

  const step1 = iterator.next();
  console.log('Step 1:', {
    value: typeof step1.value,
    done: step1.done
  });

  // Create mock context
  const mockContext = {
    element: { textContent: '' },
    state: new Map(),
    selector: 'test',
    index: 0,
    array: []
  };

  if (typeof step1.value === 'function') {
    console.log('Calling function with mock context...');
    const result = step1.value(mockContext);
    console.log('Function result:', result);
    console.log('Element textContent after:', mockContext.element.textContent);
  }

  const step2 = iterator.next();
  console.log('Step 2:', step2);

  console.log('\nFinal element textContent:', mockContext.element.textContent);
  console.log('Expected: Hello');
  console.log('Match:', mockContext.element.textContent === 'Hello');
} else if (Symbol.asyncIterator in workflow) {
  console.log('\nWorkflow is async (unexpected for sync generator)');
} else {
  console.log('\nWorkflow is not iterable!');
  console.log('Workflow properties:', Object.keys(workflow));
  console.log('Workflow prototype:', Object.getPrototypeOf(workflow));
}
