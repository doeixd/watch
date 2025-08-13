/**
 * @module explicit/data
 *
 * Explicit, non-overloaded data attribute manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Set a data-* attribute on a single HTMLElement.
 *
 * If `element` is not present or not an HTMLElement this is a no-op. The
 * `key` should be the dataset property name (i.e. the `data-` name without the
 * `data-` prefix and using the dataset camelCase form). The `value` is
 * converted to a string before assignment.
 *
 * @param element - Target element to set the data attribute on
 * @param key - Dataset key (without the `data-` prefix)
 * @param value - Value to store; will be stringified
 */
export function setDataElement(element: Element, key: string, value: any): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.dataset[key] = String(value);
}

/**
 * Sets a data attribute on all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param key - The data key (without 'data-' prefix)
 * @param value - The data value
 *
 * @example
 * ```typescript
 * setDataSelector('.card', 'status', 'active');
 * ```
 */
export function setDataSelector(selector: string, key: string, value: any): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => setDataElement(el, key, value));
}

/**
 * Sets a data attribute on all elements matching a selector.
 * Alias for setDataSelector for clarity.
 */
export function setDataAll(selector: string, key: string, value: any): void {
  setDataSelector(selector, key, value);
}

/**
 * Sets a data-* attribute on the first element that matches a CSS selector.
 *
 * If no element matches the selector this function is a no-op. The provided
 * `value` will be stringified before being stored in the element's dataset.
 *
 * @param selector - A CSS selector used to find the first matching element
 * @param key - The dataset key (corresponds to the `data-` attribute name without the `data-` prefix)
 * @param value - Value to store; may be any type and will be converted to a string
 */
export function setDataFirst(selector: string, key: string, value: any): void {
  const element = document.querySelector(selector);
  if (element) {
    setDataElement(element, key, value);
  }
}

/**
 * Returns a function that sets the specified data-* attribute on a given Element.
 *
 * The returned function accepts an Element and delegates to `setDataElement`.
 * If the target is not an `HTMLElement` or is missing, it performs no action.
 * The provided `value` will be converted to a string when stored in `element.dataset`.
 *
 * @param key - Data attribute key (mapped to `element.dataset[key]`, corresponding to `data-{key}`)
 * @param value - Value to store; will be stringified
 * @returns A function that applies the data attribute to a provided Element
 */
export function setDataGen(key: string, value: any): ElementFn<Element, void> {
  return (element: Element) => {
    setDataElement(element, key, value);
  };
}

/**
 * Retrieve the value of a data-* attribute from a DOM element.
 *
 * Returns the string value stored in `element.dataset[key]`. If `element` is falsy
 * or not an HTMLElement, or if the attribute is not present, the function returns `undefined`.
 *
 * @param element - The element to read the data attribute from (must be an HTMLElement to succeed).
 * @param key - The dataset key (the property name inside `element.dataset`, not the full `data-` attribute).
 * @returns The attribute value as a string, or `undefined` if unavailable.
 */
export function getDataElement(element: Element, key: string): string | undefined {
  if (!element || !(element instanceof HTMLElement)) return undefined;
  return element.dataset[key];
}

/**
 * Retrieve the value of a `data-*` attribute from the first element that matches a CSS selector.
 *
 * @param selector - CSS selector used to find the first matching element
 * @param key - Data attribute key (corresponding to `element.dataset[key]`)
 * @returns The attribute value as a string, or `undefined` if no matching element is found or the attribute is absent
 */
export function getDataSelector(selector: string, key: string): string | undefined {
  const element = document.querySelector(selector);
  return element ? getDataElement(element, key) : undefined;
}

/**
 * Gets a data attribute from the first element matching a selector.
 * Alias for getDataSelector for clarity.
 */
export function getDataFirst(selector: string, key: string): string | undefined {
  return getDataSelector(selector, key);
}

/**
 * Retrieve the value of a data attribute from every element matching a CSS selector.
 *
 * Returns an array with one entry per matched element in document order. Each entry is the
 * string value of the element's `dataset[key]`, or `undefined` if the element has no such
 * data attribute or the selector matched no elements.
 *
 * @param selector - CSS selector used to find elements
 * @param key - Dataset key (the part after `data-`, e.g. `id` for `data-id`)
 * @returns An array of values or `undefined` for each matched element
 */
export function getDataAll(selector: string, key: string): (string | undefined)[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => getDataElement(el, key));
}

/**
 * Creates a function that reads the specified data-* attribute from an element.
 *
 * The returned function accepts an Element and returns the corresponding value from the element's `dataset`,
 * or `undefined` if the element is not an `HTMLElement` or the attribute is not present.
 *
 * @param key - The dataset key (camelCase, corresponding to the part after `data-`) to retrieve.
 * @returns A function that takes an `Element` and returns the data attribute value or `undefined`.
 */
export function getDataGen(key: string): ElementFn<Element, string | undefined> {
  return (element: Element) => {
    return getDataElement(element, key);
  };
}

/**
 * Return the element's `dataset` (all `data-*` attributes).
 *
 * If `element` is not an HTMLElement or is falsy, returns `undefined`.
 *
 * @param element - Element to read `data-*` attributes from; only HTMLElements expose a `dataset`.
 * @returns The element's DOMStringMap of data attributes, or `undefined` if not available.
 */
export function getAllDataElement(element: Element): DOMStringMap | undefined {
  if (!element || !(element instanceof HTMLElement)) return undefined;
  return element.dataset;
}

/**
 * Return the `dataset` (all `data-*` attributes) of the first element that matches a CSS selector.
 *
 * If no element matches the selector or the matched node is not an HTMLElement, returns `undefined`.
 *
 * @param selector - A CSS selector used to find the first matching element.
 * @returns The matched element's `DOMStringMap` (`element.dataset`) or `undefined` if not found / not an HTMLElement.
 */
export function getAllDataSelector(selector: string): DOMStringMap | undefined {
  const element = document.querySelector(selector);
  return element ? getAllDataElement(element) : undefined;
}

/**
 * Remove the data-* attribute named `key` from `element`.
 *
 * If `element` is falsy or not an HTMLElement, this function does nothing.
 *
 * @param element - Target DOM element to modify.
 * @param key - The dataset key (property on `element.dataset`) to remove.
 */
export function removeDataElement(element: Element, key: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  delete element.dataset[key];
}

/**
 * Removes the named `data-*` attribute from every element that matches the provided CSS selector.
 *
 * @param selector - CSS selector used to find elements
 * @param key - Data attribute key (the `dataset` property name, without the `data-` prefix)
 */
export function removeDataSelector(selector: string, key: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => removeDataElement(el, key));
}
