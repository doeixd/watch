/**
 * API Wrapper Module for Backwards Compatibility
 *
 * This module provides utilities to wrap API functions so they can work
 * seamlessly in both old sync generator and new async generator contexts,
 * while maintaining backwards compatibility.
 */

import type { ElementFn, Workflow, Operation } from "../types";
import {
  detectContext,
  ApiContext,
  markSyncGenerator,
  markAsyncGenerator,
  type DetectionResult,
} from "./detection";
import { getCurrentElement } from "./context";

/**
 * Configuration for wrapped API functions
 */
export interface WrapperConfig<TArgs extends any[], TReturn> {
  /** Name of the function for debugging */
  name: string;

  /** Implementation for direct element/selector mode */
  directImpl?: (...args: TArgs) => TReturn;

  /** Implementation for sync generator mode (returns ElementFn) */
  syncGeneratorImpl?: (...args: TArgs) => ElementFn<any, any>;

  /** Implementation for async generator mode (returns Workflow) */
  asyncGeneratorImpl?: (...args: TArgs) => Workflow<any>;

  /** Fallback implementation if no specific one matches */
  fallbackImpl?: (...args: TArgs) => any;

  /** Custom detection logic (optional) */
  customDetector?: (args: TArgs) => Partial<DetectionResult>;

  /** Whether this function is a getter (no args in generator mode) */
  isGetter?: boolean;

  /** Whether to cache detection results */
  useCache?: boolean;
}

/**
 * Result type that adapts based on context
 */
export type AdaptiveResult<TDirect, TGenerator> =
  | TDirect
  | TGenerator
  | ElementFn<any, any>
  | Workflow<any>;

/**
 * Convert a sync generator function (ElementFn) to async generator (Workflow)
 */
export function syncToAsyncGenerator<El extends HTMLElement, T>(
  elementFn: ElementFn<El, T>,
): Workflow<T> {
  return (async function* asyncWrapper(): AsyncGenerator<
    Operation<T, El>,
    T,
    unknown
  > {
    const element = getCurrentElement() as El;
    if (!element) {
      throw new Error("No element in context for async generator wrapper");
    }

    // Execute the sync generator function by yielding an operation
    const result = yield ((_context: any) => {
      return elementFn(element);
    }) as Operation<T, El>;

    return result as T;
  })() as Workflow<T>;
}

/**
 * Convert an async generator function (Workflow) to sync generator (ElementFn)
 */
export function asyncToSyncGenerator<El extends HTMLElement, T>(
  workflow: Workflow<T>,
): ElementFn<El, T> {
  return function syncWrapper(element: El): T {
    // This is more complex - we need to run the async generator synchronously
    // This may not be possible in all cases
    const generator = workflow as AsyncGenerator<
      Operation<any, any>,
      T,
      unknown
    >;
    let result: T = undefined as any;
    let done = false;

    // Attempt to run synchronously (this won't work for truly async operations)
    let nextResult = generator.next();
    if (nextResult instanceof Promise) {
      throw new Error(
        "Cannot convert async workflow to sync generator - contains async operations",
      );
    }

    while (!done) {
      const { value, done: isDone } = nextResult as any;

      if (isDone && value !== undefined) {
        result = value as T;
        done = true;
      } else if (value && typeof value === "function") {
        // Handle the operation (which is a function)
        const context = { element } as any;
        const opResult = value(context);
        if (opResult instanceof Promise) {
          throw new Error("Cannot handle async operation in sync context");
        }
        nextResult = generator.next(opResult);
        if (nextResult instanceof Promise) {
          throw new Error("Cannot handle async operation in sync context");
        }
      } else {
        done = isDone;
      }
    }

    return result;
  };
}

/**
 * Create a universal wrapper that adapts based on calling context
 */
export function createAdaptiveWrapper<TArgs extends any[], TReturn>(
  config: WrapperConfig<TArgs, TReturn>,
): (...args: TArgs) => any {
  return function adaptiveWrapper(...args: TArgs): any {
    // Detect calling context
    const detection = detectContext(args, adaptiveWrapper);

    // Apply custom detection if provided
    if (config.customDetector) {
      const customResult = config.customDetector(args);
      Object.assign(detection, customResult);
    }

    // Handle based on detected context
    switch (detection.context) {
      case ApiContext.DIRECT:
      case ApiContext.SELECTOR:
        // Use direct implementation if available
        if (config.directImpl) {
          return config.directImpl(...args);
        }
        break;

      case ApiContext.SYNC_GENERATOR:
        // Use sync generator implementation
        if (config.syncGeneratorImpl) {
          return markSyncGenerator(() => config.syncGeneratorImpl!(...args));
        }
        // Try to adapt async generator impl if available
        if (config.asyncGeneratorImpl) {
          const workflow = config.asyncGeneratorImpl(...args);
          return asyncToSyncGenerator(workflow);
        }
        break;

      case ApiContext.ASYNC_GENERATOR:
        // Use async generator implementation
        if (config.asyncGeneratorImpl) {
          return markAsyncGenerator(() => config.asyncGeneratorImpl!(...args));
        }
        // Try to adapt sync generator impl if available
        if (config.syncGeneratorImpl) {
          const elementFn = config.syncGeneratorImpl(...args);
          return syncToAsyncGenerator(elementFn);
        }
        break;
    }

    // Fallback implementation
    if (config.fallbackImpl) {
      return config.fallbackImpl(...args);
    }

    // If no implementation found, throw error
    throw new Error(
      `No implementation found for ${config.name} in context: ${detection.context}`,
    );
  };
}

/**
 * Helper to create ElementFn that works in both sync and async contexts
 */
export function createUniversalElementFn<El extends Element, T>(
  handler: (element: El) => T | Promise<T>,
): ElementFn<El, T> {
  return function universalElementFn(element: El): T {
    const result = handler(element);

    // If the handler returns a promise but we're in sync context, try to handle it
    if (result instanceof Promise) {
      // This is a problem - we can't handle async in sync context
      // For now, we'll throw an error
      throw new Error(
        "Async operation in sync generator context not supported",
      );
    }

    return result as T;
  };
}

/**
 * Create a Workflow that works with both yield and yield*
 */
export function createUniversalWorkflow<T>(
  handler: () =>
    | AsyncGenerator<Operation<any, any>, T, unknown>
    | Generator<Operation<any, any>, T, unknown>,
): Workflow<T> {
  return (async function* universalWorkflow(): AsyncGenerator<
    Operation<any, any>,
    T,
    unknown
  > {
    const gen = handler();

    // Check if it's async or sync generator
    if (Symbol.asyncIterator in gen) {
      // It's already an async generator
      const asyncGen = gen as AsyncGenerator<Operation<any, any>, T, unknown>;
      return yield* asyncGen;
    } else {
      // Convert sync to async
      let result = gen.next();
      while (!result.done) {
        yield result.value;
        result = gen.next();
      }
      return result.value as T;
    }
  })() as Workflow<T>;
}

/**
 * Wrapper for functions that should work as both setters and getters
 */
export function createDualModeWrapper<TEl extends Element, TValue>(config: {
  name: string;
  getter: (element: TEl) => TValue;
  setter: (element: TEl, value: TValue) => void;
}): {
  (element: TEl): TValue;
  (element: TEl, value: TValue): void;
  (value: TValue): ElementFn<TEl, void>;
  (): ElementFn<TEl, TValue>;
} {
  return createAdaptiveWrapper<[TEl?, TValue?], TValue | void>({
    name: config.name,
    isGetter: true,

    directImpl: (element?: TEl, value?: TValue) => {
      if (!element) {
        throw new Error(`${config.name}: Element is required in direct mode`);
      }

      if (value === undefined) {
        // Getter mode
        return config.getter(element);
      } else {
        // Setter mode
        config.setter(element, value);
        return undefined;
      }
    },

    syncGeneratorImpl: (element?: TEl, _value?: TValue) => {
      // In generator context, no element is passed
      if (arguments.length === 0) {
        // Getter mode in generator
        return (el: TEl) => config.getter(el);
      } else {
        // Setter mode in generator (value is first arg)
        return (el: TEl) => {
          config.setter(el, element as unknown as TValue); // First arg is actually the value
          return undefined;
        };
      }
    },

    asyncGeneratorImpl: (element?: TEl, _value?: TValue) => {
      return (async function* (): AsyncGenerator<
        Operation<any, any>,
        TValue | undefined,
        unknown
      > {
        const el = getCurrentElement() as unknown as TEl;

        if (element === undefined) {
          // Getter mode
          return config.getter(el);
        } else {
          // Setter mode
          config.setter(el, element as unknown as TValue); // First arg is actually the value
          return undefined;
        }
      })() as Workflow<TValue | undefined>;
    },
  }) as any;
}

/**
 * Create a wrapper for standard DOM manipulation functions
 */
export function createDomWrapper<TValue>(
  name: string,
  config: {
    get: (element: Element) => TValue;
    set: (element: Element, value: TValue) => void;
  },
) {
  const wrapper = function domWrapper(...args: any[]): any {
    const detection = detectContext(args, domWrapper);

    // Handle different patterns
    if (
      detection.context === ApiContext.DIRECT ||
      detection.context === ApiContext.SELECTOR
    ) {
      // Direct mode: text(element, value) or text(selector, value)
      const [target, value] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement | null;
        if (!element) {
          throw new Error(`No element found for selector: ${target}`);
        }
      } else if (target && typeof target === "object" && "nodeType" in target) {
        element = target as HTMLElement;
      } else {
        throw new Error(`Invalid target for ${name}`);
      }

      // Setter or getter?
      if (args.length === 1) {
        return config.get(element);
      } else {
        config.set(element, value);
        return undefined;
      }
    } else if (detection.context === ApiContext.SYNC_GENERATOR) {
      // Sync generator mode: yield text(value) or const val = yield text()
      if (args.length === 0) {
        // Getter mode
        return function getterFn(element: Element): TValue {
          return config.get(element);
        };
      } else {
        // Setter mode
        const [value] = args;
        return function setterFn(element: Element): void {
          config.set(element, value);
        };
      }
    } else if (detection.context === ApiContext.ASYNC_GENERATOR) {
      // Async generator mode: yield* text(value)
      if (args.length === 0) {
        // Getter mode
        return async function* getterWorkflow(): AsyncGenerator<
          Operation<any, any>,
          TValue,
          unknown
        > {
          const element = getCurrentElement();
          if (!element) throw new Error("No element in context");
          return config.get(element);
        };
      } else {
        // Setter mode
        const [value] = args;
        return async function* setterWorkflow(): AsyncGenerator<
          Operation<any, any>,
          void,
          unknown
        > {
          const element = getCurrentElement();
          if (!element) throw new Error("No element in context");
          config.set(element, value);
          return;
        };
      }
    }

    throw new Error(`Unsupported context for ${name}: ${detection.context}`);
  };

  // Add metadata for debugging
  Object.defineProperty(wrapper, "name", { value: name });

  return wrapper;
}

/**
 * Batch wrapper creator for multiple operations
 */
export function createBatchWrapper<T>(
  name: string,
  operations: Array<() => ElementFn<any, any> | Workflow<any>>,
): (...args: any[]) => any {
  return createAdaptiveWrapper({
    name,

    syncGeneratorImpl: () => {
      return (element: Element) => {
        const results: any[] = [];
        for (const op of operations) {
          const fn = op();
          if (typeof fn === "function") {
            results.push(fn(element));
          }
        }
        return results as T;
      };
    },

    asyncGeneratorImpl: () => {
      return (async function* batchWorkflow(): AsyncGenerator<
        Operation<any, any>,
        T,
        unknown
      > {
        const results: any[] = [];
        for (const op of operations) {
          const workflow = op();
          if (
            workflow &&
            typeof workflow === "object" &&
            Symbol.asyncIterator in workflow
          ) {
            const result = yield* workflow as Workflow<any>;
            results.push(result);
          }
        }
        return results as T;
      })() as Workflow<T>;
    },
  });
}

/**
 * Export utilities for testing and debugging
 */
export const _testing = {
  syncToAsyncGenerator,
  asyncToSyncGenerator,
  createUniversalElementFn,
  createUniversalWorkflow,
};
