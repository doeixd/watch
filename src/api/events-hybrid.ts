/**
 * @module watch-selector/events
 *
 * # The Unified Event System
 *
 * This module provides a powerful, unified API for handling DOM and lifecycle
 * events. It seamlessly supports both standalone usage (on a specific DOM
 * element) and usage within a `watch()` generator context.
 *
 * ## Key Features
 *
 * - **Full Type Safety:** Event objects and their `detail` payloads are
 *   correctly and automatically typed.
 * - **Generator-Powered Handlers:** Event handlers can be generators, allowing
 *   you to `yield` other library functions for complex, asynchronous flows.
 * - **Robust Feature Set:** Includes event delegation, debouncing, throttling,
 *   event filtering, and async generator queuing.
 * - **Automatic Cleanup:** All listeners are automatically cleaned up when their
 *   associated element is removed from the DOM.
 * - **Standalone & Generator Compatibility:** The same functions work identically
 *   everywhere, with or without a `watch()` context.
 */

import type {
  ElementFn,
  CleanupFunction,
  HybridEventOptions,
  HybridEventHandler,
  HybridCustomEventHandler,
  AttributeChange,
  TextChange,
  VisibilityChange,
  ResizeChange,
} from '../types';
import { executeGenerator, getCurrentContext, createCleanupFunction, pushContext, popContext, executeCleanup } from '../core/context';

// ==================== MAIN 'on' FUNCTION ====================

// --- Overloads for strong type inference and API documentation ---

// 1. Standard DOM events (e.g., 'click', 'input')
export function on<El extends Element, K extends keyof HTMLElementEventMap>(element: El, event: K, handler: HybridEventHandler<El, K>, options?: HybridEventOptions): CleanupFunction;
export function on<El extends Element, K extends keyof HTMLElementEventMap>(event: K, handler: HybridEventHandler<El, K>, options?: HybridEventOptions): ElementFn<El, CleanupFunction>;

// 2. CustomEvents with a specific detail type T
export function on<El extends Element, T>(element: El, event: CustomEvent<T>, handler: HybridCustomEventHandler<El, T>, options?: HybridEventOptions): CleanupFunction;
export function on<El extends Element, T>(event: CustomEvent<T>, handler: HybridCustomEventHandler<El, T>, options?: HybridEventOptions): ElementFn<El, CleanupFunction>;

// 3. Custom event strings, requiring a generic for the detail type T
export function on<T = any, El extends Element = HTMLElement>(element: El, eventType: string, handler: HybridCustomEventHandler<El, T>, options?: HybridEventOptions): CleanupFunction;
export function on<T = any, El extends Element = HTMLElement>(eventType: string, handler: HybridCustomEventHandler<El, T>, options?: HybridEventOptions): ElementFn<El, CleanupFunction>;

/**
 * # on() - The Unified Event Listener
 *
 * Attaches a powerful, context-aware event listener to an element. It supports
 * standard DOM events, CustomEvents, and a rich set of features like delegation,
 * debouncing, throttling, and generator-based handlers.
 *
 * This function is the foundation of all event handling in the library.
 *
 * @example
 * // Standard click handler (type of `event` is MouseEvent)
 * yield on('click', (event) => console.log(event.clientX));
 *
 * @example
 * // Custom event with typed detail
 * const userEvent = createCustomEvent('user:login', { id: 1, name: 'John' });
 * yield on(userEvent, (event) => console.log(event.detail.name)); // event.detail is {id, name}
 *
 * @example
 * // Generator handler for complex interactions
 * yield on('click', function* (event) {
 *   yield addClass('loading');
 *   const data = yield* fetch('/api/data');
 *   yield updateUI(data);
 *   yield removeClass('loading');
 * });
 *
 * @example
 * // Standalone usage with delegation
 * const container = document.getElementById('container');
 * const cleanup = on(container, 'click', (event, delegatedEl) => {
 *   console.log('Clicked on:', delegatedEl.textContent);
 * }, { delegate: '.item' });
 */
export function on<El extends Element, K extends keyof HTMLElementEventMap, T>(...args: any[]): any {
  // 1. UNIFIED ARGUMENT PARSING
  const isDirectUsage = args[0] instanceof Element;
  const element = isDirectUsage ? args[0] as El : null;
  const eventOrType = (isDirectUsage ? args[1] : args[0]) as K | string | CustomEvent<T>;
  const handler = (isDirectUsage ? args[2] : args[1]) as HybridEventHandler<El, K> | HybridCustomEventHandler<El, T>;
  const options = (isDirectUsage ? args[3] : args[2]) as HybridEventOptions || {};

  // 2. CREATE THE UNIFIED ELEMENT FUNCTION
  const elementFn: ElementFn<El, CleanupFunction> = (el: El) => {
    const eventType = getEventType(eventOrType);
    const inGeneratorContext = !!getCurrentContext();
    const enhancedHandler = createEnhancedHandler(el as unknown as HTMLElement, handler, inGeneratorContext, options);
    const finalHandler = applyTimingModifiers(enhancedHandler, options);
    const cleanup = setupEventListener(el, eventType, finalHandler, options);

    if (inGeneratorContext) {
      createCleanupFunction(el as unknown as HTMLElement)(cleanup);
    }
    return cleanup;
  };

  // 3. EXECUTE OR RETURN
  return isDirectUsage && element ? elementFn(element) : elementFn;
}

// ==================== INTERNAL HELPERS (Unified & Improved) ====================

function createEnhancedHandler<El extends HTMLElement, K extends keyof HTMLElementEventMap, T>(
  element: El,
  handler: HybridEventHandler<El, K> | HybridCustomEventHandler<El, T>,
  inGeneratorContext: boolean,
  options: HybridEventOptions
): (event: Event) => Promise<void> {
  return async (event: Event) => {
    try {
      let targetElement: El = element;
      if (options.delegate) {
        const delegateTarget = (event.target as Element)?.closest?.(options.delegate);
        if (!delegateTarget || !element.contains(delegateTarget)) return;
        targetElement = delegateTarget as El;
      }

      if (options.filter && !options.filter(event, targetElement as unknown as HTMLElement)) return;

      let result: any;
      const context = getCurrentContext() || { element: targetElement, selector: 'event', index: 0, array: [targetElement] };
      
      pushContext(context);
      try {
        result = (handler as Function)(event, targetElement);
      } finally {
        // Only pop the context if we are in standalone mode (i.e., we pushed a temporary one).
        if (!inGeneratorContext) popContext();
      }
      
      if (result && typeof result.next === 'function') {
        const queueMode = options.queue || 'all';
        if (queueMode === 'none') {
          executeGenerator(targetElement as unknown as HTMLElement, 'event', 0, [targetElement as unknown as HTMLElement], () => result).catch(e => console.error("Error in concurrent generator", e));
        } else {
          await handleQueuedExecution(targetElement, queueMode, () => executeGenerator(targetElement as unknown as HTMLElement, 'event', 0, [targetElement as unknown as HTMLElement], () => result));
        }
      } else if (result && typeof result.then === 'function') {
        await result;
      }
    } catch (error) {
      console.error('Error in event handler:', error);
    }
  };
}

const elementQueues = new WeakMap<Element, Promise<any>>();
async function handleQueuedExecution<El extends Element>(
  element: El,
  queueMode: 'latest' | 'all',
  executor: () => Promise<any>
): Promise<void> {
  let executionPromise: Promise<any>;
  const lastPromise = elementQueues.get(element) || Promise.resolve();

  if (queueMode === 'all') {
    executionPromise = lastPromise.then(executor, executor);
  } else { // 'latest'
    executionPromise = executor();
  }
  
  elementQueues.set(element, executionPromise);
  
  try {
    await executionPromise;
  } finally {
    if (elementQueues.get(element) === executionPromise) {
      elementQueues.delete(element);
    }
  }
}

function applyTimingModifiers(handler: (event: Event) => Promise<void>, options: HybridEventOptions): (event: Event) => void {
  if (options.debounce) return debounce(handler, options.debounce);
  if (options.throttle) return throttle(handler, options.throttle);
  return (event: Event) => { handler(event).catch(e => console.error("Async event handler error:", e)); };
}

function setupEventListener(element: Element, eventType: string, handler: (event: Event) => void, options: HybridEventOptions): CleanupFunction {
  const listenerOptions: AddEventListenerOptions = {
    capture: options.delegate ? (options.delegatePhase === 'capture') : options.capture,
    once: options.once,
    passive: options.passive,
    signal: options.signal
  };
  element.addEventListener(eventType, handler, listenerOptions);
  return () => {
    if (options.signal?.aborted) return;
    element.removeEventListener(eventType, handler, listenerOptions);
  };
}

function getEventType<T>(eventOrType: string | CustomEvent<T>): string {
  if (typeof eventOrType === 'string') return eventOrType;
  if (eventOrType instanceof CustomEvent) return eventOrType.type;
  throw new Error('Invalid event type provided.');
}

function debounce(func: (event: Event) => Promise<void>, options: number | { wait: number; leading?: boolean; trailing?: boolean }) {
  const config = typeof options === 'number' ? { wait: options, trailing: true, leading: false } : { trailing: true, leading: false, ...options };
  let timeoutId: any;
  let lastArgs: [Event] | null = null;
  let isLeading = true;

  return (event: Event) => {
    lastArgs = [event];
    clearTimeout(timeoutId);

    if (config.leading && isLeading) {
      isLeading = false;
      func(...lastArgs).catch(e => console.error("Error in debounced handler:", e));
    }

    timeoutId = setTimeout(() => {
      if (config.trailing && lastArgs && !config.leading) {
        func(...lastArgs).catch(e => console.error("Error in debounced handler:", e));
      }
      isLeading = true;
      lastArgs = null;
    }, config.wait);
  };
}

function throttle(func: (event: Event) => Promise<void>, options: number | { limit: number; }) {
  const limit = typeof options === 'number' ? options : options.limit;
  let inThrottle = false;
  return (event: Event) => {
    if (!inThrottle) {
      func(event).catch(e => console.error("Error in throttled handler:", e));
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ==================== SHORTCUTS and UTILITIES ====================

/**
 * @internal
 * A generic factory to create event shortcut functions like `click`, `input`, etc.
 * This reduces code duplication and ensures all shortcuts share the same robust logic.
 */
function createEventShortcut<K extends keyof HTMLElementEventMap>(eventType: K) {
  function shortcut<El extends Element>(element: El, handler: HybridEventHandler<El, K>, options?: HybridEventOptions): CleanupFunction;
  function shortcut<El extends Element>(handler: HybridEventHandler<El, K>, options?: HybridEventOptions): ElementFn<El, CleanupFunction>;
  function shortcut(...args: any[]): any {
    if (args[0] instanceof Element) {
      const [element, handler, options] = args;
      return on(element, eventType, handler, options);
    }
    const [handler, options] = args;
    return on(eventType, handler, options);
  }
  return shortcut;
}

/** Attaches a `click` event listener. A convenient shortcut for `on('click', ...)`. */
export const click = createEventShortcut('click');
/** Attaches an `input` event listener. A convenient shortcut for `on('input', ...)`. */
export const input = createEventShortcut('input');
/** Attaches a `change` event listener. A convenient shortcut for `on('change', ...)`. */
export const change = createEventShortcut('change');
/** Attaches a `submit` event listener. A convenient shortcut for `on('submit', ...)`. */
export const submit = createEventShortcut('submit');

/**
 * Creates a reusable event behavior that can be yielded within a `watch` generator.
 * This is useful for encapsulating complex or repeated event logic.
 *
 * @example
 * const rippleEffect = createEventBehavior('click', function*() {
 *   yield addClass('ripple');
 *   yield delay(500);
 *   yield removeClass('ripple');
 * });
 *
 * watch('.material-button', function*() {
 *   yield* rippleEffect();
 * });
 */
export function createEventBehavior<K extends keyof HTMLElementEventMap, T = any>(
  eventType: K | string,
  behavior: HybridEventHandler<Element, K> | HybridCustomEventHandler<Element, T>,
  options?: HybridEventOptions
): () => Generator<ElementFn<Element, CleanupFunction>, void, unknown> {
  return function* () {
    yield on(eventType as K, behavior as HybridEventHandler<Element, K>, options);
  };
}

/**
 * Composes multiple event handlers into a single handler. The handlers are executed
 * in the order they are provided. This is useful for layering multiple pieces of
 * logic onto a single event.
 *
 * @example
 * const logClick = (event) => console.log('Clicked!');
 * const trackClick = (event) => analytics.track('click');
 * const composedHandler = composeEventHandlers(logClick, trackClick);
 * yield click(composedHandler);
 */
export function composeEventHandlers<K extends keyof HTMLElementEventMap>(
  ...handlers: HybridEventHandler<Element, K>[]
): HybridEventHandler<Element, K> {
  return async function* (event: HTMLElementEventMap[K], element?: Element) {
    for (const handler of handlers) {
      const result = (handler as Function)(event, element);
      if (result && typeof result.next === 'function') {
        yield* result;
      } else if (result && typeof result.then === 'function') {
        await result;
      }
    }
  };
}

/**
 * A helper for creating a delegated event listener. This is a convenient alternative
 * to using the `delegate` option in `on()`.
 *
 * @example
 * // These two are equivalent:
 * yield delegate('.list-item', 'click', handler);
 * yield on('click', handler, { delegate: '.list-item' });
 *
 * @param selector The CSS selector for child elements to target.
 * @param eventType The name of the event to listen for.
 * @param handler The function to call when the event occurs on a matching child.
 * @param options Additional event listener options.
 */
export function delegate<K extends keyof HTMLElementEventMap, T = any>(
  selector: string,
  eventType: K | string,
  handler: HybridEventHandler<Element, K> | HybridCustomEventHandler<Element, T>,
  options?: Omit<HybridEventOptions, 'delegate'>
): ElementFn<Element, CleanupFunction> {
  return on(eventType as K, handler as HybridEventHandler<Element, K>, { ...options, delegate: selector });
}

/**
 * Creates a new `CustomEvent` with full type safety for the `detail` payload.
 *
 * @param type The name of the custom event.
 * @param detail The data payload to include with the event.
 * @param options Standard `EventInit` options.
 * @returns A new, typed `CustomEvent` instance.
 */
export function createCustomEvent<T = any>(type: string, detail: T, options?: EventInit): CustomEvent<T> {
  return new CustomEvent(type, { detail, bubbles: true, cancelable: true, ...options });
}

/**
 * Dispatches a `CustomEvent` from an element.
 *
 * @example
 * // Inside a generator:
 * yield emit('user:action', { action: 'save' });
 *
 * @example
 * // Standalone:
 * emit(document.body, 'app:ready');
 */
export function emit<El extends Element>(element: El, eventName: string, detail?: any, options?: EventInit): void;
export function emit<El extends Element = HTMLElement>(eventName: string, detail?: any, options?: EventInit): ElementFn<El>;
export function emit(...args: any[]): any {
  if (args[0] instanceof Element) {
    const [element, eventName, detail, options] = args;
    element.dispatchEvent(createCustomEvent(eventName, detail, options));
  } else {
    const [eventName, detail, options] = args;
    return (element: Element) => element.dispatchEvent(createCustomEvent(eventName, detail, options));
  }
}

// ==================== OBSERVER-BASED EVENTS ====================

function createObserverEvent<T, O, C>(
  ObserverClass: new (cb: (entries: T[]) => void, opts?: O) => { observe: (el: Element, opts?: any) => void; disconnect: () => void },
  getChangeData: (entry: T, element: Element) => C
) {
  function observe(element: Element, handler: (change: C) => void, options?: O): CleanupFunction;
  function observe(handler: (change: C) => void, options?: O): ElementFn<Element, CleanupFunction>;
  function observe(...args: any[]): any {
    const setup = (element: Element, handler: (change: C) => void, options?: O) => {
      const observer = new ObserverClass((entries) => {
        for (const entry of entries) {
          handler(getChangeData(entry, element));
        }
      }, options);
      observer.observe(element, options);
      return () => observer.disconnect();
    };
    if (args[0] instanceof Element) return setup(args[0], args[1], args[2]);
    return (element: Element) => setup(element, args[0], args[1]);
  }
  return observe;
}

/** Listens for changes to an element's attributes. */
export const onAttr = createObserverEvent<MutationRecord, MutationObserverInit, AttributeChange & {element: Element}>(
  MutationObserver,
  (entry, element) => ({
    attributeName: entry.attributeName!, oldValue: entry.oldValue, newValue: element.getAttribute(entry.attributeName!), element,
  })
);

/** Listens for changes to an element's `textContent`. */
export const onText = createObserverEvent<MutationRecord, MutationObserverInit, TextChange & {element: Element}>(
  MutationObserver,
  (entry, element) => ({
    oldText: entry.oldValue || '', newText: element.textContent || '', element,
  })
);

/** Listens for when an element becomes visible or hidden in the viewport. */
export const onVisible = createObserverEvent<IntersectionObserverEntry, IntersectionObserverInit, VisibilityChange & {element: Element}>(
  IntersectionObserver,
  (entry, element) => ({
    isVisible: entry.isIntersecting, intersectionRatio: entry.intersectionRatio, boundingClientRect: entry.boundingClientRect, element,
  })
);

/** Listens for changes to an element's size. */
export const onResize = createObserverEvent<ResizeObserverEntry, ResizeObserverOptions, ResizeChange & {element: Element}>(
  ResizeObserver,
  (entry, element) => ({
    contentRect: entry.contentRect, borderBoxSize: entry.borderBoxSize, contentBoxSize: entry.contentBoxSize, element,
  })
);

// ==================== LIFECYCLE EVENTS ====================

/**
 * Triggers a handler immediately when an element is first processed by `watch`.
 * This is effectively a "setup" or "initialization" hook.
 */
export function onMount<El extends Element>(element: El, handler: (element: El) => void): CleanupFunction;
export function onMount<El extends Element>(handler: (element: El) => void): ElementFn<El, CleanupFunction>;
export function onMount(...args: any[]): any {
  if (args[0] instanceof Element) {
    const [element, handler] = args;
    handler(element);
  } else {
    const [handler] = args;
    return (element: Element) => handler(element);
  }
  return () => {}; // onMount is immediate, so its cleanup is a no-op.
}

const unmountHandlers = new WeakMap<Element, Set<(element: Element) => void>>();

/** @internal Triggers all registered unmount and general cleanup handlers for an element. */
export function triggerUnmountHandlers(element: Element): void {
  if(element instanceof HTMLElement) executeCleanup(element); // General cleanup only for HTMLElements
  unmountHandlers.get(element)?.forEach(handler => handler(element));
  unmountHandlers.delete(element);
}

/**
 * Registers a handler to be called when an element is removed from the DOM.
 * This is the primary "cleanup" hook for releasing resources or finalizing state.
 */
export function onUnmount<El extends Element>(element: El, handler: (element: El) => void): CleanupFunction;
export function onUnmount<El extends Element>(handler: (element: El) => void): ElementFn<El, CleanupFunction>;
export function onUnmount(...args: any[]): any {
  const setup = (element: Element, handler: (el: Element) => void) => {
    if (!unmountHandlers.has(element)) unmountHandlers.set(element, new Set());
    const handlers = unmountHandlers.get(element)!;
    handlers.add(handler);
    return () => { handlers.delete(handler); };
  };
  if (args[0] instanceof Element) {
    return setup(args[0], args[1]);
  }
  return (element: Element) => setup(element, args[0]);
}