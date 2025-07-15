import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { watch, runOn } from '../src/watch';
import {
  on,
  click,
  change,
  input,
  submit,
  emit,
  createEventBehavior,
  composeEventHandlers,
  delegate,
  createCustomEvent,
  onAttr,
  onText,
  onVisible,
  onResize,
  onMount,
  onUnmount
} from '../src/api/events';
import { text, addClass, removeClass } from '../src/api/dom';
import { setState, getState } from '../src/core/state';
import { self } from '../src/core/generator';

// Test utilities
function createTestElement(tag: string = 'div', attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  document.body.appendChild(element);
  return element;
}

function createTestEvent(type: string, eventInit: EventInit = {}): Event {
  return new Event(type, { bubbles: true, cancelable: true, ...eventInit });
}

function createTestMouseEvent(type: string, eventInit: MouseEventInit = {}): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true, ...eventInit });
}

function createTestKeyboardEvent(type: string, eventInit: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent(type, { bubbles: true, cancelable: true, ...eventInit });
}

function waitForMutation(ms: number = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForEvent(ms: number = 10): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Event System', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Basic Event Handling', () => {
    it('should handle click events', async () => {
      const button = createTestElement('button');
      const handler = vi.fn();
      
      await runOn(button, function* () {
        yield click(handler);
      });

      button.dispatchEvent(createTestMouseEvent('click'));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple event types', async () => {
      const inputElement = createTestElement('input') as HTMLInputElement;
      const changeHandler = vi.fn();
      const inputHandler = vi.fn();
      const focusHandler = vi.fn();
      
      await runOn(inputElement, function* () {
        yield change(changeHandler);
        yield input(inputHandler);
        yield on('focus', focusHandler);
      });

      inputElement.dispatchEvent(createTestEvent('change'));
      inputElement.dispatchEvent(createTestEvent('input'));
      inputElement.dispatchEvent(createTestEvent('focus'));

      expect(changeHandler).toHaveBeenCalledTimes(1);
      expect(inputHandler).toHaveBeenCalledTimes(1);
      expect(focusHandler).toHaveBeenCalledTimes(1);
    });

    it('should pass event and element to handlers', async () => {
      const button = createTestElement('button');
      let receivedEvent: Event | undefined;
      let receivedElement: HTMLElement | undefined;
      
      await runOn(button, function* () {
        yield click((event, element) => {
          receivedEvent = event;
          receivedElement = element;
        });
      });

      const clickEvent = createTestMouseEvent('click');
      button.dispatchEvent(clickEvent);

      expect(receivedEvent).toBe(clickEvent);
      expect(receivedElement).toBe(button);
    });

    it('should handle custom events', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield on('customEvent', handler);
      });

      const customEvent = createCustomEvent('customEvent', { detail: { test: 'data' } });
      element.dispatchEvent(customEvent);

      expect(handler).toHaveBeenCalledWith(customEvent, element);
      expect(handler.mock.calls[0][0].detail).toEqual({ test: 'data' });
    });

    it('should handle submit events on forms', async () => {
      const form = createTestElement('form') as HTMLFormElement;
      const handler = vi.fn();
      
      await runOn(form, function* () {
        yield submit((event) => {
          event.preventDefault(); // Prevent actual form submission
          handler(event);
        });
      });

      const submitEvent = createTestEvent('submit');
      form.dispatchEvent(submitEvent);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Generator Event Handlers', () => {
    it('should support generator functions as event handlers', async () => {
      const button = createTestElement('button');
      let executed = false;
      
      await runOn(button, function* () {
        yield click(function* () {
          executed = true;
          yield addClass('clicked');
          yield text('Clicked!');
        });
      });

      button.dispatchEvent(createTestMouseEvent('click'));
      await waitForEvent();

      expect(executed).toBe(true);
      expect(button.classList.contains('clicked')).toBe(true);
      expect(button.textContent).toBe('Clicked!');
    });

    it('should support async generator functions', async () => {
      const button = createTestElement('button');
      let executed = false;
      
      await runOn(button, function* () {
        yield click(async function* () {
          await new Promise(resolve => setTimeout(resolve, 10));
          executed = true;
          yield addClass('async-clicked');
        });
      });

      button.dispatchEvent(createTestMouseEvent('click'));
      await waitForEvent(50);

      expect(executed).toBe(true);
      expect(button.classList.contains('async-clicked')).toBe(true);
    });

    it('should handle state in generator event handlers', async () => {
      const button = createTestElement('button');
      
      await runOn(button, function* () {
        setState('clickCount', 0);
        
        yield click(function* () {
          const count = getState('clickCount') + 1;
          setState('clickCount', count);
          yield text(`Clicked ${count} times`);
        });
      });

      button.dispatchEvent(createTestMouseEvent('click'));
      await waitForEvent();
      expect(button.textContent).toBe('Clicked 1 times');

      button.dispatchEvent(createTestMouseEvent('click'));
      await waitForEvent();
      expect(button.textContent).toBe('Clicked 2 times');

      button.dispatchEvent(createTestMouseEvent('click'));
      await waitForEvent();
      expect(button.textContent).toBe('Clicked 3 times');
    });
  });

  describe('Event Options and Advanced Features', () => {
    it('should support event listener options', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield on('click', handler, { once: true });
      });

      element.dispatchEvent(createTestMouseEvent('click'));
      element.dispatchEvent(createTestMouseEvent('click'));
      element.dispatchEvent(createTestMouseEvent('click'));

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support capture phase', async () => {
      const parent = createTestElement('div');
      const child = createTestElement('button');
      parent.appendChild(child);
      
      const captureHandler = vi.fn();
      const bubbleHandler = vi.fn();
      
      await runOn(parent, function* () {
        yield on('click', captureHandler, { capture: true });
        yield on('click', bubbleHandler, { capture: false });
      });

      child.dispatchEvent(createTestMouseEvent('click'));

      expect(captureHandler).toHaveBeenCalledTimes(1);
      expect(bubbleHandler).toHaveBeenCalledTimes(1);
    });

    it('should support passive event listeners', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield on('touchstart', handler, { passive: true });
      });

      const touchEvent = new TouchEvent('touchstart', { 
        bubbles: true, 
        cancelable: true,
        touches: []
      });
      element.dispatchEvent(touchEvent);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Delegation', () => {
    it('should support event delegation with delegate option', async () => {
      const container = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(container, function* () {
        yield on('click', handler, { delegate: 'button' });
      });

      // Add buttons after event listener setup
      const btn1 = createTestElement('button');
      const btn2 = createTestElement('button');
      const nonButton = createTestElement('div');
      
      container.appendChild(btn1);
      container.appendChild(btn2);
      container.appendChild(nonButton);

      btn1.dispatchEvent(createTestMouseEvent('click'));
      btn2.dispatchEvent(createTestMouseEvent('click'));
      nonButton.dispatchEvent(createTestMouseEvent('click'));

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should support delegate() helper function', async () => {
      const container = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(container, function* () {
        yield delegate('button', 'click', handler);
      });

      const btn1 = createTestElement('button');
      const btn2 = createTestElement('span');
      
      container.appendChild(btn1);
      container.appendChild(btn2);

      btn1.dispatchEvent(createTestMouseEvent('click'));
      btn2.dispatchEvent(createTestMouseEvent('click'));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][1]).toBe(btn1); // Second param should be the button
    });
  });

  describe('Debouncing and Throttling', () => {
    it('should support debounced event handlers', async () => {
      const input = createTestElement('input') as HTMLInputElement;
      const handler = vi.fn();
      
      await runOn(input, function* () {
        yield on('input', handler, { debounce: 100 });
      });

      // Fire multiple events quickly
      input.dispatchEvent(createTestEvent('input'));
      input.dispatchEvent(createTestEvent('input'));
      input.dispatchEvent(createTestEvent('input'));
      
      // Handler should not be called immediately
      expect(handler).toHaveBeenCalledTimes(0);
      
      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Handler should be called once
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support throttled event handlers', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield on('scroll', handler, { throttle: 100 });
      });

      // Fire multiple events quickly
      for (let i = 0; i < 10; i++) {
        element.dispatchEvent(createTestEvent('scroll'));
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Handler should be called limited number of times
      expect(handler.mock.calls.length).toBeLessThan(10);
      expect(handler.mock.calls.length).toBeGreaterThan(0);
    });

    it('should support advanced debounce options', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield on('click', handler, { 
          debounce: { wait: 100, leading: true, trailing: false } 
        });
      });

      element.dispatchEvent(createTestMouseEvent('click'));
      expect(handler).toHaveBeenCalledTimes(1); // Leading edge

      element.dispatchEvent(createTestMouseEvent('click'));
      element.dispatchEvent(createTestMouseEvent('click'));
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should not be called again (trailing: false)
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Filtering', () => {
    it('should support event filtering', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield on('click', handler, { 
          filter: (event) => (event as MouseEvent).ctrlKey 
        });
      });

      element.dispatchEvent(createTestMouseEvent('click', { ctrlKey: false }));
      element.dispatchEvent(createTestMouseEvent('click', { ctrlKey: true }));
      element.dispatchEvent(createTestMouseEvent('click', { ctrlKey: false }));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Composition', () => {
    it('should create event behaviors', async () => {
      const rippleBehavior = createEventBehavior('click', function* () {
        yield addClass('ripple');
        yield new Promise(resolve => setTimeout(resolve, 300));
        yield removeClass('ripple');
      });

      const button = createTestElement('button');
      
      await runOn(button, function* () {
        yield click(rippleBehavior);
      });

      button.dispatchEvent(createTestMouseEvent('click'));
      await waitForEvent();
      
      expect(button.classList.contains('ripple')).toBe(true);
      
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(button.classList.contains('ripple')).toBe(false);
    });

    it('should compose multiple event handlers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();
      
      const composedHandler = composeEventHandlers(
        () => handler1(),
        () => handler2(),
        () => handler3()
      );

      const button = createTestElement('button');
      
      await runOn(button, function* () {
        yield click(composedHandler);
      });

      button.dispatchEvent(createTestMouseEvent('click'));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });
  });

  describe('Observer Events', () => {
    it('should handle attribute observation', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield onAttr('data-value', handler);
      });

      element.setAttribute('data-value', 'test');
      await waitForMutation();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          attributeName: 'data-value',
          newValue: 'test',
          oldValue: null
        })
      );
    });

    it('should handle text content observation', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      element.textContent = 'initial';
      
      await runOn(element, function* () {
        yield onText(handler);
      });

      element.textContent = 'changed';
      await waitForMutation();

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          oldText: 'initial',
          newText: 'changed'
        })
      );
    });

    it('should handle visibility observation', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      // Make element initially hidden
      element.style.display = 'none';
      
      await runOn(element, function* () {
        yield onVisible(handler);
      });

      // Make element visible
      element.style.display = 'block';
      await waitForMutation(100);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          isVisible: true
        })
      );
    });

    it('should handle resize observation', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      element.style.width = '100px';
      element.style.height = '100px';
      
      await runOn(element, function* () {
        yield onResize(handler);
      });

      element.style.width = '200px';
      await waitForMutation(100);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          contentRect: expect.any(Object)
        })
      );
    });
  });

  describe('Lifecycle Events', () => {
    it('should handle mount events', async () => {
      const handler = vi.fn();
      
      const controller = watch('.mount-test', function* () {
        yield onMount(handler);
      });

      const element = createTestElement('div', { class: 'mount-test' });
      await waitForMutation();

      expect(handler).toHaveBeenCalledWith(element);
      
      controller.destroy();
    });

    it('should handle unmount events', async () => {
      const unmountHandler = vi.fn();
      const element = createTestElement('div', { class: 'unmount-test' });
      
      const controller = watch('.unmount-test', function* () {
        yield onUnmount(unmountHandler);
      });

      await waitForMutation();

      element.remove();
      await waitForMutation(100);

      expect(unmountHandler).toHaveBeenCalledWith(element);
      
      controller.destroy();
    });
  });

  describe('Event Emission', () => {
    it('should emit custom events', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      element.addEventListener('customEvent', handler);
      
      await runOn(element, function* () {
        yield emit('customEvent', { detail: { test: 'data' } });
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toEqual({ test: 'data' });
    });

    it('should emit events that bubble', async () => {
      const parent = createTestElement('div');
      const child = createTestElement('div');
      parent.appendChild(child);
      
      const parentHandler = vi.fn();
      parent.addEventListener('bubbleEvent', parentHandler);
      
      await runOn(child, function* () {
        yield emit('bubbleEvent', { bubbles: true });
      });

      expect(parentHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Queue Management', () => {
    it('should handle concurrent async generators with queue: latest', async () => {
      const element = createTestElement('div');
      const executions: number[] = [];
      let executionCount = 0;
      
      await runOn(element, function* () {
        yield on('click', async function* () {
          const id = ++executionCount;
          executions.push(id);
          await new Promise(resolve => setTimeout(resolve, 50));
          executions.push(id);
        }, { queue: 'latest' });
      });

      // Fire multiple rapid clicks
      element.dispatchEvent(createTestMouseEvent('click'));
      element.dispatchEvent(createTestMouseEvent('click'));
      element.dispatchEvent(createTestMouseEvent('click'));
      
      await new Promise(resolve => setTimeout(resolve, 100));

      // Only the latest execution should complete
      expect(executions).toEqual([1, 2, 3, 3]);
    });

    it('should handle concurrent async generators with queue: all', async () => {
      const element = createTestElement('div');
      const executions: number[] = [];
      let executionCount = 0;
      
      await runOn(element, function* () {
        yield on('click', async function* () {
          const id = ++executionCount;
          executions.push(id);
          await new Promise(resolve => setTimeout(resolve, 50));
          executions.push(id);
        }, { queue: 'all' });
      });

      // Fire multiple rapid clicks
      element.dispatchEvent(createTestMouseEvent('click'));
      element.dispatchEvent(createTestMouseEvent('click'));
      element.dispatchEvent(createTestMouseEvent('click'));
      
      await new Promise(resolve => setTimeout(resolve, 100));

      // All executions should complete
      expect(executions).toEqual([1, 2, 3, 1, 2, 3]);
    });

    it('should handle concurrent async generators with queue: none', async () => {
      const element = createTestElement('div');
      const executions: number[] = [];
      let executionCount = 0;
      
      await runOn(element, function* () {
        yield on('click', async function* () {
          const id = ++executionCount;
          executions.push(id);
          await new Promise(resolve => setTimeout(resolve, 50));
          executions.push(id);
        }, { queue: 'none' });
      });

      // Fire multiple rapid clicks
      element.dispatchEvent(createTestMouseEvent('click'));
      await new Promise(resolve => setTimeout(resolve, 10));
      element.dispatchEvent(createTestMouseEvent('click'));
      await new Promise(resolve => setTimeout(resolve, 10));
      element.dispatchEvent(createTestMouseEvent('click'));
      
      await new Promise(resolve => setTimeout(resolve, 100));

      // First execution should complete, others should be ignored
      expect(executions).toEqual([1, 1]);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in event handlers gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        yield click(() => {
          throw new Error('Event handler error');
        });
      });

      element.dispatchEvent(createTestMouseEvent('click'));
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle errors in generator event handlers', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        yield click(function* () {
          throw new Error('Generator handler error');
        });
      });

      element.dispatchEvent(createTestMouseEvent('click'));
      await waitForEvent();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners when element is removed', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield click(handler);
      });

      element.dispatchEvent(createTestMouseEvent('click'));
      expect(handler).toHaveBeenCalledTimes(1);

      element.remove();
      await waitForMutation(100);

      // Try to dispatch event on removed element
      element.dispatchEvent(createTestMouseEvent('click'));
      
      // Handler should not be called again
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should clean up observers when element is removed', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield onAttr('test', handler);
      });

      element.setAttribute('test', 'value1');
      await waitForMutation();
      expect(handler).toHaveBeenCalledTimes(1);

      element.remove();
      await waitForMutation(100);

      // Try to change attribute on removed element
      element.setAttribute('test', 'value2');
      await waitForMutation();
      
      // Handler should not be called again
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance', () => {
    it('should handle many event listeners efficiently', async () => {
      const element = createTestElement('div');
      const handlers = [];
      
      const startTime = performance.now();
      
      await runOn(element, function* () {
        for (let i = 0; i < 1000; i++) {
          const handler = vi.fn();
          handlers.push(handler);
          yield on('click', handler);
        }
      });

      const endTime = performance.now();
      const setupTime = endTime - startTime;
      
      const eventStartTime = performance.now();
      element.dispatchEvent(createTestMouseEvent('click'));
      const eventEndTime = performance.now();
      const eventTime = eventEndTime - eventStartTime;
      
      // Setup should be reasonably fast
      expect(setupTime).toBeLessThan(1000); // 1 second
      
      // Event dispatch should be fast
      expect(eventTime).toBeLessThan(100); // 100ms
      
      // All handlers should be called
      handlers.forEach(handler => {
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle rapid event firing efficiently', async () => {
      const element = createTestElement('div');
      const handler = vi.fn();
      
      await runOn(element, function* () {
        yield on('click', handler);
      });

      const startTime = performance.now();
      
      // Fire many events rapidly
      for (let i = 0; i < 1000; i++) {
        element.dispatchEvent(createTestMouseEvent('click'));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(handler).toHaveBeenCalledTimes(1000);
    });
  });
});
