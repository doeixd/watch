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
export function querySelector(selector: string): Element | null {
  return document.querySelector(selector);
}

/**
 * Queries for a single element in the document.
 * Alias for querySelector for clarity.
 *
 * @param selector - CSS selector to find element
 * @returns The found element or null
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
export function queryAllElement(
  parent: Element,
  selector: string,
): NodeListOf<Element> {
  if (!parent) return document.createElement("div").querySelectorAll(selector);
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
 * Returns a generator function that queries for all elements.
 * For use within watch generators.
 *
 * @param selector - CSS selector to find elements
 * @returns ElementFn that queries when yielded
 */
export function queryAllGen<E extends Element = Element>(
  selector: string,
): ElementFn<Element, NodeListOf<E>> {
  return (element: Element) => {
    return queryAllElement<E>(element, selector);
  };
}

/**
 * Gets the parent element of an element.
 *
 * @param element - The DOM element to get the parent of
 * @returns The parent element, or null if element has no parent or is null
 *
 * @example
 * ```typescript
 * // Get button's container
 * const button = document.querySelector('button');
 * const container = getParentElement(button);
 * ```
 *
 * @example
 * ```typescript
 * // Navigate up the DOM tree
 * let element = document.querySelector('.deep-child');
 * while (element) {
 *   console.log(element.tagName);
 *   element = getParentElement(element);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Safe with null elements
 * const missing = document.querySelector('#not-found');
 * const parent = getParentElement(missing); // null
 * ```
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
 * Gets the parent elements of all elements matching a selector.
 *
 * @param selector - CSS selector string to find child elements
 * @returns Array of parent elements (may contain nulls for orphaned elements)
 *
 * @example
 * ```typescript
 * // Get all item containers
 * const containers = getParentAll('.item');
 * const uniqueContainers = [...new Set(containers.filter(c => c))];
 * ```
 *
 * @example
 * ```typescript
 * // Find all forms containing inputs
 * const forms = getParentAll('input[required]');
 * ```
 *
 * @example
 * ```typescript
 * // Check if all elements have same parent
 * const parents = getParentAll('.sibling');
 * const sameParent = parents.every(p => p === parents[0]);
 * ```
 */
export function getParentAll(selector: string): (Element | null)[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => getParentElement(el));
}

/**
 * Returns a generator function that gets the parent element.
 * For use within watch generators.
 *
 * @returns ElementFn that gets parent when yielded
 */
export function getParentGen(): ElementFn<Element, Element | null> {
  return (element: Element) => {
    return getParentElement(element);
  };
}

/**
 * Gets all direct child elements of an element.
 * Note: Only returns element nodes, not text or comment nodes.
 *
 * @param element - The DOM element to get children of
 * @returns HTMLCollection of direct child elements (empty collection if no children or element is null)
 *
 * @example
 * ```typescript
 * // Get all direct children
 * const container = document.getElementById('container');
 * const children = getChildrenElement(container);
 * console.log(`Container has ${children.length} child elements`);
 * ```
 *
 * @example
 * ```typescript
 * // Iterate over children
 * const list = document.querySelector('ul');
 * const items = getChildrenElement(list);
 * Array.from(items).forEach((li, index) => {
 *   li.textContent = `Item ${index + 1}`;
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Filter children by type
 * const form = document.querySelector('form');
 * const children = getChildrenElement(form);
 * const inputs = Array.from(children).filter(el => el.tagName === 'INPUT');
 * ```
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
 * Gets all child elements of all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @returns Array of HTMLCollections
 *
 * @example
 * ```typescript
 * const allChildren = getChildrenAll('.container');
 * ```
 */
export function getChildrenAll(selector: string): HTMLCollection[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => getChildrenElement(el));
}

/**
 * Returns a generator function that gets child elements.
 * For use within watch generators.
 *
 * @returns ElementFn that gets children when yielded
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
 * Gets all sibling elements of all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @returns Array of arrays of sibling elements
 *
 * @example
 * ```typescript
 * const allSiblings = getSiblingsAll('.item');
 * ```
 */
export function getSiblingsAll(selector: string): Element[][] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => getSiblingsElement(el));
}

/**
 * Returns a generator function that gets sibling elements.
 * For use within watch generators.
 *
 * @returns ElementFn that gets siblings when yielded
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
 * Finds the closest ancestor for the first element matching a selector.
 * First finds an element, then searches up its DOM tree.
 *
 * @param elementSelector - CSS selector string to find the starting element
 * @param ancestorSelector - CSS selector string to match ancestors
 * @returns The closest matching ancestor, or null if element not found or no ancestor matches
 *
 * @example
 * ```typescript
 * // Find form containing submit button
 * const form = closestSelector('button.submit', 'form');
 * ```
 *
 * @example
 * ```typescript
 * // Find section containing specific heading
 * const section = closestSelector('h2#intro', 'section');
 * ```
 *
 * @example
 * ```typescript
 * // Returns null if element doesn't exist
 * const ancestor = closestSelector('#not-found', '.parent'); // null
 * ```
 */
export function closestSelector<E extends Element = Element>(
  elementSelector: string,
  ancestorSelector: string,
): E | null {
  const element = document.querySelector(elementSelector);
  return element ? closestElement<E>(element, ancestorSelector) : null;
}

/**
 * Returns a generator function that finds the closest ancestor.
 * For use within watch generators.
 *
 * @param selector - CSS selector to match ancestors
 * @returns ElementFn that finds closest when yielded
 */
export function closestGen<E extends Element = Element>(
  selector: string,
): ElementFn<Element, E | null> {
  return (element: Element) => {
    return closestElement<E>(element, selector);
  };
}

/**
 * Checks if an element contains another element.
 * Returns true if child is a descendant of parent at any level.
 *
 * @param parent - The potential parent/ancestor element
 * @param child - The potential child/descendant element
 * @returns True if parent contains child, false otherwise (including if either is null)
 *
 * @example
 * ```typescript
 * // Check if button is inside container
 * const container = document.getElementById('container');
 * const button = document.querySelector('button');
 * const isInside = containsElement(container, button);
 * ```
 *
 * @example
 * ```typescript
 * // Validate drop target
 * const dropZone = document.querySelector('.drop-zone');
 * const dragged = document.querySelector('.dragging');
 * if (!containsElement(dropZone, dragged)) {
 *   allowDrop();
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Check if click was outside element
 * document.addEventListener('click', (e) => {
 *   const modal = document.querySelector('.modal');
 *   if (!containsElement(modal, e.target as Element)) {
 *     closeModal();
 *   }
 * });
 * ```
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
 * Checks if an element matches a CSS selector.
 * Tests if the element would be selected by the given selector.
 *
 * @param element - The DOM element to test
 * @param selector - CSS selector string to match against
 * @returns True if element matches the selector, false otherwise (including if element is null)
 *
 * @example
 * ```typescript
 * // Check if button has specific class
 * const button = document.querySelector('button');
 * const isPrimary = matchesElement(button, '.primary');
 * ```
 *
 * @example
 * ```typescript
 * // Test multiple conditions
 * const input = document.querySelector('input');
 * const isRequired = matchesElement(input, '[required]');
 * const isEmail = matchesElement(input, '[type="email"]');
 * const isValid = matchesElement(input, ':valid');
 * ```
 *
 * @example
 * ```typescript
 * // Filter elements by selector
 * const elements = document.querySelectorAll('div');
 * const cards = Array.from(elements).filter(el =>
 *   matchesElement(el, '.card:not(.hidden)')
 * );
 * ```
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
