/**
 * @fileoverview Generator Event Operations - Direct Workflow Functions for Event Handling
 *
 * This module provides Workflow<T> functions for event handling that can be used
 * directly with `yield*` syntax. These functions return async generators that yield
 * operations to be executed by the watch runtime.
 */

import type { Workflow, WatchContext } from "../types";
import { runOn } from "../watch";

/**
 * Add a click event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the click event listener
 */
export function click(
  handler:
    | ((event: MouseEvent) => void)
    | ((event: MouseEvent) => Promise<void>)
    | ((event: MouseEvent) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async (event: MouseEvent) => {
        const result = handler(event);
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it using runOn for proper context
          await runOn(context.element, () => result);
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      context.element.addEventListener("click", wrappedHandler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add an input event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the input event listener
 */
export function input(
  handler:
    | ((event: Event) => void)
    | ((event: Event) => Promise<void>)
    | ((event: Event) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async (event: Event) => {
        const result = handler(event);
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it using runOn for proper context
          await runOn(context.element, () => result);
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      context.element.addEventListener("input", wrappedHandler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a change event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the change event listener
 */
export function change(
  handler:
    | ((event: Event) => void)
    | ((event: Event) => Promise<void>)
    | ((event: Event) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async (event: Event) => {
        const result = handler(event);
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it using runOn for proper context
          await runOn(context.element, () => result);
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      context.element.addEventListener("change", wrappedHandler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a submit event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the submit event listener
 */
export function submit(
  handler:
    | ((event: SubmitEvent) => void)
    | ((event: SubmitEvent) => Promise<void>)
    | ((event: SubmitEvent) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async (event: SubmitEvent) => {
        const result = handler(event);
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it using runOn for proper context
          await runOn(context.element, () => result);
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      context.element.addEventListener("submit", wrappedHandler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a focus event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the focus event listener
 */
export function onFocus(
  handler: (event: FocusEvent) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.addEventListener("focus", handler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a blur event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the blur event listener
 */
export function onBlur(
  handler: (event: FocusEvent) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.addEventListener("blur", handler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a keydown event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the keydown event listener
 */
export function keydown(
  handler:
    | ((event: KeyboardEvent) => void)
    | ((event: KeyboardEvent) => Promise<void>)
    | ((event: KeyboardEvent) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async (event: KeyboardEvent) => {
        const result = handler(event);
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it properly
          for await (const workflow of result) {
            if (
              workflow &&
              typeof workflow === "object" &&
              Symbol.asyncIterator in workflow
            ) {
              // It's a workflow - execute it
              for await (const operation of workflow) {
                if (typeof operation === "function") {
                  await operation(context);
                }
              }
            } else if (typeof workflow === "function") {
              // It's a direct operation
              await workflow(context);
            }
          }
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      context.element.addEventListener("keydown", wrappedHandler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a keyup event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the keyup event listener
 */
export function keyup(
  handler: (event: KeyboardEvent) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.addEventListener("keyup", handler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a mouseenter event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the mouseenter event listener
 */
export function mouseenter(
  handler:
    | ((event: MouseEvent) => void)
    | ((event: MouseEvent) => Promise<void>)
    | ((event: MouseEvent) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async (event: MouseEvent) => {
        const result = handler(event);
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it properly
          for await (const workflow of result) {
            if (
              workflow &&
              typeof workflow === "object" &&
              Symbol.asyncIterator in workflow
            ) {
              // It's a workflow - execute it
              for await (const operation of workflow) {
                if (typeof operation === "function") {
                  await operation(context);
                }
              }
            } else if (typeof workflow === "function") {
              // It's a direct operation
              await workflow(context);
            }
          }
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      context.element.addEventListener("mouseenter", wrappedHandler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a mouseleave event listener
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the mouseleave event listener
 */
export function mouseleave(
  handler:
    | ((event: MouseEvent) => void)
    | ((event: MouseEvent) => Promise<void>)
    | ((event: MouseEvent) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async (event: MouseEvent) => {
        const result = handler(event);
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it properly
          for await (const workflow of result) {
            if (
              workflow &&
              typeof workflow === "object" &&
              Symbol.asyncIterator in workflow
            ) {
              // It's a workflow - execute it
              for await (const operation of workflow) {
                if (typeof operation === "function") {
                  await operation(context);
                }
              }
            } else if (typeof workflow === "function") {
              // It's a direct operation
              await workflow(context);
            }
          }
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      context.element.addEventListener("mouseleave", wrappedHandler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a generic event listener
 * @param eventType The event type to listen for
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the event listener
 */
export function on(
  eventType: string,
  handler:
    | ((event: Event) => void)
    | ((event: Event) => Promise<void>)
    | ((event: Event) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async (event: Event) => {
        const result = handler(event);
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it properly
          for await (const workflow of result) {
            if (
              workflow &&
              typeof workflow === "object" &&
              Symbol.asyncIterator in workflow
            ) {
              // It's a workflow - execute it
              for await (const operation of workflow) {
                if (typeof operation === "function") {
                  await operation(context);
                }
              }
            } else if (typeof workflow === "function") {
              // It's a direct operation
              await workflow(context);
            }
          }
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      context.element.addEventListener(eventType, wrappedHandler, options);
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a custom event listener
 * @param eventType The custom event type
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the custom event listener
 */
export function onCustom(
  eventType: string,
  handler: (event: CustomEvent) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.addEventListener(
        eventType,
        handler as EventListener,
        options,
      );
      return undefined;
    };
    return result;
  })();
}

/**
 * Emit a custom event
 * @param eventType The event type to emit
 * @param detail Optional event detail data
 * @param options Optional event init options
 * @returns Workflow that emits the event
 */
export function emit(
  eventType: string,
  detail?: any,
  options?: CustomEventInit,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const event = new CustomEvent(eventType, {
        detail,
        bubbles: options?.bubbles ?? true,
        cancelable: options?.cancelable ?? true,
        composed: options?.composed ?? false,
        ...options,
      });
      context.element.dispatchEvent(event);
      return undefined;
    };
    return result;
  })();
}

/**
 * Emit a generic event
 * @param event The event to emit
 * @returns Workflow that emits the event
 */
export function emitEvent(event: Event): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.dispatchEvent(event);
      return undefined;
    };
    return result;
  })();
}

/**
 * Watch for attribute changes
 * @param attributeName The attribute to watch
 * @param handler The change handler function
 * @returns Workflow that sets up attribute watching
 */
export function onAttr(
  attributeName: string,
  handler: (newValue: string | null, oldValue: string | null) => void,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (
            mutation.type === "attributes" &&
            mutation.attributeName === attributeName
          ) {
            const newValue = context.element.getAttribute(attributeName);
            const oldValue = mutation.oldValue;
            handler(newValue, oldValue);
          }
        });
      });

      observer.observe(context.element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: [attributeName],
      });

      return undefined;
    };
    return result;
  })();
}

/**
 * Watch for text content changes
 * @param handler The change handler function
 * @returns Workflow that sets up text watching
 */
export function onText(
  handler: (newText: string, oldText: string) => void,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      let oldText = context.element.textContent || "";

      const observer = new MutationObserver(() => {
        const newText = context.element.textContent || "";
        if (newText !== oldText) {
          handler(newText, oldText);
          oldText = newText;
        }
      });

      observer.observe(context.element, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return undefined;
    };
    return result;
  })();
}

/**
 * Watch for visibility changes
 * @param handler The visibility change handler function
 * @returns Workflow that sets up visibility watching
 */
export function onVisible(
  handler: (isVisible: boolean) => void,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          handler(entry.isIntersecting);
        });
      });

      observer.observe(context.element);
      return undefined;
    };
    return result;
  })();
}

/**
 * Watch for resize changes
 * @param handler The resize handler function
 * @returns Workflow that sets up resize watching
 */
export function onResize(
  handler: (entry: ResizeObserverEntry) => void,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.target === context.element) {
              handler(entry);
            }
          });
        });

        observer.observe(context.element);
      }
      return undefined;
    };
    return result;
  })();
}

/**
 * Add a mount event handler
 * @param handler The mount handler function
 * @returns Workflow that sets up the mount handler
 */
export function onMount(
  handler:
    | (() => void)
    | (() => Promise<void>)
    | (() => AsyncGenerator<any, void, any>),
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async () => {
        const result = handler();
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it properly
          for await (const workflow of result) {
            if (
              workflow &&
              typeof workflow === "object" &&
              Symbol.asyncIterator in workflow
            ) {
              // It's a workflow - execute it
              for await (const operation of workflow) {
                if (typeof operation === "function") {
                  await operation(context);
                }
              }
            } else if (typeof workflow === "function") {
              // It's a direct operation
              await workflow(context);
            }
          }
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      // If element is already in the DOM, call handler immediately
      if (document.contains(context.element)) {
        wrappedHandler();
      } else {
        // Set up a mutation observer to watch for when element is added
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (
                node === context.element ||
                (node as Element).contains?.(context.element)
              ) {
                wrappedHandler();
                observer.disconnect();
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });

        // Store observer for cleanup
        if (!(context as any).observers) {
          (context as any).observers = [];
        }
        (context as any).observers.push(observer);
      }

      return undefined;
    };
    return result;
  })();
}

/**
 * Add an unmount event handler
 * @param handler The unmount handler function
 * @returns Workflow that sets up the unmount handler
 */
export function onUnmount(
  handler:
    | (() => void)
    | (() => Promise<void>)
    | (() => AsyncGenerator<any, void, any>),
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async () => {
        const result = handler();
        if (
          result &&
          typeof result === "object" &&
          Symbol.asyncIterator in result
        ) {
          // It's an async generator - execute it properly
          for await (const workflow of result) {
            if (
              workflow &&
              typeof workflow === "object" &&
              Symbol.asyncIterator in workflow
            ) {
              // It's a workflow - execute it
              for await (const operation of workflow) {
                if (typeof operation === "function") {
                  await operation(context);
                }
              }
            } else if (typeof workflow === "function") {
              // It's a direct operation
              await workflow(context);
            }
          }
        } else if (result && typeof result.then === "function") {
          // It's a promise
          await result;
        }
      };

      // Set up a mutation observer to watch for when element is removed
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.removedNodes.forEach((node) => {
            if (
              node === context.element ||
              (node as Element).contains?.(context.element)
            ) {
              wrappedHandler();
              observer.disconnect();
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Store observer for cleanup
      const cleanup = () => observer.disconnect();
      if (!(context as any).cleanup) {
        (context as any).cleanup = new Set();
      }
      (context as any).cleanup.add(cleanup);

      return undefined;
    };
    return result;
  })();
}

/**
 * Add a one-time event listener
 * @param eventType The event type
 * @param handler The event handler function
 * @param options Optional event listener options
 * @returns Workflow that adds the one-time event listener
 */
export function once(
  eventType: string,
  handler: (event: Event) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.addEventListener(eventType, handler, {
        ...options,
        once: true,
      });
      return undefined;
    };
    return result;
  })();
}

/**
 * Prevent default on an event
 * @returns Workflow that creates a preventDefault handler
 */
export function preventDefault(): Workflow<(event: Event) => void> {
  return (async function* () {
    const result = yield () => {
      return (event: Event) => {
        event.preventDefault();
      };
    };
    return result;
  })();
}

/**
 * Stop propagation on an event
 * @returns Workflow that creates a stopPropagation handler
 */
export function stopPropagation(): Workflow<(event: Event) => void> {
  return (async function* () {
    const result = yield () => {
      return (event: Event) => {
        event.stopPropagation();
      };
    };
    return result;
  })();
}
