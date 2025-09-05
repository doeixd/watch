/**
 * Unified API exports for watch-selector
 *
 * This module re-exports all DOM manipulation, event handling, and state management
 * functions with full support for sync generators and the yield* pattern.
 */

// DOM manipulation functions
export {
  text,
  html,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  style,
  attr,
  removeAttr,
  hasAttr,
  prop,
  data,
  value,
  checked,
  focus,
  blur,
  show,
  hide,
  query,
  queryAll,
  parent,
  children,
  siblings,
  safeHtml,
  batchAll,
  createChildWatcher,
  child,
  el,
  all,
} from "./dom-new";

// Event handling functions
export {
  on,
  click,
  input,
  change,
  submit,
  keydown,
  keyup,
  onMount,
  onUnmount,
  onVisible,
  onResize,
  emit,
} from "./events-sync";

// State management functions
export {
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
} from "./state-sync";

// Selector type utilities
export {
  selector,
  className,
  elementId,
  auto,
  toString as selectorToString,
  isCSSSelector,
  isClassName,
  isElementId,
  isBrandedString,
  type CSSSelector,
  type ClassName,
  type ElementId,
} from "../utils/selector-types";

// Re-export types
export type {
  Workflow,
  Operation,
  WatchContext,
  CleanupFunction,
  ElementFn,
} from "../types";
