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
  Workflow,
  Operation,
  WatchContext,
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
    // Type-safe self function - supports both direct call and yield*
    self(): El {
      return element;
    },

    // Type-safe element query - supports both direct call and yield*
    el<T extends HTMLElement = HTMLElement>(selector: string): T | null {
      return element.querySelector(selector) as T | null;
    },

    // Type-safe element query all - supports both direct call and yield*
    all<T extends HTMLElement = HTMLElement>(selector: string): T[] {
      return Array.from(element.querySelectorAll(selector)) as T[];
    },

    // Cleanup function - supports both direct call and yield*
    cleanup(fn: CleanupFunction): void {
      const cleanupRegistry = getCleanupRegistry();
      if (!cleanupRegistry.has(element)) {
        cleanupRegistry.set(element, new Set());
      }
      cleanupRegistry.get(element)!.add(fn);
    },

    // Context access - supports both direct call and yield*
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

export function getCleanupRegistry(): WeakMap<
  HTMLElement,
  Set<CleanupFunction>
> {
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
// Import existing functions to avoid redeclaration
import {
  self as contextSelf,
  el as contextEl,
  all as contextAll,
  cleanup as contextCleanup,
  ctx as contextCtx,
  parent,
  children,
  siblings,
} from "./context";

// Export all imported functions from context.ts
export { parent, children, siblings };

// ==================== WORKFLOW-ENABLED GENERATOR UTILITIES ====================

/**
 * Get the current element in a type-safe way with yield* support.
 *
 * @returns The current element or a Workflow that yields it
 *
 * @example Direct usage in generator
 * ```typescript
 * watch('button', function* () {
 *   const button = self();
 *   button.disabled = true;
 * });
 * ```
 *
 * @example Using yield* for workflow composition
 * ```typescript
 * watch('button', function* () {
 *   const button = yield* self();
 *   button.disabled = true;
 * });
 * ```
 *
 * @example With enhanced context
 * ```typescript
 * watch('button', function* (ctx) {
 *   const button = yield* ctx.self();
 *   button.disabled = true;
 * });
 * ```
 */
export function self<El extends HTMLElement = HTMLElement>(
  ctx?: TypedGeneratorContext<El>,
): El {
  return contextSelf(ctx);
}

/**
 * Generator version of self() for yield* usage.
 *
 * Returns a Workflow that yields the current element. Use this when you need
 * to get the current element within a generator using the yield* pattern.
 *
 * @template El - The element type (inferred from context)
 * @param ctx - Optional context (usually auto-detected)
 * @returns Workflow that yields the current element
 *
 * @example Basic yield* usage
 * ```typescript
 * watch('.button', function* () {
 *   const element = yield* self.gen<HTMLButtonElement>();
 *   console.log('Processing button:', element.tagName);
 * });
 * ```
 *
 * @example Type inference from selector
 * ```typescript
 * watch('button', function* () {
 *   const button = yield* self.gen(); // Automatically typed as HTMLButtonElement
 *   button.click(); // Type-safe button methods
 * });
 * ```
 */
self.gen = function <El extends HTMLElement = HTMLElement>(
  _ctx?: TypedGeneratorContext<El>,
): Workflow<El> {
  return (function* (): Generator<Operation<El>, El, any> {
    const op: Operation<El> = (ctx: WatchContext) => ctx.element as El;
    const element = yield op;
    return element;
  })();
};

/**
 * Query for a child element with type safety and yield* support.
 *
 * @param selector - CSS selector to query
 * @returns The found element (or null) or a Workflow that yields it
 *
 * @example Direct usage
 * ```typescript
 * watch('.card', function* () {
 *   const button = el<HTMLButtonElement>('.action-btn');
 *   if (button) button.click();
 * });
 * ```
 *
 * @example Using yield* pattern
 * ```typescript
 * watch('.card', function* () {
 *   const button = yield* el<HTMLButtonElement>('.action-btn');
 *   if (button) button.click();
 * });
 * ```
 *
 * @example With enhanced context
 * ```typescript
 * watchEnhanced('.card', function* (ctx) {
 *   const button = yield* ctx.el<HTMLButtonElement>('.action-btn');
 *   if (button) button.click();
 * });
 * ```
 */
export function el<T extends HTMLElement = HTMLElement>(
  selector: string,
  ctx?: TypedGeneratorContext<any>,
): T | null {
  return contextEl<T>(selector, ctx) as T | null;
}

/**
 * Generator version of el() for yield* usage.
 *
 * Returns a Workflow that yields the first child element matching the selector.
 * Use this when you need to query for elements within a generator using yield*.
 *
 * @template T - The expected element type
 * @param selector - CSS selector to query
 * @param ctx - Optional context (usually auto-detected)
 * @returns Workflow that yields the found element or null
 *
 * @example Query for specific element types
 * ```typescript
 * watch('.card', function* () {
 *   const button = yield* el.gen<HTMLButtonElement>('.action-btn');
 *   const input = yield* el.gen<HTMLInputElement>('.name-input');
 *
 *   if (button && input) {
 *     // Type-safe element manipulation
 *     button.disabled = !input.value;
 *   }
 * });
 * ```
 *
 * @example Safe navigation with null checks
 * ```typescript
 * watch('.container', function* () {
 *   const optional = yield* el.gen<HTMLSpanElement>('.optional-element');
 *   if (optional) {
 *     yield* text(optional, 'Found!');
 *   }
 * });
 * ```
 */
el.gen = function <T extends HTMLElement = HTMLElement>(
  selector: string,
  _ctx?: TypedGeneratorContext<any>,
): Workflow<T | null> {
  return (function* (): Generator<Operation<T | null>, T | null, any> {
    const op: Operation<T | null> = (ctx: WatchContext) =>
      ctx.element.querySelector(selector) as T | null;
    const element = yield op;
    return element;
  })();
};

// Add el.all alias for backward compatibility
(el as any).all = all;

/**
 * Query for all matching child elements with type safety and yield* support.
 *
 * @param selector - CSS selector to query
 * @returns Array of matching elements or a Workflow that yields them
 *
 * @example Direct usage
 * ```typescript
 * watch('.container', function* () {
 *   const items = all<HTMLLIElement>('.item');
 *   items.forEach(item => item.classList.add('processed'));
 * });
 * ```
 *
 * @example Using yield* pattern
 * ```typescript
 * watch('.container', function* () {
 *   const items = yield* all<HTMLLIElement>('.item');
 *   items.forEach(item => item.classList.add('processed'));
 * });
 * ```
 *
 * @example With enhanced context
 * ```typescript
 * watchEnhanced('.container', function* (ctx) {
 *   const items = yield* ctx.all<HTMLLIElement>('.item');
 *   items.forEach(item => item.classList.add('processed'));
 * });
 * ```
 */
export function all<T extends HTMLElement = HTMLElement>(
  selector: string,
  ctx?: TypedGeneratorContext<any>,
): T[] {
  return contextAll(selector, ctx);
}

/**
 * Generator version of all() for yield* usage.
 *
 * Returns a Workflow that yields all child elements matching the selector.
 * Use this when you need to query for multiple elements within a generator using yield*.
 *
 * @template T - The expected element type
 * @param selector - CSS selector to query
 * @param ctx - Optional context (usually auto-detected)
 * @returns Workflow that yields an array of found elements
 *
 * @example Process multiple elements
 * ```typescript
 * watch('.container', function* () {
 *   const items = yield* all.gen<HTMLLIElement>('.item');
 *
 *   for (const item of items) {
 *     yield* addClass(item, 'processed');
 *     yield* attr(item, 'data-index', items.indexOf(item).toString());
 *   }
 * });
 * ```
 *
 * @example Batch operations with type safety
 * ```typescript
 * watch('.form', function* () {
 *   const inputs = yield* all.gen<HTMLInputElement>('input[required]');
 *
 *   inputs.forEach(input => {
 *     if (!input.value) {
 *       input.classList.add('error');
 *     }
 *   });
 * });
 * ```
 */
all.gen = function <T extends HTMLElement = HTMLElement>(
  selector: string,
  _ctx?: TypedGeneratorContext<any>,
): Workflow<T[]> {
  return (function* (): Generator<Operation<T[]>, T[], any> {
    const op: Operation<T[]> = (ctx: WatchContext) =>
      Array.from(ctx.element.querySelectorAll(selector)) as T[];
    const elements = yield op;
    return elements;
  })();
};

/**
 * Register a cleanup function to be called when the element is removed.
 * Supports both direct call and yield* patterns.
 *
 * @param fn - Cleanup function to register
 *
 * @example Direct usage
 * ```typescript
 * watch('.widget', function* () {
 *   const interval = setInterval(() => update(), 1000);
 *   cleanup(() => clearInterval(interval));
 * });
 * ```
 *
 * @example Using yield* pattern
 * ```typescript
 * watch('.widget', function* () {
 *   const interval = setInterval(() => update(), 1000);
 *   yield* cleanup(() => clearInterval(interval));
 * });
 * ```
 *
 * @example With enhanced context
 * ```typescript
 * watchEnhanced('.widget', function* (ctx) {
 *   const interval = setInterval(() => update(), 1000);
 *   yield* ctx.cleanup(() => clearInterval(interval));
 * });
 * ```
 */
export function cleanup(
  fn: CleanupFunction,
  ctx?: TypedGeneratorContext<any>,
): void {
  contextCleanup(fn, ctx);
}

/**
 * Generator version of cleanup() for yield* usage.
 *
 * Returns a Workflow that registers a cleanup function to be called when the element
 * is removed from the DOM. Use this when you need to register cleanup functions
 * within a generator using the yield* pattern.
 *
 * @param fn - Cleanup function to register
 * @param ctx - Optional context (usually auto-detected)
 * @returns Workflow that registers the cleanup function
 *
 * @example Register resource cleanup
 * ```typescript
 * watch('.component', function* () {
 *   const timer = setInterval(() => console.log('tick'), 1000);
 *
 *   yield* cleanup.gen(() => {
 *     clearInterval(timer);
 *     console.log('Timer cleaned up');
 *   });
 * });
 * ```
 *
 * @example Multiple cleanup handlers
 * ```typescript
 * watch('.widget', function* () {
 *   const observer = new ResizeObserver(() => {});
 *   const subscription = eventBus.subscribe('update', handler);
 *
 *   yield* cleanup.gen(() => observer.disconnect());
 *   yield* cleanup.gen(() => subscription.unsubscribe());
 * });
 * ```
 */
cleanup.gen = function (
  fn: CleanupFunction,
  _ctx?: TypedGeneratorContext<any>,
): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    const op: Operation<void> = (ctx: WatchContext) => {
      const cleanupRegistry = getCleanupRegistry();
      const element = ctx.element;
      if (!cleanupRegistry.has(element)) {
        cleanupRegistry.set(element, new Set());
      }
      cleanupRegistry.get(element)!.add(fn);
    };
    yield op;
  })();
};

/**
 * Get the current watch context with full type safety.
 * Supports both direct call and yield* patterns.
 *
 * @returns The current WatchContext or a Workflow that yields it
 *
 * @example Direct usage
 * ```typescript
 * watch('.item', function* () {
 *   const context = ctx();
 *   console.log(`Processing ${context.selector} at index ${context.index}`);
 * });
 * ```
 *
 * @example Using yield* pattern
 * ```typescript
 * watch('.item', function* () {
 *   const context = yield* ctx();
 *   console.log(`Processing ${context.selector} at index ${context.index}`);
 * });
 * ```
 *
 * @example With enhanced context
 * ```typescript
 * watchEnhanced('.item', function* (ctx) {
 *   const context = yield* ctx.ctx();
 *   console.log(`Processing ${context.selector} at index ${context.index}`);
 * });
 * ```
 */
export function ctx<El extends HTMLElement = HTMLElement>(
  passedCtx?: TypedGeneratorContext<El>,
): WatchContext<El> {
  return contextCtx(passedCtx);
}

/**
 * Generator version of ctx() for yield* usage.
 *
 * Returns a Workflow that yields the current WatchContext. Use this when you need
 * to access the full context object within a generator using the yield* pattern.
 *
 * @template El - The element type (inferred from context)
 * @param passedCtx - Optional context (usually auto-detected)
 * @returns Workflow that yields the current WatchContext
 *
 * @example Access context information
 * ```typescript
 * watch('.item', function* () {
 *   const context = yield* ctx.gen();
 *
 *   console.log(`Processing ${context.selector} at index ${context.index}`);
 *   console.log(`Total elements: ${context.array.length}`);
 *
 *   // Access state and observers
 *   context.state.set('processed', true);
 *   context.addObserver(new ResizeObserver(() => {}));
 * });
 * ```
 *
 * @example Type-safe element access
 * ```typescript
 * watch('button', function* () {
 *   const context = yield* ctx.gen<HTMLButtonElement>();
 *
 *   // context.element is automatically typed as HTMLButtonElement
 *   context.element.disabled = true;
 * });
 * ```
 */
ctx.gen = function <El extends HTMLElement = HTMLElement>(
  _passedCtx?: TypedGeneratorContext<El>,
): Workflow<WatchContext<El>> {
  return (function* (): Generator<
    Operation<WatchContext<El>>,
    WatchContext<El>,
    any
  > {
    const op: Operation<WatchContext<El>> = (ctx: WatchContext) =>
      ctx as WatchContext<El>;
    const currentContext = yield op;
    return currentContext;
  })();
};

/**
 * Get the parent context when using nested watch calls.
 * Supports both direct call and yield* patterns.
 *
 * @returns The parent context or undefined, or a Workflow that yields it
 *
 * @example Direct usage
 * ```typescript
 * watch('.parent', function* () {
 *   watch('.child', function* () {
 *     const parentCtx = getParentContext();
 *     if (parentCtx) {
 *       console.log('Parent element:', parentCtx.element);
 *     }
 *   });
 * });
 * ```
 *
 * @example Using yield* pattern
 * ```typescript
 * watch('.parent', function* () {
 *   watch('.child', function* () {
 *     const parentCtx = yield* getParentContext();
 *     if (parentCtx) {
 *       console.log('Parent element:', parentCtx.element);
 *     }
 *   });
 * });
 * ```
 *
 * @example With enhanced context
 * ```typescript
 * watchEnhanced('.parent', function* (parentCtx) {
 *   watch('.child', function* (childCtx) {
 *     const parent = yield* childCtx.getParentContext();
 *     if (parent) {
 *       console.log('Parent element:', parent.element);
 *     }
 *   });
 * });
 * ```
 */
export function getParentContext<
  ParentEl extends HTMLElement = HTMLElement,
  ParentApi = any,
>(
  ctx?: TypedGeneratorContext<any>,
): ParentContext<ParentEl, ParentApi> | undefined;
export function getParentContext<
  ParentEl extends HTMLElement = HTMLElement,
  ParentApi = any,
>(): Workflow<ParentContext<ParentEl, ParentApi> | undefined>;
export function getParentContext<
  ParentEl extends HTMLElement = HTMLElement,
  ParentApi = any,
>(
  ctx?: TypedGeneratorContext<any>,
):
  | ParentContext<ParentEl, ParentApi>
  | undefined
  | Workflow<ParentContext<ParentEl, ParentApi> | undefined> {
  const context = getCurrentContext(ctx);

  // Direct call - check if we have a current context
  if (context) {
    const element = context.element;
    // Walk up the DOM tree looking for parent contexts
    let currentElement: HTMLElement | null = element.parentElement;

    while (currentElement) {
      const parentElement = parentContextRegistry.get(currentElement);
      if (parentElement) {
        // Get the API if it exists
        const api = getContextApi(parentElement);
        return {
          element: parentElement as ParentEl,
          api: api as ParentApi,
        } as ParentContext<ParentEl, ParentApi>;
      }
      currentElement = currentElement.parentElement;
    }

    return undefined;
  }

  // Return workflow for yield* usage
  return (function* (): Generator<
    Operation<ParentContext<ParentEl, ParentApi> | undefined>,
    ParentContext<ParentEl, ParentApi> | undefined,
    any
  > {
    const op: Operation<ParentContext<ParentEl, ParentApi> | undefined> = (
      ctx: WatchContext,
    ) => {
      const element = ctx.element;
      let currentElement: HTMLElement | null = element.parentElement;

      while (currentElement) {
        const parentElement = parentContextRegistry.get(currentElement);
        if (parentElement) {
          // Get the API if it exists
          const api = getContextApi(parentElement);
          return {
            element: parentElement as ParentEl,
            api: api as ParentApi,
          } as ParentContext<ParentEl, ParentApi>;
        }
        currentElement = currentElement.parentElement;
      }

      return undefined;
    };
    const parent = yield op;
    return parent;
  })();
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
