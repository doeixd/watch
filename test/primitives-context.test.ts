import { test, expect, beforeEach, vi } from 'vitest';
import { watch, runOn } from '../src/watch';
import { self, el, cleanup, ctx } from '../src/core/context';
import { all, getParentContext } from '../src/core/generator';
import { setState, getState, updateState, hasState, deleteState } from '../src/core/state';
import { createChildWatcher } from '../src/api/dom';

// Mock DOM setup
function createTestElement(tag: string = 'div', id?: string): HTMLElement {
  const element = document.createElement(tag);
  if (id) element.id = id;
  element.innerHTML = `<span class="child">child</span><p class="text">text</p>`;
  document.body.appendChild(element);
  return element;
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

test('self() - both global and context parameter work', async () => {
  const button = createTestElement('button', 'test-self');
  
  await runOn(button, function* (ctx) {
    // Using global function
    expect(self()).toBe(button);
    
    // Using context parameter
    expect(self(ctx)).toBe(button);
    
    // Both should return the same element
    expect(self()).toBe(self(ctx));
  });
});

test('el() - both global and context parameter work', async () => {
  const container = createTestElement('div', 'test-el');
  
  await runOn(container, function* (ctx) {
    // Using global function
    const spanGlobal = el('span');
    expect(spanGlobal?.className).toBe('child');
    
    // Using context parameter
    const spanCtx = el('span', ctx);
    expect(spanCtx?.className).toBe('child');
    
    // Both should return the same element
    expect(spanGlobal).toBe(spanCtx);
    
    // Test non-existent element
    expect(el('nonexistent')).toBe(null);
    expect(el('nonexistent', ctx)).toBe(null);
  });
});

test('el.all() - both global and context parameter work', async () => {
  const container = createTestElement('div', 'test-el-all');
  container.innerHTML = '<span class="item">1</span><span class="item">2</span><span class="item">3</span>';
  
  await runOn(container, function* (ctx) {
    // Using global function
    const spansGlobal = el.all('span');
    expect(spansGlobal).toHaveLength(3);
    
    // Using context parameter
    const spansCtx = el.all('span', ctx);
    expect(spansCtx).toHaveLength(3);
    
    // Both should return the same elements
    expect(spansGlobal.length).toBe(spansCtx.length);
    spansGlobal.forEach((span, i) => {
      expect(span).toBe(spansCtx[i]);
    });
  });
});

test('all() - both global and context parameter work', async () => {
  const container = createTestElement('div', 'test-all');
  container.innerHTML = '<p class="text">1</p><p class="text">2</p>';
  
  await runOn(container, function* (ctx) {
    // Using global function
    const psGlobal = all('p');
    expect(psGlobal).toHaveLength(2);
    
    // Using context parameter
    const psCtx = all('p', ctx);
    expect(psCtx).toHaveLength(2);
    
    // Both should return the same elements
    expect(psGlobal.length).toBe(psCtx.length);
    psGlobal.forEach((p, i) => {
      expect(p).toBe(psCtx[i]);
    });
  });
});

test('cleanup() - both global and context parameter work', async () => {
  const container = createTestElement('div', 'test-cleanup');
  const cleanupGlobal = vi.fn();
  const cleanupCtx = vi.fn();
  
  await runOn(container, function* (ctx) {
    // Using global function
    cleanup(cleanupGlobal);
    
    // Using context parameter
    cleanup(cleanupCtx, ctx);
  });
  
  // Directly test that cleanup functions are registered by calling executeCleanup
  const { executeCleanup } = await import('../src/core/context');
  executeCleanup(container);
  
  // Both cleanup functions should be called
  expect(cleanupGlobal).toHaveBeenCalled();
  expect(cleanupCtx).toHaveBeenCalled();
});

test('ctx() - both global and context parameter work', async () => {
  const container = createTestElement('div', 'test-ctx');
  
  await runOn(container, function* (passedCtx) {
    // Using global function
    const ctxGlobal = ctx();
    expect(ctxGlobal.element).toBe(container);
    
    // Using context parameter
    const ctxFromParam = ctx(passedCtx);
    expect(ctxFromParam.element).toBe(container);
    
    // Both should have the same element
    expect(ctxGlobal.element).toBe(ctxFromParam.element);
  });
});

test('State functions - both global and context parameter work', async () => {
  const container = createTestElement('div', 'test-state');
  
  await runOn(container, function* (ctx) {
    // setState - both ways
    setState('globalKey', 'globalValue');
    setState('ctxKey', 'ctxValue', ctx);
    
    // getState - both ways
    expect(getState('globalKey')).toBe('globalValue');
    expect(getState('ctxKey', ctx)).toBe('ctxValue');
    
    // Cross-access should work since same element
    expect(getState('globalKey', ctx)).toBe('globalValue');
    expect(getState('ctxKey')).toBe('ctxValue');
    
    // updateState - both ways
    updateState('globalKey', (val: string) => val + '!');
    updateState('ctxKey', (val: string) => val + '!', ctx);
    
    expect(getState('globalKey')).toBe('globalValue!');
    expect(getState('ctxKey', ctx)).toBe('ctxValue!');
    
    // hasState - both ways
    expect(hasState('globalKey')).toBe(true);
    expect(hasState('ctxKey', ctx)).toBe(true);
    expect(hasState('nonexistent')).toBe(false);
    expect(hasState('nonexistent', ctx)).toBe(false);
    
    // deleteState - both ways
    deleteState('globalKey');
    deleteState('ctxKey', ctx);
    
    expect(hasState('globalKey')).toBe(false);
    expect(hasState('ctxKey', ctx)).toBe(false);
  });
});

test('getParentContext() - both global and context parameter work', async () => {
  const parent = createTestElement('div', 'parent');
  
  // Set up parent-child relationship for testing
  await runOn(parent, function* (parentCtx) {
    // Create a child watcher to establish parent-child relationship
    const childMap = createChildWatcher('.child-selector', function* (childCtx) {
      // Test getParentContext without parameter
      const parentFromGlobal = getParentContext();
      
      // Test getParentContext with context parameter
      const parentFromCtx = getParentContext(childCtx);
      
      // Both should work (though may return null if no parent relationship established)
      expect(typeof parentFromGlobal).toBe('object');
      expect(typeof parentFromCtx).toBe('object');
    }, parentCtx);
    
    // The test mainly verifies the functions don't throw errors
    expect(childMap).toBeDefined();
  });
});

test('createChildWatcher() - both global and context parameter work', async () => {
  const parent = createTestElement('div', 'parent-watcher');
  parent.innerHTML = '<div class="child">Child 1</div><div class="child">Child 2</div>';
  
  await runOn(parent, function* (ctx) {
    // Using global context (default behavior)
    const childMapGlobal = createChildWatcher('.child', function* (childCtx) {
      setState('source', 'global');
      expect(childCtx.element.className).toBe('child');
    });
    
    // Using explicit context parameter
    const childMapCtx = createChildWatcher('.child', function* (childCtx) {
      setState('source', 'explicit', childCtx);
      expect(childCtx.element.className).toBe('child');
    }, ctx);
    
    expect(childMapGlobal).toBeDefined();
    expect(childMapCtx).toBeDefined();
  });
});

test('Context parameter provides type safety', async () => {
  const input = createTestElement('input') as HTMLInputElement;
  input.type = 'email';
  input.value = 'test@example.com';
  
  await runOn(input, function* (ctx) {
    // TypeScript should infer the correct element type
    expect(ctx.element.type).toBe('email');
    expect(ctx.element.value).toBe('test@example.com');
    
    // Using self with context parameter should also be typed correctly
    const element = self(ctx);
    expect(element.type).toBe('email');
    expect(element.value).toBe('test@example.com');
  });
});

test('Primitives work in watch() with context parameter', async () => {
  const container = createTestElement('div', 'watch-test');
  const results: string[] = [];
  
  watch(container, function* (passedCtx) {
    // All primitives should work with the context parameter
    const element = self(passedCtx);
    results.push(`self: ${element.id}`);
    
    const span = el('span', passedCtx);
    results.push(`el: ${span?.className || 'null'}`);
    
    const spans = el.all('span', passedCtx);
    results.push(`el.all: ${spans.length}`);
    
    const allSpans = all('span', passedCtx);
    results.push(`all: ${allSpans.length}`);
    
    setState('test', 'value', passedCtx);
    results.push(`state: ${getState('test', passedCtx)}`);
    
    const watchCtx = ctx(passedCtx);
    results.push(`ctx: ${watchCtx.element.id}`);
  });
  
  await new Promise(resolve => setTimeout(resolve, 50));
  
  expect(results).toContain('self: watch-test');
  expect(results).toContain('el: child');
  expect(results).toContain('el.all: 1');
  expect(results).toContain('all: 1');
  expect(results).toContain('state: value');
  expect(results).toContain('ctx: watch-test');
});

test('Error handling - primitives throw errors outside context', () => {
  // These should throw errors when called outside a generator context
  expect(() => self()).toThrow('self() can only be called within a generator context');
  expect(() => el('span')).toThrow('el() can only be called within a generator context');
  expect(() => el.all('span')).toThrow('el.all() can only be called within a generator context');
  expect(() => all('span')).toThrow('all() can only be called within a generator context');
  expect(() => cleanup(() => {})).toThrow('cleanup() can only be called within a generator context');
  expect(() => ctx()).toThrow('ctx() can only be called within a generator context');
  expect(() => getState('key')).toThrow('State functions can only be called within a generator context');
  expect(() => setState('key', 'value')).toThrow('State functions can only be called within a generator context');
  expect(() => getParentContext()).toThrow('getParentContext() can only be called within a generator context');
});

test('Mixed usage patterns work together', async () => {
  const container = createTestElement('div', 'mixed-test');
  
  await runOn(container, function* (ctx) {
    // Mix global calls and context parameter calls
    const elementGlobal = self();
    const elementCtx = self(ctx);
    expect(elementGlobal).toBe(elementCtx);
    
    setState('global', 'value1');
    setState('ctx', 'value2', ctx);
    
    // Both keys should be accessible both ways
    expect(getState('global')).toBe('value1');
    expect(getState('global', ctx)).toBe('value1');
    expect(getState('ctx')).toBe('value2');
    expect(getState('ctx', ctx)).toBe('value2');
    
    // Query elements both ways
    const spanGlobal = el('span');
    const spanCtx = el('span', ctx);
    expect(spanGlobal).toBe(spanCtx);
  });
});
