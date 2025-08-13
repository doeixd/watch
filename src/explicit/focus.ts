/**
 * @module explicit/focus
 *
 * Explicit, non-overloaded focus manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from '../types';

/**
 * Focuses the given element if it is an HTMLElement.
 *
 * If `element` is falsy this function returns immediately. Only instances of
 * `HTMLElement` will receive focus; other Element subtypes are ignored.
 *
 * @param element - The element to focus (ignored if falsy or not an `HTMLElement`)
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
 * Focuses the first element that matches the provided CSS selector.
 *
 * This function is an alias of `focusSelector`.
 *
 * @param selector - CSS selector used to locate the element to focus
 */
export function focusFirst(selector: string): void {
  focusSelector(selector);
}

/**
 * Create a generator-friendly function that focuses a given element.
 *
 * The returned function is compatible with watch-style generator helpers: when yielded
 * with an Element it will call focusElement(element) (which safely no-ops for falsy inputs).
 *
 * @returns A function `(element: Element) => void` that focuses the provided element.
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
 * Remove keyboard/mouse focus from the given DOM element.
 *
 * If `element` is falsy the call is a no-op. Only instances of `HTMLElement` will
 * have their `blur()` method invoked; other Element subtypes are ignored.
 *
 * @param element - The target DOM element; only `HTMLElement` instances are blurred
 */
export function blurElement(element: Element): void {
  if (!element) return;

  if (element instanceof HTMLElement) {
    element.blur();
  }
}

/**
 * Removes focus from the first element that matches the given CSS selector.
 *
 * If no matching element is found, the function is a no-op.
 *
 * @param selector - CSS selector used to locate the element to blur.
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
 * Returns a generator-friendly function that blurs a provided element.
 *
 * The returned function accepts an Element and invokes blurElement on it.
 * Intended for use as a yielded value inside watch-style generator helpers.
 *
 * @returns A function (ElementFn) that blurs the given Element when called
 */
export function blurGen(): ElementFn<Element, void> {
  return (element: Element) => {
    blurElement(element);
  };
}

/**
 * Determine whether the given element currently has document focus.
 *
 * Returns false for falsy inputs. For non-null elements, this is true when
 * the element strictly equals `document.activeElement`.
 *
 * @param element - The element to check for focus
 * @returns `true` if `element` is the active element in the document; otherwise `false`
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
