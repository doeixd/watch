// Enhanced state management for Watch v5

import type { TypedState, CleanupFunction } from '../types.ts';
import { getCurrentContext } from './context.ts';

// Global state storage per element
const elementStates = new WeakMap<HTMLElement, Record<string, any>>();

// Get state for current element
function getElementState(): Record<string, any> {
  const context = getCurrentContext();
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
export function getState<T = any>(key: string): T {
  const state = getElementState();
  return state[key] as T;
}

export function setState<T = any>(key: string, value: T): void {
  const state = getElementState();
  state[key] = value;
}

export function updateState<T = any>(key: string, updater: (current: T) => T): void {
  const state = getElementState();
  const current = state[key] as T;
  state[key] = updater(current);
}

export function hasState(key: string): boolean {
  const state = getElementState();
  return key in state;
}

export function deleteState(key: string): void {
  const state = getElementState();
  delete state[key];
}

// Create typed state management
export function createTypedState<T>(key: string, initialValue?: T): TypedState<T> {
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

// Create state that auto-initializes
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
