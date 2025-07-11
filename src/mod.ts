// Watch v5: The Elegant Kernel
// Main module exports

// Core watch function
export { watch, run, runOn } from './src/watch.ts';

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
  ElementMatcher
} from './src/types.ts';

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
  all
} from './src/api/dom.ts';

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
} from './src/api/events.ts';

// Context functions for use within generators
export {
  self,
  el,
  all,
  cleanup,
  ctx,
  createGenerator,
  gen,
  watchGenerator
} from './src/core/generator.ts';

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
} from './src/core/context-factory.ts';

// Generator utilities
export {
  debounceGenerator,
  throttleGenerator,
  onceGenerator,
  delayGenerator,
  batchGenerator
} from './src/core/generator-utils.ts';

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
} from './src/core/state.ts';

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
} from './src/core/execution-helpers.ts';



// Low-level context functions
export {
  getCurrentElement,
  getCurrentContext
} from './src/core/context.ts';

// Observer utilities
export {
  register,
  getObserverStatus,
  cleanup as cleanupObserver
} from './src/core/observer.ts';

// Re-export for convenience
export { el as $ } from './src/core/context.ts';

// Version info
export const VERSION = '5.0.0-alpha.1';

// Default export is the watch function
export { watch as default } from './src/watch.ts';
