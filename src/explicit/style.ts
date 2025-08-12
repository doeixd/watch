/**
 * @module explicit/style
 *
 * Explicit, non-overloaded style manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Sets multiple CSS styles on an element.
 *
 * @param element - The element to style
 * @param styles - Object with style properties
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
 * Returns a generator function that sets multiple styles.
 * For use within watch generators.
 *
 * @param styles - Object with style properties
 * @returns ElementFn that sets styles when yielded
 *
 * @example
 * ```typescript
 * watch('div', function* () {
 *   yield setStylesGen({ color: 'blue', padding: '20px' });
 * });
 * ```
 */
export function setStylesGen(styles: Partial<CSSStyleDeclaration>): ElementFn<Element, void> {
  return (element: Element) => {
    setStylesElement(element, styles);
  };
}

/**
 * Sets a single CSS style property on an element.
 *
 * @param element - The element to style
 * @param prop - The style property name
 * @param value - The style value
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
 * Returns a generator function that sets a single style.
 * For use within watch generators.
 *
 * @param prop - The style property name
 * @param value - The style value
 * @returns ElementFn that sets style when yielded
 *
 * @example
 * ```typescript
 * watch('button', function* () {
 *   yield setStyleGen('cursor', 'pointer');
 * });
 * ```
 */
export function setStyleGen(prop: string, value: string): ElementFn<Element, void> {
  return (element: Element) => {
    setStyleElement(element, prop, value);
  };
}

/**
 * Gets a CSS style property from an element.
 *
 * @param element - The element to get style from
 * @param prop - The style property name
 * @returns The style value
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * const color = getStyleElement(div, 'color');
 * ```
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
 * Gets a CSS style property from all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param prop - The style property name
 * @returns Array of style values
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
 * Returns a generator function that gets a style property.
 * For use within watch generators.
 *
 * @param prop - The style property name
 * @returns ElementFn that gets style when yielded
 *
 * @example
 * ```typescript
 * watch('div', function* () {
 *   const display = yield getStyleGen('display');
 * });
 * ```
 */
export function getStyleGen(prop: string): ElementFn<Element, string> {
  return (element: Element) => {
    return getStyleElement(element, prop);
  };
}

/**
 * Removes a CSS style property from an element.
 *
 * @param element - The element to modify
 * @param prop - The style property name to remove
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * removeStyleElement(div, 'backgroundColor');
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
 * Gets computed style property from an element.
 *
 * @param element - The element to get computed style from
 * @param prop - The style property name
 * @returns The computed style value
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * const actualHeight = computedStyleElement(div, 'height');
 * ```
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
