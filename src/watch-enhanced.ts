/**
 * Enhanced watch function with DOM manipulation functions attached to context
 *
 * This module provides an enhanced version of the watch function that passes
 * a context object with all DOM manipulation functions from dom-new.ts attached,
 * allowing for more ergonomic usage patterns.
 */

import type {
  ElementFromSelector,
  ElementMatcher,
  WatchTarget,
  PreDefinedWatchContext,
  WatchController,
  TypedGeneratorContext,
  Operation,
} from "./types";
import { getOrCreateController } from "./core/observer";
import { executeGenerator } from "./core/context";
import { isPreDefinedWatchContext } from "./core/context-factory";
import {
  debounceGenerator,
  throttleGenerator,
  onceGenerator,
} from "./core/generator-utils";
import { setContextApi } from "./core/generator";
import {
  createEnhancedContext,
  type EnhancedTypedGeneratorContext,
} from "./core/enhanced-context/context-with-dom";

// Enhanced watch function overloads with attached DOM functions

/**
 * Watches elements matching a CSS selector and provides an enhanced context with all DOM manipulation functions.
 *
 * The enhanced watch function is the recommended API for most use cases. It provides a context object with
 * all DOM manipulation, event, and state functions attached as methods. This allows for cleaner, more
 * discoverable code with full TypeScript intellisense and type safety.
 *
 * Elements are automatically observed - when matching elements are added to the DOM, the generator runs.
 * When elements are removed, cleanup functions are automatically executed. The generator runs once per
 * matched element, with the context bound to that specific element.
 *
 * @param selector - CSS selector to match elements (type-safe selectors like 'button', 'input' provide proper element types)
 * @param generatorFn - Generator function that receives the enhanced context
 * @param options - Optional configuration for debouncing, throttling, or one-time execution
 * @returns WatchController for managing the watcher lifecycle
 *
 * @example Basic DOM manipulation with yield* pattern
 * ```typescript
 * import { watch } from 'watch-selector';
 *
 * watch('button', function* (ctx) {
 *   // All DOM functions are available on context
 *   yield* ctx.text('Click me!');
 *   yield* ctx.addClass('interactive');
 *
 *   // Read values using yield*
 *   const currentText = yield* ctx.text();
 *   console.log('Button text:', currentText);
 * });
 * ```
 *
 * @example Event handling with state management
 * ```typescript
 * watch('.counter', function* (ctx) {
 *   // Initialize state
 *   yield* ctx.setState('count', 0);
 *   yield* ctx.text('Count: 0');
 *
 *   // Handle clicks with generator functions
 *   yield* ctx.click(function* () {
 *     const count = yield* ctx.getState('count', 0);
 *     const newCount = count + 1;
 *
 *     yield* ctx.setState('count', newCount);
 *     yield* ctx.text(`Count: ${newCount}`);
 *
 *     // Add animation
 *     yield* ctx.addClass('pulse');
 *     setTimeout(() => {
 *       yield* ctx.removeClass('pulse');
 *     }, 200);
 *   });
 * });
 * ```
 *
 * @example Complex UI component with lifecycle
 * ```typescript
 * watch('.dropdown', function* (ctx) {
 *   // Setup initial state
 *   yield* ctx.hide('.dropdown-menu');
 *   yield* ctx.attr('aria-expanded', 'false');
 *
 *   // Mount handler
 *   yield* ctx.onMount(function* () {
 *     console.log('Dropdown initialized');
 *     yield* ctx.addClass('dropdown-ready');
 *   });
 *
 *   // Toggle behavior
 *   yield* ctx.click('.dropdown-toggle', function* () {
 *     const isOpen = yield* ctx.hasClass('open');
 *
 *     if (isOpen) {
 *       yield* ctx.removeClass('open');
 *       yield* ctx.hide('.dropdown-menu');
 *       yield* ctx.attr('aria-expanded', 'false');
 *     } else {
 *       yield* ctx.addClass('open');
 *       yield* ctx.show('.dropdown-menu');
 *       yield* ctx.attr('aria-expanded', 'true');
 *
 *       // Focus first item
 *       const firstItem = yield* ctx.query('.dropdown-item');
 *       if (firstItem) {
 *         firstItem.focus();
 *       }
 *     }
 *   });
 *
 *   // Keyboard navigation
 *   yield* ctx.on('keydown', function* (event) {
 *     if (event.key === 'Escape') {
 *       yield* ctx.removeClass('open');
 *       yield* ctx.hide('.dropdown-menu');
 *     }
 *   });
 *
 *   // Cleanup on unmount
 *   yield* ctx.onUnmount(function* () {
 *     console.log('Dropdown destroyed');
 *   });
 * });
 * ```
 *
 * @example Observer events for reactive updates
 * ```typescript
 * watch('[data-price]', function* (ctx) {
 *   // Watch for attribute changes
 *   yield* ctx.onAttr('data-price', function* (newValue, oldValue) {
 *     const price = parseFloat(newValue || '0');
 *     const formatted = new Intl.NumberFormat('en-US', {
 *       style: 'currency',
 *       currency: 'USD'
 *     }).format(price);
 *
 *     yield* ctx.text(formatted);
 *
 *     // Highlight changes
 *     if (oldValue && newValue !== oldValue) {
 *       yield* ctx.addClass('price-changed');
 *       setTimeout(() => {
 *         yield* ctx.removeClass('price-changed');
 *       }, 2000);
 *     }
 *   });
 *
 *   // Watch for visibility changes
 *   yield* ctx.onVisible(function* (isVisible) {
 *     if (isVisible) {
 *       yield* ctx.addClass('in-view');
 *       // Trigger analytics event
 *     } else {
 *       yield* ctx.removeClass('in-view');
 *     }
 *   });
 * });
 * ```
 *
 * @example Form handling with validation
 * ```typescript
 * watch('form.signup', function* (ctx) {
 *   // Real-time validation
 *   yield* ctx.on('input', '[required]', function* (event) {
 *     const input = event.target as HTMLInputElement;
 *     const value = input.value.trim();
 *
 *     if (!value) {
 *       yield* ctx.addClass('error', input);
 *       yield* ctx.attr('aria-invalid', 'true', input);
 *     } else {
 *       yield* ctx.removeClass('error', input);
 *       yield* ctx.attr('aria-invalid', 'false', input);
 *     }
 *   });
 *
 *   // Form submission
 *   yield* ctx.submit(function* (event) {
 *     event.preventDefault();
 *
 *     // Check all required fields
 *     const requiredFields = yield* ctx.queryAll('[required]');
 *     let isValid = true;
 *
 *     for (const field of requiredFields) {
 *       if (!(field as HTMLInputElement).value.trim()) {
 *         yield* ctx.addClass('error', field);
 *         isValid = false;
 *       }
 *     }
 *
 *     if (isValid) {
 *       yield* ctx.addClass('submitting');
 *       yield* ctx.prop('disabled', true, 'button[type="submit"]');
 *
 *       // Submit form data
 *       const formData = new FormData(event.target as HTMLFormElement);
 *       // ... handle submission
 *     }
 *   });
 * });
 * ```
 * ```
 *
 * @example Type-safe element access
 * ```typescript
 * watch('input[type="email"]', function* (ctx) {
 *   // ctx.self() returns HTMLInputElement
 *   const input = ctx.self();
 *
 *   yield* ctx.value('user@example.com');
 *   const currentValue = yield* ctx.value();
 *
 *   if (currentValue.includes('@')) {
 *     yield* ctx.addClass('valid-email');
 *   }
 * });
 * ```
 *
 * @example DOM traversal with attached functions
 * ```typescript
 * watch('.card', function* (ctx) {
 *   // Query child elements
 *   const title = yield* ctx.query<HTMLHeadingElement>('h2');
 *   const buttons = yield* ctx.queryAll<HTMLButtonElement>('button');
 *
 *   // Get parent and siblings
 *   const parent = yield* ctx.parent();
 *   const siblings = yield* ctx.siblings('.card');
 * });
 * ```
 */
export function watch<S extends string, TReturn = void>(
  selector: S,
  generator: (
    ctx: EnhancedTypedGeneratorContext<ElementFromSelector<S>>,
  ) => Generator<Operation<any>, TReturn, unknown>,
): WatchController<ElementFromSelector<S>>;

export function watch<S extends string, TReturn = void>(
  selector: S,
  generator: (
    ctx: EnhancedTypedGeneratorContext<ElementFromSelector<S>>,
  ) => Generator<Operation<any>, TReturn, unknown>,
): WatchController<ElementFromSelector<S>>;

export function watch<S extends string, TReturn = void>(
  selector: S,
  generator: (
    ctx: EnhancedTypedGeneratorContext<ElementFromSelector<S>>,
  ) => AsyncGenerator<Operation<any>, TReturn, unknown>,
): WatchController<ElementFromSelector<S>>;

// Single element overloads
export function watch<El extends HTMLElement, TReturn = void>(
  element: El,
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => Generator<Operation<any>, TReturn, unknown>,
): WatchController<El>;

export function watch<El extends HTMLElement, TReturn = void>(
  element: El,
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => AsyncGenerator<Operation<any>, TReturn, unknown>,
): WatchController<El>;

// Matcher function overloads
export function watch<El extends HTMLElement, TReturn = void>(
  matcher: ElementMatcher<El>,
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => Generator<Operation<any>, TReturn, unknown>,
): WatchController<El>;

export function watch<El extends HTMLElement, TReturn = void>(
  matcher: ElementMatcher<El>,
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => AsyncGenerator<Operation<any>, TReturn, unknown>,
): WatchController<El>;

// Array of elements overloads
export function watch<El extends HTMLElement, TReturn = void>(
  elements: El[],
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => Generator<Operation<any>, TReturn, unknown>,
): WatchController<El>;

export function watch<El extends HTMLElement, TReturn = void>(
  elements: El[],
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => AsyncGenerator<Operation<any>, TReturn, unknown>,
): WatchController<El>;

// NodeList overloads
export function watch<El extends HTMLElement, TReturn = void>(
  nodeList: NodeListOf<El>,
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => Generator<Operation<any>, TReturn, unknown>,
): WatchController<El>;

export function watch<El extends HTMLElement, TReturn = void>(
  nodeList: NodeListOf<El>,
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => AsyncGenerator<Operation<any>, TReturn, unknown>,
): WatchController<El>;

// Event delegation overloads (parent + child selector)
export function watch<
  ParentEl extends HTMLElement,
  S extends string,
  TReturn = void,
>(
  parent: ParentEl,
  childSelector: S,
  generator: (
    ctx: EnhancedTypedGeneratorContext<ElementFromSelector<S>>,
  ) => Generator<Operation<any>, TReturn, unknown>,
): WatchController<ElementFromSelector<S>>;

export function watch<
  ParentEl extends HTMLElement,
  S extends string,
  TReturn = void,
>(
  parent: ParentEl,
  childSelector: S,
  generator: (
    ctx: EnhancedTypedGeneratorContext<ElementFromSelector<S>>,
  ) => AsyncGenerator<any, TReturn, unknown>,
): WatchController<ElementFromSelector<S>>;

// Pre-defined context overloads
export function watch<S extends string, El extends HTMLElement, TReturn = void>(
  context: PreDefinedWatchContext<S, El>,
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => Generator<Operation<any>, TReturn, unknown>,
): WatchController<El>;

export function watch<S extends string, El extends HTMLElement, TReturn = void>(
  context: PreDefinedWatchContext<S, El>,
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) => AsyncGenerator<any, TReturn, unknown>,
): WatchController<El>;

// Implementation
export function watch<El extends HTMLElement = HTMLElement, TReturn = void>(
  targetOrParent: WatchTarget<El> | El | PreDefinedWatchContext<string, El>,
  generatorOrChildSelector?:
    | ((
        ctx: EnhancedTypedGeneratorContext<El>,
      ) =>
        | Generator<Operation<any>, TReturn, unknown>
        | AsyncGenerator<Operation<any>, TReturn, unknown>)
    | string,
  childGenerator?: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) =>
    | Generator<Operation<any>, TReturn, unknown>
    | AsyncGenerator<Operation<any>, TReturn, unknown>,
): WatchController<El> {
  // Wrap the generator to provide enhanced context
  const wrapGenerator = <T extends HTMLElement, R = void>(
    originalGenerator: (
      ctx: EnhancedTypedGeneratorContext<T>,
    ) =>
      | Generator<Operation<any>, R, unknown>
      | AsyncGenerator<Operation<any>, R, unknown>,
  ): ((
    baseContext: TypedGeneratorContext<T>,
  ) =>
    | Generator<Operation<any>, R, unknown>
    | AsyncGenerator<Operation<any>, R, unknown>) => {
    return (baseContext: TypedGeneratorContext<T>) => {
      // Create enhanced context with attached DOM functions
      const enhancedContext = createEnhancedContext(baseContext);

      // Call the original generator with enhanced context
      return originalGenerator(enhancedContext);
    };
  };

  // Handle event delegation pattern (parent + child selector)
  if (typeof generatorOrChildSelector === "string" && childGenerator) {
    const parent = targetOrParent as El;
    const childSelector = generatorOrChildSelector;
    const wrappedGenerator = wrapGenerator<El, TReturn>(childGenerator);

    const controller = getOrCreateController({
      parent,
      selector: childSelector,
    } as any);
    controller.layer(wrappedGenerator);
    return controller as WatchController<El>;
  }

  // Handle pre-defined context
  if (isPreDefinedWatchContext(targetOrParent)) {
    const context = targetOrParent as PreDefinedWatchContext<string, El>;
    const generator = generatorOrChildSelector as (
      ctx: EnhancedTypedGeneratorContext<El>,
    ) =>
      | Generator<Operation<any>, TReturn, unknown>
      | AsyncGenerator<Operation<any>, TReturn, unknown>;

    // Apply context options (debounce, throttle, once)
    let wrappedGenerator = wrapGenerator<El, TReturn>(generator as any);

    if (context.options.debounce) {
      wrappedGenerator = debounceGenerator(
        wrappedGenerator as any,
        context.options.debounce as number,
      ) as any;
    }

    if (context.options.throttle) {
      wrappedGenerator = throttleGenerator(
        wrappedGenerator as any,
        context.options.throttle as number,
      ) as any;
    }

    if (context.options.once) {
      wrappedGenerator = onceGenerator(wrappedGenerator as any) as any;
    }

    const controller = getOrCreateController(context.selector);
    controller.layer(wrappedGenerator as any);
    return controller as WatchController<El>;
  }

  // Handle standard patterns
  const target = targetOrParent as WatchTarget<El>;
  const generator = generatorOrChildSelector as (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) =>
    | Generator<Operation<any>, TReturn, unknown>
    | AsyncGenerator<Operation<any>, TReturn, unknown>;
  const wrappedGenerator = wrapGenerator<El, TReturn>(generator);

  const controller = getOrCreateController(target);
  controller.layer(wrappedGenerator as any);
  return controller as WatchController<El>;
}

/**
 * Run a generator on a specific element with enhanced context
 *
 * @example Using runOn with attached DOM functions
 * ```typescript
 * import { runOn } from 'watch-selector';
 *
 * const button = document.querySelector('button');
 * await runOn(button, function* (ctx) {
 *   yield* ctx.text('Processing...');
 *   yield* ctx.addClass('loading');
 *   yield* ctx.attr('disabled', 'true');
 *
 *   // Do some async work
 *   await someAsyncOperation();
 *
 *   yield* ctx.text('Complete!');
 *   yield* ctx.removeClass('loading');
 *   yield* ctx.removeAttr('disabled');
 * });
 * ```
 */
export async function runOn<El extends HTMLElement, T = void>(
  element: El,
  generator: (
    ctx: EnhancedTypedGeneratorContext<El>,
  ) =>
    | Generator<Operation<any>, T, unknown>
    | AsyncGenerator<Operation<any>, T, unknown>,
): Promise<T | undefined> {
  // Wrap the generator to provide enhanced context
  const wrappedGenerator = (
    baseContext?: TypedGeneratorContext<El>,
  ):
    | Generator<Operation<any>, T, unknown>
    | AsyncGenerator<Operation<any>, T, unknown> => {
    const enhancedContext = createEnhancedContext(baseContext!);
    return generator(enhancedContext);
  };

  // Use the existing executeGenerator function
  const result = await executeGenerator(
    element,
    "",
    0,
    [element],
    wrappedGenerator,
  );

  // Store API if returned
  if (result !== undefined) {
    setContextApi(element, result);
  }

  return result;
}

/**
 * Scoped watch with enhanced context
 *
 * @example Watching child elements with attached DOM functions
 * ```typescript
 * import { scopedWatch } from 'watch-selector';
 *
 * const container = document.querySelector('.container');
 * scopedWatch(container, '.item', function* (ctx) {
 *   yield* ctx.addClass('observed');
 *
 *   yield* ctx.on('click', function* (event) {
 *     yield* ctx.toggleClass('selected');
 *     const isSelected = yield* ctx.hasClass('selected');
 *
 *     if (isSelected) {
 *       yield* ctx.style('backgroundColor', 'lightblue');
 *     } else {
 *       yield* ctx.style('backgroundColor', '');
 *     }
 *   });
 * });
 * ```
 */
export function scopedWatch<
  ParentEl extends HTMLElement,
  S extends string,
  TReturn = void,
>(
  parent: ParentEl,
  selector: S,
  generator: (
    ctx: EnhancedTypedGeneratorContext<ElementFromSelector<S>>,
  ) =>
    | Generator<Operation<any>, TReturn, unknown>
    | AsyncGenerator<Operation<any>, TReturn, unknown>,
): WatchController<ElementFromSelector<S>> {
  return watch(parent as any, selector, generator as any);
}

// Re-export the enhanced context type for external use
export type { EnhancedTypedGeneratorContext } from "./core/enhanced-context/context-with-dom";

// Export helper to manually create enhanced context if needed
export { createEnhancedContext } from "./core/enhanced-context/context-with-dom";

// Keep the old names as aliases for backward compatibility
export {
  watch as watchEnhanced,
  runOn as runOnEnhanced,
  scopedWatch as scopedWatchEnhanced,
};
