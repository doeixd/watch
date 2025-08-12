/**
 * @module explicit/style
 *
 * Explicit, non-overloaded style manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Apply multiple inline CSS styles to an element.
 *
 * If `element` is falsy or not an `HTMLElement` the function is a no-op.
 *
 * @param element - Target element (must be an `HTMLElement`; otherwise nothing is applied)
 * @param styles - Partial `CSSStyleDeclaration` whose properties are merged into the element's inline `style`
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * setStylesElement(div, { color: 'red', fontSize: '16px' });
 * ```
 */
export function setStylesElement(element: Element, styles: Partial<CSSStyleDeclaration>): void {
  if (!element || !(element instanceof HTMLElement)) return;
  Object.assign(element.style, styles);
}

/**
 * Sets multiple CSS styles on all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param styles - Object with style properties
 *
 * @example
 * ```typescript
 * setStylesSelector('.card', { padding: '10px', border: '1px solid gray' });
 * ```
 */
export function setStylesSelector(selector: string, styles: Partial<CSSStyleDeclaration>): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => setStylesElement(el, styles));
}

/**
 * Sets multiple CSS styles on all elements matching a selector.
 * Alias for setStylesSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param styles - Object with style properties
 *
 * @example
 * ```typescript
 * setStylesAll('.item', { backgroundColor: 'white' });
 * ```
 */
export function setStylesAll(selector: string, styles: Partial<CSSStyleDeclaration>): void {
  setStylesSelector(selector, styles);
}

/**
 * Sets multiple CSS styles on the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param styles - Object with style properties
 *
 * @example
 * ```typescript
 * setStylesFirst('#header', { position: 'sticky', top: '0' });
 * ```
 */
export function setStylesFirst(selector: string, styles: Partial<CSSStyleDeclaration>): void {
  const element = document.querySelector(selector);
  if (element) {
    setStylesElement(element, styles);
  }
}

/**
 * Create a generator-friendly function that applies multiple inline styles to an element.
 *
 * Returns an ElementFn suitable for yielding in watch-style generator flows; when invoked with
 * an element it applies the provided `styles` to that element's inline style.
 *
 * @param styles - Partial CSS style declarations to apply to the target element
 * @returns An ElementFn that applies `styles` to a given element when called
 */
export function setStylesGen(styles: Partial<CSSStyleDeclaration>): ElementFn<Element, void> {
  return (element: Element) => {
    setStylesElement(element, styles);
  };
}

/**
 * Set a single CSS style property on an element's inline style.
 *
 * If `element` is falsy or not an HTMLElement the call is a no-op.
 *
 * @param element - Target element to modify.
 * @param prop - Name of the `CSSStyleDeclaration` property (typically camelCase, e.g. `backgroundColor`).
 * @param value - CSS value to assign (as a string), e.g. `"10px"`, `"red"`, `"block"`.
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * setStyleElement(button, 'backgroundColor', 'blue');
 * ```
 */
export function setStyleElement(element: Element, prop: string, value: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  (element.style as any)[prop] = value;
}

/**
 * Sets a single CSS style property on all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param prop - The style property name
 * @param value - The style value
 *
 * @example
 * ```typescript
 * setStyleSelector('.highlight', 'backgroundColor', 'yellow');
 * ```
 */
export function setStyleSelector(selector: string, prop: string, value: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => setStyleElement(el, prop, value));
}

/**
 * Sets a single CSS style property on all elements matching a selector.
 * Alias for setStyleSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param prop - The style property name
 * @param value - The style value
 *
 * @example
 * ```typescript
 * setStyleAll('.item', 'display', 'block');
 * ```
 */
export function setStyleAll(selector: string, prop: string, value: string): void {
  setStyleSelector(selector, prop, value);
}

/**
 * Sets a single CSS style property on the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param prop - The style property name
 * @param value - The style value
 *
 * @example
 * ```typescript
 * setStyleFirst('#banner', 'height', '200px');
 * ```
 */
export function setStyleFirst(selector: string, prop: string, value: string): void {
  const element = document.querySelector(selector);
  if (element) {
    setStyleElement(element, prop, value);
  }
}

/**
 * Creates a generator-friendly function that sets a single inline CSS property on an element.
 *
 * The returned function is suitable for use in watch-style generator flows; when invoked with an
 * Element it applies `value` to the element's inline style for `prop`.
 *
 * @param prop - CSS property name (e.g., `"backgroundColor"` or `"border-top"`).
 * @param value - CSS value to assign to the property (e.g., `"10px"`, `"red"`, `"none"`).
 * @returns An ElementFn that applies the specified style to a provided element.
 */
export function setStyleGen(prop: string, value: string): ElementFn<Element, void> {
  return (element: Element) => {
    setStyleElement(element, prop, value);
  };
}

/**
 * Get an element's inline CSS property value.
 *
 * Returns the value of `prop` from the element's inline `style` or an empty string
 * if the element is not an HTMLElement, the property is unset, or no element was provided.
 *
 * @param element - The target DOM element
 * @param prop - The CSS property name (as used on `element.style`, e.g. `"backgroundColor"` or `"border-left"` for `getPropertyValue`)
 * @returns The inline style value for `prop`, or an empty string when not available
 */
export function getStyleElement(element: Element, prop: string): string {
  if (!element || !(element instanceof HTMLElement)) return '';
  return (element.style as any)[prop] || '';
}

/**
 * Gets a CSS style property from the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param prop - The style property name
 * @returns The style value or null if no element found
 *
 * @example
 * ```typescript
 * const bgColor = getStyleSelector('#header', 'backgroundColor');
 * ```
 */
export function getStyleSelector(selector: string, prop: string): string | null {
  const element = document.querySelector(selector);
  return element ? getStyleElement(element, prop) : null;
}

/**
 * Gets a CSS style property from the first element matching a selector.
 * Alias for getStyleSelector for clarity.
 *
 * @param selector - CSS selector to find element
 * @param prop - The style property name
 * @returns The style value or null if no element found
 *
 * @example
 * ```typescript
 * const width = getStyleFirst('.container', 'width');
 * ```
 */
export function getStyleFirst(selector: string, prop: string): string | null {
  return getStyleSelector(selector, prop);
}

/**
 * Retrieve the inline value of a CSS property from every element matching a selector.
 *
 * Returns the inline `style` value for `prop` from each matched element in document order. If no elements match, an empty array is returned.
 *
 * @param selector - CSS selector used to locate elements (queried with `document.querySelectorAll`)
 * @param prop - CSS property name to read from each element's inline `style`
 * @returns Array of inline style values (empty if no matches)
 *
 * @example
 * ```typescript
 * const heights = getStyleAll('.item', 'height');
 * ```
 */
export function getStyleAll(selector: string, prop: string): string[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => getStyleElement(el, prop));
}

/**
 * Create a generator-friendly function that returns an element's inline style value for a given CSS property.
 *
 * The returned function is suitable for use in watch-style generator flows: when yielded it will be invoked
 * with an element and return the element's inline style value for `prop` (or an empty string if the element is
 * invalid or the property is not present).
 *
 * @param prop - CSS property name to read from the element's inline styles
 * @returns A function that takes an Element and returns the inline style value for `prop`
 */
export function getStyleGen(prop: string): ElementFn<Element, string> {
  return (element: Element) => {
    return getStyleElement(element, prop);
  };
}

/**
 * Remove an inline CSS property from an element.
 *
 * Removes the given CSS property from the element's inline style. If `element` is falsy or not an HTMLElement this is a no-op.
 *
 * @param element - The target element to modify.
 * @param prop - The CSS property name to remove (use CSS syntax, e.g. `"background-color"`, not the camelCase JS style name).
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * removeStyleElement(div, 'background-color');
 * ```
 */
export function removeStyleElement(element: Element, prop: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.style.removeProperty(prop);
}

/**
 * Removes a CSS style property from all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param prop - The style property name to remove
 *
 * @example
 * ```typescript
 * removeStyleSelector('.temporary', 'transform');
 * ```
 */
export function removeStyleSelector(selector: string, prop: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => removeStyleElement(el, prop));
}

/**
 * Return the computed value of a CSS property for the given element.
 *
 * If `element` is falsy or not an HTMLElement, returns an empty string.
 *
 * @param prop - The CSS property name (as used in getComputedStyle, e.g. `"background-color"` or `"height"`)
 * @returns The computed property value, or `''` when the element is invalid
 */
export function computedStyleElement(element: Element, prop: string): string {
  if (!element || !(element instanceof HTMLElement)) return '';
  const computed = window.getComputedStyle(element);
  return computed.getPropertyValue(prop);
}

/**
 * Gets computed style property from the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param prop - The style property name
 * @returns The computed style value or null if no element found
 *
 * @example
 * ```typescript
 * const actualWidth = computedStyleSelector('.container', 'width');
 * ```
 */
export function computedStyleSelector(selector: string, prop: string): string | null {
  const element = document.querySelector(selector);
  return element ? computedStyleElement(element, prop) : null;
}
