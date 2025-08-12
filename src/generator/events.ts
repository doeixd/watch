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
    yield ((context: WatchContext) => {
      context.element.addEventListener("focus", handler, options);
    }) as Operation<void>;
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
    yield ((context: WatchContext) => {
      context.element.addEventListener("blur", handler, options);
    }) as Operation<void>;
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
 * Emit a generic event
 * @param event The event to emit
 * @returns Workflow that emits the event
 */
export function emitEvent(event: Event): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.dispatchEvent(event);
    }) as Operation<void>;
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
 * Watch for text content changes
 * @param handler The change handler function
 * @returns Workflow that sets up text watching
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
 * Watch for visibility changes
 * @param handler The visibility change handler function
 * @returns Workflow that sets up visibility watching
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
 * Watch for resize changes
 * @param handler The resize handler function
 * @returns Workflow that sets up resize watching
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
    yield ((context: WatchContext) => {
      context.element.addEventListener(eventType, handler, {
        ...options,
        once: true,
      });
    }) as Operation<void>;
  })();
}

/**
 * Prevent default on an event
 * @returns Workflow that creates a preventDefault handler
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
 * Stop propagation on an event
 * @returns Workflow that creates a stopPropagation handler
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
