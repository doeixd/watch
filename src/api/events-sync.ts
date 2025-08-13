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
import { getCurrentContext } from "../core/context";
import { isCSSSelector, type CSSSelector } from "../utils/selector-types";

// ============================================================================
// Type Definitions
// ============================================================================

type EventHandler<E extends Event = Event> = (
  event: E,
) => void | Generator<any, void, any>;
type SyncGenerator<T = void> = Generator<any, T, any>;

interface EventOptions {
  capture?: boolean;
  once?: boolean;
  passive?: boolean;
  debounce?: number;
  throttle?: number;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

function isElement(value: unknown): value is Element {
  return value instanceof Element;
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
            state: new Map(),
            signal: new AbortController().signal,
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
export function on<E extends Event = Event>(
  element: HTMLElement,
  eventType: string,
  handler: EventHandler<E>,
  options?: EventOptions,
): CleanupFunction;
export function on<E extends Event = Event>(
  selector: string | CSSSelector,
  eventType: string,
  handler: EventHandler<E>,
  options?: EventOptions,
): CleanupFunction;
export function on<E extends Event = Event>(
  eventType: string,
  handler: EventHandler<E>,
  options?: EventOptions,
): Workflow<CleanupFunction>;

export function on(...args: any[]): any {
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
    return attachListener(element, eventType, handler, options);
  }

  // CSS selector manipulation
  if (args.length >= 3 && looksLikeSelector(args[0])) {
    const [selector, eventType, handler, options] = args;
    const elements = resolveElements(String(selector));
    const cleanups = elements.map((el) =>
      attachListener(el, eventType, handler, options),
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }

  // Generator pattern
  if (args.length >= 2 && typeof args[0] === "string") {
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

  throw new Error(
    `Invalid arguments for on(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Specialized Event Functions
// ============================================================================

export function click(
  element: HTMLElement,
  handler: EventHandler<MouseEvent>,
  options?: EventOptions,
): CleanupFunction;
export function click(
  selector: string | CSSSelector,
  handler: EventHandler<MouseEvent>,
  options?: EventOptions,
): CleanupFunction;
export function click(
  handler: EventHandler<MouseEvent>,
  options?: EventOptions,
): Workflow<CleanupFunction>;

export function click(...args: any[]): any {
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
}

export function input(
  element: HTMLElement,
  handler: EventHandler<InputEvent>,
  options?: EventOptions,
): CleanupFunction;
export function input(
  selector: string | CSSSelector,
  handler: EventHandler<InputEvent>,
  options?: EventOptions,
): CleanupFunction;
export function input(
  handler: EventHandler<InputEvent>,
  options?: EventOptions,
): Workflow<CleanupFunction>;

export function input(...args: any[]): any {
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
}

export function change(
  element: HTMLElement,
  handler: EventHandler<Event>,
  options?: EventOptions,
): CleanupFunction;
export function change(
  selector: string | CSSSelector,
  handler: EventHandler<Event>,
  options?: EventOptions,
): CleanupFunction;
export function change(
  handler: EventHandler<Event>,
  options?: EventOptions,
): Workflow<CleanupFunction>;

export function change(...args: any[]): any {
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
}

export function submit(
  element: HTMLElement,
  handler: EventHandler<SubmitEvent>,
  options?: EventOptions,
): CleanupFunction;
export function submit(
  selector: string | CSSSelector,
  handler: EventHandler<SubmitEvent>,
  options?: EventOptions,
): CleanupFunction;
export function submit(
  handler: EventHandler<SubmitEvent>,
  options?: EventOptions,
): Workflow<CleanupFunction>;

export function submit(...args: any[]): any {
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
}

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
