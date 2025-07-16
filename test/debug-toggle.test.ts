import { describe, it, expect } from 'vitest';
import { runOn } from '../src/watch';
import { toggleClass } from '../src/api/dom';

describe('Debug toggleClass', () => {
  it('should debug toggleClass behavior', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    console.log('Initial state:', div.className);

    // Test direct mode
    console.log('=== Direct Mode ===');
    const result1 = toggleClass(div, 'test-class');
    console.log('toggleClass result 1:', result1);
    console.log('After first toggle:', div.className);

    const result2 = toggleClass(div, 'test-class');
    console.log('toggleClass result 2:', result2);
    console.log('After second toggle:', div.className);

    const result3 = toggleClass(div, 'force-class', true);
    console.log('toggleClass force true:', result3);
    console.log('After force true:', div.className);

    const result4 = toggleClass(div, 'force-class', false);
    console.log('toggleClass force false:', result4);
    console.log('After force false:', div.className);

    // Test generator mode
    console.log('\n=== Generator Mode ===');
    div.className = ''; // Reset

    await runOn(div, function* () {
      console.log('Generator - Initial state:', div.className);
      
      const genResult1 = yield toggleClass('gen-class');
      console.log('Generator - toggleClass result 1:', genResult1);
      console.log('Generator - After first toggle:', div.className);
      
      const genResult2 = yield toggleClass('gen-class');
      console.log('Generator - toggleClass result 2:', genResult2);
      console.log('Generator - After second toggle:', div.className);
      
      const genResult3 = yield toggleClass('force-class', true);
      console.log('Generator - toggleClass force true:', genResult3);
      console.log('Generator - After force true:', div.className);
    });

    console.log('Final state:', div.className);
  });
});