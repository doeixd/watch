import { describe, it, expect } from 'vitest';
import { runOn } from '../src/watch';
import { toggleClass } from '../src/api/dom';

describe('Debug toggleClass deeper', () => {
  it('should debug classList.toggle behavior', async () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    console.log('=== Direct classList.toggle ===');
    const directResult1 = div.classList.toggle('test-class');
    console.log('Direct toggle result 1:', directResult1, 'typeof:', typeof directResult1);
    console.log('Class list:', div.className);

    const directResult2 = div.classList.toggle('test-class');
    console.log('Direct toggle result 2:', directResult2, 'typeof:', typeof directResult2);
    console.log('Class list:', div.className);

    const directResult3 = div.classList.toggle('force-class', true);
    console.log('Direct toggle with force=true:', directResult3, 'typeof:', typeof directResult3);
    console.log('Class list:', div.className);

    const directResult4 = div.classList.toggle('force-class', false);
    console.log('Direct toggle with force=false:', directResult4, 'typeof:', typeof directResult4);
    console.log('Class list:', div.className);

    // Test the internal implementation function directly
    console.log('\n=== Internal _impl_toggleClass ===');
    div.className = '';
    
    // Mock what the internal function does
    function _impl_toggleClass(element: HTMLElement, className: string, force?: boolean): boolean {
      return element.classList.toggle(className, force);
    }
    
    const implResult1 = _impl_toggleClass(div, 'impl-test');
    console.log('_impl_toggleClass result 1:', implResult1, 'typeof:', typeof implResult1);
    console.log('Class list:', div.className);

    const implResult2 = _impl_toggleClass(div, 'impl-force', true);
    console.log('_impl_toggleClass with force=true:', implResult2, 'typeof:', typeof implResult2);
    console.log('Class list:', div.className);

    // Test the generator mode function directly
    console.log('\n=== Generator Mode Function ===');
    div.className = '';
    
    try {
      const generatorFn = toggleClass('gen-test', true);
      console.log('Generator function type:', typeof generatorFn);
      
      if (typeof generatorFn === 'function') {
        const generatorResult = generatorFn(div);
        console.log('Generator function result:', generatorResult, 'typeof:', typeof generatorResult);
        console.log('Class list:', div.className);
      } else {
        console.log('Got unexpected result instead of function:', generatorFn);
      }
    } catch (e) {
      console.log('Expected error when calling toggleClass outside generator context:', e.message);
    }

    // Test in actual generator context
    console.log('\n=== Real Generator Context ===');
    div.className = '';
    
    await runOn(div, function* () {
      console.log('In generator - before toggle');
      const result = yield toggleClass('real-gen-test', true);
      console.log('In generator - toggle result:', result, 'typeof:', typeof result);
      console.log('In generator - class list:', div.className);
    });
  });
});