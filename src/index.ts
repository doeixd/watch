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

// Core watch function - Enhanced version as default
export { watch, runOn, scopedWatch } from "./watch-enhanced";

// Also export controller functions from original watch
export { run, layer, getInstances, destroy } from "./watch";

// Legacy watch functions available for backward compatibility
export { watch as watchLegacy, runOn as runOnLegacy } from "./watch";

// State management
export {
  createState,
  watchState,
  setState,
  getState,
  updateState,
  hasState,
  deleteState,
  clearAllState,
  createTypedState,
  // Utility state functions
  incrementState,
  decrementState,
  toggleState,
  appendToState,
  prependToState,
  removeFromState,
  mergeState,
  clearState,
} from "./core/state";

// State management with Workflow support (yield* compatible)
export {
  setState as setStateWorkflow,
  getState as getStateWorkflow,
  updateState as updateStateWorkflow,
  hasState as hasStateWorkflow,
  deleteState as deleteStateWorkflow,
  clearState as clearStateWorkflow,
  getStateKeys,
  getStateEntries,
  getStateSize,
  mergeState as mergeStateWorkflow,
  getStateObject,
  watchState as watchStateWorkflow,
  computedState,
  persistState,
  restoreState,
  incrementState as incrementStateWorkflow,
  decrementState as decrementStateWorkflow,
  toggleState as toggleStateWorkflow,
  appendToState as appendToStateWorkflow,
  prependToState as prependToStateWorkflow,
  removeFromState as removeFromStateWorkflow,
} from "./api/state-sync";

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
  TypedState,
  ThrottleOptions,
} from "./types";

// DOM manipulation functions - Enhanced version (dom-new) as default
export {
  // Utilities
  isElement,
  isElementLike,
  resolveElement,

  // Text content
  text,
  getText,

  // HTML content
  html,
  safeHtml,

  // Class manipulation
  addClass,
  removeClass,
  toggleClass,
  hasClass,

  // Style manipulation
  style,
  getStyle,

  // Attribute manipulation
  attr,
  getAttr,
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

  // Component composition
  createChildWatcher,
  child,
} from "./api/dom-new";

// Re-export aliases from dom-new separately to avoid conflicts
export { el as elDOM, all as allDOM } from "./api/dom-new";

// Legacy DOM functions available for backward compatibility
export * as domLegacy from "./api/dom";

// Event handling functions (dual API with advanced generator support)
export {
  // Main event API
  on,
  emit,

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
  onUnmount,
} from "./api/events";

// Convenience event functions with Workflow support
export {
  click,
  input,
  change,
  submit,
  onFocus,
  onBlur,
} from "./api/events-sync";

// Generator versions for explicit yield* usage
import {
  click as clickSync,
  input as inputSync,
  change as changeSync,
  submit as submitSync,
  onFocus as onFocusSync,
  onBlur as onBlurSync,
} from "./api/events-sync";
import {
  emit as emitMain,
  onMount as onMountMain,
  onUnmount as onUnmountMain,
} from "./api/events";

// Re-export .gen versions for consistent API
export const clickGen = clickSync.gen;
export const inputGen = inputSync.gen;
export const changeGen = changeSync.gen;
export const submitGen = submitSync.gen;
export const onFocusGen = onFocusSync.gen;
export const onBlurGen = onBlurSync.gen;
export const emitGen = (emitMain as any).gen;
export const onMountGen = (onMountMain as any).gen;
export const onUnmountGen = (onUnmountMain as any).gen;

// Context functions for use within generators (all support yield* with Workflow return types)
export {
  // Core generator functions with yield* support
  self,
  el as elContext,
  all as allContext,
  cleanup,
  ctx,
  // Generator utilities
  createGenerator,
  gen,
  watchGenerator,
  getParentContext,
  parent as parentContext,
  children as childrenContext,
  siblings as siblingsContext,
  executeElementCleanup,
} from "./core/generator";

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
  withFilter,
} from "./core/context-factory";

// Generator utilities
export {
  debounceGenerator,
  throttleGenerator,
  onceGenerator,
  delayGenerator,
  batchGenerator,
} from "./core/generator-utils";

// Enhanced state management
export {
  createComputed,
  setStateReactive,
  batchStateUpdates,
  createPersistedState,
  debugState,
  logState,
} from "./core/state";

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
  async as asyncHelper,
} from "./core/execution-helpers";

// Low-level context functions
export { getCurrentElement, getCurrentContext } from "./core/context";

// Observer utilities
export {
  register,
  getObserverStatus,
  cleanup as cleanupObserver,
} from "./core/observer";

// Scoped watch API - create watchers scoped to specific parent elements
// Note: scopedWatch is now exported from watch-enhanced as the enhanced version
export {
  scopedWatchBatch,
  scopedWatchTimeout,
  scopedWatchOnce,
  scopedWatchWithController,
  scopedWatchBatchWithController,
  type ScopedWatchOptions,
  type ScopedWatcher,
} from "./scoped-watch";

// Legacy scoped watch for backward compatibility
export { scopedWatch as scopedWatchLegacy } from "./scoped-watch";

// Scoped observer utilities
export {
  createScopedWatcher,
  disconnectScopedWatchers,
  getScopedWatchers,
} from "./core/scoped-observer";

// Type predicates for user disambiguation
export {
  isElement as isElementPredicate,
  isElementType,
  isInputElement,
  isSelector,
  isClassList,
  isStyleObject,
  isAttributeObject,
  isElementFn,
  isWorkflow as isWorkflowPredicate,
  isGeneratorFunction,
  isAsyncGeneratorFunction,
  isElementLike as isElementLikePredicate,
  isInGeneratorContext,
  asElement,
  isDefined,
  isValidTarget,
} from "./api/type-predicates";

// Explicit un-overloaded DOM functions
export * from "./api/dom-explicit";

// Enhanced context type and utilities (now the default)
export {
  createEnhancedContext,
  type EnhancedTypedGeneratorContext,
  type EnhancedTypedGeneratorContext as TypedGeneratorContext,
} from "./watch-enhanced";

// Original enhanced versions still available with explicit names for backward compatibility
export {
  watchEnhanced,
  runOnEnhanced,
  scopedWatchEnhanced,
} from "./watch-enhanced";

// Generator utilities for workflow composition
export { $, isWorkflow } from "./core/dollar-helper";

// Async wrapper for yielding async operations in sync generators
export { async } from "./core/async-wrapper";
export type { AsyncInSync } from "./core/async-wrapper";

// All functions now support yield* patterns with Workflow<T> return types
// This provides type-safe composition and eliminates the need for $ wrapper in most cases
// The generator module has been removed as all functionality is now unified

// Re-export enhanced generator functions (support both direct calls and yield*)
export { el, all } from "./core/generator";

// Version info
// export const VERSION = '5.0.0-alpha.1';

// Default export is the enhanced watch function with attached context methods
export { watch as default } from "./watch-enhanced";

// ============================================================================
// STANDALONE MODULES AVAILABLE
// ============================================================================

// EXPLICIT API - Available as standalone module: 'watch-selector/explicit'
// Non-overloaded versions with clear, unambiguous names
// import { setTextElement, addClassSelector } from 'watch-selector/explicit';

// FLUENT API - Available as standalone module: 'watch-selector/fluent'
// Chainable jQuery-like interface for method chaining
// import { selector, element, $fluent } from 'watch-selector/fluent';

// Note: For backward compatibility, explicit and fluent APIs are still available
// as namespaces in the main module, but prefer importing the standalone modules.
// Main module exports below maintain compatibility for existing code.

// Fluent factories available directly from main module for convenience
export { selector, element, elements, $fluent } from "./fluent";

// Explicit namespace still available for backward compatibility
export * as explicit from "./explicit";

// Fluent namespace still available for backward compatibility
export * as fluent from "./fluent";
