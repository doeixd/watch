import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { watch, run, runOn, layer, getInstances, destroy } from '../src/watch';
import { text, addClass, removeClass } from '../src/api/dom';
import { click, on } from '../src/api/events';
import { setState, getState } from '../src/core/state';
import { self, el, cleanup } from '../src/core/generator';

// Test utilities
function createTestElement(tag: string = 'div', attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  document.body.appendChild(element);
  return element;
}

function createTestHtml(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

function waitForMutation(ms: number = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Core Watch Function', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any remaining observers
    document.body.innerHTML = '';
  });

  describe('String Selector Overload', () => {
    it('should watch elements by CSS selector', async () => {
      const results: HTMLElement[] = [];
      
      // Set up watcher first
      const controller = watch('button', function* (ctx) {
        results.push(ctx.element);
        yield addClass('watched');
      });

      // Create matching elements
      const btn1 = createTestElement('button', { id: 'btn1' });
      const btn2 = createTestElement('button', { id: 'btn2' });
      
      await waitForMutation();

      expect(results).toHaveLength(2);
      expect(results[0]).toBe(btn1);
      expect(results[1]).toBe(btn2);
      expect(btn1.classList.contains('watched')).toBe(true);
      expect(btn2.classList.contains('watched')).toBe(true);

      controller.destroy();
    });

    it('should handle complex selectors', async () => {
      const results: HTMLElement[] = [];
      
      const controller = watch('input[type="email"]', function* (ctx) {
        results.push(ctx.element);
        expect(ctx.element).toBeInstanceOf(HTMLInputElement);
        yield addClass('email-input');
      });

      const emailInput = createTestElement('input', { type: 'email' });
      const textInput = createTestElement('input', { type: 'text' });
      
      await waitForMutation();

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(emailInput);
      expect(emailInput.classList.contains('email-input')).toBe(true);
      expect(textInput.classList.contains('email-input')).toBe(false);

      controller.destroy();
    });

    it('should watch for new elements added after setup', async () => {
      const results: HTMLElement[] = [];
      
      const controller = watch('.dynamic', function* (ctx) {
        results.push(ctx.element);
        yield text('Watched!');
      });

      // No initial elements
      expect(results).toHaveLength(0);

      // Add elements dynamically
      const elem1 = createTestElement('div', { class: 'dynamic' });
      await waitForMutation();
      
      const elem2 = createTestElement('span', { class: 'dynamic' });
      await waitForMutation();

      expect(results).toHaveLength(2);
      expect(elem1.textContent).toBe('Watched!');
      expect(elem2.textContent).toBe('Watched!');

      controller.destroy();
    });
  });

  describe('Single Element Overload', () => {
    it('should watch a specific element', async () => {
      const button = createTestElement('button');
      let executed = false;
      
      const controller = watch(button, function* (ctx) {
        executed = true;
        expect(ctx.element).toBe(button);
        yield addClass('specific-watched');
      });

      await waitForMutation();

      expect(executed).toBe(true);
      expect(button.classList.contains('specific-watched')).toBe(true);

      controller.destroy();
    });

    it('should preserve element type', async () => {
      const input = createTestElement('input') as HTMLInputElement;
      input.type = 'email';
      
      await runOn(input, function* (ctx) {
        // TypeScript should infer HTMLInputElement
        expect(ctx.element.type).toBe('email');
        ctx.element.value = 'test@example.com';
        expect(ctx.element.value).toBe('test@example.com');
      });
    });
  });

  describe('Element Matcher Overload', () => {
    it('should use custom matcher function', async () => {
      const results: HTMLElement[] = [];
      
      const matcher = (el: HTMLElement): el is HTMLInputElement => {
        return el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'email';
      };

      const controller = watch(matcher, function* (ctx) {
        results.push(ctx.element);
        yield addClass('matched');
      });

      const emailInput = createTestElement('input', { type: 'email' });
      const textInput = createTestElement('input', { type: 'text' });
      const button = createTestElement('button');
      
      await waitForMutation();

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(emailInput);
      expect(emailInput.classList.contains('matched')).toBe(true);

      controller.destroy();
    });
  });

  describe('Array of Elements Overload', () => {
    it('should watch multiple specific elements', async () => {
      const btn1 = createTestElement('button');
      const btn2 = createTestElement('button');
      const btn3 = createTestElement('button');
      const elements = [btn1, btn2];
      
      const results: HTMLElement[] = [];
      
      const controller = watch(elements, function* (ctx) {
        results.push(ctx.element);
        yield addClass('array-watched');
      });

      await waitForMutation();

      expect(results).toHaveLength(2);
      expect(btn1.classList.contains('array-watched')).toBe(true);
      expect(btn2.classList.contains('array-watched')).toBe(true);
      expect(btn3.classList.contains('array-watched')).toBe(false);

      controller.destroy();
    });
  });

  describe('NodeList Overload', () => {
    it('should watch elements from NodeList', async () => {
      // Create elements first
      createTestElement('button', { class: 'nodelist-test' });
      createTestElement('button', { class: 'nodelist-test' });
      
      const nodeList = document.querySelectorAll('button.nodelist-test') as NodeListOf<HTMLButtonElement>;
      const results: HTMLElement[] = [];
      
      const controller = watch(nodeList, function* (ctx) {
        results.push(ctx.element);
        yield addClass('nodelist-watched');
      });

      await waitForMutation();

      expect(results).toHaveLength(2);
      expect(nodeList[0].classList.contains('nodelist-watched')).toBe(true);
      expect(nodeList[1].classList.contains('nodelist-watched')).toBe(true);

      controller.destroy();
    });
  });

  describe('Event Delegation Overload', () => {
    it('should handle event delegation', async () => {
      const container = createTestElement('div');
      const results: HTMLElement[] = [];
      
      const controller = watch(container, 'button', function* (ctx) {
        results.push(ctx.element);
        yield addClass('delegated');
      });

      // Add buttons inside container
      const btn1 = document.createElement('button');
      const btn2 = document.createElement('button');
      container.appendChild(btn1);
      container.appendChild(btn2);
      
      await waitForMutation();

      expect(results).toHaveLength(2);
      expect(btn1.classList.contains('delegated')).toBe(true);
      expect(btn2.classList.contains('delegated')).toBe(true);

      controller.destroy();
    });
  });

  describe('Controller System', () => {
    it('should return a WatchController with layer capability', async () => {
      const button = createTestElement('button');
      let layer1Called = false;
      let layer2Called = false;
      
      const controller = watch(button, function* () {
        layer1Called = true;
        yield addClass('layer1');
      });

      controller.layer(function* () {
        layer2Called = true;
        yield addClass('layer2');
      });

      await waitForMutation();

      expect(layer1Called).toBe(true);
      expect(layer2Called).toBe(true);
      expect(button.classList.contains('layer1')).toBe(true);
      expect(button.classList.contains('layer2')).toBe(true);

      controller.destroy();
    });

    it('should provide instance introspection', async () => {
      const btn1 = createTestElement('button', { id: 'btn1' });
      const btn2 = createTestElement('button', { id: 'btn2' });
      
      const controller = watch('button', function* (ctx) {
        setState('id', ctx.element.id);
        yield addClass('watched');
      });

      await waitForMutation();

      const instances = controller.getInstances();
      expect(instances.size).toBe(2);
      
      const btn1Instance = instances.get(btn1);
      const btn2Instance = instances.get(btn2);
      
      expect(btn1Instance?.getState()).toEqual({ id: 'btn1' });
      expect(btn2Instance?.getState()).toEqual({ id: 'btn2' });

      controller.destroy();
    });

    it('should support singleton controllers per selector', async () => {
      const btn = createTestElement('button');
      
      const controller1 = watch('button', function* () {
        yield addClass('first');
      });
      
      const controller2 = watch('button', function* () {
        yield addClass('second');
      });

      // Should be the same controller instance
      expect(controller1).toBe(controller2);
      
      await waitForMutation();
      
      expect(btn.classList.contains('first')).toBe(true);
      expect(btn.classList.contains('second')).toBe(true);

      controller1.destroy();
    });

    it('should support functional API for controllers', async () => {
      const button = createTestElement('button');
      
      const controller = watch(button, function* () {
        yield addClass('base');
      });

      // Use functional API
      layer(controller, function* () {
        yield addClass('layered');
      });

      await waitForMutation();

      const instances = getInstances(controller);
      expect(instances.size).toBe(1);
      expect(button.classList.contains('base')).toBe(true);
      expect(button.classList.contains('layered')).toBe(true);

      destroy(controller);
    });
  });

  describe('run() Function', () => {
    it('should execute generator on existing elements only', async () => {
      // Create existing elements
      const btn1 = createTestElement('button', { class: 'existing' });
      const btn2 = createTestElement('button', { class: 'existing' });
      
      const results: HTMLElement[] = [];
      
      run('button.existing', function* (ctx) {
        results.push(ctx.element);
        yield addClass('ran');
      });

      // Add new element after run()
      const btn3 = createTestElement('button', { class: 'existing' });
      
      await waitForMutation(100);

      // Should only affect existing elements
      expect(results).toHaveLength(2);
      expect(btn1.classList.contains('ran')).toBe(true);
      expect(btn2.classList.contains('ran')).toBe(true);
      expect(btn3.classList.contains('ran')).toBe(false);
    });
  });

  describe('runOn() Function', () => {
    it('should execute generator on specific element', async () => {
      const button = createTestElement('button');
      let executed = false;
      
      await runOn(button, function* (ctx) {
        executed = true;
        expect(ctx.element).toBe(button);
        yield addClass('ran-on');
      });

      expect(executed).toBe(true);
      expect(button.classList.contains('ran-on')).toBe(true);
    });

    it('should return generator return value', async () => {
      const button = createTestElement('button');
      
      const result = await runOn(button, function* () {
        return { test: 'value' };
      });

      expect(result).toEqual({ test: 'value' });
    });
  });

  describe('Context Parameter Support', () => {
    it('should support both context parameter and global functions', async () => {
      const button = createTestElement('button');
      button.innerHTML = '<span>child</span>';
      
      await runOn(button, function* (ctx) {
        // Context parameter methods
        expect(ctx.self()).toBe(button);
        expect(ctx.element).toBe(button);
        const childViaCtx = ctx.el('span');
        
        // Global methods (backwards compatibility)
        expect(self()).toBe(button);
        const childViaGlobal = el('span');
        
        // Both should work and return same element
        expect(childViaCtx).toBe(childViaGlobal);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle generator errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const button = createTestElement('button');
      
      const controller = watch(button, function* () {
        throw new Error('Test error');
      });

      await waitForMutation();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
      controller.destroy();
    });

    it('should handle async generator errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const button = createTestElement('button');
      
      await expect(runOn(button, async function* () {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async error');
      })).rejects.toThrow('Async error');

      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    it('should clean up when elements are removed', async () => {
      const cleanupSpy = vi.fn();
      const button = createTestElement('button');
      
      const controller = watch(button, function* () {
        cleanup(cleanupSpy);
        yield addClass('watched');
      });

      await waitForMutation();
      expect(button.classList.contains('watched')).toBe(true);

      // Remove element
      button.remove();
      await waitForMutation(100);

      expect(cleanupSpy).toHaveBeenCalled();
      controller.destroy();
    });

    it('should clean up when controller is destroyed', async () => {
      const cleanupSpy = vi.fn();
      const button = createTestElement('button');
      
      const controller = watch(button, function* () {
        cleanup(cleanupSpy);
        yield addClass('watched');
      });

      await waitForMutation();
      
      controller.destroy();
      await waitForMutation();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Type Safety', () => {
    it('should infer correct element types from selectors', async () => {
      // This test verifies TypeScript compilation more than runtime behavior
      const controller = watch('input[type="email"]', function* (ctx) {
        // ctx.element should be typed as HTMLInputElement
        expect(ctx.element).toBeInstanceOf(HTMLInputElement);
        
        // These should be available without casting
        ctx.element.value = 'test@example.com';
        expect(ctx.element.type).toBe('email');
      });

      const input = createTestElement('input', { type: 'email' }) as HTMLInputElement;
      await waitForMutation();

      controller.destroy();
    });
  });
});
