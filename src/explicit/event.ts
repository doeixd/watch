/**
 * @module explicit/event
 *
 * Explicit, non-overloaded event handling functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn, WatchEventListenerOptions } from "../types";

/**
 * Attach a click listener to a DOM element if the element exists.
 *
 * The provided `handler` is registered with `addEventListener("click", ...)`.
 * If `element` is falsy the function is a no-op.
 *
 * @param element - Target element to attach the click listener to (no-op if falsy)
 * @param handler - Callback invoked with the `MouseEvent` when the element is clicked
 * @param options - Optional listener options (e.g., `capture`, `once`, `passive`) represented by `WatchEventListenerOptions`
 */
export function clickElement(
  element: Element,
  handler: (event: MouseEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  if (!element) return;
  element.addEventListener("click", handler as EventListener, options);
}

/**
 * Attaches a click listener to every element matching the provided CSS selector.
 *
 * Attaches the given `handler` to each matched element using the library's click helper; if no elements match the selector the function is a no-op.
 *
 * @param selector - CSS selector to find target elements
 * @param handler - Called with the MouseEvent when a matched element is clicked
 * @param options - Optional event listener options (capture, once, passive, etc.)
 */
export function clickSelector(
  selector: string,
  handler: (event: MouseEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => clickElement(el, handler, options));
}

/**
 * Adds a click event listener to all elements matching a selector.
 * Alias for clickSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param handler - The event handler function
 * @param options - Optional event listener options
 *
 * @example
 * ```typescript
 * clickAll('.item', (event) => {
 *   console.log('Item clicked');
 * });
 * ```
 */
export function clickAll(
  selector: string,
  handler: (event: MouseEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  clickSelector(selector, handler, options);
}

/**
 * Attach a click listener to the first element that matches the given CSS selector.
 *
 * Does nothing if no matching element is found. The provided `options` are passed to
 * the underlying addEventListener call.
 *
 * @param selector - CSS selector used to locate the element
 * @param handler - MouseEvent handler invoked when the element is clicked
 * @param options - Optional event listener options (capturing, passive, once, etc.)
 *
 * @example
 * ```typescript
 * clickFirst('#submit', (event) => {
 *   console.log('Submit clicked');
 * });
 * ```
 */
export function clickFirst(
  selector: string,
  handler: (event: MouseEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  const element = document.querySelector(selector);
  if (element) {
    clickElement(element, handler, options);
  }
}

/**
 * Returns a generator function that adds a click listener.
 * For use within watch generators.
 *
 * @param handler - The event handler function
 * @param options - Optional event listener options
 * @returns ElementFn that adds click listener when yielded
 *
 * @example
 * ```typescript
 * watch('button', function* () {
 *   yield clickGen((event) => console.log('Clicked!'));
 * });
 * ```
 */
export function clickGen(
  handler: (event: MouseEvent) => void,
  options?: WatchEventListenerOptions,
): ElementFn<Element, void> {
  return (element: Element) => {
    clickElement(element, handler, options);
  };
}

/**
 * Attach a delegated click listener to a parent so clicks on matching child elements invoke a handler.
 *
 * The listener is added to the provided parent element (or the first element matching a selector) and
 * invokes `handler(event, element)` when the actual click target matches `childSelector`. No-op if the
 * parent cannot be resolved.
 *
 * @param parent - Parent Element or CSS selector string to attach the listener to
 * @param childSelector - CSS selector used to match child targets that should trigger the handler
 * @param handler - Called with the click `MouseEvent` and the matching child `Element`
 * @param options - Optional event listener options (e.g., `{ capture, passive, once }`)
 */
export function clickDelegate(
  parent: Element | string,
  childSelector: string,
  handler: (event: MouseEvent, element: Element) => void,
  options?: WatchEventListenerOptions,
): void {
  const parentEl =
    typeof parent === "string" ? document.querySelector(parent) : parent;

  if (!parentEl) return;

  parentEl.addEventListener(
    "click",
    (event: Event) => {
      const target = event.target as Element;
      if (target && target.matches(childSelector)) {
        handler(event as MouseEvent, target);
      }
    },
    options,
  );
}

/**
 * Attach an "input" event listener to a given element.
 *
 * The handler is invoked on user input (keystrokes, paste) and when the element's value is changed programmatically.
 *
 * @param element - The target form element (e.g., <input>, <textarea>) to attach the listener to. No-op if falsy.
 * @param handler - Called with the originating InputEvent when the element's value changes.
 * @param options - Optional listener options (capture, passive, once) forwarded to addEventListener.
 */
export function inputElement(
  element: Element,
  handler: (event: InputEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  if (!element) return;
  element.addEventListener("input", handler as EventListener, options);
}

/**
 * Attach an `input` event listener to every element that matches the given CSS selector.
 *
 * This is a convenience wrapper that queries `document` for `selector` and attaches the provided
 * `handler` to each matching element. If no elements match, the function is a no-op.
 *
 * @param selector - CSS selector used to find target elements
 * @param handler - Called with the `InputEvent` when an input occurs on a matched element
 * @param options - Optional event listener options (e.g., `{ passive: true }`)
 */
export function inputSelector(
  selector: string,
  handler: (event: InputEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => inputElement(el, handler, options));
}

/**
 * Attach an `input` event listener to every element matching `selector`.
 *
 * This is an alias of `inputSelector` that forwards `selector`, `handler`, and `options`.
 *
 * @param selector - CSS selector used to find target elements
 * @param handler - Handler invoked with the `InputEvent` for each matched element
 * @param options - Optional event listener options forwarded to `addEventListener`
 */
export function inputAll(
  selector: string,
  handler: (event: InputEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  inputSelector(selector, handler, options);
}

/**
 * Attach an `input` event listener to the first element matching `selector`.
 *
 * If no element matches the selector this is a no-op. The provided `options`
 * are passed through to the underlying event listener.
 *
 * @param selector - CSS selector for the target element
 * @param handler - Called with the `InputEvent` when the element emits `input`
 * @param options - Optional listener options (e.g., `capture`, `once`, `passive`)
 */
export function inputFirst(
  selector: string,
  handler: (event: InputEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  const element = document.querySelector(selector);
  if (element) {
    inputElement(element, handler, options);
  }
}

/**
 * Returns a generator-compatible function that attaches an `input` listener to a provided element.
 *
 * The returned ElementFn is intended for use in watch-style generators; when invoked with an Element it
 * will add the given `handler` as an `input` event listener using the supplied `options`.
 *
 * @param handler - Function invoked with the InputEvent when the element emits an `input` event
 * @param options - Optional listener options (e.g., `{ passive: true }`)
 * @returns An ElementFn that attaches the input listener to the given element
 */
export function inputGen(
  handler: (event: InputEvent) => void,
  options?: WatchEventListenerOptions,
): ElementFn<Element, void> {
  return (element: Element) => {
    inputElement(element, handler, options);
  };
}

/**
 * Adds a change event listener to an element.
 * Fires when the value changes and the element loses focus (or on selection for select/radio/checkbox).
 *
 * @param element - The form element to attach the listener to
 * @param handler - Function called when value changes, receives Event
 * @param options - Optional event listener options
 * @returns void
 *
 * @example
 * ```typescript
 * // Handle select dropdown changes
 * const select = document.querySelector('select');
 * changeElement(select, (event) => {
 *   const value = (event.target as HTMLSelectElement).value;
 *   console.log('Selected:', value);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Handle checkbox changes
 * const checkbox = document.querySelector('input[type="checkbox"]');
 * changeElement(checkbox, (event) => {
 *   const checked = (event.target as HTMLInputElement).checked;
 *   toggleFeature(checked);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Handle radio button selection
 * const radios = document.querySelectorAll('input[name="theme"]');
 * radios.forEach(radio => {
 *   changeElement(radio, (event) => {
 *     const theme = (event.target as HTMLInputElement).value;
 *     applyTheme(theme);
 *   });
 * });
 * ```
 */
export function changeElement(
  element: Element,
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): void {
  if (!element) return;
  element.addEventListener("change", handler as EventListener, options);
}

/**
 * Adds a change event listener to all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param handler - The event handler function
 * @param options - Optional event listener options
 */
export function changeSelector(
  selector: string,
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => changeElement(el, handler, options));
}

/**
 * Adds a change event listener to all elements matching a selector.
 * Alias for changeSelector for clarity.
 */
export function changeAll(
  selector: string,
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): void {
  changeSelector(selector, handler, options);
}

/**
 * Adds a change event listener to the first element matching a selector.
 */
export function changeFirst(
  selector: string,
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): void {
  const element = document.querySelector(selector);
  if (element) {
    changeElement(element, handler, options);
  }
}

/**
 * Create an ElementFn that attaches a `change` event listener to a given element.
 *
 * The returned function accepts an Element and registers `handler` for its `change` events using the provided `options`.
 * Intended for use in watch-style generators or other flows that receive elements and need to bind change handlers.
 *
 * @param handler - Function invoked when the `change` event fires on the element.
 * @param options - Optional listener options forwarded to addEventListener.
 * @returns A function that, when called with an Element, attaches the configured `change` listener (no return value).
 */
export function changeGen(
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): ElementFn<Element, void> {
  return (element: Element) => {
    changeElement(element, handler, options);
  };
}

/**
 * Attach a submit event listener to a form element. No-op if `element` is falsy.
 *
 * The `handler` is invoked with the DOM `SubmitEvent` when the form is submitted
 * (e.g., submit button click or pressing Enter). Use `event.preventDefault()` to
 * intercept the submission and `event.submitter` to access the submitter button.
 *
 * @param element - The target form element; if falsy the function returns without action
 * @param handler - Callback invoked with the `SubmitEvent` when the form is submitted
 * @param options - Optional event listener options forwarded to `addEventListener`
 */
export function submitElement(
  element: Element,
  handler: (event: SubmitEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  if (!element) return;
  element.addEventListener("submit", handler as EventListener, options);
}

/**
 * Attaches a submit listener to every element matching the CSS selector.
 *
 * Does nothing if no elements match.
 *
 * @param selector - CSS selector used to find target elements
 * @param handler - Handler invoked with the `SubmitEvent` when a matched form is submitted
 * @param options - Optional listener options forwarded to the underlying event registration
 */
export function submitSelector(
  selector: string,
  handler: (event: SubmitEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => submitElement(el, handler, options));
}

/**
 * Create a function that attaches a submit listener to an element.
 *
 * Returns an ElementFn suitable for use in watch-style generators. The returned
 * function, when invoked with an Element, registers `handler` as a submit
 * event listener on that element using the provided `options`.
 *
 * @param handler - Callback invoked with the SubmitEvent when the element's form is submitted
 * @param options - Optional listener options forwarded to the underlying add/remove listener calls
 * @returns A function that accepts an Element and attaches the submit listener (returns void)
 */
export function submitGen(
  handler: (event: SubmitEvent) => void,
  options?: WatchEventListenerOptions,
): ElementFn<Element, void> {
  return (element: Element) => {
    submitElement(element, handler, options);
  };
}

/**
 * Attach a generic event listener to a single DOM element.
 *
 * Does nothing if `element` is falsy. Use for events not covered by the specialized helpers
 * (e.g., `"mouseover"`, `"keydown"`, custom event names).
 *
 * @param element - Target element to attach the listener to; listener is not added when falsy
 * @param eventName - DOM event name (for example: `'mouseenter'`, `'keydown'`, `'widget:update'`)
 * @param handler - Callback invoked with the event object when the event fires
 * @param options - Optional event listener options (capture, passive, once, etc.)
 */
export function onElement(
  element: Element,
  eventName: string,
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): void {
  if (!element) return;
  element.addEventListener(eventName, handler as EventListener, options);
}

/**
 * Attaches an event listener for `eventName` to every element matching `selector`.
 *
 * If no elements match, the function does nothing.
 *
 * @param selector - CSS selector used to find target elements
 * @param eventName - Event type to listen for (e.g., `"click"`)
 * @param handler - Handler invoked with the Event when triggered
 * @param options - Optional listener options forwarded to addEventListener
 */
export function onSelector(
  selector: string,
  eventName: string,
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => onElement(el, eventName, handler, options));
}

/**
 * Adds a generic event listener to all elements matching a selector.
 * Alias for onSelector for clarity.
 */
export function onAll(
  selector: string,
  eventName: string,
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): void {
  onSelector(selector, eventName, handler, options);
}

/**
 * Attaches an event listener for `eventName` to the first element matching `selector`.
 *
 * This is a no-op when no matching element is found. `options` are forwarded to the underlying
 * `addEventListener` call.
 *
 * @param selector - CSS selector used to find the first matching element
 * @param eventName - Name of the DOM event to listen for
 * @param handler - Callback invoked with the event when it occurs on the matched element
 * @param options - Optional listener options (capturing, passive, once, etc.)
 */
export function onFirst(
  selector: string,
  eventName: string,
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): void {
  const element = document.querySelector(selector);
  if (element) {
    onElement(element, eventName, handler, options);
  }
}

/**
 * Creates a function that attaches a listener for the given DOM `eventName` to an Element.
 *
 * The returned function accepts an Element and registers `handler` for `eventName`
 * using the provided `options`. Designed for use in watch-style generator flows
 * where listeners are added when elements become available.
 *
 * @param eventName - DOM event type to listen for (e.g., `"click"`)
 * @param handler - Callback invoked with the event when it occurs
 * @param options - Optional listener options forwarded to `addEventListener`
 * @returns A function that, when given an Element, attaches the configured listener
 */
export function onGen(
  eventName: string,
  handler: (event: Event) => void,
  options?: WatchEventListenerOptions,
): ElementFn<Element, void> {
  return (element: Element) => {
    onElement(element, eventName, handler, options);
  };
}

/**
 * Attach a delegated event listener to a parent so matching child elements trigger the handler.
 *
 * When an event with the given name bubbles to the parent, the handler is invoked only if the
 * original event target matches the provided child selector. Useful for efficiently handling
 * events on dynamic or many child elements.
 *
 * @param parent - Parent Element or a CSS selector string used to resolve the parent element
 * @param childSelector - CSS selector that child elements must match to trigger the handler
 * @param eventName - DOM event name to listen for (e.g., `"click"`, `"focus"`)
 * @param handler - Called with the event and the matching child element when triggered
 * @param options - Optional event listener options (capture, passive, once) forwarded to addEventListener
 *
 * @example
 * // Delegate clicks from any `.item` inside `.list`
 * onDelegate('.list', '.item', 'click', (event, item) => {
 *   item.classList.toggle('selected');
 * });
 */
export function onDelegate(
  parent: Element | string,
  childSelector: string,
  eventName: string,
  handler: (event: Event, element: Element) => void,
  options?: WatchEventListenerOptions,
): void {
  const parentEl =
    typeof parent === "string" ? document.querySelector(parent) : parent;

  if (!parentEl) return;

  parentEl.addEventListener(
    eventName,
    (event: Event) => {
      const target = event.target as Element;
      if (target && target.matches(childSelector)) {
        handler(event, target);
      }
    },
    options,
  );
}

/**
 * Remove a previously attached event listener from a specific element.
 *
 * The provided `handler` must be the same function reference that was added; if the listener
 * was registered with specific `options` (e.g., `{ capture: true }`), the same options should
 * be passed when removing.
 *
 * @param handler - The exact function reference that was originally added as the listener.
 * @param options - Optional listener options; if used when adding the listener, the same
 *                  options should be supplied to remove it successfully.
 */
export function offElement(
  element: Element,
  eventName: string,
  handler: (event: Event) => void,
  options?: EventListenerOptions,
): void {
  if (!element) return;
  element.removeEventListener(eventName, handler as EventListener, options);
}

/**
 * Removes an event listener from all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param eventName - The name of the event
 * @param handler - The event handler function to remove
 * @param options - Optional event listener options
 */
export function offSelector(
  selector: string,
  eventName: string,
  handler: (event: Event) => void,
  options?: EventListenerOptions,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => offElement(el, eventName, handler, options));
}

/**
 * Removes an event listener from all elements matching a selector.
 * Alias for offSelector for clarity.
 */
export function offAll(
  selector: string,
  eventName: string,
  handler: (event: Event) => void,
  options?: EventListenerOptions,
): void {
  offSelector(selector, eventName, handler, options);
}

/**
 * Dispatches a bubbling CustomEvent with optional detail from the given element.
 *
 * Creates and dispatches a CustomEvent named `eventName` on `element` with
 * `{ detail, bubbles: true }`. If `element` is falsy the function is a no-op.
 *
 * @param element - The element to dispatch the event from
 * @param eventName - The custom event name
 * @param detail - Optional payload available as `event.detail`
 *
 * @example
 * // Emit simple custom event
 * emitElement(document.querySelector('.widget'), 'widget:ready');
 *
 * @example
 * // Emit event with data
 * emitElement(document.querySelector('form'), 'form:validated', { isValid: true });
 */
export function emitElement(
  element: Element,
  eventName: string,
  detail?: any,
): void {
  if (!element) return;
  const event = new CustomEvent(eventName, { detail, bubbles: true });
  element.dispatchEvent(event);
}

/**
 * Dispatches a CustomEvent with the given name and optional detail on every element matching `selector`.
 *
 * If no elements match the selector the function is a no-op.
 *
 * @param selector - CSS selector used to find target elements
 * @param eventName - Name of the CustomEvent to dispatch
 * @param detail - Optional value assigned to the event's `detail` property
 */
export function emitSelector(
  selector: string,
  eventName: string,
  detail?: any,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => emitElement(el, eventName, detail));
}

/**
 * Emits a custom event on all elements matching a selector.
 * Alias for emitSelector for clarity.
 */
export function emitAll(
  selector: string,
  eventName: string,
  detail?: any,
): void {
  emitSelector(selector, eventName, detail);
}

/**
 * Create and dispatch a CustomEvent with an optional detail payload on a target.
 *
 * The created event bubbles by default. The `target` defaults to `document` when omitted.
 *
 * @param eventName - Event name to dispatch
 * @param detail - Optional payload available as `event.detail`
 * @param target - EventTarget to dispatch the event on (defaults to `document`)
 */
export function emitCustom(
  eventName: string,
  detail?: any,
  target: EventTarget = document,
): void {
  const event = new CustomEvent(eventName, { detail, bubbles: true });
  target.dispatchEvent(event);
}
