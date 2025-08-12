/**
 * @module explicit/class
 *
 * Explicit, non-overloaded class manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from "../types";

/**
 * Add one or more CSS classes to a single DOM element.
 *
 * If `element` is falsy (null/undefined) the function is a no-op and returns immediately.
 *
 * @param element - Target DOM element to modify
 * @param classes - One or more class names to add (spread)
 *
 * @example
 * // Add a single class
 * addClassElement(document.querySelector('button'), 'active');
 *
 * @example
 * // Add multiple classes
 * addClassElement(document.querySelector('.card'), 'highlighted', 'expanded', 'animated');
 *
 * @example
 * // Safe with missing elements (no error thrown)
 * addClassElement(document.querySelector('#not-found'), 'hidden');
 */
export function addClassElement(element: Element, ...classes: string[]): void {
  if (!element) return;
  element.classList.add(...classes);
}

/**
 * Add one or more CSS classes to every element matching the provided selector.
 *
 * Operates as a no-op if the selector matches no elements.
 *
 * @param selector - CSS selector used to find target elements
 * @param classes - One or more class names to add (spread)
 */
export function addClassSelector(selector: string, ...classes: string[]): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => addClassElement(el, ...classes));
}

/**
 * Add one or more CSS classes to every element matching the provided selector.
 *
 * This is an alias of `addClassSelector` that emphasizes applying the classes to all matches.
 * If no elements match the selector the function is a no-op.
 *
 * @param selector - CSS selector used to find elements
 * @param classes - One or more class names to add to each matched element
 *
 * @example
 * // Make all notifications visible
 * addClassAll('.notification', 'visible', 'fade-in');
 */
export function addClassAll(selector: string, ...classes: string[]): void {
  addClassSelector(selector, ...classes);
}

/**
 * Add one or more CSS classes to the first element matching `selector`.
 *
 * If no element matches, the function is a no-op (safe to call with missing elements).
 *
 * @param selector - CSS selector for the target element
 * @param classes - One or more class names to add
 *
 * @example
 * // Add classes to the first message
 * addClassFirst('.message', 'primary', 'important');
 */
export function addClassFirst(selector: string, ...classes: string[]): void {
  const element = document.querySelector(selector);
  if (element) {
    addClassElement(element, ...classes);
  }
}

/**
 * Creates an ElementFn that adds the given class(es) to a supplied Element.
 *
 * Returns a generator-friendly function which, when invoked with an Element,
 * delegates to addClassElement and adds the provided class names. Safe to use
 * in watch/generator flows.
 *
 * @param classes - One or more class names to add to the target element
 * @returns An ElementFn that adds the specified classes to an Element
 */
export function addClassGen(...classes: string[]): ElementFn<Element, void> {
  return (element: Element) => {
    addClassElement(element, ...classes);
  };
}

/**
 * Remove one or more CSS classes from the given element.
 *
 * If `element` is falsy the call is a no-op. Extra or non-existent class names are ignored.
 *
 * @param element - The target DOM element to remove classes from
 * @param classes - One or more class names to remove
 */
export function removeClassElement(
  element: Element,
  ...classes: string[]
): void {
  if (!element) return;
  element.classList.remove(...classes);
}

/**
 * Remove one or more CSS classes from every element that matches the given selector.
 *
 * If no elements match the selector the function is a no-op.
 *
 * @param selector - CSS selector used to find target elements
 * @param classes - One or more class names to remove from each matched element
 */
export function removeClassSelector(
  selector: string,
  ...classes: string[]
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => removeClassElement(el, ...classes));
}

/**
 * Alias for removeClassSelector — removes one or more CSS classes from all elements matching the selector.
 *
 * @param selector - CSS selector used to find target elements
 * @param classes - One or more class names to remove from each matched element
 *
 * @example
 * ```typescript
 * removeClassAll('.error', 'visible');
 * ```
 */
export function removeClassAll(selector: string, ...classes: string[]): void {
  removeClassSelector(selector, ...classes);
}

/**
 * Removes CSS classes from the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param classes - The classes to remove
 *
 * @example
 * ```typescript
 * removeClassFirst('#modal', 'open');
 * ```
 */
export function removeClassFirst(selector: string, ...classes: string[]): void {
  const element = document.querySelector(selector);
  if (element) {
    removeClassElement(element, ...classes);
  }
}

/**
 * Create an ElementFn that removes the specified classes from a provided Element.
 *
 * The returned function is intended for generator/watch flows: when invoked (or yielded)
 * with an Element it will call removeClassElement on that element with the given class names.
 *
 * @param classes - One or more class names to remove
 * @returns A function that accepts an Element and removes the specified classes from it
 */
export function removeClassGen(...classes: string[]): ElementFn<Element, void> {
  return (element: Element) => {
    removeClassElement(element, ...classes);
  };
}

/**
 * Toggle a CSS class on an Element and return whether it is present afterward.
 *
 * If `element` is falsy, the function is a no-op and returns `false`.
 *
 * @param element - Target Element to modify
 * @param className - Class name to toggle
 * @param force - When provided, forces add (`true`) or remove (`false`)
 * @returns `true` if the class is present after the operation, otherwise `false`
 */
export function toggleClassElement(
  element: Element,
  className: string,
  force?: boolean,
): boolean {
  if (!element) return false;
  return element.classList.toggle(className, force);
}

/**
 * Toggle a CSS class on every element that matches the given selector.
 *
 * The returned array contains a boolean for each matched element indicating
 * whether the class is present on that element after the toggle operation.
 *
 * @param selector - CSS selector used to find target elements
 * @param className - Class name to toggle
 * @param force - If true, ensures the class is added; if false, ensures it is removed; if omitted, toggles
 * @returns Booleans per element reflecting class presence after toggling (empty array if no matches)
 */
export function toggleClassSelector(
  selector: string,
  className: string,
  force?: boolean,
): boolean[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) =>
    toggleClassElement(el, className, force),
  );
}

/**
 * Toggles a CSS class on all elements matching a selector.
 * Alias for toggleClassSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param className - The class to toggle
 * @param force - Optional force add (true) or remove (false)
 * @returns Array of boolean results for each element
 *
 * @example
 * ```typescript
 * toggleClassAll('.collapsible', 'expanded');
 * ```
 */
export function toggleClassAll(
  selector: string,
  className: string,
  force?: boolean,
): boolean[] {
  return toggleClassSelector(selector, className, force);
}

/**
 * Toggles a CSS class on the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @param className - The class to toggle
 * @param force - Optional force add (true) or remove (false)
 * @returns Whether the class is present after toggling, or null if no element
 *
 * @example
 * ```typescript
 * const isOpen = toggleClassFirst('#dropdown', 'open');
 * ```
 */
export function toggleClassFirst(
  selector: string,
  className: string,
  force?: boolean,
): boolean | null {
  const element = document.querySelector(selector);
  return element ? toggleClassElement(element, className, force) : null;
}

/**
 * Returns a generator-friendly function that toggles a class on a given Element.
 *
 * The returned ElementFn accepts an Element and toggles `className` on it, returning
 * a boolean indicating whether the class is present after the operation. The optional
 * `force` flag enforces add (true) or remove (false); when omitted the class is toggled.
 *
 * @param className - Class name to toggle
 * @param force - If true, ensures the class is added; if false, ensures it is removed; if undefined, toggles
 * @returns An ElementFn that toggles the specified class on the supplied Element and returns the resulting presence
 */
export function toggleClassGen(
  className: string,
  force?: boolean,
): ElementFn<Element, boolean> {
  return (element: Element) => {
    return toggleClassElement(element, className, force);
  };
}

/**
 * Checks if an element has a CSS class.
 *
 * @param element - The DOM element to check
 * @param className - The class name to check for
 * @returns True if the element has the class, false otherwise (including if element is null)
 *
 * @example
 * ```typescript
 * // Check for single class
 * const button = document.querySelector('button');
 * const isActive = hasClassElement(button, 'active'); // true or false
 * ```
 *
 * @example
 * ```typescript
 * // Use for conditional logic
 * const menu = document.querySelector('.menu');
 * if (hasClassElement(menu, 'open')) {
 *   console.log('Menu is open');
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Safe with null elements
 * const missing = document.querySelector('#not-found');
 * const hasClass = hasClassElement(missing, 'test'); // false
 * ```
 */
export function hasClassElement(element: Element, className: string): boolean {
  if (!element) return false;
  return element.classList.contains(className);
}

/**
 * Checks if the first element matching a selector has a CSS class.
 *
 * @param selector - CSS selector to find element
 * @param className - The class to check for
 * @returns Whether the element has the class, or null if no element
 *
 * @example
 * ```typescript
 * const hasError = hasClassSelector('#form', 'error');
 * ```
 */
export function hasClassSelector(
  selector: string,
  className: string,
): boolean | null {
  const element = document.querySelector(selector);
  return element ? hasClassElement(element, className) : null;
}

/**
 * Checks if all elements matching a selector have a CSS class.
 *
 * @param selector - CSS selector to find elements
 * @param className - The class to check for
 * @returns Array of boolean results for each element
 *
 * @example
 * ```typescript
 * const results = hasClassAll('.item', 'selected');
 * ```
 */
export function hasClassAll(selector: string, className: string): boolean[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => hasClassElement(el, className));
}

/**
 * Checks if any element matching a selector has a CSS class.
 *
 * @param selector - CSS selector to find elements
 * @param className - The class to check for
 * @returns Whether any element has the class
 *
 * @example
 * ```typescript
 * if (hasClassAny('.item', 'selected')) {
 *   console.log('At least one item is selected');
 * }
 * ```
 */
export function hasClassAny(selector: string, className: string): boolean {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).some((el) => hasClassElement(el, className));
}

/**
 * Creates a generator-friendly function that checks whether an element has a given class.
 *
 * The returned function accepts an Element and returns `true` if the element has `className`,
 * otherwise `false`. If a falsy element is provided, the result is `false`.
 *
 * @param className - Class name to check for on the target element
 * @returns An ElementFn that evaluates to `true` when the element has `className`
 *
 * @example
 * ```typescript
 * watch('button', function* () {
 *   const hasActive = yield hasClassGen('active');
 * });
 * ```
 */
export function hasClassGen(className: string): ElementFn<Element, boolean> {
  return (element: Element) => {
    return hasClassElement(element, className);
  };
}

/**
 * Replace a CSS class on a DOM element by removing one class and adding another.
 *
 * If `element` is falsy the function is a no-op. The old class is removed before
 * the new class is added.
 *
 * @param element - Target DOM element (may be falsy; function will do nothing)
 * @param oldClass - The class name to remove
 * @param newClass - The class name to add
 *
 * @example
 * ```typescript
 * const btn = document.querySelector('button');
 * replaceClassElement(btn, 'primary', 'secondary');
 * ```
 */
export function replaceClassElement(
  element: Element,
  oldClass: string,
  newClass: string,
): void {
  if (!element) return;
  element.classList.remove(oldClass);
  element.classList.add(newClass);
}

/**
 * Replaces one class with another on all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param oldClass - The class to remove
 * @param newClass - The class to add
 *
 * @example
 * ```typescript
 * replaceClassSelector('.btn', 'loading', 'ready');
 * ```
 */
export function replaceClassSelector(
  selector: string,
  oldClass: string,
  newClass: string,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => replaceClassElement(el, oldClass, newClass));
}

/**
 * Replace an element's entire class list by assigning the provided class string to `className`.
 *
 * If `element` is falsy (null/undefined), the call is a no-op.
 *
 * @param element - The element whose `className` will be replaced
 * @param classes - The exact class string to assign (replaces all existing classes)
 */
export function setClassesElement(element: Element, classes: string): void {
  if (!element) return;
  element.className = classes;
}

/**
 * Sets the entire className property of all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param classes - The complete class string to set
 *
 * @example
 * ```typescript
 * setClassesSelector('.reset', '');  // Remove all classes
 * setClassesSelector('.card', 'card card-default');
 * ```
 */
export function setClassesSelector(selector: string, classes: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => setClassesElement(el, classes));
}
