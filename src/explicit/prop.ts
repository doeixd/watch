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
 * Sets a DOM property on all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param name - The property name
 * @param value - The property value
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
 * Sets a DOM property on all elements matching a selector.
 * Alias for setPropSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param name - The property name
 * @param value - The property value
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
 * Sets a DOM property on the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param name - The property name
 * @param value - The property value
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
 * Returns a generator function that sets a property.
 * For use within watch generators.
 *
 * @param name - The property name
 * @param value - The property value
 * @returns ElementFn that sets property when yielded
 *
 * @example
 * ```typescript
 * watch('input', function* () {
 *   yield setPropGen('value', 'Default text');
 *   yield setPropGen('disabled', false);
 * });
 * ```
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
 * Gets a DOM property from an element.
 *
 * @param element - The element to get property from
 * @param name - The property name
 * @returns The property value
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * const value = getPropElement(input, 'value');
 * const isDisabled = getPropElement(input, 'disabled');
 * ```
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
 * Gets a DOM property from all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param name - The property name
 * @returns Array of property values
 *
 * @example
 * ```typescript
 * const values = getPropAll('input', 'value');
 * const checkedStates = getPropAll('input[type="checkbox"]', 'checked');
 * ```
 */
export function getPropAll<K extends keyof HTMLElement>(
  selector: string,
  name: K
): (HTMLElement[K] | undefined)[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map(el => getPropElement(el as HTMLElement, name));
}

/**
 * Returns a generator function that gets a property.
 * For use within watch generators.
 *
 * @param name - The property name
 * @returns ElementFn that gets property when yielded
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
 * Copies a property value from one element to another.
 *
 * @param source - The source element
 * @param target - The target element
 * @param name - The property name to copy
 *
 * @example
 * ```typescript
 * const input1 = document.querySelector('#input1');
 * const input2 = document.querySelector('#input2');
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
 * Swaps a property value between two elements.
 *
 * @param element1 - The first element
 * @param element2 - The second element
 * @param name - The property name to swap
 *
 * @example
 * ```typescript
 * const input1 = document.querySelector('#input1');
 * const input2 = document.querySelector('#input2');
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
