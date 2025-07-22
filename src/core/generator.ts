/**
 * @fileoverview Type-safe generator utilities that maintain element type inference
 *
 * This module provides core utility functions for working within watch generator contexts.
 * All functions maintain strict type safety and provide access to the current element,
 * context information, and cleanup mechanisms.
 */

import type {
  ElementFn,
  TypedGeneratorContext,
  CleanupFunction,
  ElementFromSelector,
  ParentContext,
} from "../types";
import { getCurrentContext, parentContextRegistry } from "./context";

/**
 * Create a typed generator context that maintains element type inference.
 *
 * This function creates a strongly-typed context object that provides type-safe access
 * to the current element and related utilities within a watch generator. It ensures
 * that element types are properly inferred and maintained throughout the generator.
 *
 * @returns TypedGeneratorContext<El> with type-safe element access
 *
 * @example Creating typed context
 * ```typescript
 * import { watch, createTypedGeneratorContext } from 'watch-selector';
 *
 * watch('button', function* () {
 *   const ctx = createTypedGeneratorContext<HTMLButtonElement>();
 *
 *   // ctx.self() is now properly typed as HTMLButtonElement
 *   const button = ctx.self();
 *   button.disabled = true; // Type-safe property access
 * });
 * ```
 *
 * @internal This is typically used internally by the library
 */
export function createTypedGeneratorContext<
  El extends HTMLElement,
>(): TypedGeneratorContext<El> {
  const context = getCurrentContext();
  if (!context) {
    throw new Error(
      "Generator context functions can only be called within a generator",
    );
  }

  const element = context.element as El;

  return {
    // Type-safe self function
    self(): El {
      return element;
    },

    // Type-safe element query
    el<T extends HTMLElement = HTMLElement>(selector: string): T | null {
      return element.querySelector(selector) as T | null;
    },

    // Type-safe element query all
    all<T extends HTMLElement = HTMLElement>(selector: string): T[] {
      return Array.from(element.querySelectorAll(selector)) as T[];
    },

    // Cleanup function
    cleanup(fn: CleanupFunction): void {
      const cleanupRegistry = getCleanupRegistry();
      if (!cleanupRegistry.has(element)) {
        cleanupRegistry.set(element, new Set());
      }
      cleanupRegistry.get(element)!.add(fn);
    },

    // Context access
    ctx() {
      return {
        element,
        selector: context.selector,
        index: context.index,
        array: context.array as readonly El[],
        el: this.el,
        self: this.self,
        cleanup: this.cleanup,
      } as any; // Type assertion needed due to circular reference
    },

    // Direct element access
    get element(): El {
      return element;
    },

    get selector(): string {
      return context.selector;
    },

    get index(): number {
      return context.index;
    },

    get array(): readonly El[] {
      return context.array as readonly El[];
    },
  };
}

// Global cleanup registry
const cleanupRegistry = new WeakMap<HTMLElement, Set<CleanupFunction>>();

// Global registry to store the public API returned by a generator for an element.
const generatorApiRegistry = new WeakMap<HTMLElement, any>();

function getCleanupRegistry(): WeakMap<HTMLElement, Set<CleanupFunction>> {
  return cleanupRegistry;
}

/**
 * Retrieves the public API returned by an element's generator.
 *
 * This function allows access to the public API that was returned by a generator
 * function when it completed execution. This enables communication between
 * different parts of the application through element-specific APIs.
 *
 * @param element The element whose API is being requested
 * @returns The returned API object, or undefined if none exists
 *
 * @example Accessing element API
 * ```typescript
 * import { watch, getContextApi } from 'watch-selector';
 *
 * // Generator that returns an API
 * watch('.component', function* () {
 *   yield text('Component ready');
 *
 *   return {
 *     updateText: (newText: string) => {
 *       // Update component text
 *     },
 *     getData: () => state.data
 *   };
 * });
 *
 * // Later, access the API
 * const element = document.querySelector('.component');
 * const api = getContextApi(element);
 * if (api) {
 *   api.updateText('New content');
 * }
 * ```
 *
 * @internal This is typically used internally by the library
 */
export function getContextApi<T = any>(element: HTMLElement): T | undefined {
  return generatorApiRegistry.get(element);
}

/**
 * Stores the public API returned by an element's generator.
 *
 * This function stores the API object returned by a generator function,
 * making it available for later retrieval through getContextApi. This
 * enables persistent communication channels for element-specific functionality.
 *
 * @param element The element whose API is being stored
 * @param api The API object to store
 *
 * @example Storing generator API
 * ```typescript
 * import { watch, setContextApi } from 'watch-selector';
 *
 * watch('.widget', function* () {
 *   const widgetAPI = {
 *     refresh: () => console.log('Refreshing widget'),
 *     getData: () => ({ status: 'active' }),
 *     destroy: () => console.log('Widget destroyed')
 *   };
 *
 *   // Store the API for external access
 *   setContextApi(self(), widgetAPI);
 *
 *   yield text('Widget initialized');
 *   return widgetAPI;
 * });
 * ```
 *
 * @internal This is typically used internally by the library
 */
export function setContextApi<T = any>(element: HTMLElement, api: T): void {
  generatorApiRegistry.set(element, api);
}

/**
 * # getParentContext() - Access the Parent Watcher's Context
 *
 * From within a child's generator (one initiated by `createChildWatcher`),
 * this function retrieves the element and public API of the direct parent watcher.
 * This creates a parent-to-child communication channel.
 *
 * ## Usage
 *
 * ```typescript
 * // In a child's generator:
 * function* childComponent() {
 *   // Specify the expected parent element and API types for full type safety.
 *   const parent = getParentContext<HTMLFormElement, { submit: () => void }>();
 *
 *   if (parent) {
 *     console.log(`My parent is #${parent.element.id}`);
 *     // Call a method on the parent's API.
 *     parent.api.submit();
 *   }
 * }
 * ```
 *
 * @returns An object containing the parent's `element` and `api`, or `null` if the element is not a watched child.
 */
export function getParentContext<
  ParentEl extends HTMLElement = HTMLElement,
  ParentApi = any,
>(ctx?: TypedGeneratorContext<any>): ParentContext<ParentEl, ParentApi> | null {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error(
      "getParentContext() can only be called within a generator context",
    );
  }

  const childElement = context.element;
  const parentElement = parentContextRegistry.get(childElement);

  if (!parentElement) {
    return null;
  }

  const parentApi = getContextApi<ParentApi>(parentElement);

  return {
    element: parentElement as ParentEl,
    api: parentApi as ParentApi,
  };
}

/**
 * Get the current element within a watch generator context.
 *
 * This function provides type-safe access to the current element being processed
 * by a watch generator. The element type is automatically inferred from the
 * selector used in the watch function.
 *
 * @returns The current element with proper type inference
 *
 * @example Basic element access
 * ```typescript
 * import { watch, self, addClass } from 'watch-selector';
 *
 * watch('button', function* () {
 *   const button = self(); // Typed as HTMLButtonElement
 *   button.disabled = true; // Type-safe property access
 *
 *   yield addClass('processed');
 * });
 * ```
 *
 * @example Using with different element types
 * ```typescript
 * import { watch, self, attr } from 'watch-selector';
 *
 * watch('input[type="email"]', function* () {
 *   const input = self(); // Typed as HTMLInputElement
 *
 *   if (input.validity.valid) {
 *     yield attr('aria-invalid', 'false');
 *   }
 * });
 * ```
 *
 * @example Element property manipulation
 * ```typescript
 * import { watch, self, on } from 'watch-selector';
 *
 * watch('form', function* () {
 *   const form = self(); // Typed as HTMLFormElement
 *
 *   yield on('submit', (event) => {
 *     if (!form.checkValidity()) {
 *       event.preventDefault();
 *     }
 *   });
 * });
 * ```
 */

/**
 * Query for a single element within the current element's scope.
 *
 * This function provides type-safe querying for descendant elements within
 * the current watch context. It's equivalent to element.querySelector() but
 * with better type inference and integration with the watch system.
 *
 * @param selector CSS selector to search for
 * @returns The found element or null if not found
 *
 * @example Basic element querying
 * ```typescript
 * import { watch, el, text, click } from 'watch-selector';
 *
 * watch('.card', function* () {
 *   const button = el<HTMLButtonElement>('.action-btn');
 *   const title = el<HTMLHeadingElement>('h2');
 *
 *   if (button && title) {
 *     yield click(button, () => {
 *       console.log('Clicked:', title.textContent);
 *     });
 *   }
 * });
 * ```
 *
 * @example Form input handling
 * ```typescript
 * import { watch, el, on, text } from 'watch-selector';
 *
 * watch('.form-group', function* () {
 *   const input = el<HTMLInputElement>('input');
 *   const label = el<HTMLLabelElement>('label');
 *   const error = el('.error-message');
 *
 *   if (input && error) {
 *     yield on(input, 'input', () => {
 *       if (input.validity.valid) {
 *         yield text(error, '');
 *       } else {
 *         yield text(error, 'Please enter a valid value');
 *       }
 *     });
 *   }
 * });
 * ```
 */

/**
 * Query for all matching elements within the current element's scope.
 *
 * This function provides type-safe querying for multiple descendant elements
 * within the current watch context. It's equivalent to element.querySelectorAll()
 * but returns a proper array with better type inference.
 *
 * @param selector CSS selector to search for
 * @returns Array of found elements (empty array if none found)
 *
 * @example Processing multiple elements
 * ```typescript
 * import { watch, all, addClass, on } from 'watch-selector';
 *
 * watch('.gallery', function* () {
 *   const images = all<HTMLImageElement>('img');
 *
 *   images.forEach((img, index) => {
 *     yield addClass(img, `image-${index}`);
 *
 *     yield on(img, 'load', () => {
 *       yield addClass(img, 'loaded');
 *     });
 *   });
 * });
 * ```
 *
 * @example Batch operations
 * ```typescript
 * import { watch, all, click, toggleClass } from 'watch-selector';
 *
 * watch('.accordion', function* () {
 *   const panels = all<HTMLElement>('.panel');
 *   const triggers = all<HTMLButtonElement>('.panel-trigger');
 *
 *   triggers.forEach((trigger, index) => {
 *     yield click(trigger, () => {
 *       // Close all panels
 *       panels.forEach(panel => yield removeClass(panel, 'open'));
 *       // Open clicked panel
 *       if (panels[index]) {
 *         yield addClass(panels[index], 'open');
 *       }
 *     });
 *   });
 * });
 * ```
 *
 * @example Form validation
 * ```typescript
 * import { watch, all, on, addClass, removeClass } from 'watch-selector';
 *
 * watch('form', function* () {
 *   const inputs = all<HTMLInputElement>('input[required]');
 *
 *   inputs.forEach(input => {
 *     yield on(input, 'blur', () => {
 *       if (input.validity.valid) {
 *         yield removeClass(input, 'invalid');
 *         yield addClass(input, 'valid');
 *       } else {
 *         yield removeClass(input, 'valid');
 *         yield addClass(input, 'invalid');
 *       }
 *     });
 *   });
 * });
 * ```
 */

/**
 * Register a cleanup function to be called when the element is removed or the watcher is destroyed.
 *
 * This function allows you to register cleanup functions that will be automatically
 * called when the element is removed from the DOM or when the watch system is
 * cleaning up. This is essential for preventing memory leaks and properly releasing
 * resources.
 *
 * @param fn Cleanup function to register
 *
 * @example Event listener cleanup
 * ```typescript
 * import { watch, cleanup } from 'watch-selector';
 *
 * watch('.component', function* () {
 *   const handleResize = () => {
 *     console.log('Window resized');
 *   };
 *
 *   window.addEventListener('resize', handleResize);
 *
 *   // Ensure cleanup when element is removed
 *   cleanup(() => {
 *     window.removeEventListener('resize', handleResize);
 *   });
 * });
 * ```
 *
 * @example Timer cleanup
 * ```typescript
 * import { watch, cleanup, text } from 'watch-selector';
 *
 * watch('.timer', function* () {
 *   let count = 0;
 *
 *   const interval = setInterval(() => {
 *     count++;
 *     // Note: Direct DOM manipulation here for example
 *     self().textContent = `Timer: ${count}`;
 *   }, 1000);
 *
 *   cleanup(() => {
 *     clearInterval(interval);
 *   });
 * });
 * ```
 *
 * @example Resource cleanup
 * ```typescript
 * import { watch, cleanup, getState } from 'watch-selector';
 *
 * watch('.data-viewer', function* () {
 *   const websocket = new WebSocket('ws://localhost:8080');
 *
 *   websocket.onmessage = (event) => {
 *     yield setState('data', JSON.parse(event.data));
 *   };
 *
 *   cleanup(() => {
 *     if (websocket.readyState === WebSocket.OPEN) {
 *       websocket.close();
 *     }
 *   });
 * });
 * ```
 */

/**
 * Get the full context object for the current watch generator.
 *
 * This function provides access to the complete context object, including
 * the element, selector information, array position, and utility functions.
 * This is useful for advanced use cases where you need full context information.
 *
 * @returns The complete context object
 *
 * @example Context information access
 * ```typescript
 * import { watch, ctx, text } from 'watch-selector';
 *
 * watch('.item', function* () {
 *   const context = ctx();
 *
 *   yield text(`
 *     Element: ${context.selector}
 *     Position: ${context.index + 1} of ${context.array.length}
 *   `);
 * });
 * ```
 *
 * @example Conditional behavior based on position
 * ```typescript
 * import { watch, ctx, addClass } from 'watch-selector';
 *
 * watch('.list-item', function* () {
 *   const { index, array } = ctx();
 *
 *   if (index === 0) {
 *     yield addClass('first-item');
 *   }
 *
 *   if (index === array.length - 1) {
 *     yield addClass('last-item');
 *   }
 *
 *   if (index % 2 === 0) {
 *     yield addClass('even-item');
 *   }
 * });
 * ```
 */

// Import the functions from context.ts to avoid duplication
// Import the functions from context.ts to avoid duplication
import {
  self as selfFn,
  el,
  cleanup,
  ctx,
  parent,
  children,
  siblings,
} from "./context";

// Export all imported functions
export { el, cleanup, ctx, parent, children, siblings };

// Export self with the original name for backwards compatibility
export { selfFn as self };

// Add the all function that doesn't exist in context.ts
export function all<T extends HTMLElement = HTMLElement>(
  selector: string,
): T[] {
  const context = getCurrentContext();
  if (!context) {
    throw new Error("all() can only be called within a generator context");
  }
  return Array.from(context.element.querySelectorAll(selector)) as T[];
}

// Type-safe generator creation helpers
export function createGenerator<El extends HTMLElement>(
  generatorFn: (
    ctx: TypedGeneratorContext<El>,
  ) => Generator<ElementFn<El>, void, unknown>,
): () => Generator<ElementFn<El>, void, unknown> {
  return function* () {
    const typedContext = createTypedGeneratorContext<El>();
    yield* generatorFn(typedContext);
  };
}

// Alternative approach: Use a generator with inferred types
export function gen<El extends HTMLElement = HTMLElement>(
  generatorFn: () => Generator<ElementFn<El>, void, unknown>,
): () => Generator<ElementFn<El>, void, unknown> {
  return generatorFn;
}

// Type-safe watch generator that provides typed context
export function watchGenerator<S extends string>(
  _selector: S,
  generatorFn: (
    ctx: TypedGeneratorContext<ElementFromSelector<S>>,
  ) => Generator<ElementFn<ElementFromSelector<S>>, void, unknown>,
): () => Generator<ElementFn<ElementFromSelector<S>>, void, unknown> {
  return function* () {
    const typedContext = createTypedGeneratorContext<ElementFromSelector<S>>();
    yield* generatorFn(typedContext);
  };
}

// Execute cleanup for an element
export function executeElementCleanup(element: HTMLElement): void {
  const cleanups = cleanupRegistry.get(element);
  if (cleanups) {
    cleanups.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error("Error during cleanup:", e);
      }
    });
    cleanupRegistry.delete(element);
  }
}
