/**
 * @module explicit/attr
 *
 * Explicit, non-overloaded attribute manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Sets an attribute on an element.
 *
 * @param element - The element to set attribute on
 * @param name - The attribute name
 * @param value - The attribute value
 *
 * @example
 * ```typescript
 * const link = document.querySelector('a');
 * setAttrElement(link, 'href', 'https://example.com');
 * ```
 */
export function setAttrElement(element: Element, name: string, value: string | number | boolean): void {
  if (!element) return;
  element.setAttribute(name, String(value));
}

/**
 * Sets an attribute on all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param name - The attribute name
 * @param value - The attribute value
 *
 * @example
 * ```typescript
 * setAttrSelector('input', 'disabled', 'true');
 * ```
 */
export function setAttrSelector(selector: string, name: string, value: string | number | boolean): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => setAttrElement(el, name, value));
}

/**
 * Sets an attribute on all elements matching a selector.
 * Alias for setAttrSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param name - The attribute name
 * @param value - The attribute value
 *
 * @example
 * ```typescript
 * setAttrAll('[data-toggle]', 'aria-expanded', 'false');
 * ```
 */
export function setAttrAll(selector: string, name: string, value: string | number | boolean): void {
  setAttrSelector(selector, name, value);
}

/**
 * Sets an attribute on the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param name - The attribute name
 * @param value - The attribute value
 *
 * @example
 * ```typescript
 * setAttrFirst('#main-form', 'action', '/submit');
 * ```
 */
export function setAttrFirst(selector: string, name: string, value: string | number | boolean): void {
  const element = document.querySelector(selector);
  if (element) {
    setAttrElement(element, name, value);
  }
}

/**
 * Returns a generator function that sets an attribute.
 * For use within watch generators.
 *
 * @param name - The attribute name
 * @param value - The attribute value
 * @returns ElementFn that sets attribute when yielded
 *
 * @example
 * ```typescript
 * watch('button', function* () {
 *   yield setAttrGen('aria-pressed', 'false');
 * });
 * ```
 */
export function setAttrGen(name: string, value: string | number | boolean): ElementFn<Element, void> {
  return (element: Element) => {
    setAttrElement(element, name, value);
  };
}

/**
 * Gets an attribute from an element.
 *
 * @param element - The element to get attribute from
 * @param name - The attribute name
 * @returns The attribute value or null if not set
 *
 * @example
 * ```typescript
 * const link = document.querySelector('a');
 * const href = getAttrElement(link, 'href');
 * ```
 */
export function getAttrElement(element: Element, name: string): string | null {
  if (!element) return null;
  return element.getAttribute(name);
}

/**
 * Gets an attribute from the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param name - The attribute name
 * @returns The attribute value or null if not set or no element found
 *
 * @example
 * ```typescript
 * const imageSrc = getAttrSelector('img', 'src');
 * ```
 */
export function getAttrSelector(selector: string, name: string): string | null {
  const element = document.querySelector(selector);
  return element ? getAttrElement(element, name) : null;
}

/**
 * Gets an attribute from the first element matching a selector.
 * Alias for getAttrSelector for clarity.
 *
 * @param selector - CSS selector to find element
 * @param name - The attribute name
 * @returns The attribute value or null if not set or no element found
 *
 * @example
 * ```typescript
 * const id = getAttrFirst('.active', 'data-id');
 * ```
 */
export function getAttrFirst(selector: string, name: string): string | null {
  return getAttrSelector(selector, name);
}

/**
 * Gets an attribute from all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param name - The attribute name
 * @returns Array of attribute values (null for elements without the attribute)
 *
 * @example
 * ```typescript
 * const hrefs = getAttrAll('a', 'href');
 * ```
 */
export function getAttrAll(selector: string, name: string): (string | null)[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => getAttrElement(el, name));
}

/**
 * Returns a generator function that gets an attribute.
 * For use within watch generators.
 *
 * @param name - The attribute name
 * @returns ElementFn that gets attribute when yielded
 *
 * @example
 * ```typescript
 * watch('a', function* () {
 *   const href = yield getAttrGen('href');
 * });
 * ```
 */
export function getAttrGen(name: string): ElementFn<Element, string | null> {
  return (element: Element) => {
    return getAttrElement(element, name);
  };
}

/**
 * Removes an attribute from an element.
 *
 * @param element - The element to remove attribute from
 * @param name - The attribute name
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * removeAttrElement(input, 'disabled');
 * ```
 */
export function removeAttrElement(element: Element, name: string): void {
  if (!element) return;
  element.removeAttribute(name);
}

/**
 * Removes an attribute from all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param name - The attribute name
 *
 * @example
 * ```typescript
 * removeAttrSelector('input', 'readonly');
 * ```
 */
export function removeAttrSelector(selector: string, name: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => removeAttrElement(el, name));
}

/**
 * Removes an attribute from all elements matching a selector.
 * Alias for removeAttrSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param name - The attribute name
 *
 * @example
 * ```typescript
 * removeAttrAll('.editable', 'contenteditable');
 * ```
 */
export function removeAttrAll(selector: string, name: string): void {
  removeAttrSelector(selector, name);
}

/**
 * Removes an attribute from the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param name - The attribute name
 *
 * @example
 * ```typescript
 * removeAttrFirst('#modal', 'aria-hidden');
 * ```
 */
export function removeAttrFirst(selector: string, name: string): void {
  const element = document.querySelector(selector);
  if (element) {
    removeAttrElement(element, name);
  }
}

/**
 * Returns a generator function that removes an attribute.
 * For use within watch generators.
 *
 * @param name - The attribute name
 * @returns ElementFn that removes attribute when yielded
 *
 * @example
 * ```typescript
 * watch('button', function* () {
 *   yield removeAttrGen('disabled');
 * });
 * ```
 */
export function removeAttrGen(name: string): ElementFn<Element, void> {
  return (element: Element) => {
    removeAttrElement(element, name);
  };
}

/**
 * Checks if an element has an attribute.
 *
 * @param element - The element to check
 * @param name - The attribute name
 * @returns Whether the element has the attribute
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * if (hasAttrElement(input, 'required')) {
 *   console.log('Input is required');
 * }
 * ```
 */
export function hasAttrElement(element: Element, name: string): boolean {
  if (!element) return false;
  return element.hasAttribute(name);
}

/**
 * Checks if the first element matching a selector has an attribute.
 *
 * @param selector - CSS selector to find element
 * @param name - The attribute name
 * @returns Whether the element has the attribute, or null if no element
 *
 * @example
 * ```typescript
 * const hasDisabled = hasAttrSelector('#submit', 'disabled');
 * ```
 */
export function hasAttrSelector(selector: string, name: string): boolean | null {
  const element = document.querySelector(selector);
  return element ? hasAttrElement(element, name) : null;
}

/**
 * Checks if all elements matching a selector have an attribute.
 *
 * @param selector - CSS selector to find elements
 * @param name - The attribute name
 * @returns Array of boolean results for each element
 *
 * @example
 * ```typescript
 * const results = hasAttrAll('input', 'required');
 * ```
 */
export function hasAttrAll(selector: string, name: string): boolean[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => hasAttrElement(el, name));
}

/**
 * Checks if any element matching a selector has an attribute.
 *
 * @param selector - CSS selector to find elements
 * @param name - The attribute name
 * @returns Whether any element has the attribute
 *
 * @example
 * ```typescript
 * if (hasAttrAny('input', 'disabled')) {
 *   console.log('At least one input is disabled');
 * }
 * ```
 */
export function hasAttrAny(selector: string, name: string): boolean {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).some(el => hasAttrElement(el, name));
}

/**
 * Returns a generator function that checks for an attribute.
 * For use within watch generators.
 *
 * @param name - The attribute name
 * @returns ElementFn that checks attribute when yielded
 *
 * @example
 * ```typescript
 * watch('input', function* () {
 *   const hasRequired = yield hasAttrGen('required');
 * });
 * ```
 */
export function hasAttrGen(name: string): ElementFn<Element, boolean> {
  return (element: Element) => {
    return hasAttrElement(element, name);
  };
}

/**
 * Toggles an attribute on an element (adds if missing, removes if present).
 *
 * @param element - The element to toggle attribute on
 * @param name - The attribute name
 * @param value - Optional value to set when adding
 * @returns Whether the attribute is present after toggling
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * toggleAttrElement(button, 'aria-expanded');
 * ```
 */
export function toggleAttrElement(element: Element, name: string, value?: string): boolean {
  if (!element) return false;
  if (element.hasAttribute(name)) {
    element.removeAttribute(name);
    return false;
  } else {
    element.setAttribute(name, value || '');
    return true;
  }
}

/**
 * Toggles an attribute on all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param name - The attribute name
 * @param value - Optional value to set when adding
 * @returns Array of boolean results for each element
 *
 * @example
 * ```typescript
 * toggleAttrSelector('[data-toggle]', 'aria-expanded');
 * ```
 */
export function toggleAttrSelector(selector: string, name: string, value?: string): boolean[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => toggleAttrElement(el, name, value));
}
