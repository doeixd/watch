/**
 * @module explicit/prop
 *
 * Explicit, non-overloaded property manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Sets a DOM property on an element.
 *
 * @param element - The element to set property on
 * @param name - The property name
 * @param value - The property value
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * setPropElement(input, 'value', 'Hello World');
 * setPropElement(input, 'disabled', true);
 * ```
 */
export function setPropElement<El extends Element, K extends keyof El>(
  element: El,
  name: K,
  value: El[K]
): void {
  if (!element) return;
  (element as any)[name] = value;
}

/**
 * Set a DOM property on every HTMLElement that matches the given CSS selector.
 *
 * Finds all elements matching `selector` and assigns `value` to the property `name` on each matched element.
 * If no elements match, the call is a no-op.
 *
 * @param selector - CSS selector used to locate target elements
 * @param name - The HTMLElement property name to set
 * @param value - The value to assign to the property
 *
 * @example
 * ```typescript
 * setPropSelector('input[type="checkbox"]', 'checked', true);
 * ```
 */
export function setPropSelector<K extends keyof HTMLElement>(
  selector: string,
  name: K,
  value: HTMLElement[K]
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => setPropElement(el as HTMLElement, name, value));
}

/**
 * Set the given property on every HTMLElement matching the provided CSS selector.
 *
 * Alias of `setPropSelector`.
 *
 * @param selector - CSS selector used to find elements
 * @param name - Property name to set on each matched element
 * @param value - Value to assign to the property
 *
 * @example
 * ```typescript
 * setPropAll('select', 'disabled', false);
 * ```
 */
export function setPropAll<K extends keyof HTMLElement>(
  selector: string,
  name: K,
  value: HTMLElement[K]
): void {
  setPropSelector(selector, name, value);
}

/**
 * Set the specified DOM property on the first element matching the CSS selector.
 *
 * If no element matches the selector, this function is a no-op.
 *
 * @param selector - CSS selector used to find the target element
 * @param name - Property name (constrained to keys of `HTMLElement`)
 * @param value - Property value to assign
 *
 * @example
 * ```typescript
 * setPropFirst('#username', 'value', 'john_doe');
 * ```
 */
export function setPropFirst<K extends keyof HTMLElement>(
  selector: string,
  name: K,
  value: HTMLElement[K]
): void {
  const element = document.querySelector(selector);
  if (element) {
    setPropElement(element as HTMLElement, name, value);
  }
}

/**
 * Create an ElementFn for use in generator/watch workflows that sets a specified property on an element.
 *
 * The returned function, when invoked with an element, assigns `value` to the element's property `name`.
 *
 * @param name - The property name (a key of the element type)
 * @param value - The value to assign to the property
 * @returns An ElementFn that sets the given property on its element and returns void
 */
export function setPropGen<El extends Element, K extends keyof El>(
  name: K,
  value: El[K]
): ElementFn<El, void> {
  return (element: El) => {
    setPropElement(element, name, value);
  };
}

/**
 * Retrieve the value of a property from a DOM element.
 *
 * Returns the property value, or `undefined` if `element` is falsy.
 *
 * @param element - The element to read the property from
 * @param name - The property name/key to retrieve
 * @returns The value of the property, or `undefined` when unavailable
 */
export function getPropElement<El extends Element, K extends keyof El>(
  element: El,
  name: K
): El[K] | undefined {
  if (!element) return undefined;
  return (element as any)[name];
}

/**
 * Gets a DOM property from the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param name - The property name
 * @returns The property value or undefined if no element found
 *
 * @example
 * ```typescript
 * const value = getPropSelector('#username', 'value');
 * const isChecked = getPropSelector('#agree', 'checked');
 * ```
 */
export function getPropSelector<K extends keyof HTMLElement>(
  selector: string,
  name: K
): HTMLElement[K] | undefined {
  const element = document.querySelector(selector);
  return element ? getPropElement(element as HTMLElement, name) : undefined;
}

/**
 * Gets a DOM property from the first element matching a selector.
 * Alias for getPropSelector for clarity.
 *
 * @param selector - CSS selector to find element
 * @param name - The property name
 * @returns The property value or undefined if no element found
 *
 * @example
 * ```typescript
 * const selectedIndex = getPropFirst('select', 'selectedIndex');
 * ```
 */
export function getPropFirst<K extends keyof HTMLElement>(
  selector: string,
  name: K
): HTMLElement[K] | undefined {
  return getPropSelector(selector, name);
}

/**
 * Retrieve the values of a specified DOM property from all elements matching a selector.
 *
 * Returns an array whose entries correspond to the matched elements in document order; each entry
 * is the property's value for that element or `undefined` if the element is absent or the value
 * cannot be retrieved.
 *
 * @param selector - CSS selector used to find elements
 * @param name - Property name to read from each matched element
 * @returns An array of property values (or `undefined`) for each matched element
 */
export function getPropAll<K extends keyof HTMLElement>(
  selector: string,
  name: K
): (HTMLElement[K] | undefined)[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => getPropElement(el as HTMLElement, name));
}

/**
 * Creates a generator-compatible function that reads a named property from an element.
 *
 * The returned function takes an element and returns the element's property value or `undefined`.
 * Designed for use in watch-style generator workflows where the function is yielded to obtain a value.
 *
 * @param name - The property name to read from the element
 * @returns An ElementFn that returns the property's value (or `undefined`)
 *
 * @example
 * ```typescript
 * watch('input', function* () {
 *   const value = yield getPropGen('value');
 *   const disabled = yield getPropGen('disabled');
 * });
 * ```
 */
export function getPropGen<El extends Element, K extends keyof El>(
  name: K
): ElementFn<El, El[K] | undefined> {
  return (element: El) => {
    return getPropElement(element, name);
  };
}

/**
 * Copy a property value from a source element to a target element.
 *
 * If either element is falsy the function is a no-op. The target property is only
 * set when the source property's value is not `undefined`.
 *
 * @param source - The element to read the property value from
 * @param target - The element to write the property value to
 * @param name - The property name to copy
 *
 * @example
 * ```typescript
 * const input1 = document.querySelector<HTMLInputElement>('#input1');
 * const input2 = document.querySelector<HTMLInputElement>('#input2');
 * copyPropElement(input1, input2, 'value');
 * ```
 */
export function copyPropElement<El extends Element, K extends keyof El>(
  source: El,
  target: El,
  name: K
): void {
  if (!source || !target) return;
  const value = getPropElement(source, name);
  if (value !== undefined) {
    setPropElement(target, name, value);
  }
}

/**
 * Swap the given property between two elements.
 *
 * Swaps the property `name` values of `element1` and `element2`. No action is taken if either element is falsy or if either element's property value is `undefined`.
 *
 * @param element1 - First element whose property will be swapped
 * @param element2 - Second element whose property will be swapped
 * @param name - Property name to swap
 *
 * @example
 * ```typescript
 * const input1 = document.querySelector<HTMLInputElement>('#input1');
 * const input2 = document.querySelector<HTMLInputElement>('#input2');
 * swapPropElement(input1, input2, 'value');
 * ```
 */
export function swapPropElement<El extends Element, K extends keyof El>(
  element1: El,
  element2: El,
  name: K
): void {
  if (!element1 || !element2) return;
  const value1 = getPropElement(element1, name);
  const value2 = getPropElement(element2, name);
  if (value1 !== undefined && value2 !== undefined) {
    setPropElement(element1, name, value2);
    setPropElement(element2, name, value1);
  }
}
