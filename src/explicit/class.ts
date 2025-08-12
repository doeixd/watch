/**
 * @module explicit/class
 *
 * Explicit, non-overloaded class manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from "../types";

/**
 * Adds CSS classes to an element.
 *
 * @param element - The target DOM element to add classes to
 * @param classes - One or more class names to add (spread parameters)
 * @returns void
 *
 * @example
 * ```typescript
 * // Add single class
 * const button = document.querySelector('button');
 * addClassElement(button, 'active');
 * ```
 *
 * @example
 * ```typescript
 * // Add multiple classes at once
 * const card = document.querySelector('.card');
 * addClassElement(card, 'highlighted', 'expanded', 'animated');
 * ```
 *
 * @example
 * ```typescript
 * // Safe with null elements (no error)
 * const missing = document.querySelector('#not-found');
 * addClassElement(missing, 'hidden'); // Does nothing, no error
 * ```
 */
export function addClassElement(element: Element, ...classes: string[]): void {
  if (!element) return;
  element.classList.add(...classes);
}

/**
 * Adds CSS classes to all elements matching a selector.
 *
 * @param selector - CSS selector string to query elements
 * @param classes - One or more class names to add (spread parameters)
 * @returns void
 *
 * @example
 * ```typescript
 * // Highlight all items
 * addClassSelector('.item', 'highlighted');
 * ```
 *
 * @example
 * ```typescript
 * // Add multiple classes to all buttons
 * addClassSelector('button', 'styled', 'interactive', 'shadow');
 * ```
 *
 * @example
 * ```typescript
 * // Mark all completed tasks
 * addClassSelector('.task[data-complete="true"]', 'done', 'faded');
 * ```
 */
export function addClassSelector(selector: string, ...classes: string[]): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => addClassElement(el, ...classes));
}

/**
 * Adds CSS classes to all elements matching a selector.
 * Alias for addClassSelector that emphasizes operating on all matches.
 *
 * @param selector - CSS selector string to query elements
 * @param classes - One or more class names to add (spread parameters)
 * @returns void
 *
 * @example
 * ```typescript
 * // Emphasizes that ALL notifications will be affected
 * addClassAll('.notification', 'visible', 'fade-in');
 * ```
 *
 * @example
 * ```typescript
 * // Style all table rows
 * addClassAll('tbody tr', 'striped');
 * ```
 */
export function addClassAll(selector: string, ...classes: string[]): void {
  addClassSelector(selector, ...classes);
}

/**
 * Adds CSS classes to the first element matching a selector.
 *
 * @param selector - CSS selector string to query element
 * @param classes - One or more class names to add (spread parameters)
 * @returns void
 *
 * @example
 * ```typescript
 * // Only style the first message
 * addClassFirst('.message', 'primary', 'important');
 * ```
 *
 * @example
 * ```typescript
 * // Highlight first search result
 * addClassFirst('.search-result', 'featured', 'expanded');
 * ```
 *
 * @example
 * ```typescript
 * // Safe with non-existent elements
 * addClassFirst('#not-found', 'hidden'); // No error if not found
 * ```
 */
export function addClassFirst(selector: string, ...classes: string[]): void {
  const element = document.querySelector(selector);
  if (element) {
    addClassElement(element, ...classes);
  }
}

/**
 * Returns a generator function that adds classes.
 * For use within watch generators.
 *
 * @param classes - One or more class names to add (spread parameters)
 * @returns ElementFn that adds classes when yielded in a generator context
 *
 * @example
 * ```typescript
 * // Add classes in a watch generator
 * watch('button', function* () {
 *   yield addClassGen('ready', 'interactive');
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Conditional class addition
 * watch('.card', function* () {
 *   const isPremium = yield getState('premium');
 *   if (isPremium) {
 *     yield addClassGen('premium', 'gold-border');
 *   }
 * });
 * ```
 */
export function addClassGen(...classes: string[]): ElementFn<Element, void> {
  return (element: Element) => {
    addClassElement(element, ...classes);
  };
}

/**
 * Removes CSS classes from an element.
 *
 * @param element - The target DOM element to remove classes from
 * @param classes - One or more class names to remove (spread parameters)
 * @returns void
 *
 * @example
 * ```typescript
 * // Remove single class
 * const button = document.querySelector('button');
 * removeClassElement(button, 'disabled');
 * ```
 *
 * @example
 * ```typescript
 * // Remove multiple classes
 * const modal = document.querySelector('.modal');
 * removeClassElement(modal, 'visible', 'animated', 'fade-in');
 * ```
 *
 * @example
 * ```typescript
 * // Safe to remove non-existent classes
 * const div = document.querySelector('div');
 * removeClassElement(div, 'not-there'); // No error
 * ```
 */
export function removeClassElement(
  element: Element,
  ...classes: string[]
): void {
  if (!element) return;
  element.classList.remove(...classes);
}

/**
 * Removes CSS classes from all elements matching a selector.
 *
 * @param selector - CSS selector string to query elements
 * @param classes - One or more class names to remove (spread parameters)
 * @returns void
 *
 * @example
 * ```typescript
 * // Remove highlight from all items
 * removeClassSelector('.item', 'highlighted');
 * ```
 *
 * @example
 * ```typescript
 * // Clean up multiple classes from all cards
 * removeClassSelector('.card', 'loading', 'pending', 'processing');
 * ```
 *
 * @example
 * ```typescript
 * // Remove state classes from form fields
 * removeClassSelector('input, select', 'error', 'warning', 'success');
 * ```
 */
export function removeClassSelector(
  selector: string,
  ...classes: string[]
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => removeClassElement(el, ...classes));
}

/**
 * Removes CSS classes from all elements matching a selector.
 * Alias for removeClassSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @param classes - The classes to remove
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
 * Returns a generator function that removes classes.
 * For use within watch generators.
 *
 * @param classes - One or more class names to remove (spread parameters)
 * @returns ElementFn that removes classes when yielded in a generator context
 *
 * @example
 * ```typescript
 * // Remove loading state in generator
 * watch('.button', function* () {
 *   yield removeClassGen('loading', 'disabled');
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Clean up after animation
 * watch('.animated', function* () {
 *   yield on('animationend', function* () {
 *     yield removeClassGen('animating', 'fade-in', 'slide-up');
 *   });
 * });
 * ```
 */
export function removeClassGen(...classes: string[]): ElementFn<Element, void> {
  return (element: Element) => {
    removeClassElement(element, ...classes);
  };
}

/**
 * Toggles a CSS class on an element.
 *
 * @param element - The element to toggle class on
 * @param className - The class to toggle
 * @param force - Optional force add (true) or remove (false)
 * @returns Whether the class is present after toggling
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * const isActive = toggleClassElement(button, 'active');
 * ```
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
 * Toggles a CSS class on all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param className - The class to toggle
 * @param force - Optional force add (true) or remove (false)
 * @returns Array of boolean results for each element
 *
 * @example
 * ```typescript
 * const results = toggleClassSelector('.item', 'selected');
 * ```
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
 * Returns a generator function that toggles a class.
 * For use within watch generators.
 *
 * @param className - The class name to toggle
 * @param force - Optional: true to force add, false to force remove, undefined to toggle
 * @returns ElementFn that toggles class when yielded in a generator context
 *
 * @example
 * ```typescript
 * // Toggle in generator
 * watch('.accordion', function* () {
 *   yield click(function* () {
 *     yield toggleClassGen('expanded');
 *   });
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Conditional toggle with force
 * watch('.theme-toggle', function* () {
 *   const isDark = yield getState('darkMode');
 *   yield toggleClassGen('dark', isDark);
 * });
 * ```
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
 * Returns a generator function that checks for a class.
 * For use within watch generators.
 *
 * @param className - The class to check for
 * @returns ElementFn that checks class when yielded
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
 * Replaces one class with another on an element.
 *
 * @param element - The target DOM element to modify
 * @param oldClass - The class name to remove
 * @param newClass - The class name to add
 * @returns void
 *
 * @example
 * ```typescript
 * // Swap button styles
 * const button = document.querySelector('button');
 * replaceClassElement(button, 'primary', 'secondary');
 * ```
 *
 * @example
 * ```typescript
 * // Change state class
 * const status = document.querySelector('.status');
 * replaceClassElement(status, 'pending', 'completed');
 * ```
 *
 * @example
 * ```typescript
 * // Works even if old class doesn't exist
 * const div = document.querySelector('div');
 * replaceClassElement(div, 'not-there', 'new-class'); // Just adds new-class
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
 * Sets the entire className property of an element.
 *
 * @param element - The element to modify
 * @param classes - The complete class string to set
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * setClassesElement(div, 'container mt-4 p-3');
 * ```
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
