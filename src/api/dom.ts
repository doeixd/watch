// Comprehensive DOM manipulation functions with dual API support

import type {
  ElementFn,
  ElementFromSelector,
  GeneratorFunction,
  TypedGeneratorContext,
} from "../types";
import { cleanup, executeElementCleanup } from "../core/generator";
import {
  getCurrentContext,
  getCurrentElement,
  registerParentContext,
  unregisterParentContext,
  pushContext,
  popContext,
  executeGenerator,
} from "../core/context";
import { getState, setState } from "../core/state";
import { detectContext, ApiContext } from "../core/detection";

// Type guards and utilities

/**
 * Type guard to check if a value is an HTMLElement.
 *
 * This is a utility function that provides type-safe checking for HTMLElement instances.
 * It's particularly useful when working with dynamic values or when you need to ensure
 * type safety in your DOM manipulation code.
 *
 * @param value - The value to check
 * @returns True if the value is an HTMLElement, false otherwise
 *
 * @example
 * ```typescript
 * import { isElement } from 'watch-selector';
 *
 * const maybeElement = document.querySelector('button');
 * if (isElement(maybeElement)) {
 *   // TypeScript now knows maybeElement is HTMLElement
 *   maybeElement.click();
 * }
 *
 * // Use in filtering arrays
 * const elements = [div, null, span, undefined].filter(isElement);
 * // elements is now HTMLElement[]
 * ```
 */
export function isElement(value: any): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * Type guard to check if a value can be used as an element reference.
 *
 * This function checks if a value is either an HTMLElement or a string (CSS selector).
 * It's useful for functions that accept both direct element references and CSS selectors.
 *
 * @param value - The value to check
 * @returns True if the value is an HTMLElement or string, false otherwise
 *
 * @example Direct element validation
 * ```typescript
 * import { isElementLike } from 'watch-selector';
 *
 * function processElement(target: unknown) {
 *   if (isElementLike(target)) {
 *     // TypeScript knows target is HTMLElement | string
 *     const element = resolveElement(target);
 *     if (element) {
 *       element.focus();
 *     }
 *   }
 * }
 *
 * processElement(document.getElementById('my-button')); // Valid
 * processElement('#my-button'); // Valid
 * processElement(123); // Invalid - won't pass type guard
 * ```
 *
 * @example Array filtering
 * ```typescript
 * import { isElementLike } from 'watch-selector';
 *
 * const mixed = [
 *   document.getElementById('btn1'),
 *   '#btn2',
 *   null,
 *   '.btn3',
 *   undefined,
 *   document.querySelector('.btn4')
 * ];
 *
 * const validTargets = mixed.filter(isElementLike);
 * // validTargets is now (HTMLElement | string)[]
 * ```
 */
export function isElementLike(value: any): value is HTMLElement | string {
  return typeof value === "string" || value instanceof HTMLElement;
}

/**
 * Resolves an element-like value to an actual HTMLElement.
 *
 * This function takes either an HTMLElement or a CSS selector string and returns
 * the corresponding HTMLElement. If a string is provided, it uses querySelector
 * to find the element. This is the core utility function used throughout the
 * library for element resolution.
 *
 * @param elementLike - Either an HTMLElement or a CSS selector string
 * @returns The resolved HTMLElement, or null if not found or invalid
 *
 * @example Direct element reference
 * ```typescript
 * import { resolveElement } from 'watch-selector';
 *
 * const button = document.getElementById('my-button');
 * const resolved = resolveElement(button); // Returns the button element directly
 *
 * console.log(resolved === button); // true
 * ```
 *
 * @example CSS selector resolution
 * ```typescript
 * import { resolveElement } from 'watch-selector';
 *
 * const resolved1 = resolveElement('#my-button'); // Finds and returns the element
 * const resolved2 = resolveElement('.not-found'); // Returns null if not found
 * const resolved3 = resolveElement('button:first-child'); // Complex selectors work
 *
 * if (resolved1) {
 *   resolved1.click(); // Safe to use after null check
 * }
 * ```
 *
 * @example Safe usage pattern
 * ```typescript
 * import { resolveElement } from 'watch-selector';
 *
 * function safeClick(target: HTMLElement | string) {
 *   const element = resolveElement(target);
 *   if (element) {
 *     element.click(); // Type-safe usage
 *   } else {
 *     console.warn('Element not found:', target);
 *   }
 * }
 *
 * // Works with both patterns
 * safeClick('#submit-btn');  // CSS selector
 * safeClick(buttonElement);  // Direct element
 * ```
 *
 * @example Error handling for invalid selectors
 * ```typescript
 * import { resolveElement } from 'watch-selector';
 *
 * // Invalid selector syntax is safely handled
 * const result = resolveElement('>>invalid<<selector'); // Returns null
 * console.log(result); // null - no exception thrown
 * ```
 */
export function resolveElement(
  elementLike: HTMLElement | string,
): HTMLElement | null {
  if (typeof elementLike === "string") {
    try {
      return document.querySelector(elementLike);
    } catch {
      return null;
    }
  }
  if (elementLike instanceof HTMLElement) {
    return elementLike;
  }
  return null;
}

// Internal implementations for text function
function _impl_text_set(element: HTMLElement, content: string): void {
  element.textContent = String(content);
}

function _impl_text_get(element: HTMLElement): string {
  return element.textContent ?? "";
}

// Predicates for text function overloads
function _is_text_direct_set(args: any[]): boolean {
  return args.length === 2 && isElementLike(args[0]);
}

function _is_text_direct_get(args: any[]): boolean {
  // Only treat as direct get if it's an HTMLElement
  return args.length === 1 && args[0] instanceof HTMLElement;
}

function _is_text_selector_get(args: any[]): boolean {
  // Treat as selector get if it's a string that looks like a selector
  return (
    args.length === 1 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0])
  );
}

function _is_text_generator(args: any[]): boolean {
  // Everything else is generator mode
  return (
    args.length <= 1 &&
    !(args[0] instanceof HTMLElement) &&
    (args.length === 0 || !_looksLikeSelector(args[0]))
  );
}

function _looksLikeSelector(str: string): boolean {
  if (typeof str !== "string") return false;

  // If it looks like HTML (contains < or starts with <), it's not a selector
  if (str.includes("<") || str.startsWith("<")) {
    return false;
  }

  // Common selector patterns (excluding plain tag names to avoid false positives)
  // Only spaces that are part of combinators (like "div > span") should be considered selectors
  return (
    str.includes(".") ||
    str.includes("#") ||
    str.includes("[") ||
    str.includes(":") ||
    str.includes(">") ||
    str.includes("+") ||
    str.includes("~") ||
    str.includes("*") ||
    (str.includes(" ") &&
      (str.includes(">") ||
        str.includes("+") ||
        str.includes("~") ||
        str.includes(".")))
  );
}

// TEXT CONTENT

/**
 * Gets or sets the text content of an element using the dual API pattern.
 *
 * This function provides a versatile way to manipulate text content that works both
 * directly with elements and within watch generators. It supports multiple usage patterns:
 * direct element manipulation, CSS selector-based manipulation, and generator-based
 * manipulation for use within watch functions.
 *
 * The function automatically handles type safety and provides different return types
 * based on the usage pattern. When used in generator mode, it returns an ElementFn
 * that can be yielded within a watch generator.
 *
 * @param element - HTMLElement to manipulate (direct API)
 * @param content - Text content to set
 * @returns void when setting, string when getting, ElementFn when in generator mode
 *
 * @example Direct API - Setting text
 * ```typescript
 * import { text } from 'watch-selector';
 *
 * const button = document.getElementById('my-button');
 * text(button, 'Click me!'); // Sets text content directly
 *
 * // Using CSS selector
 * text('#my-button', 'Click me!'); // Finds element and sets text
 * ```
 *
 * @example Direct API - Getting text
 * ```typescript
 * import { text } from 'watch-selector';
 *
 * const button = document.getElementById('my-button');
 * const content = text(button); // Returns current text content
 *
 * // Using CSS selector
 * const content2 = text('#my-button'); // Returns text or null if not found
 * ```
 *
 * @example Generator API - Within watch functions
 * ```typescript
 * import { watch, text, click } from 'watch-selector';
 *
 * watch('button', function* () {
 *   // Set initial text
 *   yield text('Ready');
 *
 *   let count = 0;
 *   yield click(function* () {
 *     count++;
 *     yield text(`Clicked ${count} times`);
 *   });
 * });
 * ```
 *
 * @example Generator API - Reading text in generators
 * ```typescript
 * import { watch, text, self } from 'watch-selector';
 *
 * watch('.status', function* () {
 *   // Get current text content
 *   const currentText = yield text();
 *   console.log('Current status:', currentText);
 *
 *   // Update based on current content
 *   if (currentText === 'idle') {
 *     yield text('active');
 *   }
 * });
 * ```
 *
 * @example Advanced usage with form elements
 * ```typescript
 * import { watch, text, input } from 'watch-selector';
 *
 * watch('.character-counter', function* () {
 *   const input = self().querySelector('input');
 *
 *   yield input(function* (event) {
 *     const length = (event.target as HTMLInputElement).value.length;
 *     yield text(`${length}/100 characters`);
 *   });
 * });
 * ```
 */
// Generator overloads first (more specific)
export function text<El extends HTMLElement = HTMLElement>(
  content: string,
): ElementFn<El>;
export function text<El extends HTMLElement = HTMLElement>(): ElementFn<
  El,
  string
>;
// Direct element overloads
export function text(element: HTMLElement, content: string): void;
export function text(element: HTMLElement): string;
// Selector overloads last (catch-all for strings)
export function text(selector: string, content: string): void;
export function text(selector: string): string | null;
export function text(...args: any[]): any {
  const detection = detectContext(args, text);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: text(element, value) or text(selector, value)
      const [target, content] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element && args.length === 2) {
          // Setter with selector that doesn't match - just return
          return;
        } else if (!element && args.length === 1) {
          // Getter with selector that doesn't match
          return null;
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (!element) {
        // Handle null/undefined gracefully
        return args.length === 2 ? undefined : null;
      }

      // Setter or getter?
      if (args.length === 2) {
        _impl_text_set(element, content);
        return;
      } else {
        return _impl_text_get(element);
      }
    }

    case ApiContext.SYNC_GENERATOR: {
      // Sync generator mode: yield text(value) or const val = yield text()
      const [content] = args;
      if (content === undefined) {
        // Getter mode
        return ((element: HTMLElement) => _impl_text_get(element)) as ElementFn<
          HTMLElement,
          string
        >;
      } else {
        // Setter mode
        return ((element: HTMLElement) => {
          _impl_text_set(element, content);
        }) as ElementFn<HTMLElement, void>;
      }
    }

    case ApiContext.ASYNC_GENERATOR: {
      // For now, handle async generators the same as sync
      // In the future, we'll return proper Workflow objects
      const [content] = args;
      if (content === undefined) {
        // Getter mode
        return ((element: HTMLElement) => _impl_text_get(element)) as ElementFn<
          HTMLElement,
          string
        >;
      } else {
        // Setter mode
        return ((element: HTMLElement) => {
          _impl_text_set(element, content);
        }) as ElementFn<HTMLElement, void>;
      }
    }

    default: {
      // Unknown context - try to determine based on arguments
      // This maintains backwards compatibility
      if (_is_text_direct_set(args)) {
        const [elementLike, content] = args;
        const element = resolveElement(elementLike);
        if (element) {
          _impl_text_set(element, content);
        }
        return;
      }

      if (_is_text_direct_get(args)) {
        const [element] = args;
        return _impl_text_get(element);
      }

      if (_is_text_selector_get(args)) {
        const [selector] = args;
        const element = resolveElement(selector);
        return element ? _impl_text_get(element) : null;
      }

      // Generator mode - use the proper check
      if (_is_text_generator(args)) {
        const [content] = args;
        if (content === undefined) {
          return ((element: HTMLElement) =>
            _impl_text_get(element)) as ElementFn<HTMLElement, string>;
        } else {
          return ((element: HTMLElement) => {
            _impl_text_set(element, content);
          }) as ElementFn<HTMLElement, void>;
        }
      }

      // Handle null/undefined gracefully
      if (args[0] === null || args[0] === undefined) {
        return args.length === 2 ? undefined : null;
      }

      throw new Error("Invalid arguments for text function");
    }
  }
}

// Internal implementations for html function
function _impl_html_set(element: HTMLElement, content: string): void {
  element.innerHTML = String(content);
}

function _impl_html_get(element: HTMLElement): string {
  return element.innerHTML;
}

// HTML CONTENT
// Generator overloads first (more specific)
export function html<El extends HTMLElement = HTMLElement>(
  content: string,
): ElementFn<El>;
export function html<El extends HTMLElement = HTMLElement>(): ElementFn<
  El,
  string
>;
// Direct element overloads
export function html(element: HTMLElement, content: string): void;
export function html(element: HTMLElement): string;
// Selector overloads last (catch-all for strings)
export function html(selector: string, content: string): void;
export function html(selector: string): string | null;
export function html(...args: any[]): any {
  const detection = detectContext(args, html);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: html(element, value) or html(selector, value)
      const [target, content] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element && args.length === 2) {
          // Setter with selector that doesn't match - just return
          return;
        } else if (!element && args.length === 1) {
          // Getter with selector that doesn't match
          return null;
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (!element) {
        throw new Error(`Invalid target for html function`);
      }

      // Setter or getter?
      if (args.length === 2) {
        _impl_html_set(element, content);
        return;
      } else {
        return _impl_html_get(element);
      }
    }

    case ApiContext.SYNC_GENERATOR:
    case ApiContext.ASYNC_GENERATOR: {
      // Generator mode: yield html(value) or const val = yield html()
      const [content] = args;
      if (content === undefined) {
        // Getter mode
        return ((element: HTMLElement) => _impl_html_get(element)) as ElementFn<
          HTMLElement,
          string
        >;
      } else {
        // Setter mode
        return ((element: HTMLElement) => {
          _impl_html_set(element, content);
        }) as ElementFn<HTMLElement, void>;
      }
    }

    default: {
      // Fallback to original logic for unknown context
      if (args.length === 2 && isElementLike(args[0])) {
        const [elementLike, content] = args;
        const element = resolveElement(elementLike);
        if (element) {
          _impl_html_set(element, content);
        }
        return;
      }

      if (args.length === 1 && args[0] instanceof HTMLElement) {
        const [element] = args;
        return _impl_html_get(element);
      }

      if (
        args.length === 1 &&
        typeof args[0] === "string" &&
        _looksLikeSelector(args[0])
      ) {
        const [selector] = args;
        const element = resolveElement(selector);
        return element ? _impl_html_get(element) : null;
      }

      if (args.length <= 1) {
        const [content] = args;
        if (content === undefined) {
          return ((element: HTMLElement) =>
            _impl_html_get(element)) as ElementFn<HTMLElement, string>;
        } else {
          return ((element: HTMLElement) => {
            _impl_html_set(element, content);
          }) as ElementFn<HTMLElement, void>;
        }
      }

      return ((element: HTMLElement) => _impl_html_get(element)) as ElementFn<
        HTMLElement,
        string
      >;
    }
  }
}

// Internal implementations for addClass function
function _impl_addClass(element: HTMLElement, ...classNames: string[]): void {
  const splitClassNames = classNames.flatMap((name) =>
    name.split(/\s+/).filter(Boolean),
  );
  element.classList.add(...splitClassNames);
}

// CLASS MANIPULATION
// Generator overload first
export function addClass<El extends HTMLElement = HTMLElement>(
  ...classNames: string[]
): ElementFn<El>;
// Direct element and selector overloads
export function addClass(element: HTMLElement, ...classNames: string[]): void;
export function addClass(selector: string, ...classNames: string[]): void;
export function addClass(...args: any[]): any {
  const detection = detectContext(args, addClass);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: addClass(element, ...classNames) or addClass(selector, ...classNames)
      const [target, ...classNames] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string" && !_looksLikeSelector(target)) {
        // If it doesn't look like a selector, it might be a class name in generator mode
        // Fall through to generator handling
        break;
      } else if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element) {
          return; // Selector didn't match
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      } else if (target === null || target === undefined) {
        // Handle null/undefined gracefully
        return;
      }

      if (element && classNames.length > 0) {
        _impl_addClass(element, ...classNames);
      }
      return;
    }

    case ApiContext.SYNC_GENERATOR:
    case ApiContext.ASYNC_GENERATOR: {
      // Generator mode: yield addClass(...classNames)
      const classNames = args;
      return ((element: HTMLElement) => {
        _impl_addClass(element, ...classNames);
      }) as ElementFn<HTMLElement, void>;
    }

    default: {
      // Fallback to original logic
      if (args.length >= 2 && isElementLike(args[0])) {
        const [elementLike, ...classNames] = args;
        const element = resolveElement(elementLike);
        if (element) {
          _impl_addClass(element, ...classNames);
        }
        return;
      }

      if (args.length >= 1 && args[0] instanceof HTMLElement) {
        const [element, ...classNames] = args;
        _impl_addClass(element, ...classNames);
        return;
      }

      if (
        args.length >= 1 &&
        typeof args[0] === "string" &&
        args.length >= 2 &&
        _looksLikeSelector(args[0])
      ) {
        const [selector, ...classNames] = args;
        const element = resolveElement(selector);
        if (element) {
          _impl_addClass(element, ...classNames);
        }
        return;
      }

      // Generator mode
      const allClassNames = args;
      return ((element: HTMLElement) => {
        _impl_addClass(element, ...allClassNames);
      }) as ElementFn<HTMLElement, void>;
    }
  }
}

// Internal implementations for removeClass function
function _impl_removeClass(
  element: HTMLElement,
  ...classNames: string[]
): void {
  const splitClassNames = classNames.flatMap((name) =>
    name.split(/\s+/).filter(Boolean),
  );
  element.classList.remove(...splitClassNames);
}

// Generator overload first
export function removeClass<El extends HTMLElement = HTMLElement>(
  ...classNames: string[]
): ElementFn<El>;
// Direct element and selector overloads
export function removeClass(
  element: HTMLElement,
  ...classNames: string[]
): void;
export function removeClass(selector: string, ...classNames: string[]): void;
export function removeClass(...args: any[]): any {
  const detection = detectContext(args, removeClass);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: removeClass(element, ...classNames) or removeClass(selector, ...classNames)
      const [target, ...classNames] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string" && !_looksLikeSelector(target)) {
        // If it doesn't look like a selector, it might be a class name in generator mode
        // Fall through to generator handling
        break;
      } else if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element) {
          return; // Selector didn't match
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (element && classNames.length > 0) {
        _impl_removeClass(element, ...classNames);
      }
      return;
    }

    case ApiContext.SYNC_GENERATOR:
    case ApiContext.ASYNC_GENERATOR: {
      // Generator mode: yield removeClass(...classNames)
      const classNames = args;
      return ((element: HTMLElement) => {
        _impl_removeClass(element, ...classNames);
      }) as ElementFn<HTMLElement, void>;
    }

    default: {
      // Fallback to original logic
      if (args.length >= 2 && isElementLike(args[0])) {
        const [elementLike, ...classNames] = args;
        const element = resolveElement(elementLike);
        if (element) {
          _impl_removeClass(element, ...classNames);
        }
        return;
      }

      if (args.length >= 1 && args[0] instanceof HTMLElement) {
        const [element, ...classNames] = args;
        _impl_removeClass(element, ...classNames);
        return;
      }

      if (
        args.length >= 1 &&
        typeof args[0] === "string" &&
        args.length >= 2 &&
        _looksLikeSelector(args[0])
      ) {
        const [selector, ...classNames] = args;
        const element = resolveElement(selector);
        if (element) {
          _impl_removeClass(element, ...classNames);
        }
        return;
      }

      // Generator mode
      const allClassNames = args;
      return ((element: HTMLElement) => {
        _impl_removeClass(element, ...allClassNames);
      }) as ElementFn<HTMLElement, void>;
    }
  }
}

function _impl_toggleClass(
  element: HTMLElement,

  className: string,

  force?: boolean,
): boolean {
  return element.classList.toggle(className, force);
}

// Generator overload first
export function toggleClass<El extends HTMLElement = HTMLElement>(
  className: string,
  force?: boolean,
): ElementFn<El, boolean>;
// Direct element and selector overloads
export function toggleClass(
  element: HTMLElement,
  className: string,
  force?: boolean,
): boolean;
export function toggleClass(
  selector: string,
  className: string,
  force?: boolean,
): boolean;
export function toggleClass(...args: any[]): any {
  const detection = detectContext(args, toggleClass);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: toggleClass(element, className, force) or toggleClass(selector, className, force)
      const [target, className, force] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string" && !_looksLikeSelector(target)) {
        // If it doesn't look like a selector, it might be a class name in generator mode
        // Fall through to generator handling
        break;
      } else if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element) {
          return false; // Selector didn't match
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (element && className) {
        return _impl_toggleClass(element, className, force);
      }
      return false;
    }

    case ApiContext.SYNC_GENERATOR:
    case ApiContext.ASYNC_GENERATOR: {
      // Generator mode: yield toggleClass(className, force)
      const [className, force] = args;
      return ((element: HTMLElement) => {
        return _impl_toggleClass(element, className, force);
      }) as ElementFn<HTMLElement, boolean>;
    }

    default: {
      // Fallback to original logic
      // Direct call: toggleClass(element, 'class', true)
      if (args.length >= 2 && isElementLike(args[0])) {
        const [elementLike, className, force] = args;
        const element = resolveElement(elementLike);
        if (element) {
          return _impl_toggleClass(element, className, force);
        }
        return false;
      }

      // Generator mode: toggleClass('class', true)
      if (args.length <= 2 && typeof args[0] === "string") {
        const [className, force] = args;
        return (element: HTMLElement) =>
          _impl_toggleClass(element, className, force);
      }

      // Fallback for safety, though should not be reached with correct usage
      return (element: HTMLElement) =>
        _impl_toggleClass(element, args[0], args[1]);
    }
  }
}

// Internal implementations for hasClass function
function _impl_hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

// Generator overload first
export function hasClass<El extends HTMLElement = HTMLElement>(
  className: string,
): ElementFn<El, boolean>;
// Direct element and selector overloads
export function hasClass(element: HTMLElement, className: string): boolean;
export function hasClass(selector: string, className: string): boolean;
export function hasClass(...args: any[]): any {
  if (args.length === 2 && isElementLike(args[0])) {
    const [elementLike, className] = args;
    const element = resolveElement(elementLike);
    return element ? _impl_hasClass(element, className) : false;
  }

  if (args.length === 2 && args[0] instanceof HTMLElement) {
    const [element, className] = args;
    return _impl_hasClass(element, className);
  }

  if (
    args.length === 2 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0])
  ) {
    const [selector, className] = args;
    const element = resolveElement(selector);
    return element ? _impl_hasClass(element, className) : false;
  }

  // Generator mode
  const [className] = args;
  return (element: HTMLElement) => _impl_hasClass(element, className);
}

// Internal implementations for style function
function _impl_style_set_object(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>,
): void {
  for (const [property, value] of Object.entries(styles)) {
    if (property.startsWith("--")) {
      // CSS custom properties must be set using setProperty
      element.style.setProperty(property, value as string);
    } else {
      // Regular properties can use direct assignment
      (element.style as any)[property] = value;
    }
  }
}

function _impl_style_set_property(
  element: HTMLElement,
  property: string,
  value: string,
): void {
  element.style.setProperty(property, value);
}

function _impl_style_get_property(
  element: HTMLElement,
  property: string,
): string {
  return (
    element.style.getPropertyValue(property) ||
    (element.style as any)[property] ||
    ""
  );
}

// Predicates for style function overloads
function _is_style_direct_set_object(args: any[]): boolean {
  return (
    args.length === 2 &&
    isElementLike(args[0]) &&
    typeof args[1] === "object" &&
    args[1] !== null
  );
}

function _is_style_direct_set_property(args: any[]): boolean {
  return (
    args.length === 3 &&
    isElementLike(args[0]) &&
    typeof args[1] === "string" &&
    args[2] !== undefined
  );
}

function _is_style_direct_get_property(args: any[]): boolean {
  return (
    args.length === 2 && isElementLike(args[0]) && typeof args[1] === "string"
  );
}

function _is_style_selector_set_object(args: any[]): boolean {
  return (
    args.length === 2 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0]) &&
    typeof args[1] === "object" &&
    args[1] !== null
  );
}

function _is_style_selector_set_property(args: any[]): boolean {
  return (
    args.length === 3 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0]) &&
    typeof args[1] === "string" &&
    args[2] !== undefined
  );
}

function _is_style_selector_get_property(args: any[]): boolean {
  return (
    args.length === 2 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0]) &&
    typeof args[1] === "string"
  );
}

function _is_style_generator_object(args: any[]): boolean {
  return args.length === 1 && typeof args[0] === "object" && args[0] !== null;
}

function _is_style_generator_property(args: any[]): boolean {
  return (
    args.length === 2 && typeof args[0] === "string" && args[1] !== undefined
  );
}

// STYLE MANIPULATION
// Generator overloads first
export function style<El extends HTMLElement = HTMLElement>(
  styles: Partial<CSSStyleDeclaration> | Record<string, string>,
): ElementFn<El>;
export function style<El extends HTMLElement = HTMLElement>(
  property: string,
  value: string,
): ElementFn<El>;
// Direct element overloads
export function style(element: HTMLElement, property: string): string;
export function style(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration> | Record<string, string>,
): void;
export function style(
  element: HTMLElement,
  property: string,
  value: string,
): void;
// Selector overloads last
export function style(selector: string, property: string): string | null;
export function style(
  selector: string,
  styles: Partial<CSSStyleDeclaration> | Record<string, string>,
): void;
export function style(selector: string, property: string, value: string): void;
export function style(...args: any[]): any {
  const detection = detectContext(args, style);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: style(element/selector, ...)
      const [target, propertyOrStyles, value] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element) {
          // For getters, return null; for setters, just return
          return args.length === 2 && typeof propertyOrStyles === "string"
            ? null
            : undefined;
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (!element) {
        // Handle null/undefined gracefully for direct/selector calls
        if (target === null || target === undefined) {
          return args.length === 3
            ? undefined
            : args.length === 2 && typeof propertyOrStyles === "string"
              ? null
              : undefined;
        }
        // Not a direct/selector call, fall through
        break;
      }

      // Handle different argument patterns
      if (args.length === 3) {
        // Set single property: style(element, 'width', '100px')
        _impl_style_set_property(element, propertyOrStyles, value);
        return;
      } else if (args.length === 2) {
        if (typeof propertyOrStyles === "object" && propertyOrStyles !== null) {
          // Set multiple styles: style(element, {width: '100px'})
          _impl_style_set_object(element, propertyOrStyles);
          return;
        } else if (typeof propertyOrStyles === "string") {
          // Get property: style(element, 'width')
          return _impl_style_get_property(element, propertyOrStyles);
        }
      }
      return;
    }

    case ApiContext.SYNC_GENERATOR:
    case ApiContext.ASYNC_GENERATOR: {
      // Generator mode: yield style(...)
      if (args.length === 2 && typeof args[0] === "string") {
        // Set single property: yield style('width', '100px')
        const [property, value] = args;
        return ((element: HTMLElement) =>
          _impl_style_set_property(element, property, value)) as ElementFn<
          HTMLElement,
          void
        >;
      } else if (args.length === 1) {
        if (typeof args[0] === "object" && args[0] !== null) {
          // Set multiple styles: yield style({width: '100px'})
          const [styles] = args;
          return ((element: HTMLElement) =>
            _impl_style_set_object(element, styles)) as ElementFn<
            HTMLElement,
            void
          >;
        } else if (typeof args[0] === "string") {
          // Get property: yield style('width')
          const [property] = args;
          return ((element: HTMLElement) =>
            _impl_style_get_property(element, property)) as ElementFn<
            HTMLElement,
            string
          >;
        }
      }
      return ((element: HTMLElement) =>
        _impl_style_get_property(element, "")) as ElementFn<
        HTMLElement,
        string
      >;
    }

    default: {
      // Fallback to original logic
      if (_is_style_direct_set_object(args)) {
        const [elementLike, styles] = args;
        const element = resolveElement(elementLike);
        if (element) {
          _impl_style_set_object(element, styles);
        }
        return;
      }

      if (_is_style_direct_set_property(args)) {
        const [elementLike, property, value] = args;
        const element = resolveElement(elementLike);
        if (element) {
          _impl_style_set_property(element, property, value);
        }
        return;
      }

      if (_is_style_direct_get_property(args)) {
        const [elementLike, property] = args;
        const element = resolveElement(elementLike);
        return element ? _impl_style_get_property(element, property) : "";
      }

      if (_is_style_generator_object(args)) {
        const [styles] = args;
        return ((element: HTMLElement) =>
          _impl_style_set_object(element, styles)) as ElementFn<
          HTMLElement,
          void
        >;
      }

      if (_is_style_generator_property(args)) {
        const [property, value] = args;
        return ((element: HTMLElement) =>
          _impl_style_set_property(element, property, value)) as ElementFn<
          HTMLElement,
          void
        >;
      }

      // Fallback for generator mode with single property get
      if (args.length === 1 && typeof args[0] === "string") {
        const [property] = args;
        return ((element: HTMLElement) =>
          _impl_style_get_property(element, property)) as ElementFn<
          HTMLElement,
          string
        >;
      }

      return ((element: HTMLElement) =>
        _impl_style_get_property(element, "")) as ElementFn<
        HTMLElement,
        string
      >;
    }
  }
}

// Internal implementations for attr function
function _impl_attr_set_object(
  element: HTMLElement,
  attrs: Record<string, any>,
): void {
  Object.entries(attrs).forEach(([key, val]) => {
    element.setAttribute(key, String(val));
  });
}

function _impl_attr_set_property(
  element: HTMLElement,
  name: string,
  value: any,
): void {
  element.setAttribute(name, String(value));
}

function _impl_attr_get_property(
  element: HTMLElement,
  name: string,
): string | null {
  return element.getAttribute(name);
}

// Internal implementations for prop function
function _impl_prop_set_object(
  element: HTMLElement,
  props: Record<string, any>,
): void {
  Object.entries(props).forEach(([key, val]) => {
    (element as any)[key] = val;
  });
}

function _impl_prop_set_property(
  element: HTMLElement,
  name: string,
  value: any,
): void {
  (element as any)[name] = value;
}

function _impl_prop_get_property(element: HTMLElement, name: string): any {
  return (element as any)[name];
}

// Internal implementations for data function
function _impl_data_set_object(
  element: HTMLElement,
  data: Record<string, any>,
): void {
  Object.entries(data).forEach(([key, val]) => {
    element.dataset[key] = String(val);
  });
}

function _impl_data_set_property(
  element: HTMLElement,
  name: string,
  value: any,
): void {
  element.dataset[name] = String(value);
}

function _impl_data_get_property(
  element: HTMLElement,
  name: string,
): string | undefined {
  return element.dataset[name];
}

// Predicates for accessor functions
function _is_accessor_direct_set_object(args: any[]): boolean {
  return (
    args.length === 2 &&
    isElementLike(args[0]) &&
    typeof args[1] === "object" &&
    args[1] !== null
  );
}

function _is_accessor_direct_set_property(args: any[]): boolean {
  return (
    args.length === 3 &&
    isElementLike(args[0]) &&
    typeof args[1] === "string" &&
    args[2] !== undefined
  );
}

function _is_accessor_direct_get_property(args: any[]): boolean {
  return (
    args.length === 2 &&
    args[0] instanceof HTMLElement &&
    typeof args[1] === "string"
  );
}

function _is_accessor_selector_set_object(args: any[]): boolean {
  return (
    args.length === 2 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0]) &&
    typeof args[1] === "object" &&
    args[1] !== null
  );
}

function _is_accessor_selector_set_property(args: any[]): boolean {
  return (
    args.length === 3 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0]) &&
    typeof args[1] === "string" &&
    args[2] !== undefined
  );
}

function _is_accessor_selector_get_property(args: any[]): boolean {
  return (
    args.length === 2 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0]) &&
    typeof args[1] === "string"
  );
}

function _is_accessor_generator_object(args: any[]): boolean {
  return args.length === 1 && typeof args[0] === "object" && args[0] !== null;
}

function _is_accessor_generator_property(args: any[]): boolean {
  return (
    args.length === 2 && typeof args[0] === "string" && args[1] !== undefined
  );
}

function _is_accessor_generator_get(args: any[]): boolean {
  return args.length === 1 && typeof args[0] === "string";
}

// ATTRIBUTE & PROPERTY MANIPULATION
function createAccessor(type: "attr" | "prop" | "data") {
  const implSetObject =
    type === "attr"
      ? _impl_attr_set_object
      : type === "prop"
        ? _impl_prop_set_object
        : _impl_data_set_object;
  const implSetProperty =
    type === "attr"
      ? _impl_attr_set_property
      : type === "prop"
        ? _impl_prop_set_property
        : _impl_data_set_property;
  const implGetProperty =
    type === "attr"
      ? _impl_attr_get_property
      : type === "prop"
        ? _impl_prop_get_property
        : _impl_data_get_property;

  return function (...args: any[]): any {
    if (_is_accessor_direct_set_object(args)) {
      const [elementLike, obj] = args;
      const element = resolveElement(elementLike);
      if (element) {
        implSetObject(element, obj);
      }
      return;
    }

    if (_is_accessor_direct_set_property(args)) {
      const [elementLike, name, value] = args;
      const element = resolveElement(elementLike);
      if (element) {
        implSetProperty(element, name, value);
      }
      return;
    }

    if (_is_accessor_direct_get_property(args)) {
      const [elementLike, name] = args;
      const element = resolveElement(elementLike);
      return element ? implGetProperty(element, name) : null;
    }

    if (_is_accessor_generator_object(args)) {
      const [obj] = args;
      return ((element: HTMLElement) =>
        implSetObject(element, obj)) as ElementFn<HTMLElement, void>;
    }

    if (_is_accessor_generator_property(args)) {
      const [name, value] = args;
      return ((element: HTMLElement) =>
        implSetProperty(element, name, value)) as ElementFn<HTMLElement, void>;
    }

    if (_is_accessor_generator_get(args)) {
      const [name] = args;
      return ((element: HTMLElement) =>
        implGetProperty(element, name)) as ElementFn<HTMLElement, any>;
    }

    if (_is_accessor_selector_set_object(args)) {
      const [selector, obj] = args;
      const element = resolveElement(selector);
      if (element) {
        implSetObject(element, obj);
      }
      return;
    }

    if (_is_accessor_selector_set_property(args)) {
      const [selector, name, value] = args;
      const element = resolveElement(selector);
      if (element) {
        implSetProperty(element, name, value);
      }
      return;
    }

    if (_is_accessor_selector_get_property(args)) {
      const [selector, name] = args;
      const element = resolveElement(selector);
      return element ? implGetProperty(element, name) : null;
    }

    return (_element: HTMLElement) => null;
  };
}

export const attr = createAccessor("attr");
export const prop = createAccessor("prop");
export const data = createAccessor("data");

// Internal implementations for removeAttr function
function _impl_removeAttr(element: HTMLElement, names: string[]): void {
  names.flat().forEach((name) => element.removeAttribute(name));
}

// Generator overload first
export function removeAttr<El extends HTMLElement = HTMLElement>(
  ...names: string[]
): ElementFn<El>;
// Direct element and selector overloads
export function removeAttr(element: HTMLElement, names: string[]): void;
export function removeAttr(element: HTMLElement, ...names: string[]): void;
export function removeAttr(selector: string, names: string[]): void;
export function removeAttr(selector: string, ...names: string[]): void;
export function removeAttr(...args: any[]): any {
  const detection = detectContext(args, removeAttr);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: removeAttr(element, ...names) or removeAttr(selector, ...names)
      const [target, ...namesOrArray] = args;
      // Handle both array and spread arguments
      const names = Array.isArray(namesOrArray[0])
        ? namesOrArray[0]
        : namesOrArray;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string" && !_looksLikeSelector(target)) {
        // If it doesn't look like a selector, it might be an attribute name in generator mode
        // Fall through to generator handling
        break;
      } else if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element) {
          return; // Selector didn't match
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (element && names.length > 0) {
        _impl_removeAttr(element, names);
      }
      return;
    }

    case ApiContext.SYNC_GENERATOR:
    case ApiContext.ASYNC_GENERATOR: {
      // Generator mode: yield removeAttr(...names)
      const names = args;
      return ((element: HTMLElement) => {
        _impl_removeAttr(element, names);
      }) as ElementFn<HTMLElement, void>;
    }

    default: {
      // Fallback to original logic
      if (isElementLike(args[0])) {
        const [elementLike, ...namesOrArray] = args;
        const names = Array.isArray(namesOrArray[0])
          ? namesOrArray[0]
          : namesOrArray;
        const element = resolveElement(elementLike);
        if (element) {
          _impl_removeAttr(element, names);
        }
        return;
      }

      if (args.length >= 1 && args[0] instanceof HTMLElement) {
        const [element, ...namesOrArray] = args;
        const names = Array.isArray(namesOrArray[0])
          ? namesOrArray[0]
          : namesOrArray;
        _impl_removeAttr(element, names);
        return;
      }

      if (
        args.length >= 1 &&
        typeof args[0] === "string" &&
        args.length >= 2 &&
        _looksLikeSelector(args[0])
      ) {
        const [selector, ...namesOrArray] = args;
        const names = Array.isArray(namesOrArray[0])
          ? namesOrArray[0]
          : namesOrArray;
        const element = resolveElement(selector);
        if (element) {
          _impl_removeAttr(element, names);
        }
        return;
      }

      // Generator mode
      return (element: HTMLElement) => {
        _impl_removeAttr(element, args);
      };
    }
  }
}

// Internal implementations for hasAttr function
function _impl_hasAttr(element: HTMLElement, name: string): boolean {
  return element.hasAttribute(name);
}

// Generator overload first
export function hasAttr<El extends HTMLElement = HTMLElement>(
  name: string,
): ElementFn<El, boolean>;
// Direct element and selector overloads
export function hasAttr(element: HTMLElement, name: string): boolean;
export function hasAttr(selector: string, name: string): boolean;
export function hasAttr(...args: any[]): any {
  if (args.length === 2 && isElementLike(args[0])) {
    const [elementLike, name] = args;
    const element = resolveElement(elementLike);
    return element ? _impl_hasAttr(element, name) : false;
  }

  if (args.length === 2 && args[0] instanceof HTMLElement) {
    const [element, name] = args;
    return _impl_hasAttr(element, name);
  }

  if (
    args.length === 2 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0])
  ) {
    const [selector, name] = args;
    const element = resolveElement(selector);
    return element ? _impl_hasAttr(element, name) : false;
  }

  // Generator mode
  const [name] = args;
  return ((element: HTMLElement) => _impl_hasAttr(element, name)) as ElementFn<
    HTMLElement,
    boolean
  >;
}

// FORM VALUES

// Internal implementations for value function
function _impl_value_set(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  val: string,
): void {
  element.value = val;
}

function _impl_value_get(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): string {
  return element.value || "";
}

// FORM VALUES
// Generator overloads first
export function value<
  El extends
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement = HTMLInputElement,
>(value: string): ElementFn<El>;
export function value<
  El extends
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement = HTMLInputElement,
>(): ElementFn<El, string>;
// Direct element overloads
export function value(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
): void;
export function value(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
): string;
// Selector overloads last
export function value(selector: string, value: string): void;
export function value(selector: string): string | null;
export function value(...args: any[]): any {
  const detection = detectContext(args, value);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: value(element, val) or value(selector, val)
      const [target, val] = args;

      // Resolve element from target
      let element:
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null = null;
      if (typeof target === "string") {
        element = document.querySelector(target) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement;
        if (!element && args.length === 2) {
          // Setter with selector that doesn't match - just return
          return;
        } else if (!element && args.length === 1) {
          // Getter with selector that doesn't match
          return null;
        }
      } else if (target instanceof HTMLElement) {
        element = target as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement;
      }

      if (!element) {
        throw new Error(`Invalid target for value function`);
      }

      // Setter or getter?
      if (args.length === 2) {
        _impl_value_set(element, val);
        return;
      } else {
        return _impl_value_get(element);
      }
    }

    case ApiContext.SYNC_GENERATOR:
    case ApiContext.ASYNC_GENERATOR: {
      // Generator mode: yield value(val) or const val = yield value()
      const [val] = args;
      if (val === undefined) {
        // Getter mode
        return ((
          element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
        ) => _impl_value_get(element)) as ElementFn<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
          string
        >;
      } else {
        // Setter mode
        return ((
          element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
        ) => {
          _impl_value_set(element, val);
        }) as ElementFn<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
          void
        >;
      }
    }

    default: {
      // Fallback to original logic for unknown context
      if (args.length === 2 && isElementLike(args[0])) {
        const [elementLike, val] = args;
        const element = resolveElement(elementLike) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement;
        if (element) {
          _impl_value_set(element, val);
        }
        return;
      }

      if (args.length === 1 && args[0] instanceof HTMLElement) {
        const [element] = args;
        return _impl_value_get(
          element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
        );
      }

      if (
        args.length === 1 &&
        typeof args[0] === "string" &&
        _looksLikeSelector(args[0])
      ) {
        const [selector] = args;
        const element = resolveElement(selector) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement;
        return element ? _impl_value_get(element) : null;
      }

      // Generator mode
      if (args.length <= 1) {
        const [val] = args;
        if (val === undefined) {
          return ((
            element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
          ) => _impl_value_get(element)) as ElementFn<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
            string
          >;
        } else {
          return ((
            element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
          ) => _impl_value_set(element, val)) as ElementFn<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
            void
          >;
        }
      }

      throw new Error("Invalid arguments for value function");
    }
  }
}

// Internal implementations for checked function
function _impl_checked_set(element: Element, val: boolean): void {
  if (element instanceof HTMLInputElement) {
    element.checked = val;
  }
}

function _impl_checked_get(element: Element): boolean {
  if (element instanceof HTMLInputElement) {
    return element.checked;
  }
  return false;
}

// Generator overloads first
export function checked<El extends HTMLInputElement = HTMLInputElement>(
  val: boolean,
): ElementFn<El>;
export function checked<
  El extends HTMLInputElement = HTMLInputElement,
>(): ElementFn<El, boolean>;
// Direct element overloads
export function checked(element: HTMLInputElement, val: boolean): void;
export function checked(element: HTMLInputElement): boolean;
// Selector overloads last
export function checked(selector: string, val: boolean): void;
export function checked(selector: string): boolean;
export function checked(...args: any[]): any {
  const detection = detectContext(args, checked);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: checked(element, val) or checked(selector, val)
      const [target, val] = args;

      // Resolve element from target
      let element: HTMLInputElement | null = null;
      if (typeof target === "string") {
        element = document.querySelector(target) as HTMLInputElement;
        if (!element && args.length === 2) {
          // Setter with selector that doesn't match - just return
          return;
        } else if (!element && args.length === 1) {
          // Getter with selector that doesn't match
          return false;
        }
      } else if (target instanceof HTMLElement) {
        element = target as HTMLInputElement;
      }

      if (!element) {
        throw new Error(`Invalid target for checked function`);
      }

      // Setter or getter?
      if (args.length === 2) {
        _impl_checked_set(element, val);
        return;
      } else {
        return _impl_checked_get(element);
      }
    }

    case ApiContext.SYNC_GENERATOR:
    case ApiContext.ASYNC_GENERATOR: {
      // Generator mode: yield checked(val) or const val = yield checked()
      const [val] = args;
      if (val === undefined) {
        // Getter mode
        return ((element: Element) => _impl_checked_get(element)) as ElementFn<
          Element,
          boolean
        >;
      } else {
        // Setter mode
        return ((element: Element) => {
          _impl_checked_set(element, val);
        }) as ElementFn<Element, void>;
      }
    }

    default: {
      // Fallback to original logic for unknown context
      if (args.length === 2 && isElementLike(args[0])) {
        const [elementLike, val] = args;
        const element = resolveElement(elementLike) as HTMLInputElement;
        if (element) {
          _impl_checked_set(element, val);
        }
        return;
      }

      if (args.length === 1 && args[0] instanceof HTMLElement) {
        const [element] = args;
        return _impl_checked_get(element as HTMLInputElement);
      }

      if (
        args.length === 1 &&
        typeof args[0] === "string" &&
        _looksLikeSelector(args[0])
      ) {
        const [selector] = args;
        const element = resolveElement(selector) as HTMLInputElement;
        return element ? _impl_checked_get(element) : false;
      }

      // Generator mode
      if (args.length <= 1) {
        const [chk] = args;
        if (chk === undefined) {
          return ((element: Element) =>
            _impl_checked_get(element)) as ElementFn<Element, boolean>;
        } else {
          return ((element: Element) =>
            _impl_checked_set(element, chk)) as ElementFn<Element, void>;
        }
      }

      throw new Error("Invalid arguments for checked function");
    }
  }
}

// Internal implementations for focus function
function _impl_focus(element: HTMLElement): void {
  element.focus();
}

// Internal implementations for blur function
function _impl_blur(element: HTMLElement): void {
  element.blur();
}

// FOCUS MANAGEMENT
// Generator overload first
export function focus<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
// Direct element overload
export function focus<El extends HTMLElement>(element: El): void;
export function focus(...args: any[]): any {
  if (args.length === 1 && isElementLike(args[0])) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_focus(element);
    }
    return;
  }

  if (args.length === 1 && args[0] instanceof HTMLElement) {
    _impl_focus(args[0]);
    return;
  }

  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0])
  ) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_focus(element);
    }
    return;
  }

  // Generator mode
  return ((element: HTMLElement) => _impl_focus(element)) as ElementFn<
    HTMLElement,
    void
  >;
}

// Generator overload first
export function blur<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
// Direct element overload
export function blur<El extends HTMLElement>(element: El): void;
export function blur(...args: any[]): any {
  if (args.length === 1 && isElementLike(args[0])) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_blur(element);
    }
    return;
  }

  if (args.length === 1 && args[0] instanceof HTMLElement) {
    _impl_blur(args[0]);
    return;
  }

  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0])
  ) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_blur(element);
    }
    return;
  }

  // Generator mode
  return ((element: HTMLElement) => _impl_blur(element)) as ElementFn<
    HTMLElement,
    void
  >;
}

// Internal implementations for show function
function _impl_show(element: HTMLElement): void {
  const display = element.dataset.originalDisplay ?? "";
  element.style.display = display;
  delete element.dataset.originalDisplay;
}

// Internal implementations for hide function
function _impl_hide(element: HTMLElement): void {
  if (element.style.display !== "none") {
    element.dataset.originalDisplay = element.style.display;
    element.style.display = "none";
  }
}

// VISIBILITY
// Generator overload first
export function show<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
// Direct element overload
export function show<El extends HTMLElement>(element: El): void;
export function show(...args: any[]): any {
  if (args.length === 1 && isElementLike(args[0])) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_show(element);
    }
    return;
  }

  if (args.length === 1 && args[0] instanceof HTMLElement) {
    _impl_show(args[0]);
    return;
  }

  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0])
  ) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_show(element);
    }
    return;
  }

  // Generator mode
  return ((element: HTMLElement) => _impl_show(element)) as ElementFn<
    HTMLElement,
    void
  >;
}

// Generator overload first
export function hide<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
// Direct element overload
export function hide<El extends HTMLElement>(element: El): void;
export function hide(...args: any[]): any {
  if (args.length === 1 && isElementLike(args[0])) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_hide(element);
    }
    return;
  }

  if (args.length === 1 && args[0] instanceof HTMLElement) {
    _impl_hide(args[0]);
    return;
  }

  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    _looksLikeSelector(args[0])
  ) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_hide(element);
    }
    return;
  }

  // Generator mode
  return ((element: HTMLElement) => _impl_hide(element)) as ElementFn<
    HTMLElement,
    void
  >;
}

// Internal implementations for query function
function _impl_query<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector: string,
): T | null {
  return element.querySelector(selector) as T | null;
}

// Internal implementations for queryAll function
function _impl_queryAll<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector: string,
): T[] {
  return Array.from(element.querySelectorAll(selector)) as T[];
}

// DOM TRAVERSAL
// Generator overload first
export function query<T extends HTMLElement = HTMLElement>(
  selector: string,
): ElementFn<HTMLElement, T | null>;
// Direct element overload
export function query<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector: string,
): T | null;
export function query(...args: any[]): any {
  const detection = detectContext(args, query);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: query(element, selector) or query(parentSelector, childSelector)
      if (args.length === 2) {
        const [target, selector] = args;

        // Resolve element from target
        let element: HTMLElement | null = null;
        if (typeof target === "string") {
          element = document.querySelector(target) as HTMLElement;
          if (!element) {
            return null; // Parent selector didn't match
          }
        } else if (target instanceof HTMLElement) {
          element = target;
        }

        if (element) {
          return _impl_query(element, selector);
        }
      }
      return null;
    }

    case ApiContext.SYNC_GENERATOR: {
      // Sync generator mode: execute immediately and return result
      const [selector] = args;
      const element = getCurrentElement();
      if (!element) {
        throw new Error("No element in context for query");
      }
      return _impl_query(element, selector);
    }

    case ApiContext.ASYNC_GENERATOR: {
      // Async generator mode: return ElementFn
      const [selector] = args;
      return ((element: HTMLElement) =>
        _impl_query(element, selector)) as ElementFn<
        HTMLElement,
        HTMLElement | null
      >;
    }

    default: {
      // Fallback to original logic
      if (args.length === 2 && isElementLike(args[0])) {
        const [elementLike, selector] = args;
        const element = resolveElement(elementLike);
        return element ? _impl_query(element, selector) : null;
      }

      if (args.length === 2 && args[0] instanceof HTMLElement) {
        const [element, selector] = args;
        return _impl_query(element, selector);
      }

      if (
        args.length === 2 &&
        typeof args[0] === "string" &&
        _looksLikeSelector(args[0])
      ) {
        const [parentSelector, childSelector] = args;
        const element = resolveElement(parentSelector);
        return element ? _impl_query(element, childSelector) : null;
      }

      // Generator mode
      const [selector] = args;
      return ((element: HTMLElement) =>
        _impl_query(element, selector)) as ElementFn<
        HTMLElement,
        HTMLElement | null
      >;
    }
  }
}

// Generator overload first
export function queryAll<T extends HTMLElement = HTMLElement>(
  selector: string,
): ElementFn<HTMLElement, T[]>;
// Direct element overload
export function queryAll<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector: string,
): T[];
export function queryAll(...args: any[]): any {
  const detection = detectContext(args, queryAll);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: queryAll(element, selector) or queryAll(parentSelector, childSelector)
      if (args.length === 2) {
        const [target, selector] = args;

        // Resolve element from target
        let element: HTMLElement | null = null;
        if (typeof target === "string") {
          element = document.querySelector(target) as HTMLElement;
          if (!element) {
            return []; // Parent selector didn't match
          }
        } else if (target instanceof HTMLElement) {
          element = target;
        }

        if (element) {
          return _impl_queryAll(element, selector);
        }
      }
      return [];
    }

    case ApiContext.SYNC_GENERATOR: {
      // Sync generator mode: execute immediately and return result
      const [selector] = args;
      const element = getCurrentElement();
      if (!element) {
        throw new Error("No element in context for queryAll");
      }
      return _impl_queryAll(element, selector);
    }

    case ApiContext.ASYNC_GENERATOR: {
      // Async generator mode: return ElementFn
      const [selector] = args;
      return ((element: HTMLElement) =>
        _impl_queryAll(element, selector)) as ElementFn<
        HTMLElement,
        HTMLElement[]
      >;
    }

    default: {
      // Fallback to original logic
      if (args.length === 2 && isElementLike(args[0])) {
        const [elementLike, selector] = args;
        const element = resolveElement(elementLike);
        return element ? _impl_queryAll(element, selector) : [];
      }

      if (args.length === 2 && args[0] instanceof HTMLElement) {
        const [element, selector] = args;
        return _impl_queryAll(element, selector);
      }

      if (
        args.length === 2 &&
        typeof args[0] === "string" &&
        _looksLikeSelector(args[0])
      ) {
        const [parentSelector, childSelector] = args;
        const element = resolveElement(parentSelector);
        return element ? _impl_queryAll(element, childSelector) : [];
      }

      // Generator mode
      const [selector] = args;
      return ((element: HTMLElement) =>
        _impl_queryAll(element, selector)) as ElementFn<
        HTMLElement,
        HTMLElement[]
      >;
    }
  }
}

// Internal implementations for DOM functions
function _impl_parent<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string,
): T | null {
  return selector
    ? element.closest<T>(selector)
    : (element.parentElement as T | null);
}

function _impl_children<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string,
): T[] {
  const children = Array.from(element.children) as T[];
  return selector
    ? children.filter((child) => child.matches(selector))
    : children;
}

function _impl_siblings<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string,
): T[] {
  if (!element.parentElement) return [];
  const siblings = Array.from(element.parentElement.children).filter(
    (child) => child !== element,
  ) as T[];
  return selector
    ? siblings.filter((sibling) => sibling.matches(selector))
    : siblings;
}

// Predicate to check if first argument is an element
function _isDirectCall(args: any[]): boolean {
  return args.length > 0 && isElementLike(args[0]);
}

// Generator overload first
export function parent<T extends HTMLElement = HTMLElement>(
  selector?: string,
): ElementFn<HTMLElement, T | null>;
// Direct element overload
export function parent<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string,
): T | null;
export function parent<T extends HTMLElement = HTMLElement>(
  ...args: any[]
): any {
  const detection = detectContext(args, parent);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: parent(element, selector?)
      const [target, selector] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element) {
          return null;
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (element) {
        return _impl_parent(element, selector) as T | null;
      }
      return null;
    }

    case ApiContext.SYNC_GENERATOR: {
      // Sync generator mode: execute immediately and return result
      const [selector] = args;
      const element = getCurrentElement();
      if (!element) {
        throw new Error("No element in context for parent");
      }
      return _impl_parent(element, selector);
    }

    case ApiContext.ASYNC_GENERATOR: {
      // Async generator mode: return ElementFn
      const [selector] = args;
      return ((element: HTMLElement) =>
        _impl_parent(element, selector)) as ElementFn<HTMLElement, T | null>;
    }

    default: {
      // Fallback to original logic
      if (_isDirectCall(args)) {
        const [element, selector] = args;
        const resolved = resolveElement(element);
        return resolved ? (_impl_parent(resolved, selector) as T | null) : null;
      }
      const [selector] = args;
      return ((element: HTMLElement) =>
        _impl_parent(element, selector)) as ElementFn<HTMLElement, T | null>;
    }
  }
}

// Generator overload first
export function children<T extends HTMLElement = HTMLElement>(
  selector?: string,
): ElementFn<HTMLElement, T[]>;
// Direct element overload
export function children<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string,
): T[];
export function children<T extends HTMLElement = HTMLElement>(
  ...args: any[]
): any {
  const detection = detectContext(args, children);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: children(element, selector?)
      const [target, selector] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element) {
          return [];
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (element) {
        return _impl_children(element, selector) as T[];
      }
      return [];
    }

    case ApiContext.SYNC_GENERATOR: {
      // Sync generator mode: execute immediately and return result
      const [selector] = args;
      const element = getCurrentElement();
      if (!element) {
        throw new Error("No element in context for children");
      }
      return _impl_children(element, selector);
    }

    case ApiContext.ASYNC_GENERATOR: {
      // Async generator mode: return ElementFn
      const [selector] = args;
      return ((element: HTMLElement) =>
        _impl_children(element, selector)) as ElementFn<HTMLElement, T[]>;
    }

    default: {
      // Fallback to original logic
      if (_isDirectCall(args)) {
        const [element, selector] = args;
        const resolved = resolveElement(element);
        return resolved ? (_impl_children(resolved, selector) as T[]) : [];
      }
      const [selector] = args;
      return ((element: HTMLElement) =>
        _impl_children(element, selector)) as ElementFn<HTMLElement, T[]>;
    }
  }
}

// Generator overload first
export function siblings<T extends HTMLElement = HTMLElement>(
  selector?: string,
): ElementFn<HTMLElement, T[]>;
// Direct element overload
export function siblings<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string,
): T[];
export function siblings<T extends HTMLElement = HTMLElement>(
  ...args: any[]
): any {
  const detection = detectContext(args, siblings);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: siblings(element, selector?)
      const [target, selector] = args;

      // Resolve element from target
      let element: HTMLElement | null = null;
      if (typeof target === "string") {
        element = document.querySelector(target) as HTMLElement;
        if (!element) {
          return [];
        }
      } else if (target instanceof HTMLElement) {
        element = target;
      }

      if (!element) {
        throw new Error("No element in context for siblings");
      }
      return _impl_siblings(element, selector) as T[];
    }

    case ApiContext.SYNC_GENERATOR: {
      // Sync generator mode: execute immediately and return result
      const [selector] = args;
      const element = getCurrentElement();
      if (!element) {
        throw new Error("No element in context for siblings");
      }
      return _impl_siblings(element, selector) as T[];
    }

    default:
      return [];
  }
}

// ============================================================================
// CHILD WATCHER FUNCTIONALITY
// ============================================================================

/**
 * Creates a child watcher that applies a generator behavior to matching child elements.
 *
 * This function sets up a MutationObserver to watch for child elements matching
 * the given selector and applies the generator behavior to each matching element.
 * It returns a Map containing the APIs returned by each child's generator.
 *
 * @param selector - CSS selector for child elements to watch
 * @param generator - Generator function to apply to each matching child
 * @returns Map of child elements to their returned APIs
 *
 * @example
 * ```typescript
 * watch('.container', function* () {
 *   const childApis = yield createChildWatcher('.item', function* () {
 *     yield addClass('item-enhanced');
 *     return {
 *       highlight: () => addClass('highlighted'),
 *       getId: () => self().id
 *     };
 *   });
 *
 *   // Access child APIs
 *   childApis.forEach((api, element) => {
 *     console.log('Child ID:', api.getId());
 *   });
 * });
 * ```
 */
export function createChildWatcher<
  S extends string,
  ChildEl extends HTMLElement = ElementFromSelector<S>,
  T = any,
>(
  selector: S,
  generator: (
    ctx: TypedGeneratorContext<ChildEl>,
  ) => Generator<any, T, unknown> | AsyncGenerator<any, T, unknown>,
): ElementFn<HTMLElement, Map<ChildEl, T>>;
export function createChildWatcher<
  S extends string,
  ChildEl extends HTMLElement = ElementFromSelector<S>,
  T = any,
>(
  element: HTMLElement,
  selector: S,
  generator: (
    ctx: TypedGeneratorContext<ChildEl>,
  ) => Generator<any, T, unknown> | AsyncGenerator<any, T, unknown>,
): Map<ChildEl, T>;
export function createChildWatcher<
  S extends string,
  ChildEl extends HTMLElement = ElementFromSelector<S>,
  T = any,
>(
  selector: S,
  generator: (
    ctx: TypedGeneratorContext<ChildEl>,
  ) => Generator<any, T, unknown> | AsyncGenerator<any, T, unknown>,
  ctx: TypedGeneratorContext<any>,
): Map<ChildEl, T>;
export function createChildWatcher<T = any>(...args: any[]): any {
  // Direct usage with element
  if (args[0] instanceof HTMLElement) {
    const [element, selector, generator] = args;
    return _impl_createChildWatcher_v2(element, selector, generator);
  }

  // Check if called with context (3 args, last is context)
  if (args.length === 3 && typeof args[2] === "object" && args[2].element) {
    const [selector, generator, ctx] = args;
    const context = ctx as TypedGeneratorContext<any>;
    const parentElement = context.element;

    // Get or create ChildWatcherManager
    const managerKey = "__childWatcherManager";
    let manager = getState(managerKey);
    if (!manager) {
      manager = new ChildWatcherManager(parentElement);
      setState(managerKey, manager);
    }

    return manager.register(selector, generator);
  }

  // Check if we're in a generator context (called with 2 args from within a generator)
  const currentContext = getCurrentContext();
  if (currentContext && args.length === 2) {
    const [selector, generator] = args;
    const parentElement = currentContext.element;

    // Get or create ChildWatcherManager
    const managerKey = "__childWatcherManager";
    let manager = getState(managerKey);
    if (!manager) {
      manager = new ChildWatcherManager(parentElement);
      setState(managerKey, manager);
    }

    return manager.register(selector, generator);
  }

  // Generator context usage (ElementFn pattern) - when not in active context
  const [selector, generator] = args;
  return (element: HTMLElement) => {
    // Get or create ChildWatcherManager
    const managerKey = "__childWatcherManager";
    // Need to push a context for state to work
    const tempContext = {
      element,
      selector: "",
      index: 0,
      array: [element],
    };
    // Import is already available at top of file
    pushContext(tempContext);

    try {
      let manager = getState(managerKey);
      if (!manager) {
        manager = new ChildWatcherManager(element);
        setState(managerKey, manager);
      }
      return manager.register(selector, generator);
    } finally {
      popContext();
    }
  };
}

// Legacy internal implementation (kept for backward compatibility)
function _impl_createChildWatcher<T = any>(
  element: HTMLElement,
  selector: string,
  generator: () => Generator<any, T, unknown>,
): Map<HTMLElement, T> {
  const childApis = new Map<HTMLElement, T>();
  const processedChildren = new WeakSet<HTMLElement>();

  // Process existing children
  const processChild = (child: Element) => {
    if (
      child.matches(selector) &&
      !processedChildren.has(child as HTMLElement)
    ) {
      processedChildren.add(child as HTMLElement);

      // Execute generator on child
      const runGenerator = async () => {
        const { executeGenerator } = await import("../core/context");
        const { registerParentContext, unregisterParentContext } = await import(
          "../core/context"
        );

        // Register parent-child relationship
        registerParentContext(child as HTMLElement, element);

        try {
          const api = await executeGenerator(
            child as HTMLElement,
            selector,
            0,
            [child as HTMLElement],
            generator,
          );

          if (api !== undefined) {
            childApis.set(child as HTMLElement, api);
          }
        } catch (error) {
          console.error("Error executing child generator:", error);
        }
      };

      runGenerator();
    }
  };

  // Process all existing matching children
  element.querySelectorAll(selector).forEach(processChild);

  // Set up observer for new children
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check added nodes
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const elem = node as Element;
          if (elem.matches(selector)) {
            processChild(elem);
          }
          // Also check descendants
          elem.querySelectorAll(selector).forEach(processChild);
        }
      });

      // Clean up removed nodes
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const elem = node as Element;
          if (childApis.has(elem as HTMLElement)) {
            childApis.delete(elem as HTMLElement);
            // Unregister parent context
            // Cleanup parent context if needed
            // unregisterParentContext is imported but not used here
          }
        }
      });
    });
  });

  observer.observe(element, {
    childList: true,
    subtree: true,
  });

  // Store observer for cleanup
  const {
    getCurrentContext,
    createCleanupFunction,
  } = require("../core/context");
  const context = getCurrentContext();
  if (context) {
    createCleanupFunction(element)(() => observer.disconnect());
  }

  return childApis;
}

// New implementation that uses ChildWatcherManager
function _impl_createChildWatcher_v2<
  S extends string,
  ChildEl extends HTMLElement = ElementFromSelector<S>,
  T = any,
>(
  element: HTMLElement,
  selector: S,
  generator: (
    ctx: TypedGeneratorContext<ChildEl>,
  ) => Generator<any, T, unknown> | AsyncGenerator<any, T, unknown>,
): Map<ChildEl, T> {
  // Get or create ChildWatcherManager for this element
  const managerKey = "__childWatcherManager";

  // We need to get state in the context of the parent element
  const currentContext = getCurrentContext();
  if (!currentContext) {
    // Fallback to legacy implementation if no context
    return _impl_createChildWatcher(element, selector, generator as any) as Map<
      ChildEl,
      T
    >;
  }

  // Get or create manager from parent element's state
  let manager = getState(managerKey);
  if (!manager) {
    manager = new ChildWatcherManager(element);
    setState(managerKey, manager);
  }

  return manager.register(selector, generator as any) as Map<ChildEl, T>;
}

/**
 * Shorthand for createChildWatcher - creates a child watcher with a more concise syntax.
 *
 * @param selector - CSS selector for child elements
 * @param generator - Generator function to apply to each child
 * @returns Map of child elements to their APIs
 *
 * @example
 * ```typescript
 * watch('.list', function* () {
 *   const items = yield child('.item', function* () {
 *     yield addClass('item-ready');
 *     return { id: self().dataset.id };
 *   });
 * });
 * ```
 */
export function child<
  S extends string,
  ChildEl extends HTMLElement = ElementFromSelector<S>,
  T = any,
>(
  selector: S,
  generator: (
    ctx: TypedGeneratorContext<ChildEl>,
  ) => Generator<any, T, unknown> | AsyncGenerator<any, T, unknown>,
): ElementFn<HTMLElement, Map<ChildEl, T>>;
export function child<
  S extends string,
  ChildEl extends HTMLElement = ElementFromSelector<S>,
  T = any,
>(
  element: HTMLElement,
  selector: S,
  generator: (
    ctx: TypedGeneratorContext<ChildEl>,
  ) => Generator<any, T, unknown> | AsyncGenerator<any, T, unknown>,
): Map<ChildEl, T>;
export function child<
  S extends string,
  ChildEl extends HTMLElement = ElementFromSelector<S>,
  T = any,
>(
  selector: S,
  generator: (
    ctx: TypedGeneratorContext<ChildEl>,
  ) => Generator<any, T, unknown> | AsyncGenerator<any, T, unknown>,
  ctx: TypedGeneratorContext<any>,
): Map<ChildEl, T>;
export function child<T = any>(...args: any[]): any {
  // Special handling for child function to ensure it returns the Map directly in generator context
  const currentContext = getCurrentContext();
  if (currentContext && args.length === 2) {
    // We're in a generator context, call createChildWatcher which will return the Map directly
    return createChildWatcher(args[0], args[1]);
  }
  // Handle different argument patterns
  if (args.length === 3) {
    return createChildWatcher(args[0], args[1], args[2]);
  } else if (args.length === 2) {
    return createChildWatcher(args[0], args[1]);
  }
  throw new Error("Invalid arguments for child function");
}

// Internal implementations for batchAll function
function _impl_batchAll(
  elements: (HTMLElement | string)[],
  operations: ElementFn<HTMLElement>[],
): void {
  elements.forEach((elementLike) => {
    const element = resolveElement(elementLike);
    if (element) {
      operations.forEach((op) => op(element));
    }
  });
}

// BATCH OPERATIONS
export function batchAll(
  elements: (HTMLElement | string)[],
  operations: ElementFn<HTMLElement>[],
): void;
export function batchAll(
  elements: (HTMLElement | string)[],
  operations: ElementFn<HTMLElement>[],
): ElementFn<HTMLElement, void>;
export function batchAll(...args: any[]): any {
  const detection = detectContext(args, batchAll);

  // Handle based on detected context
  switch (detection.context) {
    case ApiContext.DIRECT:
    case ApiContext.SELECTOR: {
      // Direct mode: execute immediately
      const [elements, operations] = args;
      _impl_batchAll(elements as HTMLElement[], operations);
      return;
    }

    case ApiContext.SYNC_GENERATOR:
    case ApiContext.ASYNC_GENERATOR: {
      // Generator mode: check if we have actual elements or selectors
      const [elements, operations] = args;

      // Check if all elements are actual HTMLElements (not selectors)
      const hasActualElements = elements.every(
        (el: any) => el instanceof HTMLElement,
      );

      if (hasActualElements) {
        // We have actual elements, execute immediately
        _impl_batchAll(elements, operations);
        return;
      }

      // We have selectors or mixed, return ElementFn to be yielded
      return (element: HTMLElement) => {
        // In generator context, we might have the elements already
        // or we might need to resolve them relative to the current element
        const resolvedElements = elements
          .map((el: HTMLElement | string) => {
            if (typeof el === "string") {
              // It's a selector, resolve relative to current element
              return element.querySelector(el) as HTMLElement;
            }
            return el;
          })
          .filter(Boolean);

        _impl_batchAll(resolvedElements, operations);
      };
    }

    default: {
      // Fallback to direct execution
      const [elements, operations] = args;
      _impl_batchAll(elements, operations);
      return;
    }
  }
}

// Aliases
export const el = query;
export const all = queryAll;

// Parent-Child Composition
interface WatchedSelectorInfo<
  ChildEl extends HTMLElement = HTMLElement,
  ChildGen extends GeneratorFunction<ChildEl, any> = GeneratorFunction<
    ChildEl,
    any
  >,
> {
  generator: ChildGen;
  contexts: Map<ChildEl, Awaited<ReturnType<ChildGen>>>;
  setupFn: (el: ChildEl) => void;
  teardownFn: (el: ChildEl) => void;
}

class ChildWatcherManager {
  private parentElement: HTMLElement;
  private observer: MutationObserver;
  private watchedSelectors: Map<string, WatchedSelectorInfo<any, any>> =
    new Map();

  constructor(parentElement: HTMLElement) {
    this.parentElement = parentElement;
    this.handleMutations = this.handleMutations.bind(this);
    this.observer = new MutationObserver(this.handleMutations);
    this.observer.observe(this.parentElement, {
      childList: true,
      subtree: true,
    });
    cleanup(() => this.destroy());
  }

  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          this.processNode(node, "setup");
        }
      }
      for (const node of Array.from(mutation.removedNodes)) {
        if (node instanceof HTMLElement) {
          this.processNode(node, "teardown");
        }
      }
    }
  }

  private processNode(node: HTMLElement, action: "setup" | "teardown"): void {
    this.watchedSelectors.forEach(({ setupFn, teardownFn }, selector) => {
      const fn = action === "setup" ? setupFn : teardownFn;
      if (node.matches(selector)) {
        fn(node);
      }
      node
        .querySelectorAll(selector)
        .forEach((child) => fn(child as HTMLElement));
    });
  }

  public register<
    S extends string,
    ChildEl extends HTMLElement,
    ChildGen extends GeneratorFunction<ChildEl, any>,
  >(
    childSelector: S,
    childGenerator: ChildGen,
  ): Map<ChildEl, Awaited<ReturnType<ChildGen>>> {
    const existingWatcher = this.watchedSelectors.get(childSelector);
    if (existingWatcher) return existingWatcher.contexts;

    const childContexts = new Map<ChildEl, Awaited<ReturnType<ChildGen>>>();
    const setupChild = (element: ChildEl) => {
      if (childContexts.has(element)) return;
      registerParentContext(element, this.parentElement);
      // Execute the generator with proper context
      // executeGenerator is already imported at top of file
      executeGenerator(
        element,
        childSelector,
        0,
        [element],
        childGenerator as any,
      )
        .then((api) => {
          if (api !== undefined) childContexts.set(element, api);
        })
        .catch((error) =>
          console.error(
            `Error in child generator for selector "${childSelector}":`,
            error,
          ),
        );
    };
    const teardownChild = (element: ChildEl) => {
      if (!childContexts.has(element)) return;
      unregisterParentContext(element);
      executeElementCleanup(element);
      childContexts.delete(element);
    };

    this.watchedSelectors.set(childSelector, {
      generator: childGenerator,
      contexts: childContexts,
      setupFn: setupChild,
      teardownFn: teardownChild,
    });
    this.parentElement
      .querySelectorAll<ChildEl>(childSelector)
      .forEach(setupChild);
    return childContexts;
  }

  public destroy(): void {
    this.observer.disconnect();
    this.watchedSelectors.forEach(({ teardownFn, contexts }) => {
      for (const childEl of contexts.keys()) {
        teardownFn(childEl);
      }
    });
    this.watchedSelectors.clear();
  }
}

interface YieldableMap<K, V> extends Map<K, V> {
  then(resolve: (value: Map<K, V>) => void): void;
}
