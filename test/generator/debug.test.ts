/**
 * @fileoverview Debug tests for the generator submodule
 *
 * Simple tests to debug the generator module implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { watch } from '../../src/watch';
import { text, getText, addClass, hasClass } from '../../src/generator/dom';
import { getState, setState } from '../../src/generator/state';

describe('Generator Debug Tests', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should test basic generator execution', async () => {
    const button = document.createElement('button');
    container.appendChild(button);

    console.log('Starting test with button:', button);

    try {
      await watch(button, async function* () {
        console.log('Inside generator function');

        // Try the simplest operation first
        console.log('About to yield text operation');
        yield* text('Hello World');
        console.log('Text operation completed');

        // Check if it worked
        console.log('Button text content:', button.textContent);
      });

      expect(button.textContent).toBe('Hello World');
    } catch (error) {
      console.error('Error in test:', error);
      throw error;
    }
  });

  it('should test generator with Operation type', async () => {
    const button = document.createElement('button');
    container.appendChild(button);

    await watch(button, async function* () {
      // Test that our Operations work
      const textOp = text('Test');
      console.log('Text operation:', textOp);
      console.log('Is async iterable?', Symbol.asyncIterator in textOp);

      // Try to iterate manually
      const iterator = textOp[Symbol.asyncIterator]();
      const { value, done } = await iterator.next();
      console.log('First yield value:', value);
      console.log('Is function?', typeof value === 'function');
      console.log('Done?', done);

      // Now try with yield*
      yield* text('Button Text');
    });

    expect(button.textContent).toBe('Button Text');
  });

  it('should test multiple operations', async () => {
    const div = document.createElement('div');
    container.appendChild(div);

    await watch(div, async function* () {
      yield* text('Testing');
      yield* addClass('active');

      const hasActive = yield* hasClass('active');
      console.log('Has active class:', hasActive);

      const content = yield* getText();
      console.log('Content:', content);
    });

    expect(div.textContent).toBe('Testing');
    expect(div.classList.contains('active')).toBe(true);
  });

  it('should test state operations', async () => {
    const div = document.createElement('div');
    container.appendChild(div);

    await watch(div, async function* () {
      yield* setState('test', 'value');
      const value = yield* getState('test');
      console.log('State value:', value);

      yield* text(`State: ${value}`);
    });

    expect(div.textContent).toBe('State: value');
  });

  it('should test the Operation execution flow', async () => {
    const button = document.createElement('button');
    container.appendChild(button);

    // Test the raw Operation function
    const operation = (context: any) => {
      console.log('Operation context:', context);
      context.element.textContent = 'Direct Operation';
    };

    await watch(button, async function* () {
      // Yield the operation directly to see what happens
      yield operation;
    });

    expect(button.textContent).toBe('Direct Operation');
  });

  it('should test Workflow structure', async () => {
    const button = document.createElement('button');
    container.appendChild(button);

    // Create a simple workflow manually
    const simpleWorkflow = async function* () {
      yield (context: any) => {
        context.element.textContent = 'Manual Workflow';
      };
    };

    await watch(button, async function* () {
      yield* simpleWorkflow();
    });

    expect(button.textContent).toBe('Manual Workflow');
  });

  it('should compare manual vs generator module', async () => {
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');
    container.appendChild(div1);
    container.appendChild(div2);

    // Manual approach
    await watch(div1, async function* () {
      const manualWorkflow = async function* () {
        yield (context: any) => {
          context.element.textContent = 'Manual';
        };
      };
      yield* manualWorkflow();
    });

    // Generator module approach
    await watch(div2, async function* () {
      yield* text('Module');
    });

    expect(div1.textContent).toBe('Manual');
    expect(div2.textContent).toBe('Module');
  });
});
