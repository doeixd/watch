/**
 * @module explicit/dom
 *
 * Explicit, non-overloaded DOM traversal and query functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from "../types";

/**
 * Queries for a single element within a parent element.
 *
 * @param parent - The parent DOM element to search within
 * @param selector - CSS selector string to match descendants
 * @returns The first matching descendant element, or null if none found
 *
 * @example
 * ```typescript
 * // Find button within specific container
 * const container = document.getElementById('container');
 * const button = queryElement(container, 'button.primary');
 * ```
 *
 * @example
 * ```typescript
 * // Search within a form for specific input
 * const form = document.querySelector('form');
 * const emailInput = queryElement(form, 'input[type="email"]');
 * ```
 *
 * @example
 * ```typescript
 * // Type-safe element queries
 * const nav = document.querySelector('nav');
 * const link = queryElement<HTMLAnchorElement>(nav, 'a.active');
 * console.log(link?.href);
 * ```
 */
export function queryElement<K extends keyof HTMLElementTagNameMap>(
  parent: Element,
  selector: K,
): HTMLElementTagNameMap[K] | null;
export function queryElement<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  selector: K,
): SVGElementTagNameMap[K] | null;
export function queryElement<E extends Element = Element>(
  parent: Element,
  selector: string,
): E | null;
/**
 * Query a single descendant of the given parent element using a CSS selector.
 *
 * Returns the first matching descendant, or `null` if the parent is falsy or no match is found.
 *
 * @param parent - The element to query within. If falsy, the function returns `null`.
 * @param selector - A CSS selector string used to find the descendant.
 * @returns The first matching descendant `Element`, or `null` if none is found.
 */
export function queryElement(
  parent: Element,
  selector: string,
): Element | null {
  if (!parent) return null;
  return parent.querySelector(selector);
}

/**
 * Queries for a single element matching a selector in the document.
 *
 * @param selector - CSS selector string to match elements
 * @returns The first matching element in the document, or null if none found
 *
 * @example
 * ```typescript
 * // Find element by ID
 * const header = querySelector('#header');
 * ```
 *
 * @example
 * ```typescript
 * // Find first element with class
 * const button = querySelector('.btn-primary');
 * ```
 *
 * @example
 * ```typescript
 * // Complex selector with type
 * const input = querySelector<HTMLInputElement>('form input[required]');
 * console.log(input?.value);
 * ```
 */
export function querySelector<K extends keyof HTMLElementTagNameMap>(
  selector: K,
): HTMLElementTagNameMap[K] | null;
export function querySelector<K extends keyof SVGElementTagNameMap>(
  selector: K,
): SVGElementTagNameMap[K] | null;
export function querySelector<E extends Element = Element>(
  selector: string,
): E | null;
/**
 * Returns the first Element in the document that matches the given CSS selector.
 *
 * @param selector - A CSS selector string used to match elements.
 * @returns The first matching Element, or `null` if no match is found.
 */
export function querySelector(selector: string): Element | null {
  return document.querySelector(selector);
}

/**
 * Query the document for a single element matching `selector`.
 *
 * Returns the first matching element in the document typed as `E`, or `null` if none found.
 *
 * @param selector - CSS selector to match
 * @returns The first matching element in the document, or `null`
 */
export function queryDocument<E extends Element = Element>(
  selector: string,
): E | null {
  return document.querySelector<E>(selector);
}

/**
 * Returns a generator function that queries for an element.
 * For use within watch generators.
 *
 * @param selector - CSS selector string to match descendants
 * @returns ElementFn that returns the first matching element when yielded in a generator context
 *
 * @example
 * ```typescript
 * // Query within watched element
 * watch('.container', function* () {
 *   const button = yield queryGen('button');
 *   if (button) {
 *     console.log('Found button:', button);
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Type-safe queries in generators
 * watch('.form', function* () {
 *   const input = yield queryGen<HTMLInputElement>('input[name="email"]');
 *   const value = input?.value;
 * });
 * ```
 */
export function queryGen<E extends Element = Element>(
  selector: string,
): ElementFn<Element, E | null> {
  return (element: Element) => {
    return queryElement<E>(element, selector);
  };
}

/**
 * Queries for all elements within a parent element.
 *
 * @param parent - The parent DOM element to search within
 * @param selector - CSS selector string to match descendants
 * @returns NodeList of all matching descendant elements (empty if none found)
 *
 * @example
 * ```typescript
 * // Find all buttons in a container
 * const container = document.getElementById('container');
 * const buttons = queryAllElement(container, 'button');
 * console.log(`Found ${buttons.length} buttons`);
 * ```
 *
 * @example
 * ```typescript
 * // Find all required fields in a form
 * const form = document.querySelector('form');
 * const required = queryAllElement(form, '[required]');
 * required.forEach(field => validateField(field));
 * ```
 *
 * @example
 * ```typescript
 * // Type-safe element collection
 * const table = document.querySelector('table');
 * const rows = queryAllElement<HTMLTableRowElement>(table, 'tr');
 * ```
 */
export function queryAllElement<K extends keyof HTMLElementTagNameMap>(
  parent: Element,
  selector: K,
): NodeListOf<HTMLElementTagNameMap[K]>;
export function queryAllElement<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  selector: K,
): NodeListOf<SVGElementTagNameMap[K]>;
export function queryAllElement<E extends Element = Element>(
  parent: Element,
  selector: string,
): NodeListOf<E>;
/**
 * Return all elements matching `selector` scoped to `parent`.
 *
 * If `parent` is falsy the document is used as the query root; otherwise the search is limited to `parent`'s descendants.
 *
 * @param parent - Element to scope the query (fall back to `document` when falsy)
 * @param selector - CSS selector string used to match elements
 * @returns A NodeList of matching elements (may be empty)
 */
export function queryAllElement(
  parent: Element,
  selector: string,
): NodeListOf<Element> {
  if (!parent) return document.querySelectorAll(selector);
  return parent.querySelectorAll(selector);
}

/**
 * Queries for all elements matching a selector in the document.
 *
 * @param selector - CSS selector string to match elements
 * @returns NodeList of all matching elements in the document (empty if none found)
 *
 * @example
 * ```typescript
 * // Get all items with a class
 * const items = queryAllSelector('.item');
 * items.forEach(item => processItem(item));
 * ```
 *
 * @example
 * ```typescript
 * // Get all links with specific attribute
 * const externalLinks = queryAllSelector('a[target="_blank"]');
 * ```
 *
 * @example
 * ```typescript
 * // Complex selector for form inputs
 * const textInputs = queryAllSelector<HTMLInputElement>('input[type="text"], input[type="email"]');
 * ```
 */
export function queryAllSelector<K extends keyof HTMLElementTagNameMap>(
  selector: K,
): NodeListOf<HTMLElementTagNameMap[K]>;
export function queryAllSelector<K extends keyof SVGElementTagNameMap>(
  selector: K,
): NodeListOf<SVGElementTagNameMap[K]>;
export function queryAllSelector<E extends Element = Element>(
  selector: string,
): NodeListOf<E>;
/**
 * Query all elements in the document matching the given CSS selector.
 *
 * @param selector - CSS selector string used to match elements.
 * @returns A NodeList of all matching elements (empty if none).
 */
export function queryAllSelector(selector: string): NodeListOf<Element> {
  return document.querySelectorAll(selector);
}

/**
 * Queries for all elements in the document.
 * Alias for queryAllSelector for clarity.
 *
 * @param selector - CSS selector to find elements
 * @returns NodeList of found elements
 */
export function queryAllDocument<E extends Element = Element>(
  selector: string,
): NodeListOf<E> {
  return document.querySelectorAll<E>(selector);
}

/**
 * Create a generator-friendly function that finds all matching descendant elements.
 *
 * Returns a function suitable for use in watch/generator flows; when invoked with a parent
 * element it returns a NodeList of descendants matching the provided CSS selector.
 *
 * @param selector - CSS selector used to match descendant elements
 * @returns A function that takes a parent Element and returns NodeListOf<E> of matches
 */
export function queryAllGen<E extends Element = Element>(
  selector: string,
): ElementFn<Element, NodeListOf<E>> {
  return (element: Element) => {
    return queryAllElement<E>(element, selector);
  };
}

/**
 * Return the direct parent element of the provided element or null.
 *
 * If the argument is falsy or the element has no parent element, this returns `null`.
 *
 * @param element - The element whose parent should be returned; falsy values are accepted and yield `null`.
 * @returns The element's parent element, or `null` when none exists.
 */
export function getParentElement(element: Element): Element | null {
  if (!element) return null;
  return element.parentElement;
}

/**
 * Gets the parent element of the first element matching a selector.
 *
 * @param selector - CSS selector string to find the child element
 * @returns The parent element of the first match, or null if no element found
 *
 * @example
 * ```typescript
 * // Get container of primary button
 * const container = getParentSelector('button.primary');
 * ```
 *
 * @example
 * ```typescript
 * // Find form containing specific input
 * const form = getParentSelector('input[name="email"]');
 * ```
 *
 * @example
 * ```typescript
 * // Returns null for non-existent elements
 * const parent = getParentSelector('#not-found'); // null
 * ```
 */
export function getParentSelector(selector: string): Element | null {
  const element = document.querySelector(selector);
  return element ? getParentElement(element) : null;
}

/**
 * Return the parent element for each document element that matches `selector`.
 *
 * For every element matched by `selector`, this returns its `parentElement` (or `null` if it has no parent),
 * preserving the order and length of the matched node list.
 *
 * @param selector - CSS selector used to find child elements
 * @returns An array of parent elements corresponding to each matched element; entries may be `null`
 */
export function getParentAll(selector: string): (Element | null)[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => getParentElement(el));
}

/**
 * Return a generator-friendly function that obtains an element's parent.
 *
 * The returned function accepts an Element and returns its direct parent Element
 * or `null` if the input has no parent. Intended for use inside watch/generator
 * flows where an ElementFn is yielded.
 *
 * @returns A function `(element) => Element | null` that resolves the element's parent
 */
export function getParentGen(): ElementFn<Element, Element | null> {
  return (element: Element) => {
    return getParentElement(element);
  };
}

/**
 * Return the direct child elements of a given element.
 *
 * If `element` is falsy, returns an empty HTMLCollection (safe no-op) instead of throwing.
 *
 * @param element - The parent element whose direct child elements are requested
 * @returns The parent's HTMLCollection of child elements, or an empty HTMLCollection when `element` is falsy
 */
export function getChildrenElement(element: Element): HTMLCollection {
  if (!element) return document.createElement("div").children;
  return element.children;
}

/**
 * Gets all direct child elements of the first element matching a selector.
 *
 * @param selector - CSS selector string to find the parent element
 * @returns HTMLCollection of child elements, or empty collection if parent not found
 *
 * @example
 * ```typescript
 * // Get list items
 * const items = getChildrenSelector('#todo-list');
 * ```
 *
 * @example
 * ```typescript
 * // Get form fields
 * const fields = getChildrenSelector('.form-group');
 * Array.from(fields).forEach(field => validateField(field));
 * ```
 *
 * @example
 * ```typescript
 * // Safe with non-existent elements
 * const children = getChildrenSelector('#not-found'); // Empty HTMLCollection
 * ```
 */
export function getChildrenSelector(selector: string): HTMLCollection {
  const element = document.querySelector(selector);
  return element
    ? getChildrenElement(element)
    : document.createElement("div").children;
}

/**
 * Return the direct child collections for every element matching `selector`.
 *
 * For each element found via `document.querySelectorAll(selector)` this returns its
 * `HTMLCollection` of direct children. If no elements match, an empty array is returned;
 * the result order corresponds to the document order of the matched elements.
 *
 * @param selector - CSS selector used to find the parent elements
 * @returns An array of `HTMLCollection`, one per matched element
 */
export function getChildrenAll(selector: string): HTMLCollection[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => getChildrenElement(el));
}

/**
 * Create a generator-friendly function that returns the direct children of a given element.
 *
 * The returned ElementFn accepts an Element and returns its `children` as an HTMLCollection.
 *
 * @returns A function (for use in watch/generator flows) that, when given an element, yields its children.
 */
export function getChildrenGen(): ElementFn<Element, HTMLCollection> {
  return (element: Element) => {
    return getChildrenElement(element);
  };
}

/**
 * Gets all sibling elements of an element.
 * Returns all other children of the element's parent, excluding the element itself.
 *
 * @param element - The DOM element to get siblings of
 * @returns Array of sibling elements (empty array if no siblings or element has no parent)
 *
 * @example
 * ```typescript
 * // Get all siblings of active item
 * const activeItem = document.querySelector('.item.active');
 * const siblings = getSiblingsElement(activeItem);
 * siblings.forEach(s => s.classList.remove('active'));
 * ```
 *
 * @example
 * ```typescript
 * // Navigate between tabs
 * const currentTab = document.querySelector('.tab.active');
 * const otherTabs = getSiblingsElement(currentTab);
 * ```
 *
 * @example
 * ```typescript
 * // Count siblings
 * const element = document.getElementById('middle-child');
 * const siblingCount = getSiblingsElement(element).length;
 * console.log(`Element has ${siblingCount} siblings`);
 * ```
 */
export function getSiblingsElement(element: Element): Element[] {
  if (!element || !element.parentElement) return [];

  const siblings = Array.from(element.parentElement.children);
  return siblings.filter((el) => el !== element);
}

/**
 * Gets all sibling elements of the first element matching a selector.
 *
 * @param selector - CSS selector to find element
 * @returns Array of sibling elements
 *
 * @example
 * ```typescript
 * const siblings = getSiblingsSelector('.active');
 * ```
 */
export function getSiblingsSelector(selector: string): Element[] {
  const element = document.querySelector(selector);
  return element ? getSiblingsElement(element) : [];
}

/**
 * Return the sibling elements for each element matching a CSS selector.
 *
 * Returns an array where each entry is an array of sibling elements corresponding
 * to the matched elements in document order. If no elements match the selector,
 * an empty array is returned.
 *
 * @param selector - CSS selector used to find elements whose siblings will be returned
 * @returns An array of sibling-element arrays (one entry per matched element)
 */
export function getSiblingsAll(selector: string): Element[][] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => getSiblingsElement(el));
}

/**
 * Return a generator-friendly function that, given an element, returns its sibling elements (excluding the element itself).
 *
 * Useful for use inside watch/generator flows where the returned function is yielded.
 *
 * @returns A function that accepts an Element and returns an array of its sibling Elements.
 */
export function getSiblingsGen(): ElementFn<Element, Element[]> {
  return (element: Element) => {
    return getSiblingsElement(element);
  };
}

/**
 * Finds the closest ancestor element matching a selector.
 * Searches up the DOM tree starting from the element itself.
 *
 * @param element - The DOM element to start searching from
 * @param selector - CSS selector string to match ancestors
 * @returns The closest matching ancestor (including element itself), or null if none found
 *
 * @example
 * ```typescript
 * // Find form containing a button
 * const button = document.querySelector('button');
 * const form = closestElement(button, 'form');
 * ```
 *
 * @example
 * ```typescript
 * // Find nearest container with specific class
 * const child = document.querySelector('.deep-nested');
 * const container = closestElement(child, '.container');
 * ```
 *
 * @example
 * ```typescript
 * // Type-safe ancestor search
 * const link = document.querySelector('a');
 * const nav = closestElement<HTMLElement>(link, 'nav');
 * console.log(nav?.id);
 * ```
 */
export function closestElement<E extends Element = Element>(
  element: Element,
  selector: string,
): E | null {
  if (!element) return null;
  return element.closest<E>(selector);
}

/**
 * Return the closest ancestor matching `ancestorSelector` for the first element that matches `elementSelector`.
 *
 * Finds the first element in the document using `elementSelector` and then searches upward from that element
 * for the nearest ancestor matching `ancestorSelector`.
 *
 * @param elementSelector - CSS selector for the starting element to search from
 * @param ancestorSelector - CSS selector to match an ancestor
 * @returns The closest ancestor element that matches `ancestorSelector`, or `null` if no starting element is found or no ancestor matches
 *
 * @example
 * // Find the form that contains a submit button
 * const form = closestSelector('button.submit', 'form');
 */
export function closestSelector<E extends Element = Element>(
  elementSelector: string,
  ancestorSelector: string,
): E | null {
  const element = document.querySelector(elementSelector);
  return element ? closestElement<E>(element, ancestorSelector) : null;
}

/**
 * Create a generator-friendly function that finds the closest ancestor matching a selector.
 *
 * The returned function accepts an Element and returns the nearest ancestor (including the element itself)
 * that matches `selector`, or `null` if none is found. Intended for use in watch/generator flows.
 *
 * @param selector - CSS selector to match ancestors
 * @returns A function that, given an element, returns the closest matching ancestor or `null`
 */
export function closestGen<E extends Element = Element>(
  selector: string,
): ElementFn<Element, E | null> {
  return (element: Element) => {
    return closestElement<E>(element, selector);
  };
}

/**
 * Determine whether a given element contains another element.
 *
 * Returns true if `child` is a descendant of `parent`; returns false if either argument is falsy or not contained.
 *
 * @param parent - The potential ancestor element
 * @param child - The potential descendant element
 * @returns `true` if `parent` contains `child`, otherwise `false`
 */
export function containsElement(parent: Element, child: Element): boolean {
  if (!parent || !child) return false;
  return parent.contains(child);
}

/**
 * Checks if the first element matching a selector contains another.
 * Finds both elements first, then checks containment.
 *
 * @param parentSelector - CSS selector string for the potential parent element
 * @param childSelector - CSS selector string for the potential child element
 * @returns True if parent contains child, false if not or if either element not found
 *
 * @example
 * ```typescript
 * // Check if button is in specific container
 * const isInside = containsSelector('#container', 'button.primary');
 * ```
 *
 * @example
 * ```typescript
 * // Validate form structure
 * const hasSubmit = containsSelector('form#signup', 'button[type="submit"]');
 * ```
 *
 * @example
 * ```typescript
 * // Returns false if either element missing
 * const result = containsSelector('#missing', '.child'); // false
 * ```
 */
export function containsSelector(
  parentSelector: string,
  childSelector: string,
): boolean {
  const parent = document.querySelector(parentSelector);
  const child = document.querySelector(childSelector);
  return parent && child ? containsElement(parent, child) : false;
}

/**
 * Determine whether a given element matches a CSS selector.
 *
 * Returns false if `element` is falsy; otherwise delegates to `element.matches(selector)`.
 *
 * @param element - The element to test
 * @param selector - CSS selector to test against
 * @returns `true` if the element matches `selector`, otherwise `false`
 */
export function matchesElement(element: Element, selector: string): boolean {
  if (!element) return false;
  return element.matches(selector);
}

/**
 * Checks if the first element matching a selector matches another selector.
 * Finds an element first, then tests if it matches the second selector.
 *
 * @param elementSelector - CSS selector string to find the element
 * @param matchSelector - CSS selector string to test against
 * @returns True if found element matches the selector, false if not or element not found
 *
 * @example
 * ```typescript
 * // Check if first button is primary
 * const isPrimary = matchesSelector('button', '.primary');
 * ```
 *
 * @example
 * ```typescript
 * // Test form field state
 * const isInvalid = matchesSelector('#email', ':invalid');
 * ```
 *
 * @example
 * ```typescript
 * // Returns false if element doesn't exist
 * const matches = matchesSelector('#not-found', '.active'); // false
 * ```
 */
export function matchesSelector(
  elementSelector: string,
  matchSelector: string,
): boolean {
  const element = document.querySelector(elementSelector);
  return element ? matchesElement(element, matchSelector) : false;
}
