// Simple debug test to understand click function behavior
import { watch, click, getCurrentContext } from './src/index.js';

console.log('=== Debug Test: Click Function Behavior ===');

// Test 1: What does click return outside of generator context?
console.log('\n1. Testing click outside generator context:');
try {
  const result = click(() => console.log('handler'));
  console.log('click() returned:', typeof result, result);
  console.log('Is iterable?', result && typeof result[Symbol.iterator] === 'function');
  console.log('Is generator?', result && typeof result.next === 'function');
} catch (error) {
  console.log('Error calling click():', error.message);
}

// Test 2: What does getCurrentContext return outside generator?
console.log('\n2. Testing getCurrentContext outside generator:');
try {
  const context = getCurrentContext();
  console.log('getCurrentContext() returned:', context);
} catch (error) {
  console.log('Error calling getCurrentContext():', error.message);
}

// Test 3: What does click return inside generator context?
console.log('\n3. Testing click inside generator context:');
const button = document.createElement('button');
document.body.appendChild(button);

watch(button, function* () {
  console.log('Inside generator function');

  // Check context
  const context = getCurrentContext();
  console.log('Context inside generator:', !!context);

  // Test click function
  try {
    const result = click(() => console.log('handler'));
    console.log('click() returned inside generator:', typeof result, result);
    console.log('Is iterable?', result && typeof result[Symbol.iterator] === 'function');
    console.log('Is generator?', result && typeof result.next === 'function');

    // Try to iterate if it's iterable
    if (result && typeof result[Symbol.iterator] === 'function') {
      console.log('Attempting to iterate...');
      const iterator = result[Symbol.iterator]();
      const firstNext = iterator.next();
      console.log('First next():', firstNext);
    }

    // Try yield* to see what happens
    console.log('Attempting yield*...');
    yield* result;
    console.log('yield* succeeded!');

  } catch (error) {
    console.log('Error with click in generator:', error.message);
    console.log('Error stack:', error.stack);
  }
});

console.log('\n=== Debug Test Complete ===');
