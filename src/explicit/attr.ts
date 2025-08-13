/**
 * @module explicit/attr
 *
 * Explicit, non-overloaded attribute manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Set a stringified attribute value on a single Element.
 *
 * If `element` is null/undefined the function returns without side effects. The `value` is coerced to a string before being set.
 *
 * @param element - The target Element (may be null/undefined; no-op in that case)
 * @param value - The attribute value; will be converted to a string
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
 * Set the specified attribute on every element matching the given CSS selector.
 *
 * The provided `value` is coerced to a string before being set. If no elements match the selector, the function does nothing.
 *
 * @param selector - CSS selector used to find target elements
 * @param name - Attribute name to set
 * @param value - Attribute value; will be converted to a string
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
 * Create an ElementFn that sets a given attribute on an element.
 *
 * The returned function is intended for use inside watch generators (it can be yielded).
 * The attribute value is coerced to string when applied; if the provided element is falsy
 * the operation is a no-op.
 *
 * @param name - Attribute name to set
 * @param value - Attribute value (string, number, or boolean). Will be coerced to a string.
 * @returns An ElementFn that sets the attribute on the provided element when invoked
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
 * Creates an ElementFn that retrieves the given attribute from an element.
 *
 * The returned function accepts an Element and returns the attribute value or `null` if the
 * element is falsy or the attribute is not present. Intended for use in generator-style
 * watch flows where the function is yielded.
 *
 * @param name - Attribute name to retrieve
 * @returns An ElementFn that, when given an element, returns the attribute value or `null`
 */
export function getAttrGen(name: string): ElementFn<Element, string | null> {
  return (element: Element) => {
    return getAttrElement(element, name);
  };
}

/**
 * Remove a named attribute from a single Element.
 *
 * If `element` is falsy the call is a no-op. Otherwise removes the attribute with the given `name`.
 *
 * @param element - The target Element (may be null/undefined; function will no-op)
 * @param name - Attribute name to remove
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
 * Creates a generator-friendly callback that removes the given attribute from an element.
 *
 * The returned function is intended to be yielded inside watch generators; when invoked with an
 * Element it calls `removeAttrElement` for the provided attribute name.
 *
 * @param name - The attribute name to remove
 * @returns A function that, given an Element, removes the named attribute
 */
export function removeAttrGen(name: string): ElementFn<Element, void> {
  return (element: Element) => {
    removeAttrElement(element, name);
  };
}

/**
 * Returns true if the provided Element has the specified attribute.
 *
 * If `element` is falsy the function returns `false`.
 *
 * @param element - Element to inspect
 * @param name - Attribute name to check
 * @returns True when the attribute is present, otherwise false
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
 * Returns a boolean for each element matching `selector` indicating whether it has the attribute `name`.
 *
 * The result array preserves document order and will be empty if no elements match.
 *
 * @param selector - CSS selector used to locate elements
 * @param name - Attribute name to check for on each element
 * @returns An array of booleans corresponding to the matched elements
 */
export function hasAttrAll(selector: string, name: string): boolean[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => hasAttrElement(el, name));
}

/**
 * Return true if any element matching the selector has the given attribute.
 *
 * Returns false when no elements match the selector or when none of the matched
 * elements have the attribute.
 *
 * @param selector - CSS selector used to find elements to check
 * @param name - Attribute name to test for
 * @returns True if at least one matched element has the attribute, otherwise false
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
 * Returns a generator-friendly function that checks whether a given element has the specified attribute.
 *
 * The returned ElementFn accepts an Element and returns `true` if the attribute is present, otherwise `false`.
 *
 * @param name - Attribute name to check on each element
 * @returns An ElementFn that performs the attribute presence check
 */
export function hasAttrGen(name: string): ElementFn<Element, boolean> {
  return (element: Element) => {
    return hasAttrElement(element, name);
  };
}

/**
 * Toggle the presence of an attribute on a given Element.
 *
 * If the attribute is present it is removed; if absent it is added with the provided value (or an empty string).
 *
 * @param element - The element to operate on; if falsy the function returns `false` and makes no changes.
 * @param name - The attribute name to toggle.
 * @param value - Optional value to set when adding the attribute; defaults to `''`.
 * @returns `true` if the attribute is present after toggling, `false` otherwise (also `false` when `element` is falsy).
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
