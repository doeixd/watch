/**
 * @module explicit/html
 *
 * Explicit, non-overloaded HTML manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from "../types";

/**
 * Set an element's HTML content.
 *
 * Replaces the element's innerHTML with the provided raw HTML string. Only use with trusted content to avoid XSS risks. The function is a no-op if `element` is falsy or not an `HTMLElement`.
 *
 * @param content - Raw HTML to set as the element's innerHTML (replaces existing content)
 */
export function setHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.innerHTML = content;
}

/**
 * Set inner HTML for all elements matching the given CSS selector.
 *
 * WARNING: Only use with trusted content to avoid XSS vulnerabilities.
 *
 * @param selector - CSS selector matching target elements
 * @param content - HTML string to assign to each element's `innerHTML`
 *
 * @example
 * // Update all card contents
 * setHtmlSelector('.card', '<div class="card-body">Content</div>');
 *
 * @example
 * // Reset all notification areas
 * setHtmlSelector('.notification', '<span class="icon">ℹ</span> Ready');
 *
 * @example
 * // Clear all preview areas
 * setHtmlSelector('.preview', '');
 */
export function setHtmlSelector(selector: string, content: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => setHtmlElement(el, content));
}

/**
 * Set innerHTML on every element that matches the given CSS selector.
 *
 * This is an alias of `setHtmlSelector` that emphasizes applying the operation to all matches.
 * WARNING: Only use with trusted content to avoid XSS vulnerabilities.
 *
 * @param selector - CSS selector used to find target elements
 * @param content - HTML string to assign to each element's `innerHTML`
 */
export function setHtmlAll(selector: string, content: string): void {
  setHtmlSelector(selector, content);
}

/**
 * Set the innerHTML of the first element matching a CSS selector.
 *
 * If no element matches the selector this is a no-op (no error is thrown).
 * WARNING: Only use with trusted content to avoid XSS vulnerabilities.
 *
 * @param selector - CSS selector for the target element
 * @param content - Trusted HTML string to assign to the element's `innerHTML`
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
 * Return the innerHTML of every element that matches the given CSS selector.
 *
 * If no elements match the selector an empty array is returned.
 *
 * Note: content returned may contain unescaped HTML — only use with trusted sources to avoid XSS.
 *
 * @param selector - CSS selector used to find elements
 * @returns An array where each entry is the `innerHTML` of a matching element (preserves order)
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
 * Appends the given HTML string to every element that matches the provided CSS selector.
 *
 * The `content` string is inserted as HTML (via insertAdjacentHTML) — it must be trusted/pre-sanitized to avoid XSS.
 *
 * @param selector - CSS selector used to find target elements
 * @param content - HTML string to append to each matched element (must be trusted)
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
 * Prepends the given HTML string to an element's existing content.
 *
 * The provided `content` is inserted using `insertAdjacentHTML("afterbegin", ...)`.
 * Do not pass untrusted strings — this function directly injects HTML and can cause XSS.
 *
 * @param element - Target element to receive the HTML; no-op if not an HTMLElement
 * @param content - Trusted HTML string to prepend
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
 * Prepends trusted HTML into every element matching the CSS selector.
 *
 * Inserts the provided HTML at the start of each matched element (uses `insertAdjacentHTML('afterbegin', ...)`). The `content` must be trusted to avoid XSS.
 *
 * @param selector - CSS selector used to find target elements
 * @param content - HTML string to prepend into each element
 */
export function prependHtmlSelector(selector: string, content: string): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => prependHtmlElement(el, content));
}

/**
 * Replace a DOM element by setting its `outerHTML`.
 *
 * If `element` is not an `HTMLElement` or is falsy, the call is a no-op. The provided
 * `content` is assigned directly to `outerHTML` — it must be trusted HTML (may introduce XSS).
 *
 * @param element - The element to replace in the DOM
 * @param content - HTML string used to replace the element's `outerHTML` (must be trusted)
 *
 * @example
 * ```typescript
 * const span = document.querySelector('span');
 * replaceHtmlElement(span, '<strong>Replaced</strong>');
 * ```
 */
export function replaceHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
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
 * Clear the inner HTML of every element that matches the given CSS selector.
 *
 * Finds all elements matching `selector` and sets each element's `innerHTML` to an empty string.
 *
 * @param selector - CSS selector used to locate elements to clear
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
