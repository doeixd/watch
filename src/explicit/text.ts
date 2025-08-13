/**
 * @module explicit/text
 *
 * Explicit, non-overloaded text manipulation functions.
 * Each function has a single, clear purpose with no ambiguity.
 */

import type { ElementFn } from "../types";

/**
 * Set an element's textContent to the provided value (converted to string).
 *
 * If `element` is falsy the call is a no-op. `content` may be a string or number and will be coerced with `String()`.
 *
 * @param element - Target DOM element to modify; no-op if falsy
 * @param content - Text or number to set as the element's content
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * setTextElement(button, 'Click me!');
 * ```
 *
 * @example
 * ```typescript
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
 * Set the textContent of every element matching the given CSS selector.
 *
 * The provided `content` (string or number) is converted to a string before assignment.
 * If no elements match the selector this is a no-op.
 *
 * @param selector - CSS selector string used to find target elements
 * @param content - Text or number to set on each matched element (will be converted to string)
 *
 * @example
 * // Update all status indicators
 * setTextSelector('.status', 'Active');
 *
 * @example
 * // Update multiple price displays
 * setTextSelector('.price', 99.99);
 */
export function setTextSelector(
  selector: string,
  content: string | number,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => setTextElement(el, content));
}

/**
 * Sets the text content of all elements matching a CSS selector.
 *
 * @param selector - The CSS selector to query elements
 * @param content - The text or number to set as the content (will be converted to a string)
 */
export function setTextAll(selector: string, content: string | number): void {
  setTextSelector(selector, content);
}

/**
 * Set the textContent of the first element that matches the given CSS selector.
 *
 * If no element matches the selector, this function is a no-op. The `content`
 * value is converted to a string before assignment.
 *
 * @param selector - CSS selector used to find the first matching element
 * @param content - Text or number to set as the element's content
 *
 * @example
 * // Update only the first element with class "message"
 * setTextFirst('.message', 'Hello World');
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
 * Creates a generator-friendly function that sets an element's textContent.
 *
 * The returned function is intended for use inside watch/generator flows; when invoked with an Element it sets that element's `textContent` to `content` (converted to a string). If the provided element is falsy, the call is a no-op.
 *
 * @param content - Text or number to set on the element; will be stringified.
 * @returns A function usable in generator-based watchers which sets the element's text.
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
 * Append `content` to an element's `textContent`.
 *
 * Converts `content` to a string and appends it to the element's existing `textContent`. If the element is falsy, the function returns early without changes. A `null` `textContent` is treated as an empty string.
 *
 * @param content - The string or number to append (will be converted to a string)
 */
export function appendTextElement(
  element: Element,
  content: string | number,
): void {
  if (!element) return;
  element.textContent = (element.textContent || "") + String(content);
}

/**
 * Append the given text (or number) to the textContent of every element matching the selector.
 *
 * The `content` is converted to a string before appending. If no elements match the selector this is a no-op.
 *
 * @param selector - CSS selector used to find target elements
 * @param content - Text or number to append to each element's `textContent`
 *
 * @example
 * // Add checkmarks to completed items
 * appendTextSelector('.item.completed', ' ✓');
 */
export function appendTextSelector(
  selector: string,
  content: string | number,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => appendTextElement(el, content));
}

/**
 * Prepends the given content (converted to a string) to an element's textContent.
 *
 * If `element` is falsy the function is a no-op. If the element's current textContent is `null`,
 * it is treated as an empty string.
 *
 * @param element - Target DOM element whose textContent will be updated
 * @param content - Text or number to prepend (will be converted to string)
 */
export function prependTextElement(
  element: Element,
  content: string | number,
): void {
  if (!element) return;
  element.textContent = String(content) + (element.textContent || "");
}

/**
 * Prepends the string form of `content` to the textContent of every element matching `selector`.
 *
 * This queries the document for all elements matching the provided CSS selector and calls
 * `prependTextElement` for each match. If no elements match, the function is a no-op.
 *
 * @param selector - CSS selector to find target elements
 * @param content - Text or number to prepend (converted to a string)
 *
 * @example
 * // Add currency to all prices
 * prependTextSelector('.price', '$');
 */
export function prependTextSelector(
  selector: string,
  content: string | number,
): void {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => prependTextElement(el, content));
}
