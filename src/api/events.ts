// Event handling with dual API support

import type { 
  ElementFn, 
  ElementEventHandler, 
  EventName, 
  AttributeChange, 
  TextChange, 
  VisibilityChange, 
  ResizeChange,
  CleanupFunction
} from '../types.ts';

// STANDARD DOM EVENTS - Type-safe event handling without 'this'
export function on<El extends HTMLElement, K extends keyof HTMLElementEventMap>(
  element: El, 
  event: K, 
  handler: ElementEventHandler<El, K>,
  options?: AddEventListenerOptions
): CleanupFunction;
export function on<El extends HTMLElement, K extends keyof HTMLElementEventMap>(
  event: K,
  handler: ElementEventHandler<El, K>,
  options?: AddEventListenerOptions
): ElementFn<El, CleanupFunction>;
export function on<El extends HTMLElement, K extends keyof HTMLElementEventMap>(...args: any[]): any {
  if (args.length >= 3 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, event, handler, options] = args as [El, K, ElementEventHandler<El, K>, AddEventListenerOptions?];
    
    const wrappedHandler = (e: Event) => {
      handler(e as HTMLElementEventMap[K], element);
    };
    
    element.addEventListener(event, wrappedHandler, options);
    
    return () => {
      element.removeEventListener(event, wrappedHandler, options);
    };
  } else {
    const [event, handler, options] = args as [K, ElementEventHandler<El, K>, AddEventListenerOptions?];
    
    return ((element: El) => {
      const wrappedHandler = (e: Event) => {
        handler(e as HTMLElementEventMap[K], element);
      };
      
      element.addEventListener(event, wrappedHandler, options);
      
      return () => {
        element.removeEventListener(event, wrappedHandler, options);
      };
    }) as ElementFn<El, CleanupFunction>;
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
  options?: AddEventListenerOptions
): CleanupFunction;
export function click<El extends HTMLElement>(
  handler: ElementEventHandler<El, 'click'>,
  options?: AddEventListenerOptions
): ElementFn<El, CleanupFunction>;
export function click<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, handler, options] = args as [El, ElementEventHandler<El, 'click'>, AddEventListenerOptions?];
    return on(element, 'click', handler, options);
  } else {
    const [handler, options] = args as [ElementEventHandler<El, 'click'>, AddEventListenerOptions?];
    return on('click', handler, options);
  }
}

export function change<El extends HTMLElement>(
  element: El,
  handler: ElementEventHandler<El, 'change'>,
  options?: AddEventListenerOptions
): CleanupFunction;
export function change<El extends HTMLElement>(
  handler: ElementEventHandler<El, 'change'>,
  options?: AddEventListenerOptions
): ElementFn<El, CleanupFunction>;
export function change<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, handler, options] = args as [El, ElementEventHandler<El, 'change'>, AddEventListenerOptions?];
    return on(element, 'change', handler, options);
  } else {
    const [handler, options] = args as [ElementEventHandler<El, 'change'>, AddEventListenerOptions?];
    return on('change', handler, options);
  }
}

export function input<El extends HTMLElement>(
  element: El,
  handler: ElementEventHandler<El, 'input'>,
  options?: AddEventListenerOptions
): CleanupFunction;
export function input<El extends HTMLElement>(
  handler: ElementEventHandler<El, 'input'>,
  options?: AddEventListenerOptions
): ElementFn<El, CleanupFunction>;
export function input<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, handler, options] = args as [El, ElementEventHandler<El, 'input'>, AddEventListenerOptions?];
    return on(element, 'input', handler, options);
  } else {
    const [handler, options] = args as [ElementEventHandler<El, 'input'>, AddEventListenerOptions?];
    return on('input', handler, options);
  }
}

export function submit<El extends HTMLElement>(
  element: El,
  handler: ElementEventHandler<El, 'submit'>,
  options?: AddEventListenerOptions
): CleanupFunction;
export function submit<El extends HTMLElement>(
  handler: ElementEventHandler<El, 'submit'>,
  options?: AddEventListenerOptions
): ElementFn<El, CleanupFunction>;
export function submit<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, handler, options] = args as [El, ElementEventHandler<El, 'submit'>, AddEventListenerOptions?];
    return on(element, 'submit', handler, options);
  } else {
    const [handler, options] = args as [ElementEventHandler<El, 'submit'>, AddEventListenerOptions?];
    return on('submit', handler, options);
  }
}
