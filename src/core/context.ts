// Context management for generator execution

import type { 
  WatchContext, 
  ElementProxy, 
  SelfFunction, 
  CleanupFunction,
  GeneratorContext,
  TypedGeneratorContext
} from '../types';
import { registerUnmount } from './observer';

// Global context stack for tracking current element during generator execution
const contextStack: GeneratorContext[] = [];

// Global registry to link a child element to its parent watcher's element.
// This is the backbone of the getParentContext() functionality.
export const parentContextRegistry = new WeakMap<HTMLElement, HTMLElement>();

// Get the current context - optionally override with passed context
export function getCurrentContext<El extends HTMLElement = HTMLElement>(ctx?: TypedGeneratorContext<El>): GeneratorContext<El> | null {
  if (ctx) {
    // Convert TypedGeneratorContext to GeneratorContext
    return {
      element: ctx.element,
      selector: ctx.selector,
      index: ctx.index,
      array: ctx.array
    };
  }
  return (contextStack[contextStack.length - 1] as GeneratorContext<El>) || null;
}

// Push a new context onto the stack
export function pushContext<El extends HTMLElement>(context: GeneratorContext<El>): void {
  contextStack.push(context);
}

// Pop the current context from the stack
export function popContext<El extends HTMLElement = HTMLElement>(): GeneratorContext<El> | null {
  return (contextStack.pop() as GeneratorContext<El>) || null;
}

// Create element proxy that acts as both the element and a query function
export function createElementProxy<El extends HTMLElement>(element: El): ElementProxy<El> {
  // Create a proxy that intercepts property access
  const proxy = new Proxy(element, {
    get(target, prop, receiver) {
      // If it's a function call (query), handle it specially
      if (typeof prop === 'string' && prop === 'apply') {
        return undefined; // This will make it not callable by default
      }
      
      // Pass through all element properties
      const value = Reflect.get(target, prop, receiver);
      
      // If it's a function, bind it to the target
      if (typeof value === 'function') {
        return value.bind(target);
      }
      
      return value;
    }
  }) as El;
  
  // Add query functionality
  const queryFunction = <T extends HTMLElement = HTMLElement>(selector: string): T | null => {
    return element.querySelector(selector) as T | null;
  };
  
  // Add queryAll functionality
  const queryAllFunction = <T extends HTMLElement = HTMLElement>(selector: string): T[] => {
    return Array.from(element.querySelectorAll(selector)) as T[];
  };
  
  // Merge the proxy with the query function
  const elementProxy = Object.assign(queryFunction, proxy, {
    all: queryAllFunction
  }) as ElementProxy<El>;
  
  return elementProxy;
}

// Create self function that returns the current element
export function createSelfFunction<El extends HTMLElement>(element: El): SelfFunction<El> {
  return () => element;
}

// Cleanup function registry per element
const cleanupRegistry = new WeakMap<HTMLElement, Set<CleanupFunction>>();

// Create cleanup function for registering element-specific cleanup
export function createCleanupFunction<El extends HTMLElement>(element: El): (fn: CleanupFunction) => void {
  return (fn: CleanupFunction) => {
    if (!cleanupRegistry.has(element)) {
      cleanupRegistry.set(element, new Set());
    }
    
    const cleanups = cleanupRegistry.get(element)!;
    cleanups.add(fn);
  };
}

// Execute cleanup functions for an element
export function executeCleanup<El extends HTMLElement>(element: El): void {
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

// Create a complete watch context for an element
export function createWatchContext<El extends HTMLElement>(
  element: El,
  selector: string,
  index: number,
  array: readonly El[]
): WatchContext<El> {
  const observers = new Set<MutationObserver | IntersectionObserver | ResizeObserver>();
  
  return {
    element,
    selector,
    index,
    array,
    state: {},
    observers,
    el: createElementProxy(element),
    self: createSelfFunction(element),
    cleanup: createCleanupFunction(element),
    addObserver: (observer: MutationObserver | IntersectionObserver | ResizeObserver) => {
      observers.add(observer);
    }
  };
}

// Execute a generator function with proper context and type safety
export async function executeGenerator<El extends HTMLElement, T = GeneratorContext<El> | any>(
  element: El,
  selector: string,
  index: number,
  array: readonly El[],
  generatorFn: (ctx: TypedGeneratorContext<El>) => Generator<any, T, unknown> | AsyncGenerator<any, T, unknown>
): Promise<T | undefined> {
  createWatchContext(element, selector, index, array);
  const generatorContext: GeneratorContext<El> = {
    element,
    selector,
    index,
    array
  };
  
  // Push context onto stack
  pushContext(generatorContext);
  
  // Register unmount handler to clean up when element is removed
  registerUnmount(element, () => {
    // Clean up any state related to this element
    const event = new CustomEvent('cleanup', { detail: { element } });
    element.dispatchEvent(event);
  });
  
  let returnValue: T | undefined;
  
  try {
    // Create typed context for the generator - always pass it
    const typedContext: TypedGeneratorContext<El> = {
      self: () => element,
      el: <T extends HTMLElement = HTMLElement>(selector: string): T | null => 
        element.querySelector(selector) as T | null,
      all: <T extends HTMLElement = HTMLElement>(selector: string): T[] => 
        Array.from(element.querySelectorAll(selector)) as T[],
      cleanup: (fn: CleanupFunction): void => {
        const element = generatorContext.element;
        if (!cleanupRegistry.has(element)) {
          cleanupRegistry.set(element, new Set());
        }
        cleanupRegistry.get(element)!.add(fn);
      },
      ctx: () => {
        const watchContext = createWatchContext(element, selector, index, array);
        return watchContext as any; // Type assertion needed
      },
      element,
      selector,
      index,
      array
    };
    
    // Always pass context - JavaScript ignores extra parameters if not needed
    const generator = (generatorFn as any)(typedContext);
    
    // Handle both sync and async generators
    returnValue = await executeGeneratorSequence(generator, element);
  } catch (e) {
    console.error('Error in generator execution:', e);
  } finally {
    // Pop context from stack
    popContext();
  }
  
  return returnValue;
}

// Helper function to execute generator sequences with support for yield*, async, and nested patterns
async function executeGeneratorSequence<El extends HTMLElement>(
  generator: Generator<any, any, unknown> | AsyncGenerator<any, any, unknown>,
  element: El
): Promise<any> {
  let result = await generator.next();
  
  while (!result.done) {
    const yielded = result.value;
    
    try {
      await handleYieldedValue(yielded, element);
    } catch (e) {
      console.error('Error executing yielded value:', e);
    }
    
    result = await generator.next();
  }
  
  return result.value;
}

// Handle different types of yielded values
async function handleYieldedValue<El extends HTMLElement>(
  yielded: any,
  element: El
): Promise<void> {
  // Handle regular element functions
  if (typeof yielded === 'function') {
    const result = yielded(element);
    // If the function returns a promise, await it
    if (result && typeof result.then === 'function') {
      await result;
    }
    return;
  }
  
  // Handle promises
  if (yielded && typeof yielded.then === 'function') {
    const resolved = await yielded;
    // If the resolved value is a function, execute it
    if (typeof resolved === 'function') {
      resolved(element);
    }
    return;
  }
  
  // Handle generator delegation (yield*)
  if (yielded && typeof yielded[Symbol.iterator] === 'function') {
    await executeGeneratorSequence(yielded, element);
    return;
  }
  
  // Handle async generator delegation (yield*)
  if (yielded && typeof yielded[Symbol.asyncIterator] === 'function') {
    await executeGeneratorSequence(yielded, element);
    return;
  }
  
  // Handle arrays of functions (batch operations)
  if (Array.isArray(yielded)) {
    for (const item of yielded) {
      await handleYieldedValue(item, element);
    }
    return;
  }
  
  // Handle null or undefined as no-op
  if (yielded === null || yielded === undefined) {
    return;
  }

  // If we get here, it's an unsupported yield type
  console.warn('Unsupported yield type:', typeof yielded, yielded);
}

// Global proxy for accessing current element when not in generator context
export function getCurrentElement<El extends HTMLElement = HTMLElement>(): El | null {
  const context = getCurrentContext<El>();
  return context?.element || null;
}

// Global self function with proper type inference
export function self<El extends HTMLElement = HTMLElement>(ctx?: TypedGeneratorContext<El>): El {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error('self() can only be called within a generator context');
  }
  return context.element as El;
}

// Global el proxy function
export function el<T extends HTMLElement = HTMLElement>(selector: string, ctx?: TypedGeneratorContext<any>): T | null {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error('el() can only be called within a generator context');
  }
  return context.element.querySelector(selector) as T | null;
}

// Global el.all function
el.all = function<T extends HTMLElement = HTMLElement>(selector: string, ctx?: TypedGeneratorContext<any>): T[] {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error('el.all() can only be called within a generator context');
  }
  return Array.from(context.element.querySelectorAll(selector)) as T[];
};

// Add cleanup function to global context
export function cleanup(fn: CleanupFunction, ctx?: TypedGeneratorContext<any>): void {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error('cleanup() can only be called within a generator context');
  }
  
  const element = context.element;
  if (!cleanupRegistry.has(element)) {
    cleanupRegistry.set(element, new Set());
  }
  
  const cleanups = cleanupRegistry.get(element)!;
  cleanups.add(fn);
}

// Get current context as a function (ctx() function) with proper type inference
export function ctx<El extends HTMLElement = HTMLElement>(passedCtx?: TypedGeneratorContext<El>): WatchContext<El> {
  const context = getCurrentContext(passedCtx);
  if (!context) {
    throw new Error('ctx() can only be called within a generator context');
  }
  
  const watchContext = createWatchContext(
    context.element as El,
    context.selector,
    context.index,
    context.array as readonly El[]
  );
  
  return watchContext;
}

// These helpers are used by createChildWatcher to manage the hierarchy.
export function registerParentContext(child: HTMLElement, parent: HTMLElement): void {
  parentContextRegistry.set(child, parent);
}

export function unregisterParentContext(child: HTMLElement): void {
  parentContextRegistry.delete(child);
}

// Clear all contexts (for testing)
export function clearContexts(): void {
  contextStack.length = 0;
}
