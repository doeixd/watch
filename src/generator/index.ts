/**
 * @fileoverview Generator Submodule - Direct Workflow Functions for Type-Safe Watch API
 *
 * This is the entry point for the new generator submodule that provides Workflow<T>
 * functions that can be used directly with `yield*` syntax - no wrapper needed!
 *
 * ## Key Concepts
 *
 * - **Direct Workflows**: Functions that return Workflow<T> (async generators) directly
 * - **Perfect Type Safety**: Full TypeScript inference through `yield*` delegation
 * - **Clean Syntax**: No need for wrapper functions like `$` - just use `yield*`
 * - **Backward Compatible**: Coexists with the existing API
 *
 * @example Basic Usage
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { addClass, getState, text } from 'watch-selector/generator';
 *
 * watch('.button', async function*() {
 *   // Direct yield* syntax - no wrapper needed!
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
 * @example Event Handling
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { click, addClass, removeClass, delay } from 'watch-selector/generator';
 *
 * watch('.ripple-button', async function*() {
 *   yield* click(async function*(event) {
 *     // Event handlers can also use the generator API!
 *     yield* addClass('ripple');
 *     yield* delay(300);
 *     yield* removeClass('ripple');
 *   });
 * });
 * ```
 *
 * @example Advanced Composition
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { addClass, delay, removeClass, self } from 'watch-selector/generator';
 *
 * watch('.material-button', async function*() {
 *   const element = yield* self<HTMLButtonElement>();
 *
 *   yield* click(async function*() {
 *     yield* addClass('ripple');
 *     yield* delay(300);
 *     yield* removeClass('ripple');
 *   });
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
export { text, getText, appendText, prependText } from "./dom";

// HTML content operations
export { html, getHtml, appendHtml, prependHtml } from "./dom";

// Class manipulation operations
export {
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  replaceClass,
  setClasses,
} from "./dom";

// Style manipulation operations
export { style, styleProperty, removeStyle } from "./dom";

// Attribute manipulation operations
export { attr, getAttr, removeAttr, hasAttr } from "./dom";

// Property manipulation operations
export { prop, getProp } from "./dom";

// Data attribute operations
export { data, getData, removeData } from "./dom";

// Form value operations
export { value, getValue, checked, isChecked } from "./dom";

// Focus operations
export { focus, blur } from "./dom";

// Visibility operations
export { show, hide, toggle } from "./dom";

// Element access operations
export { self, query, queryAll, parent, children, siblings } from "./dom";

// Utility operations
export { delay, log, run } from "./dom";

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

// Re-export core types that are useful for the generator API
export type { Workflow, WatchContext, WorkflowFunction } from "../types";

// ============================================================================
// UTILITY RE-EXPORTS
// ============================================================================

// Re-export workflow utilities (compose and map are no longer needed with direct workflows)
export { isWorkflow } from "../core/dollar-helper";

// ============================================================================
// CONVENIENCE ALIASES
// ============================================================================

// Provide some convenient aliases for common operations
export { text as setText } from "./dom";
export { html as setHtml } from "./dom";
export { value as setValue } from "./dom";
export { style as setStyle } from "./dom";
export { attr as setAttribute } from "./dom";
export { prop as setProperty } from "./dom";
export { data as setData } from "./dom";

// Aliases for element access (commonly used pattern)
export { self as element } from "./dom";
export { self as el } from "./dom";

// Common state aliases
export { getState as state } from "./state";
export { setState as stateSet } from "./state";
