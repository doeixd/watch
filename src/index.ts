// Watch v5: The Elegant Kernel
// Main module exports

// Core watch function
export { watch, run, runOn } from './watch';

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
  ParentContext
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
  el,
  all,
  
  // Component composition
  createChildWatcher,
  child
} from './api/dom';

// Event handling functions (dual API)
export {
  // Standard events
  on,
  emit,
  
  // Observer events
  onAttr,
  onText,
  onVisible,
  onResize,
  
  // Lifecycle events
  onMount,
  onUnmount,
  
  // Common event shortcuts
  click,
  change,
  input,
  submit
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
  input,
  form,
  div,
  span,
  withData,
  withDebounce,
  withThrottle,
  once,
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
  once,
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

// Re-export for convenience
export { el as $ } from './core/context';

// Version info
export const VERSION = '5.0.0-alpha.1';

// Default export is the watch function
export { watch as default } from './watch';
