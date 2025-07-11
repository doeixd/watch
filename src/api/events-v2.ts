// Enhanced Event Handling v2 - Generator-First Design
// This is a redesigned version that's more elegant, composable, and aligned with Watch's philosophy

import type { 
  ElementFn, 
  ElementEventHandler,
  CustomEventHandler,
  WatchEventListenerOptions,
  CleanupFunction
} from '../types.ts';
import { executeGenerator } from '../core/context.ts';
import { debounceGenerator, throttleGenerator } from '../core/generator-utils.ts';

/**
 * # Redesigned `on()` Function - Generator-First Event Handling
 * 
 * The new design embraces Watch's generator philosophy, making event handlers
 * first-class citizens that can access the full Watch context and yield other functions.
 * 
 * ## Philosophy Changes:
 * 
 * 1. **Generator-First**: Event handlers can be generators with full context access
 * 2. **Composable**: Event handlers can yield other Watch functions
 * 3. **Simplified API**: Single, intuitive interface instead of 6 overloads
 * 4. **Type-Safe**: Better type inference and safety
 * 5. **Async-Native**: Built-in support for async operations
 * 
 * ## Examples:
 * 
 * ### Basic Usage (Backward Compatible)
 * ```typescript
 * watch('button', function* () {
 *   yield on('click', (event) => {
 *     console.log('Clicked!');
 *   });
 * });
 * ```
 * 
 * ### Generator Event Handlers (New!)
 * ```typescript
 * watch('button', function* () {
 *   yield on('click', function* (event) {
 *     // Full access to Watch context!
 *     const button = self();
 *     const siblings = all('.sibling');
 *     
 *     // Can yield other Watch functions!
 *     yield addClass('clicked');
 *     yield delay(200);
 *     yield removeClass('clicked');
 *     
 *     // State management works!
 *     const count = getState('clickCount') || 0;
 *     setState('clickCount', count + 1);
 *     yield text(`Clicked ${count + 1} times`);
 *   });
 * });
 * ```
 * 
 * ### Async Operations
 * ```typescript
 * watch('.data-button', function* () {
 *   yield on('click', async function* (event) {
 *     yield addClass('loading');
 *     
 *     try {
 *       const data = await fetch('/api/data');
 *       const result = await data.json();
 *       
 *       yield removeClass('loading');
 *       yield addClass('success');
 *       yield text(`Loaded: ${result.name}`);
 *     } catch (error) {
 *       yield removeClass('loading');
 *       yield addClass('error');
 *       yield text('Failed to load');
 *     }
 *   });
 * });
 * ```
 * 
 * ### Complex Interactions
 * ```typescript
 * watch('.interactive-card', function* () {
 *   yield on('mouseenter', function* (event) {
 *     yield addClass('hovered');
 *     yield style({ transform: 'scale(1.05)' });
 *     
 *     // Set up temporary listeners
 *     yield on('mouseleave', function* () {
 *       yield removeClass('hovered');
 *       yield style({ transform: 'scale(1)' });
 *     }, { once: true });
 *   });
 * });
 * ```
 */

// Enhanced event handler types
export type GeneratorEventHandler<El extends HTMLElement = HTMLElement, K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap> = 
  | ((event: HTMLElementEventMap[K]) => void | Promise<void>)
  | ((event: HTMLElementEventMap[K]) => Generator<ElementFn<El>, void, unknown>)
  | ((event: HTMLElementEventMap[K]) => AsyncGenerator<ElementFn<El>, void, unknown>);

export type CustomGeneratorEventHandler<El extends HTMLElement = HTMLElement, T = any> = 
  | ((event: CustomEvent<T>) => void | Promise<void>)
  | ((event: CustomEvent<T>) => Generator<ElementFn<El>, void, unknown>)
  | ((event: CustomEvent<T>) => AsyncGenerator<ElementFn<El>, void, unknown>);

// Event options for the new design
export interface EnhancedEventOptions extends Omit<AddEventListenerOptions, 'signal'> {
  /** Enable delegation - listen on parent and match against selector */
  delegate?: string;
  /** Debounce delay in milliseconds */
  debounce?: number;
  /** Throttle limit in milliseconds */
  throttle?: number;
  /** Filter function to conditionally handle events */
  filter?: (event: Event) => boolean;
  /** AbortSignal for cleanup */
  signal?: AbortSignal;
}

/**
 * Redesigned `on` function with generator-first design
 */
export function on<K extends keyof HTMLElementEventMap>(
  eventType: K,
  handler: GeneratorEventHandler<HTMLElement, K>,
  options?: EnhancedEventOptions
): ElementFn<HTMLElement, CleanupFunction>;

export function on<T = any>(
  eventType: string,
  handler: CustomGeneratorEventHandler<HTMLElement, T>,
  options?: EnhancedEventOptions
): ElementFn<HTMLElement, CleanupFunction>;

export function on<T = any>(
  customEvent: CustomEvent<T>,
  handler: CustomGeneratorEventHandler<HTMLElement, T>,
  options?: EnhancedEventOptions
): ElementFn<HTMLElement, CleanupFunction>;

// Implementation
export function on<El extends HTMLElement>(
  eventOrType: string | CustomEvent<any> | keyof HTMLElementEventMap,
  handler: any,
  options: EnhancedEventOptions = {}
): ElementFn<El, CleanupFunction> {
  
  return (element: El) => {
    // Determine event type
    let eventType: string;
    if (typeof eventOrType === 'string') {
      eventType = eventOrType;
    } else if (eventOrType instanceof CustomEvent) {
      eventType = eventOrType.type;
    } else {
      throw new Error('Invalid event type');
    }

    // Create the event handler that can execute generators in context
    const eventHandler = async (event: Event) => {
      // Apply filter if provided
      if (options.filter && !options.filter(event)) {
        return;
      }

      // Handle delegation
      if (options.delegate) {
        const target = event.target as HTMLElement;
        const delegateTarget = target?.closest?.(options.delegate);
        
        if (!delegateTarget || !element.contains(delegateTarget)) {
          return;
        }
      }

      try {
        const result = handler(event);
        
        // If handler returns a generator, execute it in the element's context
        if (result && typeof result.next === 'function') {
          await executeGenerator(
            element,
            eventType,
            0,
            [element],
            () => result as Generator<ElementFn<El>, void, unknown>
          );
        } else if (result && typeof result.then === 'function') {
          // Handle promise from async function
          await result;
        }
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    };

    // Apply debouncing or throttling if specified
    let finalHandler = eventHandler;
    if (options.debounce) {
      finalHandler = debounce(eventHandler, options.debounce);
    } else if (options.throttle) {
      finalHandler = throttle(eventHandler, options.throttle);
    }

    // Create clean addEventListener options
    const listenerOptions: AddEventListenerOptions = {
      capture: options.capture,
      once: options.once,
      passive: options.passive,
      signal: options.signal
    };

    // Add event listener
    element.addEventListener(eventType, finalHandler, listenerOptions);

    // Return cleanup function
    return () => {
      element.removeEventListener(eventType, finalHandler, listenerOptions);
    };
  };
}

// Helper functions for debouncing and throttling
function debounce(func: Function, wait: number) {
  let timeout: number | undefined;
  return async (...args: any[]) => {
    clearTimeout(timeout);
    return new Promise(resolve => {
      timeout = setTimeout(async () => {
        resolve(await func(...args));
      }, wait);
    });
  };
}

function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return async (...args: any[]) => {
    if (!inThrottle) {
      const result = await func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
      return result;
    }
  };
}

/**
 * Enhanced event composition utilities
 */

// Compose multiple event handlers
export function composeEventHandlers<K extends keyof HTMLElementEventMap>(
  ...handlers: GeneratorEventHandler<HTMLElement, K>[]
): GeneratorEventHandler<HTMLElement, K> {
  return function* (event) {
    for (const handler of handlers) {
      const result = handler(event);
      if (result && typeof result.next === 'function') {
        yield* result as Generator<ElementFn<HTMLElement>, void, unknown>;
      }
    }
  };
}

// Create reusable event behaviors
export function createEventBehavior<K extends keyof HTMLElementEventMap>(
  eventType: K,
  behavior: GeneratorEventHandler<HTMLElement, K>,
  options?: EnhancedEventOptions
) {
  return function* () {
    yield on(eventType, behavior, options);
  };
}

// Event delegation helper
export function delegate<K extends keyof HTMLElementEventMap>(
  selector: string,
  eventType: K,
  handler: GeneratorEventHandler<HTMLElement, K>,
  options?: Omit<EnhancedEventOptions, 'delegate'>
): ElementFn<HTMLElement, CleanupFunction> {
  return on(eventType, handler, { ...options, delegate: selector });
}

/**
 * Shortcut functions with enhanced capabilities
 */
export function click(
  handler: GeneratorEventHandler<HTMLElement, 'click'>,
  options?: EnhancedEventOptions
): ElementFn<HTMLElement, CleanupFunction> {
  return on('click', handler, options);
}

export function input(
  handler: GeneratorEventHandler<HTMLElement, 'input'>,
  options?: EnhancedEventOptions
): ElementFn<HTMLElement, CleanupFunction> {
  return on('input', handler, options);
}

export function change(
  handler: GeneratorEventHandler<HTMLElement, 'change'>,
  options?: EnhancedEventOptions
): ElementFn<HTMLElement, CleanupFunction> {
  return on('change', handler, options);
}

export function submit(
  handler: GeneratorEventHandler<HTMLElement, 'submit'>,
  options?: EnhancedEventOptions
): ElementFn<HTMLElement, CleanupFunction> {
  return on('submit', handler, options);
}
