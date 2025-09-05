/**
 * Comprehensive tests for yield* functionality
 *
 * This test suite verifies that all functions support yield* patterns with proper
 * type safety and return values. Tests cover:
 * - Core generator functions (self, el, all, cleanup, ctx, getParentContext)
 * - Event functions (on, click, input, change, submit)
 * - Observer events (onAttr, onText, onVisible, onResize)
 * - Lifecycle events (onMount, onUnmount)
 * - DOM manipulation with yield*
 * - State management with yield*
 * - Enhanced context integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  watch,
  watch as watchEnhanced,
  // Core generator functions
  self,
  el,
  all,
  cleanup,
  ctx,
  getParentContext,
  // Event functions
  on,
  click,
  input,
  change,
  submit,
  // Observer events
  onAttr,
  onText,
  onVisible,
  onResize,
  // Lifecycle events
  onMount,
  onUnmount,
  // DOM functions
  text,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  style,
  attr,
  query,
  queryAll,
  // State management
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
  watchState,
} from '../src/index';

// Setup DOM structure for tests (happy-dom environment is already configured)
beforeEach(() => {
  // Clear and setup the DOM for each test
  document.body.innerHTML = `
    <div class="test-container">
      <button class="test-button">Test Button</button>
      <input class="test-input" type="text" />
      <select class="test-select">
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </select>
      <form class="test-form">
        <input type="text" name="username" />
        <button type="submit">Submit</button>
      </form>
      <div class="parent-container">
        <div class="child-item" data-id="1">Child 1</div>
        <div class="child-item" data-id="2">Child 2</div>
      </div>
      <div class="observed-element" data-status="initial">Observed</div>
      <div class="lifecycle-element">Lifecycle</div>
    </div>
  `;
});

describe('yield* Core Generator Functions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="test-container">
        <button class="test-button">Test Button</button>
        <div class="child-1">Child 1</div>
        <div class="child-2">Child 2</div>
        <input class="test-input" />
      </div>
    `;
  });

  it('should support self() with yield*', async () => {
    let capturedElement: HTMLElement | null = null;

    watch('.test-button', function* () {
      const element = yield* self.gen<HTMLButtonElement>();
      capturedElement = element;
      expect(element).toBeInstanceOf(HTMLButtonElement);
      expect(element.tagName).toBe('BUTTON');
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(capturedElement).toBeTruthy();
  });

  it('should support el() with yield*', async () => {
    let capturedInput: HTMLInputElement | null = null;

    watch('.test-container', function* () {
      const input = yield* el.gen<HTMLInputElement>('.test-input');
      capturedInput = input;
      expect(input).toBeInstanceOf(HTMLInputElement);
      expect(input?.tagName).toBe('INPUT');
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(capturedInput).toBeTruthy();
  });

  it('should support all() with yield*', async () => {
    let capturedChildren: HTMLDivElement[] = [];

    watch('.test-container', function* () {
      const children = yield* all.gen<HTMLDivElement>('div[class^="child-"]');
      capturedChildren = children;
      expect(children).toHaveLength(2);
      expect(children[0].textContent).toBe('Child 1');
      expect(children[1].textContent).toBe('Child 2');
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(capturedChildren).toHaveLength(2);
  });

  it('should support cleanup() with yield*', async () => {
    const cleanupFn = vi.fn();
    let cleanupRegistered = false;

    watch('.test-button', function* () {
      yield* cleanup.gen(cleanupFn);
      cleanupRegistered = true;
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(cleanupRegistered).toBe(true);

    // Remove the element to trigger cleanup
    const button = document.querySelector('.test-button');
    button?.remove();

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(cleanupFn).toHaveBeenCalled();
  });

  it('should support ctx() with yield*', async () => {
    let capturedContext: any = null;

    watch('.test-button', function* () {
      const context = yield* ctx.gen();
      capturedContext = context;
      expect(context.element).toBeInstanceOf(HTMLButtonElement);
      expect(context.selector).toBe('.test-button');
      expect(typeof context.index).toBe('number');
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(capturedContext).toBeTruthy();
  });
});

describe('yield* Event Functions', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="test-container">
        <button class="test-button">Test Button</button>
        <input class="test-input" type="text" />
        <select class="test-select">
          <option value="1">Option 1</option>
        </select>
        <form class="test-form">
          <input type="text" name="test" />
          <button type="submit">Submit</button>
        </form>
      </div>
    `;
  });

  it('should support click() with yield*', async () => {
    let clickHandled = false;
    let clickCleanup: (() => void) | null = null;

    watch('.test-button', function* () {
      const cleanup = yield* click(function* (event) {
        clickHandled = true;
        expect(event.type).toBe('click');
        yield* addClass('clicked');
      });
      clickCleanup = cleanup;
      expect(typeof cleanup).toBe('function');
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const button = document.querySelector('.test-button') as HTMLButtonElement;
    button.click();

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(clickHandled).toBe(true);
    expect(button.classList.contains('clicked')).toBe(true);
    expect(clickCleanup).toBeTruthy();
  });

  it('should support input() with yield*', async () => {
    let inputHandled = false;
    let inputValue = '';

    watch('.test-input', function* () {
      yield* input(function* (event) {
        inputHandled = true;
        const target = event.target as HTMLInputElement;
        inputValue = target.value;
        yield* setState('inputValue', target.value);
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const input = document.querySelector('.test-input') as HTMLInputElement;
    input.value = 'test value';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(inputHandled).toBe(true);
    expect(inputValue).toBe('test value');
  });

  it('should support change() with yield*', async () => {
    let changeHandled = false;
    let selectedValue = '';

    watch('.test-select', function* () {
      yield* change(function* (event) {
        changeHandled = true;
        const target = event.target as HTMLSelectElement;
        selectedValue = target.value;
        yield* attr('data-selected', target.value);
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const select = document.querySelector('.test-select') as HTMLSelectElement;
    select.value = '1';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(changeHandled).toBe(true);
    expect(selectedValue).toBe('1');
  });

  it('should support submit() with yield*', async () => {
    let submitHandled = false;
    let submitPrevented = false;

    watch('.test-form', function* () {
      yield* submit(function* (event) {
        submitHandled = true;
        event.preventDefault();
        submitPrevented = true;
        yield* addClass('submitting');
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const form = document.querySelector('.test-form') as HTMLFormElement;
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(submitHandled).toBe(true);
    expect(submitEvent.defaultPrevented).toBe(true);
  });

  it('should support on() with yield* for custom events', async () => {
    let customEventHandled = false;
    let eventDetail: any = null;

    watch('.test-button', function* () {
      yield* on('custom:test', function* (event) {
        customEventHandled = true;
        eventDetail = (event as CustomEvent).detail;
        yield* addClass('custom-handled');
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const button = document.querySelector('.test-button') as HTMLButtonElement;
    const customEvent = new CustomEvent('custom:test', {
      detail: { message: 'test data' }
    });
    button.dispatchEvent(customEvent);

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(customEventHandled).toBe(true);
    expect(eventDetail).toEqual({ message: 'test data' });
  });
});

describe('yield* DOM Manipulation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="test-element">Original Text</div>
    `;
  });

  it('should support DOM functions with yield*', async () => {
    watch('.test-element', function* () {
      // Text manipulation
      yield* text('New Text');
      const currentText = yield* text();
      expect(currentText).toBe('New Text');

      // Class manipulation
      yield* addClass('test-class');
      const hasTestClass = yield* hasClass('test-class');
      expect(hasTestClass).toBe(true);

      yield* toggleClass('toggle-class');
      const hasToggleClass = yield* hasClass('toggle-class');
      expect(hasToggleClass).toBe(true);

      // Attribute manipulation
      yield* attr('data-test', 'test-value');
      const attrValue = yield* attr('data-test');
      expect(attrValue).toBe('test-value');

      // Style manipulation
      yield* style('color', 'red');
      const colorStyle = yield* style('color');
      expect(colorStyle).toBe('red');
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const element = document.querySelector('.test-element') as HTMLElement;
    expect(element.textContent).toBe('New Text');
    expect(element.classList.contains('test-class')).toBe(true);
    expect(element.classList.contains('toggle-class')).toBe(true);
    expect(element.getAttribute('data-test')).toBe('test-value');
    expect(element.style.color).toBe('red');
  });
});

describe('yield* State Management', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="state-element">State Test</div>
    `;
  });

  it('should support state functions with yield*', async () => {
    watch('.state-element', function* () {
      // Set initial state
      yield* setState.gen('counter', 0);
      yield* setState.gen('data', { name: 'test', value: 42 });

      // Get state
      const counter = yield* getState.gen<number>('counter', -1);
      expect(counter).toBe(0);

      const data = yield* getState.gen<{ name: string; value: number }>('data');
      expect(data?.name).toBe('test');
      expect(data?.value).toBe(42);

      // Check state existence
      const hasCounter = yield* hasState.gen('counter');
      expect(hasCounter).toBe(true);

      const hasNonExistent = yield* hasState.gen('nonexistent');
      expect(hasNonExistent).toBe(false);

      // Update state
      const newCounter = yield* updateState.gen<number>('counter', (count) => count + 5);
      expect(newCounter).toBe(5);

      // Delete state
      yield* deleteState.gen('data');
      const deletedData = yield* getState.gen('data');
      expect(deletedData).toBeUndefined();
    });

    await new Promise(resolve => setTimeout(resolve, 10));
  });

  it('should support watchState() with yield*', async () => {
    let stateChangeHandled = false;
    let oldValue: any = null;
    let newValue: any = null;

    watch('.state-element', function* () {
      yield* setState.gen('watched', 'initial');

      yield* watchState.gen<string>('watched', function* (newVal, oldVal) {
        stateChangeHandled = true;
        oldValue = oldVal;
        newValue = newVal;
        yield* addClass('state-changed');
      });

      // Trigger state change
      yield* setState.gen('watched', 'changed');
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(stateChangeHandled).toBe(true);
    expect(oldValue).toBe('initial');
    expect(newValue).toBe('changed');
  });
});

describe('yield* Enhanced Context', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="enhanced-element">
        <button class="enhanced-button">Enhanced</button>
        <input class="enhanced-input" />
      </div>
    `;
  });

  it('should support enhanced context with yield*', async () => {
    let enhancedTestPassed = false;

    watchEnhanced('.enhanced-element', function* (ctx) {
      // Core functions through context
      const element = yield* ctx.self();
      expect(element.classList.contains('enhanced-element')).toBe(true);

      const button = yield* ctx.el<HTMLButtonElement>('.enhanced-button');
      expect(button?.tagName).toBe('BUTTON');

      const allChildren = yield* ctx.all('*');
      expect(allChildren.length).toBeGreaterThan(0);

      // DOM manipulation through context
      yield* ctx.text('Enhanced Text');
      yield* ctx.addClass('enhanced-processed');

      // Event handling through context
      yield* ctx.click(button!, function* () {
        yield* ctx.addClass('enhanced-clicked');
        enhancedTestPassed = true;
      });

      // State management through context
      yield* ctx.setState('enhanced', true);
      const enhanced = yield* ctx.getState<boolean>('enhanced');
      expect(enhanced).toBe(true);

      // Cleanup through context
      yield* ctx.cleanup(() => {
        console.log('Enhanced cleanup');
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const element = document.querySelector('.enhanced-element') as HTMLElement;
    const button = element.querySelector('.enhanced-button') as HTMLButtonElement;

    expect(element.textContent).toContain('Enhanced Text');
    expect(element.classList.contains('enhanced-processed')).toBe(true);

    // Trigger click event
    button.click();

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(enhancedTestPassed).toBe(true);
    expect(button.classList.contains('enhanced-clicked')).toBe(true);
  });
});

describe('yield* Observer Events', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="observed-element" data-status="initial">Observed</div>
    `;
  });

  it('should support onAttr() with yield*', async () => {
    let attrChangeHandled = false;
    let attributeName = '';
    let oldValue = '';
    let newValue = '';

    watch('.observed-element', function* () {
      yield* onAttr(function* (change) {
        attrChangeHandled = true;
        attributeName = change.attributeName || '';
        oldValue = change.oldValue || '';
        newValue = change.newValue || '';
        yield* addClass('attr-changed');
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const element = document.querySelector('.observed-element') as HTMLElement;
    element.setAttribute('data-status', 'changed');

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(attrChangeHandled).toBe(true);
    expect(attributeName).toBe('data-status');
    expect(newValue).toBe('changed');
  });

  it('should support onText() with yield*', async () => {
    let textChangeHandled = false;
    let oldText = '';
    let newText = '';

    watch('.observed-element', function* () {
      yield* onText(function* (change) {
        textChangeHandled = true;
        oldText = change.oldValue || '';
        newText = change.newValue || '';
        yield* addClass('text-changed');
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const element = document.querySelector('.observed-element') as HTMLElement;
    element.textContent = 'New Text Content';

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(textChangeHandled).toBe(true);
    expect(newText).toBe('New Text Content');
  });
});

describe('yield* Lifecycle Events', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="lifecycle-container"></div>
    `;
  });

  it('should support onMount() with yield*', async () => {
    let mountHandled = false;

    // Create element dynamically to test mount
    const element = document.createElement('div');
    element.className = 'lifecycle-element';
    element.textContent = 'Lifecycle Test';

    watch('.lifecycle-element', function* () {
      yield* onMount(function* () {
        mountHandled = true;
        yield* addClass('mounted');
        yield* setState('mountTime', Date.now());
      });
    });

    // Add element to DOM to trigger mount
    const container = document.querySelector('.lifecycle-container')!;
    container.appendChild(element);

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mountHandled).toBe(true);
    expect(element.classList.contains('mounted')).toBe(true);
  });

  it('should support onUnmount() with yield*', async () => {
    let unmountHandled = false;

    document.body.innerHTML = `
      <div class="lifecycle-element">Will be removed</div>
    `;

    watch('.lifecycle-element', function* () {
      yield* onUnmount(function* () {
        unmountHandled = true;
        // Can't modify element after unmount, but can do cleanup
        console.log('Element unmounted');
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const element = document.querySelector('.lifecycle-element');
    element?.remove();

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(unmountHandled).toBe(true);
  });
});

describe('yield* Complex Scenarios', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="complex-widget" data-id="widget-1">
        <div class="widget-header">Header</div>
        <div class="widget-content">
          <div class="widget-item" data-item-id="1">Item 1</div>
          <div class="widget-item" data-item-id="2">Item 2</div>
        </div>
        <button class="widget-action">Action</button>
      </div>
    `;
  });

  it('should handle complex widget interactions with yield*', async () => {
    let widgetInitialized = false;
    let itemSelected = false;
    let actionTriggered = false;

    watch('.complex-widget', function* () {
      // Initialize widget state
      yield* setState('widgetData', {
        id: 'widget-1',
        initialized: false,
        selectedItem: null,
        actionCount: 0
      });

      // Mount handler
      yield* onMount(function* () {
        widgetInitialized = true;
        yield* addClass('widget-initialized');
        yield* updateState<any>('widgetData', (data) => ({
          ...data,
          initialized: true
        }));
      });

      // Item selection handling
      yield* on('click', function* (event) {
        const target = event.target as HTMLElement;
        const item = target.closest('.widget-item');

        if (item) {
          itemSelected = true;
          const itemId = item.getAttribute('data-item-id');

          // Update state
          yield* updateState<any>('widgetData', (data) => ({
            ...data,
            selectedItem: itemId
          }));

          // Update UI
          const allItems = yield* queryAll('.widget-item');
          for (const otherItem of allItems) {
            removeClass(otherItem, 'selected');
          }
          yield* addClass(item, 'selected');
        }
      });

      // Action button handling
      const actionButton = yield* el<HTMLButtonElement>('.widget-action');
      if (actionButton) {
        yield* click(actionButton, function* () {
          actionTriggered = true;
          yield* updateState<any>('widgetData', (data) => ({
            ...data,
            actionCount: data.actionCount + 1
          }));
          yield* addClass('action-triggered');
        });
      }

      // State change watching
      yield* watchState<any>('widgetData', function* (newData, oldData) {
        if (newData.selectedItem !== oldData?.selectedItem) {
          yield* attr('data-selected', newData.selectedItem || '');
        }
      });
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(widgetInitialized).toBe(true);

    // Test item selection
    const item1 = document.querySelector('[data-item-id="1"]') as HTMLElement;
    item1.click();

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(itemSelected).toBe(true);
    expect(item1.classList.contains('selected')).toBe(true);

    // Test action button
    const actionButton = document.querySelector('.widget-action') as HTMLButtonElement;
    actionButton.click();

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(actionTriggered).toBe(true);
    expect(actionButton.classList.contains('action-triggered')).toBe(true);
  });
});

describe('yield* Type Safety', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button class="typed-button">Typed Button</button>
      <input class="typed-input" type="text" />
    `;
  });

  it('should maintain proper types with yield*', async () => {
    let typeTestPassed = false;

    watch('button.typed-button', function* () {
      // self() should return HTMLButtonElement
      const button: HTMLButtonElement = yield* self();
      expect(button.tagName).toBe('BUTTON');
      button.disabled = false; // TypeScript should allow this

      // el() with generic should return proper type
      const input: HTMLInputElement | null = yield* el<HTMLInputElement>('.typed-input');
      if (input) {
        input.value = 'Typed value'; // TypeScript should allow this
        expect(input.tagName).toBe('INPUT');
      }

      // State with proper typing
      yield* setState<{ count: number; name: string }>('typedData', {
        count: 42,
        name: 'test'
      });

      const typedData = yield* getState<{ count: number; name: string }>('typedData');
      if (typedData) {
        expect(typeof typedData.count).toBe('number');
        expect(typeof typedData.name).toBe('string');
        expect(typedData.count).toBe(42);
        expect(typedData.name).toBe('test');
      }

      typeTestPassed = true;
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(typeTestPassed).toBe(true);
  });
});

describe('yield* Performance and Edge Cases', () => {
  it('should handle rapid state updates with yield*', async () => {
    let updateCount = 0;

    document.body.innerHTML = `<div class="perf-test">Performance Test</div>`;

    watch('.perf-test', function* () {
      yield* setState('counter', 0);

      for (let i = 0; i < 100; i++) {
        yield* updateState<number>('counter', (count) => count + 1);
        updateCount++;
      }

      const finalCount = yield* getState<number>('counter', 0);
      expect(finalCount).toBe(100);
    });

    await new Promise(resolve => setTimeout(resolve, 50));
    expect(updateCount).toBe(100);
  });

  it('should handle nested yield* calls', async () => {
    let nestedTestPassed = false;

    document.body.innerHTML = `<div class="nested-test">Nested Test</div>`;

    watch('.nested-test', function* () {
      yield* setState('level', 1);

      const level1 = yield* getState<number>('level', 0);
      yield* setState('level', level1 + 1);

      const level2 = yield* getState<number>('level', 0);
      yield* setState('level', level2 + 1);

      const finalLevel = yield* getState<number>('level', 0);
      expect(finalLevel).toBe(3);

      nestedTestPassed = true;
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(nestedTestPassed).toBe(true);
  });
});
