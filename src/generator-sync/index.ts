/**
 * @fileoverview Synchronous Generator Submodule - Direct Sync Workflow Functions
 *
 * This is the entry point for the synchronous generator submodule that provides SyncWorkflow<T>
 * functions that can be used directly with `yield*` syntax in synchronous generators.
 *
 * Use this module when you don't need async operations and want to keep your generators
 * synchronous for better performance and simpler code.
 *
 * ## Key Concepts
 *
 * - **Sync Workflows**: Functions that return SyncWorkflow<T> (sync generators) directly
 * - **Perfect Type Safety**: Full TypeScript inference through `yield*` delegation
 * - **Better Performance**: No async overhead when you don't need it
 * - **Clean Syntax**: No need for wrapper functions - just use `yield*`
 *
 * @example Basic Usage with Sync Generators
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { addClass, text, getState, setState } from 'watch-selector/generator-sync';
 *
 * watch('.button', function*() {  // Note: sync function*, not async
 *   // Direct yield* syntax - no async overhead!
 *   yield* addClass('interactive');
 *
 *   // Type-safe state access
 *   const count = yield* getState<number>('clicks', 0);
 *
 *   // Update state and DOM
 *   yield* setState('clicks', count + 1);
 *   yield* text(`Clicked ${count + 1} times`);
 * });
 * ```
 *
 * @example When to Use Sync vs Async Generators
 * ```typescript
 * // Use SYNC generators (this module) when:
 * // - You don't need await/async operations
 * // - You want better performance
 * // - You're doing simple DOM manipulations
 * // - Your event handlers don't need async operations
 *
 * import { text, addClass, click } from 'watch-selector/generator-sync';
 *
 * watch('.simple-button', function*() {
 *   yield* text('Click me');
 *   yield* addClass('ready');
 *
 *   yield* click(function*(event) {
 *     // Event handler can also be sync!
 *     yield* addClass('clicked');
 *     yield* text('Clicked!');
 *   });
 * });
 *
 * // Use ASYNC generators (watch-selector/generator) when:
 * // - You need to await promises
 * // - You're fetching data from APIs
 * // - You're using setTimeout/delays
 * // - You need to handle async operations in event handlers
 *
 * import { text, addClass, delay } from 'watch-selector/generator';
 *
 * watch('.async-button', async function*() {
 *   const data = await fetch('/api/data').then(r => r.json());
 *   yield* text(data.message);
 *   yield* delay(1000);
 *   yield* addClass('loaded');
 * });
 * ```
 *
 * @example Event Handling with Sync Generators
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { click, addClass, removeClass, toggleClass } from 'watch-selector/generator-sync';
 *
 * watch('.toggle-button', function*() {
 *   yield* click(function*(event) {
 *     // Sync event handlers are more efficient when you don't need async
 *     const isActive = yield* toggleClass('active');
 *
 *     if (isActive) {
 *       yield* addClass('on');
 *       yield* removeClass('off');
 *     } else {
 *       yield* addClass('off');
 *       yield* removeClass('on');
 *     }
 *   });
 * });
 * ```
 *
 * @example State Management with Sync Generators
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getState, setState, updateState, watchState } from 'watch-selector/generator-sync';
 *
 * watch('.counter', function*() {
 *   // Initialize state
 *   yield* setState('count', 0);
 *
 *   // Watch for state changes
 *   yield* watchState('count', function*(newCount, oldCount) {
 *     console.log(`Count changed from ${oldCount} to ${newCount}`);
 *   });
 *
 *   // Update state with a function
 *   yield* updateState('count', (current) => current + 1);
 * });
 * ```
 *
 * @version 1.0.0
 * @author Patrick Glenn
 * @license MIT
 */

// ============================================================================
// DOM MANIPULATION OPERATIONS
// ============================================================================

// Text content operations
export { text, getText, setText } from "./dom";

// HTML content operations
export { html, getHtml, setHtml } from "./dom";

// Class manipulation operations
export {
  addClass,
  removeClass,
  toggleClass,
  hasClass,
} from "./dom";

// Style manipulation operations
export { style } from "./dom";

// Attribute manipulation operations
export { attr, getAttr, removeAttr } from "./dom";

// Form value operations
export { value, getValue, setValue, checked, isChecked, setChecked } from "./dom";

// Focus operations
export { focus, blur } from "./dom";

// Visibility operations
export { show, hide, toggle } from "./dom";

// Element access operations
export { self, element, el, query, queryAll } from "./dom";

// ============================================================================
// STATE MANAGEMENT OPERATIONS
// ============================================================================

// Basic state operations
export {
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
} from "./state";

// Advanced state operations
export {
  initState,
  incrementState,
  decrementState,
  toggleState,
  appendToState,
  prependToState,
  removeFromState,
  mergeState,
} from "./state";

// State watching operations
export { watchState } from "./state";

// Reactive state operations
export { computedState } from "./state";

// State debugging operations
export { logState, logStateKey, getStateSnapshot, clearState } from "./state";

// ============================================================================
// EVENT HANDLING OPERATIONS
// ============================================================================

// Basic event operations
export {
  click,
  input,
  change,
  submit,
  onFocus,
  onBlur,
  keydown,
  keyup,
  mouseenter,
  mouseleave,
} from "./events";

// Generic event operations
export { on, onCustom } from "./events";

// Event emission operations
export { emit, emitEvent } from "./events";

// Observer event operations
export { onAttr, onText, onVisible, onResize } from "./events";

// Lifecycle event operations
export { onMount, onUnmount } from "./events";

// Utility event operations
export { once, preventDefault, stopPropagation } from "./events";

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Re-export core types that are useful for the sync generator API
export type {
  SyncWorkflow,
  WatchContext,
  Operation,
  ElementFn
} from "../types";

// ============================================================================
// UTILITY RE-EXPORTS
// ============================================================================

// Re-export sync workflow utilities
export { isSyncWorkflow } from "../core/dollar-helper";

// The $sync helper for cases where you need to wrap operations
export { $sync } from "../core/dollar-helper";

// ============================================================================
// USAGE NOTES
// ============================================================================

/**
 * ## Performance Considerations
 *
 * Sync generators have less overhead than async generators because:
 * - No promise creation/resolution for each yield
 * - No async/await machinery
 * - Simpler call stack
 * - Better browser optimization
 *
 * Use sync generators when possible for better performance.
 *
 * ## Migration from Async to Sync
 *
 * To migrate from async to sync generators:
 *
 * 1. Change imports:
 *    ```typescript
 *    // Before
 *    import { text, addClass } from 'watch-selector/generator';
 *
 *    // After
 *    import { text, addClass } from 'watch-selector/generator-sync';
 *    ```
 *
 * 2. Change generator declaration:
 *    ```typescript
 *    // Before
 *    watch('.element', async function*() { ... });
 *
 *    // After
 *    watch('.element', function*() { ... });
 *    ```
 *
 * 3. Remove any await statements (or keep using async if needed)
 *
 * ## Mixing Sync and Async
 *
 * You can mix sync and async operations in the same project:
 *
 * ```typescript
 * import { text as syncText } from 'watch-selector/generator-sync';
 * import { text as asyncText, delay } from 'watch-selector/generator';
 *
 * // Sync generator for simple operations
 * watch('.simple', function*() {
 *   yield* syncText('Fast!');
 * });
 *
 * // Async generator when delays are needed
 * watch('.delayed', async function*() {
 *   yield* asyncText('Loading...');
 *   yield* delay(1000);
 *   yield* asyncText('Done!');
 * });
 * ```
 */
