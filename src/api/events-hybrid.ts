// Hybrid Event Handling - Best of Both Worlds
// Maintains all current overloads while adding generator superpowers

import type { 
  ElementFn, 
  CleanupFunction,
  HybridEventOptions,
  HybridEventHandler,
  HybridCustomEventHandler,
  AttributeChange,
  TextChange,
  VisibilityChange,
  ResizeChange
} from '../types';
import { executeGenerator, getCurrentContext, createCleanupFunction, pushContext, popContext, executeCleanup } from '../core/context';

/**
 * # Hybrid Event Handling Design
 * 
 * This design combines the ergonomics of overloads with generator superpowers:
 * 
 * ## 1. Standalone Usage (Current Ergonomics Preserved)
 * ```typescript
 * const button = document.querySelector('button');
 * 
 * // Direct usage - works exactly like before
 * const cleanup = on(button, 'click', (event, element) => {
 *   console.log('Clicked!');
 * });
 * 
 * // Enhanced options still work
 * const cleanup2 = on(button, 'click', handler, {
 *   debounce: 300,
 *   delegate: '.child'
 * });
 * ```
 * 
 * ## 2. Generator Usage (Enhanced Context)
 * ```typescript
 * watch('button', function* () {
 *   // Regular function with automatic context enhancement
 *   yield on('click', (event) => {
 *     const button = self(); // ✅ Context automatically available!
 *     const count = getState('clicks') || 0;
 *     setState('clicks', count + 1);
 *   });
 *   
 *   // Generator function with full power
 *   yield on('click', function* (event) {
 *     yield addClass('clicked');
 *     yield delay(100);
 *     yield removeClass('clicked');
 *   });
 * });
 * ```
 * 
 * ## 3. CustomEvent Support (All Modes)
 * ```typescript
 * const userEvent = createCustomEvent('user:login', { userId: 123 });
 * 
 * // Standalone
 * on(element, userEvent, (event, el) => {
 *   console.log(event.detail.userId); // Type-safe
 * });
 * 
 * // Generator
 * yield on(userEvent, function* (event) => {
 *   yield text(`User ${event.detail.userId} logged in`);
 * });
 * ```
 */



// ==================== OVERLOADS (Ergonomic API) ====================

// 1. Direct usage: element + standard event
export function on<El extends HTMLElement, K extends keyof HTMLElementEventMap>(
  element: El,
  event: K,
  handler: HybridEventHandler<El, K>,
  options?: HybridEventOptions
): CleanupFunction;

// 2. Generator usage: standard event
export function on<El extends HTMLElement, K extends keyof HTMLElementEventMap>(
  event: K,
  handler: HybridEventHandler<El, K>,
  options?: HybridEventOptions
): ElementFn<El, CleanupFunction>;

// 3. Direct usage: element + CustomEvent
export function on<El extends HTMLElement, T = any>(
  element: El,
  event: CustomEvent<T>,
  handler: HybridCustomEventHandler<El, T>,
  options?: HybridEventOptions
): CleanupFunction;

// 4. Generator usage: CustomEvent
export function on<El extends HTMLElement, T = any>(
  event: CustomEvent<T>,
  handler: HybridCustomEventHandler<El, T>,
  options?: HybridEventOptions
): ElementFn<El, CleanupFunction>;

// 5. Direct usage: element + custom event string
export function on<El extends HTMLElement, T = any>(
  element: El,
  eventType: string,
  handler: HybridCustomEventHandler<El, T>,
  options?: HybridEventOptions
): CleanupFunction;

// 6. Generator usage: custom event string
export function on<El extends HTMLElement, T = any>(
  eventType: string,
  handler: HybridCustomEventHandler<El, T>,
  options?: HybridEventOptions
): ElementFn<El, CleanupFunction>;

// ==================== IMPLEMENTATION ====================

export function on(...args: any[]): any {
  // Determine if this is direct usage (element provided) or generator usage
  // Support HTMLElement, SVGElement, and other Element types
  const isDirectUsage = args.length >= 3 && args[0] && 
    (args[0] instanceof Element || (typeof args[0] === 'object' && 'nodeType' in args[0] && args[0].nodeType === 1));
  
  if (isDirectUsage) {
    const [element, eventOrType, handler, options = {}] = args;
    return setupDirectEventListener(element, eventOrType, handler, options);
  } else {
    const [eventOrType, handler, options = {}] = args;
    return createElementFunction(eventOrType, handler, options);
  }
}

/**
 * Setup event listener for direct usage (standalone)
 */
function setupDirectEventListener<El extends HTMLElement>(
  element: El,
  eventOrType: any,
  handler: any,
  options: HybridEventOptions
): CleanupFunction {
  const eventType = getEventType(eventOrType);
  
  // Create enhanced handler
  const enhancedHandler = createEnhancedHandler(element, handler, false, options);
  
  // Apply timing modifiers
  const finalHandler = applyTimingModifiers(enhancedHandler, options);
  
  // Setup event listener with all options
  return setupEventListener(element, eventType, finalHandler, options);
}

/**
 * Create ElementFn for generator usage
 */
function createElementFunction<El extends HTMLElement>(
  eventOrType: any,
  handler: any,
  options: HybridEventOptions
): ElementFn<El, CleanupFunction> {
  return (element: El) => {
    const eventType = getEventType(eventOrType);
    
    // Create enhanced handler with context detection
    const enhancedHandler = createEnhancedHandler(element, handler, true, options);
    
    // Apply timing modifiers
    const finalHandler = applyTimingModifiers(enhancedHandler, options);
    
    // Setup event listener
    const cleanup = setupEventListener(element, eventType, finalHandler, options);
    
    // Register cleanup with generator cleanup system for proper memory management
    const context = getCurrentContext();
    if (context) {
      createCleanupFunction(element)(cleanup);
    }
    
    return cleanup;
  };
}

// Queue management for concurrent async generators
const elementQueues = new WeakMap<HTMLElement, { current: Promise<void> | null; latest: Event | null }>();

/**
 * Handle queued execution of async generators
 */
async function handleQueuedExecution<El extends HTMLElement>(
  element: El,
  queueMode: 'latest' | 'all',
  event: Event,
  executor: () => Promise<any>
): Promise<void> {
  if (!elementQueues.has(element)) {
    elementQueues.set(element, { current: null, latest: null });
  }
  
  const queue = elementQueues.get(element)!;
  
  if (queueMode === 'latest') {
    // Cancel current execution and run latest
    queue.latest = event;
    
    if (!queue.current) {
      queue.current = (async () => {
        while (queue.latest) {
          queue.latest = null;
          
          try {
            await executor();
          } catch (error) {
            console.error('Error in queued generator execution:', error);
          }
        }
        queue.current = null;
      })();
    }
    
    await queue.current;
  } else {
    // Queue all executions sequentially
    const previousExecution = queue.current || Promise.resolve();
    
    queue.current = previousExecution.then(async () => {
      try {
        await executor();
      } catch (error) {
        console.error('Error in sequential generator execution:', error);
      }
    });
    
    await queue.current;
  }
}

/**
 * Create enhanced handler that detects and provides context
 */
function createEnhancedHandler<El extends HTMLElement>(
  element: El,
  handler: any,
  inGeneratorContext: boolean,
  options: HybridEventOptions
): (event: Event) => Promise<void> {
  return async (event: Event) => {
    try {
      let targetElement = element;
      
      // Apply delegation if specified
      if (options.delegate) {
        const target = event.target as HTMLElement;
        const delegateTarget = target?.closest?.(options.delegate);
        
        if (!delegateTarget || !element.contains(delegateTarget)) {
          return;
        }
        
        // Update element reference for delegated events
        targetElement = delegateTarget as El;
      }
      
      // Apply filter if specified
      if (options.filter && !options.filter(event, targetElement)) {
        return;
      }
      
      // Determine how to call the handler based on context and type
      let result: any;
      
      if (inGeneratorContext) {
        // In generator context - check if we're truly in generator context
        const currentContext = getCurrentContext();
        if (currentContext) {
          // True generator context - rely on self(), ctx(), etc.
          result = handler(event);
        } else {
          // Called with element inside generator but not in context - pass element
          result = handler(event, targetElement);
        }
      } else {
        // Standalone usage - provide context so self() works
        const contextFrame = {
          element: targetElement,
          selector: 'event',
          index: 0,
          array: [targetElement] as readonly typeof targetElement[]
        };
        
        pushContext(contextFrame);
        try {
          result = handler(event, targetElement);
        } finally {
          popContext();
        }
      }
      
      // Handle different return types with queuing support
      if (result && typeof result.next === 'function') {
        // Handler returned a generator - execute it with context and queuing
        const queueMode = options.queue || 'all';
        
        if (queueMode === 'none') {
          // No queuing - run concurrently (fire and forget)
          executeGenerator(
            targetElement,
            'event',
            0,
            [targetElement],
            () => result
          ).catch(error => {
            console.error('Error in concurrent generator execution:', error);
          });
        } else {
          // Handle queuing
          await handleQueuedExecution(targetElement, queueMode, event, () => 
            executeGenerator(
              targetElement,
              'event',
              0,
              [targetElement],
              () => result
            )
          );
        }
      } else if (result && typeof result.then === 'function') {
        // Handler returned a promise - await it
        await result;
      }
      // Regular functions return undefined - nothing to do
      
    } catch (error) {
      console.error(`Error in event handler:`, error);
    }
  };
}

/**
 * Apply debouncing/throttling to handler
 */
function applyTimingModifiers(
  handler: (event: Event) => Promise<void>,
  options: HybridEventOptions
): (event: Event) => void {
  if (options.debounce) {
    return debounce(handler, options.debounce);
  } else if (options.throttle) {
    return throttle(handler, options.throttle);
  }
  return (event: Event) => {
    handler(event).catch(error => {
      console.error('Error in async event handler:', error);
    });
  };
}

/**
 * Setup the actual event listener
 */
function setupEventListener<El extends HTMLElement>(
  element: El,
  eventType: string,
  handler: (event: Event) => void,
  options: HybridEventOptions
): CleanupFunction {
  // Create clean addEventListener options
  // Use delegatePhase for capture if delegation is enabled
  const listenerOptions: AddEventListenerOptions = {
    capture: options.delegate ? (options.delegatePhase === 'capture') : options.capture,
    once: options.once,
    passive: options.passive,
    signal: options.signal
  };
  
  // Add event listener
  element.addEventListener(eventType, handler, listenerOptions);
  
  // Return cleanup function with AbortSignal guard
  return () => {
    // Guard against double cleanup when AbortSignal is used
    if (options.signal && options.signal.aborted) {
      return; // Browser already cleaned up
    }
    element.removeEventListener(eventType, handler, listenerOptions);
    
    // Clean up element queue to prevent memory leaks
    elementQueues.delete(element);
  };
}

/**
 * Extract event type from various input formats
 */
function getEventType(eventOrType: any): string {
  if (typeof eventOrType === 'string') {
    return eventOrType;
  } else if (eventOrType instanceof CustomEvent) {
    return eventOrType.type;
  } else if (eventOrType && typeof eventOrType === 'object' && 'type' in eventOrType) {
    return eventOrType.type;
  } else {
    throw new Error('Invalid event type');
  }
}

// ==================== UTILITY FUNCTIONS ====================



/**
 * Enhanced debounce function with leading/trailing edge support
 */
function debounce(func: (event: Event) => Promise<void>, options: number | { wait: number; leading?: boolean; trailing?: boolean }) {
  const config = typeof options === 'number' ? { wait: options, trailing: true } : { trailing: true, ...options };
  
  let timeout: number | undefined;
  let lastEvent: Event | null = null;
  let hasExecuted = false;
  
  return (event: Event) => {
    lastEvent = event;
    
    const callNow = config.leading && !hasExecuted;
    
    clearTimeout(timeout);
    
    if (callNow) {
      hasExecuted = true;
      func(event).catch(error => {
        console.error('Error in debounced event handler (leading):', error);
      });
    }
    
    timeout = setTimeout(() => {
      hasExecuted = false;
      if (config.trailing && lastEvent) {
        func(lastEvent).catch(error => {
          console.error('Error in debounced event handler (trailing):', error);
        });
      }
    }, config.wait) as unknown as number;
  };
}

/**
 * Enhanced throttle function with leading/trailing edge support
 */
function throttle(func: (event: Event) => Promise<void>, options: number | { limit: number; leading?: boolean; trailing?: boolean }) {
  const config = typeof options === 'number' ? { limit: options, leading: true } : { leading: true, ...options };
  
  let lastEvent: Event | null = null;
  let timeoutId: number | undefined;
  let lastExecution = 0;
  
  return (event: Event) => {
    lastEvent = event;
    const now = Date.now();
    
    const isLeadingEdge = now - lastExecution > config.limit;
    
    if (config.leading && isLeadingEdge) {
      lastExecution = now;
      func(event).catch(error => {
        console.error('Error in throttled event handler (leading):', error);
      });
    } else if (config.trailing) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (lastEvent && Date.now() - lastExecution >= config.limit) {
          lastExecution = Date.now();
          func(lastEvent!).catch(error => {
            console.error('Error in throttled event handler (trailing):', error);
          });
        }
      }, config.limit - (now - lastExecution)) as unknown as number;
    }
  };
}

// ==================== ENHANCED SHORTCUTS ====================

/**
 * Enhanced click function with all capabilities
 */
export function click<El extends HTMLElement>(
  element: El,
  handler: HybridEventHandler<El, 'click'>,
  options?: HybridEventOptions
): CleanupFunction;
export function click<El extends HTMLElement>(
  handler: HybridEventHandler<El, 'click'>,
  options?: HybridEventOptions
): ElementFn<El, CleanupFunction>;
export function click(...args: any[]): any {
  if (args.length >= 2 && args[0] && 'nodeType' in args[0]) {
    const [element, handler, options] = args;
    return on(element, 'click', handler, options);
  } else {
    const [handler, options] = args;
    return on('click', handler, options);
  }
}

export function input<El extends HTMLElement>(
  element: El,
  handler: HybridEventHandler<El, 'input'>,
  options?: HybridEventOptions
): CleanupFunction;
export function input<El extends HTMLElement>(
  handler: HybridEventHandler<El, 'input'>,
  options?: HybridEventOptions
): ElementFn<El, CleanupFunction>;
export function input(...args: any[]): any {
  if (args.length >= 2 && args[0] && 'nodeType' in args[0]) {
    const [element, handler, options] = args;
    return on(element, 'input', handler, options);
  } else {
    const [handler, options] = args;
    return on('input', handler, options);
  }
}

export function change<El extends HTMLElement>(
  element: El,
  handler: HybridEventHandler<El, 'change'>,
  options?: HybridEventOptions
): CleanupFunction;
export function change<El extends HTMLElement>(
  handler: HybridEventHandler<El, 'change'>,
  options?: HybridEventOptions
): ElementFn<El, CleanupFunction>;
export function change(...args: any[]): any {
  if (args.length >= 2 && args[0] && 'nodeType' in args[0]) {
    const [element, handler, options] = args;
    return on(element, 'change', handler, options);
  } else {
    const [handler, options] = args;
    return on('change', handler, options);
  }
}

export function submit<El extends HTMLElement>(
  element: El,
  handler: HybridEventHandler<El, 'submit'>,
  options?: HybridEventOptions
): CleanupFunction;
export function submit<El extends HTMLElement>(
  handler: HybridEventHandler<El, 'submit'>,
  options?: HybridEventOptions
): ElementFn<El, CleanupFunction>;
export function submit(...args: any[]): any {
  if (args.length >= 2 && args[0] && 'nodeType' in args[0]) {
    const [element, handler, options] = args;
    return on(element, 'submit', handler, options);
  } else {
    const [handler, options] = args;
    return on('submit', handler, options);
  }
}

// ==================== COMPOSITION UTILITIES ====================

/**
 * Create reusable event behavior
 */
export function createEventBehavior<K extends keyof HTMLElementEventMap>(
  eventType: K,
  behavior: HybridEventHandler<HTMLElement, K>,
  options?: HybridEventOptions
): () => Generator<ElementFn<HTMLElement, CleanupFunction>, void, unknown> {
  return function* () {
    yield on(eventType, behavior, options);
  };
}

/**
 * Compose multiple event handlers
 */
export function composeEventHandlers<K extends keyof HTMLElementEventMap>(
  ...handlers: HybridEventHandler<HTMLElement, K>[]
): HybridEventHandler<HTMLElement, K> {
  return async function* (event: HTMLElementEventMap[K], element?: HTMLElement) {
    for (const handler of handlers) {
      // Check handler arity for backward compatibility
      const result = handler.length >= 2 ? handler(event, element) : handler(event);
      
      if (result && typeof result === 'object' && 'next' in result) {
        // Handle generator results
        const generator = result as Generator<ElementFn<HTMLElement>, void, unknown>;
        let next = generator.next();
        while (!next.done) {
          yield next.value;
          next = generator.next();
        }
      } else if (result && typeof result === 'object' && 'then' in result) {
        // Handle promise results
        await (result as Promise<void>);
      }
    }
  };
}

/**
 * Event delegation helper
 */
export function delegate<K extends keyof HTMLElementEventMap>(
  selector: string,
  eventType: K,
  handler: HybridEventHandler<HTMLElement, K>,
  options?: Omit<HybridEventOptions, 'delegate'>
): ElementFn<HTMLElement, CleanupFunction> {
  return on(eventType, handler, { ...options, delegate: selector });
}

/**
 * Create typed CustomEvent helper
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
 * Emit custom event - hybrid version for backward compatibility
 */
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

// ==================== OBSERVER EVENTS ====================
// Observer events for complete event handling coverage

/**
 * Watch for attribute changes
 */
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

/**
 * Watch for text content changes
 */
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

/**
 * Watch for visibility changes
 */
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

/**
 * Watch for size changes
 */
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
            borderBoxSize: Array.from(entry.borderBoxSize),
            contentBoxSize: Array.from(entry.contentBoxSize),
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
              borderBoxSize: Array.from(entry.borderBoxSize),
              contentBoxSize: Array.from(entry.contentBoxSize),
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

/**
 * Element mount event
 */
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

// Global unmount handler storage - must be at module scope
const unmountHandlers = new WeakMap<HTMLElement, Set<(element: HTMLElement) => void>>();

/**
 * Helper to trigger unmount handlers when elements are removed
 */
export function triggerUnmountHandlers(element: HTMLElement): void {
  // Execute element-specific cleanup functions first
  executeCleanup(element);
  
  // Then trigger unmount handlers
  const handlers = unmountHandlers.get(element);
  if (handlers) {
    handlers.forEach(handler => handler(element));
    unmountHandlers.delete(element);
  }
}

/**
 * Element unmount event
 */
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
    unmountHandlers.get(element)!.add(handler as (element: HTMLElement) => void);
    
    return () => {
      unmountHandlers.get(element)?.delete(handler as (element: HTMLElement) => void);
    };
  } else {
    const [handler] = args as [(element: El) => void];
    
    return ((element: El) => {
      if (!unmountHandlers.has(element)) {
        unmountHandlers.set(element, new Set());
      }
      unmountHandlers.get(element)!.add(handler as (element: HTMLElement) => void);
      
      return () => {
        unmountHandlers.get(element)?.delete(handler as (element: HTMLElement) => void);
      };
    }) as ElementFn<El, CleanupFunction>;
  }
}
