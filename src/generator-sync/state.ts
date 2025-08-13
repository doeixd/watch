/**
 * @fileoverview Synchronous state management operations for the generator submodule
 *
 * This module provides synchronous state management operations that return SyncWorkflow<T>
 * directly, enabling efficient state management in sync generators without async overhead.
 *
 * @example Basic State Management with Sync Generators
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, setState, updateState } from 'watch-selector/generator-sync';
 *
 * watch('.counter', function*() {  // Note: sync function*, not async
 *   // Initialize state
 *   yield* setState('count', 0);
 *
 *   // Get state with type safety
 *   const count = yield* getState<number>('count', 0);
 *
 *   // Update state with a function
 *   yield* updateState('count', (c) => c + 1);
 * });
 * ```
 *
 * @module generator-sync/state
 */

import type { SyncWorkflow, WatchContext, Operation } from "../types";

// ============================================================================
// BASIC STATE OPERATIONS
// ============================================================================

/**
 * Gets a state value for the current element using the sync generator API.
 *
 * @param key - The state key to retrieve
 * @param defaultValue - Optional default value if the key doesn't exist
 * @returns A SyncWorkflow that returns the state value
 *
 * @example Getting typed state in sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, setState } from 'watch-selector/generator-sync';
 *
 * watch('.user-card', function*() {
 *   const userId = yield* getState<string>('userId', 'anonymous');
 *   const clickCount = yield* getState<number>('clicks', 0);
 * });
 * ```
 */
export function getState<T = any>(
  key: string,
  defaultValue?: T,
): SyncWorkflow<T> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return defaultValue as T;
      }
      return context.state.has(key)
        ? (context.state.get(key) as T)
        : (defaultValue as T);
    }) as Operation<T>;
    return result as T;
  })();
}

/**
 * Sets a state value for the current element using the sync generator API.
 *
 * @param key - The state key to set
 * @param value - The value to set
 * @returns A SyncWorkflow<void> that sets the state
 *
 * @example Setting state in sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { setState, click } from 'watch-selector/generator-sync';
 *
 * watch('.toggle', function*() {
 *   yield* setState('isActive', false);
 *
 *   yield* click(function*() {
 *     yield* setState('isActive', true);
 *   });
 * });
 * ```
 */
export function setState<T = any>(key: string, value: T): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      context.state.set(key, value);
    }) as Operation<void>;
  })();
}

/**
 * Updates a state value using a function in the sync generator API.
 *
 * @param key - The state key to update
 * @param updater - Function that receives current value and returns new value
 * @returns A SyncWorkflow that returns the new value
 *
 * @example Updating state with a function
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { updateState, click } from 'watch-selector/generator-sync';
 *
 * watch('.counter', function*() {
 *   yield* click(function*() {
 *     const newCount = yield* updateState('count', (c = 0) => c + 1);
 *     console.log('New count:', newCount);
 *   });
 * });
 * ```
 */
export function updateState<T = any>(
  key: string,
  updater: (current: T | undefined) => T,
): SyncWorkflow<T> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      const current = context.state.get(key) as T | undefined;
      const newValue = updater(current);
      context.state.set(key, newValue);
      return newValue;
    }) as Operation<T>;
    return result as T;
  })();
}

/**
 * Checks if a state key exists using the sync generator API.
 *
 * @param key - The state key to check
 * @returns A SyncWorkflow<boolean> that returns true if the key exists
 */
export function hasState(key: string): SyncWorkflow<boolean> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.state ? context.state.has(key) : false;
    }) as Operation<boolean>;
    return result as boolean;
  })();
}

/**
 * Deletes a state key using the sync generator API.
 *
 * @param key - The state key to delete
 * @returns A SyncWorkflow<boolean> that returns true if the key was deleted
 */
export function deleteState(key: string): SyncWorkflow<boolean> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) return false;
      return context.state.delete(key);
    }) as Operation<boolean>;
    return result as boolean;
  })();
}

// ============================================================================
// ADVANCED STATE OPERATIONS
// ============================================================================

/**
 * Initializes state with a value only if it doesn't exist.
 *
 * @param key - The state key
 * @param initialValue - The initial value to set if key doesn't exist
 * @returns A SyncWorkflow that returns the existing or initialized value
 */
export function initState<T = any>(
  key: string,
  initialValue: T,
): SyncWorkflow<T> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      if (!context.state.has(key)) {
        context.state.set(key, initialValue);
        return initialValue;
      }
      return context.state.get(key) as T;
    }) as Operation<T>;
    return result as T;
  })();
}

/**
 * Increments a numeric state value.
 *
 * @param key - The state key
 * @param amount - Amount to increment by (default: 1)
 * @returns A SyncWorkflow that returns the new value
 */
export function incrementState(
  key: string,
  amount: number = 1,
): SyncWorkflow<number> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      const current = (context.state.get(key) || 0) as number;
      const newValue = current + amount;
      context.state.set(key, newValue);
      return newValue;
    }) as Operation<number>;
    return result as number;
  })();
}

/**
 * Decrements a numeric state value.
 *
 * @param key - The state key
 * @param amount - Amount to decrement by (default: 1)
 * @returns A SyncWorkflow that returns the new value
 */
export function decrementState(
  key: string,
  amount: number = 1,
): SyncWorkflow<number> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      const current = (context.state.get(key) || 0) as number;
      const newValue = current - amount;
      context.state.set(key, newValue);
      return newValue;
    }) as Operation<number>;
    return result as number;
  })();
}

/**
 * Toggles a boolean state value.
 *
 * @param key - The state key
 * @returns A SyncWorkflow that returns the new boolean value
 */
export function toggleState(key: string): SyncWorkflow<boolean> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      const current = (context.state.get(key) as boolean) || false;
      const newValue = !current;
      context.state.set(key, newValue);
      return newValue;
    }) as Operation<boolean>;
    return result as boolean;
  })();
}

/**
 * Appends a value to an array state.
 *
 * @param key - The state key
 * @param value - Value to append
 * @returns A SyncWorkflow that returns the updated array
 */
export function appendToState<T = any>(
  key: string,
  value: T,
): SyncWorkflow<T[]> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      const current = (context.state.get(key) || []) as T[];
      const newArray = [...current, value];
      context.state.set(key, newArray);
      return newArray;
    }) as Operation<T[]>;
    return result as T[];
  })();
}

/**
 * Prepends a value to an array state.
 *
 * @param key - The state key
 * @param value - Value to prepend
 * @returns A SyncWorkflow that returns the updated array
 */
export function prependToState<T = any>(
  key: string,
  value: T,
): SyncWorkflow<T[]> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      const current = (context.state.get(key) || []) as T[];
      const newArray = [value, ...current];
      context.state.set(key, newArray);
      return newArray;
    }) as Operation<T[]>;
    return result as T[];
  })();
}

/**
 * Removes a value from an array state.
 *
 * @param key - The state key
 * @param value - Value to remove (uses indexOf for comparison)
 * @returns A SyncWorkflow that returns the updated array
 */
export function removeFromState<T = any>(
  key: string,
  value: T,
): SyncWorkflow<T[]> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      const current = (context.state.get(key) || []) as T[];
      const index = current.indexOf(value);
      const newArray =
        index >= 0
          ? [...current.slice(0, index), ...current.slice(index + 1)]
          : current;
      context.state.set(key, newArray);
      return newArray;
    }) as Operation<T[]>;
    return result as T[];
  })();
}

/**
 * Merges an object into existing state.
 *
 * @param key - The state key
 * @param updates - Object to merge into current state
 * @returns A SyncWorkflow that returns the merged object
 */
export function mergeState<T extends object>(
  key: string,
  updates: Partial<T>,
): SyncWorkflow<T> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }
      const current = (context.state.get(key) || {}) as T;
      const merged = { ...current, ...updates };
      context.state.set(key, merged);
      return merged;
    }) as Operation<T>;
    return result as T;
  })();
}

// ============================================================================
// STATE WATCHING OPERATIONS
// ============================================================================

/**
 * Watches for changes to a state key.
 *
 * @param key - The state key to watch
 * @param callback - Function to call when state changes
 * @returns A SyncWorkflow<void> that sets up the watcher
 */
export function watchState<T = any>(
  key: string,
  callback: (newValue: T, oldValue: T | undefined) => void,
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }

      // Store the current value as the initial value for comparison
      // This is used in the callback when the value changes
      void context.state.get(key) as T | undefined;

      // Override the set method for this key (simple implementation)
      // In a real implementation, you'd want a more sophisticated observer pattern
      const originalSet = context.state.set.bind(context.state);
      context.state.set = function (k: any, v: any) {
        if (k === key) {
          const old = this.get(k);
          originalSet(k, v);
          if (old !== v) {
            callback(v, old);
          }
        } else {
          originalSet(k, v);
        }
        return this;
      };
    }) as Operation<void>;
  })();
}

// ============================================================================
// REACTIVE STATE OPERATIONS
// ============================================================================

/**
 * Creates a computed state value that updates when dependencies change.
 *
 * @param key - The state key for the computed value
 * @param deps - Array of dependency state keys
 * @param compute - Function to compute the value from dependencies
 * @returns A SyncWorkflow that returns the computed value
 */
export function computedState<T = any>(
  key: string,
  deps: string[],
  compute: (...values: any[]) => T,
): SyncWorkflow<T> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        context.state = new Map();
      }

      // Get dependency values
      const depValues = deps.map((dep) => context.state!.get(dep));

      // Compute and store the value
      const computed = compute(...depValues);
      context.state.set(key, computed);

      return computed;
    }) as Operation<T>;
    return result as T;
  })();
}

// ============================================================================
// STATE DEBUGGING OPERATIONS
// ============================================================================

/**
 * Logs all state for the current element.
 *
 * @param label - Optional label for the log
 * @returns A SyncWorkflow<void> that logs the state
 */
export function logState(label?: string): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const stateObj = context.state
        ? Object.fromEntries(context.state.entries())
        : {};
      console.log(label || "State:", stateObj);
    }) as Operation<void>;
  })();
}

/**
 * Logs a specific state key value.
 *
 * @param key - The state key to log
 * @param label - Optional label for the log
 * @returns A SyncWorkflow<void> that logs the value
 */
export function logStateKey(key: string, label?: string): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const value = context.state?.get(key);
      console.log(label || `State[${key}]:`, value);
    }) as Operation<void>;
  })();
}

/**
 * Gets a snapshot of all state as a plain object.
 *
 * @returns A SyncWorkflow that returns the state snapshot
 */
export function getStateSnapshot(): SyncWorkflow<Record<string, any>> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.state ? Object.fromEntries(context.state.entries()) : {};
    }) as Operation<Record<string, any>>;
    return result as Record<string, any>;
  })();
}

/**
 * Clears all state for the current element.
 *
 * @returns A SyncWorkflow<void> that clears the state
 */
export function clearState(): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      if (context.state) {
        context.state.clear();
      }
    }) as Operation<void>;
  })();
}

/**
 * Gets all state keys for the current element.
 *
 * @returns A SyncWorkflow<string[]> that returns an array of state keys
 */
export function getStateKeys(): SyncWorkflow<string[]> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return [];
      }
      return Array.from(context.state.keys());
    }) as Operation<string[]>;
    return result as string[];
  })();
}
