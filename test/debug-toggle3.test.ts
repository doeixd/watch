import { describe, it, expect } from 'vitest';
import { runOn } from '../src/watch';
import { toggleClass } from '../src/api/dom';

describe('Debug toggleClass handleYieldedValue', () => {
  it('should debug the yielded value handling', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    console.log('=== Testing yielded function directly ===');
    const fn = toggleClass('test-class', true);
    console.log('Function:', fn);
    console.log('Function type:', typeof fn);
    
    if (typeof fn === 'function') {
      const result = fn(div);
      console.log('Direct function call result:', result, 'typeof:', typeof result);
      console.log('Class list after direct call:', div.className);
    }

    console.log('\n=== Testing in generator context ===');
    div.className = '';
    
    let capturedResult: any;
    
    await runOn(div, function* () {
      console.log('Before yield - class list:', div.className);
      capturedResult = yield toggleClass('gen-test', true);
      console.log('After yield - captured result:', capturedResult, 'typeof:', typeof capturedResult);
      console.log('After yield - class list:', div.className);
    });
    
    console.log('Final class list:', div.className);
    console.log('Final captured result:', capturedResult);
  });
});