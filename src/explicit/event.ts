/**
 * @module explicit/event
 *
 * Explicit, non-overloaded event handling functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn, WatchEventListenerOptions } from "../types";

/**
 * Adds a click event listener to an element.
 *
 * @param element - The target DOM element to attach the click listener to
 * @param handler - Function called when element is clicked, receives MouseEvent
 * @param options - Optional event listener options (capture, once, passive, etc.)
 * @returns void
 *
 * @example
 * ```typescript
 * // Basic click handler
 * const button = document.querySelector('button');
 * clickElement(button, (event) => {
 *   console.log('Button clicked!');
 * });
 * ```
 *
 * @example
 * ```typescript
 * // With event options - handle only once
 * const submitBtn = document.getElementById('submit');
 * clickElement(submitBtn, (event) => {
 *   event.preventDefault();
 *   submitForm();
 * }, { once: true });
 * ```
 *
 * @example
 * ```typescript
 * // Access event properties
 * const link = document.querySelector('a');
 * clickElement(link, (event) => {
 *   console.log('Clicked at:', event.clientX, event.clientY);
 *   console.log('Shift key held:', event.shiftKey);
 * });
 * ```
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
 * Adds a click event listener to all elements matching a selector.
 *
 * @param selector - CSS selector string to query elements
 * @param handler - Function called when any matched element is clicked
 * @param options - Optional event listener options (capture, once, passive, etc.)
 * @returns void
 *
 * @example
 * ```typescript
 * // Handle clicks on all buttons
 * clickSelector('.btn', (event) => {
 *   console.log('Button clicked:', event.target);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Track all link clicks
 * clickSelector('a[href^="http"]', (event) => {
 *   trackExternalLink(event.target.href);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Add interaction to all cards
 * clickSelector('.card', (event) => {
 *   event.currentTarget.classList.toggle('selected');
 * });
 * ```
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
 * Adds a click event listener to the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param handler - The event handler function
 * @param options - Optional event listener options
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
 * Adds a delegated click event listener for dynamic child elements.
 * Useful for handling events on elements that may be added/removed dynamically.
 *
 * @param parent - Parent element or CSS selector to attach the listener to
 * @param childSelector - CSS selector for child elements that should trigger the handler
 * @param handler - Function called when matching child is clicked, receives event and clicked element
 * @param options - Optional event listener options
 * @returns void
 *
 * @example
 * ```typescript
 * // Handle clicks on dynamically added list items
 * clickDelegate('#todo-list', '.todo-item', (event, item) => {
 *   item.classList.toggle('completed');
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Delegate with parent element
 * const table = document.querySelector('table');
 * clickDelegate(table, 'td', (event, cell) => {
 *   console.log('Cell clicked:', cell.textContent);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Handle delete buttons in a dynamic list
 * clickDelegate('.user-list', '.delete-btn', (event, btn) => {
 *   const userId = btn.dataset.userId;
 *   deleteUser(userId);
 * });
 * ```
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
 * Adds an input event listener to an element.
 * Fires on every keystroke, paste, or programmatic value change.
 *
 * @param element - The form element to attach the listener to (input, textarea, etc.)
 * @param handler - Function called on input, receives InputEvent
 * @param options - Optional event listener options
 * @returns void
 *
 * @example
 * ```typescript
 * // Live search as user types
 * const searchBox = document.querySelector('input[type="search"]');
 * inputElement(searchBox, (event) => {
 *   const query = (event.target as HTMLInputElement).value;
 *   performSearch(query);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Character counter for textarea
 * const textarea = document.querySelector('textarea');
 * inputElement(textarea, (event) => {
 *   const length = (event.target as HTMLTextAreaElement).value.length;
 *   updateCharCount(length);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Input validation
 * const emailInput = document.getElementById('email');
 * inputElement(emailInput, (event) => {
 *   const email = (event.target as HTMLInputElement).value;
 *   validateEmail(email);
 * });
 * ```
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
 * Adds an input event listener to all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param handler - The event handler function
 * @param options - Optional event listener options
 *
 * @example
 * ```typescript
 * inputSelector('.field', (event) => {
 *   console.log('Field changed');
 * });
 * ```
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
 * Adds an input event listener to all elements matching a selector.
 * Alias for inputSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param handler - The event handler function
 * @param options - Optional event listener options
 */
export function inputAll(
  selector: string,
  handler: (event: InputEvent) => void,
  options?: WatchEventListenerOptions,
): void {
  inputSelector(selector, handler, options);
}

/**
 * Adds an input event listener to the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param handler - The event handler function
 * @param options - Optional event listener options
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
 * Returns a generator function that adds an input listener.
 * For use within watch generators.
 *
 * @param handler - The event handler function
 * @param options - Optional event listener options
 * @returns ElementFn that adds input listener when yielded
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
 * Returns a generator function that adds a change listener.
 * For use within watch generators.
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
 * Adds a submit event listener to a form element.
 * Only fires on form elements when submitted (button click, Enter key, etc.).
 *
 * @param element - The form element to attach the listener to
 * @param handler - Function called on form submission, receives SubmitEvent
 * @param options - Optional event listener options
 * @returns void
 *
 * @example
 * ```typescript
 * // Handle form submission with validation
 * const form = document.querySelector('form');
 * submitElement(form, (event) => {
 *   event.preventDefault();
 *   if (validateForm(form)) {
 *     submitData(new FormData(form));
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Ajax form submission
 * const loginForm = document.getElementById('login-form');
 * submitElement(loginForm, async (event) => {
 *   event.preventDefault();
 *   const formData = new FormData(event.target as HTMLFormElement);
 *   await sendLogin(formData);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Access submitter button
 * const form = document.querySelector('.multi-action-form');
 * submitElement(form, (event) => {
 *   event.preventDefault();
 *   const action = (event.submitter as HTMLButtonElement)?.value;
 *   handleFormAction(action);
 * });
 * ```
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
 * Adds a submit event listener to all forms matching a selector.
 *
 * @param selector - CSS selector to find forms
 * @param handler - The event handler function
 * @param options - Optional event listener options
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
 * Returns a generator function that adds a submit listener.
 * For use within watch generators.
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
 * Adds a generic event listener to an element.
 * Use for any DOM event type not covered by specific functions.
 *
 * @param element - The target DOM element to attach the listener to
 * @param eventName - Name of the DOM event (e.g., 'mouseover', 'keydown', 'scroll')
 * @param handler - Function called when event fires, receives Event
 * @param options - Optional event listener options
 * @returns void
 *
 * @example
 * ```typescript
 * // Mouse events
 * const card = document.querySelector('.card');
 * onElement(card, 'mouseenter', (event) => {
 *   card.classList.add('hover');
 * });
 * onElement(card, 'mouseleave', (event) => {
 *   card.classList.remove('hover');
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Keyboard events
 * const input = document.querySelector('input');
 * onElement(input, 'keydown', (event) => {
 *   if ((event as KeyboardEvent).key === 'Enter') {
 *     submitSearch();
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Custom events
 * const widget = document.getElementById('widget');
 * onElement(widget, 'widget:update', (event) => {
 *   const data = (event as CustomEvent).detail;
 *   updateWidget(data);
 * });
 * ```
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
 * Adds a generic event listener to all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param eventName - The name of the event
 * @param handler - The event handler function
 * @param options - Optional event listener options
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
 * Adds a generic event listener to the first element matching a selector.
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
 * Returns a generator function that adds a generic event listener.
 * For use within watch generators.
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
 * Adds a delegated event listener for any event type.
 * Efficiently handles events on dynamic child elements.
 *
 * @param parent - Parent element or CSS selector to attach the listener to
 * @param childSelector - CSS selector for child elements that should trigger the handler
 * @param eventName - Name of the DOM event to listen for
 * @param handler - Function called when matching child triggers event, receives event and element
 * @param options - Optional event listener options
 * @returns void
 *
 * @example
 * ```typescript
 * // Hover effects on dynamic items
 * onDelegate('.gallery', '.image', 'mouseenter', (event, img) => {
 *   img.classList.add('zoomed');
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Handle various events on table cells
 * onDelegate('table', 'td', 'dblclick', (event, cell) => {
 *   editCell(cell);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Focus events on dynamically added inputs
 * onDelegate('#dynamic-form', 'input', 'focus', (event, input) => {
 *   input.parentElement.classList.add('focused');
 * });
 * ```
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
 * Removes an event listener from an element.
 * The handler must be the exact same function reference that was added.
 *
 * @param element - The DOM element to remove the listener from
 * @param eventName - Name of the event to stop listening for
 * @param handler - The exact same function reference that was added
 * @param options - Optional event listener options (should match what was used when adding)
 * @returns void
 *
 * @example
 * ```typescript
 * // Remove a specific handler
 * const button = document.querySelector('button');
 * const handler = (e) => console.log('Clicked');
 *
 * // Add it
 * onElement(button, 'click', handler);
 *
 * // Later, remove it
 * offElement(button, 'click', handler);
 * ```
 *
 * @example
 * ```typescript
 * // Remove handler with options
 * const scrollHandler = (e) => updateScrollPosition();
 *
 * // Added with capture
 * onElement(window, 'scroll', scrollHandler, { capture: true });
 *
 * // Must remove with same options
 * offElement(window, 'scroll', scrollHandler, { capture: true });
 * ```
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
 * Emits a custom event on an element.
 * The event bubbles up through the DOM tree by default.
 *
 * @param element - The DOM element to dispatch the event from
 * @param eventName - Name of the custom event to create and dispatch
 * @param detail - Optional data to attach to the event (accessible via event.detail)
 * @returns void
 *
 * @example
 * ```typescript
 * // Emit simple custom event
 * const widget = document.querySelector('.widget');
 * emitElement(widget, 'widget:ready');
 * ```
 *
 * @example
 * ```typescript
 * // Emit event with data
 * const form = document.querySelector('form');
 * emitElement(form, 'form:validated', {
 *   isValid: true,
 *   fields: ['email', 'password']
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Component communication
 * const modal = document.getElementById('modal');
 * emitElement(modal, 'modal:closed', {
 *   reason: 'user_action',
 *   timestamp: Date.now()
 * });
 * ```
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
 * Emits a custom event on all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param eventName - The name of the custom event
 * @param detail - Optional data to include with the event
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
 * Creates and dispatches a custom event on a target.
 * Useful for application-wide events or specific target events.
 *
 * @param eventName - Name of the custom event to create and dispatch
 * @param detail - Optional data to attach to the event (accessible via event.detail)
 * @param target - EventTarget to dispatch on (defaults to document for global events)
 * @returns void
 *
 * @example
 * ```typescript
 * // Global application event
 * emitCustom('app:ready', { version: '1.0.0' });
 *
 * // Listen for it anywhere
 * document.addEventListener('app:ready', (e) => {
 *   console.log('App version:', e.detail.version);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Emit on specific element
 * const container = document.getElementById('container');
 * emitCustom('data:loaded', { items: 10 }, container);
 * ```
 *
 * @example
 * ```typescript
 * // Window-level event for cross-component communication
 * emitCustom('user:login', {
 *   userId: '123',
 *   timestamp: Date.now()
 * }, window);
 * ```
 */
export function emitCustom(
  eventName: string,
  detail?: any,
  target: EventTarget = document,
): void {
  const event = new CustomEvent(eventName, { detail, bubbles: true });
  target.dispatchEvent(event);
}
