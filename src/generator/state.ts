/**
 * @fileoverview Pure state operations for the generator submodule
 *
 * This module provides pure state management operations that return Workflow<T>
 * directly, enabling the new `yield*` pattern without needing wrapper functions.
 * Each element maintains its own isolated state that persists across DOM mutations
 * and re-observations.
 *
 * ## State Persistence
 *
 * State is stored per-element and survives:
 * - Element re-observation (element removed and re-added to DOM)
 * - Attribute changes
 * - Class changes
 * - Parent changes
 *
 * State is cleared when:
 * - The element is garbage collected
 * - `clearState()` is explicitly called
 * - The watch controller is destroyed
 *
 * @example Basic State Management
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
 *
 * @example Complex State Objects
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, setState, mergeState } from 'watch-selector/generator';
 *
 * interface UserData {
 *   name: string;
 *   email: string;
 *   preferences: Record<string, any>;
 * }
 *
 * watch('.user-profile', async function*() {
 *   // Initialize complex state
 *   const user = yield* getState<UserData>('user', {
 *     name: '',
 *     email: '',
 *     preferences: {}
 *   });
 *
 *   // Merge partial updates
 *   yield* mergeState('user', {
 *     preferences: { theme: 'dark' }
 *   });
 * });
 * ```
 *
 * @module generator/state
 */

import type { Workflow, WatchContext, Operation } from "../types";

// ============================================================================
// BASIC STATE OPERATIONS
// ============================================================================

/**
 * Gets a state value for the current element using the pure generator API.
 *
 * This function retrieves state that is isolated to the current element, providing
 * persistent data storage that survives DOM mutations and element lifecycle events.
 * Each element maintains its own independent state scope. State keys are strings
 * and values can be any serializable type.
 *
 * @template T - The type of the state value
 * @param key - The state key to retrieve
 * @param defaultValue - Optional default value if state doesn't exist
 * @returns A Workflow<T> that returns the state value when yielded
 *
 * @example Basic state retrieval with typing
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, setState, text } from 'watch-selector/generator';
 *
 * watch('.counter', async function* () {
 *   // Type is inferred from default value
 *   const count = yield* getState('count', 0);  // number
 *
 *   // Explicit type for complex objects
 *   const user = yield* getState<{name: string; id: number}>('user');
 *
 *   yield* text(`Count: ${count}`);
 * });
 * ```
 *
 * @example State with default values
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, addClass } from 'watch-selector/generator';
 *
 * watch('.user-profile', async function* () {
 *   // Default values prevent undefined
 *   const theme = yield* getState<string>('theme', 'light');
 *   const preferences = yield* getState('prefs', {
 *     notifications: true,
 *     sound: false
 *   });
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
 *   const viewCount = yield* getState<number>('views', 0);
 *
 *   if (!hasBeenSeen) {
 *     yield* addClass('new-notification');
 *     yield* text(`🔔 New message!`);
 *   } else {
 *     yield* removeClass('new-notification');
 *     yield* text(`Viewed ${viewCount} times`);
 *   }
 * });
 * ```
 *
 * @see {@link setState} - For setting state values
 * @see {@link updateState} - For updating state with a function
 * @see {@link hasState} - For checking if state exists
 */
export function getState<T = any>(key: string, defaultValue?: T): Workflow<T> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      const state = (context as any).state || new Map();
      return state.has(key) ? state.get(key) : defaultValue;
    }) as Operation<T>;
    return result;
  })();
}

/**
 * Sets a state value for the current element using the pure generator API.
 *
 * This function stores state that is isolated to the current element, providing
 * persistent data storage that survives DOM mutations and element lifecycle events.
 * The state is stored in a Map associated with the element, so any serializable
 * value can be stored.
 *
 * @template T - The type of the state value
 * @param key - The state key to set
 * @param value - The value to store (can be any type)
 * @returns A Workflow<void> that sets the state when yielded
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
    yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      (context as any).state.set(key, value);
    }) as Operation<void>;
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
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentValue = state.get(key);
      const newValue = updater(currentValue);
      state.set(key, newValue);
      return newValue;
    }) as Operation<T>;
    return result;
  })();
}

/**
 * Check if a state key exists for the current element using the pure generator API.
 *
 * This function checks whether a specific state key has been set for the current element,
 * useful for conditional logic and state validation.
 *
 * @param key - The state key to check
 * @returns A Workflow<boolean> that returns true if the key exists
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
    const result = yield ((context: WatchContext) => {
      const state = (context as any).state;
      return state ? state.has(key) : false;
    }) as Operation<boolean>;
    return result;
  })();
}

/**
 * Delete a state key for the current element using the pure generator API.
 *
 * This function removes a specific state key from the current element's state,
 * useful for cleanup operations and state management.
 *
 * @param key - The state key to delete
 * @returns A Workflow<boolean> that returns true if the key was deleted
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
    const result = yield ((context: WatchContext) => {
      const state = (context as any).state;
      return state ? state.delete(key) : false;
    }) as Operation<boolean>;
    return result;
  })();
}

// ============================================================================
// ADVANCED STATE OPERATIONS
// ============================================================================

/**
 * Ensure a per-element state entry exists for `key` and return its value.
 *
 * If the element's state Map does not exist it is created. If `key` is not present
 * the `defaultValue` is stored and returned; otherwise the existing value is returned.
 *
 * @param key - The state key to initialize
 * @param defaultValue - Value to set when the key is absent
 * @returns The current value for `key` (existing or the `defaultValue`)
 */
export function initState<T = any>(key: string, defaultValue: T): Workflow<T> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      if (!state.has(key)) {
        state.set(key, defaultValue);
      }
      return state.get(key);
    }) as Operation<T>;
    return result;
  })();
}

/**
 * Increments a numeric state value by a specified amount.
 *
 * If the state doesn't exist or is not a number, treats it as 0.
 * This is a convenience function for the common pattern of incrementing counters.
 *
 * @param key - The state key to increment
 * @param amount - The amount to increment by (default: 1)
 * @returns A Workflow<number> that returns the new value
 *
 * @example Simple counter
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { incrementState, text } from 'watch-selector/generator';
 *
 * watch('.counter', async function* () {
 *   const count = yield* incrementState('clicks');
 *   yield* text(`Clicks: ${count}`);
 * });
 * ```
 */
export function incrementState(
  key: string,
  amount: number = 1,
): Workflow<number> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentValue = (state.get(key) as number) || 0;
      const newValue = currentValue + amount;
      state.set(key, newValue);
      return newValue;
    }) as Operation<number>;
    return result;
  })();
}

/**
 * Decrements a numeric state value by a specified amount.
 *
 * If the state doesn't exist or is not a number, treats it as 0.
 * This is a convenience function for the common pattern of decrementing counters.
 *
 * @param key - The state key to decrement
 * @param amount - The amount to decrement by (default: 1)
 * @returns A Workflow<number> that returns the new value
 *
 * @example Countdown timer
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { decrementState, text, hide } from 'watch-selector/generator';
 *
 * watch('.countdown', async function* () {
 *   const remaining = yield* decrementState('seconds');
 *
 *   if (remaining <= 0) {
 *     yield* hide();
 *   } else {
 *     yield* text(`${remaining} seconds remaining`);
 *   }
 * });
 * ```
 */
export function decrementState(
  key: string,
  amount: number = 1,
): Workflow<number> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentValue = (state.get(key) as number) || 0;
      const newValue = currentValue - amount;
      state.set(key, newValue);
      return newValue;
    }) as Operation<number>;
    return result;
  })();
}

/**
 * Toggles a boolean state value between true and false.
 *
 * If the state doesn't exist or is not a boolean, treats it as false initially.
 * Returns the new boolean value after toggling.
 *
 * @param key - The state key to toggle
 * @returns A Workflow<boolean> that returns the new boolean value
 *
 * @example Toggle UI state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { toggleState, toggleClass } from 'watch-selector/generator';
 *
 * watch('.expandable', async function* () {
 *   const isExpanded = yield* toggleState('expanded');
 *   yield* toggleClass('expanded', isExpanded);
 * });
 * ```
 */
export function toggleState(key: string): Workflow<boolean> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentValue = !!state.get(key);
      const newValue = !currentValue;
      state.set(key, newValue);
      return newValue;
    }) as Operation<boolean>;
    return result;
  })();
}

/**
 * Append a value to an array stored under the given state key and return the new array.
 *
 * Ensures the element's per-element state Map exists. If the existing value is not an array
 * (or is missing), a new array containing the provided value is created and stored.
 * A new array is returned (the stored array is replaced, not mutated in place).
 *
 * @template T - Element type of the array
 * @param key - State key that holds the array
 * @param value - Value to append to the array
 * @returns A Workflow that yields the updated array stored at `key`
 */
export function appendToState<T = any>(key: string, value: T): Workflow<T[]> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentArray = (state.get(key) as T[]) || [];
      const newArray = [...currentArray, value];
      state.set(key, newArray);
      return newArray;
    }) as Operation<T[]>;
    return result;
  })();
}

/**
 * Prepends a value to the beginning of an array stored in state.
 *
 * If the state doesn't exist or is not an array, creates a new array with the value.
 * Returns the updated array. This creates a new array rather than mutating the existing one.
 *
 * @template T - The type of array elements
 * @param key - The state key containing the array
 * @param value - The value to prepend
 * @returns A Workflow<T[]> that returns the new array
 *
 * @example Adding notifications to the top
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prependToState } from 'watch-selector/generator';
 *
 * watch('.notification-list', async function* () {
 *   const notification = { message: 'New alert!', timestamp: Date.now() };
 *   const notifications = yield* prependToState('notifications', notification);
 * });
 * ```
 */
export function prependToState<T = any>(key: string, value: T): Workflow<T[]> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentArray = (state.get(key) as T[]) || [];
      const newArray = [value, ...currentArray];
      state.set(key, newArray);
      return newArray;
    }) as Operation<T[]>;
    return result;
  })();
}

/**
 * Removes a value from an array stored in state.
 *
 * Removes all occurrences of the value from the array using strict equality (===).
 * If the state doesn't exist or is not an array, returns an empty array.
 * This creates a new array rather than mutating the existing one.
 *
 * @template T - The type of array elements
 * @param key - The state key containing the array
 * @param value - The value to remove
 * @returns A Workflow<T[]> that returns the new array
 *
 * @example Removing items from a list
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { removeFromState, getState } from 'watch-selector/generator';
 *
 * watch('.remove-item', async function* () {
 *   const itemToRemove = yield* getState('selectedItem');
 *   const items = yield* removeFromState('items', itemToRemove);
 *   console.log(`Items remaining: ${items.length}`);
 * });
 * ```
 */
export function removeFromState<T = any>(key: string, value: T): Workflow<T[]> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentArray = (state.get(key) as T[]) || [];
      const newArray = currentArray.filter((item) => item !== value);
      state.set(key, newArray);
      return newArray;
    }) as Operation<T[]>;
    return result;
  })();
}

/**
 * Merges a partial object into existing object state.
 *
 * Performs a shallow merge of the updates into the existing state object.
 * If the state doesn't exist or is not an object, treats it as an empty object.
 * This creates a new object rather than mutating the existing one.
 *
 * @template T - The type of the state object
 * @param key - The state key containing the object
 * @param updates - The partial object to merge
 * @returns A Workflow<T> that returns the merged object
 *
 * @example Updating user preferences
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { mergeState } from 'watch-selector/generator';
 *
 * watch('.settings', async function* () {
 *   const updated = yield* mergeState('preferences', {
 *     theme: 'dark',
 *     fontSize: 'large'
 *   });
 *   // Existing preferences are preserved, only specified keys are updated
 * });
 * ```
 */
export function mergeState<T extends Record<string, any> = Record<string, any>>(
  key: string,
  updates: Partial<T>,
): Workflow<T> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;
      const currentObject = (state.get(key) as T) || ({} as T);
      const newObject = { ...currentObject, ...updates };
      state.set(key, newObject);
      return newObject;
    }) as Operation<T>;
    return result;
  })();
}

// ============================================================================
// STATE WATCHING OPERATIONS
// ============================================================================

/**
 * Registers a per-element watcher callback for a state key.
 *
 * The returned Workflow, when executed, stores `callback` in the element's
 * `stateWatchers` Map on the watch context under `key`. This function only
 * registers the watcher (it does not trigger callbacks or persist computed
 * values) and will overwrite any existing watcher for the same key.
 *
 * @param key - State key to watch
 * @param callback - Called with `(newValue, oldValue)` when the watched key changes
 * @returns A Workflow that installs the watcher on the current element context
 */
export function watchState<T = any>(
  key: string,
  callback: (newValue: T, oldValue: T | undefined) => void,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      // This is a simplified implementation - in a real system you'd
      // want to integrate with the actual state management system
      if (!(context as any).stateWatchers) {
        (context as any).stateWatchers = new Map();
      }
      (context as any).stateWatchers.set(key, callback);
    }) as Operation<void>;
  })();
}

// ============================================================================
// REACTIVE STATE OPERATIONS
// ============================================================================

/**
 * Produce a derived value computed from other per-element state entries.
 *
 * The returned Workflow reads the current values of the given dependency keys
 * from the element's state map, calls `compute` with an object mapping each
 * dependency key to its current value, and yields the computed result.
 * The element state Map is created if it does not already exist. The computed
 * value is returned but not persisted back into state.
 *
 * @param dependencies - List of state keys whose current values are supplied to `compute`
 * @param compute - Function that receives a Record mapping dependency keys to their current values and returns the derived value
 * @returns A Workflow that yields the computed value of type `T`
 */
export function computedState<T = any>(
  dependencies: string[],
  compute: (values: Record<string, any>) => T,
): Workflow<T> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      if (!(context as any).state) {
        (context as any).state = new Map();
      }
      const state = (context as any).state;

      // Get current values of dependencies as an object
      const dependencyValues: Record<string, any> = {};
      dependencies.forEach((dep) => {
        dependencyValues[dep] = state.get(dep);
      });

      // Compute the value
      const computedValue = compute(dependencyValues);

      return computedValue;
    }) as Operation<T>;
    return result;
  })();
}

// ============================================================================
// STATE DEBUGGING OPERATIONS
// ============================================================================

/**
 * Log the entire per-element state to the console for debugging.
 *
 * If a state Map exists on the current element, its entries are converted to
 * a plain object and logged together with the element reference. If no state
 * exists, a notice is logged with the element reference. This operation does
 * not modify stored state.
 *
 * @param prefix - Optional label prepended to the log message (default: `"State"`)
 * @returns A Workflow that, when yielded, writes the state snapshot to the console
 */
export function logState(prefix: string = "State"): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      const state = (context as any).state;
      if (state) {
        const stateObject = Object.fromEntries(state.entries());
        console.log(`[${prefix}]`, stateObject, context.element);
      } else {
        console.log(`[${prefix}] No state`, context.element);
      }
    }) as Operation<void>;
  })();
}

/**
 * Log the value of a single per-element state key to the console for debugging.
 *
 * If the key is not present the logged value will be `undefined`. The log includes
 * an element reference to help locate which element the state belongs to.
 *
 * @param key - The state key to read and log.
 * @param prefix - Optional label shown in the log; defaults to `State[<key>]`.
 * @returns A Workflow that logs the state value when yielded.
 */
export function logStateKey(key: string, prefix?: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      const state = (context as any).state;
      const value = state ? state.get(key) : undefined;
      const logPrefix = prefix || `State[${key}]`;
      console.log(`[${logPrefix}]`, value, context.element);
    }) as Operation<void>;
  })();
}

/**
 * Return a plain-object snapshot of all per-element state.
 *
 * Produces a Workflow that yields a shallow, independent object mapping state keys to their values for the current element. If no state exists for the element, the workflow resolves to an empty object.
 *
 * @returns A Workflow that resolves to a Record of the element's current state entries.
 */
export function getStateSnapshot(): Workflow<Record<string, any>> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      const state = (context as any).state;
      return state ? Object.fromEntries(state.entries()) : {};
    }) as Operation<Record<string, any>>;
    return result;
  })();
}

/**
 * Clears all state for the current element.
 *
 * Removes all state keys and values, effectively resetting the element's state
 * to an empty Map. Use with caution as this cannot be undone.
 *
 * @returns A Workflow<void> that clears all state when yielded
 *
 * @example Resetting element state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { setState, clearState, hasState } from 'watch-selector/generator';
 *
 * watch('.resettable', async function* () {
 *   yield* setState('temp1', 'value1');
 *   yield* setState('temp2', 'value2');
 *
 *   // Reset everything
 *   yield* clearState();
 *
 *   const hasTemp1 = yield* hasState('temp1'); // false
 * });
 * ```
 */
export function clearState(): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      if ((context as any).state) {
        (context as any).state.clear();
      }
    }) as Operation<void>;
  })();
}
