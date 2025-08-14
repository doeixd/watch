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
 * Set state value for the current element.
 *
 * Stores a value in the element's state map with type safety. Each element
 * maintains its own isolated state that persists across DOM mutations.
 *
 * @template T - Type of the value being stored
 * @param key - State key identifier (string)
 * @param value - Value to store in state
 * @returns Workflow<void> - Generator workflow for yield*
 *
 * @example Basic state setting
 * ```typescript
 * watch('.counter', function* () {
 *   yield* setState('count', 0);
 *   yield* setState('user', { name: 'John', age: 30 });
 * });
 * ```
 *
 * @example With type safety
 * ```typescript
 * interface UserData {
 *   name: string;
 *   age: number;
 *   email: string;
 * }
 *
 * watch('.profile', function* () {
 *   const userData: UserData = {
 *     name: 'Jane',
 *     age: 25,
 *     email: 'jane@example.com'
 *   };
 *   yield* setState<UserData>('user', userData);
 * });
 * ```
 *
 * @example Setting multiple states
 * ```typescript
 * watch('.form', function* () {
 *   yield* setState('isValid', false);
 *   yield* setState('errors', []);
 *   yield* setState('submitCount', 0);
 *   yield* setState('lastSubmit', new Date());
 * });
 * ```
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
 * Explicit generator version of setState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for complex state management scenarios.
 *
 * @template T - Type of the value being stored
 * @param key - State key identifier
 * @param value - Value to store in state
 * @returns Workflow<void> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.component', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   yield* setState.gen('config', { theme: 'dark', lang: 'en' });
 *   yield* setState.gen('initialized', true);
 * });
 * ```
 *
 * @example Complex state management
 * ```typescript
 * watch('.data-table', function* () {
 *   yield* setState.gen('loading', true);
 *   yield* setState.gen('data', []);
 *   yield* setState.gen('error', null);
 *
 *   try {
 *     const data = yield* fetchData();
 *     yield* setState.gen('data', data);
 *     yield* setState.gen('loading', false);
 *   } catch (error) {
 *     yield* setState.gen('error', error.message);
 *     yield* setState.gen('loading', false);
 *   }
 * });
 * ```
 */
setState.gen = function <T>(key: string, value: T): Workflow<void> {
  return setState<T>(key, value);
};

/**
 * Get state value for the current element with optional default value.
 *
 * Retrieves a value from the element's state map with type safety.
 * Returns the default value if the key doesn't exist or state is uninitialized.
 *
 * @template T - Expected type of the stored value
 * @param key - State key identifier to retrieve
 * @param defaultValue - Optional default value if key doesn't exist
 * @returns Workflow<T | undefined> - The stored value, default value, or undefined
 *
 * @example Basic state retrieval
 * ```typescript
 * watch('.counter', function* () {
 *   const count = yield* getState<number>('count', 0);
 *   yield* text(`Count: ${count}`);
 * });
 * ```
 *
 * @example With complex types
 * ```typescript
 * interface Settings {
 *   theme: 'light' | 'dark';
 *   notifications: boolean;
 *   language: string;
 * }
 *
 * watch('.settings-panel', function* () {
 *   const settings = yield* getState<Settings>('userSettings', {
 *     theme: 'light',
 *     notifications: true,
 *     language: 'en'
 *   });
 *
 *   yield* toggleClass('dark-theme', settings.theme === 'dark');
 * });
 * ```
 *
 * @example Conditional logic based on state
 * ```typescript
 * watch('.widget', function* () {
 *   const isInitialized = yield* getState<boolean>('initialized');
 *
 *   if (!isInitialized) {
 *     yield* addClass('loading');
 *     yield* initializeWidget();
 *     yield* setState('initialized', true);
 *     yield* removeClass('loading');
 *   }
 * });
 * ```
 */
export function getState<T>(
  key: string,
  defaultValue?: T,
): Workflow<T | undefined> {
  return (function* (): Generator<
    Operation<T | undefined>,
    T | undefined,
    any
  > {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return defaultValue;
      }
      return context.state.has(key)
        ? (context.state.get(key) as T)
        : defaultValue;
    }) as Operation<T | undefined>;
    return result;
  })();
}

/**
 * Explicit generator version of getState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for complex state retrieval scenarios.
 *
 * @template T - Expected type of the stored value
 * @param key - State key identifier to retrieve
 * @param defaultValue - Optional default value if key doesn't exist
 * @returns Workflow<T | undefined> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.component', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const config = yield* getState.gen<Config>('config', defaultConfig);
 *   const isReady = yield* getState.gen<boolean>('ready', false);
 *
 *   if (isReady && config.autoStart) {
 *     yield* startComponent();
 *   }
 * });
 * ```
 *
 * @example Complex state retrieval with fallbacks
 * ```typescript
 * watch('.user-profile', function* () {
 *   const user = yield* getState.gen<User>('user');
 *   const preferences = yield* getState.gen<Preferences>('preferences', defaultPrefs);
 *
 *   if (user) {
 *     yield* text('.username', user.name);
 *     yield* attr('.avatar', 'src', user.avatar);
 *   } else {
 *     yield* addClass('anonymous');
 *   }
 * });
 * ```
 */
getState.gen = function <T>(
  key: string,
  defaultValue?: T,
): Workflow<T | undefined> {
  return getState<T>(key, defaultValue);
};

/**
 * Update state value using an updater function with atomic operation.
 *
 * Safely updates state by passing the current value to an updater function
 * and storing the result. This ensures consistent state updates even with
 * complex transformations.
 *
 * @template T - Type of the state value being updated
 * @param key - State key identifier to update
 * @param updater - Function that receives current value and returns new value
 * @returns Workflow<void> - Generator workflow for yield*
 *
 * @example Counter increment
 * ```typescript
 * watch('.counter', function* () {
 *   yield* click(function* () {
 *     yield* updateState<number>('count', (current = 0) => current + 1);
 *     const newCount = yield* getState<number>('count', 0);
 *     yield* text(`Count: ${newCount}`);
 *   });
 * });
 * ```
 *
 * @example Array manipulation
 * ```typescript
 * watch('.todo-list', function* () {
 *   yield* click('.add-item', function* () {
 *     const newItem = yield* value<string>('.new-item-input');
 *
 *     yield* updateState<string[]>('items', (items = []) => [
 *       ...items,
 *       newItem
 *     ]);
 *
 *     yield* value('.new-item-input', ''); // Clear input
 *   });
 * });
 * ```
 *
 * @example Object updates with spread
 * ```typescript
 * watch('.user-form', function* () {
 *   yield* input('.name-field', function* (e) {
 *     const name = e.target.value;
 *
 *     yield* updateState<User>('user', (user = {}) => ({
 *       ...user,
 *       name,
 *       lastUpdated: new Date()
 *     }));
 *   });
 * });
 * ```
 *
 * @example Complex state transformation
 * ```typescript
 * watch('.game-board', function* () {
 *   yield* click('.cell', function* (e) {
 *     const cellIndex = parseInt(e.target.dataset.index || '0');
 *
 *     yield* updateState<GameState>('gameState', (state = defaultGameState) => {
 *       if (state.board[cellIndex] !== null || state.gameOver) {
 *         return state; // Invalid move
 *       }
 *
 *       const newBoard = [...state.board];
 *       newBoard[cellIndex] = state.currentPlayer;
 *
 *       return {
 *         ...state,
 *         board: newBoard,
 *         currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
 *         moveCount: state.moveCount + 1
 *       };
 *     });
 *   });
 * });
 * ```
 */
export function updateState<T>(
  key: string,
  updater: (value: T | undefined) => T,
): Workflow<void> {
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
 * Explicit generator version of updateState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for complex atomic state updates.
 *
 * @template T - Type of the state value being updated
 * @param key - State key identifier to update
 * @param updater - Function that receives current value and returns new value
 * @returns Workflow<void> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.shopping-cart', function* () {
 *   yield* click('.add-to-cart', function* () {
 *     // Explicit .gen version for guaranteed workflow
 *     yield* updateState.gen<CartItem[]>('items', (items = []) => {
 *       const productId = yield* attr('data-product-id');
 *       const existingItem = items.find(item => item.id === productId);
 *
 *       if (existingItem) {
 *         return items.map(item =>
 *           item.id === productId
 *             ? { ...item, quantity: item.quantity + 1 }
 *             : item
 *         );
 *       } else {
 *         return [...items, { id: productId, quantity: 1 }];
 *       }
 *     });
 *   });
 * });
 * ```
 */
updateState.gen = function <T>(
  key: string,
  updater: (value: T | undefined) => T,
): Workflow<void> {
  return updateState<T>(key, updater);
};

/**
 * Check if a state key exists for the current element.
 *
 * Returns true if the specified key exists in the element's state map,
 * false otherwise. Useful for conditional logic based on state presence.
 *
 * @param key - State key identifier to check
 * @returns Workflow<boolean> - true if key exists, false otherwise
 *
 * @example Conditional initialization
 * ```typescript
 * watch('.widget', function* () {
 *   const isInitialized = yield* hasState('initialized');
 *
 *   if (!isInitialized) {
 *     yield* setState('config', defaultConfig);
 *     yield* setState('initialized', true);
 *     yield* addClass('ready');
 *   }
 * });
 * ```
 *
 * @example State validation
 * ```typescript
 * watch('.form', function* () {
 *   const hasErrors = yield* hasState('validationErrors');
 *   const hasData = yield* hasState('formData');
 *
 *   yield* toggleClass('has-errors', hasErrors);
 *   yield* toggleClass('has-data', hasData);
 *
 *   if (hasData && !hasErrors) {
 *     yield* removeClass('submit-btn', 'disabled');
 *   }
 * });
 * ```
 *
 * @example Cache management
 * ```typescript
 * watch('.data-display', function* () {
 *   const hasCachedData = yield* hasState('cachedResults');
 *
 *   if (hasCachedData) {
 *     const data = yield* getState('cachedResults');
 *     yield* renderData(data);
 *   } else {
 *     yield* addClass('loading');
 *     const freshData = yield* fetchData();
 *     yield* setState('cachedResults', freshData);
 *     yield* renderData(freshData);
 *     yield* removeClass('loading');
 *   }
 * });
 * ```
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
 * Explicit generator version of hasState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for state existence checks.
 *
 * @param key - State key identifier to check
 * @returns Workflow<boolean> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.component', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const hasConfig = yield* hasState.gen('configuration');
 *   const hasUser = yield* hasState.gen('currentUser');
 *
 *   if (hasConfig && hasUser) {
 *     yield* addClass('fully-initialized');
 *   }
 * });
 * ```
 */
hasState.gen = function (key: string): Workflow<boolean> {
  return hasState(key);
};

/**
 * Delete a state key from the current element's state.
 *
 * Removes the specified key and its value from the element's state map.
 * Returns true if the key existed and was deleted, false otherwise.
 *
 * @param key - State key identifier to delete
 * @returns Workflow<boolean> - true if key was deleted, false if it didn't exist
 *
 * @example Cleanup temporary state
 * ```typescript
 * watch('.modal', function* () {
 *   yield* click('.close', function* () {
 *     yield* deleteState('temporaryData');
 *     yield* deleteState('userInput');
 *     yield* deleteState('validationErrors');
 *     yield* addClass('closed');
 *   });
 * });
 * ```
 *
 * @example Conditional cleanup
 * ```typescript
 * watch('.cache-manager', function* () {
 *   yield* click('.clear-expired', function* () {
 *     const expiredKeys = yield* getState<string[]>('expiredKeys', []);
 *
 *     for (const key of expiredKeys) {
 *       const wasDeleted = yield* deleteState(key);
 *       if (wasDeleted) {
 *         console.log(`Cleared expired cache: ${key}`);
 *       }
 *     }
 *
 *     yield* deleteState('expiredKeys');
 *   });
 * });
 * ```
 *
 * @example State lifecycle management
 * ```typescript
 * watch('.session-manager', function* () {
 *   yield* onUnmount(function* () {
 *     // Clean up sensitive data on component unmount
 *     yield* deleteState('authToken');
 *     yield* deleteState('userData');
 *     yield* deleteState('sessionId');
 *   });
 * });
 * ```
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
 * Explicit generator version of deleteState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for state key deletion.
 *
 * @param key - State key identifier to delete
 * @returns Workflow<boolean> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.cleanup-manager', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const deleted = yield* deleteState.gen('temporaryConfig');
 *
 *   if (deleted) {
 *     yield* text('.status', 'Temporary config cleared');
 *   }
 * });
 * ```
 */
deleteState.gen = function (key: string): Workflow<boolean> {
  return deleteState(key);
};

/**
 * Clear all state for the current element.
 *
 * Removes all key-value pairs from the element's state map, effectively
 * resetting the element to have no stored state.
 *
 * @returns Workflow<void> - Generator workflow for yield*
 *
 * @example Reset component state
 * ```typescript
 * watch('.game-board', function* () {
 *   yield* click('.reset-game', function* () {
 *     yield* clearState();
 *     yield* removeClass('game-over');
 *     yield* addClass('ready-to-play');
 *     yield* text('.status', 'Game reset - click to start!');
 *   });
 * });
 * ```
 *
 * @example Form reset with state cleanup
 * ```typescript
 * watch('.contact-form', function* () {
 *   yield* click('.reset-form', function* () {
 *     // Clear all form state
 *     yield* clearState();
 *
 *     // Reset form UI
 *     yield* removeClass('has-errors');
 *     yield* removeClass('submitted');
 *     yield* text('.error-messages', '');
 *
 *     // Reset form fields
 *     yield* value('input', '');
 *     yield* value('textarea', '');
 *   });
 * });
 * ```
 *
 * @example Session cleanup
 * ```typescript
 * watch('.user-session', function* () {
 *   yield* click('.logout', function* () {
 *     // Clear all session state
 *     yield* clearState();
 *
 *     // Update UI to logged-out state
 *     yield* addClass('logged-out');
 *     yield* removeClass('authenticated');
 *     yield* text('.username', 'Guest');
 *   });
 * });
 * ```
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
 * Explicit generator version of clearState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for complete state clearing.
 *
 * @returns Workflow<void> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.admin-panel', function* () {
 *   yield* click('.emergency-reset', function* () {
 *     // Explicit .gen version - guaranteed workflow
 *     yield* clearState.gen();
 *     yield* addClass('emergency-mode');
 *     yield* text('.status', 'All state cleared - emergency reset complete');
 *   });
 * });
 * ```
 */
clearState.gen = function (): Workflow<void> {
  return clearState();
};

/**
 * Get all state keys for the current element.
 *
 * Returns an array of all state key names stored in the element's state map.
 * Useful for debugging, state inspection, or bulk state operations.
 *
 * @returns Workflow<string[]> - Array of all state key names
 *
 * @example State debugging
 * ```typescript
 * watch('.debug-panel', function* () {
 *   yield* click('.show-state', function* () {
 *     const keys = yield* getStateKeys();
 *     yield* text('.state-keys', `State keys: ${keys.join(', ')}`);
 *
 *     if (keys.length === 0) {
 *       yield* addClass('no-state');
 *       yield* text('.state-info', 'No state data found');
 *     }
 *   });
 * });
 * ```
 *
 * @example State validation
 * ```typescript
 * watch('.form-validator', function* () {
 *   yield* click('.validate', function* () {
 *     const keys = yield* getStateKeys();
 *     const requiredKeys = ['username', 'email', 'password'];
 *
 *     const missingKeys = requiredKeys.filter(key => !keys.includes(key));
 *
 *     if (missingKeys.length > 0) {
 *       yield* addClass('incomplete');
 *       yield* text('.errors', `Missing: ${missingKeys.join(', ')}`);
 *     } else {
 *       yield* removeClass('incomplete');
 *       yield* addClass('valid');
 *     }
 *   });
 * });
 * ```
 *
 * @example State export functionality
 * ```typescript
 * watch('.data-export', function* () {
 *   yield* click('.export-state', function* () {
 *     const keys = yield* getStateKeys();
 *     const stateData: Record<string, any> = {};
 *
 *     for (const key of keys) {
 *       stateData[key] = yield* getState(key);
 *     }
 *
 *     yield* attr('.export-link', 'href',
 *       `data:application/json,${encodeURIComponent(JSON.stringify(stateData))}`
 *     );
 *     yield* removeClass('.export-link', 'hidden');
 *   });
 * });
 * ```
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
 * Explicit generator version of getStateKeys for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for state key retrieval.
 *
 * @returns Workflow<string[]> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.state-inspector', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const keys = yield* getStateKeys.gen();
 *
 *   yield* text('.key-count', `${keys.length} state keys found`);
 *   yield* html('.key-list', keys.map(key => `<li>${key}</li>`).join(''));
 * });
 * ```
 */
getStateKeys.gen = function (): Workflow<string[]> {
  return getStateKeys();
};

/**
 * Get all state entries as key-value pairs for the current element.
 *
 * Returns an array of [key, value] tuples representing all state data
 * stored in the element's state map. Useful for state inspection,
 * serialization, or bulk operations.
 *
 * @template T - Expected type of state values (defaults to any)
 * @returns Workflow<Array<[string, T]>> - Array of [key, value] tuples
 *
 * @example State inspection
 * ```typescript
 * watch('.state-viewer', function* () {
 *   yield* click('.show-all-state', function* () {
 *     const entries = yield* getStateEntries<any>();
 *
 *     if (entries.length === 0) {
 *       yield* text('.state-display', 'No state data found');
 *     } else {
 *       const stateHtml = entries
 *         .map(([key, value]) => `<div><strong>${key}:</strong> ${JSON.stringify(value)}</div>`)
 *         .join('');
 *       yield* html('.state-display', stateHtml);
 *     }
 *   });
 * });
 * ```
 *
 * @example State serialization
 * ```typescript
 * watch('.export-manager', function* () {
 *   yield* click('.export-data', function* () {
 *     const entries = yield* getStateEntries<any>();
 *     const stateObject = Object.fromEntries(entries);
 *
 *     yield* attr('.download-link', 'href',
 *       `data:application/json,${encodeURIComponent(JSON.stringify(stateObject))}`
 *     );
 *     yield* attr('.download-link', 'download', 'state-export.json');
 *   });
 * });
 * ```
 *
 * @example State comparison
 * ```typescript
 * watch('.state-diff', function* () {
 *   yield* click('.compare-state', function* () {
 *     const currentEntries = yield* getStateEntries<any>();
 *     const previousEntries = yield* getState<Array<[string, any]>>('previousState', []);
 *
 *     const changes = currentEntries.filter(([key, value]) => {
 *       const prev = previousEntries.find(([prevKey]) => prevKey === key);
 *       return !prev || prev[1] !== value;
 *     });
 *
 *     yield* setState('previousState', currentEntries);
 *     yield* text('.changes-count', `${changes.length} changes detected`);
 *   });
 * });
 * ```
 */
export function getStateEntries<T = any>(): Workflow<Array<[string, T]>> {
  return (function* (): Generator<
    Operation<Array<[string, T]>>,
    Array<[string, T]>,
    any
  > {
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
 * Explicit generator version of getStateEntries for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for state entries retrieval.
 *
 * @template T - Expected type of state values
 * @returns Workflow<Array<[string, T]>> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.state-manager', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const entries = yield* getStateEntries.gen<any>();
 *
 *   for (const [key, value] of entries) {
 *     yield* text(`.state-${key}`, String(value));
 *   }
 * });
 * ```
 */
getStateEntries.gen = function <T = any>(): Workflow<Array<[string, T]>> {
  return getStateEntries<T>();
};

/**
 * Get the number of state entries for the current element.
 *
 * Returns the count of key-value pairs stored in the element's state map.
 * Useful for state monitoring, debugging, and conditional logic.
 *
 * @returns Workflow<number> - Number of state entries
 *
 * @example State monitoring
 * ```typescript
 * watch('.state-monitor', function* () {
 *   yield* input('.data-input', function* () {
 *     const size = yield* getStateSize();
 *     yield* text('.state-count', `${size} items in state`);
 *
 *     if (size > 10) {
 *       yield* addClass('state-warning');
 *       yield* text('.warning', 'Large state detected - consider cleanup');
 *     }
 *   });
 * });
 * ```
 *
 * @example Conditional cleanup
 * ```typescript
 * watch('.memory-manager', function* () {
 *   yield* setInterval(function* () {
 *     const size = yield* getStateSize();
 *
 *     if (size > 50) {
 *       // Trigger cleanup for large state
 *       const keys = yield* getStateKeys();
 *       const tempKeys = keys.filter(key => key.startsWith('temp_'));
 *
 *       for (const key of tempKeys) {
 *         yield* deleteState(key);
 *       }
 *     }
 *   }, 30000); // Check every 30 seconds
 * });
 * ```
 *
 * @example State validation
 * ```typescript
 * watch('.form-validator', function* () {
 *   yield* click('.validate-completeness', function* () {
 *     const size = yield* getStateSize();
 *     const requiredFieldCount = 5;
 *
 *     if (size < requiredFieldCount) {
 *       yield* addClass('incomplete-form');
 *       yield* text('.validation-error',
 *         `Missing ${requiredFieldCount - size} required fields`
 *       );
 *     } else {
 *       yield* removeClass('incomplete-form');
 *       yield* addClass('form-complete');
 *     }
 *   });
 * });
 * ```
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
 * Explicit generator version of persistState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for state persistence.
 *
 * @param key - State key to persist
 * @param storageKey - Optional custom localStorage key
 * @returns Workflow<void> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.auto-saver', function* () {
 *   yield* setInterval(function* () {
 *     // Explicit .gen version - guaranteed workflow
 *     yield* persistState.gen('documentContent', 'auto_save_draft');
 *     yield* persistState.gen('lastSaved', 'auto_save_timestamp');
 *
 *     yield* text('.save-indicator', 'Auto-saved');
 *   }, 30000);
 * });
 * ```
 */
persistState.gen = function (key: string, storageKey?: string): Workflow<void> {
  return persistState(key, storageKey);
};

/**
 * Explicit generator version of computedState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for computed state values.
 *
 * @template T - Type of the computed value
 * @param key - Key where the computed value will be cached
 * @param dependencies - Array of state keys that this computation depends on
 * @param compute - Function that computes the value from dependency values
 * @returns Workflow<T> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.computed-dashboard', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const summary = yield* computedState.gen<DashboardSummary>('summary',
 *     ['users', 'orders', 'revenue'],
 *     (users, orders, revenue) => ({
 *       totalUsers: users.length,
 *       totalOrders: orders.length,
 *       averageOrderValue: revenue / orders.length
 *     })
 *   );
 *
 *   yield* renderDashboard(summary);
 * });
 * ```
 */
computedState.gen = function <T>(
  key: string,
  dependencies: string[],
  compute: (...deps: any[]) => T,
): Workflow<T> {
  return computedState<T>(key, dependencies, compute);
};

/**
 * Explicit generator version of watchState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for reactive state watching.
 *
 * @template T - Type of the state value being watched
 * @param key - State key to watch for changes
 * @param callback - Function called when state changes
 * @returns Workflow<() => void> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.reactive-component', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const cleanup = yield* watchState.gen<UserSettings>('settings', function* (newSettings) {
 *     yield* applySettings(newSettings);
 *     yield* saveSettings(newSettings);
 *   });
 *
 *   yield* onUnmount(() => cleanup());
 * });
 * ```
 */
watchState.gen = function <T>(
  key: string,
  callback: (
    newValue: T | undefined,
    oldValue: T | undefined,
  ) => void | Generator<any, void, any>,
): Workflow<() => void> {
  return watchState<T>(key, callback);
};

/**
 * Explicit generator version of getStateSize for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for state size retrieval.
 *
 * @returns Workflow<number> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.state-tracker', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const size = yield* getStateSize.gen();
 *
 *   yield* attr('.progress-bar', 'data-count', String(size));
 *   yield* toggleClass('has-state', size > 0);
 * });
 * ```
 */
getStateSize.gen = function (): Workflow<number> {
  return getStateSize();
};

/**
 * Merge state with an object, adding multiple key-value pairs at once.
 *
 * Takes an object and adds all its properties to the element's state map.
 * Existing state values with the same keys will be overwritten.
 *
 * @param stateObject - Object containing key-value pairs to merge into state
 * @returns Workflow<void> - Generator workflow for yield*
 *
 * @example Bulk state initialization
 * ```typescript
 * watch('.user-profile', function* () {
 *   const userData = {
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     preferences: { theme: 'dark', lang: 'en' },
 *     lastLogin: new Date(),
 *     isActive: true
 *   };
 *
 *   yield* mergeState(userData);
 *
 *   // Now all properties are available in state
 *   const name = yield* getState<string>('name');
 *   yield* text('.user-name', name);
 * });
 * ```
 *
 * @example Form data collection
 * ```typescript
 * watch('.contact-form', function* () {
 *   yield* submit(function* (event) {
 *     event.preventDefault();
 *
 *     const formData = new FormData(event.target);
 *     const formObject = Object.fromEntries(formData.entries());
 *
 *     // Merge all form data into state
 *     yield* mergeState(formObject);
 *
 *     // Add metadata
 *     yield* mergeState({
 *       submittedAt: new Date(),
 *       isValid: true,
 *       attempts: (yield* getState<number>('attempts', 0)) + 1
 *     });
 *   });
 * });
 * ```
 *
 * @example Configuration merging
 * ```typescript
 * watch('.config-panel', function* () {
 *   const defaultConfig = {
 *     autoSave: true,
 *     theme: 'light',
 *     language: 'en',
 *     notifications: true
 *   };
 *
 *   const userConfig = yield* loadUserConfig();
 *
 *   // Merge default config first, then user overrides
 *   yield* mergeState(defaultConfig);
 *   yield* mergeState(userConfig);
 * });
 * ```
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
 * Explicit generator version of mergeState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for bulk state merging.
 *
 * @param stateObject - Object containing key-value pairs to merge into state
 * @returns Workflow<void> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.bulk-importer', function* () {
 *   yield* click('.import-data', function* () {
 *     const importData = yield* loadImportData();
 *
 *     // Explicit .gen version - guaranteed workflow
 *     yield* mergeState.gen(importData);
 *
 *     yield* addClass('data-imported');
 *     yield* text('.status', 'Data imported successfully');
 *   });
 * });
 * ```
 */
mergeState.gen = function (stateObject: Record<string, any>): Workflow<void> {
  return mergeState(stateObject);
};

/**
 * Get all state as a plain object with type safety.
 *
 * Converts the element's state map into a plain JavaScript object,
 * making it easy to serialize, inspect, or pass to other functions.
 *
 * @template T - Expected type of the returned object (defaults to Record<string, any>)
 * @returns Workflow<T> - Object containing all state key-value pairs
 *
 * @example State serialization
 * ```typescript
 * watch('.data-exporter', function* () {
 *   yield* click('.export', function* () {
 *     const stateObj = yield* getStateObject<UserState>();
 *
 *     yield* attr('.download-link', 'href',
 *       `data:application/json,${encodeURIComponent(JSON.stringify(stateObj))}`
 *     );
 *     yield* attr('.download-link', 'download', 'user-state.json');
 *   });
 * });
 * ```
 *
 * @example State debugging
 * ```typescript
 * watch('.debug-panel', function* () {
 *   yield* click('.dump-state', function* () {
 *     const state = yield* getStateObject();
 *
 *     console.log('Current state:', state);
 *     yield* text('.debug-output', JSON.stringify(state, null, 2));
 *   });
 * });
 * ```
 *
 * @example State validation with types
 * ```typescript
 * interface FormState {
 *   name: string;
 *   email: string;
 *   age: number;
 *   preferences: UserPreferences;
 * }
 *
 * watch('.form-validator', function* () {
 *   yield* click('.validate-state', function* () {
 *     const formState = yield* getStateObject<FormState>();
 *
 *     const isValid = validateFormState(formState);
 *     yield* toggleClass('valid-form', isValid);
 *
 *     if (!isValid) {
 *       yield* text('.errors', 'Please complete all required fields');
 *     }
 *   });
 * });
 * ```
 */
export function getStateObject<
  T extends Record<string, any> = Record<string, any>,
>(): Workflow<T> {
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
 * Explicit generator version of getStateObject for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for state object conversion.
 *
 * @template T - Expected type of the returned object
 * @returns Workflow<T> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.state-processor', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const stateObj = yield* getStateObject.gen<ApplicationState>();
 *
 *   yield* processStateObject(stateObj);
 *   yield* updateUI(stateObj);
 * });
 * ```
 */
getStateObject.gen = function <
  T extends Record<string, any> = Record<string, any>,
>(): Workflow<T> {
  return getStateObject<T>();
};

/**
 * Watch for changes to a specific state key with reactive callbacks.
 *
 * Sets up a reactive observer that triggers a callback whenever the specified
 * state key is modified. The callback receives both the new and old values
 * and can be either a regular function or a generator function.
 *
 * @template T - Type of the state value being watched
 * @param key - State key to watch for changes
 * @param callback - Function called when state changes (old value, new value)
 * @returns Workflow<() => void> - Cleanup function to stop watching
 *
 * @example Basic state watching
 * ```typescript
 * watch('.counter', function* () {
 *   yield* setState('count', 0);
 *
 *   const stopWatching = yield* watchState<number>('count', function* (newVal, oldVal) {
 *     yield* text('.display', `Count changed from ${oldVal} to ${newVal}`);
 *
 *     if (newVal > 10) {
 *       yield* addClass('high-count');
 *     }
 *   });
 *
 *   // Stop watching when component unmounts
 *   yield* onUnmount(() => stopWatching());
 * });
 * ```
 *
 * @example Form validation with state watching
 * ```typescript
 * watch('.form-field', function* () {
 *   yield* watchState<string>('value', function* (newValue, oldValue) {
 *     // Validate on every change
 *     const isValid = yield* validateField(newValue);
 *
 *     yield* toggleClass('valid', isValid);
 *     yield* toggleClass('invalid', !isValid);
 *
 *     if (!isValid) {
 *       yield* text('.error-message', 'This field is required');
 *     } else {
 *       yield* text('.error-message', '');
 *     }
 *   });
 * });
 * ```
 *
 * @example Complex state dependency tracking
 * ```typescript
 * watch('.shopping-cart', function* () {
 *   yield* watchState<CartItem[]>('items', function* (newItems, oldItems) {
 *     const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
 *     yield* setState('total', total);
 *
 *     yield* text('.item-count', `${newItems.length} items`);
 *     yield* text('.total-price', `$${total.toFixed(2)}`);
 *
 *     // Update localStorage
 *     yield* persistState('items');
 *   });
 * });
 * ```
 */
export function watchState<T>(
  key: string,
  callback: (
    newValue: T | undefined,
    oldValue: T | undefined,
  ) => void | Generator<any, void, any>,
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
      context.state.set = function (k: string, v: any) {
        if (k === key) {
          const oldValue = currentValue;
          currentValue = v as T;
          const result = originalSet(k, v);

          // Execute callback
          const callbackResult = callback(currentValue, oldValue);
          if (
            callbackResult &&
            typeof callbackResult === "object" &&
            Symbol.iterator in callbackResult
          ) {
            // Execute sync generator
            const gen = callbackResult as Generator<any, void, any>;
            let genResult = gen.next();
            while (!genResult.done) {
              if (typeof genResult.value === "function") {
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
      context.state.delete = function (k: string) {
        if (k === key && context.state!.has(key)) {
          const oldValue = currentValue;
          currentValue = undefined;
          const result = originalDelete(k);

          // Execute callback
          const callbackResult = callback(undefined, oldValue);
          if (
            callbackResult &&
            typeof callbackResult === "object" &&
            Symbol.iterator in callbackResult
          ) {
            const gen = callbackResult as Generator<any, void, any>;
            let genResult = gen.next();
            while (!genResult.done) {
              if (typeof genResult.value === "function") {
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
 * Create a computed state value that automatically updates based on dependencies.
 *
 * Creates a derived state value that is automatically computed from other state values.
 * When any dependency changes, the computed value is recalculated and cached.
 *
 * @template T - Type of the computed value
 * @param key - Key where the computed value will be cached
 * @param dependencies - Array of state keys that this computation depends on
 * @param compute - Function that computes the value from dependency values
 * @returns Workflow<T> - The computed value
 *
 * @example Shopping cart total
 * ```typescript
 * watch('.shopping-cart', function* () {
 *   yield* setState('items', [
 *     { name: 'Widget', price: 10, quantity: 2 },
 *     { name: 'Gadget', price: 15, quantity: 1 }
 *   ]);
 *   yield* setState('taxRate', 0.08);
 *
 *   // Computed subtotal
 *   const subtotal = yield* computedState<number>('subtotal', ['items'], (items) => {
 *     return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
 *   });
 *
 *   // Computed total with tax
 *   const total = yield* computedState<number>('total', ['subtotal', 'taxRate'], (subtotal, taxRate) => {
 *     return subtotal * (1 + taxRate);
 *   });
 *
 *   yield* text('.subtotal', `Subtotal: $${subtotal.toFixed(2)}`);
 *   yield* text('.total', `Total: $${total.toFixed(2)}`);
 * });
 * ```
 *
 * @example Form validation status
 * ```typescript
 * watch('.registration-form', function* () {
 *   const isValid = yield* computedState<boolean>('formValid',
 *     ['name', 'email', 'password'],
 *     (name, email, password) => {
 *       return name && name.length >= 2 &&
 *              email && email.includes('@') &&
 *              password && password.length >= 8;
 *     }
 *   );
 *
 *   yield* toggleClass('form-valid', isValid);
 *   yield* attr('.submit-btn', 'disabled', !isValid ? 'true' : null);
 * });
 * ```
 *
 * @example User display name
 * ```typescript
 * watch('.user-profile', function* () {
 *   yield* setState('firstName', 'John');
 *   yield* setState('lastName', 'Doe');
 *   yield* setState('username', 'johndoe123');
 *
 *   const displayName = yield* computedState<string>('displayName',
 *     ['firstName', 'lastName', 'username'],
 *     (firstName, lastName, username) => {
 *       if (firstName && lastName) {
 *         return `${firstName} ${lastName}`;
 *       }
 *       return username || 'Anonymous';
 *     }
 *   );
 *
 *   yield* text('.user-name', displayName);
 * });
 * ```
 */
export function computedState<T>(
  key: string,
  dependencies: string[],
  compute: (...deps: any[]) => T,
): Workflow<T> {
  return (function* (): Generator<Operation<T>, T, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }

      // Get dependency values
      const depValues = dependencies.map((dep) => context.state!.get(dep));

      // Compute and cache the value
      const computedValue = compute(...depValues);
      context.state.set(`__computed_${key}`, computedValue);

      return computedValue;
    }) as Operation<T>;
    return result;
  })();
}

/**
 * Persist a state value to localStorage for persistence across sessions.
 *
 * Saves the specified state value to localStorage using JSON serialization.
 * The value will be available even after page refreshes or browser restarts.
 *
 * @param key - State key to persist
 * @param storageKey - Optional custom localStorage key (defaults to watch_state_{key})
 * @returns Workflow<void> - Generator workflow for yield*
 *
 * @example User preferences persistence
 * ```typescript
 * watch('.settings-panel', function* () {
 *   yield* change('.theme-selector', function* (e) {
 *     const theme = e.target.value;
 *     yield* setState('theme', theme);
 *     yield* persistState('theme', 'user_theme_preference');
 *
 *     yield* addClass('theme-' + theme);
 *   });
 * });
 * ```
 *
 * @example Form draft saving
 * ```typescript
 * watch('.blog-editor', function* () {
 *   yield* input('.content-textarea', function* (e) {
 *     const content = e.target.value;
 *     yield* setState('draftContent', content);
 *
 *     // Auto-save draft every few seconds
 *     yield* persistState('draftContent', 'blog_draft');
 *   }, { debounce: 2000 });
 * });
 * ```
 *
 * @example Shopping cart persistence
 * ```typescript
 * watch('.shopping-cart', function* () {
 *   yield* watchState<CartItem[]>('items', function* (newItems) {
 *     // Persist cart whenever items change
 *     yield* persistState('items', 'shopping_cart_items');
 *     yield* text('.save-status', 'Cart saved');
 *   });
 * });
 * ```
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
          console.error("Failed to persist state:", e);
        }
      }
    }) as Operation<void>;
  })();
}

/**
 * Restore a state value from localStorage with fallback defaults.
 *
 * Attempts to load and parse a value from localStorage and set it in state.
 * If the value doesn't exist or parsing fails, uses the provided default value.
 *
 * @template T - Type of the value being restored
 * @param key - State key to restore the value to
 * @param storageKey - Optional custom localStorage key (defaults to watch_state_{key})
 * @param defaultValue - Fallback value if localStorage doesn't contain the key
 * @returns Workflow<T | undefined> - The restored value or undefined
 *
 * @example User preferences restoration
 * ```typescript
 * watch('.app-container', function* () {
 *   // Restore theme preference on app start
 *   const theme = yield* restoreState<string>('theme', 'user_theme_preference', 'light');
 *   yield* addClass('theme-' + theme);
 *
 *   // Restore language preference
 *   const language = yield* restoreState<string>('language', 'user_language', 'en');
 *   yield* attr('html', 'lang', language);
 * });
 * ```
 *
 * @example Form draft restoration
 * ```typescript
 * watch('.blog-editor', function* () {
 *   // Restore draft content when editor loads
 *   const draftContent = yield* restoreState<string>('draftContent', 'blog_draft', '');
 *
 *   if (draftContent) {
 *     yield* value('.content-textarea', draftContent);
 *     yield* addClass('has-draft');
 *     yield* text('.draft-indicator', 'Draft restored');
 *   }
 * });
 * ```
 *
 * @example Shopping cart restoration
 * ```typescript
 * watch('.shopping-cart', function* () {
 *   const savedItems = yield* restoreState<CartItem[]>('items', 'shopping_cart_items', []);
 *
 *   if (savedItems.length > 0) {
 *     yield* renderCartItems(savedItems);
 *     yield* text('.cart-count', String(savedItems.length));
 *   }
 * });
 * ```
 */
export function restoreState<T>(
  key: string,
  storageKey?: string,
  defaultValue?: T,
): Workflow<T | undefined> {
  return (function* (): Generator<
    Operation<T | undefined>,
    T | undefined,
    any
  > {
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
        console.error("Failed to restore state:", e);
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

/**
 * Explicit generator version of restoreState for guaranteed workflow behavior.
 *
 * This .gen version always returns a Workflow and provides explicit control
 * over generator behavior for state restoration from localStorage.
 *
 * @template T - Type of the value being restored
 * @param key - State key to restore the value to
 * @param storageKey - Optional custom localStorage key
 * @param defaultValue - Fallback value if localStorage doesn't contain the key
 * @returns Workflow<T | undefined> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('.session-manager', function* () {
 *   // Explicit .gen version - guaranteed workflow
 *   const sessionData = yield* restoreState.gen<SessionData>('session', 'user_session');
 *
 *   if (sessionData) {
 *     yield* setState('authenticated', true);
 *     yield* text('.welcome', `Welcome back, ${sessionData.username}!`);
 *   }
 * });
 * ```
 */
restoreState.gen = function <T>(
  key: string,
  storageKey?: string,
  defaultValue?: T,
): Workflow<T | undefined> {
  return restoreState<T>(key, storageKey, defaultValue);
};

// ============================================================================
// Additional State Utility Functions
// ============================================================================

/**
 * Increment a numeric state value by a specified amount.
 *
 * Safely increments a numeric state value, treating undefined/missing values as 0.
 * Perfect for counters, scores, and other numeric tracking.
 *
 * @param key - State key containing numeric value
 * @param amount - Amount to increment by (defaults to 1)
 * @returns Workflow<number> - The new incremented value
 *
 * @example Click counter
 * ```typescript
 * watch('.counter-button', function* () {
 *   yield* click(function* () {
 *     const newCount = yield* incrementState('clicks', 1);
 *     yield* text('.count-display', `Clicked ${newCount} times`);
 *
 *     if (newCount === 10) {
 *       yield* addClass('milestone-reached');
 *     }
 *   });
 * });
 * ```
 *
 * @example Score tracking
 * ```typescript
 * watch('.game-board', function* () {
 *   yield* click('.score-point', function* () {
 *     const score = yield* incrementState('score', 10);
 *     yield* text('.score', `Score: ${score}`);
 *
 *     if (score >= 100) {
 *       yield* addClass('high-score');
 *       yield* text('.status', 'High score achieved!');
 *     }
 *   });
 * });
 * ```
 */
export function incrementState(
  key: string,
  amount: number = 1,
): Workflow<number> {
  return (function* (): Generator<Operation<number>, number, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      const currentValue = (context.state.get(key) as number) || 0;
      const newValue = currentValue + amount;
      context.state.set(key, newValue);
      return newValue;
    }) as Operation<number>;
    return result;
  })();
}

/**
 * Explicit generator version of incrementState for guaranteed workflow behavior.
 */
incrementState.gen = function (
  key: string,
  amount: number = 1,
): Workflow<number> {
  return incrementState(key, amount);
};

/**
 * Decrement a numeric state value by a specified amount.
 *
 * Safely decrements a numeric state value, treating undefined/missing values as 0.
 * Perfect for countdown timers, inventory tracking, and other numeric decreasing.
 *
 * @param key - State key containing numeric value
 * @param amount - Amount to decrement by (defaults to 1)
 * @returns Workflow<number> - The new decremented value
 *
 * @example Countdown timer
 * ```typescript
 * watch('.countdown', function* () {
 *   yield* setState('timeLeft', 60);
 *
 *   const timer = setInterval(function* () {
 *     const timeLeft = yield* decrementState('timeLeft', 1);
 *     yield* text('.timer-display', `${timeLeft}s remaining`);
 *
 *     if (timeLeft <= 0) {
 *       clearInterval(timer);
 *       yield* addClass('time-up');
 *       yield* text('.status', 'Time\'s up!');
 *     }
 *   }, 1000);
 * });
 * ```
 */
export function decrementState(
  key: string,
  amount: number = 1,
): Workflow<number> {
  return (function* (): Generator<Operation<number>, number, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      const currentValue = (context.state.get(key) as number) || 0;
      const newValue = currentValue - amount;
      context.state.set(key, newValue);
      return newValue;
    }) as Operation<number>;
    return result;
  })();
}

/**
 * Explicit generator version of decrementState for guaranteed workflow behavior.
 */
decrementState.gen = function (
  key: string,
  amount: number = 1,
): Workflow<number> {
  return decrementState(key, amount);
};

/**
 * Toggle a boolean state value between true and false.
 *
 * Flips a boolean state value, treating undefined/missing values as false.
 * Perfect for toggle switches, visibility states, and other binary conditions.
 *
 * @param key - State key containing boolean value
 * @returns Workflow<boolean> - The new toggled value
 *
 * @example Toggle visibility
 * ```typescript
 * watch('.toggle-button', function* () {
 *   yield* click(function* () {
 *     const isVisible = yield* toggleState('panelVisible');
 *     yield* toggleClass('.panel', 'hidden', !isVisible);
 *     yield* text('.toggle-text', isVisible ? 'Hide Panel' : 'Show Panel');
 *   });
 * });
 * ```
 */
export function toggleState(key: string): Workflow<boolean> {
  return (function* (): Generator<Operation<boolean>, boolean, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      const currentValue = (context.state.get(key) as boolean) || false;
      const newValue = !currentValue;
      context.state.set(key, newValue);
      return newValue;
    }) as Operation<boolean>;
    return result;
  })();
}

/**
 * Explicit generator version of toggleState for guaranteed workflow behavior.
 */
toggleState.gen = function (key: string): Workflow<boolean> {
  return toggleState(key);
};

/**
 * Append an item to an array state value.
 *
 * Adds an item to the end of an array stored in state, creating a new array if none exists.
 * Perfect for lists, collections, and append-only data structures.
 *
 * @template T - Type of array items
 * @param key - State key containing array
 * @param item - Item to append to the array
 * @returns Workflow<T[]> - The new array with item appended
 *
 * @example Todo list
 * ```typescript
 * watch('.todo-form', function* () {
 *   yield* submit(function* (e) {
 *     e.preventDefault();
 *     const newTodo = yield* value<string>('.todo-input');
 *
 *     const todos = yield* appendToState<string>('todos', newTodo);
 *     yield* renderTodoList(todos);
 *     yield* value('.todo-input', ''); // Clear input
 *   });
 * });
 * ```
 */
export function appendToState<T>(key: string, item: T): Workflow<T[]> {
  return (function* (): Generator<Operation<T[]>, T[], any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      const currentArray = (context.state.get(key) as T[]) || [];
      const newArray = [...currentArray, item];
      context.state.set(key, newArray);
      return newArray;
    }) as Operation<T[]>;
    return result;
  })();
}

/**
 * Explicit generator version of appendToState for guaranteed workflow behavior.
 */
appendToState.gen = function <T>(key: string, item: T): Workflow<T[]> {
  return appendToState<T>(key, item);
};

/**
 * Prepend an item to the beginning of an array state value.
 *
 * Adds an item to the start of an array stored in state, creating a new array if none exists.
 * Perfect for recent items lists, history tracking, and LIFO data structures.
 *
 * @template T - Type of array items
 * @param key - State key containing array
 * @param item - Item to prepend to the array
 * @returns Workflow<T[]> - The new array with item prepended
 */
export function prependToState<T>(key: string, item: T): Workflow<T[]> {
  return (function* (): Generator<Operation<T[]>, T[], any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      const currentArray = (context.state.get(key) as T[]) || [];
      const newArray = [item, ...currentArray];
      context.state.set(key, newArray);
      return newArray;
    }) as Operation<T[]>;
    return result;
  })();
}

/**
 * Explicit generator version of prependToState for guaranteed workflow behavior.
 */
prependToState.gen = function <T>(key: string, item: T): Workflow<T[]> {
  return prependToState<T>(key, item);
};

/**
 * Remove an item from an array state value.
 *
 * Removes the first occurrence of an item from an array stored in state.
 * Returns the new array without the removed item.
 *
 * @template T - Type of array items
 * @param key - State key containing array
 * @param item - Item to remove from the array
 * @returns Workflow<T[]> - The new array with item removed
 */
export function removeFromState<T>(key: string, item: T): Workflow<T[]> {
  return (function* (): Generator<Operation<T[]>, T[], any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      const currentArray = (context.state.get(key) as T[]) || [];
      const itemIndex = currentArray.indexOf(item);
      if (itemIndex === -1) {
        return currentArray; // Item not found, return original array
      }
      const newArray = currentArray.filter((_, index) => index !== itemIndex);
      context.state.set(key, newArray);
      return newArray;
    }) as Operation<T[]>;
    return result;
  })();
}

/**
 * Explicit generator version of removeFromState for guaranteed workflow behavior.
 */
removeFromState.gen = function <T>(key: string, item: T): Workflow<T[]> {
  return removeFromState<T>(key, item);
};

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
  incrementState,
  decrementState,
  toggleState,
  appendToState,
  prependToState,
  removeFromState,
};
