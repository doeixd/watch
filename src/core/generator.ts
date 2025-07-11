// Type-safe generator utilities that maintain element type inference

import type { 
  ElementFn, 
  TypedGeneratorContext, 
  CleanupFunction,
  ElementFromSelector 
} from '../types.ts';
import { getCurrentContext } from './context.ts';

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

function getCleanupRegistry(): WeakMap<HTMLElement, Set<CleanupFunction>> {
  return cleanupRegistry;
}

// Type-safe helper functions that work within generators
export function self<El extends HTMLElement = HTMLElement>(): El {
  const context = getCurrentContext();
  if (!context) {
    throw new Error('self() can only be called within a generator context');
  }
  return context.element as El;
}

export function el<T extends HTMLElement = HTMLElement>(selector: string): T | null {
  const context = getCurrentContext();
  if (!context) {
    throw new Error('el() can only be called within a generator context');
  }
  return context.element.querySelector(selector) as T | null;
}

export function all<T extends HTMLElement = HTMLElement>(selector: string): T[] {
  const context = getCurrentContext();
  if (!context) {
    throw new Error('all() can only be called within a generator context');
  }
  return Array.from(context.element.querySelectorAll(selector)) as T[];
}

export function cleanup(fn: CleanupFunction): void {
  const context = getCurrentContext();
  if (!context) {
    throw new Error('cleanup() can only be called within a generator context');
  }
  
  const element = context.element;
  if (!cleanupRegistry.has(element)) {
    cleanupRegistry.set(element, new Set());
  }
  cleanupRegistry.get(element)!.add(fn);
}

export function ctx<El extends HTMLElement = HTMLElement>(): TypedGeneratorContext<El> {
  return createTypedGeneratorContext<El>();
}

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
  selector: S,
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
