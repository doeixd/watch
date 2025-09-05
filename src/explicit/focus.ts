/**
 * @module explicit/focus
 *
 * Explicit, non-overloaded focus manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Sets focus on an element.
 *
 * @param element - The element to focus
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * focusElement(input);
 * ```
 */
export function focusElement(element: Element): void {
  if (!element) return;

  if (element instanceof HTMLElement) {
    element.focus();
  }
}

/**
 * Sets focus on the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 *
 * @example
 * ```typescript
 * focusSelector('#username');
 * ```
 */
export function focusSelector(selector: string): void {
  const element = document.querySelector(selector);
  if (element) {
    focusElement(element);
  }
}

/**
 * Sets focus on the first element matching a selector.
 * Alias for focusSelector for clarity.
 *
 * @param selector - CSS selector to find element
 *
 * @example
 * ```typescript
 * focusFirst('input[type="text"]');
 * ```
 */
export function focusFirst(selector: string): void {
  focusSelector(selector);
}

/**
 * Returns a generator function that sets focus.
 * For use within watch generators.
 *
 * @returns ElementFn that sets focus when yielded
 *
 * @example
 * ```typescript
 * watch('input', function* () {
 *   yield focusGen();
 * });
 * ```
 */
export function focusGen(): ElementFn<Element, void> {
  return (element: Element) => {
    focusElement(element);
  };
}

/**
 * Removes focus from an element.
 *
 * @param element - The element to blur
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * blurElement(input);
 * ```
 */
export function blurElement(element: Element): void {
  if (!element) return;

  if (element instanceof HTMLElement) {
    element.blur();
  }
}

/**
 * Removes focus from the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 *
 * @example
 * ```typescript
 * blurSelector('#username');
 * ```
 */
export function blurSelector(selector: string): void {
  const element = document.querySelector(selector);
  if (element) {
    blurElement(element);
  }
}

/**
 * Removes focus from the first element matching a selector.
 * Alias for blurSelector for clarity.
 *
 * @param selector - CSS selector to find element
 *
 * @example
 * ```typescript
 * blurFirst('input[type="text"]');
 * ```
 */
export function blurFirst(selector: string): void {
  blurSelector(selector);
}

/**
 * Returns a generator function that removes focus.
 * For use within watch generators.
 *
 * @returns ElementFn that removes focus when yielded
 *
 * @example
 * ```typescript
 * watch('input', function* () {
 *   yield blurGen();
 * });
 * ```
 */
export function blurGen(): ElementFn<Element, void> {
  return (element: Element) => {
    blurElement(element);
  };
}

/**
 * Checks if an element has focus.
 *
 * @param element - The element to check
 * @returns True if the element has focus
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input');
 * const focused = hasFocusElement(input);
 * ```
 */
export function hasFocusElement(element: Element): boolean {
  if (!element) return false;
  return element === document.activeElement;
}

/**
 * Checks if the first element matching a selector has focus.
 *
 * @param selector - CSS selector to find element
 * @returns True if focused, false if not, null if element not found
 *
 * @example
 * ```typescript
 * const isUsernameFocused = hasFocusSelector('#username');
 * ```
 */
export function hasFocusSelector(selector: string): boolean | null {
  const element = document.querySelector(selector);
  return element ? hasFocusElement(element) : null;
}
