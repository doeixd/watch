/**
 * @module explicit/form
 *
 * Explicit, non-overloaded form manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Sets the value of a form element.
 *
 * @param element - The form element to set value on
 * @param value - The value to set
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * setValueElement(input, 'Hello World');
 * ```
 */
export function setValueElement(element: Element, value: string | number): void {
  if (!element) return;

  if ('value' in element) {
    (element as HTMLInputElement).value = String(value);
  }
}

/**
 * Sets the value of all form elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param value - The value to set
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
 * Returns a generator function that sets a form value.
 * For use within watch generators.
 *
 * @param value - The value to set
 * @returns ElementFn that sets value when yielded
 *
 * @example
 * ```typescript
 * watch('input', function* () {
 *   yield setValueGen('Default value');
 * });
 * ```
 */
export function setValueGen(value: string | number): ElementFn<Element, void> {
  return (element: Element) => {
    setValueElement(element, value);
  };
}

/**
 * Gets the value of a form element.
 *
 * @param element - The form element to get value from
 * @returns The value of the element
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * const value = getValueElement(input);
 * ```
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
 * Returns a generator function that gets a form value.
 * For use within watch generators.
 *
 * @returns ElementFn that gets value when yielded
 *
 * @example
 * ```typescript
 * watch('input', function* () {
 *   const value = yield getValueGen();
 *   console.log('Current value:', value);
 * });
 * ```
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
 * Sets the checked state of all inputs matching a selector.
 * Alias for setCheckedSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param checked - Whether the elements should be checked
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
 * Gets the checked state of a checkbox or radio button.
 *
 * @param element - The input element
 * @returns Whether the element is checked
 *
 * @example
 * ```typescript
 * const checkbox = document.querySelector('input[type="checkbox"]');
 * const isChecked = isCheckedElement(checkbox);
 * ```
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
 * Checks if all inputs matching a selector are checked.
 *
 * @param selector - CSS selector to find elements
 * @returns True if all elements are checked
 *
 * @example
 * ```typescript
 * const allChecked = isCheckedAll('input[type="checkbox"]');
 * ```
 */
export function isCheckedAll(selector: string): boolean {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return false;

  return Array.from(elements).every(el => isCheckedElement(el));
}

/**
 * Checks if any input matching a selector is checked.
 *
 * @param selector - CSS selector to find elements
 * @returns True if any element is checked
 *
 * @example
 * ```typescript
 * const anyChecked = isCheckedAny('input[type="checkbox"]');
 * ```
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
 * Sets the selected state of an option element.
 *
 * @param element - The option or select element
 * @param value - The value to select (for select elements)
 *
 * @example
 * ```typescript
 * const select = document.querySelector('select');
 * setSelectedElement(select, 'option2');
 * ```
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
 * Sets the selected state for elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param value - The value to select
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
 * Gets the selected value of a select element.
 *
 * @param element - The select element
 * @returns The selected value
 *
 * @example
 * ```typescript
 * const select = document.querySelector('select');
 * const selected = getSelectedElement(select);
 * ```
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
 * Gets all selected options from the first select matching a selector.
 *
 * @param selector - CSS selector to find element
 * @returns Array of selected option elements
 *
 * @example
 * ```typescript
 * const selectedOptions = getSelectedOptionsSelector('#multi-select');
 * ```
 */
export function getSelectedOptionsSelector(selector: string): HTMLOptionElement[] {
  const element = document.querySelector(selector);
  return element ? getSelectedOptionsElement(element) : [];
}
