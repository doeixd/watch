// Type-safe generator utilities that maintain element type inference

import type { 
  ElementFn, 
  TypedGeneratorContext, 
  CleanupFunction,
  ElementFromSelector,
  ParentContext 
} from '../types';
import { getCurrentContext, parentContextRegistry } from './context';

// Create a typed generator context that maintains element type
export function createTypedGeneratorContext<El extends HTMLElement>(): TypedGeneratorContext<El> {
  const context = getCurrentContext();
  if (!context) {
    throw new Error('Generator context functions can only be called within a generator');
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
        cleanup: this.cleanup
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
    }
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
 * @param element The element whose API is being requested.
 * @returns The returned API object, or undefined if none exists.
 * @internal
 */
export function getContextApi<T = any>(element: HTMLElement): T | undefined {
  return generatorApiRegistry.get(element);
}

/**
 * Stores the public API returned by an element's generator.
 * @param element The element whose API is being stored.
 * @param api The API object to store.
 * @internal
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
  ParentApi = any
>(ctx?: TypedGeneratorContext<any>): ParentContext<ParentEl, ParentApi> | null {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error('getParentContext() can only be called within a generator context');
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

// Import the functions from context.ts to avoid duplication
import { self as selfFn, el, cleanup, ctx } from './context';
export { el, cleanup, ctx };

// Add the all function that doesn't exist in context.ts
export function all<T extends HTMLElement = HTMLElement>(selector: string, ctx?: TypedGeneratorContext<any>): T[] {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error('all() can only be called within a generator context');
  }
  return Array.from(context.element.querySelectorAll(selector)) as T[];
}

// Export self with the original name for backwards compatibility
export { selfFn as self };

// Type-safe generator creation helpers
export function createGenerator<El extends HTMLElement>(
  generatorFn: (ctx: TypedGeneratorContext<El>) => Generator<ElementFn<El>, void, unknown>
): () => Generator<ElementFn<El>, void, unknown> {
  return function* () {
    const typedContext = createTypedGeneratorContext<El>();
    yield* generatorFn(typedContext);
  };
}

// Alternative approach: Use a generator with inferred types
export function gen<El extends HTMLElement = HTMLElement>(
  generatorFn: () => Generator<ElementFn<El>, void, unknown>
): () => Generator<ElementFn<El>, void, unknown> {
  return generatorFn;
}

// Type-safe watch generator that provides typed context
export function watchGenerator<S extends string>(
  _selector: S,
  generatorFn: (ctx: TypedGeneratorContext<ElementFromSelector<S>>) => Generator<ElementFn<ElementFromSelector<S>>, void, unknown>
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
    cleanups.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.error('Error during cleanup:', e);
      }
    });
    cleanupRegistry.delete(element);
  }
}
