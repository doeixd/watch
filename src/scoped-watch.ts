// Scoped Watch API - Create watchers scoped to specific parent elements

import { createScopedWatcher, createScopedWatcherWithController, type ScopedWatchOptions, type ScopedWatcher } from './core/scoped-observer';
import type { ElementFromSelector, ElementFn, ElementMatcher, WatchController } from './types';

/**
 * Creates a scoped watcher that observes elements matching a selector within a specific parent element.
 * 
 * **Features:**
 * - Creates its own MutationObserver scoped to the parent element
 * - No event delegation - direct DOM observation
 * - Full type safety with selector-based element type inference
 * - Automatic cleanup when parent is removed from DOM
 * - Integrates seamlessly with all watch library primitives
 * 
 * @example
 * ```typescript
 * // Basic scoped watching
 * const container = document.querySelector('#container');
 * const watcher = scopedWatch(container, 'button', function* () {
 *   yield addClass('scoped-button');
 *   yield text('Found by scoped watch!');
 * });
 * 
 * // With custom options
 * const formWatcher = scopedWatch(form, 'input', function* () {
 *   const currentValue = yield* getValue();
 *   yield* setValue(currentValue.toUpperCase());
 * }, {
 *   attributes: true,
 *   attributeFilter: ['value']
 * });
 * 
 * // Full context integration
 * const listWatcher = scopedWatch(list, 'li', function* () {
 *   const element = yield* self();
 *   const siblings = yield* all('li');
 *   yield addClass(`item-${siblings.indexOf(element)}`);
 * });
 * ```
 * 
 * @param parent - The parent element to scope the watcher to
 * @param selector - CSS selector to match elements within the parent
 * @param generator - Generator function to execute for each matching element
 * @param options - Optional configuration for the MutationObserver
 * @returns A ScopedWatcher instance with control methods
 */
export function scopedWatch<S extends string>(
  parent: HTMLElement,
  selector: S,
  generator: () => Generator<ElementFn<ElementFromSelector<S>>, any, unknown>,
  options?: ScopedWatchOptions
): ScopedWatcher;

/**
 * Creates a scoped watcher with async generator support.
 * 
 * @example
 * ```typescript
 * const watcher = scopedWatch(container, '.async-item', async function* () {
 *   yield* delay(100);
 *   yield addClass('processed');
 *   const data = yield* fetch('/api/data');
 *   yield* updateContent(data);
 * });
 * ```
 */
export function scopedWatch<S extends string>(
  parent: HTMLElement,
  selector: S,
  generator: () => AsyncGenerator<ElementFn<ElementFromSelector<S>>, any, unknown>,
  options?: ScopedWatchOptions
): ScopedWatcher;

/**
 * Creates a scoped watcher with a matcher function instead of a selector.
 * 
 * @example
 * ```typescript
 * const watcher = scopedWatch(container, 
 *   (el): el is HTMLButtonElement => el.tagName === 'BUTTON' && el.dataset.action === 'submit',
 *   function* () {
 *     yield addClass('submit-button');
 *   }
 * );
 * ```
 */
export function scopedWatch<El extends HTMLElement>(
  parent: HTMLElement,
  matcher: ElementMatcher<El>,
  generator: () => Generator<ElementFn<El>, any, unknown>,
  options?: ScopedWatchOptions
): ScopedWatcher;

/**
 * Creates a scoped watcher with async generator and matcher function.
 */
export function scopedWatch<El extends HTMLElement>(
  parent: HTMLElement,
  matcher: ElementMatcher<El>,
  generator: () => AsyncGenerator<ElementFn<El>, any, unknown>,
  options?: ScopedWatchOptions
): ScopedWatcher;

// Implementation
export function scopedWatch<S extends string>(
  parent: HTMLElement,
  selectorOrMatcher: S | ElementMatcher<any>,
  generator: () => Generator<any, any, unknown> | AsyncGenerator<any, any, unknown>,
  options: ScopedWatchOptions = {}
): ScopedWatcher {
  return createScopedWatcher(parent, selectorOrMatcher, generator, options);
}

/**
 * Creates multiple scoped watchers for the same parent element.
 * 
 * **Use Cases:**
 * - Initialize multiple types of elements within a container
 * - Apply different behaviors to different selectors in the same scope
 * - Batch setup for complex UI components
 * 
 * @example
 * ```typescript
 * const dashboard = document.querySelector('#dashboard');
 * const watchers = scopedWatchBatch(dashboard, [
 *   {
 *     selector: '.chart',
 *     generator: function* () {
 *       yield addClass('chart-initialized');
 *       yield* initializeChart();
 *     }
 *   },
 *   {
 *     selector: '.widget',
 *     generator: function* () {
 *       yield addClass('widget-ready');
 *       yield* setupWidget();
 *     },
 *     options: { attributes: true }
 *   },
 *   {
 *     selector: '.tooltip',
 *     generator: function* () {
 *       yield* setupTooltip();
 *     }
 *   }
 * ]);
 * 
 * // Later cleanup all watchers
 * watchers.forEach(watcher => watcher.disconnect());
 * ```
 * 
 * @param parent - The parent element to scope all watchers to
 * @param watchers - Array of watcher configurations
 * @returns Array of ScopedWatcher instances
 */
export function scopedWatchBatch(
  parent: HTMLElement,
  watchers: WatcherConfig[]
): ScopedWatcher[] {
  return watchers.map(({ selector, generator, options }) => 
    createScopedWatcher(parent, selector, generator, options)
  );
}

type WatcherConfig = {
  selector: string;
  generator: () => Generator<ElementFn<any>, any, unknown> | AsyncGenerator<ElementFn<any>, any, unknown>;
  options?: ScopedWatchOptions;
};

/**
 * Creates a scoped watcher that automatically disconnects after a timeout.
 * 
 * **Use Cases:**
 * - Temporary watchers for animations or transitions
 * - Auto-cleanup for development/debugging
 * - Time-limited feature activation
 * 
 * @example
 * ```typescript
 * // Watch for 5 seconds then auto-disconnect
 * const tempWatcher = scopedWatchTimeout(container, '.temp-element', function* () {
 *   yield addClass('temporary-highlight');
 *   yield* animateIn();
 * }, 5000);
 * 
 * // Watch during page load only
 * const loadWatcher = scopedWatchTimeout(document.body, '.loading-spinner', function* () {
 *   yield addClass('spinner-active');
 * }, 10000); // 10 second max
 * ```
 * 
 * @param parent - The parent element to scope the watcher to
 * @param selector - CSS selector to match elements
 * @param generator - Generator function to execute for each matching element
 * @param timeoutMs - Timeout in milliseconds after which to disconnect
 * @param options - Optional configuration for the MutationObserver
 * @returns A ScopedWatcher instance that will auto-disconnect
 */
export function scopedWatchTimeout<S extends string>(
  parent: HTMLElement,
  selector: S,
  generator: () => Generator<ElementFn<ElementFromSelector<S>>, any, unknown>,
  timeoutMs: number,
  options?: ScopedWatchOptions
): ScopedWatcher;

export function scopedWatchTimeout<S extends string>(
  parent: HTMLElement,
  selector: S,
  generator: () => AsyncGenerator<ElementFn<ElementFromSelector<S>>, any, unknown>,
  timeoutMs: number,
  options?: ScopedWatchOptions
): ScopedWatcher;

export function scopedWatchTimeout(
  parent: HTMLElement,
  selector: string,
  generator: () => Generator<any, any, unknown> | AsyncGenerator<any, any, unknown>,
  timeoutMs: number,
  options?: ScopedWatchOptions
): ScopedWatcher {
  const watcher = createScopedWatcher(parent, selector, generator, options);
  
  setTimeout(() => {
    if (watcher.isActive()) {
      watcher.disconnect();
    }
  }, timeoutMs);
  
  return watcher;
}

/**
 * Creates a scoped watcher that automatically disconnects after processing N matching elements.
 * 
 * **Use Cases:**
 * - Process only the first few elements that match
 * - One-time initialization for specific elements
 * - Limit processing to prevent performance issues
 * 
 * @example
 * ```typescript
 * // Process only the first 3 items
 * const firstThreeWatcher = scopedWatchOnce(list, '.item', function* () {
 *   yield addClass('first-batch');
 *   yield* setupSpecialBehavior();
 * }, 3);
 * 
 * // One-time setup for a single element
 * const singleWatcher = scopedWatchOnce(container, '.hero-banner', function* () {
 *   yield addClass('hero-initialized');
 *   yield* setupHeroAnimation();
 * }); // defaults to 1 match
 * 
 * // Process first 5 buttons for A/B testing
 * const testWatcher = scopedWatchOnce(form, 'button[type="submit"]', function* () {
 *   yield addClass('test-variant-a');
 *   yield* setupTracking();
 * }, 5);
 * ```
 * 
 * @param parent - The parent element to scope the watcher to
 * @param selector - CSS selector to match elements
 * @param generator - Generator function to execute for each matching element
 * @param maxMatches - Maximum number of elements to process before disconnecting (default: 1)
 * @param options - Optional configuration for the MutationObserver
 * @returns A ScopedWatcher instance that will auto-disconnect after N matches
 */
export function scopedWatchOnce<S extends string>(
  parent: HTMLElement,
  selector: S,
  generator: () => Generator<ElementFn<ElementFromSelector<S>>, any, unknown>,
  maxMatches?: number,
  options?: ScopedWatchOptions
): ScopedWatcher;

export function scopedWatchOnce<S extends string>(
  parent: HTMLElement,
  selector: S,
  generator: () => AsyncGenerator<ElementFn<ElementFromSelector<S>>, any, unknown>,
  maxMatches?: number,
  options?: ScopedWatchOptions
): ScopedWatcher;

export function scopedWatchOnce(
  parent: HTMLElement,
  selector: string,
  generator: () => Generator<any, any, unknown> | AsyncGenerator<any, any, unknown>,
  maxMatches: number = 1,
  options?: ScopedWatchOptions
): ScopedWatcher {
  let matchCount = 0;
  
  const wrappedGenerator = () => {
    const gen = generator();
    return (function* () {
      yield* gen;
      matchCount++;
      if (matchCount >= maxMatches) {
        // Use setTimeout to disconnect after current execution
        setTimeout(() => watcher.disconnect(), 0);
      }
    })();
  };
  
  const watcher = createScopedWatcher(parent, selector, wrappedGenerator, options);
  return watcher;
}

/**
 * Creates a scoped watcher with WatchController integration for advanced behavior layering.
 * This enables all controller features like layer(), getInstances(), and destroy() within scoped contexts.
 * 
 * @example
 * ```typescript
 * const container = document.querySelector('#container');
 * const scopedController = scopedWatchWithController(container, 'button', function* () {
 *   yield addClass('base-behavior');
 *   yield text('Initial setup');
 * });
 * 
 * // Layer additional behaviors
 * scopedController.controller.layer(function* () {
 *   yield addClass('enhanced-behavior');
 *   yield on('click', () => console.log('Enhanced click handler'));
 * });
 * 
 * // Inspect instances
 * const instances = scopedController.controller.getInstances();
 * console.log(`Managing ${instances.size} scoped elements`);
 * ```
 */
export function scopedWatchWithController<S extends string>(
  parent: HTMLElement,
  selector: S,
  generator: () => Generator<ElementFn<ElementFromSelector<S>>, any, unknown>,
  options?: ScopedWatchOptions
): ScopedWatcher & { controller: WatchController<ElementFromSelector<S>> } {
  return createScopedWatcherWithController(parent, selector, generator, options);
}

/**
 * Creates a scoped watcher with controller support and async generator.
 */
export function scopedWatchWithController<S extends string>(
  parent: HTMLElement,
  selector: S,
  generator: () => AsyncGenerator<ElementFn<ElementFromSelector<S>>, any, unknown>,
  options?: ScopedWatchOptions
): ScopedWatcher & { controller: WatchController<ElementFromSelector<S>> } {
  return createScopedWatcherWithController(parent, selector, generator, options);
}

/**
 * Creates a scoped watcher with controller support using a matcher function.
 */
export function scopedWatchWithController<El extends HTMLElement>(
  parent: HTMLElement,
  matcher: ElementMatcher<El>,
  generator: () => Generator<ElementFn<El>, any, unknown>,
  options?: ScopedWatchOptions
): ScopedWatcher & { controller: WatchController<El> };

// Implementation
export function scopedWatchWithController(
  parent: HTMLElement,
  selectorOrMatcher: string | ElementMatcher<any>,
  generator: () => Generator<any, any, unknown> | AsyncGenerator<any, any, unknown>,
  options?: ScopedWatchOptions
): ScopedWatcher & { controller: WatchController<any> } {
  return createScopedWatcherWithController(parent, selectorOrMatcher, generator, options);
}

/**
 * Creates multiple scoped watchers with controller support.
 * Each watcher gets its own controller for independent behavior layering.
 * 
 * @example
 * ```typescript
 * const dashboard = document.querySelector('#dashboard');
 * const controllers = scopedWatchBatchWithController(dashboard, [
 *   {
 *     selector: '.chart',
 *     generator: function* () {
 *       yield addClass('chart-base');
 *     }
 *   },
 *   {
 *     selector: '.widget',
 *     generator: function* () {
 *       yield addClass('widget-base');
 *     }
 *   }
 * ]);
 * 
 * // Add layers to specific controllers
 * controllers[0].controller.layer(function* () {
 *   yield addClass('chart-enhanced');
 * });
 * ```
 */
export function scopedWatchBatchWithController(
  parent: HTMLElement,
  watchers: WatcherConfigWithController[]
): (ScopedWatcher & { controller: WatchController<any> })[] {
  return watchers.map(({ selector, generator, options }) => 
    createScopedWatcherWithController(parent, selector, generator, options)
  );
}

type WatcherConfigWithController = {
  selector: string;
  generator: () => Generator<ElementFn<any>, any, unknown> | AsyncGenerator<ElementFn<any>, any, unknown>;
  options?: ScopedWatchOptions;
};

// Re-export types for convenience
export type { ScopedWatchOptions, ScopedWatcher } from './core/scoped-observer';
