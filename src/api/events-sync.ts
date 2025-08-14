/**
 * Sync Generator Event System
 *
 * This module provides event handling functions that work with sync generators
 * and the yield* pattern for better type safety and consistency.
 */

import type {
  Workflow,
  WatchContext,
  Operation,
  CleanupFunction,
} from "../types";
import { isCSSSelector, type CSSSelector } from "../utils/selector-types";

// ============================================================================
// Branded Event Type Definitions
// ============================================================================

/**
 * Branded type for DOM event types to improve compile-time disambiguation
 */
export interface DOMEventType extends String {
  readonly __brand: "DOMEventType";
}

/**
 * Create a branded DOM event type for better overload disambiguation
 *
 * @param eventType - Standard DOM event type string
 * @returns Branded DOMEventType for compile-time disambiguation
 *
 * @example
 * ```typescript
 * import { eventType, on } from 'watch-selector';
 *
 * // Guaranteed to use generator pattern
 * yield* on(eventType('click'), handler);
 *
 * // vs ambiguous string that might match wrong overload
 * yield* on('click', handler); // Could be confused with selector
 * ```
 */
export function eventType(eventType: string): DOMEventType {
  return Object.assign(new String(eventType), {
    __brand: "DOMEventType" as const,
    toString: () => eventType,
    valueOf: () => eventType,
    [Symbol.toPrimitive]: () => eventType,
  }) as DOMEventType;
}

/**
 * Type guard to check if a value is a branded DOMEventType
 */
export function isDOMEventType(value: unknown): value is DOMEventType {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).__brand === "DOMEventType"
  );
}

// ============================================================================
// Type Definitions
// ============================================================================

type EventHandler<E extends Event = Event> = (
  event: E,
) => void | Generator<any, void, any>;
type SyncGenerator<T = void> = Generator<any, T, any>;

export interface EventOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  debounce?: number;
  throttle?: number;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

// Type definitions for functions with .gen properties
interface OnFunctionWithGen {
  <K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    event: K,
    handler: EventHandler<HTMLElementEventMap[K]>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    selector: string | CSSSelector,
    event: string,
    handler: EventHandler<any>,
    options?: EventOptions,
  ): CleanupFunction;
  <K extends keyof HTMLElementEventMap>(
    event: K,
    handler: EventHandler<HTMLElementEventMap[K]>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
  (...args: any[]): any;
  gen<K extends keyof HTMLElementEventMap>(
    event: K | DOMEventType,
    handler: EventHandler<HTMLElementEventMap[K]>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
}

interface ClickFunctionWithGen {
  (
    element: HTMLElement,
    handler: EventHandler<MouseEvent>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    selector: string | CSSSelector,
    handler: EventHandler<MouseEvent>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    handler: EventHandler<MouseEvent>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
  (...args: any[]): any;
  gen(
    handler: EventHandler<MouseEvent>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
}

interface InputFunctionWithGen {
  (
    element: HTMLElement,
    handler: EventHandler<InputEvent>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    selector: string | CSSSelector,
    handler: EventHandler<InputEvent>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    handler: EventHandler<InputEvent>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
  (...args: any[]): any;
  gen(
    handler: EventHandler<Event>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
}

interface ChangeFunctionWithGen {
  (
    element: HTMLElement,
    handler: EventHandler<Event>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    selector: string | CSSSelector,
    handler: EventHandler<Event>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    handler: EventHandler<Event>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
  (...args: any[]): any;
  gen(
    handler: EventHandler<Event>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
}

interface SubmitFunctionWithGen {
  (
    element: HTMLElement,
    handler: EventHandler<SubmitEvent>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    selector: string | CSSSelector,
    handler: EventHandler<SubmitEvent>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    handler: EventHandler<SubmitEvent>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
  (...args: any[]): any;
  gen(
    handler: EventHandler<SubmitEvent>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
}

interface FocusFunctionWithGen {
  (
    element: HTMLElement,
    handler: EventHandler<FocusEvent>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    selector: string | CSSSelector,
    handler: EventHandler<FocusEvent>,
    options?: EventOptions,
  ): CleanupFunction;
  (
    handler: EventHandler<FocusEvent>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
  (...args: any[]): any;
  gen(
    handler: EventHandler<FocusEvent>,
    options?: EventOptions,
  ): Workflow<CleanupFunction>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

function resolveElements(selector: string): HTMLElement[] {
  const elements: HTMLElement[] = [];
  document.querySelectorAll(selector).forEach((el) => {
    if (el instanceof HTMLElement) {
      elements.push(el);
    }
  });
  return elements;
}

function looksLikeSelector(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return isCSSSelector(value);
}

/**
 * Execute a sync generator in context
 */
function executeGeneratorInContext(
  gen: SyncGenerator,
  context: WatchContext,
): void {
  try {
    let result = gen.next();
    while (!result.done) {
      const value = result.value;

      // If the yielded value is a function (Operation), execute it with context
      if (typeof value === "function") {
        const opResult = value(context);
        result = gen.next(opResult);
      } else if (
        value &&
        typeof value === "object" &&
        Symbol.iterator in value
      ) {
        // If it's another generator, execute it recursively
        const innerGen = value as SyncGenerator;
        executeGeneratorInContext(innerGen, context);
        result = gen.next();
      } else {
        result = gen.next();
      }
    }
  } catch (error) {
    console.error("Error executing generator in event handler:", error);
  }
}

/**
 * Wrap an event handler to support sync generators
 */
function wrapEventHandler<E extends Event>(
  handler: EventHandler<E>,
  context?: WatchContext,
): (event: E) => void {
  return (event: E) => {
    const result = handler(event);

    // If handler returns a sync generator, execute it
    if (result && typeof result === "object" && Symbol.iterator in result) {
      const gen = result as SyncGenerator;

      if (context) {
        // We have a context from watch(), use it
        executeGeneratorInContext(gen, context);
      } else {
        // No context, create a minimal one with the event target
        const target = event.currentTarget || event.target;
        if (target instanceof HTMLElement) {
          const minimalContext: WatchContext = {
            element: target,
            selector: "",
            index: 0,
            array: [target],
            state: new Map(),
            observers: new Set(),
            el: ((selector: string) => target.querySelector(selector)) as any,
            self: (() => target) as any,
            cleanup: (() => {}) as any,
            addObserver: () => {},
          };
          executeGeneratorInContext(gen, minimalContext);
        }
      }
    }
  };
}

/**
 * Apply event options (debounce, throttle, etc.)
 */
function applyEventOptions<E extends Event>(
  handler: (event: E) => void,
  options?: EventOptions,
): (event: E) => void {
  if (!options) return handler;

  let wrappedHandler = handler;

  // Apply preventDefault/stopPropagation
  if (options.preventDefault || options.stopPropagation) {
    const original = wrappedHandler;
    wrappedHandler = (event: E) => {
      if (options.preventDefault) event.preventDefault();
      if (options.stopPropagation) event.stopPropagation();
      original(event);
    };
  }

  // Apply debounce
  if (options.debounce) {
    const original = wrappedHandler;
    let timeoutId: number | undefined;
    wrappedHandler = (event: E) => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        original(event);
        timeoutId = undefined;
      }, options.debounce) as unknown as number;
    };
  }

  // Apply throttle
  if (options.throttle) {
    const original = wrappedHandler;
    let lastCall = 0;
    let timeoutId: number | undefined;
    wrappedHandler = (event: E) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;

      if (timeSinceLastCall >= options.throttle!) {
        lastCall = now;
        original(event);
      } else if (timeoutId === undefined) {
        const delay = options.throttle! - timeSinceLastCall;
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          original(event);
          timeoutId = undefined;
        }, delay) as unknown as number;
      }
    };
  }

  return wrappedHandler;
}

// ============================================================================
// Core Event Functions
// ============================================================================

/**
 * Generic event listener with sync generator support
 */

/**
 * Attach an event listener with multiple API patterns and branded type support.
 *
 * Supports four distinct usage patterns with compile-time disambiguation:
 * 1. Direct element manipulation
 * 2. CSS selector manipulation
 * 3. Generator pattern (recommended for use with yield*)
 * 4. Branded types for enhanced type safety
 *
 * @param args - Variable arguments supporting multiple overloads
 * @returns CleanupFunction or Workflow<CleanupFunction> depending on usage
 *
 * @example Direct element manipulation
 * ```typescript
 * const button = document.querySelector('button');
 * const cleanup = on(button, 'click', (e) => console.log('clicked'));
 * ```
 *
 * @example CSS selector manipulation
 * ```typescript
 * const cleanup = on('.button', 'click', (e) => console.log('clicked'));
 * ```
 *
 * @example Generator pattern with yield*
 * ```typescript
 * watch('button', function* () {
 *   yield* on('click', function* (e) {
 *     yield* addClass('clicked');
 *   });
 * });
 * ```
 *
 * @example Branded types for disambiguation
 * ```typescript
 * import { eventType, css } from 'watch-selector';
 *
 * // Guaranteed to use generator pattern
 * yield* on(eventType('click'), handler);
 *
 * // Guaranteed to use CSS selector pattern
 * const cleanup = on(css('.button'), eventType('click'), handler);
 * ```
 */
export const on: OnFunctionWithGen = function (...args: any[]): any {
  const attachListener = (
    element: HTMLElement,
    eventType: string,
    handler: EventHandler<any>,
    options?: EventOptions,
    context?: WatchContext,
  ): CleanupFunction => {
    const wrappedHandler = applyEventOptions(
      wrapEventHandler(handler, context),
      options,
    );

    element.addEventListener(eventType, wrappedHandler, {
      capture: options?.capture,
      once: options?.once,
      passive: options?.passive,
    });

    return () => {
      element.removeEventListener(eventType, wrappedHandler);
    };
  };

  // Direct element manipulation
  if (args.length >= 3 && isHTMLElement(args[0])) {
    const [element, eventType, handler, options] = args;
    return attachListener(element, String(eventType), handler, options);
  }

  // Generator pattern with branded event type - highest priority for disambiguation
  if (args.length >= 2 && isDOMEventType(args[0])) {
    const [eventType, handler, options] = args;
    return (function* (): Generator<
      Operation<CleanupFunction>,
      CleanupFunction,
      any
    > {
      const cleanup = yield ((context: WatchContext) => {
        return attachListener(
          context.element,
          String(eventType),
          handler,
          options,
          context,
        );
      }) as Operation<CleanupFunction>;
      return cleanup;
    })();
  }

  // CSS selector manipulation with branded selector - second priority
  if (args.length >= 3 && (args[0] as any)?.__brand === "CSSSelector") {
    const [selector, eventType, handler, options] = args;
    const elements = resolveElements(String(selector));
    const cleanups = elements.map((el) =>
      attachListener(el, String(eventType), handler, options),
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  // Generator pattern - check this BEFORE CSS selector to avoid event type conflicts
  if (args.length >= 2 && typeof args[0] === "string" && args.length <= 3) {
    const [eventType, handler, options] = args;
    return (function* (): Generator<
      Operation<CleanupFunction>,
      CleanupFunction,
      any
    > {
      const cleanup = yield ((context: WatchContext) => {
        return attachListener(
          context.element,
          eventType,
          handler,
          options,
          context,
        );
      }) as Operation<CleanupFunction>;
      return cleanup;
    })();
  }

  // CSS selector manipulation (fallback)
  if (args.length >= 3 && looksLikeSelector(args[0])) {
    const [selector, eventType, handler, options] = args;
    const elements = resolveElements(String(selector));
    const cleanups = elements.map((el) =>
      attachListener(el, String(eventType), handler, options),
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  throw new Error(
    `Invalid arguments for on(): ${args.length} arguments provided. ` +
      `Supported patterns: on(element, event, handler), on(selector, event, handler), ` +
      `on(event, handler) for generators, or use branded types for disambiguation.`,
  );
} as OnFunctionWithGen;

/**
 * Generator version of on for explicit yield* usage.
 *
 * This explicit generator version always returns a Workflow and provides
 * guaranteed generator behavior for event handling.
 *
 * @param event - Event type or branded DOMEventType
 * @param handler - Event handler function (can be generator)
 * @param options - Event listener options
 * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
 *
 * @example Explicit generator event handling
 * ```typescript
 * watch('button', function* () {
 *   yield* on.gen('click', function* (event) {
 *     yield* addClass('clicked');
 *     console.log('Button clicked!');
 *   });
 * });
 * ```
 *
 * @example With branded event type for disambiguation
 * ```typescript
 * import { eventType } from 'watch-selector';
 *
 * watch('input', function* () {
 *   yield* on.gen(eventType('input'), function* (event) {
 *     const value = event.target.value;
 *     yield* setState('inputValue', value);
 *   });
 * });
 * ```
 */
on.gen = function <K extends keyof HTMLElementEventMap>(
  event: K | DOMEventType,
  handler: EventHandler<HTMLElementEventMap[K]>,
  options?: EventOptions,
): Workflow<CleanupFunction> {
  return (function* (): Generator<
    Operation<CleanupFunction>,
    CleanupFunction,
    any
  > {
    const cleanup = yield ((context: WatchContext) => {
      const attachListener = (
        element: HTMLElement,
        eventType: string,
        handler: EventHandler<any>,
        options?: EventOptions,
        context?: WatchContext,
      ): CleanupFunction => {
        const wrappedHandler = applyEventOptions(
          wrapEventHandler(handler, context),
          options,
        );

        element.addEventListener(eventType, wrappedHandler, {
          capture: options?.capture,
          once: options?.once,
          passive: options?.passive,
        });

        return () => {
          element.removeEventListener(eventType, wrappedHandler);
        };
      };

      return attachListener(
        context.element,
        String(event),
        handler,
        options,
        context,
      );
    }) as Operation<CleanupFunction>;
    return cleanup;
  })();
};

// ============================================================================
// Specialized Event Functions
// ============================================================================

export const click: ClickFunctionWithGen = function click(...args: any[]): any {
  // Direct element
  if (isHTMLElement(args[0])) {
    const [element, handler, options] = args;
    return on(element, "click", handler, options);
  }

  // CSS selector
  if (typeof args[0] === "string" && args.length >= 2) {
    const [selector, handler, options] = args;
    return on(selector, "click", handler, options);
  }

  // Generator pattern
  const [handler, options] = args;
  return on("click", handler, options);
} as ClickFunctionWithGen;

/**
 * Generator version of click for use with yield*.
 */
/**
 * Generator version of click for explicit yield* usage.
 *
 * This is the explicit generator version that always returns a Workflow.
 * The main click() function automatically detects generator context,
 * but this .gen version is provided for explicit control and clarity.
 *
 * @param handler - Click event handler function (can be generator)
 * @param options - Event listener options
 * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
 *
 * @example Explicit generator usage
 * ```typescript
 * watch('button', function* () {
 *   // Explicit .gen version - always returns Workflow
 *   yield* click.gen(function* (event) {
 *     yield* addClass('clicked');
 *     yield* text('Clicked!');
 *   });
 * });
 * ```
 *
 * @example With event options
 * ```typescript
 * watch('button', function* () {
 *   yield* click.gen((e) => console.log('clicked'), {
 *     once: true,
 *     throttle: 300
 *   });
 * });
 * ```
 *
 * @example Generator handler with async operations
 * ```typescript
 * watch('.async-button', function* () {
 *   yield* click.gen(function* (event) {
 *     yield* addClass('loading');
 *     // Async operation would go here
 *     yield* removeClass('loading');
 *     yield* addClass('completed');
 *   });
 * });
 * ```
 */
click.gen = function (
  handler: EventHandler<MouseEvent>,
  options?: EventOptions,
): Workflow<CleanupFunction> {
  return on(eventType("click"), handler, options);
};

export const input: InputFunctionWithGen = function input(...args: any[]): any {
  // Direct element
  if (isHTMLElement(args[0])) {
    const [element, handler, options] = args;
    return on(element, "input", handler, options);
  }

  // CSS selector
  if (typeof args[0] === "string" && args.length >= 2) {
    const [selector, handler, options] = args;
    return on(selector, "input", handler, options);
  }

  // Generator pattern
  const [handler, options] = args;
  return on("input", handler, options);
} as InputFunctionWithGen;

export const change: ChangeFunctionWithGen = function change(
  ...args: any[]
): any {
  // Direct element
  if (isHTMLElement(args[0])) {
    const [element, handler, options] = args;
    return on(element, "change", handler, options);
  }

  // CSS selector
  if (typeof args[0] === "string" && args.length >= 2) {
    const [selector, handler, options] = args;
    return on(selector, "change", handler, options);
  }

  // Generator pattern
  const [handler, options] = args;
  return on("change", handler, options);
} as ChangeFunctionWithGen;

export const submit: SubmitFunctionWithGen = function submit(
  ...args: any[]
): any {
  // Direct element
  if (isHTMLElement(args[0])) {
    const [element, handler, options] = args;
    return on(element, "submit", handler, options);
  }

  // CSS selector
  if (typeof args[0] === "string" && args.length >= 2) {
    const [selector, handler, options] = args;
    return on(selector, "submit", handler, options);
  }

  // Generator pattern
  const [handler, options] = args;
  return on("submit", handler, options);
} as SubmitFunctionWithGen;

/**
 * Generator version of submit for explicit yield* usage.
 *
 * This explicit generator version always returns a Workflow and is perfect
 * for form submission handling with validation and async processing.
 *
 * @param handler - Submit event handler function (can be generator)
 * @param options - Event listener options
 * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
 *
 * @example Form submission with validation
 * ```typescript
 * watch('form.contact-form', function* () {
 *   yield* submit.gen(function* (event) {
 *     event.preventDefault();
 *
 *     // Show loading state
 *     yield* addClass('submitting');
 *     yield* attr('button[type="submit"]', 'disabled', 'true');
 *
 *     // Validate form
 *     const isValid = yield* validateForm();
 *
 *     if (isValid) {
 *       // Submit form data
 *       const success = yield* submitFormData();
 *
 *       if (success) {
 *         yield* addClass('success');
 *         yield* text('.message', 'Form submitted successfully!');
 *       } else {
 *         yield* addClass('error');
 *         yield* text('.message', 'Submission failed. Please try again.');
 *       }
 *     } else {
 *       yield* addClass('error');
 *       yield* text('.message', 'Please fix validation errors.');
 *     }
 *
 *     // Reset loading state
 *     yield* removeClass('submitting');
 *     yield* removeAttr('button[type="submit"]', 'disabled');
 *   });
 * });
 * ```
 *
 * @example Multi-step form handling
 * ```typescript
 * watch('.wizard-form', function* () {
 *   yield* submit.gen(function* (event) {
 *     event.preventDefault();
 *
 *     const currentStep = yield* getState<number>('currentStep', 1);
 *     const totalSteps = yield* getState<number>('totalSteps', 3);
 *
 *     if (currentStep < totalSteps) {
 *       // Move to next step
 *       yield* setState('currentStep', currentStep + 1);
 *       yield* addClass(`.step-${currentStep}`, 'completed');
 *       yield* removeClass(`.step-${currentStep + 1}`, 'hidden');
 *     } else {
 *       // Final submission
 *       yield* submitWizardData();
 *     }
 *   });
 * });
 * ```
 */
submit.gen = function (
  handler: EventHandler<SubmitEvent>,
  options?: EventOptions,
): Workflow<CleanupFunction> {
  return on(eventType("submit"), handler, options);
};

/**
 * Generator version of change for explicit yield* usage.
 *
 * This explicit generator version always returns a Workflow and is ideal
 * for form input handling with validation and state management.
 *
 * @param handler - Change event handler function (can be generator)
 * @param options - Event listener options
 * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
 *
 * @example Form validation with state management
 * ```typescript
 * watch('select[name="category"]', function* () {
 *   yield* change.gen(function* (event) {
 *     const category = event.target.value;
 *     yield* setState('selectedCategory', category);
 *
 *     // Update dependent fields
 *     yield* toggleClass('.subcategory-section', 'visible', !!category);
 *
 *     // Clear previous selections
 *     if (category) {
 *       yield* text('.subcategory select', '');
 *     }
 *   });
 * });
 * ```
 *
 * @example Checkbox group handling
 * ```typescript
 * watch('input[type="checkbox"]', function* () {
 *   yield* change.gen(function* (event) {
 *     const checked = event.target.checked;
 *     const value = event.target.value;
 *
 *     let selected = yield* getState<string[]>('selected', []);
 *
 *     if (checked) {
 *       selected = [...selected, value];
 *     } else {
 *       selected = selected.filter(v => v !== value);
 *     }
 *
 *     yield* setState('selected', selected);
 *     yield* text('.selection-count', `${selected.length} selected`);
 *   });
 * });
 * ```
 */
change.gen = function (
  handler: EventHandler<Event>,
  options?: EventOptions,
): Workflow<CleanupFunction> {
  return on(eventType("change"), handler, options);
};

/**
 * Generator version of input for use with yield*.
 */
/**
 * Generator version of input for explicit yield* usage.
 *
 * This explicit generator version always returns a Workflow and is ideal
 * for complex input handling with debouncing and generator-based logic.
 *
 * @param handler - Input event handler function (can be generator)
 * @param options - Event listener options (supports debounce)
 * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
 *
 * @example Debounced input with state management
 * ```typescript
 * watch('.search-box', function* () {
 *   yield* input.gen(function* (event) {
 *     const query = event.target.value;
 *     yield* setState('searchQuery', query);
 *
 *     if (query.length >= 3) {
 *       yield* addClass('searching');
 *       // Search logic here
 *       yield* removeClass('searching');
 *     }
 *   }, { debounce: 300 });
 * });
 * ```
 *
 * @example Real-time character counter
 * ```typescript
 * watch('textarea', function* () {
 *   yield* input.gen(function* (event) {
 *     const length = event.target.value.length;
 *     const maxLength = parseInt(event.target.getAttribute('maxlength') || '100');
 *     const remaining = maxLength - length;
 *
 *     yield* text('.char-counter', `${remaining} characters remaining`);
 *     yield* toggleClass('.char-counter', 'warning', remaining < 20);
 *   });
 * });
 * ```
 */
input.gen = function (
  handler: EventHandler<Event>,
  options?: EventOptions,
): Workflow<CleanupFunction> {
  return on(eventType("input"), handler, options);
};

// ============================================================================
// Focus Event Handler
// ============================================================================

export const onFocus: FocusFunctionWithGen = function onFocus(
  ...args: any[]
): any {
  // Direct element
  if (isHTMLElement(args[0])) {
    const [element, handler, options] = args;
    return on(element, "focus", handler, options);
  }

  // CSS selector
  if (typeof args[0] === "string" && args.length >= 2) {
    const [selector, handler, options] = args;
    return on(selector, "focus", handler, options);
  }

  // Generator context
  const [handler, options] = args;
  return on("focus", handler, options);
};

/**
 * Generator version of onFocus for explicit yield* usage.
 *
 * This explicit generator version always returns a Workflow and is ideal
 * for focus-related UI enhancements and accessibility features.
 *
 * @param handler - Focus event handler function (can be generator)
 * @param options - Event listener options
 * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
 *
 * @example Input field enhancements on focus
 * ```typescript
 * watch('input[type="text"]', function* () {
 *   yield* onFocus.gen(function* (event) {
 *     // Visual feedback
 *     yield* addClass('focused');
 *     yield* addClass(parent(), 'field-focused');
 *
 *     // Show help text
 *     const helpId = yield* attr('aria-describedby');
 *     if (helpId) {
 *       yield* addClass(`#${helpId}`, 'visible');
 *     }
 *
 *     // Clear previous errors
 *     yield* removeClass('error');
 *     yield* text('.error-message', '');
 *   });
 * });
 * ```
 *
 * @example Form field highlighting with state
 * ```typescript
 * watch('.form-field input', function* () {
 *   yield* onFocus.gen(function* (event) {
 *     const fieldName = yield* attr('name');
 *     yield* setState('activeField', fieldName);
 *
 *     // Highlight current section
 *     yield* removeClass('.form-section', 'active');
 *     yield* addClass(closest('.form-section'), 'active');
 *
 *     // Update progress indicator
 *     yield* text('.current-field', fieldName);
 *   });
 * });
 * ```
 */
onFocus.gen = function (
  handler: EventHandler<FocusEvent>,
  options?: EventOptions,
): Workflow<CleanupFunction> {
  return on(eventType("focus"), handler, options);
};

// ============================================================================
// Blur Event Handler
// ============================================================================

export const onBlur: FocusFunctionWithGen = function onBlur(
  ...args: any[]
): any {
  // Direct element
  if (isHTMLElement(args[0])) {
    const [element, handler, options] = args;
    return on(element, "blur", handler, options);
  }

  // CSS selector
  if (typeof args[0] === "string" && args.length >= 2) {
    const [selector, handler, options] = args;
    return on(selector, "blur", handler, options);
  }

  // Generator context
  const [handler, options] = args;
  return on("blur", handler, options);
};

/**
 * Generator version of onBlur for explicit yield* usage.
 *
 * This explicit generator version always returns a Workflow and is perfect
 * for form validation, saving state, and cleanup when elements lose focus.
 *
 * @param handler - Blur event handler function (can be generator)
 * @param options - Event listener options
 * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
 *
 * @example Input validation on blur
 * ```typescript
 * watch('input[required]', function* () {
 *   yield* onBlur.gen(function* (event) {
 *     const value = event.target.value.trim();
 *     const fieldName = yield* attr('name');
 *
 *     // Remove focus styling
 *     yield* removeClass('focused');
 *     yield* removeClass(parent(), 'field-focused');
 *
 *     // Validate field
 *     if (!value) {
 *       yield* addClass('error');
 *       yield* text('.error-message', `${fieldName} is required`);
 *     } else {
 *       yield* removeClass('error');
 *       yield* addClass('valid');
 *       yield* text('.error-message', '');
 *     }
 *
 *     // Save to state
 *     yield* setState(fieldName, value);
 *   });
 * });
 * ```
 *
 * @example Auto-save functionality
 * ```typescript
 * watch('textarea.auto-save', function* () {
 *   yield* onBlur.gen(function* (event) {
 *     const content = event.target.value;
 *     const documentId = yield* attr('data-document-id');
 *
 *     if (content !== yield* getState('lastSaved', '')) {
 *       // Show saving indicator
 *       yield* addClass('saving');
 *       yield* text('.save-status', 'Saving...');
 *
 *       // Auto-save logic would go here
 *       await saveDocument(documentId, content);
 *
 *       // Update state and UI
 *       yield* setState('lastSaved', content);
 *       yield* removeClass('saving');
 *       yield* addClass('saved');
 *       yield* text('.save-status', 'Saved');
 *
 *       // Clear saved indicator after delay
 *       setTimeout(() => {
 *         removeClass('.save-status', 'saved');
 *         text('.save-status', '');
 *       }, 2000);
 *     }
 *   });
 * });
 * ```
 */
onBlur.gen = function (
  handler: EventHandler<FocusEvent>,
  options?: EventOptions,
): Workflow<CleanupFunction> {
  return on(eventType("blur"), handler, options);
};

export function keydown(
  element: HTMLElement,
  handler: EventHandler<KeyboardEvent>,
  options?: EventOptions,
): CleanupFunction;
export function keydown(
  selector: string | CSSSelector,
  handler: EventHandler<KeyboardEvent>,
  options?: EventOptions,
): CleanupFunction;
export function keydown(
  handler: EventHandler<KeyboardEvent>,
  options?: EventOptions,
): Workflow<CleanupFunction>;

export function keydown(...args: any[]): any {
  // Direct element
  if (isHTMLElement(args[0])) {
    const [element, handler, options] = args;
    return on(element, "keydown", handler, options);
  }

  // CSS selector
  if (typeof args[0] === "string" && args.length >= 2) {
    const [selector, handler, options] = args;
    return on(selector, "keydown", handler, options);
  }

  // Generator pattern
  const [handler, options] = args;
  return on("keydown", handler, options);
}

export function keyup(
  element: HTMLElement,
  handler: EventHandler<KeyboardEvent>,
  options?: EventOptions,
): CleanupFunction;
export function keyup(
  selector: string | CSSSelector,
  handler: EventHandler<KeyboardEvent>,
  options?: EventOptions,
): CleanupFunction;
export function keyup(
  handler: EventHandler<KeyboardEvent>,
  options?: EventOptions,
): Workflow<CleanupFunction>;

export function keyup(...args: any[]): any {
  // Direct element
  if (isHTMLElement(args[0])) {
    const [element, handler, options] = args;
    return on(element, "keyup", handler, options);
  }

  // CSS selector
  if (typeof args[0] === "string" && args.length >= 2) {
    const [selector, handler, options] = args;
    return on(selector, "keyup", handler, options);
  }

  // Generator pattern
  const [handler, options] = args;
  return on("keyup", handler, options);
}

// ============================================================================
// Lifecycle Events
// ============================================================================

export function onMount(handler: EventHandler<Event>): Workflow<void> {
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      // Execute handler immediately on mount
      const wrappedHandler = wrapEventHandler(handler, context);
      const event = new CustomEvent("mount", {
        detail: { element: context.element },
      });
      wrappedHandler(event);
    }) as Operation<void>;
  })();
}

export function onUnmount(
  handler: EventHandler<Event>,
): Workflow<CleanupFunction> {
  return (function* (): Generator<
    Operation<CleanupFunction>,
    CleanupFunction,
    any
  > {
    const cleanup = yield ((context: WatchContext) => {
      // Register cleanup handler
      return () => {
        const wrappedHandler = wrapEventHandler(handler, context);
        const event = new CustomEvent("unmount", {
          detail: { element: context.element },
        });
        wrappedHandler(event);
      };
    }) as Operation<CleanupFunction>;
    return cleanup;
  })();
}

// ============================================================================
// Observer Events
// ============================================================================

export function onVisible(
  handler: EventHandler<CustomEvent>,
  options?: { threshold?: number },
): Workflow<CleanupFunction> {
  return (function* (): Generator<
    Operation<CleanupFunction>,
    CleanupFunction,
    any
  > {
    const cleanup = yield ((context: WatchContext) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const wrappedHandler = wrapEventHandler(handler, context);
              const event = new CustomEvent("visible", {
                detail: {
                  element: entry.target,
                  intersectionRatio: entry.intersectionRatio,
                },
              });
              wrappedHandler(event);
            }
          });
        },
        { threshold: options?.threshold || 0 },
      );

      observer.observe(context.element);

      return () => {
        observer.disconnect();
      };
    }) as Operation<CleanupFunction>;
    return cleanup;
  })();
}

export function onResize(
  handler: EventHandler<CustomEvent>,
  options?: { debounce?: number },
): Workflow<CleanupFunction> {
  return (function* (): Generator<
    Operation<CleanupFunction>,
    CleanupFunction,
    any
  > {
    const cleanup = yield ((context: WatchContext) => {
      const resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const wrappedHandler = wrapEventHandler(handler, context);
          const event = new CustomEvent("resize", {
            detail: {
              element: entry.target,
              contentRect: entry.contentRect,
              borderBoxSize: entry.borderBoxSize,
              contentBoxSize: entry.contentBoxSize,
            },
          });

          if (options?.debounce) {
            // Apply debounce if specified
            setTimeout(() => wrappedHandler(event), options.debounce);
          } else {
            wrappedHandler(event);
          }
        });
      });

      resizeObserver.observe(context.element);

      return () => {
        resizeObserver.disconnect();
      };
    }) as Operation<CleanupFunction>;
    return cleanup;
  })();
}

// ============================================================================
// Custom Events
// ============================================================================

export function emit<T = any>(
  element: HTMLElement,
  eventType: string,
  detail?: T,
  options?: EventInit,
): void;
export function emit<T = any>(
  selector: string | CSSSelector,
  eventType: string,
  detail?: T,
  options?: EventInit,
): void;
export function emit<T = any>(
  eventType: string,
  detail?: T,
  options?: EventInit,
): Workflow<void>;

export function emit(...args: any[]): any {
  const dispatchEvent = (
    element: HTMLElement,
    eventType: string,
    detail?: any,
    options?: EventInit,
  ) => {
    const event = new CustomEvent(eventType, {
      ...options,
      detail,
      bubbles: options?.bubbles !== false, // Default to true
      cancelable: options?.cancelable !== false, // Default to true
    });
    element.dispatchEvent(event);
  };

  // Direct element
  if (isHTMLElement(args[0])) {
    const [element, eventType, detail, options] = args;
    dispatchEvent(element, eventType, detail, options);
    return;
  }

  // CSS selector
  if (
    typeof args[0] === "string" &&
    args.length >= 2 &&
    looksLikeSelector(args[0])
  ) {
    const [selector, eventType, detail, options] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      dispatchEvent(el, eventType, detail, options);
    });
    return;
  }

  // Generator pattern
  const [eventType, detail, options] = args;
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      dispatchEvent(context.element, eventType, detail, options);
    }) as Operation<void>;
  })();
}

// ============================================================================
// Exports
// ============================================================================

export default {
  // Core event function
  on,

  // Common events
  click,
  input,
  change,
  submit,
  keydown,
  keyup,

  // Lifecycle events
  onMount,
  onUnmount,

  // Observer events
  onVisible,
  onResize,

  // Custom events
  emit,
};
