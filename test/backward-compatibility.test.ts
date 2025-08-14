import { describe, it, expect, beforeEach } from 'vitest';
import { 
  watch, 
  text, 
  addClass, 
  click,
  self,
  el,
  all,
  ctx,
  cleanup,
  getState,
  setState
} from '../src/index';

describe('Backward Compatibility - Regular API', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="test-container">
        <button class="test-button">Test Button</button>
        <input class="test-input" type="text" />
        <div class="child-item">Child 1</div>
        <div class="child-item">Child 2</div>
      </div>
    `;
  });

  it('should support DOM functions without yield*', async () => {
    watch('.test-button', function* () {
      // Test direct DOM function usage (no yield*)
      const element = self();
      expect(element).toBeInstanceOf(HTMLButtonElement);
      
      const input = el<HTMLInputElement>('.test-input');
      expect(input).toBeInstanceOf(HTMLInputElement);
      
      const children = all<HTMLDivElement>('.child-item');
      expect(children).toHaveLength(2);
      
      const context = ctx();
      expect(context.element).toBe(element);
      expect(context.selector).toBe('.test-button');
    });

    await new Promise(resolve => setTimeout(resolve, 10));
  });

  it('should support state functions without yield*', async () => {
    watch('.test-button', function* () {
      // Test direct state function usage (no yield*)
      setState('counter', 0);
      setState('data', { name: 'test' });
      
      const counter = getState<number>('counter');
      expect(counter).toBe(0);
      
      const data = getState<{name: string}>('data');
      expect(data.name).toBe('test');
    });

    await new Promise(resolve => setTimeout(resolve, 10));
  });

  it('should support DOM manipulation without yield*', async () => {
    let executed = false;
    
    watch('.test-button', function* () {
      // These should work with auto-detection  
      yield text('New Text');
      yield addClass('test-class');
      
      yield click(() => {
        executed = true;
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    
    const button = document.querySelector('.test-button') as HTMLButtonElement;
    expect(button.textContent).toBe('New Text');
    expect(button.classList.contains('test-class')).toBe(true);
    
    button.click();
    expect(executed).toBe(true);
  });
});
