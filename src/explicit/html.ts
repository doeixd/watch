/**
 * @module explicit/html
 *
 * Explicit, non-overloaded HTML manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from "../types";

/**
 * Sets the HTML content of an element.
 * WARNING: Only use with trusted content to avoid XSS vulnerabilities.
 *
 * @param element - The target DOM element to modify (must be HTMLElement)
 * @param content - The HTML string to set as innerHTML
 * @returns void
 *
 * @example
 * ```typescript
 * // Set simple HTML
 * const div = document.querySelector('div');
 * setHtmlElement(div, '<strong>Bold text</strong>');
 * ```
 *
 * @example
 * ```typescript
 * // Set complex HTML structure
 * const container = document.getElementById('container');
 * setHtmlElement(container, `
 *   <h2>Title</h2>
 *   <p>Paragraph with <em>emphasis</em></p>
 *   <ul>
 *     <li>Item 1</li>
 *     <li>Item 2</li>
 *   </ul>
 * `);
 * ```
 *
 * @example
 * ```typescript
 * // Clear HTML content
 * const section = document.querySelector('.section');
 * setHtmlElement(section, '');
 * ```
 */
export function setHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  // WARNING: Only use with trusted content. Consider using textContent for user input.
  // For sanitization, consider using a library like DOMPurify: element.innerHTML = DOMPurify.sanitize(content);
  element.innerHTML = content;
}

/**
 * Sets the HTML content of all elements matching a selector.
 * WARNING: Only use with trusted content to avoid XSS vulnerabilities.
 *
 * @param selector - CSS selector string to query elements
 * @param content - The HTML string to set as innerHTML
 * @returns void
 *
 * @example
 * ```typescript
 * // Update all card contents
 * setHtmlSelector('.card', '<div class="card-body">Content</div>');
 * ```
 *
 * @example
 * ```typescript
 * // Reset all notification areas
 * setHtmlSelector('.notification', '<span class="icon">ℹ</span> Ready');
 * ```
 *
 * @example
 * ```typescript
 * // Clear all preview areas
 * setHtmlSelector('.preview', '');
 * ```
 */
export function setHtmlSelector(selector: string, content: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => setHtmlElement(el, content));
}

/**
 * Sets the HTML content of all elements matching a selector.
 * Alias for setHtmlSelector that emphasizes operating on all matches.
 * WARNING: Only use with trusted content to avoid XSS vulnerabilities.
 *
 * @param selector - CSS selector string to query elements
 * @param content - The HTML string to set as innerHTML
 * @returns void
 *
 * @example
 * ```typescript
 * // Emphasizes updating ALL items
 * setHtmlAll('.item', '<span class="badge">Updated</span>');
 * ```
 *
 * @example
 * ```typescript
 * // Replace all placeholders with actual content
 * setHtmlAll('.placeholder', '<div class="loaded">Content loaded</div>');
 * ```
 */
export function setHtmlAll(selector: string, content: string): void {
  setHtmlSelector(selector, content);
}

/**
 * Sets the HTML content of the first element matching a selector.
 * WARNING: Only use with trusted content to avoid XSS vulnerabilities.
 *
 * @param selector - CSS selector string to query element
 * @param content - The HTML string to set as innerHTML
 * @returns void
 *
 * @example
 * ```typescript
 * // Only update the first content area
 * setHtmlFirst('.content', '<p>Hello World</p>');
 * ```
 *
 * @example
 * ```typescript
 * // Set main header content
 * setHtmlFirst('header', `
 *   <nav>
 *     <a href="/">Home</a>
 *     <a href="/about">About</a>
 *   </nav>
 * `);
 * ```
 *
 * @example
 * ```typescript
 * // Safe with non-existent elements
 * setHtmlFirst('#missing', '<div>No error</div>');
 * ```
 */
export function setHtmlFirst(selector: string, content: string): void {
  const element = document.querySelector(selector);
  if (element) {
    setHtmlElement(element, content);
  }
}

/**
 * Gets the HTML content of an element.
 *
 * @param element - The DOM element to read HTML from (must be HTMLElement)
 * @returns The innerHTML as string, or empty string if element is null/undefined or not HTMLElement
 *
 * @example
 * ```typescript
 * // Get simple HTML
 * const div = document.querySelector('div');
 * const html = getHtmlElement(div); // "<strong>Bold text</strong>"
 * ```
 *
 * @example
 * ```typescript
 * // Get complex HTML structure
 * const container = document.getElementById('container');
 * const markup = getHtmlElement(container);
 * // Returns all inner HTML including nested elements
 * ```
 *
 * @example
 * ```typescript
 * // Safe with null elements
 * const missing = document.querySelector('#not-found');
 * const html = getHtmlElement(missing); // ""
 * ```
 */
export function getHtmlElement(element: Element): string {
  if (!element || !(element instanceof HTMLElement)) return "";
  return element.innerHTML;
}

/**
 * Gets the HTML content of the first element matching a selector.
 *
 * @param selector - CSS selector string to query element
 * @returns The innerHTML as string, or null if no element matches the selector
 *
 * @example
 * ```typescript
 * // Get HTML from ID selector
 * const html = getHtmlSelector('#content');
 * // "<h1>Title</h1><p>Content</p>"
 * ```
 *
 * @example
 * ```typescript
 * // Get HTML from first matching element
 * const firstCard = getHtmlSelector('.card');
 * // Returns HTML of first card only
 * ```
 *
 * @example
 * ```typescript
 * // Returns null for non-existent elements
 * const missing = getHtmlSelector('#not-found'); // null
 * ```
 */
export function getHtmlSelector(selector: string): string | null {
  const element = document.querySelector(selector);
  return element ? getHtmlElement(element) : null;
}

/**
 * Gets the HTML content of the first element matching a selector.
 * Alias for getHtmlSelector that emphasizes getting only the first match.
 *
 * @param selector - CSS selector string to query element
 * @returns The innerHTML as string, or null if no element matches the selector
 *
 * @example
 * ```typescript
 * // Emphasizes getting only first message HTML
 * const html = getHtmlFirst('.message');
 * ```
 *
 * @example
 * ```typescript
 * // Useful when multiple matches expected
 * const firstRow = getHtmlFirst('table tr');
 * // Gets only the first row's HTML
 * ```
 */
export function getHtmlFirst(selector: string): string | null {
  return getHtmlSelector(selector);
}

/**
 * Gets the HTML content of all elements matching a selector.
 *
 * @param selector - CSS selector string to query elements
 * @returns Array of innerHTML strings (empty array if no matches)
 *
 * @example
 * ```typescript
 * // Get all card HTML contents
 * const htmls = getHtmlAll('.card');
 * // Returns ['<div>Card 1</div>', '<div>Card 2</div>', '<div>Card 3</div>']
 * ```
 *
 * @example
 * ```typescript
 * // Collect all form field HTML
 * const fieldMarkup = getHtmlAll('.form-field');
 * // Returns array of each field's inner HTML
 * ```
 *
 * @example
 * ```typescript
 * // Returns empty array for no matches
 * const none = getHtmlAll('.not-found'); // []
 * ```
 */
export function getHtmlAll(selector: string): string[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => getHtmlElement(el));
}

/**
 * Returns a generator function that sets HTML content.
 * For use within watch generators.
 * WARNING: Only use with trusted content to avoid XSS vulnerabilities.
 *
 * @param content - The HTML string to set as innerHTML
 * @returns ElementFn that sets HTML when yielded in a generator context
 *
 * @example
 * ```typescript
 * // Set HTML in a watch generator
 * watch('.container', function* () {
 *   yield htmlGen('<div>Dynamic content</div>');
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Conditional HTML in generators
 * watch('.status', function* () {
 *   const isActive = yield getState('active');
 *   if (isActive) {
 *     yield htmlGen('<span class="badge active">Active</span>');
 *   } else {
 *     yield htmlGen('<span class="badge">Inactive</span>');
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Build complex layouts
 * watch('.dashboard', function* () {
 *   const data = yield getState('data');
 *   yield htmlGen(`
 *     <div class="stats">
 *       <div class="stat">${data.users} Users</div>
 *       <div class="stat">${data.sales} Sales</div>
 *     </div>
 *   `);
 * });
 * ```
 */
export function htmlGen(content: string): ElementFn<Element, void> {
  return (element: Element) => {
    setHtmlElement(element, content);
  };
}

/**
 * Returns a generator function that gets HTML content.
 * For use within watch generators.
 *
 * @returns ElementFn that returns innerHTML when yielded in a generator context
 *
 * @example
 * ```typescript
 * // Get current HTML in a generator
 * watch('.content', function* () {
 *   const html = yield htmlGetGen();
 *   console.log('Current HTML:', html);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Save and restore HTML
 * watch('.editor', function* () {
 *   const originalHtml = yield htmlGetGen();
 *
 *   yield click(function* () {
 *     // Edit mode
 *     yield htmlGen('<textarea>Edit here</textarea>');
 *   });
 *
 *   yield on('cancel', function* () {
 *     // Restore original
 *     yield htmlGen(originalHtml);
 *   });
 * });
 * ```
 */
export function htmlGetGen(): ElementFn<Element, string> {
  return (element: Element) => {
    return getHtmlElement(element);
  };
}

/**
 * Appends HTML to an element's existing content.
 *
 * @param element - The element to append HTML to
 * @param content - The HTML to append
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * appendHtmlElement(div, '<p>Additional paragraph</p>');
 * ```
 */
export function appendHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.insertAdjacentHTML("beforeend", content);
}

/**
 * Appends HTML to all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param content - The HTML to append
 *
 * @example
 * ```typescript
 * appendHtmlSelector('.list', '<li>New item</li>');
 * ```
 */
export function appendHtmlSelector(selector: string, content: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => appendHtmlElement(el, content));
}

/**
 * Prepends HTML to an element's existing content.
 *
 * @param element - The element to prepend HTML to
 * @param content - The HTML to prepend
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * prependHtmlElement(div, '<h2>Section Title</h2>');
 * ```
 */
export function prependHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.insertAdjacentHTML("afterbegin", content);
}

/**
 * Prepends HTML to all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 * @param content - The HTML to prepend
 *
 * @example
 * ```typescript
 * prependHtmlSelector('.section', '<h3>Title</h3>');
 * ```
 */
export function prependHtmlSelector(selector: string, content: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => prependHtmlElement(el, content));
}

/**
 * Replaces an element's outer HTML.
 *
 * @param element - The element to replace
 * @param content - The new HTML
 *
 * @example
 * ```typescript
 * const span = document.querySelector('span');
 * replaceHtmlElement(span, '<strong>Replaced</strong>');
 * ```
 */
export function replaceHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  // WARNING: This removes the element from DOM and breaks existing references/listeners.
  // Consider using replaceWith() for safer element replacement.
  element.outerHTML = content;
}

/**
 * Clears all HTML content from an element.
 *
 * @param element - The element to clear
 *
 * @example
 * ```typescript
 * const div = document.querySelector('div');
 * clearHtmlElement(div);
 * ```
 */
export function clearHtmlElement(element: Element): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.innerHTML = "";
}

/**
 * Clears HTML from all elements matching a selector.
 *
 * @param selector - CSS selector to find elements
 *
 * @example
 * ```typescript
 * clearHtmlSelector('.temporary-content');
 * ```
 */
export function clearHtmlSelector(selector: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => clearHtmlElement(el));
}
