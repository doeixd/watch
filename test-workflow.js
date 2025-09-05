// Test what the generator module functions actually return
import { text } from './src/generator/dom.js';

async function test() {
  console.log('\n=== Testing generator module text function ===\n');

  // Call the text function
  const workflow = text('Hello World');
  console.log('workflow type:', typeof workflow);
  console.log('workflow constructor:', workflow.constructor.name);
  console.log('has Symbol.asyncIterator:', Symbol.asyncIterator in workflow);
  console.log('has next method:', 'next' in workflow);
  console.log('workflow:', workflow);

  // Try to iterate
  console.log('\n=== Trying to iterate ===\n');
  try {
    const result1 = await workflow.next();
    console.log('First iteration result:', result1);
    console.log('Value type:', typeof result1.value);
    console.log('Value:', result1.value);

    // Check if value is a function
    if (typeof result1.value === 'function') {
      console.log('Value is a function');
      console.log('Function string:', result1.value.toString().substring(0, 100) + '...');

      // Try to call it with a mock context
      const mockContext = {
        element: { textContent: '' },
        selector: 'test',
        index: 0,
        array: []
      };

      try {
        const fnResult = result1.value(mockContext);
        console.log('Function result:', fnResult);
        console.log('Element textContent after:', mockContext.element.textContent);
      } catch (e) {
        console.log('Error calling function:', e.message);
      }
    }

    // Continue iteration
    const result2 = await workflow.next();
    console.log('\nSecond iteration result:', result2);

  } catch (e) {
    console.log('Error iterating:', e);
  }

  // Test yield* pattern
  console.log('\n=== Testing yield* pattern ===\n');

  async function* testGenerator() {
    console.log('Before yield*');
    const result = yield* text('Test Content');
    console.log('After yield*, result:', result);
    return 'generator done';
  }

  try {
    const gen = testGenerator();
    let step = await gen.next();
    console.log('Step 1:', step);

    while (!step.done) {
      console.log('Yielded value type:', typeof step.value);
      if (typeof step.value === 'function') {
        const mockContext = {
          element: { textContent: '' },
          selector: 'test',
          index: 0,
          array: []
        };
        const fnResult = step.value(mockContext);
        console.log('Called function, result:', fnResult);
        console.log('Element content:', mockContext.element.textContent);
        step = await gen.next(fnResult);
      } else {
        step = await gen.next();
      }
      console.log('Next step:', step);
    }
  } catch (e) {
    console.log('Error in yield* test:', e);
  }
}

test().catch(console.error);
