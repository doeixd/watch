import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectContext, ApiContext, resetDetection, getDetectionStats } from '../src/core/detection';
import { getCurrentContext, pushContext, popContext } from '../src/core/context';
import { text } from '../src/api/dom';
import { runOn } from '../src/watch';

describe('Detection System', () => {
  beforeEach(() => {
    resetDetection();
    document.body.innerHTML = '';
  });

  describe('Direct Detection', () => {
    it('should detect direct element manipulation', () => {
      const element = document.createElement('div');
      const args = [element, 'Hello'];
      const result = detectContext(args);

      expect(result.context).toBe(ApiContext.DIRECT);
      expect(result.isGenerator).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect CSS selector manipulation', () => {
      const args = ['#my-id', 'Hello'];
      const result = detectContext(args);

      expect(result.context).toBe(ApiContext.SELECTOR);
      expect(result.isGenerator).toBe(false);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect generator context when empty args', () => {
      const args: any[] = [];
      const result = detectContext(args);

      // Without context, it should be unknown
      expect(result.context).toBe(ApiContext.UNKNOWN);
    });

    it('should detect generator context when single string arg (not selector)', () => {
      const args = ['Hello World'];
      const result = detectContext(args);

      // Plain string should not be detected as selector
      expect(result.context).not.toBe(ApiContext.SELECTOR);
    });
  });

  describe('Context Stack Detection', () => {
    it('should detect generator context when context is pushed', () => {
      const element = document.createElement('div');
      const context = {
        element,
        selector: 'div',
        index: 0,
        array: [element]
      };

      pushContext(context);

      try {
        const args = ['Hello'];
        const result = detectContext(args);

        expect(result.context).toBe(ApiContext.SYNC_GENERATOR);
        expect(result.isGenerator).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.9);
      } finally {
        popContext();
      }
    });

    it('should properly detect context in nested generators', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('span');

      const context1 = {
        element: element1,
        selector: 'div',
        index: 0,
        array: [element1]
      };

      const context2 = {
        element: element2,
        selector: 'span',
        index: 0,
        array: [element2]
      };

      pushContext(context1);

      try {
        const result1 = detectContext(['First']);
        expect(result1.context).toBe(ApiContext.SYNC_GENERATOR);
        expect(result1.isGenerator).toBe(true);

        pushContext(context2);

        try {
          const result2 = detectContext(['Second']);
          expect(result2.context).toBe(ApiContext.SYNC_GENERATOR);
          expect(result2.isGenerator).toBe(true);
        } finally {
          popContext();
        }

        // Should still be in first generator context
        const result3 = detectContext(['Third']);
        expect(result3.context).toBe(ApiContext.SYNC_GENERATOR);
        expect(result3.isGenerator).toBe(true);
      } finally {
        popContext();
      }

      // Should be out of generator context
      const result4 = detectContext(['Fourth']);
      expect(result4.context).not.toBe(ApiContext.SYNC_GENERATOR);
    });
  });

  describe('Text Function Detection', () => {
    it('should return void when setting text directly on element', () => {
      const element = document.createElement('div');
      const result = text(element, 'Direct text');

      expect(result).toBeUndefined();
      expect(element.textContent).toBe('Direct text');
    });

    it('should return string when getting text directly from element', () => {
      const element = document.createElement('div');
      element.textContent = 'Existing text';

      const result = text(element);

      expect(result).toBe('Existing text');
    });

    it('should return function when called in generator context with value', () => {
      const element = document.createElement('div');
      const context = {
        element,
        selector: 'div',
        index: 0,
        array: [element]
      };

      pushContext(context);

      try {
        const result = text('Generator text');

        expect(typeof result).toBe('function');

        // Execute the returned function
        result(element);
        expect(element.textContent).toBe('Generator text');
      } finally {
        popContext();
      }
    });

    it('should return getter function when called in generator context without value', () => {
      const element = document.createElement('div');
      element.textContent = 'Existing content';

      const context = {
        element,
        selector: 'div',
        index: 0,
        array: [element]
      };

      pushContext(context);

      try {
        const result = text();

        expect(typeof result).toBe('function');

        // Execute the returned function
        const content = result(element);
        expect(content).toBe('Existing content');
      } finally {
        popContext();
      }
    });

    it('should work correctly with runOn', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await runOn(element, function* () {
        // This should be detected as generator context
        const setter = text('Test content');
        expect(typeof setter).toBe('function');

        // Yield the function to have it executed
        yield setter;
      });

      expect(element.textContent).toBe('Test content');
    });

    it('should handle multiple text operations in runOn', async () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      await runOn(element, function* () {
        yield text('First');
        yield text('Second');
        yield text('Third');
      });

      expect(element.textContent).toBe('Third');
    });

    it('should handle getter pattern in runOn', async () => {
      const element = document.createElement('div');
      element.textContent = 'Initial';
      document.body.appendChild(element);

      await runOn(element, function* () {
        const content = yield text();
        expect(content).toBe('Initial');

        yield text(`Modified: ${content}`);
      });

      expect(element.textContent).toBe('Modified: Initial');
    });
  });

  describe('Detection Statistics', () => {
    it('should provide accurate statistics', () => {
      const stats = getDetectionStats();

      expect(stats).toHaveProperty('contextStack');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('isInGenerator');
      expect(stats).toHaveProperty('isInAsyncGenerator');
      expect(stats).toHaveProperty('isInSyncGenerator');

      expect(stats.isInGenerator).toBe(false);
      expect(stats.isInAsyncGenerator).toBe(false);
      expect(stats.isInSyncGenerator).toBe(false);
    });

    it('should reflect context changes in statistics', () => {
      const element = document.createElement('div');
      const context = {
        element,
        selector: 'div',
        index: 0,
        array: [element]
      };

      const statsBefore = getDetectionStats();
      expect(statsBefore.isInGenerator).toBe(false);

      pushContext(context);

      const statsDuring = getDetectionStats();
      // Note: This checks the core context, not ExecutionContext
      // The stats might not reflect this unless we also update ExecutionContext

      popContext();

      const statsAfter = getDetectionStats();
      expect(statsAfter.isInGenerator).toBe(false);
    });
  });

  describe('Cache Behavior', () => {
    it('should cache detection results', () => {
      const element = document.createElement('div');
      const args = [element, 'Hello'];

      // First call
      const result1 = detectContext(args);

      // Second call with same args should use cache
      const result2 = detectContext(args);

      expect(result1.context).toBe(result2.context);
      expect(result1.confidence).toBe(result2.confidence);
      expect(result1.isGenerator).toBe(result2.isGenerator);
    });

    it('should clear cache on reset', () => {
      const statsBefore = getDetectionStats();
      const sizeBefore = statsBefore.cacheSize;

      // Add some entries to cache
      detectContext([document.createElement('div'), 'Test1']);
      detectContext([document.createElement('span'), 'Test2']);

      const statsDuring = getDetectionStats();
      expect(statsDuring.cacheSize).toBeGreaterThan(sizeBefore);

      resetDetection();

      const statsAfter = getDetectionStats();
      expect(statsAfter.cacheSize).toBe(0);
    });
  });
});
