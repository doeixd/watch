import { describe, it, expect } from 'vitest';
import { runOn } from '../src/watch';
import { addClass } from '../src/api/dom';

describe('Debug addClass for comparison', () => {
  it('should debug addClass behavior', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    console.log('=== Testing addClass directly ===');
    const fn = addClass('test-class');
    console.log('Function:', fn);
    console.log('Function type:', typeof fn);
    
    if (typeof fn === 'function') {
      const result = fn(div);
      console.log('Direct function call result:', result, 'typeof:', typeof result);
      console.log('Class list after direct call:', div.className);
    }

    console.log('\n=== Testing addClass in generator context ===');
    div.className = '';
    
    let capturedResult: any;
    
    await runOn(div, function* () {
      console.log('Before yield - class list:', div.className);
      capturedResult = yield addClass('gen-test');
      console.log('After yield - captured result:', capturedResult, 'typeof:', typeof capturedResult);
      console.log('After yield - class list:', div.className);
    });
    
    console.log('Final class list:', div.className);
    console.log('Final captured result:', capturedResult);
  });
});