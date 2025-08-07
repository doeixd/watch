/**
 * Type Predicates for User Disambiguation
 *
 * This module provides type guard functions that help users disambiguate
 * argument types when working with the watch-selector library's overloaded
 * functions. These predicates provide runtime type checking with TypeScript
 * type narrowing support.
 */

import type {
  ElementFn,
  Workflow,
  ElementHandler,
  ElementFromSelector,
} from "../types";

/**
 * Checks if a value is an HTMLElement.
 *
 * This predicate helps TypeScript understand when you're working with
 * actual DOM elements versus selectors or other types.
 *
 * @param value - The value to check
 * @returns True if the value is an HTMLElement, with type narrowing
 *
 * @example
 * ```typescript
 * import { isElement, text } from 'watch-selector';
 *
 * function processTarget(target: HTMLElement | string) {
 *   if (isElement(target)) {
 *     // TypeScript knows target is HTMLElement here
 *     text(target, 'Direct element');
 *   } else {
 *     // TypeScript knows target is string here
 *     text(target, 'CSS selector');
 *   }
 * }
 * ```
 */
export function isElement(value: any): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * Checks if a value is a specific type of HTML element.
 *
 * This generic predicate allows checking for specific element types
 * like HTMLInputElement, HTMLButtonElement, etc.
 *
 * @param value - The value to check
 * @param constructor - The element constructor to check against
 * @returns True if the value is an instance of the specified element type
 *
 * @example
 * ```typescript
 * import { isElementType, value } from 'watch-selector';
 *
 * const element = document.getElementById('myInput');
 * if (isElementType(element, HTMLInputElement)) {
 *   // TypeScript knows element is HTMLInputElement
 *   value(element, 'typed value');
 * }
 * ```
 */
export function isElementType<T extends HTMLElement>(
  value: any,
  constructor: new () => T
): value is T {
  return value instanceof constructor;
}

/**
 * Checks if a value is an input element (input, textarea, or select).
 *
 * Useful when working with form-related functions like value() and checked().
 *
 * @param value - The value to check
 * @returns True if the value is a form input element
 *
 * @example
 * ```typescript
 * import { isInputElement, value } from 'watch-selector';
 *
 * const element = document.querySelector('.form-field');
 * if (isInputElement(element)) {
 *   // Safe to use value() function
 *   value(element, 'new value');
 * }
 * ```
 */
export function isInputElement(
  value: any
): value is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return (
    value instanceof HTMLInputElement ||
    value instanceof HTMLTextAreaElement ||
    value instanceof HTMLSelectElement
  );
}

/**
 * Checks if a string is likely a CSS selector.
 *
 * This predicate uses heuristics to determine if a string looks like
 * a CSS selector versus plain text or other content.
 *
 * @param value - The value to check
 * @returns True if the value appears to be a CSS selector
 *
 * @example
 * ```typescript
 * import { isSelector, text } from 'watch-selector';
 *
 * function updateContent(target: string) {
 *   if (isSelector(target)) {
 *     // Treat as selector
 *     text(target, 'Updated via selector');
 *   } else {
 *     // Treat as content for generator mode
 *     return text(target);
 *   }
 * }
 * ```
 */
export function isSelector(value: any): value is string {
  if (typeof value !== "string") return false;

  // Check for common CSS selector patterns
  const selectorPatterns = [
    /^[#.]/, // Starts with # or .
    /^[a-zA-Z]+[#.]/, // Tag name followed by # or .
    /^\[/, // Attribute selector
    /[>+~\s]/, // Combinators
    /:[a-z-]+/, // Pseudo-classes
    /\*/, // Universal selector
  ];

  return selectorPatterns.some((pattern) => pattern.test(value));
}

/**
 * Checks if a string represents a space-separated list of class names.
 *
 * Useful for distinguishing between CSS selectors and class lists
 * when using addClass, removeClass, etc.
 *
 * @param value - The value to check
 * @returns True if the value appears to be a class list
 *
 * @example
 * ```typescript
 * import { isClassList, addClass } from 'watch-selector';
 *
 * const classes = 'active highlighted selected';
 * if (isClassList(classes)) {
 *   // Safe to use as class names
 *   addClass(element, classes);
 * }
 * ```
 */
export function isClassList(value: any): value is string {
  if (typeof value !== "string") return false;

  // Class lists should not contain selector syntax
  const invalidPatterns = [/#/, /\./, /\[/, />/, /\+/, /~/, /:/];

  return (
    !invalidPatterns.some((pattern) => pattern.test(value)) &&
    /^[a-zA-Z0-9\s_-]+$/.test(value)
  );
}

/**
 * Checks if a value is a valid style object.
 *
 * Used to distinguish between style objects and other types when
 * using the style() function.
 *
 * @param value - The value to check
 * @returns True if the value is a partial CSSStyleDeclaration object
 *
 * @example
 * ```typescript
 * import { isStyleObject, style } from 'watch-selector';
 *
 * const styles = { color: 'red', fontSize: '16px' };
 * if (isStyleObject(styles)) {
 *   // TypeScript knows this is a style object
 *   style(element, styles);
 * }
 * ```
 */
export function isStyleObject(
  value: any
): value is Partial<CSSStyleDeclaration> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof HTMLElement) &&
    // Check for at least one valid CSS property-like key
    Object.keys(value).some((key) =>
      /^[a-z][a-zA-Z]*$|^--/.test(key)
    )
  );
}

/**
 * Checks if a value is an attribute object.
 *
 * Used to distinguish between attribute objects and other types
 * when using attr() or data() functions.
 *
 * @param value - The value to check
 * @returns True if the value is a plain object suitable for attributes
 *
 * @example
 * ```typescript
 * import { isAttributeObject, attr } from 'watch-selector';
 *
 * const attrs = { 'data-id': '123', 'aria-label': 'Button' };
 * if (isAttributeObject(attrs)) {
 *   attr(element, attrs);
 * }
 * ```
 */
export function isAttributeObject(
  value: any
): value is Record<string, any> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof HTMLElement) &&
    Object.keys(value).length > 0
  );
}

/**
 * Checks if a value is an ElementFn function.
 *
 * ElementFn functions are returned by DOM manipulation functions
 * when called in generator context.
 *
 * @param value - The value to check
 * @returns True if the value is an ElementFn
 *
 * @example
 * ```typescript
 * import { isElementFn, text } from 'watch-selector';
 *
 * const result = text('content');
 * if (isElementFn(result)) {
 *   // This is a generator function
 *   yield result;
 * }
 * ```
 */
export function isElementFn(value: any): value is ElementFn<any, any> {
  return (
    typeof value === "function" &&
    value.length === 1 && // ElementFn takes one element parameter
    !isGeneratorFunction(value) &&
    !isAsyncGeneratorFunction(value)
  );
}

/**
 * Checks if a value is a Workflow (async generator function).
 *
 * Workflows are used in the new async generator pattern with yield*.
 *
 * @param value - The value to check
 * @returns True if the value is a Workflow
 *
 * @example
 * ```typescript
 * import { isWorkflow } from 'watch-selector';
 *
 * async function* myWorkflow() {
 *   // workflow implementation
 * }
 *
 * if (isWorkflow(myWorkflow)) {
 *   yield* myWorkflow();
 * }
 * ```
 */
export function isWorkflow(value: any): value is Workflow<any> {
  return isAsyncGeneratorFunction(value);
}

/**
 * Checks if a function is a generator function.
 *
 * @param value - The value to check
 * @returns True if the value is a generator function
 *
 * @example
 * ```typescript
 * import { isGeneratorFunction } from 'watch-selector';
 *
 * function* myGenerator() {
 *   yield 'value';
 * }
 *
 * if (isGeneratorFunction(myGenerator)) {
 *   // Handle as generator
 * }
 * ```
 */
export function isGeneratorFunction(value: any): value is GeneratorFunction {
  if (typeof value !== "function") return false;

  const constructor = value.constructor;
  if (!constructor) return false;

  const name = constructor.name || constructor.toString();
  return /GeneratorFunction/.test(name);
}

/**
 * Checks if a function is an async generator function.
 *
 * @param value - The value to check
 * @returns True if the value is an async generator function
 *
 * @example
 * ```typescript
 * import { isAsyncGeneratorFunction } from 'watch-selector';
 *
 * async function* myAsyncGen() {
 *   yield 'value';
 * }
 *
 * if (isAsyncGeneratorFunction(myAsyncGen)) {
 *   // Handle as async generator
 * }
 * ```
 */
export function isAsyncGeneratorFunction(
  value: any
): value is AsyncGeneratorFunction {
  if (typeof value !== "function") return false;

  const constructor = value.constructor;
  if (!constructor) return false;

  const name = constructor.name || constructor.toString();
  return /AsyncGeneratorFunction/.test(name);
}

/**
 * Checks if a value is element-like (element or selector string).
 *
 * This combines the isElement and string check for functions that
 * accept either elements or selectors.
 *
 * @param value - The value to check
 * @returns True if the value is an element or string
 *
 * @example
 * ```typescript
 * import { isElementLike, text } from 'watch-selector';
 *
 * function updateText(target: any, content: string) {
 *   if (isElementLike(target)) {
 *     text(target, content);
 *   }
 * }
 * ```
 */
export function isElementLike(value: any): value is HTMLElement | string {
  return isElement(value) || typeof value === "string";
}

/**
 * Checks if we're currently in a generator context.
 *
 * This is useful for determining whether to return ElementFn
 * or execute directly.
 *
 * @returns True if code is executing within a generator
 *
 * @example
 * ```typescript
 * import { isInGeneratorContext, text } from 'watch-selector';
 *
 * function adaptiveText(content: string) {
 *   if (isInGeneratorContext()) {
 *     return text(content); // Return ElementFn
 *   } else {
 *     // Need element for direct mode
 *     throw new Error('Element required outside generator');
 *   }
 * }
 * ```
 */
export function isInGeneratorContext(): boolean {
  // This would need to import from detection module
  // For now, return false as placeholder
  // In real implementation, would check getCurrentContext() !== null
  try {
    const { getCurrentContext } = require("../core/context");
    return getCurrentContext() !== null;
  } catch {
    return false;
  }
}

// Type definitions for generator functions
type GeneratorFunction = (...args: any[]) => Generator<any, any, any>;
type AsyncGeneratorFunction = (
  ...args: any[]
) => AsyncGenerator<any, any, any>;

/**
 * Utility to cast a value to a specific element type after validation.
 *
 * This is a convenience function that combines type checking with casting.
 *
 * @param value - The value to cast
 * @param constructor - The element constructor to check against
 * @returns The value cast to the specified type, or null if invalid
 *
 * @example
 * ```typescript
 * import { asElement, value } from 'watch-selector';
 *
 * const input = asElement(element, HTMLInputElement);
 * if (input) {
 *   value(input, 'new value');
 * }
 * ```
 */
export function asElement<T extends HTMLElement>(
  value: any,
  constructor: new () => T
): T | null {
  return isElementType(value, constructor) ? value : null;
}

/**
 * Type guard for checking if a value is null or undefined.
 *
 * Useful for filtering and null checks with proper type narrowing.
 *
 * @param value - The value to check
 * @returns True if the value is not null or undefined
 *
 * @example
 * ```typescript
 * import { isDefined } from 'watch-selector';
 *
 * const elements = [element1, null, element2, undefined]
 *   .filter(isDefined);
 * // elements is now HTMLElement[]
 * ```
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Combined predicate for valid DOM manipulation targets.
 *
 * Checks if a value can be used as a target for DOM functions.
 *
 * @param value - The value to check
 * @returns True if the value is a valid DOM target
 *
 * @example
 * ```typescript
 * import { isValidTarget, text } from 'watch-selector';
 *
 * if (isValidTarget(target)) {
 *   text(target, 'content');
 * }
 * ```
 */
export function isValidTarget(
  value: any
): value is HTMLElement | string | null {
  return isElement(value) || typeof value === "string" || value === null;
}
