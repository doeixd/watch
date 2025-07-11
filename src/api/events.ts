/**
 * @deprecated This module is deprecated. Use the unified event system from the main index instead.
 * All functionality has been moved to the unified event handling system.
 */

// Event handling with dual API support

import type { 
  ElementFn, 
  ElementEventHandler,
  CustomEventHandler,
  EventHandler,
  WatchEventListenerOptions,
  EventName, 
  AttributeChange, 
  TextChange, 
  VisibilityChange, 
  ResizeChange,
  CleanupFunction
} from '../types.ts';

/**
 * Type helper to infer CustomEvent detail type from CustomEvent instance
 */
export type InferCustomEventDetail<T> = T extends CustomEvent<infer D> ? D : any;

/**
 * Create a typed CustomEvent with proper type inference
 * This is a helper function to create CustomEvents with full type safety
 */
export function createCustomEvent<T = any>(
  type: string,
  detail: T,
  options?: EventInit
): CustomEvent<T> {
  return new CustomEvent(type, {
    detail,
    bubbles: true,
    cancelable: true,
    ...options
  });
}

/**
 * # Enhanced `on()` Function - Advanced Event Handling
 * 
 * The `on()` function provides comprehensive event handling with support for:
 * - Standard DOM events with full type safety
 * - CustomEvent objects with automatic type inference
 * - Event delegation and filtering
 * - AbortSignal support for cleanup
 * - Debouncing and throttling
 * - All native addEventListener options
 * 
 * ## Features
 * 
 * ### 1. Standard DOM Events
 * ```typescript
 * watch('button', function* () {
 *   yield on('click', (event, button) => {
 *     console.log('Button clicked!', event.clientX, event.clientY);
 *   });
 * });
 * ```
 * 
 * ### 2. CustomEvent Support
 * ```typescript
 * const customEvent = new CustomEvent('my-event', { detail: { userId: 123 } });
 * 
 * watch('.widget', function* () {
 *   // Type is automatically inferred from the CustomEvent
 *   yield on(customEvent, (event, element) => {
 *     console.log('User ID:', event.detail.userId); // ✅ Type-safe
 *   });
 * });
 * ```
 * 
 * ### 3. Event Delegation
 * ```typescript
 * watch('.container', function* () {
 *   yield on('click', handler, {
 *     delegate: '.button' // Only handle clicks on buttons inside container
 *   });
 * });
 * ```
 * 
 * ### 4. AbortSignal Support
 * ```typescript
 * const controller = new AbortController();
 * 
 * watch('.element', function* () {
 *   yield on('click', handler, {
 *     signal: controller.signal
 *   });
 * });
 * 
 * // Later: controller.abort(); // Automatically removes listeners
 * ```
 * 
 * ### 5. Debouncing and Throttling
 * ```typescript
 * watch('input', function* () {
 *   yield on('input', handler, {
 *     debounce: 300 // Debounce input events
 *   });
 *   
 *   yield on('scroll', handler, {
 *     throttle: 16 // Throttle scroll events (60fps)
 *   });
 * });
 * ```
 * 
 * ### 6. Event Filtering
 * ```typescript
 * watch('.list', function* () {
 *   yield on('click', handler, {
 *     filter: (event, element) => {
 *       // Only handle clicks with Ctrl key
 *       return event.ctrlKey;
 *     }
 *   });
 * });
 * ```
 */

// 1. Standard DOM events with element
export function on<El extends HTMLElement, K extends keyof HTMLElementEventMap>(
  element: El, 
  event: K, 
  handler: ElementEventHandler<El, K>,
  options?: WatchEventListenerOptions
): CleanupFunction;

// 2. Standard DOM events for generator
export function on<El extends HTMLElement, K extends keyof HTMLElementEventMap>(
  event: K,
  handler: ElementEventHandler<El, K>,
  options?: WatchEventListenerOptions
): ElementFn<El, CleanupFunction>;

// 3. CustomEvent with element
export function on<El extends HTMLElement, T = any>(
  element: El,
  event: CustomEvent<T>,
  handler: CustomEventHandler<El, T>,
  options?: WatchEventListenerOptions
): CleanupFunction;

// 4. CustomEvent for generator
export function on<El extends HTMLElement, T = any>(
  event: CustomEvent<T>,
  handler: CustomEventHandler<El, T>,
  options?: WatchEventListenerOptions
): ElementFn<El, CleanupFunction>;

// 5. Custom event type string with typed detail
export function on<El extends HTMLElement, T = any>(
  element: El,
  eventType: string,
  handler: CustomEventHandler<El, T>,
  options?: WatchEventListenerOptions
): CleanupFunction;

// 6. Custom event type string for generator
export function on<El extends HTMLElement, T = any>(
  eventType: string,
  handler: CustomEventHandler<El, T>,
  options?: WatchEventListenerOptions
): ElementFn<El, CleanupFunction>;

// Implementation
export function on<El extends HTMLElement>(...args: any[]): any {
  // Helper functions for debouncing and throttling
  const debounce = (func: Function, wait: number) => {
    let timeout: number;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const throttle = (func: Function, limit: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // Determine if this is direct usage (element provided) or generator usage
  const isDirectUsage = args.length >= 3 && typeof args[0] === 'object' && 'nodeType' in args[0];
  
  if (isDirectUsage) {
    const [element, eventOrEventType, handler, options = {}] = args as [El, any, any, WatchEventListenerOptions];
    
    return setupEventListener(element, eventOrEventType, handler, options);
  } else {
    const [eventOrEventType, handler, options = {}] = args as [any, any, WatchEventListenerOptions];
    
    return ((element: El) => {
      return setupEventListener(element, eventOrEventType, handler, options);
    }) as ElementFn<El, CleanupFunction>;
  }

  function setupEventListener(
    element: El,
    eventOrEventType: any,
    handler: any,
    options: WatchEventListenerOptions
  ): CleanupFunction {
    let eventType: string;
    let isCustomEvent = false;
    
    // Determine event type with comprehensive validation
    if (typeof eventOrEventType === 'string') {
      if (!eventOrEventType.trim()) {
        throw new Error('Event type cannot be empty');
      }
      eventType = eventOrEventType;
    } else if (eventOrEventType instanceof CustomEvent) {
      eventType = eventOrEventType.type;
      isCustomEvent = true;
    } else if (eventOrEventType && typeof eventOrEventType === 'object' && 'type' in eventOrEventType) {
      // Handle Event-like objects
      eventType = eventOrEventType.type;
      isCustomEvent = true;
    } else {
      throw new Error('Event must be a string, CustomEvent instance, or Event-like object with a type property');
    }

    // Validate handler
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }

    // Validate element
    if (!element || typeof element.addEventListener !== 'function') {
      throw new Error('Element must be a valid DOM element with addEventListener method');
    }

    // Wrap handler with enhancements
    let wrappedHandler = (e: Event) => {
      // Apply filter if provided
      if (options.filter && !options.filter(e, element)) {
        return;
      }

      // Handle delegation
      if (options.delegate) {
        const target = e.target as HTMLElement;
        
        if (!target || typeof target.closest !== 'function') {
          return; // Skip if target is not a valid Element
        }
        
        try {
          const delegateTarget = target.closest(options.delegate);
          
          if (!delegateTarget || !element.contains(delegateTarget)) {
            return;
          }
          
          // Call handler with the delegated target
          handler(e, delegateTarget as El);
        } catch (error) {
          // Invalid selector for delegation, fall back to normal handling
          console.warn(`Invalid delegation selector "${options.delegate}":`, error);
          handler(e, element);
        }
      } else {
        // Normal event handling
        try {
          handler(e, element);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      }
    };

    // Apply debouncing if specified
    if (options.debounce) {
      wrappedHandler = debounce(wrappedHandler, options.debounce);
    }

    // Apply throttling if specified
    if (options.throttle) {
      wrappedHandler = throttle(wrappedHandler, options.throttle);
    }

    // Create clean addEventListener options (without our custom properties)
    const listenerOptions: AddEventListenerOptions = {
      capture: options.capture,
      once: options.once,
      passive: options.passive,
      signal: options.signal
    };

    // Add event listener
    element.addEventListener(eventType, wrappedHandler, listenerOptions);

    // Return cleanup function
    return () => {
      element.removeEventListener(eventType, wrappedHandler, listenerOptions);
    };
  }
}

// CUSTOM EVENT DISPATCHING
export function emit<El extends HTMLElement>(
  element: El,
  eventName: string,
  detail?: any,
  options?: EventInit
): void;
export function emit<El extends HTMLElement = HTMLElement>(
  eventName: string,
  detail?: any,
  options?: EventInit
): ElementFn<El>;
export function emit<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, eventName, detail, options] = args as [El, string, any, EventInit?];
    
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
      ...options
    });
    
    element.dispatchEvent(event);
  } else {
    const [eventName, detail, options] = args as [string, any, EventInit?];
    
    return ((element: El) => {
      const event = new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true,
        ...options
      });
      
      element.dispatchEvent(event);
    }) as ElementFn<El>;
  }
}

// ATTRIBUTE OBSERVATION - Watch for attribute changes
export function onAttr<El extends HTMLElement>(
  element: El,
  filter: string | RegExp,
  handler: (change: AttributeChange & { element: El }) => void
): CleanupFunction;
export function onAttr<El extends HTMLElement>(
  filter: string | RegExp,
  handler: (change: AttributeChange & { element: El }) => void
): ElementFn<El, CleanupFunction>;
export function onAttr<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 3) {
    const [element, filter, handler] = args as [El, string | RegExp, (change: AttributeChange & { element: El }) => void];
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target === element) {
          const attributeName = mutation.attributeName!;
          let shouldHandle = false;
          
          if (typeof filter === 'string') {
            shouldHandle = attributeName === filter;
          } else {
            shouldHandle = filter.test(attributeName);
          }
          
          if (shouldHandle) {
            handler({
              attributeName,
              oldValue: mutation.oldValue,
              newValue: element.getAttribute(attributeName),
              element
            });
          }
        }
      });
    });
    
    observer.observe(element, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: typeof filter === 'string' ? [filter] : undefined
    });
    
    return () => observer.disconnect();
  } else {
    const [filter, handler] = args as [string | RegExp, (change: AttributeChange & { element: El }) => void];
    
    return ((element: El) => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.target === element) {
            const attributeName = mutation.attributeName!;
            let shouldHandle = false;
            
            if (typeof filter === 'string') {
              shouldHandle = attributeName === filter;
            } else {
              shouldHandle = filter.test(attributeName);
            }
            
            if (shouldHandle) {
              handler({
                attributeName,
                oldValue: mutation.oldValue,
                newValue: element.getAttribute(attributeName),
                element
              });
            }
          }
        });
      });
      
      observer.observe(element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: typeof filter === 'string' ? [filter] : undefined
      });
      
      return () => observer.disconnect();
    }) as ElementFn<El, CleanupFunction>;
  }
}

// TEXT CONTENT OBSERVATION - Watch for text changes
export function onText<El extends HTMLElement>(
  element: El,
  handler: (change: TextChange & { element: El }) => void
): CleanupFunction;
export function onText<El extends HTMLElement>(
  handler: (change: TextChange & { element: El }) => void
): ElementFn<El, CleanupFunction>;
export function onText<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, handler] = args as [El, (change: TextChange & { element: El }) => void];
    let oldText = element.textContent || '';
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const newText = element.textContent || '';
          if (newText !== oldText) {
            handler({
              oldText,
              newText,
              element
            });
            oldText = newText;
          }
        }
      });
    });
    
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
      characterDataOldValue: true
    });
    
    return () => observer.disconnect();
  } else {
    const [handler] = args as [(change: TextChange & { element: El }) => void];
    
    return ((element: El) => {
      let oldText = element.textContent || '';
      
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const newText = element.textContent || '';
            if (newText !== oldText) {
              handler({
                oldText,
                newText,
                element
              });
              oldText = newText;
            }
          }
        });
      });
      
      observer.observe(element, {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: true
      });
      
      return () => observer.disconnect();
    }) as ElementFn<El, CleanupFunction>;
  }
}

// VISIBILITY OBSERVATION - Watch for visibility changes
export function onVisible<El extends HTMLElement>(
  element: El,
  handler: (change: VisibilityChange & { element: El }) => void,
  options?: IntersectionObserverInit
): CleanupFunction;
export function onVisible<El extends HTMLElement>(
  handler: (change: VisibilityChange & { element: El }) => void,
  options?: IntersectionObserverInit
): ElementFn<El, CleanupFunction>;
export function onVisible<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, handler, options] = args as [El, (change: VisibilityChange & { element: El }) => void, IntersectionObserverInit?];
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === element) {
          handler({
            isVisible: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: entry.boundingClientRect,
            element
          });
        }
      });
    }, options);
    
    observer.observe(element);
    return () => observer.disconnect();
  } else {
    const [handler, options] = args as [(change: VisibilityChange & { element: El }) => void, IntersectionObserverInit?];
    
    return ((element: El) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === element) {
            handler({
              isVisible: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio,
              boundingClientRect: entry.boundingClientRect,
              element
            });
          }
        });
      }, options);
      
      observer.observe(element);
      return () => observer.disconnect();
    }) as ElementFn<El, CleanupFunction>;
  }
}

// RESIZE OBSERVATION - Watch for size changes
export function onResize<El extends HTMLElement>(
  element: El,
  handler: (change: ResizeChange & { element: El }) => void
): CleanupFunction;
export function onResize<El extends HTMLElement>(
  handler: (change: ResizeChange & { element: El }) => void
): ElementFn<El, CleanupFunction>;
export function onResize<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, handler] = args as [El, (change: ResizeChange & { element: El }) => void];
    
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === element) {
          handler({
            contentRect: entry.contentRect,
            borderBoxSize: entry.borderBoxSize,
            contentBoxSize: entry.contentBoxSize,
            element
          });
        }
      });
    });
    
    observer.observe(element);
    return () => observer.disconnect();
  } else {
    const [handler] = args as [(change: ResizeChange & { element: El }) => void];
    
    return ((element: El) => {
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === element) {
            handler({
              contentRect: entry.contentRect,
              borderBoxSize: entry.borderBoxSize,
              contentBoxSize: entry.contentBoxSize,
              element
            });
          }
        });
      });
      
      observer.observe(element);
      return () => observer.disconnect();
    }) as ElementFn<El, CleanupFunction>;
  }
}

// LIFECYCLE EVENTS - Mount and unmount
export function onMount<El extends HTMLElement>(
  element: El,
  handler: (element: El) => void
): CleanupFunction;
export function onMount<El extends HTMLElement>(
  handler: (element: El) => void
): ElementFn<El, CleanupFunction>;
export function onMount<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, handler] = args as [El, (element: El) => void];
    
    // Call immediately for existing elements
    handler(element);
    
    // Return no-op cleanup since mount is immediate
    return () => {};
  } else {
    const [handler] = args as [(element: El) => void];
    
    return ((element: El) => {
      handler(element);
      return () => {};
    }) as ElementFn<El, CleanupFunction>;
  }
}

export function onUnmount<El extends HTMLElement>(
  element: El,
  handler: (element: El) => void
): CleanupFunction;
export function onUnmount<El extends HTMLElement>(
  handler: (element: El) => void
): ElementFn<El, CleanupFunction>;
export function onUnmount<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, handler] = args as [El, (element: El) => void];
    
    // Store unmount handler for later execution
    if (!unmountHandlers.has(element)) {
      unmountHandlers.set(element, new Set());
    }
    unmountHandlers.get(element)!.add(handler);
    
    return () => {
      unmountHandlers.get(element)?.delete(handler);
    };
  } else {
    const [handler] = args as [(element: El) => void];
    
    return ((element: El) => {
      if (!unmountHandlers.has(element)) {
        unmountHandlers.set(element, new Set());
      }
      unmountHandlers.get(element)!.add(handler);
      
      return () => {
        unmountHandlers.get(element)?.delete(handler);
      };
    }) as ElementFn<El, CleanupFunction>;
  }
}

// Global unmount handler storage
const unmountHandlers = new WeakMap<HTMLElement, Set<(element: HTMLElement) => void>>();

// Helper to trigger unmount handlers when elements are removed
export function triggerUnmountHandlers(element: HTMLElement): void {
  const handlers = unmountHandlers.get(element);
  if (handlers) {
    handlers.forEach(handler => handler(element));
    unmountHandlers.delete(element);
  }
}

/**
 * # Event Shortcuts - Common Event Handlers
 * 
 * Convenient shortcuts for the most commonly used DOM events.
 * These are equivalent to using `on()` with specific event types.
 * 
 * ## Available Shortcuts
 * - `click()` - Mouse click events
 * - `change()` - Form change events
 * - `input()` - Form input events
 * - `submit()` - Form submission events
 * 
 * ## Usage
 * 
 * ```typescript
 * // These are equivalent:
 * yield click(handler);
 * yield on('click', handler);
 * 
 * // Direct usage
 * const cleanup = click(button, handler);
 * const cleanup = on(button, 'click', handler);
 * ```
 */

/**
 * # click() - Click Event Shortcut
 * 
 * Convenient shortcut for handling click events with full type safety.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Generator usage
 * watch('button', function* () {
 *   yield click((event, button) => {
 *     console.log('Button clicked!', button.textContent);
 *   });
 * });
 * 
 * // Direct usage
 * const cleanup = click(button, (event, button) => {
 *   console.log('Clicked!');
 * });
 * 
 * // With options
 * yield click(handler, { once: true });
 * ```
 * 
 * @param element - Element to add click listener to (direct mode)
 * @param handler - Click event handler
 * @param options - AddEventListener options
 * @returns Cleanup function (direct mode) or ElementFn (generator mode)
 */
export function click<El extends HTMLElement>(
  element: El,
  handler: ElementEventHandler<El, 'click'>,
  options?: WatchEventListenerOptions
): CleanupFunction;
export function click<El extends HTMLElement>(
  handler: ElementEventHandler<El, 'click'>,
  options?: WatchEventListenerOptions
): ElementFn<El, CleanupFunction>;
export function click<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, handler, options] = args as [El, ElementEventHandler<El, 'click'>, WatchEventListenerOptions?];
    return on(element, 'click', handler, options);
  } else {
    const [handler, options] = args as [ElementEventHandler<El, 'click'>, WatchEventListenerOptions?];
    return on('click', handler, options);
  }
}

export function change<El extends HTMLElement>(
  element: El,
  handler: ElementEventHandler<El, 'change'>,
  options?: WatchEventListenerOptions
): CleanupFunction;
export function change<El extends HTMLElement>(
  handler: ElementEventHandler<El, 'change'>,
  options?: WatchEventListenerOptions
): ElementFn<El, CleanupFunction>;
export function change<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, handler, options] = args as [El, ElementEventHandler<El, 'change'>, WatchEventListenerOptions?];
    return on(element, 'change', handler, options);
  } else {
    const [handler, options] = args as [ElementEventHandler<El, 'change'>, WatchEventListenerOptions?];
    return on('change', handler, options);
  }
}

export function input<El extends HTMLElement>(
  element: El,
  handler: ElementEventHandler<El, 'input'>,
  options?: WatchEventListenerOptions
): CleanupFunction;
export function input<El extends HTMLElement>(
  handler: ElementEventHandler<El, 'input'>,
  options?: WatchEventListenerOptions
): ElementFn<El, CleanupFunction>;
export function input<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, handler, options] = args as [El, ElementEventHandler<El, 'input'>, WatchEventListenerOptions?];
    return on(element, 'input', handler, options);
  } else {
    const [handler, options] = args as [ElementEventHandler<El, 'input'>, WatchEventListenerOptions?];
    return on('input', handler, options);
  }
}

export function submit<El extends HTMLElement>(
  element: El,
  handler: ElementEventHandler<El, 'submit'>,
  options?: WatchEventListenerOptions
): CleanupFunction;
export function submit<El extends HTMLElement>(
  handler: ElementEventHandler<El, 'submit'>,
  options?: WatchEventListenerOptions
): ElementFn<El, CleanupFunction>;
export function submit<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, handler, options] = args as [El, ElementEventHandler<El, 'submit'>, WatchEventListenerOptions?];
    return on(element, 'submit', handler, options);
  } else {
    const [handler, options] = args as [ElementEventHandler<El, 'submit'>, WatchEventListenerOptions?];
    return on('submit', handler, options);
  }
}
