/**
 * @module explicit/utils
 *
 * Utility functions for the explicit API.
 * Helper functions for type checking and element manipulation.
 */

/**
 * Type guard that returns true when the provided value is a DOM Element.
 *
 * This narrows the value's type to `Element` when true.
 *
 * @param value - Value to test
 * @returns `true` if `value` is an `Element`, otherwise `false`
 *
 * @example
 * ```typescript
 * const el = document.querySelector('div');
 * if (isElement(el)) {
 *   // el is narrowed to Element
 * }
 * ```
 */
export function isElement(value: any): value is Element {
  return value instanceof Element;
}

/**
 * Checks if a value is an array of Elements.
 *
 * @param value - The value to check
 * @returns True if the value is an array of Elements
 *
 * @example
 * ```typescript
 * const elements = Array.from(document.querySelectorAll('div'));
 * if (isElementArray(elements)) {
 *   // elements is Element[]
 * }
 * ```
 */
export function isElementArray(value: any): value is Element[] {
  return Array.isArray(value) && value.every((item) => isElement(item));
}

/**
 * Checks if a value is a NodeList.
 *
 * @param value - The value to check
 * @returns True if the value is a NodeList
 *
 * @example
 * ```typescript
 * const nodes = document.querySelectorAll('div');
 * if (isNodeList(nodes)) {
 *   // nodes is a NodeList
 * }
 * ```
 */
export function isNodeList(value: any): value is NodeList {
  return value instanceof NodeList;
}

/**
 * Checks if a string is likely a CSS selector.
 *
 * @param value - The string to check
 * @returns True if the string appears to be a CSS selector
 *
 * @example
 * ```typescript
 * isSelector('#id'); // true
 * isSelector('.class'); // true
 * isSelector('div'); // true
 * isSelector('Hello World'); // false
 * ```
 */
export function isSelector(value: string): boolean {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();

  // Check for common selector patterns
  const selectorPatterns = [
    /^[#.]/, // Starts with # or .
    /^[a-zA-Z][a-zA-Z0-9-]*$/, // Tag name (letters, numbers, hyphens only)
    /^\[/, // Starts with [ (attribute selector)
    /^:+[a-zA-Z]/, // Starts with : (pseudo-selector)
    /^>/, // Starts with > (child selector)
    /^\*/, // Universal selector
  ];

  // Also check if it contains selector-specific characters
  const hasSelectorChars = /[#.\[\]:>~+,]/.test(trimmed);

  // If it has spaces but no selector chars, it's probably not a selector
  if (trimmed.includes(" ") && !hasSelectorChars) {
    return false;
  }

  return selectorPatterns.some((pattern) => pattern.test(trimmed));
}

/**
 * Convert a DOM NodeList or HTMLCollection into a plain array of elements.
 *
 * @param nodeList - The NodeList or HTMLCollection to convert.
 * @returns An array containing the same elements as `nodeList`.
 */
export function toArray<T extends Element = Element>(
  nodeList: NodeListOf<T> | HTMLCollectionOf<T> | HTMLCollection,
): T[] {
  return Array.from(nodeList as any);
}

/**
 * Resolve a single DOM Element from a CSS selector or return the supplied Element.
 *
 * If `target` is a string, this returns the first match from `document.querySelector`.
 * If `target` is an Element, it is returned as-is. Falsy inputs or selector misses produce `null`.
 *
 * @param target - A CSS selector string or an Element (may be `null`/`undefined`).
 * @returns The resolved element of type `E`, or `null` if not found or `target` was falsy.
 */
export function findElement<E extends Element = Element>(
  target: string | Element | null | undefined,
): E | null {
  if (!target) return null;

  if (typeof target === "string") {
    return document.querySelector<E>(target);
  }

  if (isElement(target)) {
    return target as E;
  }

  return null;
}

/**
 * Resolve a target into an array of Elements.
 *
 * Accepts a CSS selector string, a single Element, an array of Elements, or a NodeList and returns a plain array of matched elements. Returns an empty array for null/undefined or unsupported inputs.
 *
 * @param target - A selector string, Element, Element array, NodeList, or null/undefined.
 * @returns An array of elements matching the provided target (possibly empty).
 */
export function findElements<E extends Element = Element>(
  target: string | Element | Element[] | NodeListOf<E> | null | undefined,
): E[] {
  if (!target) return [];

  if (typeof target === "string") {
    return Array.from(document.querySelectorAll<E>(target));
  }

  if (isElement(target)) {
    return [target as E];
  }

  if (isElementArray(target)) {
    return target as E[];
  }

  if (isNodeList(target)) {
    return Array.from(target as NodeListOf<E>);
  }

  return [];
}
