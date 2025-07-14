/**
 * @module watch-selector
 * 
 * A powerful, type-safe DOM observation library with generator-based composition.
 * Watch is a lightweight alternative to web components and frameworks, perfect for
 * server-driven websites, user scripts, Chrome extensions, and anywhere you need
 * reactive DOM interactions without controlling the markup.
 * 
 * ## Key Features
 * 
 * - 🎯 **Selector-Based**: Watch for elements matching CSS selectors
 * - 🔄 **Generator Composition**: Yield functions for elegant async flows
 * - 🧠 **Smart State Management**: Per-element state with reactivity
 * - ⚡ **Advanced Events**: Debouncing, throttling, delegation, queuing
 * - 🎨 **DOM Manipulation**: Comprehensive dual API (direct + generator)
 * - 🛡️ **Type-Safe**: Full TypeScript support with inference
 * - 🧹 **Memory Safe**: Automatic cleanup and lifecycle management
 * - 🎛️ **Controller System**: Layer behaviors and manage instances
 * 
 * @example Basic Usage
 * ```typescript
 * import { watch, click, addClass, text } from 'watch-selector';
 * 
 * // Watch buttons and make them interactive
 * watch('button', function* () {
 *   yield addClass('interactive');
 *   yield click((event, button) => {
 *     text(button, 'Clicked!');
 *   });
 * });
 * ```
 * 
 * @example Generator Event Handlers
 * ```typescript
 * import { watch, click, addClass, removeClass, delay, getState, setState } from 'watch-selector';
 * 
 * watch('.counter', function* () {
 *   yield click(function* (event) {
 *     // Full access to Watch context!
 *     const button = self();
 *     const count = getState('clicks') || 0;
 *     
 *     // Yield Watch functions for elegant composition
 *     yield addClass('clicked');
 *     yield delay(150);
 *     yield removeClass('clicked');
 *     
 *     // Update state and DOM
 *     setState('clicks', count + 1);
 *     yield text(`Clicked ${count + 1} times`);
 *   });
 * });
 * ```
 * 
 * @example Advanced Event Handling
 * ```typescript
 * import { watch, on, input, setState, getState } from 'watch-selector';
 * 
 * watch('.search-form', function* () {
 *   // Real-time search with advanced options
 *   yield input(function* (event) {
 *     const query = (event.target as HTMLInputElement).value;
 *     setState('query', query);
 *     
 *     // Perform search
 *     const results = await searchAPI(query);
 *     yield updateResults(results);
 *   }, {
 *     // Advanced debouncing with leading/trailing edge control
 *     debounce: { wait: 300, leading: false, trailing: true },
 *     delegate: 'input[type="search"]',
 *     queue: 'latest' // Cancel previous searches
 *   });
 * });
 * ```
 * 
 * @example Component Composition
 * ```typescript
 * import { watch, createEventBehavior, composeEventHandlers } from 'watch-selector';
 * 
 * // Create reusable behaviors
 * const rippleEffect = createEventBehavior('click', function* (event) {
 *   yield addClass('ripple');
 *   yield delay(600);
 *   yield removeClass('ripple');
 * });
 * 
 * const clickCounter = createEventBehavior('click', function* (event) {
 *   const count = getState('clicks') || 0;
 *   setState('clicks', count + 1);
 *   yield text(`${count + 1} clicks`);
 * });
 * 
 * // Compose multiple behaviors
 * const materialButton = composeEventHandlers(rippleEffect, clickCounter);
 * 
 * watch('.material-btn', function* () {
 *   yield click(materialButton);
 * });
 * ```
 * 
 * @example Controller System
 * ```typescript
 * import { watch } from 'watch-selector';
 * 
 * // Create a controller for behavior management
 * const buttonController = watch('button', function* () {
 *   yield addClass('base-button');
 *   yield click(() => console.log('Base click'));
 * });
 * 
 * // Layer additional behaviors
 * buttonController.layer(function* () {
 *   yield addClass('enhanced');
 *   yield click(() => console.log('Enhanced click'));
 * });
 * 
 * // Inspect managed instances
 * console.log(buttonController.getInstances());
 * 
 * // Clean up when done
 * buttonController.destroy();
 * ```
 * 
 * @example State Management
 * ```typescript
 * import { watch, createState, setState, getState, watchState } from 'watch-selector';
 * 
 * watch('.todo-app', function* () {
 *   // Create reactive state
 *   const todos = createState('todos', []);
 *   
 *   // Watch state changes
 *   watchState('todos', (newTodos, oldTodos) => {
 *     console.log('Todos updated:', newTodos);
 *     updateTodoList(newTodos);
 *   });
 *   
 *   yield click('.add-todo', function* () {
 *     const input = el('input') as HTMLInputElement;
 *     const currentTodos = getState('todos') || [];
 *     setState('todos', [...currentTodos, input.value]);
 *     input.value = '';
 *   });
 * });
 * ```
 * 
 * @version 1.0.0
 * @author Patrick Glenn
 * @license MIT
 */

// Watch v5: The Elegant Kernel
// Main module exports

// Core watch function
export { watch, run, runOn, layer, getInstances, destroy } from './watch';

// Core types for advanced usage
export type {
  ElementFromSelector,
  ElementHandler,
  ElementFn,
  WatchContext,
  ElementProxy,
  SelfFunction,
  GeneratorFunction,
  CleanupFunction,
  ElementEventHandler,
  AttributeChange,
  TextChange,
  VisibilityChange,
  ResizeChange,
  MountHandler,
  UnmountHandler,
  WatchTarget,
  ElementMatcher,
  ParentContext,
  WatchController,
  ManagedInstance,
  CustomEventHandler,
  EventHandler,
  WatchEventListenerOptions,
  HybridEventHandler as EnhancedEventHandler,
  HybridCustomEventHandler as EnhancedCustomEventHandler,
  HybridEventOptions as EnhancedEventOptions,
  DebounceOptions,
  ThrottleOptions
} from './types';

// DOM manipulation functions (comprehensive dual API)
export {
  // Utilities
  isElement,
  isElementLike,
  resolveElement,
  
  // Text content
  text,
  
  // HTML content
  html,
  
  // Class manipulation
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  
  // Style manipulation
  style,
  
  // Attribute manipulation
  attr,
  removeAttr,
  hasAttr,
  
  // Property manipulation
  prop,
  
  // Data attributes
  data,
  
  // Form values
  value,
  checked,
  
  // Focus management
  focus,
  blur,
  
  // Visibility
  show,
  hide,
  
  // DOM traversal
  query,
  queryAll,
  parent,
  children,
  siblings,
  
  // Batch operations
  batchAll,
  
  // Aliases
  el as elDOM,
  all as allDOM,
  
  // Component composition
  createChildWatcher,
  child
} from './api/dom';

// Event handling functions (dual API with advanced generator support)
export {
  // Main event API
  on,
  emit,
  click,
  change,
  input,
  submit,
  
  // Event composition utilities
  createEventBehavior,
  composeEventHandlers,
  delegate,
  
  // Enhanced event utilities
  createCustomEvent,
  
  // Observer events
  onAttr,
  onText,
  onVisible,
  onResize,
  
  // Lifecycle events
  onMount,
  onUnmount
} from './api/events';

// Context functions for use within generators
export {
  self,
  el,
  all,
  cleanup,
  ctx,
  createGenerator,
  gen,
  watchGenerator,
  getParentContext
} from './core/generator';

// Context factory functions
export {
  context,
  contextFor,
  button,
  input as inputFactory,
  form,
  div,
  span,
  withData,
  withDebounce,
  withThrottle,
  once as onceFactory,
  withFilter
} from './core/context-factory';

// Generator utilities
export {
  debounceGenerator,
  throttleGenerator,
  onceGenerator,
  delayGenerator,
  batchGenerator
} from './core/generator-utils';

// Enhanced state management
export {
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
  createTypedState,
  createState,
  createComputed,
  watchState,
  setStateReactive,
  batchStateUpdates,
  createPersistedState,
  clearAllState,
  debugState,
  logState
} from './core/state';

// Execution helpers
export {
  once as onceHelper,
  delay,
  throttle,
  debounce,
  when,
  safely,
  batch,
  retry,
  rateLimit,
  memoize,
  timeout,
  compose,
  unless,
  async
} from './core/execution-helpers';



// Low-level context functions
export {
  getCurrentElement,
  getCurrentContext
} from './core/context';

// Observer utilities
export {
  register,
  getObserverStatus,
  cleanup as cleanupObserver
} from './core/observer';

// Scoped watch API - create watchers scoped to specific parent elements
export {
  scopedWatch,
  scopedWatchBatch,
  scopedWatchTimeout,
  scopedWatchOnce,
  scopedWatchWithController,
  scopedWatchBatchWithController,
  type ScopedWatchOptions,
  type ScopedWatcher
} from './scoped-watch';

// Scoped observer utilities
export {
  createScopedWatcher,
  disconnectScopedWatchers,
  getScopedWatchers
} from './core/scoped-observer';

// Re-export for convenience
export { el as $ } from './core/generator';

// Version info
// export const VERSION = '5.0.0-alpha.1';

// Default export is the watch function
export { watch as default } from './watch';
