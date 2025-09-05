// Enhanced state management for Watch v5

import type {
  TypedState,
  CleanupFunction,
  TypedGeneratorContext,
  WatchContext,
  Operation,
  Workflow,
} from "../types";
import { getCurrentContext } from "./context";
import { getCleanupRegistry } from "./generator";

// Global state storage per element
let elementStates = new WeakMap<HTMLElement, Record<string, any>>();

// Get state map for an element (for Workflow implementations)
function getElementStateMap(element: HTMLElement): Map<string, any> {
  // Convert the record-based state to a Map for consistency with other code
  const record = elementStates.get(element) || {};
  const map = new Map<string, any>();
  Object.entries(record).forEach(([key, value]) => {
    map.set(key, value);
  });

  // Wrap the map to sync back to the record when modified
  const originalSet = map.set.bind(map);
  const originalDelete = map.delete.bind(map);

  map.set = (key: string, value: any) => {
    const result = originalSet(key, value);
    // Sync back to record
    if (!elementStates.has(element)) {
      elementStates.set(element, {});
    }
    elementStates.get(element)![key] = value;
    return result;
  };

  map.delete = (key: string) => {
    const result = originalDelete(key);
    // Sync back to record
    const record = elementStates.get(element);
    if (record) {
      delete record[key];
    }
    return result;
  };

  return map;
}

// Get state for current element
function getElementState(
  ctx?: TypedGeneratorContext<any>,
): Record<string, any> {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error(
      "State functions can only be called within a generator context",
    );
  }

  const element = context.element;
  if (!elementStates.has(element)) {
    elementStates.set(element, {});
  }

  return elementStates.get(element)!;
}

// Basic state functions

/**
 * Gets the value of a state key for the current element context.
 *
 * This function retrieves state that is associated with the current element in a watch
 * generator. Each element maintains its own isolated state that persists across DOM
 * changes and re-renders. The state is automatically cleaned up when the element is
 * removed from the DOM.
 *
 * @template T - The type of the state value
 * @param key - The state key to retrieve
 * @param ctx - Optional context (usually auto-detected in generators)
 * @returns The state value, or undefined if not set
 *
 * @example Basic usage in a generator
 * ```typescript
 * import { watch, getState, setState, click } from 'watch-selector';
 *
 * watch('.counter', function* () {
 *   // Get current count, defaulting to 0
 *   const count = getState<number>('count') || 0;
 *
 *   yield click(function* () {
 *     const newCount = getState<number>('count') || 0;
 *     setState('count', newCount + 1);
 *   });
 * });
 * ```
 *
 * @example Type-safe state access
 * ```typescript
 * import { watch, getState, setState } from 'watch-selector';
 *
 * interface UserData {
 *   name: string;
 *   age: number;
 * }
 *
 * watch('.user-profile', function* () {
 *   // Type-safe state access
 *   const user = getState<UserData>('user');
 *   if (user) {
 *     console.log(`${user.name} is ${user.age} years old`);
 *   }
 * });
 * ```
 */
export function getState<T = any>(
  key: string,
  ctx?: TypedGeneratorContext<any>,
): T {
  const state = getElementState(ctx);
  return state[key] as T;
}

/**
 * Generator version of getState() for yield* usage.
 *
 * Returns a Workflow that yields the state value for the given key. Use this when
 * you need to access element state within a generator using the yield* pattern.
 *
 * @template T - The type of the state value
 * @param key - The state key to retrieve
 * @param defaultValue - Optional default value if key doesn't exist
 * @returns Workflow that yields the state value or undefined
 *
 * @example Basic state retrieval with yield*
 * ```typescript
 * watch('.counter', function* () {
 *   const count = yield* getState.gen<number>('count', 0);
 *   console.log(`Current count: ${count}`);
 *
 *   yield* text(`Count: ${count}`);
 * });
 * ```
 *
 * @example Complex state objects
 * ```typescript
 * interface UserData {
 *   name: string;
 *   email: string;
 *   preferences: { theme: string };
 * }
 *
 * watch('.user-profile', function* () {
 *   const user = yield* getState.gen<UserData>('user');
 *   if (user) {
 *     yield* text(`Welcome, ${user.name}!`);
 *     yield* addClass(`theme-${user.preferences.theme}`);
 *   }
 * });
 * ```
 */
getState.gen = function <T = any>(
  key: string,
  defaultValue?: T,
): Workflow<T | undefined> {
  return (function* (): Generator<
    Operation<T | undefined>,
    T | undefined,
    any
  > {
    const op: Operation<T | undefined> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      return elementStateMap.has(key)
        ? (elementStateMap.get(key) as T)
        : defaultValue;
    };
    const value = yield op;
    return value;
  })();
};

/**
 * Sets a state value for the current element context.
 *
 * This function sets state that is associated with the current element in a watch
 * generator. The state is isolated per element instance and persists across DOM
 * changes. This enables you to maintain component-like state for each element
 * independently.
 *
 * @template T - The type of the state value
 * @param key - The state key to set
 * @param value - The value to set
 * @param ctx - Optional context (usually auto-detected in generators)
 *
 * @example Counter with persistent state
 * ```typescript
 * import { watch, getState, setState, click, text } from 'watch-selector';
 *
 * watch('.counter', function* () {
 *   // Initialize counter state
 *   const initialCount = getState<number>('count') || 0;
 *   setState('count', initialCount);
 *
 *   yield click(function* () {
 *     const current = getState<number>('count') || 0;
 *     setState('count', current + 1);
 *     yield text(`Count: ${current + 1}`);
 *   });
 * });
 * ```
 *
 * @example Complex state objects
 * ```typescript
 * import { watch, setState, getState } from 'watch-selector';
 *
 * interface FormState {
 *   isValid: boolean;
 *   errors: string[];
 *   data: Record<string, any>;
 * }
 *
 * watch('.form', function* () {
 *   // Set initial form state
 *   setState<FormState>('form', {
 *     isValid: false,
 *     errors: [],
 *     data: {}
 *   });
 * });
 * ```
 */
export function setState<T = any>(
  key: string,
  value: T,
  ctx?: TypedGeneratorContext<any>,
): void {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error(
      "State functions can only be called within a generator context",
    );
  }
  const oldValue = getState<T>(key, ctx);
  const state = getElementState(ctx);
  state[key] = value;

  // Trigger watchers only if value changed
  if (value !== oldValue) {
    if (batchDepth > 0) {
      // Store changes for later batch execution
      batchedUpdates.set(key, { newValue: value, oldValue });
    } else {
      const watchers = stateWatchers.get(key);
      if (watchers) {
        watchers.forEach((callback) => {
          try {
            callback(value, oldValue);
          } catch (e) {
            console.error("Error in state watcher:", e);
          }
        });
      }
    }
  }
}

/**
 * Generator version of setState() for yield* usage.
 *
 * Returns a Workflow that sets a state value for the given key. Use this when
 * you need to update element state within a generator using the yield* pattern.
 *
 * @template T - The type of the state value
 * @param key - The state key to set
 * @param value - The value to set
 * @returns Workflow that sets the state value
 *
 * @example Basic state updates with yield*
 * ```typescript
 * watch('.counter', function* () {
 *   yield* setState.gen('count', 0);
 *
 *   yield* click(function* () {
 *     const current = yield* getState.gen<number>('count', 0);
 *     yield* setState.gen('count', current + 1);
 *     yield* text(`Count: ${current + 1}`);
 *   });
 * });
 * ```
 *
 * @example Complex state updates
 * ```typescript
 * interface TodoState {
 *   items: string[];
 *   filter: 'all' | 'active' | 'completed';
 * }
 *
 * watch('.todo-app', function* () {
 *   yield* setState.gen<TodoState>('todos', {
 *     items: [],
 *     filter: 'all'
 *   });
 *
 *   yield* click('.add-todo', function* () {
 *     const current = yield* getState.gen<TodoState>('todos');
 *     yield* setState.gen('todos', {
 *       ...current,
 *       items: [...current.items, 'New todo']
 *     });
 *   });
 * });
 * ```
 */
setState.gen = function <T = any>(key: string, value: T): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    const op: Operation<void> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      const oldValue = elementStateMap.get(key);
      elementStateMap.set(key, value);

      // Trigger watchers only if value changed
      if (value !== oldValue) {
        const watchers = stateWatchers.get(key);
        if (watchers) {
          watchers.forEach((callback) => {
            try {
              callback(value, oldValue);
            } catch (e) {
              console.error("Error in state watcher:", e);
            }
          });
        }
      }
    };
    yield op;
  })();
};

/**
 * Updates a state value using an updater function.
 *
 * This function allows you to update state based on the current value, similar to
 * React's setState with a function. It's particularly useful for complex state
 * updates, immutable updates, or when you need to avoid race conditions.
 *
 * @template T - The type of the state value
 * @param key - The state key to update
 * @param updater - Function that receives current value and returns new value
 * @param ctx - Optional context (usually auto-detected in generators)
 *
 * @example Incrementing a counter
 * ```typescript
 * import { watch, updateState, click, text } from 'watch-selector';
 *
 * watch('.counter', function* () {
 *   yield click(function* () {
 *     updateState<number>('count', current => (current || 0) + 1);
 *     const newCount = getState<number>('count');
 *     yield text(`Count: ${newCount}`);
 *   });
 * });
 * ```
 *
 * @example Updating arrays immutably
 * ```typescript
 * import { watch, updateState, click } from 'watch-selector';
 *
 * watch('.todo-list', function* () {
 *   yield click('.add-item', function* () {
 *     updateState<string[]>('items', current => [
 *       ...(current || []),
 *       'New item'
 *     ]);
 *   });
 *
 *   yield click('.remove-item', function* () {
 *     updateState<string[]>('items', current =>
 *       (current || []).filter((_, index) => index !== 0)
 *     );
 *   });
 * });
 * ```
 */
export function updateState<T = any>(
  key: string,
  updater: (current: T) => T,
  ctx?: TypedGeneratorContext<any>,
): void {
  const oldValue = getState<T>(key, ctx);
  const state = getElementState(ctx);
  const current = state[key] as T;
  const newValue = updater(current);
  state[key] = newValue;

  // Trigger watchers only if value changed
  if (newValue !== oldValue) {
    if (batchDepth > 0) {
      // Store changes for later batch execution
      batchedUpdates.set(key, { newValue, oldValue });
    } else {
      const watchers = stateWatchers.get(key);
      if (watchers) {
        watchers.forEach((callback) => {
          try {
            callback(newValue, oldValue);
          } catch (e) {
            console.error("Error in state watcher:", e);
          }
        });
      }
    }
  }
}

/**
 * Generator version of updateState() for yield* usage.
 *
 * Returns a Workflow that updates state using an updater function and yields the new value.
 * Use this when you need to update state based on current value using yield*.
 *
 * @template T - The type of the state value
 * @param key - The state key to update
 * @param updater - Function that receives current value and returns new value
 * @returns Workflow that yields the new state value
 *
 * @example Counter increment with yield*
 * ```typescript
 * watch('.counter', function* () {
 *   yield* click(function* () {
 *     const newCount = yield* updateState.gen<number>('count', (current) => (current || 0) + 1);
 *     yield* text(`Count: ${newCount}`);
 *   });
 * });
 * ```
 *
 * @example Immutable array updates
 * ```typescript
 * watch('.todo-list', function* () {
 *   yield* click('.add-item', function* () {
 *     const newItems = yield* updateState.gen<string[]>('items', (current) => [
 *       ...(current || []),
 *       'New item'
 *     ]);
 *     yield* text(`Total items: ${newItems.length}`);
 *   });
 * });
 * ```
 */
updateState.gen = function <T = any>(
  key: string,
  updater: (current: T) => T,
): Workflow<T> {
  return (function* (): Generator<Operation<T>, T, any> {
    const op: Operation<T> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      const current = elementStateMap.get(key) as T;
      const newValue = updater(current);
      elementStateMap.set(key, newValue);

      // Trigger watchers only if value changed
      if (newValue !== current) {
        const watchers = stateWatchers.get(key);
        if (watchers) {
          watchers.forEach((callback) => {
            try {
              callback(newValue, current);
            } catch (e) {
              console.error("Error in state watcher:", e);
            }
          });
        }
      }
      return newValue;
    };
    const value = yield op;
    return value;
  })();
};

/**
 * Checks if a state key exists for the current element context.
 *
 * This function checks whether a specific state key has been set for the current
 * element. It's useful for conditionally initializing state or checking if
 * optional state has been provided.
 *
 * @param key - The state key to check
 * @param ctx - Optional context (usually auto-detected in generators)
 * @returns True if the key exists, false otherwise
 *
 * @example Conditional state initialization
 * ```typescript
 * import { watch, hasState, setState, getState } from 'watch-selector';
 *
 * watch('.component', function* () {
 *   // Initialize state only if not already set
 *   if (!hasState('initialized')) {
 *     setState('count', 0);
 *     setState('initialized', true);
 *   }
 *
 *   const count = getState<number>('count');
 *   console.log('Current count:', count);
 * });
 * ```
 *
 * @example Optional state handling
 * ```typescript
 * import { watch, hasState, getState } from 'watch-selector';
 *
 * watch('.user-widget', function* () {
 *   if (hasState('user')) {
 *     const user = getState<User>('user');
 *     // Handle user data
 *   } else {
 *     // Show loading state or initialize
 *   }
 * });
 * ```
 */
export function hasState(
  key: string,
  ctx?: TypedGeneratorContext<any>,
): boolean {
  const state = getElementState(ctx);
  return key in state;
}

/**
 * Generator version of hasState() for yield* usage.
 *
 * Returns a Workflow that yields true if the state key exists. Use this when
 * you need to check state existence within a generator using yield*.
 *
 * @param key - The state key to check
 * @returns Workflow that yields true if key exists, false otherwise
 *
 * @example Conditional logic based on state existence
 * ```typescript
 * watch('.component', function* () {
 *   const hasConfig = yield* hasState.gen('config');
 *
 *   if (!hasConfig) {
 *     yield* setState.gen('config', { theme: 'light', lang: 'en' });
 *     yield* addClass('first-time-setup');
 *   }
 * });
 * ```
 */
hasState.gen = function (key: string): Workflow<boolean> {
  return (function* (): Generator<Operation<boolean>, boolean, any> {
    const op: Operation<boolean> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      return elementStateMap.has(key);
    };
    const exists = yield op;
    return exists;
  })();
};

/**
 * Deletes a state key from the current element context.
 *
 * This function removes a state key and its associated value from the current
 * element's state. This is useful for cleaning up temporary state or resetting
 * specific parts of the component state.
 *
 * @param key - The state key to delete
 * @param ctx - Optional context (usually auto-detected in generators)
 *
 * @example Cleaning up temporary state
 * ```typescript
 * import { watch, setState, deleteState, click } from 'watch-selector';
 *
 * watch('.form', function* () {
 *   yield click('.submit', function* () {
 *     // Set loading state
 *     setState('isLoading', true);
 *
 *     try {
 *       await submitForm();
 *       // Clear loading state on success
 *       deleteState('isLoading');
 *     } catch (error) {
 *       deleteState('isLoading');
 *       setState('error', error.message);
 *     }
 *   });
 * });
 * ```
 *
 * @example Reset functionality
 * ```typescript
 * import { watch, deleteState, click } from 'watch-selector';
 *
 * watch('.counter', function* () {
 *   yield click('.reset', function* () {
 *     // Remove all counter-related state
 *     deleteState('count');
 *     deleteState('lastIncrement');
 *     deleteState('history');
 *   });
 * });
 * ```
 */
export function deleteState(
  key: string,
  ctx?: TypedGeneratorContext<any>,
): void {
  const state = getElementState(ctx);
  delete state[key];
}

/**
 * Generator version of deleteState() for yield* usage.
 *
 * Returns a Workflow that deletes a state key. Use this when you need
 * to remove state within a generator using the yield* pattern.
 *
 * @param key - The state key to delete
 * @returns Workflow that deletes the state key
 *
 * @example Clean up temporary state
 * ```typescript
 * watch('.form', function* () {
 *   yield* setState.gen('temp', 'processing...');
 *
 *   yield* submit(function* () {
 *     // Process form...
 *     yield* deleteState.gen('temp'); // Clean up temporary state
 *     yield* setState.gen('status', 'completed');
 *   });
 * });
 * ```
 */
deleteState.gen = function (key: string): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    const op: Operation<void> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      elementStateMap.delete(key);
    };
    yield op;
  })();
};

/**
 * # createTypedState() - Create a Typed State Manager
 *
 * Create a typed state manager that provides a clean API for managing
 * a specific state key with full type safety.
 *
 * ## Usage
 *
 * ```typescript
 * watch('.counter', function* () {
 *   // Create typed state managers
 *   const count = createTypedState<number>('count');
 *   const items = createTypedState<string[]>('items');
 *
 *   // Initialize if needed
 *   count.init(0);
 *   items.init([]);
 *
 *   // Use the state
 *   yield text(`Count: ${count.get()}`);
 *
 *   yield click(() => {
 *     count.update(n => n + 1);
 *     yield text(`Count: ${count.get()}`);
 *   });
 * });
 * ```
 *
 * ## Benefits
 *
 * - **Type Safety**: Full TypeScript support with generics
 * - **Clean API**: Methods instead of separate function calls
 * - **Encapsulation**: State key is encapsulated within the manager
 * - **Consistency**: Uniform interface for all state operations
 *
 * @param key - State key to manage
 * @param initialValue - Optional initial value
 * @returns Typed state manager object
 */
export function createTypedState<T>(
  key: string,
  initialValue?: T,
): TypedState<T> {
  // Initialize state if initial value is provided
  if (initialValue !== undefined) {
    const state = getElementState();
    if (!(key in state)) {
      state[key] = initialValue;
    }
  }

  return {
    get(): T {
      const state = getElementState();
      return state[key] as T;
    },

    set(value: T): void {
      const state = getElementState();
      state[key] = value;
    },

    update(fn: (current: T) => T): void {
      const state = getElementState();
      const current = state[key] as T;
      state[key] = fn(current);
    },

    init(value: T): void {
      const state = getElementState();
      if (!(key in state)) {
        state[key] = value;
      }
    },
  };
}

/**
 * # createState() - Create an Auto-Initialized State Manager
 *
 * Create a typed state manager that automatically initializes with a default value.
 * This is a convenience function that combines `createTypedState` with automatic
 * initialization.
 *
 * ## Usage
 *
 * ```typescript
 * watch('.todo-list', function* () {
 *   // Auto-initialized state managers
 *   const todos = createState<Todo[]>('todos', []);
 *   const filter = createState<string>('filter', 'all');
 *   const editingId = createState<string | null>('editingId', null);
 *
 *   // State is already initialized, ready to use
 *   const currentTodos = todos.get();
 *   const currentFilter = filter.get();
 *
 *   yield renderTodos(currentTodos, currentFilter);
 * });
 * ```
 *
 * ## Comparison with createTypedState
 *
 * ```typescript
 * // With createTypedState (manual initialization)
 * const count = createTypedState<number>('count');
 * count.init(0);
 *
 * // With createState (auto-initialization)
 * const count = createState<number>('count', 0);
 * ```
 *
 * @param key - State key to manage
 * @param initialValue - Initial value for the state
 * @returns Typed state manager object with initialized state
 */
export function createState<T>(key: string, initialValue: T): TypedState<T> {
  const typedState = createTypedState<T>(key);

  // Auto-initialize if not already set
  if (!hasState(key)) {
    typedState.set(initialValue);
  }

  return typedState;
}

// Computed state with dependency tracking
let computedCounter = 0;

export function createComputed<T>(
  fn: () => T,
  dependencies: string[] = [],
): { get(): T } {
  const computedId = ++computedCounter;
  const resultKey = `__computed_${computedId}`;
  const depsKey = `__computed_deps_${computedId}`;

  return {
    get(): T {
      const state = getElementState();

      // Get current dependency values
      const currentDeps = dependencies.map((dep) => state[dep]);
      const lastDeps = state[depsKey] as any[];

      // Check if dependencies changed
      const depsChanged =
        !lastDeps ||
        currentDeps.length !== lastDeps.length ||
        !currentDeps.every((dep, i) => dep === lastDeps[i]);

      if (depsChanged) {
        // Recompute
        const result = fn();
        state[resultKey] = result;
        state[depsKey] = currentDeps;
        return result;
      }

      // Return cached result
      return state[resultKey] as T;
    },
  };
}

// Reactive state that triggers callbacks on change
const stateWatchers = new Map<
  string,
  Set<(newValue: any, oldValue: any) => void>
>();
let batchDepth = 0;
let batchedUpdates = new Map<string, { newValue: any; oldValue: any }>();

export function watchState<T>(
  key: string,
  callback: (newValue: T, oldValue: T) => void,
): CleanupFunction {
  if (!stateWatchers.has(key)) {
    stateWatchers.set(key, new Set());
  }

  const watchers = stateWatchers.get(key)!;
  watchers.add(callback);

  return () => {
    watchers.delete(callback);
    if (watchers.size === 0) {
      stateWatchers.delete(key);
    }
  };
}

/**
 * Generator version of watchState() for yield* usage.
 *
 * Returns a Workflow that registers a state change watcher and yields the cleanup function.
 * Use this when you need to watch state changes within a generator using yield*.
 *
 * @template T - The type of the state value being watched
 * @param key - The state key to watch
 * @param callback - Function called when state changes
 * @returns Workflow that yields a cleanup function
 *
 * @example Watch state changes with yield*
 * ```typescript
 * watch('.status-display', function* () {
 *   const cleanup = yield* watchState.gen<string>('status', (newVal, oldVal) => {
 *     console.log(`Status changed from ${oldVal} to ${newVal}`);
 *   });
 *
 *   // The cleanup function will be automatically called when element is removed
 *   yield* cleanup.gen(cleanup);
 * });
 * ```
 *
 * @example React to complex state changes
 * ```typescript
 * interface AppState {
 *   user: { name: string; role: string };
 *   theme: 'light' | 'dark';
 * }
 *
 * watch('.app', function* () {
 *   yield* watchState.gen<AppState>('appState', (newState, oldState) => {
 *     if (newState.theme !== oldState?.theme) {
 *       document.body.className = `theme-${newState.theme}`;
 *     }
 *   });
 * });
 * ```
 */
watchState.gen = function <T>(
  key: string,
  callback: (newValue: T, oldValue: T) => void,
): Workflow<CleanupFunction> {
  return (function* (): Generator<
    Operation<CleanupFunction>,
    CleanupFunction,
    any
  > {
    const op: Operation<CleanupFunction> = (ctx: WatchContext) => {
      if (!stateWatchers.has(key)) {
        stateWatchers.set(key, new Set());
      }

      const watchers = stateWatchers.get(key)!;
      watchers.add(callback);

      const cleanup = () => {
        watchers.delete(callback);
        if (watchers.size === 0) {
          stateWatchers.delete(key);
        }
      };

      // Register cleanup with element
      const cleanupRegistry = getCleanupRegistry();
      if (!cleanupRegistry.has(ctx.element)) {
        cleanupRegistry.set(ctx.element, new Set());
      }
      cleanupRegistry.get(ctx.element)!.add(cleanup);

      return cleanup;
    };
    const cleanup = yield op;
    return cleanup;
  })();
};

// Enhanced setState that triggers watchers
export function setStateReactive<T>(key: string, value: T): void {
  const oldValue = getState<T>(key);
  const state = getElementState();
  state[key] = value;

  // Trigger watchers only if value changed
  if (value !== oldValue) {
    const watchers = stateWatchers.get(key);
    if (watchers) {
      watchers.forEach((callback) => {
        try {
          callback(value, oldValue);
        } catch (e) {
          console.error("Error in state watcher:", e);
        }
      });
    }
  }
}

// Batch state updates
export function batchStateUpdates(updates: () => void): void {
  batchDepth++;
  if (batchDepth === 1) {
    batchedUpdates.clear();
  }

  try {
    updates();
  } finally {
    batchDepth--;

    if (batchDepth === 0) {
      // Trigger watchers for all batched changes
      for (const [key, { newValue, oldValue }] of batchedUpdates) {
        const watchers = stateWatchers.get(key);
        if (watchers) {
          watchers.forEach((callback) => {
            try {
              callback(newValue, oldValue);
            } catch (e) {
              console.error("Error in state watcher:", e);
            }
          });
        }
      }

      batchedUpdates.clear();
    }
  }
}

// Persist state to localStorage
/**
 * Increments a numeric state value by a specified amount.
 *
 * @template T - Must be a numeric type
 * @param key - The state key to increment
 * @param amount - The amount to increment by (default: 1)
 * @param ctx - Optional context
 * @returns The new incremented value
 */
export function incrementState<T extends number = number>(
  key: string,
  amount: T = 1 as T,
  ctx?: TypedGeneratorContext<any>,
): T {
  const current = getState<T>(key, ctx) || (0 as T);
  const newValue = (current + amount) as T;
  setState(key, newValue, ctx);
  return newValue;
}

/**
 * Generator version of incrementState() for yield* usage.
 */
incrementState.gen = function <T extends number = number>(
  key: string,
  amount: T = 1 as T,
): Workflow<T> {
  return (function* (): Generator<Operation<T>, T, any> {
    const op: Operation<T> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      const current = (elementStateMap.get(key) as T) || (0 as T);
      const newValue = (current + amount) as T;
      elementStateMap.set(key, newValue);
      return newValue;
    };
    const result = yield op;
    return result;
  })();
};

/**
 * Decrements a numeric state value by a specified amount.
 *
 * @template T - Must be a numeric type
 * @param key - The state key to decrement
 * @param amount - The amount to decrement by (default: 1)
 * @param ctx - Optional context
 * @returns The new decremented value
 */
export function decrementState<T extends number = number>(
  key: string,
  amount: T = 1 as T,
  ctx?: TypedGeneratorContext<any>,
): T {
  const current = getState<T>(key, ctx) || (0 as T);
  const newValue = (current - amount) as T;
  setState(key, newValue, ctx);
  return newValue;
}

/**
 * Generator version of decrementState() for yield* usage.
 */
decrementState.gen = function <T extends number = number>(
  key: string,
  amount: T = 1 as T,
): Workflow<T> {
  return (function* (): Generator<Operation<T>, T, any> {
    const op: Operation<T> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      const current = (elementStateMap.get(key) as T) || (0 as T);
      const newValue = (current - amount) as T;
      elementStateMap.set(key, newValue);
      return newValue;
    };
    const result = yield op;
    return result;
  })();
};

/**
 * Toggles a boolean state value.
 *
 * @param key - The state key to toggle
 * @param ctx - Optional context
 * @returns The new boolean value
 */
export function toggleState(
  key: string,
  ctx?: TypedGeneratorContext<any>,
): boolean {
  const current = getState<boolean>(key, ctx) || false;
  const newValue = !current;
  setState(key, newValue, ctx);
  return newValue;
}

/**
 * Generator version of toggleState() for yield* usage.
 */
toggleState.gen = function (key: string): Workflow<boolean> {
  return (function* (): Generator<Operation<boolean>, boolean, any> {
    const op: Operation<boolean> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      const current = (elementStateMap.get(key) as boolean) || false;
      const newValue = !current;
      elementStateMap.set(key, newValue);
      return newValue;
    };
    const result = yield op;
    return result;
  })();
};

/**
 * Appends an item to an array state value.
 *
 * @template T - The array item type
 * @param key - The state key for the array
 * @param item - The item to append
 * @param ctx - Optional context
 * @returns The new array with the item appended
 */
export function appendToState<T>(
  key: string,
  item: T,
  ctx?: TypedGeneratorContext<any>,
): T[] {
  const current = getState<T[]>(key, ctx) || [];
  const newArray = [...current, item];
  setState(key, newArray, ctx);
  return newArray;
}

/**
 * Generator version of appendToState() for yield* usage.
 */
appendToState.gen = function <T>(key: string, item: T): Workflow<T[]> {
  return (function* (): Generator<Operation<T[]>, T[], any> {
    const op: Operation<T[]> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      const current = (elementStateMap.get(key) as T[]) || [];
      const newArray = [...current, item];
      elementStateMap.set(key, newArray);
      return newArray;
    };
    const result = yield op;
    return result;
  })();
};

/**
 * Prepends an item to an array state value.
 *
 * @template T - The array item type
 * @param key - The state key for the array
 * @param item - The item to prepend
 * @param ctx - Optional context
 * @returns The new array with the item prepended
 */
export function prependToState<T>(
  key: string,
  item: T,
  ctx?: TypedGeneratorContext<any>,
): T[] {
  const current = getState<T[]>(key, ctx) || [];
  const newArray = [item, ...current];
  setState(key, newArray, ctx);
  return newArray;
}

/**
 * Generator version of prependToState() for yield* usage.
 */
prependToState.gen = function <T>(key: string, item: T): Workflow<T[]> {
  return (function* (): Generator<Operation<T[]>, T[], any> {
    const op: Operation<T[]> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      const current = (elementStateMap.get(key) as T[]) || [];
      const newArray = [item, ...current];
      elementStateMap.set(key, newArray);
      return newArray;
    };
    const result = yield op;
    return result;
  })();
};

/**
 * Removes an item from an array state value.
 *
 * @template T - The array item type
 * @param key - The state key for the array
 * @param item - The item to remove
 * @param ctx - Optional context
 * @returns The new array with the item removed
 */
export function removeFromState<T>(
  key: string,
  item: T,
  ctx?: TypedGeneratorContext<any>,
): T[] {
  const current = getState<T[]>(key, ctx) || [];
  const newArray = current.filter((x) => x !== item);
  setState(key, newArray, ctx);
  return newArray;
}

/**
 * Generator version of removeFromState() for yield* usage.
 */
removeFromState.gen = function <T>(key: string, item: T): Workflow<T[]> {
  return (function* (): Generator<Operation<T[]>, T[], any> {
    const op: Operation<T[]> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      const current = (elementStateMap.get(key) as T[]) || [];
      const newArray = current.filter((x) => x !== item);
      elementStateMap.set(key, newArray);
      return newArray;
    };
    const result = yield op;
    return result;
  })();
};

/**
 * Merges an object into an existing object state value.
 *
 * @template T - The object type
 * @param key - The state key for the object
 * @param updates - The object properties to merge
 * @param ctx - Optional context
 * @returns The new merged object
 */
export function mergeState<T extends Record<string, any>>(
  key: string,
  updates: Partial<T>,
  ctx?: TypedGeneratorContext<any>,
): T {
  const current = getState<T>(key, ctx) || ({} as T);
  const newObject = { ...current, ...updates };
  setState(key, newObject, ctx);
  return newObject;
}

/**
 * Generator version of mergeState() for yield* usage.
 */
mergeState.gen = function <T extends Record<string, any>>(
  key: string,
  updates: Partial<T>,
): Workflow<T> {
  return (function* (): Generator<Operation<T>, T, any> {
    const op: Operation<T> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      const current = (elementStateMap.get(key) as T) || ({} as T);
      const newObject = { ...current, ...updates };
      elementStateMap.set(key, newObject);
      return newObject;
    };
    const result = yield op;
    return result;
  })();
};

/**
 * Clears all state for the current element.
 *
 * @param ctx - Optional context
 */
export function clearState(ctx?: TypedGeneratorContext<any>): void {
  const state = getElementState(ctx);
  Object.keys(state).forEach((key) => delete state[key]);
}

/**
 * Generator version of clearState() for yield* usage.
 */
clearState.gen = function (): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    const op: Operation<void> = (ctx: WatchContext) => {
      const elementStateMap = getElementStateMap(ctx.element);
      elementStateMap.clear();
    };
    yield op;
  })();
};

export function createPersistedState<T>(
  key: string,
  initialValue: T,
  storageKey?: string,
): TypedState<T> {
  const actualStorageKey = storageKey || key;

  // Try to load from localStorage
  let storedValue: T = initialValue;
  try {
    const stored = localStorage.getItem(actualStorageKey);
    if (stored !== null) {
      storedValue = JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load persisted state:", e);
  }

  const typedState = createState(key, storedValue);

  // Override set to persist
  const originalSet = typedState.set;
  typedState.set = function (value: T): void {
    originalSet.call(this, value);

    try {
      localStorage.setItem(actualStorageKey, JSON.stringify(value));
    } catch (e) {
      console.warn("Failed to persist state:", e);
    }
  };

  return typedState;
}

// Clear all state for current element or globally
export function clearAllState(): void {
  const context = getCurrentContext();
  if (context) {
    // Clear state for current element
    elementStates.delete(context.element);
  } else {
    // Clear all state globally
    elementStates = new WeakMap();
  }
}

// Debug helpers
export function debugState(): Record<string, any> {
  const state = { ...getElementState() };
  // console.log("State:", state);
  return state;
}

export function logState(keyOrPrefix?: string): void {
  if (keyOrPrefix && keyOrPrefix !== "State:") {
    // If it looks like a key (not the default prefix), log that specific key
    const state = getElementState();
    if (keyOrPrefix in state) {
      // console.log(`State[${keyOrPrefix}]:`, state[keyOrPrefix]);
    } else {
      // console.log(`State[${keyOrPrefix}]:`, undefined);
    }
  } else {
    // Default behavior - log all state
    // console.log(keyOrPrefix || "State:", debugState());
  }
}

/**
 * Gets a read-only snapshot of an element's state.
 * This is an internal helper for the WatchController's introspection feature.
 * It does not require a generator context.
 * @internal
 */
export function getElementStateSnapshot(
  element: HTMLElement,
): Readonly<Record<string, any>> {
  return Object.freeze({ ...(elementStates.get(element) || {}) });
}
