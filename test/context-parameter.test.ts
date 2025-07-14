import { test, expect, beforeEach, vi } from 'vitest';
import { watch, runOn } from '../src/watch';
import { self, el, cleanup } from '../src/core/context';
import { setState, getState } from '../src/core/state';

// Mock DOM setup
function createTestElement(tag: string = 'div', id?: string): HTMLElement {
  const element = document.createElement(tag);
  if (id) element.id = id;
  document.body.appendChild(element);
  return element;
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

test('watch with context parameter - but using global functions (backwards compatibility)', async () => {
  const button = createTestElement('button', 'test-button');
  const clickHandler = vi.fn();
  
  // New pattern - but ignoring context parameter (backwards compatibility)
  watch(button, function* (ctx) {
    // Should work with getCurrentContext() - ignoring the ctx parameter
    expect(self()).toBe(button);
    expect(el('span')).toBe(null); // No span child
    
    setState('clicked', false);
    expect(getState('clicked')).toBe(false);
    
    cleanup(() => {
      clickHandler();
    });
  });
  
  // Trigger cleanup - wait for watch to initialize first
  await new Promise(resolve => setTimeout(resolve, 50));
  button.remove();
  await new Promise(resolve => setTimeout(resolve, 100));
  
  expect(clickHandler).toHaveBeenCalled();
});

test('watch with context parameter (new pattern)', async () => {
  const button = createTestElement('button', 'test-button-ctx');
  const clickHandler = vi.fn();
  
  // New pattern - with context parameter
  watch(button, function* (ctx) {
    // Should work with passed context
    expect(ctx.self()).toBe(button);
    expect(ctx.element).toBe(button);
    expect(ctx.el('span')).toBe(null); // No span child
    
    // Global functions should still work as fallback
    expect(self()).toBe(button);
    
    setState('clicked', false, ctx);
    expect(getState('clicked', ctx)).toBe(false);
    
    cleanup(() => {
      clickHandler();
    }, ctx);
  });
  
  // Trigger cleanup - wait for watch to initialize first
  await new Promise(resolve => setTimeout(resolve, 50));
  button.remove();
  await new Promise(resolve => setTimeout(resolve, 100));
  
  expect(clickHandler).toHaveBeenCalled();
});

test('runOn - ignoring context parameter', async () => {
  const input = createTestElement('input') as HTMLInputElement;
  
  await runOn(input, function* (ctx) {
    expect(self()).toBe(input);
    setState('value', 'test');
    expect(getState('value')).toBe('test');
  });
});

test('runOn with context parameter', async () => {
  const input = createTestElement('input') as HTMLInputElement;
  
  await runOn(input, function* (ctx) {
    expect(ctx.self()).toBe(input);
    expect(ctx.element).toBe(input);
    
    setState('value', 'test', ctx);
    expect(getState('value', ctx)).toBe('test');
    
    // Global functions should also work
    expect(self()).toBe(input);
  });
});

test('string selector with context parameter', async () => {
  createTestElement('button', 'ctx-test');
  const results: HTMLElement[] = [];
  
  watch('button', function* (ctx) {
    results.push(ctx.element);
    expect(ctx.self()).toBe(ctx.element);
    expect(ctx.element.tagName).toBe('BUTTON');
  });
  
  // Add another button
  createTestElement('button', 'ctx-test-2');
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  expect(results).toHaveLength(2);
  expect(results[0].id).toBe('ctx-test');
  expect(results[1].id).toBe('ctx-test-2');
});

test('mixed usage - context parameter and global functions together', async () => {
  const div = createTestElement('div');
  div.innerHTML = '<span>test</span>';
  
  await runOn(div, function* (ctx) {
    // Using context parameter
    const spanViaCtx = ctx.el('span');
    expect(spanViaCtx?.textContent).toBe('test');
    
    // Using global functions (should work as fallback)
    const spanViaGlobal = el('span');
    expect(spanViaGlobal?.textContent).toBe('test');
    
    // Both should return the same element
    expect(spanViaCtx).toBe(spanViaGlobal);
    
    // State management with context
    setState('testKey', 'testValue', ctx);
    expect(getState('testKey', ctx)).toBe('testValue');
    
    // Global state functions should also work
    expect(getState('testKey')).toBe('testValue');
  });
});

test('type safety - element types are preserved', async () => {
  const input = createTestElement('input') as HTMLInputElement;
  input.type = 'email';
  
  await runOn(input, function* (ctx) {
    // TypeScript should infer HTMLInputElement
    expect(ctx.element.type).toBe('email');
    expect(ctx.self().type).toBe('email');
    
    // Should be type-safe for input-specific properties
    ctx.element.value = 'test@example.com';
    expect(ctx.element.value).toBe('test@example.com');
  });
});

test('backwards compatibility - multiple patterns should coexist', async () => {
  const container = createTestElement('div');
  
  let ignorePatternCalled = false;
  let usePatternCalled = false;
  
  // Pattern 1: Accept ctx but ignore it
  watch(container, function* (ctx) {
    ignorePatternCalled = true;
    expect(self()).toBe(container);
  });
  
  // Pattern 2: Use the ctx parameter 
  watch(container, function* (ctx) {
    usePatternCalled = true;
    expect(ctx.element).toBe(container);
    expect(self()).toBe(container); // Global should still work
  });
  
  await new Promise(resolve => setTimeout(resolve, 50));
  
  expect(ignorePatternCalled).toBe(true);
  expect(usePatternCalled).toBe(true);
});
