/**
 * @fileoverview Generator Event Operations - Direct Workflow Functions for Event Handling
 *
 * This module provides Workflow<T> functions for event handling that can be used
 * directly with `yield*` syntax. These functions return async generators that yield
 * operations to be executed by the watch runtime.
 *
 * ## Event Handler Types
 *
 * Event handlers in the generator module support three patterns:
 * 1. **Regular functions**: `(event) => void`
 * 2. **Async functions**: `async (event) => void`
 * 3. **Generator functions**: `async function* (event) { ... }`
 *
 * Generator event handlers are particularly powerful as they can yield other
 * operations within the event handler, maintaining full type safety and context.
 *
 * @example Basic Event Handling
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { click, text, addClass } from 'watch-selector/generator';
 *
 * watch('button', async function* () {
 *   // Simple click handler
 *   yield* click(() => {
 *     console.log('Button clicked!');
 *   });
 *
 *   // Generator-based handler with DOM operations
 *   yield* click(async function* (event) {
 *     yield* text('Clicked!');
 *     yield* addClass('active');
 *   });
 * });
 * ```
 *
 * @example Form Event Handling
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { input, change, submit, getValue, setText } from 'watch-selector/generator';
 *
 * watch('form', async function* () {
 *   yield* input('input[type="text"]', async function* (event) {
 *     const value = yield* getValue();
 *     yield* setText('.preview', value);
 *   });
 *
 *   yield* submit(async function* (event) {
 *     event.preventDefault();
 *     // Handle form submission
 *   });
 * });
 * ```
 *
 * @module generator/events
 */

import type { Workflow, WatchContext, Operation } from "../types";
import { runOn } from "../watch";

/**
 * Adds a click event listener to an element using the pure generator API.
 *
 * This function attaches a click event handler that can be a regular function,
 * async function, or a generator function. Generator handlers are particularly
 * powerful as they can yield additional operations within the event handler.
 *
 * @param handler - The event handler function that receives the MouseEvent
 * @param options - Optional event listener options (capture, once, passive, etc.)
 * @returns A Workflow<void> that adds the click listener when yielded
 *
 * @example Basic click handler
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { click, text } from 'watch-selector/generator';
 *
 * watch('button', async function* () {
 *   yield* click(() => {
 *     console.log('Button clicked!');
 *   });
 * });
 * ```
 *
 * @example Click handler with DOM updates
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { click, text, addClass, removeClass, getState, setState } from 'watch-selector/generator';
 *
 * watch('.toggle-button', async function* () {
 *   yield* click(async function* (event) {
 *     event.preventDefault();
 *
 *     // Toggle state
 *     const isActive = yield* getState('active', false);
 *     yield* setState('active', !isActive);
 *
 *     // Update UI
 *     if (!isActive) {
 *       yield* addClass('active');
 *       yield* text('Active');
 *     } else {
 *       yield* removeClass('active');
 *       yield* text('Inactive');
 *     }
 *   });
 * });
 * ```
 *
 * @example Click counter with state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { click, text, updateState } from 'watch-selector/generator';
 *
 * watch('.counter-button', async function* () {
 *   yield* text('Clicks: 0');
 *
 *   yield* click(async function* () {
 *     const count = yield* updateState<number>('clicks', (c = 0) => c + 1);
 *     yield* text(`Clicks: ${count}`);
 *   });
 * });
 * ```
 *
 * @example Double-click prevention
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { click, prop, delay } from 'watch-selector/generator';
 *
 * watch('.submit-button', async function* () {
 *   yield* click(async function* (event) {
 *     const button = event.target as HTMLButtonElement;
 *
 *     // Disable to prevent double-clicks
 *     yield* prop('disabled', true);
 *     yield* text('Processing...');
 *
 *     // Simulate async operation
 *     yield* delay(2000);
 *
 *     // Re-enable
 *     yield* prop('disabled', false);
 *     yield* text('Submit');
 *   });
 * });
 * ```
 *
 * @see {@link input} - For handling input events
 * @see {@link change} - For handling change events
 * @see {@link submit} - For handling form submission
 */
export function click(
  handler:
    | ((event: MouseEvent) => void)
    | ((event: MouseEvent) => Promise<void>)
    | ((event: MouseEvent) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
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
    }) as Operation<void>;
  })();
}

/**
 * Adds an input event listener to an element using the pure generator API.
 *
 * The input event fires synchronously when the value of an input, select, or
 * textarea element changes. Unlike the change event, it fires immediately
 * after each modification.
 *
 * @param handler - The event handler function that receives the Event
 * @param options - Optional event listener options
 * @returns A Workflow<void> that adds the input listener when yielded
 *
 * @example Real-time search
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { input, getValue, queryAll, toggleClass } from 'watch-selector/generator';
 *
 * watch('input.search', async function* () {
 *   yield* input(async function* (event) {
 *     const searchTerm = yield* getValue();
 *     const items = yield* queryAll('.search-item');
 *
 *     for (const item of items) {
 *       const text = item.textContent?.toLowerCase() || '';
 *       const matches = text.includes(searchTerm.toLowerCase());
 *       yield* toggleClass(item, 'hidden', !matches);
 *     }
 *   });
 * });
 * ```
 *
 * @example Character counter
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { input, getValue, text, toggleClass } from 'watch-selector/generator';
 *
 * watch('textarea.limited', async function* () {
 *   const maxLength = 280;
 *
 *   yield* input(async function* () {
 *     const content = yield* getValue();
 *     const remaining = maxLength - content.length;
 *
 *     yield* text(`.counter`, `${remaining} characters remaining`);
 *     yield* toggleClass('over-limit', remaining < 0);
 *   });
 * });
 * ```
 *
 * @example Form validation
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { input, getValue, addClass, removeClass, attr } from 'watch-selector/generator';
 *
 * watch('input[type="email"]', async function* () {
 *   yield* input(async function* (event) {
 *     const input = event.target as HTMLInputElement;
 *     const isValid = input.checkValidity();
 *
 *     if (isValid) {
 *       yield* removeClass('invalid');
 *       yield* addClass('valid');
 *       yield* attr('aria-invalid', 'false');
 *     } else {
 *       yield* removeClass('valid');
 *       yield* addClass('invalid');
 *       yield* attr('aria-invalid', 'true');
 *     }
 *   });
 * });
 * ```
 *
 * @example Debounced input handling
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { input, getValue, delay, text } from 'watch-selector/generator';
 *
 * watch('input.debounced', async function* () {
 *   let timeoutId: any;
 *
 *   yield* input(async function* () {
 *     clearTimeout(timeoutId);
 *
 *     yield* text('.status', 'Typing...');
 *
 *     // Debounce logic
 *     await new Promise(resolve => {
 *       timeoutId = setTimeout(resolve, 500);
 *     });
 *
 *     const value = yield* getValue();
 *     yield* text('.status', `Saved: ${value}`);
 *   });
 * });
 * ```
 *
 * @see {@link change} - For handling value changes on blur
 * @see {@link click} - For handling click events
 */
export function input(
  handler:
    | ((event: Event) => void)
    | ((event: Event) => Promise<void>)
    | ((event: Event) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
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
    }) as Operation<void>;
  })();
}

/**
 * Adds a change event listener to an element using the pure generator API.
 *
 * The change event fires when an element loses focus after its value has been
 * changed. For input elements, this happens when the user commits the change
 * (e.g., by pressing Enter or clicking elsewhere).
 *
 * @param handler - The event handler function that receives the Event
 * @param options - Optional event listener options
 * @returns A Workflow<void> that adds the change listener when yielded
 *
 * @example Select dropdown handling
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { change, getValue, text, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('select.theme-selector', async function* () {
 *   yield* change(async function* (event) {
 *     const theme = yield* getValue();
 *
 *     // Update body classes
 *     const body = document.body;
 *     yield* removeClass(body, 'theme-light theme-dark theme-auto');
 *     yield* addClass(body, `theme-${theme}`);
 *
 *     // Update display
 *     yield* text('.current-theme', `Current theme: ${theme}`);
 *   });
 * });
 * ```
 *
 * @example Checkbox state handling
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { change, isChecked, setState, toggleClass } from 'watch-selector/generator';
 *
 * watch('input[type="checkbox"].toggle-feature', async function* () {
 *   yield* change(async function* () {
 *     const checked = yield* isChecked();
 *
 *     yield* setState('featureEnabled', checked);
 *     yield* toggleClass(document.body, 'feature-enabled', checked);
 *
 *     console.log(`Feature ${checked ? 'enabled' : 'disabled'}`);
 *   });
 * });
 * ```
 *
 * @example Radio button group
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { change, getValue, queryAll, removeClass, addClass } from 'watch-selector/generator';
 *
 * watch('input[type="radio"][name="view-mode"]', async function* () {
 *   yield* change(async function* (event) {
 *     const input = event.target as HTMLInputElement;
 *     const mode = input.value;
 *
 *     // Update view containers
 *     const containers = yield* queryAll('.view-container');
 *     for (const container of containers) {
 *       yield* removeClass(container, 'active');
 *       if (container.classList.contains(`view-${mode}`)) {
 *         yield* addClass(container, 'active');
 *       }
 *     }
 *   });
 * });
 * ```
 *
 * @see {@link input} - For real-time input handling
 * @see {@link submit} - For form submission handling
 */
export function change(
  handler:
    | ((event: Event) => void)
    | ((event: Event) => Promise<void>)
    | ((event: Event) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
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
    }) as Operation<void>;
  })();
}

/**
 * Adds a submit event listener to a form element using the pure generator API.
 *
 * The submit event fires when a form is submitted. Remember to call
 * event.preventDefault() if you want to handle the submission with JavaScript
 * instead of the default browser behavior.
 *
 * @param handler - The event handler function that receives the SubmitEvent
 * @param options - Optional event listener options
 * @returns A Workflow<void> that adds the submit listener when yielded
 *
 * @example Basic form submission
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { submit, getValue, prop, text, addClass } from 'watch-selector/generator';
 *
 * watch('form.contact-form', async function* () {
 *   yield* submit(async function* (event) {
 *     event.preventDefault();
 *
 *     // Disable form during submission
 *     const button = event.submitter as HTMLButtonElement;
 *     yield* prop(button, 'disabled', true);
 *     yield* text(button, 'Sending...');
 *
 *     // Get form data
 *     const formData = new FormData(event.target as HTMLFormElement);
 *
 *     try {
 *       // Submit form data
 *       await fetch('/api/contact', {
 *         method: 'POST',
 *         body: formData
 *       });
 *
 *       yield* addClass('success');
 *       yield* text('.message', 'Message sent successfully!');
 *     } catch (error) {
 *       yield* addClass('error');
 *       yield* text('.message', 'Failed to send message');
 *     } finally {
 *       yield* prop(button, 'disabled', false);
 *       yield* text(button, 'Send');
 *     }
 *   });
 * });
 * ```
 *
 * @example Form validation before submission
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { submit, queryAll, hasClass, addClass, text } from 'watch-selector/generator';
 *
 * watch('form.validated-form', async function* () {
 *   yield* submit(async function* (event) {
 *     event.preventDefault();
 *
 *     // Check required fields
 *     const requiredFields = yield* queryAll('input[required]');
 *     let isValid = true;
 *
 *     for (const field of requiredFields) {
 *       const input = field as HTMLInputElement;
 *       if (!input.value.trim()) {
 *         yield* addClass(field, 'error');
 *         isValid = false;
 *       } else {
 *         yield* removeClass(field, 'error');
 *       }
 *     }
 *
 *     if (!isValid) {
 *       yield* text('.form-error', 'Please fill in all required fields');
 *       return;
 *     }
 *
 *     // Proceed with submission
 *     const form = event.target as HTMLFormElement;
 *     form.submit();
 *   });
 * });
 * ```
 *
 * @example AJAX form with progress tracking
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { submit, style, text, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('form.upload-form', async function* () {
 *   yield* submit(async function* (event) {
 *     event.preventDefault();
 *
 *     const form = event.target as HTMLFormElement;
 *     const formData = new FormData(form);
 *
 *     // Show progress bar
 *     yield* removeClass('.progress-bar', 'hidden');
 *
 *     const xhr = new XMLHttpRequest();
 *
 *     // Track upload progress
 *     xhr.upload.addEventListener('progress', async (e) => {
 *       if (e.lengthComputable) {
 *         const percentComplete = (e.loaded / e.total) * 100;
 *         yield* style('.progress-fill', 'width', `${percentComplete}%`);
 *         yield* text('.progress-text', `${Math.round(percentComplete)}%`);
 *       }
 *     });
 *
 *     xhr.open('POST', '/upload');
 *     xhr.send(formData);
 *   });
 * });
 * ```
 *
 * @see {@link input} - For handling individual field changes
 * @see {@link change} - For handling field value changes
 * @see {@link click} - For handling button clicks
 */
export function submit(
  handler:
    | ((event: SubmitEvent) => void)
    | ((event: SubmitEvent) => Promise<void>)
    | ((event: SubmitEvent) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
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
    }) as Operation<void>;
  })();
}

/**
 * Attach a focus event listener to the current watch context element.
 *
 * The provided `handler` is called with the FocusEvent when the element receives focus.
 * The handler may be synchronous or return a Promise; generator-based handlers are not run via the watch runtime.
 *
 * @param handler - Function invoked on `focus` with the event
 * @param options - Optional AddEventListenerOptions forwarded to `addEventListener`
 * @returns A Workflow that registers the focus listener on the context element
 */
export function onFocus(
  handler: (event: FocusEvent) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.addEventListener("focus", handler, options);
    }) as Operation<void>;
  })();
}

/**
 * Attach a "blur" event listener to the element from the current watch context.
 *
 * The provided `handler` is called with the FocusEvent when the element loses focus.
 * If `handler` returns a Promise it will be awaited; generator-style handlers are not
 * executed via the watch runtime. Any exceptions thrown by the handler propagate to callers.
 *
 * @param handler - Function invoked on blur; may be synchronous or return a Promise.
 * @param options - Optional AddEventListenerOptions passed through to addEventListener.
 * @returns A Workflow that, when yielded, registers the listener on the current element.
 */
export function onBlur(
  handler: (event: FocusEvent) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.addEventListener("blur", handler, options);
    }) as Operation<void>;
  })();
}

/**
 * Creates a workflow that attaches a `keydown` listener to the current watch context element.
 *
 * The provided `handler` may be synchronous, return a `Promise`, or be an async generator.
 * If it returns an async generator, the generator is executed with `runOn` bound to the element so it runs in the watch runtime; if it returns a `Promise` it is awaited. Errors thrown by the handler propagate to the caller.
 *
 * @param handler - Function invoked with the `KeyboardEvent`. Can be:
 *   - a synchronous handler,
 *   - an async function returning a `Promise<void>`,
 *   - or an async generator (executed via `runOn`).
 * @param options - Optional `AddEventListenerOptions` forwarded to `addEventListener`.
 * @returns A `Workflow<void>` that, when run, attaches the keydown listener to the element from the current `WatchContext`.
 */
export function keydown(
  handler:
    | ((event: KeyboardEvent) => void)
    | ((event: KeyboardEvent) => Promise<void>)
    | ((event: KeyboardEvent) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async (event: KeyboardEvent) => {
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

      context.element.addEventListener("keydown", wrappedHandler, options);
    }) as Operation<void>;
  })();
}

/**
 * Returns a workflow that attaches a `keyup` listener to the current watch context's element.
 *
 * The provided `handler` will be invoked with the `KeyboardEvent` when a `keyup` occurs on the element.
 * If the handler returns a `Promise`, it will be awaited; generator-based handlers are not run via the watch runtime.
 *
 * @param handler - Function called with the `KeyboardEvent`. May return a `Promise<void>` for asynchronous handling.
 * @param options - Optional `AddEventListenerOptions` forwarded to `addEventListener`.
 */
export function keyup(
  handler: (event: KeyboardEvent) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.addEventListener("keyup", handler, options);
    }) as Operation<void>;
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
    yield ((context: WatchContext) => {
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

      context.element.addEventListener("mouseenter", wrappedHandler, options);
    }) as Operation<void>;
  })();
}

/**
 * Attach a "mouseleave" listener to the current watch context element.
 *
 * The provided `handler` may be synchronous, return a Promise, or be an async generator.
 * If it returns an async generator, it will be executed with the watch runtime (via `runOn`)
 * so it runs with the element's context. If it returns a Promise the promise is awaited.
 * Errors from the handler propagate to the caller/runtime.
 *
 * @param handler - Function invoked when the element receives a `mouseleave` event.
 *                   Can be sync, return a `Promise<void>`, or return an `AsyncGenerator`.
 * @param options - Optional `AddEventListenerOptions` passed to `addEventListener`.
 * @returns A Workflow that, when yielded, registers the event listener on the current element.
 */
export function mouseleave(
  handler:
    | ((event: MouseEvent) => void)
    | ((event: MouseEvent) => Promise<void>)
    | ((event: MouseEvent) => AsyncGenerator<any, void, any>),
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
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

      context.element.addEventListener("mouseleave", wrappedHandler, options);
    }) as Operation<void>;
  })();
}

/**
 * Attaches an event listener for the specified event type to the current watch context's element.
 *
 * The handler may be synchronous, return a Promise, or return an AsyncGenerator. If the handler
 * returns an async generator, it will be executed with the element's runtime via `runOn`.
 *
 * @param eventType - DOM event name (e.g., `"click"`, `"input"`).
 * @param handler - Function called with the event; may return `void`, a `Promise<void>`, or an `AsyncGenerator`.
 * @param options - Optional `AddEventListenerOptions` forwarded to `addEventListener`.
 * @returns A `Workflow<void>` that, when yielded, adds the listener to the current element.
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
    yield ((context: WatchContext) => {
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

      context.element.addEventListener(eventType, wrappedHandler, options);
    }) as Operation<void>;
  })();
}

/**
 * Attach a listener for a typed CustomEvent on the current watch context element.
 *
 * The provided `handler` is called with the dispatched `CustomEvent`. If the
 * handler returns a Promise it will be awaited by the runtime; exceptions
 * propagate to the caller. The listener is registered on `context.element`
 * with the given `options`.
 *
 * @param eventType - Name of the custom event to listen for.
 * @param handler - Handler that receives the `CustomEvent`.
 * @param options - Optional `AddEventListenerOptions` forwarded to `addEventListener`.
 * @returns A Workflow that, when yielded, attaches the event listener to the current element.
 */
export function onCustom(
  eventType: string,
  handler: (event: CustomEvent) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.addEventListener(
        eventType,
        handler as EventListener,
        options,
      );
    }) as Operation<void>;
  })();
}

/**
 * Emit a CustomEvent from the current watch context's element.
 *
 * The created CustomEvent uses the provided `detail` and merges `options`
 * with defaults: `bubbles: true`, `cancelable: true`, `composed: false`.
 * Any fields present in `options` override these defaults. The event is
 * dispatched synchronously on the context's element.
 *
 * @param eventType - Name of the custom event to dispatch.
 * @param detail - Optional payload assigned to `event.detail`.
 * @param options - Optional CustomEventInit to control bubbles, cancelable, composed, etc.
 * @returns A Workflow that, when yielded, dispatches the constructed CustomEvent.
 */
export function emit(
  eventType: string,
  detail?: any,
  options?: CustomEventInit,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      const event = new CustomEvent(eventType, {
        detail,
        bubbles: options?.bubbles ?? true,
        cancelable: options?.cancelable ?? true,
        composed: options?.composed ?? false,
        ...options,
      });
      context.element.dispatchEvent(event);
    }) as Operation<void>;
  })();
}

/**
 * Dispatches the provided Event on the current watch context element.
 *
 * The event is synchronously dispatched via `element.dispatchEvent(event)` when the yielded
 * operation is executed by the watch runtime.
 *
 * @param event - The Event instance to dispatch on the context's element.
 * @returns A Workflow that, when run, dispatches `event` on the current element.
 */
export function emitEvent(event: Event): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.dispatchEvent(event);
    }) as Operation<void>;
  })();
}

/**
 * Observe changes to a specific attribute on the current watched element.
 *
 * When the named attribute changes on the element obtained from the current WatchContext,
 * the provided handler is invoked with the attribute's new value (read from the element)
 * and the old value reported by the MutationRecord.
 *
 * @param attributeName - Name of the attribute to observe.
 * @param handler - Called as `handler(newValue, oldValue)` when the attribute changes.
 *   `newValue` is the element's current attribute value (or `null` if absent),
 *   `oldValue` is the previous value as reported by the MutationRecord (may be `null`).
 */
export function onAttr(
  attributeName: string,
  handler: (newValue: string | null, oldValue: string | null) => void,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
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
    }) as Operation<void>;
  })();
}

/**
 * Observe and notify when the element's textContent changes.
 *
 * Attaches a MutationObserver to the current watch context's element that watches
 * childList, characterData, and subtree mutations. The provided `handler` is
 * called whenever the element's `textContent` changes with the new and previous
 * string values.
 *
 * @param handler - Called as `handler(newText, oldText)` when `textContent` changes.
 *   The initial `oldText` is taken from the element's `textContent` at the time
 *   the observer is installed.
 * @returns A workflow that installs the MutationObserver on the watched element.
 */
export function onText(
  handler: (newText: string, oldText: string) => void,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
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
        characterData: true,
        subtree: true,
      });
    }) as Operation<void>;
  })();
}

/**
 * Set up an IntersectionObserver on the current watch context element and call the handler when visibility changes.
 *
 * The provided `handler` is invoked with a single boolean argument (`true` when the element is intersecting / visible, `false` otherwise) each time the element's visibility changes.
 *
 * @param handler - Called with `isVisible` whenever the element's intersection state changes
 * @returns A Workflow that installs the visibility observer on the current element
 */
export function onVisible(
  handler: (isVisible: boolean) => void,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          handler(entry.isIntersecting);
        });
      });

      observer.observe(context.element);
    }) as Operation<void>;
  })();
}

/**
 * Observe size changes of the current element and invoke a handler for matching entries.
 *
 * If `ResizeObserver` is available, installs an observer that calls `handler(entry)` for
 * each ResizeObserverEntry whose `target` is the workflow's watched element. If `ResizeObserver`
 * is not defined in the environment, this workflow is a no-op.
 *
 * @param handler - Called with the ResizeObserverEntry for the watched element when its size changes.
 * @returns A Workflow that attaches the ResizeObserver while yielded.
 */
export function onResize(
  handler: (entry: ResizeObserverEntry) => void,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
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
    }) as Operation<void>;
  })();
}

/**
 * Register a mount handler that runs immediately for the currently mounted element.
 *
 * The provided `handler` will be invoked as a microtask (via `queueMicrotask`) because the element
 * is already mounted. Supported handler shapes:
 * - synchronous function: executed immediately,
 * - function returning a Promise: the promise is awaited,
 * - async-generator function: the returned async generator is executed with `runOn` using the
 *   current element as context so it can yield workflows.
 *
 * @param handler - Handler to run on mount. May be synchronous, return a `Promise`, or return an `AsyncGenerator`.
 * @returns A `Workflow<void>` that installs and invokes the mount handler for the current watch context.
 */
export function onMount(
  handler:
    | (() => void)
    | (() => Promise<void>)
    | (() => AsyncGenerator<any, void, any>),
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async () => {
        const result = handler();
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

      // Call the handler immediately since element is already mounted
      queueMicrotask(() => wrappedHandler());
    }) as Operation<void>;
  })();
}

/**
 * Registers a handler to run once when the watched element is removed from the DOM.
 *
 * The returned workflow installs a MutationObserver on document.body that detects removals.
 * When the watched element is removed (or removed as part of a subtree), the provided
 * handler is invoked and the observer is disconnected. Supported handler forms:
 * - synchronous function
 * - function returning a Promise (will be awaited)
 * - function returning an AsyncGenerator (executed with `runOn` using the element as context)
 *
 * The observer's disconnect function is also stored on the watch context's `cleanup` set
 * so it can be disconnected by external cleanup logic if needed. Errors thrown by the
 * handler propagate to the caller/runtime.
 *
 * @param handler - Function to invoke when the element is unmounted; may be sync, return a Promise, or return an AsyncGenerator.
 * @returns A Workflow that attaches the unmount observer when yielded.
 */
export function onUnmount(
  handler:
    | (() => void)
    | (() => Promise<void>)
    | (() => AsyncGenerator<any, void, any>),
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      // Wrap generator handlers to execute them properly
      const wrappedHandler = async () => {
        const result = handler();
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
    }) as Operation<void>;
  })();
}

/**
 * Create a Workflow that attaches a one-time event listener to the current watch context element.
 *
 * The listener is added to the element from the WatchContext and will be removed automatically after the first invocation
 * (the `once` option is forced to `true`). If the provided handler returns a Promise, it will be awaited by the caller's runtime.
 *
 * @param eventType - The DOM event type to listen for (e.g., `"click"`, `"input"`).
 * @param handler - The event handler to invoke when the event fires; may be synchronous or return a Promise.
 * @param options - Optional AddEventListenerOptions; merged with `{ once: true }`, so callers do not need to set `once`.
 * @returns A Workflow<void> that, when yielded, attaches the one-time listener to the current element.
 */
export function once(
  eventType: string,
  handler: (event: Event) => void | Promise<void>,
  options?: AddEventListenerOptions,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.addEventListener(eventType, handler, {
        ...options,
        once: true,
      });
    }) as Operation<void>;
  })();
}

/**
 * Creates a workflow that yields an event listener which calls `event.preventDefault()`.
 *
 * The returned `Workflow` produces a handler function suitable for use as an event listener;
 * invoking that handler will call `preventDefault()` on the provided `Event`.
 *
 * @returns A `Workflow` that resolves to an `(event: Event) => void` handler which prevents the event's default action.
 */
export function preventDefault(): Workflow<(event: Event) => void> {
  return (async function* () {
    const result = yield ((_context: WatchContext) => {
      return (event: Event) => {
        event.preventDefault();
      };
    }) as Operation<(event: Event) => void>;
    return result;
  })();
}

/**
 * Creates a workflow that yields an event handler which calls `event.stopPropagation()`.
 *
 * The returned Workflow, when run, provides a function suitable as an event listener.
 * That listener simply invokes `stopPropagation()` on the received Event.
 *
 * @returns A Workflow that produces an `(event: Event) => void` handler which stops event propagation.
 */
export function stopPropagation(): Workflow<(event: Event) => void> {
  return (async function* () {
    const result = yield ((_context: WatchContext) => {
      return (event: Event) => {
        event.stopPropagation();
      };
    }) as Operation<(event: Event) => void>;
    return result;
  })();
}
