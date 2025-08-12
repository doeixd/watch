/**
 * @module explicit/utils
 *
 * Utility functions for the explicit API.
 * Helper functions for type checking and element manipulation.
 */

/**
 * Checks if a value is a DOM Element.
 *
 * @param value - The value to check
 * @returns True if the value is an Element
 *
 * @example
 * ```typescript
 * const element = document.querySelector('div');
 * if (isElement(element)) {
 *   // element is definitely an Element
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
 * Converts a NodeList or HTMLCollection to an array.
 *
 * @param nodeList - The NodeList or HTMLCollection to convert
 * @returns Array of elements
 *
 * @example
 * ```typescript
 * const nodeList = document.querySelectorAll('.item');
 * const array = toArray(nodeList);
 * // Now you can use array methods
 * ```
 */
export function toArray<T extends Element = Element>(
  nodeList: NodeListOf<T> | HTMLCollectionOf<T> | HTMLCollection,
): T[] {
  return Array.from(nodeList as any);
}

/**
 * Finds a single element using a selector or returns the element if already an Element.
 *
 * @param target - CSS selector string or Element
 * @returns The found or provided element, or null
 *
 * @example
 * ```typescript
 * const element1 = findElement('#my-id');
 * const element2 = findElement(document.querySelector('div'));
 * ```
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
 * Finds all elements using a selector or returns array if already elements.
 *
 * @param target - CSS selector string, Element, or array of Elements
 * @returns Array of found elements
 *
 * @example
 * ```typescript
 * const elements1 = findElements('.item');
 * const elements2 = findElements(document.querySelector('div'));
 * const elements3 = findElements([el1, el2, el3]);
 * ```
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
