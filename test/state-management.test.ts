import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { watch, runOn } from '../src/watch';
import {
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
  createState,
  createTypedState,
  createComputed,
  watchState,
  setStateReactive,
  batchStateUpdates,
  createPersistedState,
  clearAllState,
  debugState,
  logState
} from '../src/core/state';
import { self } from '../src/core/generator';

// Test utilities
function createTestElement(tag: string = 'div', id?: string): HTMLElement {
  const element = document.createElement(tag);
  if (id) element.id = id;
  document.body.appendChild(element);
  return element;
}

function waitForMutation(ms: number = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('State Management System', () => {
  beforeEach(async () => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    await runOn(document.body, function* () {
      clearAllState();
    });
  });

  afterEach(async () => {
    document.body.innerHTML = '';
    await runOn(document.body, function* () {
      clearAllState();
    });
  });

  describe('Basic State Operations', () => {
    it('should set and get state', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('testKey', 'testValue');
        expect(getState('testKey')).toBe('testValue');
      });
    });

    it('should handle different data types', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('string', 'hello');
        setState('number', 42);
        setState('boolean', true);
        setState('object', { a: 1, b: 2 });
        setState('array', [1, 2, 3]);
        setState('null', null);
        setState('undefined', undefined);

        expect(getState('string')).toBe('hello');
        expect(getState('number')).toBe(42);
        expect(getState('boolean')).toBe(true);
        expect(getState('object')).toEqual({ a: 1, b: 2 });
        expect(getState('array')).toEqual([1, 2, 3]);
        expect(getState('null')).toBe(null);
        expect(getState('undefined')).toBe(undefined);
      });
    });

    it('should return undefined for non-existent keys', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        expect(getState('nonExistent')).toBe(undefined);
      });
    });

    it('should update state with function', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('counter', 0);
        updateState('counter', (current: number) => current + 1);
        expect(getState('counter')).toBe(1);
        
        updateState('counter', (current: number) => current * 2);
        expect(getState('counter')).toBe(2);
      });
    });

    it('should check if state exists', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        expect(hasState('key')).toBe(false);
        
        setState('key', 'value');
        expect(hasState('key')).toBe(true);
        
        setState('key', null);
        expect(hasState('key')).toBe(true); // null is still a set value
        
        setState('key', undefined);
        expect(hasState('key')).toBe(true); // undefined is still a set value
      });
    });

    it('should delete state', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('key', 'value');
        expect(hasState('key')).toBe(true);
        
        deleteState('key');
        expect(hasState('key')).toBe(false);
        expect(getState('key')).toBe(undefined);
      });
    });
  });

  describe('Element-Scoped State', () => {
    it('should isolate state between elements', async () => {
      const elem1 = createTestElement('div', 'elem1');
      const elem2 = createTestElement('div', 'elem2');
      
      await runOn(elem1, function* () {
        setState('key', 'value1');
      });
      
      await runOn(elem2, function* () {
        setState('key', 'value2');
      });

      await runOn(elem1, function* () {
        expect(getState('key')).toBe('value1');
      });
      
      await runOn(elem2, function* () {
        expect(getState('key')).toBe('value2');
      });
    });

    it('should maintain state across multiple operations on same element', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('counter', 0);
      });

      await runOn(element, function* () {
        const current = getState('counter');
        setState('counter', current + 1);
      });

      await runOn(element, function* () {
        expect(getState('counter')).toBe(1);
      });
    });

    it('should work with watch() and persist across multiple runs', async () => {
      const results: number[] = [];
      
      const controller = watch('.counter', function* () {
        const current = getState('count') || 0;
        setState('count', current + 1);
        results.push(getState('count'));
      });

      const elem1 = createTestElement('div', 'counter1');
      elem1.className = 'counter';
      
      await waitForMutation();
      
      const elem2 = createTestElement('div', 'counter2');
      elem2.className = 'counter';
      
      await waitForMutation();

      // Each element should have its own counter
      expect(results).toEqual([1, 1]);

      controller.destroy();
    });
  });

  describe('Context Parameter Support', () => {
    it('should work with context parameter', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* (ctx) {
        setState('key', 'value', ctx);
        expect(getState('key', ctx)).toBe('value');
        
        // Global methods should also work
        expect(getState('key')).toBe('value');
      });
    });

    it('should maintain consistency between context and global calls', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* (ctx) {
        setState('key1', 'value1', ctx);
        setState('key2', 'value2'); // global call
        
        expect(getState('key1', ctx)).toBe('value1');
        expect(getState('key1')).toBe('value1'); // should be same
        
        expect(getState('key2', ctx)).toBe('value2');
        expect(getState('key2')).toBe('value2'); // should be same
      });
    });
  });

  describe('createState() and Typed State', () => {
    it('should create reactive state object', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        const counter = createState('counter', 0);
        
        expect(counter.get()).toBe(0);
        
        counter.set(5);
        expect(counter.get()).toBe(5);
        expect(getState('counter')).toBe(5);
        
        counter.update(n => n * 2);
        expect(counter.get()).toBe(10);
        expect(getState('counter')).toBe(10);
      });
    });

    it('should handle complex types', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        interface UserState {
          name: string;
          age: number;
          active: boolean;
        }
        
        const userState = createState<UserState>('user', {
          name: 'John',
          age: 30,
          active: true
        });
        
        expect(userState.get().name).toBe('John');
        
        userState.update(user => ({ ...user, age: 31 }));
        expect(userState.get().age).toBe(31);
        expect(userState.get().name).toBe('John'); // other properties preserved
      });
    });

    it('should create typed state with explicit typing', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        const typedCounter = createTypedState<number>('typedCounter', 0);
        
        expect(typedCounter.get()).toBe(0);
        
        typedCounter.set(10);
        expect(typedCounter.get()).toBe(10);
        
        typedCounter.update(n => n + 5);
        expect(typedCounter.get()).toBe(15);
      });
    });
  });

  describe('Computed State', () => {
    it('should create computed state that updates automatically', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        const counter = createState('counter', 5);
        const doubled = createComputed(() => counter.get() * 2, ['counter']);
        
        expect(doubled.get()).toBe(10);
        
        counter.set(10);
        expect(doubled.get()).toBe(20);
      });
    });

    it('should handle multiple dependencies', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('a', 2);
        setState('b', 3);
        
        const sum = createComputed(() => {
          return getState('a') + getState('b');
        }, ['a', 'b']);
        
        expect(sum.get()).toBe(5);
        
        setState('a', 5);
        expect(sum.get()).toBe(8);
        
        setState('b', 7);
        expect(sum.get()).toBe(12);
      });
    });

    it('should handle complex computed calculations', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        const items = createState('items', [1, 2, 3, 4, 5]);
        
        const stats = createComputed(() => {
          const values = items.get();
          return {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            average: values.reduce((a, b) => a + b, 0) / values.length
          };
        }, ['items']);
        
        expect(stats.get()).toEqual({
          count: 5,
          sum: 15,
          average: 3
        });
        
        items.update(arr => [...arr, 6]);
        expect(stats.get()).toEqual({
          count: 6,
          sum: 21,
          average: 3.5
        });
      });
    });
  });

  describe('State Watchers', () => {
    it('should watch state changes', async () => {
      const element = createTestElement('div');
      const changes: Array<{ newVal: any, oldVal: any }> = [];
      
      await runOn(element, function* () {
        watchState('counter', (newVal, oldVal) => {
          changes.push({ newVal, oldVal });
        });
        
        setState('counter', 1);
        setState('counter', 2);
        setState('counter', 3);
      });

      expect(changes).toEqual([
        { newVal: 1, oldVal: undefined },
        { newVal: 2, oldVal: 1 },
        { newVal: 3, oldVal: 2 }
      ]);
    });

    it('should handle multiple watchers on same key', async () => {
      const element = createTestElement('div');
      const watcher1Changes: any[] = [];
      const watcher2Changes: any[] = [];
      
      await runOn(element, function* () {
        watchState('key', (newVal) => {
          watcher1Changes.push(newVal);
        });
        
        watchState('key', (newVal) => {
          watcher2Changes.push(newVal);
        });
        
        setState('key', 'value1');
        setState('key', 'value2');
      });

      expect(watcher1Changes).toEqual(['value1', 'value2']);
      expect(watcher2Changes).toEqual(['value1', 'value2']);
    });

    it('should not trigger watcher if value is the same', async () => {
      const element = createTestElement('div');
      const changes: any[] = [];
      
      await runOn(element, function* () {
        watchState('key', (newVal) => {
          changes.push(newVal);
        });
        
        setState('key', 'value');
        setState('key', 'value'); // Same value
        setState('key', 'different');
        setState('key', 'different'); // Same value again
      });

      expect(changes).toEqual(['value', 'different']);
    });
  });

  describe('Reactive State', () => {
    it('should trigger reactive updates', async () => {
      const element = createTestElement('div');
      const updates: any[] = [];
      
      await runOn(element, function* () {
        watchState('reactive', (newVal) => {
          updates.push(newVal);
        });
        
        setStateReactive('reactive', 'value1');
        setStateReactive('reactive', 'value2');
      });

      expect(updates).toEqual(['value1', 'value2']);
    });
  });

  describe('Batch State Updates', () => {
    it('should batch multiple state updates', async () => {
      const element = createTestElement('div');
      const updates: any[] = [];
      
      await runOn(element, function* () {
        watchState('a', () => updates.push('a changed'));
        watchState('b', () => updates.push('b changed'));
        watchState('c', () => updates.push('c changed'));
        
        batchStateUpdates(() => {
          setState('a', 1);
          setState('b', 2);
          setState('c', 3);
        });
      });

      // All updates should be batched
      expect(updates).toEqual(['a changed', 'b changed', 'c changed']);
    });

    it('should handle nested batch operations', async () => {
      const element = createTestElement('div');
      const updates: any[] = [];
      
      await runOn(element, function* () {
        watchState('key', (val) => updates.push(val));
        
        batchStateUpdates(() => {
          setState('key', 1);
          
          batchStateUpdates(() => {
            setState('key', 2);
            setState('key', 3);
          });
          
          setState('key', 4);
        });
      });

      expect(updates).toEqual([4]); // Only final value should be reported
    });
  });

  describe('Persisted State', () => {
    it('should create persisted state', async () => {
      const element = createTestElement('div');
      
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });
      
      localStorageMock.getItem.mockReturnValue(null);
      
      await runOn(element, function* () {
        const persistedState = createPersistedState('persistedKey', 'defaultValue');
        
        expect(persistedState.get()).toBe('defaultValue');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('persistedKey');
        
        persistedState.set('newValue');
        expect(persistedState.get()).toBe('newValue');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('persistedKey', '"newValue"');
      });
    });

    it('should load from localStorage if available', async () => {
      const element = createTestElement('div');
      
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true
      });
      
      localStorageMock.getItem.mockReturnValue('"existingValue"');
      
      await runOn(element, function* () {
        const persistedState = createPersistedState('existingKey', 'defaultValue');
        
        expect(persistedState.get()).toBe('existingValue');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('existingKey');
      });
    });
  });

  describe('Debug and Logging', () => {
    it('should debug state for an element', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('key1', 'value1');
        setState('key2', 42);
        
        debugState();
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log specific state key', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('testKey', 'testValue');
        
        logState('testKey');
      });

      expect(consoleSpy).toHaveBeenCalledWith('State[testKey]:', 'testValue');
      consoleSpy.mockRestore();
    });
  });

  describe('Memory Management', () => {
    it('should clean up state when element is removed', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('key', 'value');
        expect(getState('key')).toBe('value');
      });

      // Simulate element removal
      element.remove();
      await waitForMutation(100);

      // Create new element and verify state is not carried over
      const newElement = createTestElement('div');
      await runOn(newElement, function* () {
        expect(getState('key')).toBe(undefined);
      });
    });

    it('should clear all state', async () => {
      const elem1 = createTestElement('div');
      const elem2 = createTestElement('div');
      
      await runOn(elem1, function* () {
        setState('key1', 'value1');
      });
      
      await runOn(elem2, function* () {
        setState('key2', 'value2');
      });

      clearAllState();

      await runOn(elem1, function* () {
        expect(getState('key1')).toBe(undefined);
      });
      
      await runOn(elem2, function* () {
        expect(getState('key2')).toBe(undefined);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle circular object references in state', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        const obj: any = { name: 'test' };
        obj.self = obj;
        
        // Should not throw
        setState('circular', obj);
        const retrieved = getState('circular');
        expect(retrieved.name).toBe('test');
        expect(retrieved.self).toBe(retrieved);
      });
    });

    it('should handle very large state objects', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        const largeArray = new Array(10000).fill(0).map((_, i) => ({ id: i, value: `item${i}` }));
        
        setState('largeData', largeArray);
        const retrieved = getState('largeData');
        
        expect(retrieved).toHaveLength(10000);
        expect(retrieved[0]).toEqual({ id: 0, value: 'item0' });
        expect(retrieved[9999]).toEqual({ id: 9999, value: 'item9999' });
      });
    });

    it('should handle concurrent state updates', async () => {
      const element = createTestElement('div');
      
      await runOn(element, function* () {
        setState('counter', 0);
        
        // Simulate concurrent updates
        const promises: Promise<void>[] = [];
        for (let i = 0; i < 100; i++) {
          promises.push(
            new Promise<void>(resolve => {
              setTimeout(() => {
                updateState('counter', (n: number) => n + 1);
                resolve();
              }, Math.random() * 10);
            })
          );
        }
        
        Promise.all(promises).then(() => {
          expect(getState('counter')).toBe(100);
        })
      });
    });

    it('should handle state operations with invalid element context', async () => {
      // Test calling state functions without proper element context
      expect(() => {
        setState('key', 'value');
      }).not.toThrow(); // Should handle gracefully
      
      expect(getState('key')).toBe(undefined);
    });
  });

  describe('Performance', () => {
    it('should handle many state operations efficiently', async () => {
      const element = createTestElement('div');
      
      const startTime = performance.now();
      
      await runOn(element, function* () {
        // Many state operations
        for (let i = 0; i < 1000; i++) {
          setState(`key${i}`, `value${i}`);
        }
        
        for (let i = 0; i < 1000; i++) {
          expect(getState(`key${i}`)).toBe(`value${i}`);
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should handle many watchers efficiently', async () => {
      const element = createTestElement('div');
      const callCounts = new Array(100).fill(0);
      
      await runOn(element, function* () {
        // Set up many watchers
        for (let i = 0; i < 100; i++) {
          watchState(`key${i}`, () => {
            callCounts[i]++;
          });
        }
        
        // Trigger all watchers
        for (let i = 0; i < 100; i++) {
          setState(`key${i}`, `value${i}`);
        }
      });

      // All watchers should have been called exactly once
      expect(callCounts.every(count => count === 1)).toBe(true);
    });
  });
});
