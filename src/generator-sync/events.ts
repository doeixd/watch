/**
 * @fileoverview Synchronous event handling operations for the generator submodule
 *
 * This module provides synchronous event handling operations that return SyncWorkflow<T>
 * directly, enabling efficient event handling in sync generators without async overhead.
 *
 * @example Basic Event Handling with Sync Generators
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { click, addClass, removeClass } from 'watch-selector/generator-sync';
 *
 * watch('.button', function*() {  // Note: sync function*, not async
 *   yield* click(function*() {
 *     yield* addClass('clicked');
 *     yield* removeClass('hover');
 *   });
 * });
 * ```
 *
 * @module generator-sync/events
 */

import type { SyncWorkflow, WatchContext, Operation } from "../types";

// ============================================================================
// BASIC EVENT OPERATIONS
// ============================================================================

/**
 * Attaches a click event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 *
 * @example Click handler with sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { click, toggleClass, setText } from 'watch-selector/generator-sync';
 *
 * watch('.toggle-button', function*() {
 *   yield* click(function*(event) {
 *     const isActive = yield* toggleClass('active');
 *     yield* setText(isActive ? 'ON' : 'OFF');
 *   });
 * });
 * ```
 */
export function click(
  handler: ((event: MouseEvent) => void) | ((event: MouseEvent) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: MouseEvent) => {
        const result = handler(event);

        // If handler returns a generator, execute it
        if (result && typeof result[Symbol.iterator] === 'function') {
          // Execute the generator in the element's context
          // This would integrate with the watch runtime
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            // Execute yielded operations
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('click', wrappedHandler);

      // Register cleanup
      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('click', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches an input event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 *
 * @example Input validation with sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { input, getValue, addClass, removeClass } from 'watch-selector/generator-sync';
 *
 * watch('input[type="email"]', function*() {
 *   yield* input(function*() {
 *     const value = yield* getValue();
 *     if (value.includes('@')) {
 *       yield* addClass('valid');
 *       yield* removeClass('invalid');
 *     } else {
 *       yield* addClass('invalid');
 *       yield* removeClass('valid');
 *     }
 *   });
 * });
 * ```
 */
export function input(
  handler: ((event: Event) => void) | ((event: Event) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: Event) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('input', wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('input', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches a change event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 */
export function change(
  handler: ((event: Event) => void) | ((event: Event) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: Event) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('change', wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('change', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches a submit event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 *
 * @example Form submission with sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { submit, queryAll, getValue } from 'watch-selector/generator-sync';
 *
 * watch('form', function*() {
 *   yield* submit(function*(event) {
 *     event.preventDefault();
 *
 *     const inputs = yield* queryAll('input');
 *     const data = {};
 *     for (const input of inputs) {
 *       data[input.name] = input.value;
 *     }
 *
 *     console.log('Form data:', data);
 *   });
 * });
 * ```
 */
export function submit(
  handler: ((event: Event) => void) | ((event: Event) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: Event) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('submit', wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('submit', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches a focus event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 */
export function onFocus(
  handler: ((event: FocusEvent) => void) | ((event: FocusEvent) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: FocusEvent) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('focus', wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('focus', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches a blur event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 */
export function onBlur(
  handler: ((event: FocusEvent) => void) | ((event: FocusEvent) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: FocusEvent) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('blur', wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('blur', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches a keydown event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 */
export function keydown(
  handler: ((event: KeyboardEvent) => void) | ((event: KeyboardEvent) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: KeyboardEvent) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('keydown', wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('keydown', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches a keyup event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 */
export function keyup(
  handler: ((event: KeyboardEvent) => void) | ((event: KeyboardEvent) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: KeyboardEvent) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('keyup', wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('keyup', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches a mouseenter event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 */
export function mouseenter(
  handler: ((event: MouseEvent) => void) | ((event: MouseEvent) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: MouseEvent) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('mouseenter', wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('mouseenter', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches a mouseleave event handler using the sync generator API.
 *
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 */
export function mouseleave(
  handler: ((event: MouseEvent) => void) | ((event: MouseEvent) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: MouseEvent) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener('mouseleave', wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener('mouseleave', wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

// ============================================================================
// GENERIC EVENT OPERATIONS
// ============================================================================

/**
 * Attaches a generic event handler using the sync generator API.
 *
 * @param eventName - Name of the event to listen for
 * @param handler - Event handler that can be a regular function or sync generator
 * @param options - Optional event listener options
 * @returns A SyncWorkflow<void> that attaches the event handler
 *
 * @example Custom event handling
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { on, addClass } from 'watch-selector/generator-sync';
 *
 * watch('.draggable', function*() {
 *   yield* on('dragstart', function*(event) {
 *     yield* addClass('dragging');
 *   });
 *
 *   yield* on('dragend', function*(event) {
 *     yield* removeClass('dragging');
 *   });
 * });
 * ```
 */
export function on(
  eventName: string,
  handler: ((event: Event) => void) | ((event: Event) => Generator<any, void, any>),
  options?: AddEventListenerOptions
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: Event) => {
        const result = handler(event);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener(eventName, wrappedHandler, options);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener(eventName, wrappedHandler, options);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Attaches a custom event handler using the sync generator API.
 *
 * @param eventName - Name of the custom event
 * @param handler - Event handler that can be a regular function or sync generator
 * @returns A SyncWorkflow<void> that attaches the event handler
 */
export function onCustom<T = any>(
  eventName: string,
  handler: ((event: CustomEvent<T>) => void) | ((event: CustomEvent<T>) => Generator<any, void, any>)
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const wrappedHandler = (event: Event) => {
        const customEvent = event as CustomEvent<T>;
        const result = handler(customEvent);

        if (result && typeof result[Symbol.iterator] === 'function') {
          const gen = result as Generator<any, void, any>;
          let genResult = gen.next();
          while (!genResult.done) {
            if (typeof genResult.value === 'function') {
              genResult.value(context);
            }
            genResult = gen.next();
          }
        }
      };

      context.element.addEventListener(eventName, wrappedHandler);

      if (context.cleanup) {
        context.cleanup(() => {
          context.element.removeEventListener(eventName, wrappedHandler);
        });
      }
    }) as Operation<void>;
  })();
}

// ============================================================================
// EVENT EMISSION OPERATIONS
// ============================================================================

/**
 * Emits a custom event from the current element.
 *
 * @param eventName - Name of the event to emit
 * @param detail - Optional detail data for the event
 * @returns A SyncWorkflow<void> that emits the event
 */
export function emit<T = any>(eventName: string, detail?: T): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const event = new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true,
      });
      context.element.dispatchEvent(event);
    }) as Operation<void>;
  })();
}

/**
 * Emits a pre-configured event from the current element.
 *
 * @param event - The event to dispatch
 * @returns A SyncWorkflow<void> that emits the event
 */
export function emitEvent(event: Event): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.dispatchEvent(event);
    }) as Operation<void>;
  })();
}

// ============================================================================
// OBSERVER EVENT OPERATIONS
// ============================================================================

/**
 * Watches for attribute changes on the element.
 *
 * @param attributeName - Name of the attribute to watch
 * @param handler - Handler called when attribute changes
 * @returns A SyncWorkflow<void> that sets up the observer
 */
export function onAttr(
  attributeName: string,
  handler: (oldValue: string | null, newValue: string | null) => void
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === attributeName) {
            const newValue = context.element.getAttribute(attributeName);
            handler(mutation.oldValue, newValue);
          }
        }
      });

      observer.observe(context.element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: [attributeName],
      });

      if (context.cleanup) {
        context.cleanup(() => observer.disconnect());
      }
    }) as Operation<void>;
  })();
}

/**
 * Watches for text content changes on the element.
 *
 * @param handler - Handler called when text changes
 * @returns A SyncWorkflow<void> that sets up the observer
 */
export function onText(
  handler: (oldText: string, newText: string) => void
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      let oldText = context.element.textContent || '';

      const observer = new MutationObserver(() => {
        const newText = context.element.textContent || '';
        if (newText !== oldText) {
          handler(oldText, newText);
          oldText = newText;
        }
      });

      observer.observe(context.element, {
        characterData: true,
        childList: true,
        subtree: true,
      });

      if (context.cleanup) {
        context.cleanup(() => observer.disconnect());
      }
    }) as Operation<void>;
  })();
}

/**
 * Watches for visibility changes using IntersectionObserver.
 *
 * @param handler - Handler called when visibility changes
 * @param options - Intersection observer options
 * @returns A SyncWorkflow<void> that sets up the observer
 */
export function onVisible(
  handler: (isVisible: boolean, entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          handler(entry.isIntersecting, entry);
        }
      }, options);

      observer.observe(context.element);

      if (context.cleanup) {
        context.cleanup(() => observer.disconnect());
      }
    }) as Operation<void>;
  })();
}

/**
 * Watches for element resize using ResizeObserver.
 *
 * @param handler - Handler called when element resizes
 * @returns A SyncWorkflow<void> that sets up the observer
 */
export function onResize(
  handler: (entry: ResizeObserverEntry) => void
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          handler(entry);
        }
      });

      observer.observe(context.element);

      if (context.cleanup) {
        context.cleanup(() => observer.disconnect());
      }
    }) as Operation<void>;
  })();
}

// ============================================================================
// LIFECYCLE EVENT OPERATIONS
// ============================================================================

/**
 * Runs a handler when the element is mounted (connected to DOM).
 *
 * @param handler - Handler to run on mount
 * @returns A SyncWorkflow<void> that runs the handler
 */
export function onMount(handler: () => void): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      // Run immediately if element is already in DOM
      if (context.element.isConnected) {
        handler();
      }
      // Note: For elements not yet connected, this would need integration
      // with the watch system's mount detection
    }) as Operation<void>;
  })();
}

/**
 * Registers a handler to run when the element is unmounted (removed from DOM).
 *
 * @param handler - Handler to run on unmount
 * @returns A SyncWorkflow<void> that registers the cleanup handler
 */
export function onUnmount(handler: () => void): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      if (context.cleanup) {
        context.cleanup(handler);
      }
    }) as Operation<void>;
  })();
}

// ============================================================================
// UTILITY EVENT OPERATIONS
// ============================================================================

/**
 * Attaches an event handler that only fires once.
 *
 * @param eventName - Name of the event
 * @param handler - Event handler
 * @returns A SyncWorkflow<void> that attaches the one-time handler
 */
export function once(
  eventName: string,
  handler: (event: Event) => void
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.addEventListener(eventName, handler, { once: true });
    }) as Operation<void>;
  })();
}

/**
 * Prevents default behavior for an event.
 *
 * @param event - The event to prevent
 * @returns A SyncWorkflow<void> that prevents the default
 */
export function preventDefault(event: Event): SyncWorkflow<void> {
  return (function* () {
    yield (() => {
      event.preventDefault();
    }) as Operation<void>;
  })();
}

/**
 * Stops event propagation.
 *
 * @param event - The event to stop
 * @returns A SyncWorkflow<void> that stops propagation
 */
export function stopPropagation(event: Event): SyncWorkflow<void> {
  return (function* () {
    yield (() => {
      event.stopPropagation();
    }) as Operation<void>;
  })();
}

// ============================================================================
// MISSING DOM OPERATIONS FOR SYNC CONTEXT
// ============================================================================

/**
 * Gets the parent element.
 *
 * @returns A SyncWorkflow that returns the parent element or null
 */
export function parent<T extends HTMLElement = HTMLElement>(): SyncWorkflow<T | null> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.parentElement as T | null;
    }) as Operation<T | null>;
    return result as T | null;
  })();
}

/**
 * Gets all child elements.
 *
 * @returns A SyncWorkflow that returns an array of child elements
 */
export function children<T extends HTMLElement = HTMLElement>(): SyncWorkflow<T[]> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return Array.from(context.element.children) as T[];
    }) as Operation<T[]>;
    return result as T[];
  })();
}

/**
 * Gets all sibling elements.
 *
 * @returns A SyncWorkflow that returns an array of sibling elements
 */
export function siblings<T extends HTMLElement = HTMLElement>(): SyncWorkflow<T[]> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      const parent = context.element.parentElement;
      if (!parent) return [];

      return Array.from(parent.children).filter(
        child => child !== context.element
      ) as T[];
    }) as Operation<T[]>;
    return result as T[];
  })();
}
