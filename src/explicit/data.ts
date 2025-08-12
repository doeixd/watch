/**
 * @module explicit/data
 *
 * Explicit, non-overloaded data attribute manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Sets a data attribute on an element.
 *
 * @param element - The element to set data on
 * @param key - The data key (without 'data-' prefix)
 * @param value - The data value
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * setDataElement(div, 'userId', '123');
 * ```
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
 * Sets a data attribute on the first element matching a selector.
 */
export function setDataFirst(selector: string, key: string, value: any): void {
  const element = document.querySelector(selector);
  if (element) {
    setDataElement(element, key, value);
  }
}

/**
 * Returns a generator function that sets a data attribute.
 */
export function setDataGen(key: string, value: any): ElementFn<Element, void> {
  return (element: Element) => {
    setDataElement(element, key, value);
  };
}

/**
 * Gets a data attribute from an element.
 */
export function getDataElement(element: Element, key: string): string | undefined {
  if (!element || !(element instanceof HTMLElement)) return undefined;
  return element.dataset[key];
}

/**
 * Gets a data attribute from the first element matching a selector.
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
 * Gets a data attribute from all elements matching a selector.
 */
export function getDataAll(selector: string, key: string): (string | undefined)[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => getDataElement(el, key));
}

/**
 * Returns a generator function that gets a data attribute.
 */
export function getDataGen(key: string): ElementFn<Element, string | undefined> {
  return (element: Element) => {
    return getDataElement(element, key);
  };
}

/**
 * Gets all data attributes from an element.
 */
export function getAllDataElement(element: Element): DOMStringMap | undefined {
  if (!element || !(element instanceof HTMLElement)) return undefined;
  return element.dataset;
}

/**
 * Gets all data attributes from the first element matching a selector.
 */
export function getAllDataSelector(selector: string): DOMStringMap | undefined {
  const element = document.querySelector(selector);
  return element ? getAllDataElement(element) : undefined;
}

/**
 * Removes a data attribute from an element.
 */
export function removeDataElement(element: Element, key: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  delete element.dataset[key];
}

/**
 * Removes a data attribute from all elements matching a selector.
 */
export function removeDataSelector(selector: string, key: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => removeDataElement(el, key));
}
