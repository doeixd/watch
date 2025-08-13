import { describe, it, expect, beforeEach, vi } from 'vitest';
import { watchEnhanced, runOnEnhanced, scopedWatchEnhanced } from '../src/watch-enhanced';
import type { EnhancedTypedGeneratorContext } from '../src/watch-enhanced';

// Mock DOM setup
function createTestElement(tag: string = 'div', attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  document.body.appendChild(element);
  return element;
}

function waitForMutation(ms: number = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Enhanced Context with Attached DOM Functions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('watchEnhanced with attached DOM functions', () => {
    it('should provide text manipulation via context', async () => {
      const button = createTestElement('button');

      watchEnhanced(button, function* (ctx) {
        // Text manipulation through context
        yield* ctx.text('Click me!');
      });

      await waitForMutation();
      expect(button.textContent).toBe('Click me!');
    });

    it('should provide class manipulation via context', async () => {
      const div = createTestElement('div');

      watchEnhanced(div, function* (ctx) {
        // Add multiple classes
        yield* ctx.addClass('active primary');

        // Check if class exists
        const hasActive = yield* ctx.hasClass('active');
        expect(hasActive).toBe(true);

        // Toggle class
        yield* ctx.toggleClass('highlighted');

        // Remove class
        yield* ctx.removeClass('primary');
      });

      await waitForMutation();
      expect(div.classList.contains('active')).toBe(true);
      expect(div.classList.contains('highlighted')).toBe(true);
      expect(div.classList.contains('primary')).toBe(false);
    });

    it('should provide style manipulation via context', async () => {
      const element = createTestElement('div');

      watchEnhanced(element, function* (ctx) {
        // Set multiple styles at once
        yield* ctx.style({
          color: 'red',
          fontSize: '16px',
          backgroundColor: 'blue'
        });

        // Set individual style
        yield* ctx.style('opacity', '0.8');

        // Get style value
        const color = yield* ctx.style('color');
        expect(color).toBeTruthy();
      });

      await waitForMutation();
      expect(element.style.fontSize).toBe('16px');
      expect(element.style.opacity).toBe('0.8');
    });

    it('should provide attribute manipulation via context', async () => {
      const input = createTestElement('input') as HTMLInputElement;

      watchEnhanced(input, function* (ctx) {
        // Set attributes
        yield* ctx.attr('placeholder', 'Enter text');
        yield* ctx.attr({
          'data-id': '123',
          'aria-label': 'Text input'
        });

        // Check attribute existence
        const hasPlaceholder = yield* ctx.hasAttr('placeholder');
        expect(hasPlaceholder).toBe(true);

        // Get attribute value
        const dataId = yield* ctx.attr('data-id');
        expect(dataId).toBe('123');

        // Remove attribute
        yield* ctx.removeAttr('aria-label');
      });

      await waitForMutation();
      expect(input.getAttribute('placeholder')).toBe('Enter text');
      expect(input.getAttribute('data-id')).toBe('123');
      expect(input.hasAttribute('aria-label')).toBe(false);
    });

    it('should provide form element helpers via context', async () => {
      const input = createTestElement('input', { type: 'text' }) as HTMLInputElement;
      const checkbox = createTestElement('input', { type: 'checkbox' }) as HTMLInputElement;

      await runOnEnhanced(input, function* (ctx) {
        // Set and get value
        yield* ctx.value('test value');
        const value = yield* ctx.value();
        expect(value).toBe('test value');
      });

      await runOnEnhanced(checkbox, function* (ctx) {
        // Set and get checked state
        yield* ctx.checked(true);
        const isChecked = yield* ctx.checked();
        expect(isChecked).toBe(true);
      });

      expect(input.value).toBe('test value');
      expect(checkbox.checked).toBe(true);
    });

    it('should provide DOM traversal functions via context', async () => {
      // Create nested structure
      const parent = createTestElement('div', { class: 'parent' });
      const child1 = createTestElement('span', { class: 'child' });
      const child2 = createTestElement('button', { class: 'child' });
      parent.appendChild(child1);
      parent.appendChild(child2);

      await runOnEnhanced(child1, function* (ctx) {
        // Query parent
        const parentEl = yield* ctx.parent();
        expect(parentEl).toBe(parent);

        // Query siblings
        const siblings = yield* ctx.siblings();
        expect(siblings).toHaveLength(1);
        expect(siblings[0]).toBe(child2);
      });

      await runOnEnhanced(parent, function* (ctx) {
        // Query single child
        const button = yield* ctx.query<HTMLButtonElement>('button');
        expect(button).toBe(child2);

        // Query all children
        const children = yield* ctx.queryAll('.child');
        expect(children).toHaveLength(2);

        // Get direct children
        const directChildren = yield* ctx.children();
        expect(directChildren).toHaveLength(2);
      });
    });

    it('should provide visibility helpers via context', async () => {
      const element = createTestElement('div');
      element.style.display = 'none';

      await runOnEnhanced(element, function* (ctx) {
        // Show element
        yield* ctx.show();
      });

      expect(element.style.display).not.toBe('none');

      await runOnEnhanced(element, function* (ctx) {
        // Hide element
        yield* ctx.hide();
      });

      expect(element.style.display).toBe('none');
    });

    it('should provide focus management via context', async () => {
      const input = createTestElement('input') as HTMLInputElement;
      const button = createTestElement('button') as HTMLButtonElement;

      const focusSpy = vi.spyOn(input, 'focus');
      const blurSpy = vi.spyOn(button, 'blur');

      await runOnEnhanced(input, function* (ctx) {
        yield* ctx.focus();
      });

      expect(focusSpy).toHaveBeenCalled();

      // Focus button first
      button.focus();

      await runOnEnhanced(button, function* (ctx) {
        yield* ctx.blur();
      });

      expect(blurSpy).toHaveBeenCalled();
    });
  });

  describe('Type safety with enhanced context', () => {
    it('should provide correct element type from selector', async () => {
      const button = createTestElement('button', { id: 'test-btn' });

      watchEnhanced('button', function* (ctx) {
        // ctx.self() should return HTMLButtonElement
        const btn = ctx.self();
        // TypeScript should know this is HTMLButtonElement
        expect(btn).toBeInstanceOf(HTMLButtonElement);

        // Element property should also be typed
        expect(ctx.element).toBeInstanceOf(HTMLButtonElement);
      });

      await waitForMutation();
    });

    it('should maintain type safety through operations', async () => {
      const input = createTestElement('input', { type: 'email' }) as HTMLInputElement;

      watchEnhanced('input[type="email"]', function* (ctx) {
        // Should maintain HTMLInputElement type
        const el = ctx.self();
        expect(el).toBeInstanceOf(HTMLInputElement);

        // Form-specific functions should work
        yield* ctx.value('test@example.com');
      });

      await waitForMutation();
      expect(input.value).toBe('test@example.com');
    });
  });

  describe('scopedWatchEnhanced', () => {
    it('should watch child elements with enhanced context', async () => {
      const container = createTestElement('div', { class: 'container' });
      const item1 = createTestElement('div', { class: 'item' });
      const item2 = createTestElement('div', { class: 'item' });
      container.appendChild(item1);
      container.appendChild(item2);

      const processedItems: HTMLElement[] = [];

      scopedWatchEnhanced(container, '.item', function* (ctx) {
        processedItems.push(ctx.element);
        yield* ctx.addClass('processed');
        yield* ctx.attr('data-processed', 'true');
      });

      await waitForMutation();

      expect(processedItems).toHaveLength(2);
      expect(item1.classList.contains('processed')).toBe(true);
      expect(item2.classList.contains('processed')).toBe(true);
      expect(item1.getAttribute('data-processed')).toBe('true');
      expect(item2.getAttribute('data-processed')).toBe('true');
    });

    it('should handle dynamically added children', async () => {
      const container = createTestElement('div', { class: 'container' });

      scopedWatchEnhanced(container, '.dynamic', function* (ctx) {
        yield* ctx.text('Processed');
        yield* ctx.addClass('ready');
      });

      await waitForMutation();

      // Add new child dynamically
      const newChild = createTestElement('div', { class: 'dynamic' });
      container.appendChild(newChild);

      await waitForMutation(100);

      expect(newChild.textContent).toBe('Processed');
      expect(newChild.classList.contains('ready')).toBe(true);
    });
  });

  describe('Async generators with enhanced context', () => {
    it('should support async generators', async () => {
      const element = createTestElement('div');

      await runOnEnhanced(element, async function* (ctx) {
        yield* ctx.text('Loading...');

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));

        yield* ctx.text('Complete!');
        yield* ctx.addClass('done');
      });

      expect(element.textContent).toBe('Complete!');
      expect(element.classList.contains('done')).toBe(true);
    });
  });

  describe('Chaining operations with enhanced context', () => {
    it('should allow chaining multiple operations', async () => {
      const element = createTestElement('div');

      await runOnEnhanced(element, function* (ctx) {
        // Chain multiple operations
        yield* ctx.text('Hello');
        yield* ctx.addClass('greeting');
        yield* ctx.style('color', 'green');
        yield* ctx.attr('role', 'status');

        // Read values back
        const text = yield* ctx.text();
        const hasGreeting = yield* ctx.hasClass('greeting');
        const role = yield* ctx.attr('role');

        expect(text).toBe('Hello');
        expect(hasGreeting).toBe(true);
        expect(role).toBe('status');
      });

      expect(element.textContent).toBe('Hello');
      expect(element.classList.contains('greeting')).toBe(true);
      expect(element.style.color).toBe('green');
      expect(element.getAttribute('role')).toBe('status');
    });
  });

  describe('Context properties preservation', () => {
    it('should preserve all base context properties', async () => {
      const elements = [
        createTestElement('div', { class: 'test' }),
        createTestElement('div', { class: 'test' }),
        createTestElement('div', { class: 'test' })
      ];

      let contextChecks = 0;

      watchEnhanced('.test', function* (ctx) {
        // Check base context properties
        expect(ctx.self).toBeDefined();
        expect(ctx.el).toBeDefined();
        expect(ctx.all).toBeDefined();
        expect(ctx.cleanup).toBeDefined();
        expect(ctx.ctx).toBeDefined();

        // Check direct properties
        expect(ctx.element).toBeInstanceOf(HTMLElement);
        expect(ctx.selector).toBe('.test');
        expect(typeof ctx.index).toBe('number');
        expect(ctx.array).toBeDefined();

        // Check enhanced DOM functions
        expect(ctx.text).toBeDefined();
        expect(ctx.addClass).toBeDefined();
        expect(ctx.style).toBeDefined();
        expect(ctx.attr).toBeDefined();

        contextChecks++;
      });

      await waitForMutation(100);
      expect(contextChecks).toBe(3);
    });
  });
});
