/**
 * @fileoverview Pure state operations for the generator submodule
 *
 * This module provides pure state management operations that return Workflow<T>
 * directly, enabling the new `yield*` pattern without needing wrapper functions.
 *
 * @example Basic Usage
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, setState, updateState } from 'watch-selector/generator';
 *
 * watch('.counter', async function*() {
 *   // Direct yield* syntax - no wrapper needed!
 *   const count = yield* getState<number>('clicks', 0);
 *   yield* setState('clicks', count + 1);
 *
 *   // Update state functionally
 *   yield* updateState<number>('total', (prev) => (prev || 0) + count);
 * });
 * ```
 */

import type { Workflow, WatchContext } from "../types";

// ============================================================================
// BASIC STATE OPERATIONS
// ============================================================================

/**
 * Get a state value for the current element using the pure generator API.
 *
 * This function retrieves state that is isolated to the current element, providing
 * persistent data storage that survives DOM mutations and element lifecycle events.
 * Each element maintains its own independent state scope.
 *
 * @param key The state key to retrieve
 * @param defaultValue Optional default value if state doesn't exist
 * @returns Workflow<T> that returns the state value when yielded
 *
 * @example Basic state retrieval
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, setState, text } from 'watch-selector/generator';
 *
 * watch('.counter', async function* () {
 *   const count = yield* getState<number>('count', 0);
 *   yield* text(`Current count: ${count}`);
 * });
 * ```
 *
 * @example State with default values
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, addClass } from 'watch-selector/generator';
 *
 * watch('.user-profile', async function* () {
 *   const theme = yield* getState<string>('theme', 'light');
 *   const preferences = yield* getState<object>('prefs', {});
 *
 *   yield* addClass(`theme-${theme}`);
 * });
 * ```
 *
 * @example Conditional logic based on state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, text, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('.notification', async function* () {
 *   const hasBeenSeen = yield* getState<boolean>('seen', false);
 *
 *   if (!hasBeenSeen) {
 *     yield* addClass('new-notification');
 *     yield* text('🔔 New message!');
 *   } else {
 *     yield* removeClass('new-notification');
 *   }
 * });
 * ```
 */
export function getState<T = any>(key: string, defaultValue?: T): Workflow<T> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const state = (context as any).state || new Map();
      return state.has(key) ? state.get(key) : defaultValue;
    };
    return result;
  })();
}

/**
 * Set a state value for the current element using the pure generator API.
 *
 * This function stores state that is isolated to the current element, providing
 * persistent data storage that survives DOM mutations and element lifecycle events.
 * State changes can trigger reactive updates in other parts of your application.
 *
 * @param key The state key to set
 * @param value The value to store
 * @returns Workflow<void> that sets the state when yielded
 *
 * @example Basic state setting
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { setState, click, text } from 'watch-selector/generator';
 *
 * watch('button', async function* () {
 *   yield* setState('clickCount', 0);
 *
 *   yield* click(async function* () {
 *     const count = yield* getState<number>('clickCount', 0);
 *     yield* setState('clickCount', count + 1);
 *     yield* text(`Clicked ${count + 1} times`);
 *   });
 * });
 * ```
 *
 * @example Setting complex state objects
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { setState, getState, input } from 'watch-selector/generator';
 *
 * interface FormData {
 *   email: string;
 *   name: string;
 *   isValid: boolean;
 * }
 *
 * watch('#user-form', async function* () {
 *   yield* setState<FormData>('formData', {
 *     email: '',
 *     name: '',
 *     isValid: false
 *   });
 *
 *   yield* input(async function* (event) {
 *     const input = event.target as HTMLInputElement;
 *     const formData = yield* getState<FormData>('formData');
 *
 *     const updatedData = {
 *       ...formData,
 *       [input.name]: input.value,
 *       isValid: input.form?.checkValidity() || false
 *     };
 *
 *     yield* setState('formData', updatedData);
 *   });
 * });
 * ```
 *
 * @example State-driven UI updates
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { setState, addClass, removeClass, text } from 'watch-selector/generator';
 *
 * watch('.status-widget', async function* () {
 *   const updateStatus = async function* (status: 'loading' | 'success' | 'error') {
 *     yield* setState('currentStatus', status);
 *     yield* removeClass('status-loading status-success status-error');
 *     yield* addClass(`status-${status}`);
 *
 *     const statusMessages = {
 *       loading: 'Processing...',
 *       success: 'Complete!',
 *       error: 'Something went wrong'
 *     };
 *
 *     yield* text(statusMessages[status]);
 *   };
 *
 *   yield* updateStatus('loading');
 * });
 * ```
 */
export function setState<T = any>(key: string, value: T): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      (context as any).state.set(key, value);
      return undefined;
    };
    return result;
  })();
}

/**
 * Update a state value using an updater function with the pure generator API.
 *
 * This function provides a functional way to update state by applying an updater
 * function to the current value. This is particularly useful for complex state
 * transformations and ensures atomic updates.
 *
 * @param key The state key to update
 * @param updater Function that receives current value and returns new value
 * @returns Workflow<T> that updates the state and returns the new value
 *
 * @example Incrementing a counter
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { updateState, text, click } from 'watch-selector/generator';
 *
 * watch('.counter', async function* () {
 *   yield* click(async function* () {
 *     const newCount = yield* updateState<number>('count', (prev) => (prev || 0) + 1);
 *     yield* text(`Count: ${newCount}`);
 *   });
 * });
 * ```
 *
 * @example Updating arrays
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { updateState, click, html } from 'watch-selector/generator';
 *
 * watch('.todo-list', async function* () {
 *   yield* click('.add-item', async function* () {
 *     const newTodos = yield* updateState<string[]>('todos', (todos = []) => [
 *       ...todos,
 *       `Todo item ${todos.length + 1}`
 *     ]);
 *
 *     const todoHTML = newTodos.map(todo => `<li>${todo}</li>`).join('');
 *     yield* html(`<ul>${todoHTML}</ul>`);
 *   });
 * });
 * ```
 *
 * @example Complex object updates
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { updateState, input, addClass, removeClass } from 'watch-selector/generator';
 *
 * interface UserSettings {
 *   theme: 'light' | 'dark';
 *   notifications: boolean;
 *   language: string;
 * }
 *
 * watch('.settings-form', async function* () {
 *   yield* input('select[name="theme"]', async function* (event) {
 *     const select = event.target as HTMLSelectElement;
 *
 *     const updatedSettings = yield* updateState<UserSettings>('settings', (current) => ({
 *       theme: 'light',
 *       notifications: true,
 *       language: 'en',
 *       ...current,
 *       theme: select.value as 'light' | 'dark'
 *     }));
 *
 *     yield* removeClass('theme-light theme-dark');
 *     yield* addClass(`theme-${updatedSettings.theme}`);
 *   });
 * });
 * ```
 *
 * @example State validation and fallbacks
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { updateState, getState, text } from 'watch-selector/generator';
 *
 * watch('.score-display', async function* () {
 *   const updateScore = async function* (points: number) {
 *     const newScore = yield* updateState<number>('score', (currentScore) => {
 *       const current = currentScore || 0;
 *       const updated = current + points;
 *
 *       // Ensure score never goes below 0
 *       return Math.max(0, updated);
 *     });
 *
 *     yield* text(`Score: ${newScore}`);
 *   };
 *
 *   yield* updateScore(0); // Initialize
 * });
 * ```
 */
export function updateState<T = any>(
  key: string,
  updater: (current: T | undefined) => T,
): Workflow<T> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentValue = state.get(key);
      const newValue = updater(currentValue);
      state.set(key, newValue);
      return newValue;
    };
    return result;
  })();
}

/**
 * Check if a state key exists for the current element using the pure generator API.
 *
 * This function checks whether a specific state key has been set for the current element,
 * useful for conditional logic and state validation.
 *
 * @param key The state key to check
 * @returns Workflow<boolean> that returns whether the state exists
 *
 * @example Conditional initialization
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { hasState, setState, getState } from 'watch-selector/generator';
 *
 * watch('.component', async function* () {
 *   const isInitialized = yield* hasState('initialized');
 *
 *   if (!isInitialized) {
 *     yield* setState('initialized', true);
 *     yield* setState('createdAt', Date.now());
 *     console.log('Component initialized for the first time');
 *   }
 * });
 * ```
 *
 * @example Feature flags and configuration
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { hasState, setState, addClass } from 'watch-selector/generator';
 *
 * watch('.feature-component', async function* () {
 *   const hasConfig = yield* hasState('config');
 *
 *   if (!hasConfig) {
 *     // Set default configuration
 *     yield* setState('config', {
 *       enableAdvancedFeatures: false,
 *       theme: 'default',
 *       autoSave: true
 *     });
 *   }
 *
 *   const config = yield* getState('config');
 *   if (config.enableAdvancedFeatures) {
 *     yield* addClass('advanced-mode');
 *   }
 * });
 * ```
 *
 * @example State migration and versioning
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { hasState, getState, setState, deleteState } from 'watch-selector/generator';
 *
 * watch('.versioned-component', async function* () {
 *   const hasVersion = yield* hasState('stateVersion');
 *   const currentVersion = 2;
 *
 *   if (!hasVersion) {
 *     // First time setup
 *     yield* setState('stateVersion', currentVersion);
 *     yield* setState('data', { version: currentVersion, items: [] });
 *   } else {
 *     const version = yield* getState<number>('stateVersion');
 *
 *     if (version < currentVersion) {
 *       // Migrate old state
 *       const oldData = yield* getState('data');
 *       const migratedData = migrateData(oldData, version, currentVersion);
 *
 *       yield* setState('data', migratedData);
 *       yield* setState('stateVersion', currentVersion);
 *     }
 *   }
 * });
 * ```
 */
export function hasState(key: string): Workflow<boolean> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const state = (context as any).state;
      return state ? state.has(key) : false;
    };
    return result;
  })();
}

/**
 * Delete a state key for the current element using the pure generator API.
 *
 * This function removes a specific state key from the current element's state,
 * useful for cleanup operations and state management.
 *
 * @param key The state key to delete
 * @returns Workflow<boolean> that returns whether the key was deleted
 *
 * @example Cleanup on completion
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { deleteState, setState, getState, click } from 'watch-selector/generator';
 *
 * watch('.task-item', async function* () {
 *   yield* click('.complete-btn', async function* () {
 *     yield* setState('completed', true);
 *     yield* addClass('completed');
 *
 *     // Clean up temporary state
 *     yield* deleteState('inProgress');
 *     yield* deleteState('startTime');
 *   });
 * });
 * ```
 *
 * @example Session cleanup
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { deleteState, hasState, onUnmount } from 'watch-selector/generator';
 *
 * watch('.user-session', async function* () {
 *   yield* onUnmount(async function* () {
 *     // Clean up sensitive session data
 *     const hasSensitiveData = yield* hasState('authToken');
 *     if (hasSensitiveData) {
 *       yield* deleteState('authToken');
 *       yield* deleteState('userCredentials');
 *       console.log('Session data cleaned up');
 *     }
 *   });
 * });
 * ```
 *
 * @example Conditional state cleanup
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { deleteState, getState, setState } from 'watch-selector/generator';
 *
 * watch('.cache-manager', async function* () {
 *   const clearExpiredCache = async function* () {
 *     const cacheData = yield* getState<{timestamp: number, data: any}>('cache');
 *
 *     if (cacheData && Date.now() - cacheData.timestamp > 300000) { // 5 minutes
 *       const wasDeleted = yield* deleteState('cache');
 *       if (wasDeleted) {
 *         console.log('Expired cache cleared');
 *         yield* setState('cacheStatus', 'cleared');
 *       }
 *     }
 *   };
 *
 *   // Check for expired cache periodically
 *   setInterval(() => clearExpiredCache(), 60000);
 * });
 * ```
 */
export function deleteState(key: string): Workflow<boolean> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const state = (context as any).state;
      return state ? state.delete(key) : false;
    };
    return result;
  })();
}

// ============================================================================
// ADVANCED STATE OPERATIONS
// ============================================================================

/**
 * Initialize state with a default value if it doesn't exist
 * @param key The state key
 * @param defaultValue The default value to set
 * @returns Workflow that returns the current or newly set value
 */
export function initState<T = any>(key: string, defaultValue: T): Workflow<T> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      if (!state.has(key)) {
        state.set(key, defaultValue);
      }
      return state.get(key);
    };
    return result;
  })();
}

/**
 * Increment a numeric state value
 * @param key The state key
 * @param amount The amount to increment by (default: 1)
 * @returns Workflow that returns the new value
 */
export function incrementState(
  key: string,
  amount: number = 1,
): Workflow<number> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentValue = (state.get(key) as number) || 0;
      const newValue = currentValue + amount;
      state.set(key, newValue);
      return newValue;
    };
    return result;
  })();
}

/**
 * Decrement a numeric state value
 * @param key The state key
 * @param amount The amount to decrement by (default: 1)
 * @returns Workflow that returns the new value
 */
export function decrementState(
  key: string,
  amount: number = 1,
): Workflow<number> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentValue = (state.get(key) as number) || 0;
      const newValue = currentValue - amount;
      state.set(key, newValue);
      return newValue;
    };
    return result;
  })();
}

/**
 * Toggle a boolean state value
 * @param key The state key
 * @returns Workflow that returns the new boolean value
 */
export function toggleState(key: string): Workflow<boolean> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentValue = !!state.get(key);
      const newValue = !currentValue;
      state.set(key, newValue);
      return newValue;
    };
    return result;
  })();
}

/**
 * Append a value to an array state
 * @param key The state key
 * @param value The value to append
 * @returns Workflow that returns the new array
 */
export function appendToState<T = any>(key: string, value: T): Workflow<T[]> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentArray = (state.get(key) as T[]) || [];
      const newArray = [...currentArray, value];
      state.set(key, newArray);
      return newArray;
    };
    return result;
  })();
}

/**
 * Prepend a value to an array state
 * @param key The state key
 * @param value The value to prepend
 * @returns Workflow that returns the new array
 */
export function prependToState<T = any>(key: string, value: T): Workflow<T[]> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentArray = (state.get(key) as T[]) || [];
      const newArray = [value, ...currentArray];
      state.set(key, newArray);
      return newArray;
    };
    return result;
  })();
}

/**
 * Remove a value from an array state
 * @param key The state key
 * @param value The value to remove
 * @returns Workflow that returns the new array
 */
export function removeFromState<T = any>(key: string, value: T): Workflow<T[]> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentArray = (state.get(key) as T[]) || [];
      const newArray = currentArray.filter((item) => item !== value);
      state.set(key, newArray);
      return newArray;
    };
    return result;
  })();
}

/**
 * Merge an object into an object state
 * @param key The state key
 * @param updates The object to merge
 * @returns Workflow that returns the new merged object
 */
export function mergeState<T extends Record<string, any> = Record<string, any>>(
  key: string,
  updates: Partial<T>,
): Workflow<T> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentObject = (state.get(key) as T) || ({} as T);
      const newObject = { ...currentObject, ...updates };
      state.set(key, newObject);
      return newObject;
    };
    return result;
  })();
}

// ============================================================================
// STATE WATCHING OPERATIONS
// ============================================================================

/**
 * Watch for changes to a state value
 * @param key The state key to watch
 * @param callback Function called when state changes
 * @returns Workflow that sets up the state watcher
 */
export function watchState<T = any>(
  key: string,
  callback: (newValue: T, oldValue: T | undefined) => void,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // This is a simplified implementation - in a real system you'd
      // want to integrate with the actual state management system
      if (!(context as any).stateWatchers) {
        (context as any).stateWatchers = new Map();
      }
      (context as any).stateWatchers.set(key, callback);
      return undefined;
    };
    return result;
  })();
}

// ============================================================================
// REACTIVE STATE OPERATIONS
// ============================================================================

/**
 * Create a computed state value that depends on other state
 * @param key The computed state key
 * @param dependencies Array of state keys this computation depends on
 * @param compute Function that computes the value from dependencies
 * @returns Workflow that sets up the computed state
 */
export function computedState<T = any>(
  key: string,
  dependencies: string[],
  compute: (values: any[]) => T,
): Workflow<T> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;

      // Get current values of dependencies
      const dependencyValues = dependencies.map((dep) => state.get(dep));

      // Compute the new value
      const computedValue = compute(dependencyValues);

      // Store the computed value
      state.set(key, computedValue);

      // In a real implementation, you'd set up reactivity here
      // to recompute when dependencies change

      return computedValue;
    };
    return result;
  })();
}

// ============================================================================
// STATE DEBUGGING OPERATIONS
// ============================================================================

/**
 * Log all state for the current element
 * @param prefix Optional prefix for the log message
 * @returns Workflow that logs the state
 */
export function logState(prefix: string = "State"): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const state = (context as any).state;
      if (state) {
        const stateObject = Object.fromEntries(state.entries());
        console.log(`[${prefix}]`, stateObject, context.element);
      } else {
        console.log(`[${prefix}] No state`, context.element);
      }
      return undefined;
    };
    return result;
  })();
}

/**
 * Log a specific state key
 * @param key The state key to log
 * @param prefix Optional prefix for the log message
 * @returns Workflow that logs the state key
 */
export function logStateKey(key: string, prefix?: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const state = (context as any).state;
      const value = state ? state.get(key) : undefined;
      const logPrefix = prefix || `State[${key}]`;
      console.log(`[${logPrefix}]`, value, context.element);
      return undefined;
    };
    return result;
  })();
}

/**
 * Get a snapshot of all state for the current element
 * @returns Workflow that returns a snapshot of all state
 */
export function getStateSnapshot(): Workflow<Record<string, any>> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const state = (context as any).state;
      return state ? Object.fromEntries(state.entries()) : {};
    };
    return result;
  })();
}

/**
 * Clear all state for the current element
 * @returns Workflow that clears all state
 */
export function clearState(): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if ((context as any).state) {
        (context as any).state.clear();
      }
      return undefined;
    };
    return result;
  })();
}
