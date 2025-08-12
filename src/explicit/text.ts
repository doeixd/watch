/**
 * @module explicit/text
 *
 * Explicit, non-overloaded text manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from "../types";

/**
 * Sets the text content of an element.
 *
 * @param element - The target DOM element to modify
 * @param content - The text or number to set as content (will be converted to string)
 * @returns void
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * setTextElement(button, 'Click me!');
 * ```
 *
 * @example
 * ```typescript
 * // Works with numbers too
 * const counter = document.getElementById('counter');
 * setTextElement(counter, 42);
 * ```
 */
export function setTextElement(
  element: Element,
  content: string | number,
): void {
  if (!element) return;
  element.textContent = String(content);
}

/**
 * Sets the text content of all elements matching a selector.
 *
 * @param selector - CSS selector string to query elements
 * @param content - The text or number to set as content (will be converted to string)
 * @returns void
 *
 * @example
 * ```typescript
 * // Update all status indicators
 * setTextSelector('.status', 'Active');
 * ```
 *
 * @example
 * ```typescript
 * // Update multiple price displays
 * setTextSelector('.price', 99.99);
 * ```
 *
 * @example
 * ```typescript
 * // Complex selector
 * setTextSelector('div.card > h2.title', 'New Title');
 * ```
 */
export function setTextSelector(
  selector: string,
  content: string | number,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => setTextElement(el, content));
}

/**
 * Sets the text content of all elements matching a selector.
 * Alias for setTextSelector that emphasizes operating on all matches.
 *
 * @param selector - CSS selector string to query elements
 * @param content - The text or number to set as content (will be converted to string)
 * @returns void
 *
 * @example
 * ```typescript
 * // Emphasizes that ALL items will be updated
 * setTextAll('.item', 'Updated');
 * ```
 *
 * @example
 * ```typescript
 * // Clear all error messages
 * setTextAll('.error-msg', '');
 * ```
 */
export function setTextAll(selector: string, content: string | number): void {
  setTextSelector(selector, content);
}

/**
 * Sets the text content of the first element matching a selector.
 *
 * @param selector - CSS selector string to query element
 * @param content - The text or number to set as content (will be converted to string)
 * @returns void
 *
 * @example
 * ```typescript
 * // Only updates the first message
 * setTextFirst('.message', 'Hello World');
 * ```
 *
 * @example
 * ```typescript
 * // Update first heading only
 * setTextFirst('h1', 'Page Title');
 * ```
 *
 * @example
 * ```typescript
 * // No error if element doesn't exist
 * setTextFirst('#non-existent', 'Safe to call');
 * ```
 */
export function setTextFirst(selector: string, content: string | number): void {
  const element = document.querySelector(selector);
  if (element) {
    setTextElement(element, content);
  }
}

/**
 * Gets the text content of an element.
 *
 * @param element - The DOM element to read text from
 * @returns The text content as a string, or empty string if element is null/undefined
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * const text = getTextElement(button); // "Click me!"
 * ```
 *
 * @example
 * ```typescript
 * // Safe with null elements
 * const missing = document.querySelector('#missing');
 * const text = getTextElement(missing); // ""
 * ```
 *
 * @example
 * ```typescript
 * // Gets all text including nested elements
 * const div = document.querySelector('div');
 * const allText = getTextElement(div); // "Parent text and child text"
 * ```
 */
export function getTextElement(element: Element): string {
  if (!element) return "";
  return element.textContent || "";
}

/**
 * Gets the text content of the first element matching a selector.
 *
 * @param selector - CSS selector string to query element
 * @returns The text content as string, or null if no element matches the selector
 *
 * @example
 * ```typescript
 * // Get text from an ID
 * const text = getTextSelector('#title'); // "Welcome"
 * ```
 *
 * @example
 * ```typescript
 * // Returns null for non-existent elements
 * const missing = getTextSelector('#not-found'); // null
 * ```
 *
 * @example
 * ```typescript
 * // Get text from first matching element
 * const firstItem = getTextSelector('.item'); // "Item 1"
 * ```
 */
export function getTextSelector(selector: string): string | null {
  const element = document.querySelector(selector);
  return element ? getTextElement(element) : null;
}

/**
 * Gets the text content of the first element matching a selector.
 * Alias for getTextSelector that emphasizes getting only the first match.
 *
 * @param selector - CSS selector string to query element
 * @returns The text content as string, or null if no element matches the selector
 *
 * @example
 * ```typescript
 * // Emphasizes getting only the first message
 * const text = getTextFirst('.message'); // "First message"
 * ```
 *
 * @example
 * ```typescript
 * // Useful when you know there might be multiple matches
 * const firstPrice = getTextFirst('.price'); // "$99.99"
 * ```
 */
export function getTextFirst(selector: string): string | null {
  return getTextSelector(selector);
}

/**
 * Gets the text content of all elements matching a selector.
 *
 * @param selector - CSS selector string to query elements
 * @returns Array of text content strings (empty array if no matches)
 *
 * @example
 * ```typescript
 * // Get all item texts
 * const texts = getTextAll('.item');
 * // Returns ['Item 1', 'Item 2', 'Item 3']
 * ```
 *
 * @example
 * ```typescript
 * // Returns empty array for no matches
 * const none = getTextAll('.not-found'); // []
 * ```
 *
 * @example
 * ```typescript
 * // Useful for collecting data
 * const prices = getTextAll('.product-price');
 * // Returns ['$19.99', '$29.99', '$39.99']
 * ```
 */
export function getTextAll(selector: string): string[] {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).map((el) => getTextElement(el));
}

/**
 * Returns a generator function that sets text content.
 * For use within watch generators.
 *
 * @param content - The text or number to set as content (will be converted to string)
 * @returns ElementFn that sets text when yielded in a generator context
 *
 * @example
 * ```typescript
 * // Use in a watch generator
 * watch('button', function* () {
 *   yield textGen('Ready');
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Dynamic text in generators
 * watch('.counter', function* () {
 *   let count = 0;
 *   yield textGen(count);
 *   yield click(() => {
 *     count++;
 *     yield textGen(count);
 *   });
 * });
 * ```
 */
export function textGen(content: string | number): ElementFn<Element, void> {
  return (element: Element) => {
    setTextElement(element, content);
  };
}

/**
 * Returns a generator function that gets text content.
 * For use within watch generators.
 *
 * @returns ElementFn that returns text content when yielded in a generator context
 *
 * @example
 * ```typescript
 * // Get current text in a generator
 * watch('button', function* () {
 *   const text = yield textGetGen();
 *   console.log('Current text:', text);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Conditional logic based on text
 * watch('.status', function* () {
 *   const status = yield textGetGen();
 *   if (status === 'Loading') {
 *     yield addClass('spinner');
 *   }
 * });
 * ```
 */
export function textGetGen(): ElementFn<Element, string> {
  return (element: Element) => {
    return getTextElement(element);
  };
}

/**
 * Appends text to an element's existing content.
 *
 * @param element - The target DOM element to modify
 * @param content - The text or number to append (will be converted to string)
 * @returns void
 *
 * @example
 * ```typescript
 * // Add suffix to existing text
 * const div = document.querySelector('div');
 * appendTextElement(div, ' - Updated');
 * // "Original Text" becomes "Original Text - Updated"
 * ```
 *
 * @example
 * ```typescript
 * // Build up text incrementally
 * const log = document.getElementById('log');
 * appendTextElement(log, '\nNew log entry');
 * ```
 *
 * @example
 * ```typescript
 * // Append numbers
 * const score = document.querySelector('.score');
 * appendTextElement(score, 100); // "Score: " becomes "Score: 100"
 * ```
 */
export function appendTextElement(
  element: Element,
  content: string | number,
): void {
  if (!element) return;
  element.textContent = (element.textContent || "") + String(content);
}

/**
 * Appends text to all elements matching a selector.
 *
 * @param selector - CSS selector string to query elements
 * @param content - The text or number to append (will be converted to string)
 * @returns void
 *
 * @example
 * ```typescript
 * // Add checkmarks to completed items
 * appendTextSelector('.item.completed', ' ✓');
 * ```
 *
 * @example
 * ```typescript
 * // Add timestamps to all logs
 * const time = new Date().toLocaleTimeString();
 * appendTextSelector('.log-entry', ` [${time}]`);
 * ```
 *
 * @example
 * ```typescript
 * // Add version numbers
 * appendTextSelector('.app-name', ' v2.0');
 * ```
 */
export function appendTextSelector(
  selector: string,
  content: string | number,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => appendTextElement(el, content));
}

/**
 * Prepends text to an element's existing content.
 *
 * @param element - The target DOM element to modify
 * @param content - The text or number to prepend (will be converted to string)
 * @returns void
 *
 * @example
 * ```typescript
 * // Add prefix to existing text
 * const div = document.querySelector('div');
 * prependTextElement(div, 'Status: ');
 * // "Active" becomes "Status: Active"
 * ```
 *
 * @example
 * ```typescript
 * // Add line numbers
 * const codeLine = document.querySelector('.code-line');
 * prependTextElement(codeLine, '01: ');
 * ```
 *
 * @example
 * ```typescript
 * // Add currency symbols
 * const price = document.querySelector('.amount');
 * prependTextElement(price, '$');
 * // "99.99" becomes "$99.99"
 * ```
 */
export function prependTextElement(
  element: Element,
  content: string | number,
): void {
  if (!element) return;
  element.textContent = String(content) + (element.textContent || "");
}

/**
 * Prepends text to all elements matching a selector.
 *
 * @param selector - CSS selector string to query elements
 * @param content - The text or number to prepend (will be converted to string)
 * @returns void
 *
 * @example
 * ```typescript
 * // Add currency to all prices
 * prependTextSelector('.price', '$');
 * // All "99.99" become "$99.99"
 * ```
 *
 * @example
 * ```typescript
 * // Add icons to menu items
 * prependTextSelector('.menu-item', '▶ ');
 * ```
 *
 * @example
 * ```typescript
 * // Number list items
 * document.querySelectorAll('.list-item').forEach((el, i) => {
 *   prependTextElement(el, `${i + 1}. `);
 * });
 * ```
 */
export function prependTextSelector(
  selector: string,
  content: string | number,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => prependTextElement(el, content));
}
