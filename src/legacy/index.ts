/**
 * Legacy API Module - Version 4 Compatibility Layer
 *
 * This module provides backward compatibility for users who need the previous
 * version's behavior. The main library has been enhanced with context-attached
 * DOM helpers and improved type safety, but the original API is preserved here.
 *
 * @deprecated Use the main API instead. This legacy module is provided for
 * backward compatibility only and may be removed in future major versions.
 *
 * @example Migration from legacy to new API
 * ```typescript
 * // Legacy API (this module)
 * import { watchLegacy } from 'watch-selector/legacy';
 * import { text, addClass } from 'watch-selector/legacy';
 *
 * watchLegacy('button', function* () {
 *   yield text('Click me');
 *   yield addClass('active');
 * });
 *
 * // New Enhanced API (recommended)
 * import { watch } from 'watch-selector';
 *
 * watch('button', function* (ctx) {
 *   yield* ctx.text('Click me');
 *   yield* ctx.addClass('active');
 * });
 * ```
 */

// Re-export the v4 watch implementation
export {
  watch as watchLegacy,
  run as runLegacy,
  runOn as runOnLegacy,
  layer as layerLegacy,
  getInstances as getInstancesLegacy,
  destroy as destroyLegacy,
} from './watch-v4';

// Re-export the v4 DOM API
export {
  // Utilities
  isElement,
  isElementLike,
  resolveElement,

  // Text content
  text,

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
  child,
} from './dom-v4';

// Re-export types for legacy compatibility
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
  WatchTarget,
  ElementMatcher,
  ParentContext,
  WatchController,
  ManagedInstance,
} from '../types';

/**
 * @deprecated Use the main watch function instead
 * This is a convenience re-export for easier migration
 */
export { watchLegacy as watch } from './watch-v4';

/**
 * Migration helper to detect legacy usage
 * @internal
 */
export const LEGACY_API_VERSION = '4.0.0';

/**
 * Helper function to warn about legacy usage in development
 * @internal
 */
export function warnLegacyUsage(feature: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[watch-selector] Using legacy ${feature}. Consider migrating to the new enhanced API. ` +
      `See migration guide: https://github.com/user/watch-selector/blob/main/MIGRATION.md`
    );
  }
}
