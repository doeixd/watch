/**
 * State Management with Sync Generators
 *
 * This module provides state management functions that work with sync generators
 * and the yield* pattern for better type safety and consistency.
 */

import type { Workflow, WatchContext, Operation } from "../types";

// ============================================================================
// State Management Functions
// ============================================================================

/**
 * Set state value for the current element
 */
export function setState<T>(key: string, value: T): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      context.state.set(key, value);
    }) as Operation<void>;
  })();
}

/**
 * Get state value for the current element
 */
export function getState<T>(key: string, defaultValue?: T): Workflow<T | undefined> {
  return (function* (): Generator<Operation<T | undefined>, T | undefined, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return defaultValue;
      }
      return context.state.has(key) ? context.state.get(key) as T : defaultValue;
    }) as Operation<T | undefined>;
    return result;
  })();
}

/**
 * Update state value using an updater function
 */
export function updateState<T>(key: string, updater: (value: T | undefined) => T): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      const currentValue = context.state.get(key) as T | undefined;
      const newValue = updater(currentValue);
      context.state.set(key, newValue);
    }) as Operation<void>;
  })();
}

/**
 * Check if state key exists
 */
export function hasState(key: string): Workflow<boolean> {
  return (function* (): Generator<Operation<boolean>, boolean, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return false;
      }
      return context.state.has(key);
    }) as Operation<boolean>;
    return result;
  })();
}

/**
 * Delete state key
 */
export function deleteState(key: string): Workflow<boolean> {
  return (function* (): Generator<Operation<boolean>, boolean, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return false;
      }
      return context.state.delete(key);
    }) as Operation<boolean>;
    return result;
  })();
}

/**
 * Clear all state
 */
export function clearState(): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      if (context.state) {
        context.state.clear();
      }
    }) as Operation<void>;
  })();
}

/**
 * Get all state keys
 */
export function getStateKeys(): Workflow<string[]> {
  return (function* (): Generator<Operation<string[]>, string[], any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return [];
      }
      return Array.from(context.state.keys());
    }) as Operation<string[]>;
    return result;
  })();
}

/**
 * Get all state entries
 */
export function getStateEntries<T = any>(): Workflow<Array<[string, T]>> {
  return (function* (): Generator<Operation<Array<[string, T]>>, Array<[string, T]>, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return [];
      }
      return Array.from(context.state.entries()) as Array<[string, T]>;
    }) as Operation<Array<[string, T]>>;
    return result;
  })();
}

/**
 * Get state size
 */
export function getStateSize(): Workflow<number> {
  return (function* (): Generator<Operation<number>, number, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return 0;
      }
      return context.state.size;
    }) as Operation<number>;
    return result;
  })();
}

/**
 * Merge state with an object
 */
export function mergeState(stateObject: Record<string, any>): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      Object.entries(stateObject).forEach(([key, value]) => {
        context.state!.set(key, value);
      });
    }) as Operation<void>;
  })();
}

/**
 * Get state as object
 */
export function getStateObject<T extends Record<string, any> = Record<string, any>>(): Workflow<T> {
  return (function* (): Generator<Operation<T>, T, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return {} as T;
      }
      const obj: any = {};
      context.state.forEach((value, key) => {
        obj[key] = value;
      });
      return obj as T;
    }) as Operation<T>;
    return result;
  })();
}

/**
 * Watch state changes with a callback
 */
export function watchState<T>(
  key: string,
  callback: (newValue: T | undefined, oldValue: T | undefined) => void | Generator<any, void, any>
): Workflow<() => void> {
  return (function* (): Generator<Operation<() => void>, () => void, any> {
    const cleanup = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }

      // Store the current value
      let currentValue = context.state.get(key) as T | undefined;

      // Create a proxy or use Object.defineProperty to intercept set operations
      // For simplicity, we'll use a polling approach or override the Map's set method
      const originalSet = context.state.set.bind(context.state);
      const originalDelete = context.state.delete.bind(context.state);
      const originalClear = context.state.clear.bind(context.state);

      // Override set method
      context.state.set = function(k: string, v: any) {
        if (k === key) {
          const oldValue = currentValue;
          currentValue = v as T;
          const result = originalSet(k, v);

          // Execute callback
          const callbackResult = callback(currentValue, oldValue);
          if (callbackResult && typeof callbackResult === 'object' && Symbol.iterator in callbackResult) {
            // Execute sync generator
            const gen = callbackResult as Generator<any, void, any>;
            let genResult = gen.next();
            while (!genResult.done) {
              if (typeof genResult.value === 'function') {
                genResult.value(context);
              }
              genResult = gen.next();
            }
          }

          return result;
        }
        return originalSet(k, v);
      };

      // Override delete method
      context.state.delete = function(k: string) {
        if (k === key && context.state!.has(key)) {
          const oldValue = currentValue;
          currentValue = undefined;
          const result = originalDelete(k);

          // Execute callback
          const callbackResult = callback(undefined, oldValue);
          if (callbackResult && typeof callbackResult === 'object' && Symbol.iterator in callbackResult) {
            const gen = callbackResult as Generator<any, void, any>;
            let genResult = gen.next();
            while (!genResult.done) {
              if (typeof genResult.value === 'function') {
                genResult.value(context);
              }
              genResult = gen.next();
            }
          }

          return result;
        }
        return originalDelete(k);
      };

      // Return cleanup function
      return () => {
        // Restore original methods
        context.state!.set = originalSet;
        context.state!.delete = originalDelete;
        context.state!.clear = originalClear;
      };
    }) as Operation<() => void>;
    return cleanup;
  })();
}

/**
 * Create a computed state value
 */
export function computedState<T>(
  key: string,
  dependencies: string[],
  compute: (...deps: any[]) => T
): Workflow<T> {
  return (function* (): Generator<Operation<T>, T, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }

      // Get dependency values
      const depValues = dependencies.map(dep => context.state!.get(dep));

      // Compute and cache the value
      const computedValue = compute(...depValues);
      context.state.set(`__computed_${key}`, computedValue);

      return computedValue;
    }) as Operation<T>;
    return result;
  })();
}

/**
 * Persist state to localStorage
 */
export function persistState(key: string, storageKey?: string): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      if (!context.state) {
        return;
      }

      const value = context.state.get(key);
      const actualStorageKey = storageKey || `watch_state_${key}`;

      if (value !== undefined) {
        try {
          localStorage.setItem(actualStorageKey, JSON.stringify(value));
        } catch (e) {
          console.error('Failed to persist state:', e);
        }
      }
    }) as Operation<void>;
  })();
}

/**
 * Restore state from localStorage
 */
export function restoreState<T>(key: string, storageKey?: string, defaultValue?: T): Workflow<T | undefined> {
  return (function* (): Generator<Operation<T | undefined>, T | undefined, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }

      const actualStorageKey = storageKey || `watch_state_${key}`;

      try {
        const stored = localStorage.getItem(actualStorageKey);
        if (stored !== null) {
          const value = JSON.parse(stored) as T;
          context.state.set(key, value);
          return value;
        }
      } catch (e) {
        console.error('Failed to restore state:', e);
      }

      if (defaultValue !== undefined) {
        context.state.set(key, defaultValue);
        return defaultValue;
      }

      return undefined;
    }) as Operation<T | undefined>;
    return result;
  })();
}

// ============================================================================
// Exports
// ============================================================================

export default {
  setState,
  getState,
  updateState,
  hasState,
  deleteState,
  clearState,
  getStateKeys,
  getStateEntries,
  getStateSize,
  mergeState,
  getStateObject,
  watchState,
  computedState,
  persistState,
  restoreState,
};
