/**
 * @module explicit/visibility
 *
 * Explicit, non-overloaded visibility manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from "../types";

/**
 * Make an element visible by clearing its inline `display` style.
 *
 * If `element` is an `HTMLElement`, this clears the inline `display` value (sets it to `""` and removes the `display` property)
 * so the element will follow stylesheet or browser default layout rules. No action is taken for falsy values or non-HTMLElements.
 *
 * @param element - The element to show; may be `null`/`undefined`, in which case the function is a no-op.
 */
export function showElement(element: Element): void {
  if (!element) return;

  if (element instanceof HTMLElement) {
    element.style.display = "";

    // Remove display property to restore default
    element.style.removeProperty("display");
  }
}

/**
 * Shows all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 *
 * @example
 * ```typescript
 * showSelector('.hidden-item');
 * ```
 */
export function showSelector(selector: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => showElement(el));
}

/**
 * Show all elements matching the given CSS selector.
 *
 * Alias of `showSelector` that delegates to that implementation.
 */
export function showAll(selector: string): void {
  showSelector(selector);
}

/**
 * Shows the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 *
 * @example
 * ```typescript
 * showFirst('#notification');
 * ```
 */
export function showFirst(selector: string): void {
  const element = document.querySelector(selector);
  if (element) {
    showElement(element);
  }
}

/**
 * Returns a function that shows a given element.
 *
 * The returned ElementFn calls `showElement` for the provided element and is intended for use in watch/generator flows.
 *
 * @returns A function that accepts an Element and shows it (void).
 */
export function showGen(): ElementFn<Element, void> {
  return (element: Element) => {
    showElement(element);
  };
}

/**
 * Hide the given element by setting its inline `display` style to `"none"`.
 *
 * If `element` is falsy or not an `HTMLElement`, this function does nothing.
 *
 * @param element - The element to hide; only `HTMLElement` instances are affected
 */
export function hideElement(element: Element): void {
  if (!element) return;

  if (element instanceof HTMLElement) {
    element.style.display = "none";
  }
}

/**
 * Hides all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 *
 * @example
 * ```typescript
 * hideSelector('.sensitive-data');
 * ```
 */
export function hideSelector(selector: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => hideElement(el));
}

/**
 * Hides all elements that match the given CSS selector.
 *
 * Alias for `hideSelector` that delegates to the selector-based hide operation.
 *
 * @param selector - CSS selector used to find elements to hide
 */
export function hideAll(selector: string): void {
  hideSelector(selector);
}

/**
 * Hides the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 *
 * @example
 * ```typescript
 * hideFirst('#loading-spinner');
 * ```
 */
export function hideFirst(selector: string): void {
  const element = document.querySelector(selector);
  if (element) {
    hideElement(element);
  }
}

/**
 * Returns a generator-friendly function that hides a given element.
 *
 * The returned ElementFn can be yielded in watch/generator flows; when invoked with an Element it calls `hideElement` to set its inline display to `"none"`.
 *
 * @returns An ElementFn<Element, void> that hides the provided element when invoked.
 */
export function hideGen(): ElementFn<Element, void> {
  return (element: Element) => {
    hideElement(element);
  };
}

/**
 * Toggle an element's visibility by manipulating its inline `display` style.
 *
 * If `force` is provided, the element is shown when `true` and hidden when `false`.
 * If `force` is omitted, the function checks the element's inline `display` value:
 * if it strictly equals `"none"` the element is shown; otherwise it is hidden.
 *
 * Non-HTMLElement inputs or falsy `element` values are ignored (no-op).
 *
 * @param element - The target element (must be an HTMLElement to be affected)
 * @param force - Optional: explicitly show (`true`) or hide (`false`) the element
 *
 * @example
 * ```typescript
 * const dropdown = document.querySelector('.dropdown');
 * toggleElement(dropdown); // toggles based on inline display
 * toggleElement(dropdown, true); // forces show
 * ```
 */
export function toggleElement(element: Element, force?: boolean): void {
  if (!element) return;

  if (element instanceof HTMLElement || element instanceof SVGElement) {
    if (force !== undefined) {
      if (force) {
        showElement(element);
      } else {
        hideElement(element);
      }
    } else {
      // Use shared visibility check to decide toggle behavior
      const isHidden = !isVisibleElement(element);
      if (isHidden) {
        showElement(element);
      } else {
        hideElement(element);
      }
    }
  }
}

/**
 * Toggles the visibility of all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param force - Optional force show (true) or hide (false)
 *
 * @example
 * ```typescript
 * toggleSelector('.collapsible');
 * ```
 */
export function toggleSelector(selector: string, force?: boolean): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => toggleElement(el, force));
}

/**
 * Toggles the visibility of all elements matching a selector.
 * Alias for toggleSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param force - Optional force show (true) or hide (false)
 */
export function toggleAll(selector: string, force?: boolean): void {
  toggleSelector(selector, force);
}

/**
 * Toggles the visibility of the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param force - Optional force show (true) or hide (false)
 *
 * @example
 * ```typescript
 * toggleFirst('#menu', true);
 * ```
 */
export function toggleFirst(selector: string, force?: boolean): void {
  const element = document.querySelector(selector);
  if (element) {
    toggleElement(element, force);
  }
}

/**
 * Create a generator-friendly function that toggles an element's visibility.
 *
 * Returns a function that, when invoked with an Element, toggles its inline visibility.
 * If `force` is provided, the returned function will show the element when `true` and hide it when `false`.
 *
 * @param force - Optional flag to force show (`true`) or hide (`false`) instead of toggling
 * @returns A function suitable for use in generator/watch flows that toggles the given element
 */
export function toggleGen(force?: boolean): ElementFn<Element, void> {
  return (element: Element) => {
    toggleElement(element, force);
  };
}

/**
 * Determines whether a DOM element is considered visible based on its inline styles.
 *
 * Checks only the element's inline style properties. Returns false if `element` is falsy.
 * For HTMLElements this returns false when any of these inline styles are set: `display: "none"`,
 * `visibility: "hidden"`, or `opacity: "0"`. Non-HTMLElement nodes are treated as visible.
 *
 * @param element - The element to inspect
 * @returns True if the element is considered visible, false otherwise
 */
export function isVisibleElement(element: Element): boolean {
  if (!element) return false;

  if (element instanceof HTMLElement) {
    // In happy-dom, check inline styles first
    if (
      element.style.display === "none" ||
      element.style.visibility === "hidden" ||
      element.style.opacity === "0"
    ) {
      return false;
    }
    // If no inline styles hide it, consider it visible
    return true;
  }

  return true;
}

/**
 * Checks if the first element matching a selector is visible.
 *
 * @param selector - CSS selector to find element
 * @returns True if visible, false if hidden, null if not found
 *
 * @example
 * ```typescript
 * const isModalVisible = isVisibleSelector('.modal');
 * ```
 */
export function isVisibleSelector(selector: string): boolean | null {
  const element = document.querySelector(selector);
  return element ? isVisibleElement(element) : null;
}

/**
 * Returns whether the given element is hidden.
 *
 * An element is considered hidden if `isVisibleElement` reports it not visible.
 * If `element` is falsy, this function returns `true`.
 *
 * @param element - The element to check
 * @returns `true` when the element is hidden (or when `element` is falsy); otherwise `false`
 */
export function isHiddenElement(element: Element): boolean {
  if (!element) return true;
  return !isVisibleElement(element);
}

/**
 * Checks if the first element matching a selector is hidden.
 *
 * @param selector - CSS selector to find element
 * @returns True if hidden, false if visible, null if not found
 *
 * @example
 * ```typescript
 * const isSpinnerHidden = isHiddenSelector('.spinner');
 * ```
 */
export function isHiddenSelector(selector: string): boolean | null {
  const element = document.querySelector(selector);
  return element ? isHiddenElement(element) : null;
}
