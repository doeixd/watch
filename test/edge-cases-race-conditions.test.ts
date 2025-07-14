import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { watch, runOn, run } from '../src/watch';
import { text, addClass, removeClass } from '../src/api/dom';
import { click, on } from '../src/api/events';
import { setState, getState, updateState, watchState } from '../src/core/state';
import { self, cleanup } from '../src/core/generator';

// Test utilities
function createTestElement(tag: string = 'div', attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  document.body.appendChild(element);
  return element;
}

function waitForMutation(ms: number = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createMutationFlood(container: HTMLElement, count: number = 100): void {
  for (let i = 0; i < count; i++) {
    const element = document.createElement('div');
    element.className = 'flood-element';
    element.textContent = `Element ${i}`;
    container.appendChild(element);
  }
}

describe('Edge Cases and Race Conditions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Race Conditions in DOM Mutations', () => {
    it('should handle rapid element addition and removal', async () => {
      const container = createTestElement('div');
      const mountCounts = new Map<HTMLElement, number>();
      const unmountCounts = new Map<HTMLElement, number>();
      
      const controller = watch('.rapid-element', function* () {
        const element = self();
        mountCounts.set(element, (mountCounts.get(element) || 0) + 1);
        
        yield cleanup(() => {
          unmountCounts.set(element, (unmountCounts.get(element) || 0) + 1);
        });
        
        yield addClass('mounted');
      });

      // Rapidly add and remove elements
      const elements: HTMLElement[] = [];
      for (let i = 0; i < 50; i++) {
        const element = document.createElement('div');
        element.className = 'rapid-element';
        element.id = `rapid-${i}`;
        container.appendChild(element);
        elements.push(element);
        
        if (i % 5 === 0) {
          // Remove some elements while still adding others
          const toRemove = elements.splice(0, Math.min(3, elements.length));
          toRemove.forEach(el => el.remove());
        }
      }

      await waitForMutation(100);

      // Remove remaining elements
      elements.forEach(el => el.remove());
      await waitForMutation(100);

      // Each element should be mounted exactly once
      for (const [element, count] of mountCounts) {
        expect(count).toBe(1);
      }

      // All mounted elements should eventually be unmounted
      expect(unmountCounts.size).toBe(mountCounts.size);

      controller.destroy();
    });

    it('should handle concurrent element modifications', async () => {
      const elements = Array.from({ length: 10 }, (_, i) => 
        createTestElement('div', { class: 'concurrent-test', id: `elem-${i}` })
      );

      const controllers: any[] = [];
      
      // Concurrent watch operations
      for (let i = 0; i < 5; i++) {
        const controller = watch(`.concurrent-test`, function* () {
          yield addClass(`class-${i}`);
          yield text(`Text-${i}`);
        });
        controllers.push(controller);
      }

      await waitForMutation(200);

      // Elements should have some classes applied (due to layering)
      elements.forEach(element => {
        // Should have at least some classes applied
        const hasClasses = Array.from({ length: 5 }, (_, i) => 
          element.classList.contains(`class-${i}`)
        ).some(Boolean);
        expect(hasClasses).toBe(true);
        
        // Should have some text content
        expect(element.textContent).toMatch(/^Text-\d$/);
      });

      // Cleanup
      controllers.forEach(controller => controller.destroy());
    });

    it('should handle elements being moved between parents', async () => {
      const parent1 = createTestElement('div');
      const parent2 = createTestElement('div');
      const moveTarget = createTestElement('div', { class: 'moveable' });
      parent1.appendChild(moveTarget);

      let mountCount = 0;
      let unmountCount = 0;

      const controller = watch('.moveable', function* () {
        mountCount++;
        yield addClass('tracked');
        
        yield cleanup(() => {
          unmountCount++;
        });
      });

      await waitForMutation();
      expect(mountCount).toBe(1);

      // Move element to different parent
      parent2.appendChild(moveTarget);
      await waitForMutation();

      // Element behavior may vary - just check it's still in DOM and functional
      expect(moveTarget.classList.contains('tracked')).toBe(true);
      expect(moveTarget.parentElement).toBe(parent2);

      // Remove element completely
      moveTarget.remove();
      await waitForMutation(100);

      // Should be cleaned up
      expect(unmountCount).toBeGreaterThan(0);
      controller.destroy();
    });
  });

  describe('Race Conditions in State Management', () => {
    it('should handle concurrent state updates', async () => {
      const element = createTestElement('div');
      const updateCount = 100;
      const promises: Promise<void>[] = [];

      await runOn(element, function* () {
        setState('counter', 0);
        setState('updates', []);

        // Store element reference for setTimeout callbacks
        const elementRef = self();
        
        for (let i = 0; i < updateCount; i++) {
          promises.push(
            new Promise<void>((resolve) => {
              setTimeout(async () => {
                // Need to run state updates within element context
                await runOn(elementRef, function* () {
                  updateState('counter', (n: number) => n + 1);
                  updateState('updates', (arr: number[]) => [...arr, i]);
                });
                resolve();
              }, Math.random() * 50);
            })
          );
        }
      });

      await Promise.all(promises);
      await waitForMutation(100);

      await runOn(element, function* () {
        const finalCounter = getState('counter');
        const updates = getState('updates');
        
        expect(finalCounter).toBe(updateCount);
        expect(updates).toHaveLength(updateCount);
        
        // All update indices should be present
        const uniqueUpdates = new Set(updates);
        expect(uniqueUpdates.size).toBe(updateCount);
      });
    });

    it('should handle rapid state watcher registrations', async () => {
      const element = createTestElement('div');
      const watcherCalls: number[][] = [];

      await runOn(element, function* () {
        // Register many watchers quickly
        for (let i = 0; i < 50; i++) {
          const watcherIndex = i;
          watcherCalls[watcherIndex] = [];
          
          watchState('testKey', (newVal) => {
            watcherCalls[watcherIndex].push(newVal);
          });
        }

        // Trigger state changes
        for (let i = 0; i < 10; i++) {
          setState('testKey', i);
        }
      });

      await waitForMutation();

      // All watchers should have received all updates
      watcherCalls.forEach((calls, index) => {
        expect(calls).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });
    });

    it('should handle state updates during watcher execution', async () => {
      const element = createTestElement('div');
      const executionOrder: string[] = [];

      await runOn(element, function* () {
        watchState('trigger', (newVal) => {
          executionOrder.push(`watcher1-${newVal}`);
          if (newVal < 3) {
            setState('trigger', newVal + 1);
          }
        });

        watchState('trigger', (newVal) => {
          executionOrder.push(`watcher2-${newVal}`);
        });

        setState('trigger', 0);
      });

      await waitForMutation();

      // Watchers should execute in sequence with recursive updates
      expect(executionOrder).toEqual([
        'watcher1-0', 'watcher2-0',
        'watcher1-1', 'watcher2-1',
        'watcher1-2', 'watcher2-2',
        'watcher1-3', 'watcher2-3'
      ]);
    });
  });

  describe('Race Conditions in Event Handling', () => {
    it('should handle rapid event firing with async handlers', async () => {
      const button = createTestElement('button');
      const executions: { id: number; started: number; completed: number }[] = [];
      let executionId = 0;

      await runOn(button, function* () {
        yield click(async function* () {
          const id = ++executionId;
          const started = performance.now();
          executions.push({ id, started, completed: 0 });
          
          // Simulate async work
          await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
          
          const completed = performance.now();
          const execution = executions.find(e => e.id === id);
          if (execution) {
            execution.completed = completed;
          }
          
          yield text(`Execution ${id}`);
        });
      });

      // Fire many events rapidly
      const clickPromises = [];
      for (let i = 0; i < 20; i++) {
        clickPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              button.click();
              resolve();
            }, i * 2);
          })
        );
      }

      await Promise.all(clickPromises);
      await waitForMutation(200);

      // All executions should complete
      executions.forEach(execution => {
        expect(execution.completed).toBeGreaterThan(execution.started);
      });
      
      expect(executions).toHaveLength(20);
      expect(button.textContent).toMatch(/^Execution \d+$/);
    });

    it('should handle event handler errors without breaking system', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const element = createTestElement('div');
      let successfulCalls = 0;

      await runOn(element, function* () {
        yield click(() => {
          if (Math.random() < 0.5) {
            throw new Error('Random error');
          }
          successfulCalls++;
        });
      });

      // Fire many events
      for (let i = 0; i < 100; i++) {
        element.click();
      }

      await waitForMutation();

      // Some calls should succeed despite errors
      expect(successfulCalls).toBeGreaterThan(0);
      expect(successfulCalls).toBeLessThan(100);
      
      // System should still be responsive
      element.click();
      await waitForMutation();

      consoleSpy.mockRestore();
    });

    it('should handle event delegation with rapidly changing DOM', async () => {
      const container = createTestElement('div');
      const clickCounts = new Map<string, number>();

      await runOn(container, function* () {
        yield on('click', (event) => {
          const target = event.target as HTMLElement;
          const id = target.id;
          clickCounts.set(id, (clickCounts.get(id) || 0) + 1);
        }, { delegate: 'button' });
      });

      // Rapidly add and click buttons
      const operations: Promise<void>[] = [];
      for (let i = 0; i < 50; i++) {
        operations.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              const button = document.createElement('button');
              button.id = `btn-${i}`;
              button.textContent = `Button ${i}`;
              container.appendChild(button);
              
              // Click the button immediately after adding
              setTimeout(() => {
                button.click();
                
                // Remove button after clicking
                setTimeout(() => {
                  button.remove();
                  resolve();
                }, 5);
              }, 1);
            }, i * 2);
          })
        );
      }

      await Promise.all(operations);
      await waitForMutation(100);

      // All buttons should have been clicked exactly once
      for (let i = 0; i < 50; i++) {
        expect(clickCounts.get(`btn-${i}`)).toBe(1);
      }
    });
  });

  describe('Memory Pressure and Cleanup Edge Cases', () => {
    it('should handle cleanup during element removal flood', async () => {
      const container = createTestElement('div');
      const cleanupCalls: string[] = [];

      const controller = watch('.cleanup-test', function* () {
        const element = self();
        
        yield cleanup(() => {
          cleanupCalls.push(element.id);
        });
        
        yield addClass('tracked');
      });

      // Create many elements
      const elements: HTMLElement[] = [];
      for (let i = 0; i < 200; i++) {
        const element = document.createElement('div');
        element.className = 'cleanup-test';
        element.id = `cleanup-${i}`;
        container.appendChild(element);
        elements.push(element);
      }

      await waitForMutation();

      // Remove all elements rapidly
      elements.forEach((element, index) => {
        setTimeout(() => element.remove(), index);
      });

      await waitForMutation(300);

      // All cleanup functions should have been called
      expect(cleanupCalls).toHaveLength(200);
      expect(new Set(cleanupCalls).size).toBe(200); // All unique

      controller.destroy();
    });

    it('should handle memory pressure with large state objects', async () => {
      const elements = Array.from({ length: 100 }, (_, i) => 
        createTestElement('div', { id: `memory-test-${i}` })
      );

      const operations: Promise<void>[] = [];

      elements.forEach((element, index) => {
        operations.push(
          runOn(element, function* () {
            // Create large state object
            const largeData = Array.from({ length: 1000 }, (_, i) => ({
              id: i,
              data: `data-${index}-${i}`,
              nested: {
                values: Array.from({ length: 10 }, (_, j) => `value-${j}`)
              }
            }));

            setState('largeData', largeData);
            setState('elementIndex', index);
            
            yield addClass('memory-test');
          })
        );
      });

      await Promise.all(operations);

      // Verify all elements were processed
      elements.forEach((element, index) => {
        expect(element.classList.contains('memory-test')).toBe(true);
      });

      // Remove elements to trigger cleanup
      elements.forEach(element => element.remove());
      await waitForMutation(200);

      // System should remain responsive
      const testElement = createTestElement('div');
      await runOn(testElement, function* () {
        yield text('Still responsive');
      });

      expect(testElement.textContent).toBe('Still responsive');
    });

    it('should handle circular references in cleanup', async () => {
      const element = createTestElement('div');
      const circularRef: any = { name: 'circular' };
      circularRef.self = circularRef;

      await runOn(element, function* () {
        setState('circular', circularRef);
        
        yield cleanup(() => {
          // Cleanup should handle circular references gracefully
          const stored = getState('circular');
          expect(stored.self).toBe(stored);
        });
      });

      element.remove();
      await waitForMutation(100);
      // Should not throw or hang
    });
  });

  describe('Generator Execution Edge Cases', () => {
    it('should handle generator that yields null/undefined', async () => {
      const element = createTestElement('div');

      await runOn(element, function* () {
        yield null as any;
        yield undefined as any;
        yield Promise.resolve(null) as any;
        yield text('Still working');
      });

      expect(element.textContent).toBe('Still working');
    });

    it('should handle nested generator execution', async () => {
      const element = createTestElement('div');
      const executionOrder: string[] = [];

      function* innerGenerator() {
        executionOrder.push('inner-start');
        yield text('Inner');
        executionOrder.push('inner-end');
      }

      await runOn(element, function* () {
        executionOrder.push('outer-start');
        yield* innerGenerator();
        executionOrder.push('outer-middle');
        yield addClass('nested');
        executionOrder.push('outer-end');
      });

      expect(executionOrder).toEqual([
        'outer-start',
        'inner-start',
        'inner-end',
        'outer-middle',
        'outer-end'
      ]);
      expect(element.textContent).toBe('Inner');
      expect(element.classList.contains('nested')).toBe(true);
    });

    it('should handle generator with infinite yield loop (break)', async () => {
      const element = createTestElement('div');
      let iterations = 0;

      const startTime = performance.now();
      
      await runOn(element, function* () {
        while (iterations < 1000 && performance.now() - startTime < 100) {
          iterations++;
          yield addClass(`iteration-${iterations}`);
          
          if (iterations >= 10) break; // Prevent infinite loop
        }
        yield text(`Completed ${iterations} iterations`);
      });

      expect(iterations).toBe(10);
      expect(element.textContent).toBe('Completed 10 iterations');
      expect(element.classList.contains('iteration-10')).toBe(true);
    });

    it('should handle async generator with rejected promises', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const element = createTestElement('div');

      try {
        await runOn(element, async function* () {
          yield text('Before error');
          await Promise.reject(new Error('Async generator error'));
          yield text('After error'); // Should not execute
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Async generator error');
      }

      expect(element.textContent).toBe('Before error');
      consoleSpy.mockRestore();
    });
  });

  describe('Observer System Edge Cases', () => {
    it('should handle mutation observer disconnect during processing', async () => {
      const container = createTestElement('div');
      let processedCount = 0;

      const controller = watch('.disconnect-test', function* () {
        processedCount++;
        yield addClass('processed');
        
        // Disconnect observer after first few elements
        if (processedCount === 3) {
          controller.destroy();
        }
      });

      // Add elements rapidly
      for (let i = 0; i < 10; i++) {
        const element = document.createElement('div');
        element.className = 'disconnect-test';
        container.appendChild(element);
      }

      await waitForMutation();

      // Only first few elements should be processed
      expect(processedCount).toBe(3);
      
      const processedElements = container.querySelectorAll('.processed');
      expect(processedElements).toHaveLength(3);
    });

    it('should handle DOM mutations in disconnected subtrees', async () => {
      const container = createTestElement('div');
      const disconnectedContainer = document.createElement('div');
      let mountCount = 0;

      const controller = watch('.disconnected-test', function* () {
        mountCount++;
        yield addClass('mounted');
      });

      // Add elements to disconnected container
      for (let i = 0; i < 5; i++) {
        const element = document.createElement('div');
        element.className = 'disconnected-test';
        disconnectedContainer.appendChild(element);
      }

      await waitForMutation();
      expect(mountCount).toBe(0); // Should not trigger for disconnected elements

      // Connect the container
      container.appendChild(disconnectedContainer);
      await waitForMutation();

      expect(mountCount).toBe(5); // Should trigger when connected
      
      controller.destroy();
    });

    it('should handle rapid selector changes', async () => {
      const element = createTestElement('div');
      const mountCounts = new Map<string, number>();

      // Rapidly create and destroy watchers with different selectors
      const operations: Promise<void>[] = [];
      
      for (let i = 0; i < 20; i++) {
        operations.push(
          new Promise<void>(async (resolve) => {
            const className = `rapid-selector-${i}`;
            element.className = className;
            
            const controller = watch(`.${className}`, function* () {
              mountCounts.set(className, (mountCounts.get(className) || 0) + 1);
              yield addClass('processed');
            });
            
            await waitForMutation(5);
            controller.destroy();
            resolve();
          })
        );
      }

      await Promise.all(operations);
      await waitForMutation(100);

      // Each selector should have been triggered exactly once
      for (let i = 0; i < 20; i++) {
        const className = `rapid-selector-${i}`;
        expect(mountCounts.get(className)).toBe(1);
      }
    });
  });

  describe('Integration Edge Cases', () => {
    it('should handle complex interaction between all systems', async () => {
      const container = createTestElement('div');
      const results: { action: string; elementId: string; timestamp: number }[] = [];

      // Complex watcher with state, events, and DOM manipulation
      const controller = watch('.complex-test', function* () {
        const element = self();
        const startTime = performance.now();
        
        setState('clickCount', 0);
        setState('createdAt', startTime);
        
        results.push({ 
          action: 'mounted', 
          elementId: element.id, 
          timestamp: performance.now() 
        });

        yield addClass('complex-mounted');
        
        yield click(function* () {
          const count = getState('clickCount') + 1;
          setState('clickCount', count);
          
          results.push({ 
            action: 'clicked', 
            elementId: element.id, 
            timestamp: performance.now() 
          });
          
          yield text(`Clicked ${count} times`);
          yield addClass(`click-${count}`);
        });

        watchState('clickCount', (newCount) => {
          results.push({ 
            action: 'state-changed', 
            elementId: element.id, 
            timestamp: performance.now() 
          });
        });

        yield cleanup(() => {
          results.push({ 
            action: 'unmounted', 
            elementId: element.id, 
            timestamp: performance.now() 
          });
        });
      });

      // Rapidly create, interact with, and remove elements
      const elements: HTMLElement[] = [];
      for (let i = 0; i < 10; i++) {
        const element = document.createElement('button');
        element.className = 'complex-test';
        element.id = `complex-${i}`;
        container.appendChild(element);
        elements.push(element);
      }

      await waitForMutation();

      // Interact with elements
      elements.forEach((element, index) => {
        for (let click = 0; click < 3; click++) {
          setTimeout(() => element.click(), index * 10 + click * 5);
        }
      });

      await waitForMutation(200);

      // Remove elements
      elements.forEach((element, index) => {
        setTimeout(() => element.remove(), index * 5);
      });

      await waitForMutation(200);

      // Verify complete lifecycle for all elements
      for (let i = 0; i < 10; i++) {
        const elementId = `complex-${i}`;
        const elementResults = results.filter(r => r.elementId === elementId);
        
        expect(elementResults.find(r => r.action === 'mounted')).toBeDefined();
        expect(elementResults.find(r => r.action === 'unmounted')).toBeDefined();
        expect(elementResults.filter(r => r.action === 'clicked')).toHaveLength(3);
        expect(elementResults.filter(r => r.action === 'state-changed')).toHaveLength(3);
      }

      controller.destroy();
    });

    it('should maintain stability under extreme load', async () => {
      const container = createTestElement('div');
      let totalOperations = 0;
      
      // Create extreme load scenario
      const controllers: any[] = [];
      
      // Multiple watchers
      for (let i = 0; i < 10; i++) {
        controllers.push(
          watch(`.load-test-${i}`, function* () {
            totalOperations++;
            yield addClass(`watcher-${i}`);
            yield setState('watcherId', i);
            
            yield click(() => {
              totalOperations++;
              updateState('clickCount', (n: number) => (n || 0) + 1);
            });
            
            yield cleanup(() => {
              totalOperations++;
            });
          })
        );
      }

      // Massive DOM manipulation
      const operations: Promise<void>[] = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              const element = document.createElement('div');
              element.className = `load-test-${i % 10}`;
              element.id = `load-${i}`;
              container.appendChild(element);
              
              // Immediate interaction
              element.click();
              
              // Quick removal
              setTimeout(() => {
                element.remove();
                resolve();
              }, 10);
            }, i);
          })
        );
      }

      const startTime = performance.now();
      await Promise.all(operations);
      const endTime = performance.now();

      await waitForMutation(300);

      // System should remain responsive and complete all operations
      expect(totalOperations).toBeGreaterThan(200); // Mount + click + unmount for most elements
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Cleanup
      controllers.forEach(controller => controller.destroy());
    });
  });
});
