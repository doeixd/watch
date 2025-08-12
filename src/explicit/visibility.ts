/**
 * @module explicit/visibility
 *
 * Explicit, non-overloaded visibility manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from "../types";

/**
 * Shows an element by removing display: none.
 *
 * @param element - The element to show
 *
 * @example
 * ```typescript
 * const modal = document.querySelector('.modal');
 * showElement(modal);
 * ```
 */
export function showElement(element: Element): void {
  if (!element) return;

  if (element instanceof HTMLElement || element instanceof SVGElement) {
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
 * Shows all elements matching a selector.
 * Alias for showSelector for clarity.
 *
 * @param selector - CSS selector to find elements
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
 * Returns a generator function that shows an element.
 * For use within watch generators.
 *
 * @returns ElementFn that shows element when yielded
 *
 * @example
 * ```typescript
 * watch('.modal', function* () {
 *   yield showGen();
 * });
 * ```
 */
export function showGen(): ElementFn<Element, void> {
  return (element: Element) => {
    showElement(element);
  };
}

/**
 * Hides an element by setting display: none.
 *
 * @param element - The element to hide
 *
 * @example
 * ```typescript
 * const modal = document.querySelector('.modal');
 * hideElement(modal);
 * ```
 */
export function hideElement(element: Element): void {
  if (!element) return;

  if (element instanceof HTMLElement || element instanceof SVGElement) {
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
 * Hides all elements matching a selector.
 * Alias for hideSelector for clarity.
 *
 * @param selector - CSS selector to find elements
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
 * Returns a generator function that hides an element.
 * For use within watch generators.
 *
 * @returns ElementFn that hides element when yielded
 *
 * @example
 * ```typescript
 * watch('.modal', function* () {
 *   yield hideGen();
 * });
 * ```
 */
export function hideGen(): ElementFn<Element, void> {
  return (element: Element) => {
    hideElement(element);
  };
}

/**
 * Toggles the visibility of an element.
 *
 * @param element - The element to toggle
 * @param force - Optional force show (true) or hide (false)
 *
 * @example
 * ```typescript
 * const dropdown = document.querySelector('.dropdown');
 * toggleElement(dropdown);
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
 * Returns a generator function that toggles visibility.
 * For use within watch generators.
 *
 * @param force - Optional force show (true) or hide (false)
 * @returns ElementFn that toggles element when yielded
 *
 * @example
 * ```typescript
 * watch('.dropdown', function* () {
 *   yield toggleGen();
 * });
 * ```
 */
export function toggleGen(force?: boolean): ElementFn<Element, void> {
  return (element: Element) => {
    toggleElement(element, force);
  };
}

/**
 * Checks if an element is visible.
 *
 * @param element - The element to check
 * @returns True if the element is visible
 *
 * @example
 * ```typescript
 * const modal = document.querySelector('.modal');
 * const visible = isVisibleElement(modal);
 * ```
 */
export function isVisibleElement(element: Element): boolean {
  if (!element) return false;

  if (element instanceof HTMLElement || element instanceof SVGElement) {
    // Check computed styles for accurate visibility
    const style = window.getComputedStyle(element);
    return !(
      style.display === "none" ||
      style.visibility === "hidden" ||
      parseFloat(style.opacity) === 0
    );
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
 * Checks if an element is hidden.
 *
 * @param element - The element to check
 * @returns True if the element is hidden
 *
 * @example
 * ```typescript
 * const spinner = document.querySelector('.spinner');
 * const hidden = isHiddenElement(spinner);
 * ```
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
