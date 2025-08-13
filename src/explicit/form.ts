/**
 * @module explicit/form
 *
 * Explicit, non-overloaded form manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Set the stringified value on a DOM element that exposes a `value` property.
 *
 * The function is a no-op if `element` is falsy or does not have a `value` property.
 *
 * @param element - Target element (e.g., HTMLInputElement, HTMLTextAreaElement, HTMLSelectElement)
 * @param value - Value to set; non-string values are converted to a string
 */
export function setValueElement(element: Element, value: string | number): void {
  if (!element) return;

  if ('value' in element) {
    (element as HTMLInputElement).value = String(value);
  }
}

/**
 * Set the string value for every element that matches the given CSS selector.
 *
 * The provided `value` (string or number) will be applied to each matched element's `value` property;
 * numeric values are converted to string before assignment.
 *
 * @param selector - CSS selector used to find target elements
 * @param value - Value to assign to each element's `value` property
 *
 * @example
 * ```typescript
 * setValueSelector('input.amount', '100');
 * ```
 */
export function setValueSelector(selector: string, value: string | number): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => setValueElement(el, value));
}

/**
 * Sets the value of all form elements matching a selector.
 * Alias for setValueSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param value - The value to set
 */
export function setValueAll(selector: string, value: string | number): void {
  setValueSelector(selector, value);
}

/**
 * Sets the value of the first form element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param value - The value to set
 *
 * @example
 * ```typescript
 * setValueFirst('#username', 'john_doe');
 * ```
 */
export function setValueFirst(selector: string, value: string | number): void {
  const element = document.querySelector(selector);
  if (element) {
    setValueElement(element, value);
  }
}

/**
 * Creates a generator-compatible function that sets an element's value.
 *
 * Returns a function intended for use inside watch-style generator flows; when
 * invoked with an Element it will set that element's value to the provided
 * string or number (stringified as needed).
 *
 * @param value - The value to assign to the element's `value` property.
 * @returns A function which accepts an Element and sets its value.
 */
export function setValueGen(value: string | number): ElementFn<Element, void> {
  return (element: Element) => {
    setValueElement(element, value);
  };
}

/**
 * Return the string value of a form element.
 *
 * Returns the element's `value` if present; otherwise returns an empty string (also returned when `element` is falsy).
 */
export function getValueElement(element: Element): string {
  if (!element) return '';

  if ('value' in element) {
    return (element as HTMLInputElement).value;
  }

  return '';
}

/**
 * Gets the value of the first form element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @returns The value or null if no element found
 *
 * @example
 * ```typescript
 * const username = getValueSelector('#username');
 * ```
 */
export function getValueSelector(selector: string): string | null {
  const element = document.querySelector(selector);
  return element ? getValueElement(element) : null;
}

/**
 * Gets the value of the first form element matching a selector.
 * Alias for getValueSelector for clarity.
 *
 * @param selector - CSS selector to find element
 * @returns The value or null if no element found
 */
export function getValueFirst(selector: string): string | null {
  return getValueSelector(selector);
}

/**
 * Gets the values of all form elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @returns Array of values
 *
 * @example
 * ```typescript
 * const values = getValueAll('input.quantity');
 * ```
 */
export function getValueAll(selector: string): string[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => getValueElement(el));
}

/**
 * Returns an ElementFn suitable for generator-based watchers that yields an element's value.
 *
 * The returned function, when invoked with an Element, returns the element's string value
 * using the same semantics as `getValueElement` (empty string if the element is missing or has no value).
 *
 * @returns An ElementFn that takes an Element and returns its value as a string
 */
export function getValueGen(): ElementFn<Element, string> {
  return (element: Element) => {
    return getValueElement(element);
  };
}

/**
 * Sets the checked state of a checkbox or radio button.
 *
 * @param element - The input element
 * @param checked - Whether the element should be checked
 *
 * @example
 * ```typescript
 * const checkbox = document.querySelector('input[type="checkbox"]');
 * setCheckedElement(checkbox, true);
 * ```
 */
export function setCheckedElement(element: Element, checked: boolean): void {
  if (!element) return;

  if ('checked' in element) {
    (element as HTMLInputElement).checked = checked;
  }
}

/**
 * Sets the checked state of all inputs matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param checked - Whether the elements should be checked
 *
 * @example
 * ```typescript
 * setCheckedSelector('input[type="checkbox"]', false);
 * ```
 */
export function setCheckedSelector(selector: string, checked: boolean): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => setCheckedElement(el, checked));
}

/**
 * Set the checked state for every element that matches `selector`.
 *
 * This is an alias of `setCheckedSelector`.
 *
 * @param selector - CSS selector used to find elements
 * @param checked - Desired checked state
 */
export function setCheckedAll(selector: string, checked: boolean): void {
  setCheckedSelector(selector, checked);
}

/**
 * Sets the checked state of the first input matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param checked - Whether the element should be checked
 *
 * @example
 * ```typescript
 * setCheckedFirst('#agree', true);
 * ```
 */
export function setCheckedFirst(selector: string, checked: boolean): void {
  const element = document.querySelector(selector);
  if (element) {
    setCheckedElement(element, checked);
  }
}

/**
 * Returns a generator function that sets checked state.
 * For use within watch generators.
 *
 * @param checked - Whether the element should be checked
 * @returns ElementFn that sets checked when yielded
 *
 * @example
 * ```typescript
 * watch('input[type="checkbox"]', function* () {
 *   yield setCheckedGen(true);
 * });
 * ```
 */
export function setCheckedGen(checked: boolean): ElementFn<Element, void> {
  return (element: Element) => {
    setCheckedElement(element, checked);
  };
}

/**
 * Return whether an element (typically an input[type="checkbox" | "radio"]) is checked.
 *
 * If `element` is falsy or does not have a `checked` property the function returns `false`.
 *
 * @param element - The element to inspect (may be `null`/`undefined`); expected to be an input element for meaningful results
 * @returns `true` if the element has a `checked` property that is truthy, otherwise `false`
 */
export function isCheckedElement(element: Element): boolean {
  if (!element) return false;

  if ('checked' in element) {
    return (element as HTMLInputElement).checked;
  }

  return false;
}

/**
 * Gets the checked state of the first input matching a selector.
 *
 * @param selector - CSS selector to find element
 * @returns Whether the element is checked or null if not found
 *
 * @example
 * ```typescript
 * const isAgreed = isCheckedSelector('#agree');
 * ```
 */
export function isCheckedSelector(selector: string): boolean | null {
  const element = document.querySelector(selector);
  return element ? isCheckedElement(element) : null;
}

/**
 * Return true only if every element matching `selector` is checked. If no elements match, returns `false`.
 *
 * @param selector - CSS selector used to locate elements to inspect
 * @returns `true` when at least one matching element exists and every matched element is checked; otherwise `false`
 */
export function isCheckedAll(selector: string): boolean {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return false;

  return Array.from(elements).every(el => isCheckedElement(el));
}

/**
 * Returns true if any element matching the selector is checked.
 *
 * If no elements match the selector, this returns `false`.
 *
 * @param selector - CSS selector used to find input elements
 * @returns `true` when at least one matched element has a checked state of `true`, otherwise `false`
 */
export function isCheckedAny(selector: string): boolean {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).some(el => isCheckedElement(el));
}

/**
 * Returns a generator function that gets checked state.
 * For use within watch generators.
 *
 * @returns ElementFn that gets checked state when yielded
 *
 * @example
 * ```typescript
 * watch('input[type="checkbox"]', function* () {
 *   const checked = yield isCheckedGen();
 *   console.log('Is checked:', checked);
 * });
 * ```
 */
export function isCheckedGen(): ElementFn<Element, boolean> {
  return (element: Element) => {
    return isCheckedElement(element);
  };
}

/**
 * Sets selection on a SELECT or OPTION element.
 *
 * If `element` is a `SELECT`, sets its `value` to `value`. If `element` is an `OPTION`, marks that option as selected.
 * No-op if `element` is falsy or not a select/option.
 *
 * @param element - The target `SELECT` or `OPTION` element
 * @param value - Value to select when `element` is a `SELECT`
 */
export function setSelectedElement(element: Element, value: string): void {
  if (!element) return;

  if (element.tagName === 'SELECT' && 'value' in element) {
    (element as HTMLSelectElement).value = value;
  } else if (element.tagName === 'OPTION' && 'selected' in element) {
    (element as HTMLOptionElement).selected = true;
  }
}

/**
 * Set the selected value/state on every element matching the given selector.
 *
 * For matching <select> elements this sets the element's `value`. For matching <option>
 * elements this marks the option as selected. If no elements match the selector this is a no-op.
 *
 * @param selector - CSS selector used to find target elements
 * @param value - The value to select (string)
 *
 * @example
 * ```typescript
 * setSelectedSelector('#country', 'USA');
 * ```
 */
export function setSelectedSelector(selector: string, value: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => setSelectedElement(el, value));
}

/**
 * Return the selected value of a <select> element.
 *
 * If `element` is falsy or not a `SELECT`, returns an empty string.
 *
 * @param element - The element expected to be an HTMLSelectElement (non-`SELECT` values return `''`)
 * @returns The select's current `value`, or `''` when not applicable
 */
export function getSelectedElement(element: Element): string {
  if (!element) return '';

  if (element.tagName === 'SELECT' && 'value' in element) {
    return (element as HTMLSelectElement).value;
  }

  return '';
}

/**
 * Gets the selected value of the first select matching a selector.
 *
 * @param selector - CSS selector to find element
 * @returns The selected value or null if not found
 *
 * @example
 * ```typescript
 * const country = getSelectedSelector('#country');
 * ```
 */
export function getSelectedSelector(selector: string): string | null {
  const element = document.querySelector(selector);
  return element ? getSelectedElement(element) : null;
}

/**
 * Gets all selected options from a select element.
 *
 * @param element - The select element
 * @returns Array of selected option elements
 *
 * @example
 * ```typescript
 * const select = document.querySelector('select[multiple]');
 * const selectedOptions = getSelectedOptionsElement(select);
 * ```
 */
export function getSelectedOptionsElement(element: Element): HTMLOptionElement[] {
  if (!element || element.tagName !== 'SELECT') return [];

  const select = element as HTMLSelectElement;
  return Array.from(select.selectedOptions);
}

/**
 * Return the selected <option> elements from the first element matching `selector`.
 *
 * If no element matches or the matched element is not a <select>, an empty array is returned.
 *
 * @param selector - CSS selector to locate the first <select> element
 * @returns An array of the matched element's selected HTMLOptionElement instances (or empty array)
 */
export function getSelectedOptionsSelector(selector: string): HTMLOptionElement[] {
  const element = document.querySelector(selector);
  return element ? getSelectedOptionsElement(element) : [];
}
