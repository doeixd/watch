// Enhanced state management for Watch v5

import type { TypedState, CleanupFunction, TypedGeneratorContext } from '../types';
import { getCurrentContext } from './context';

// Global state storage per element
const elementStates = new WeakMap<HTMLElement, Record<string, any>>();

// Get state for current element
function getElementState(ctx?: TypedGeneratorContext<any>): Record<string, any> {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error('State functions can only be called within a generator context');
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
export function getState<T = any>(key: string, ctx?: TypedGeneratorContext<any>): T {
  const state = getElementState(ctx);
  return state[key] as T;
}

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
export function setState<T = any>(key: string, value: T, ctx?: TypedGeneratorContext<any>): void {
  const state = getElementState(ctx);
  state[key] = value;
}

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
export function updateState<T = any>(key: string, updater: (current: T) => T, ctx?: TypedGeneratorContext<any>): void {
  const state = getElementState(ctx);
  const current = state[key] as T;
  state[key] = updater(current);
}

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
export function hasState(key: string, ctx?: TypedGeneratorContext<any>): boolean {
  const state = getElementState(ctx);
  return key in state;
}

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
export function deleteState(key: string, ctx?: TypedGeneratorContext<any>): void {
  const state = getElementState(ctx);
  delete state[key];
}

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
export function createTypedState<T>(key: string, _initialValue?: T): TypedState<T> {
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
    }
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
  dependencies: string[] = []
): () => T {
  const computedId = ++computedCounter;
  const resultKey = `__computed_${computedId}`;
  const depsKey = `__computed_deps_${computedId}`;
  
  return function(): T {
    const state = getElementState();
    
    // Get current dependency values
    const currentDeps = dependencies.map(dep => state[dep]);
    const lastDeps = state[depsKey] as any[];
    
    // Check if dependencies changed
    const depsChanged = !lastDeps || 
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
  };
}

// Reactive state that triggers callbacks on change
const stateWatchers = new Map<string, Set<(newValue: any, oldValue: any) => void>>();

export function watchState<T>(
  key: string,
  callback: (newValue: T, oldValue: T) => void
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

// Enhanced setState that triggers watchers
export function setStateReactive<T>(key: string, value: T): void {
  const oldValue = getState<T>(key);
  setState(key, value);
  
  // Trigger watchers
  const watchers = stateWatchers.get(key);
  if (watchers) {
    watchers.forEach(callback => {
      try {
        callback(value, oldValue);
      } catch (e) {
        console.error('Error in state watcher:', e);
      }
    });
  }
}

// Batch state updates
export function batchStateUpdates(updates: () => void): void {
  // Disable watchers temporarily
  const originalWatchers = new Map(stateWatchers);
  stateWatchers.clear();
  
  try {
    updates();
  } finally {
    // Restore watchers and trigger them
    for (const [key, watchers] of originalWatchers) {
      stateWatchers.set(key, watchers);
    }
  }
}

// Persist state to localStorage
export function createPersistedState<T>(
  key: string,
  initialValue: T,
  storageKey?: string
): TypedState<T> {
  const actualStorageKey = storageKey || `watch_state_${key}`;
  
  // Try to load from localStorage
  let storedValue: T = initialValue;
  try {
    const stored = localStorage.getItem(actualStorageKey);
    if (stored !== null) {
      storedValue = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load persisted state:', e);
  }
  
  const typedState = createState(key, storedValue);
  
  // Override set to persist
  const originalSet = typedState.set;
  typedState.set = function(value: T): void {
    originalSet.call(this, value);
    
    try {
      localStorage.setItem(actualStorageKey, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }
  };
  
  return typedState;
}

// Clear all state for current element
export function clearAllState(): void {
  const context = getCurrentContext();
  if (!context) {
    throw new Error('clearAllState can only be called within a generator context');
  }
  
  elementStates.delete(context.element);
}

// Debug helpers
export function debugState(): Record<string, any> {
  return { ...getElementState() };
}

export function logState(prefix = 'State:'): void {
  console.log(prefix, debugState());
}

/**
 * Gets a read-only snapshot of an element's state.
 * This is an internal helper for the WatchController's introspection feature.
 * It does not require a generator context.
 * @internal
 */
export function getElementStateSnapshot(element: HTMLElement): Readonly<Record<string, any>> {
  return Object.freeze({ ...(elementStates.get(element) || {}) });
}
