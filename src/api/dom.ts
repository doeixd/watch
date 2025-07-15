// Comprehensive DOM manipulation functions with dual API support

import type {
  ElementFn,
  ElementFromSelector,
  GeneratorFunction,
  TypedGeneratorContext,
} from '../types';
import { runOn } from '../watch';
import { cleanup, executeElementCleanup } from '../core/generator';
import { getCurrentContext, registerParentContext, unregisterParentContext } from '../core/context';
import { getState, setState } from '../core/state';

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
 * @example
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
 * processElement(123); // Invalid
 * ```
 */
export function isElementLike(value: any): value is HTMLElement | string {
  return typeof value === 'string' || value instanceof HTMLElement;
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
 * @example
 * ```typescript
 * import { resolveElement } from 'watch-selector';
 * 
 * // Direct element reference
 * const button = document.getElementById('my-button');
 * const resolved1 = resolveElement(button); // Returns the button element
 * 
 * // CSS selector
 * const resolved2 = resolveElement('#my-button'); // Finds and returns the element
 * const resolved3 = resolveElement('.not-found'); // Returns null
 * 
 * // Safe usage pattern
 * function safeClick(target: HTMLElement | string) {
 *   const element = resolveElement(target);
 *   if (element) {
 *     element.click();
 *   }
 * }
 * ```
 */
export function resolveElement(elementLike: HTMLElement | string): HTMLElement | null {
  if (typeof elementLike === 'string') {
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
  return element.textContent ?? '';
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
  return args.length === 1 && typeof args[0] === 'string' && _looksLikeSelector(args[0]);
}

function _is_text_generator(args: any[]): boolean {
  // Everything else is generator mode
  return args.length <= 1 && !args[0]?.instanceof?.(HTMLElement) && (args.length === 0 || !_looksLikeSelector(args[0]));
}

function _looksLikeSelector(str: string): boolean {
  if (typeof str !== 'string') return false;
  
  // If it looks like HTML (contains < or starts with <), it's not a selector
  if (str.includes('<') || str.startsWith('<')) {
    return false;
  }
  
  // Common selector patterns
  return str.includes('.') || str.includes('#') || str.includes('[') || 
         str.includes(':') || str.includes('>') || str.includes('+') || 
         str.includes('~') || str.includes('*') || /^[a-zA-Z][a-zA-Z0-9]*$/.test(str);
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
export function text(element: HTMLElement, content: string): void;
export function text(element: HTMLElement): string;
export function text(selector: string, content: string): void;
export function text(selector: string): string | null;
export function text<El extends HTMLElement = HTMLElement>(content: string): ElementFn<El>;
export function text<El extends HTMLElement = HTMLElement>(): ElementFn<El, string>;
export function text(...args: any[]): any {
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
  
  if (_is_text_generator(args)) {
    const [content] = args;
    if (content === undefined) {
      return (element: HTMLElement) => _impl_text_get(element);
    } else {
      return (element: HTMLElement) => _impl_text_set(element, content);
    }
  }
  
  return (element: HTMLElement) => _impl_text_get(element);
}

// Internal implementations for html function
function _impl_html_set(element: HTMLElement, content: string): void {
  element.innerHTML = String(content);
}

function _impl_html_get(element: HTMLElement): string {
  return element.innerHTML;
}

// HTML CONTENT
export function html(element: HTMLElement, content: string): void;
export function html(element: HTMLElement): string;
export function html(selector: string, content: string): void;
export function html(selector: string): string | null;
export function html<El extends HTMLElement = HTMLElement>(content: string): ElementFn<El>;
export function html<El extends HTMLElement = HTMLElement>(): ElementFn<El, string>;
export function html(...args: any[]): any {
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
  
  if (args.length === 1 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const [selector] = args;
    const element = resolveElement(selector);
    return element ? _impl_html_get(element) : null;
  }
  
  if (args.length <= 1) {
    const [content] = args;
    if (content === undefined) {
      return (element: HTMLElement) => _impl_html_get(element);
    } else {
      return (element: HTMLElement) => _impl_html_set(element, content);
    }
  }
  
  return (element: HTMLElement) => _impl_html_get(element);
}

// Internal implementations for addClass function
function _impl_addClass(element: HTMLElement, ...classNames: string[]): void {
  const splitClassNames = classNames.flatMap(name => name.split(/\s+/).filter(Boolean));
  element.classList.add(...splitClassNames);
}

// CLASS MANIPULATION
export function addClass(element: HTMLElement, ...classNames: string[]): void;
export function addClass(selector: string, ...classNames: string[]): void;
export function addClass<El extends HTMLElement = HTMLElement>(...classNames: string[]): ElementFn<El>;
export function addClass(...args: any[]): any {
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
  
  if (args.length >= 1 && typeof args[0] === 'string' && args.length >= 2 && _looksLikeSelector(args[0])) {
    const [selector, ...classNames] = args;
    const element = resolveElement(selector);
    if (element) {
      _impl_addClass(element, ...classNames);
    }
    return;
  }
  
  // Generator mode
  const allClassNames = args;
  return (element: HTMLElement) => {
    _impl_addClass(element, ...allClassNames);
  };
}

// Internal implementations for removeClass function
function _impl_removeClass(element: HTMLElement, ...classNames: string[]): void {
  const splitClassNames = classNames.flatMap(name => name.split(/\s+/).filter(Boolean));
  element.classList.remove(...splitClassNames);
}

export function removeClass(element: HTMLElement, ...classNames: string[]): void;
export function removeClass(selector: string, ...classNames: string[]): void;
export function removeClass<El extends HTMLElement = HTMLElement>(...classNames: string[]): ElementFn<El>;
export function removeClass(...args: any[]): any {
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
  
  if (args.length >= 1 && typeof args[0] === 'string' && args.length >= 2 && _looksLikeSelector(args[0])) {
    const [selector, ...classNames] = args;
    const element = resolveElement(selector);
    if (element) {
      _impl_removeClass(element, ...classNames);
    }
    return;
  }
  
  // Generator mode
  const allClassNames = args;
  return (element: HTMLElement) => {
    _impl_removeClass(element, ...allClassNames);
  };
}

// Internal implementations for toggleClass function
function _impl_toggleClass(element: HTMLElement, className: string, force?: boolean): boolean {
  return element.classList.toggle(className, force);
}

export function toggleClass(element: HTMLElement, className: string, force?: boolean): boolean;
export function toggleClass(selector: string, className: string, force?: boolean): boolean;
export function toggleClass<El extends HTMLElement = HTMLElement>(className: string, force?: boolean): ElementFn<El, boolean>;
export function toggleClass(...args: any[]): any {
  if (args.length >= 2 && isElementLike(args[0])) {
    const [elementLike, className, force] = args;
    const element = resolveElement(elementLike);
    return element ? _impl_toggleClass(element, className, force) : false;
  }
  
  if (args.length >= 2 && args[0] instanceof HTMLElement) {
    const [element, className, force] = args;
    return _impl_toggleClass(element, className, force);
  }
  
  if (args.length >= 2 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const [selector, className, force] = args;
    const element = resolveElement(selector);
    return element ? _impl_toggleClass(element, className, force) : false;
  }
  
  // Generator mode
  const [className, force] = args;
  return (element: HTMLElement) => _impl_toggleClass(element, className, force);
}

// Internal implementations for hasClass function
function _impl_hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

export function hasClass(element: HTMLElement, className: string): boolean;
export function hasClass(selector: string, className: string): boolean;
export function hasClass<El extends HTMLElement = HTMLElement>(className: string): ElementFn<El, boolean>;
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
  
  if (args.length === 2 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const [selector, className] = args;
    const element = resolveElement(selector);
    return element ? _impl_hasClass(element, className) : false;
  }
  
  // Generator mode
  const [className] = args;
  return (element: HTMLElement) => _impl_hasClass(element, className);
}

// Internal implementations for style function
function _impl_style_set_object(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
  Object.assign(element.style, styles);
}

function _impl_style_set_property(element: HTMLElement, property: string, value: string): void {
  element.style.setProperty(property, value);
}

function _impl_style_get_property(element: HTMLElement, property: string): string {
  return element.style.getPropertyValue(property) || (element.style as any)[property] || '';
}

// Predicates for style function overloads
function _is_style_direct_set_object(args: any[]): boolean {
  return args.length === 2 && isElementLike(args[0]) && typeof args[1] === 'object' && args[1] !== null;
}

function _is_style_direct_set_property(args: any[]): boolean {
  return args.length === 3 && isElementLike(args[0]) && typeof args[1] === 'string' && args[2] !== undefined;
}

function _is_style_direct_get_property(args: any[]): boolean {
  return args.length === 2 && isElementLike(args[0]) && typeof args[1] === 'string';
}

function _is_style_selector_set_object(args: any[]): boolean {
  return args.length === 2 && typeof args[0] === 'string' && _looksLikeSelector(args[0]) && typeof args[1] === 'object' && args[1] !== null;
}

function _is_style_selector_set_property(args: any[]): boolean {
  return args.length === 3 && typeof args[0] === 'string' && _looksLikeSelector(args[0]) && typeof args[1] === 'string' && args[2] !== undefined;
}

function _is_style_selector_get_property(args: any[]): boolean {
  return args.length === 2 && typeof args[0] === 'string' && _looksLikeSelector(args[0]) && typeof args[1] === 'string';
}

function _is_style_generator_object(args: any[]): boolean {
  return args.length === 1 && typeof args[0] === 'object' && args[0] !== null;
}

function _is_style_generator_property(args: any[]): boolean {
  return args.length === 2 && typeof args[0] === 'string' && args[1] !== undefined;
}

// STYLE MANIPULATION
export function style(element: HTMLElement, property: string): string;
export function style(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void;
export function style(element: HTMLElement, property: string, value: string): void;
export function style(selector: string, property: string): string | null;
export function style(selector: string, styles: Partial<CSSStyleDeclaration>): void;
export function style(selector: string, property: string, value: string): void;
export function style<El extends HTMLElement = HTMLElement>(styles: Partial<CSSStyleDeclaration>): ElementFn<El>;
export function style<El extends HTMLElement = HTMLElement>(property: string, value: string): ElementFn<El>;
export function style(...args: any[]): any {
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
    return element ? _impl_style_get_property(element, property) : '';
  }
  
  if (_is_style_selector_set_object(args)) {
    const [selector, styles] = args;
    const element = resolveElement(selector);
    if (element) {
      _impl_style_set_object(element, styles);
    }
    return;
  }
  
  if (_is_style_selector_set_property(args)) {
    const [selector, property, value] = args;
    const element = resolveElement(selector);
    if (element) {
      _impl_style_set_property(element, property, value);
    }
    return;
  }
  
  if (_is_style_selector_get_property(args)) {
    const [selector, property] = args;
    const element = resolveElement(selector);
    return element ? _impl_style_get_property(element, property) : null;
  }
  
  if (_is_style_generator_object(args)) {
    const [styles] = args;
    return (element: HTMLElement) => _impl_style_set_object(element, styles);
  }
  
  if (_is_style_generator_property(args)) {
    const [property, value] = args;
    return (element: HTMLElement) => _impl_style_set_property(element, property, value);
  }
  
  // Fallback for generator mode with single property get
  if (args.length === 1 && typeof args[0] === 'string') {
    const [property] = args;
    return (element: HTMLElement) => _impl_style_get_property(element, property);
  }
  
  return (element: HTMLElement) => _impl_style_get_property(element, '');
}

// Internal implementations for attr function
function _impl_attr_set_object(element: HTMLElement, attrs: Record<string, any>): void {
  Object.entries(attrs).forEach(([key, val]) => {
    element.setAttribute(key, String(val));
  });
}

function _impl_attr_set_property(element: HTMLElement, name: string, value: any): void {
  element.setAttribute(name, String(value));
}

function _impl_attr_get_property(element: HTMLElement, name: string): string | null {
  return element.getAttribute(name);
}

// Internal implementations for prop function
function _impl_prop_set_object(element: HTMLElement, props: Record<string, any>): void {
  Object.entries(props).forEach(([key, val]) => {
    (element as any)[key] = val;
  });
}

function _impl_prop_set_property(element: HTMLElement, name: string, value: any): void {
  (element as any)[name] = value;
}

function _impl_prop_get_property(element: HTMLElement, name: string): any {
  return (element as any)[name];
}

// Internal implementations for data function
function _impl_data_set_object(element: HTMLElement, data: Record<string, any>): void {
  Object.entries(data).forEach(([key, val]) => {
    element.dataset[key] = String(val);
  });
}

function _impl_data_set_property(element: HTMLElement, name: string, value: any): void {
  element.dataset[name] = String(value);
}

function _impl_data_get_property(element: HTMLElement, name: string): string | undefined {
  return element.dataset[name];
}

// Predicates for accessor functions
function _is_accessor_direct_set_object(args: any[]): boolean {
  return args.length === 2 && isElementLike(args[0]) && typeof args[1] === 'object' && args[1] !== null;
}

function _is_accessor_direct_set_property(args: any[]): boolean {
  return args.length === 3 && isElementLike(args[0]) && typeof args[1] === 'string' && args[2] !== undefined;
}

function _is_accessor_direct_get_property(args: any[]): boolean {
  return args.length === 2 && args[0] instanceof HTMLElement && typeof args[1] === 'string';
}

function _is_accessor_selector_set_object(args: any[]): boolean {
  return args.length === 2 && typeof args[0] === 'string' && _looksLikeSelector(args[0]) && typeof args[1] === 'object' && args[1] !== null;
}

function _is_accessor_selector_set_property(args: any[]): boolean {
  return args.length === 3 && typeof args[0] === 'string' && _looksLikeSelector(args[0]) && typeof args[1] === 'string' && args[2] !== undefined;
}

function _is_accessor_selector_get_property(args: any[]): boolean {
  return args.length === 2 && typeof args[0] === 'string' && _looksLikeSelector(args[0]) && typeof args[1] === 'string';
}

function _is_accessor_generator_object(args: any[]): boolean {
  return args.length === 1 && typeof args[0] === 'object' && args[0] !== null;
}

function _is_accessor_generator_property(args: any[]): boolean {
  return args.length === 2 && typeof args[0] === 'string' && args[1] !== undefined;
}

function _is_accessor_generator_get(args: any[]): boolean {
  return args.length === 1 && typeof args[0] === 'string';
}

// ATTRIBUTE & PROPERTY MANIPULATION
function createAccessor(type: 'attr' | 'prop' | 'data') {
  const implSetObject = type === 'attr' ? _impl_attr_set_object : 
                       type === 'prop' ? _impl_prop_set_object : 
                       _impl_data_set_object;
  const implSetProperty = type === 'attr' ? _impl_attr_set_property : 
                         type === 'prop' ? _impl_prop_set_property : 
                         _impl_data_set_property;
  const implGetProperty = type === 'attr' ? _impl_attr_get_property : 
                         type === 'prop' ? _impl_prop_get_property : 
                         _impl_data_get_property;
  
  return function(...args: any[]): any {
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
      return (element: HTMLElement) => implSetObject(element, obj);
    }
    
    if (_is_accessor_generator_property(args)) {
      const [name, value] = args;
      return (element: HTMLElement) => implSetProperty(element, name, value);
    }
    
    if (_is_accessor_generator_get(args)) {
      const [name] = args;
      return (element: HTMLElement) => implGetProperty(element, name);
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
    
    return (element: HTMLElement) => null;
  };
}

export const attr = createAccessor('attr');
export const prop = createAccessor('prop');
export const data = createAccessor('data');

// Internal implementations for removeAttr function
function _impl_removeAttr(element: HTMLElement, names: string[]): void {
  names.flat().forEach(name => element.removeAttribute(name));
}

export function removeAttr(element: HTMLElement, ...names: string[]): void;
export function removeAttr(selector: string, ...names: string[]): void;
export function removeAttr<El extends HTMLElement = HTMLElement>(...names: string[]): ElementFn<El>;
export function removeAttr(...args: any[]): any {
  if (isElementLike(args[0])) {
    const [elementLike, ...names] = args;
    const element = resolveElement(elementLike);
    if (element) {
      _impl_removeAttr(element, names);
    }
    return;
  }
  
  if (args.length >= 1 && args[0] instanceof HTMLElement) {
    const [element, ...names] = args;
    _impl_removeAttr(element, names);
    return;
  }
  
  if (args.length >= 1 && typeof args[0] === 'string' && args.length >= 2 && _looksLikeSelector(args[0])) {
    const [selector, ...names] = args;
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

// Internal implementations for hasAttr function
function _impl_hasAttr(element: HTMLElement, name: string): boolean {
  return element.hasAttribute(name);
}

export function hasAttr(element: HTMLElement, name: string): boolean;
export function hasAttr(selector: string, name: string): boolean;
export function hasAttr<El extends HTMLElement = HTMLElement>(name: string): ElementFn<El, boolean>;
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
  
  if (args.length === 2 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const [selector, name] = args;
    const element = resolveElement(selector);
    return element ? _impl_hasAttr(element, name) : false;
  }
  
  // Generator mode
  const [name] = args;
  return (element: HTMLElement) => _impl_hasAttr(element, name);
}

// FORM VALUES
export const value = createAccessor('prop');
export const checked = createAccessor('prop');

// Internal implementations for focus function
function _impl_focus(element: HTMLElement): void {
  element.focus();
}

// Internal implementations for blur function
function _impl_blur(element: HTMLElement): void {
  element.blur();
}

// FOCUS MANAGEMENT
export function focus<El extends HTMLElement>(element: El): void;
export function focus<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
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
  
  if (args.length === 1 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_focus(element);
    }
    return;
  }
  
  // Generator mode
  return (element: HTMLElement) => _impl_focus(element);
}

export function blur<El extends HTMLElement>(element: El): void;
export function blur<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
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
  
  if (args.length === 1 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_blur(element);
    }
    return;
  }
  
  // Generator mode
  return (element: HTMLElement) => _impl_blur(element);
}

// Internal implementations for show function
function _impl_show(element: HTMLElement): void {
  const display = element.dataset.originalDisplay ?? '';
  element.style.display = display;
  delete element.dataset.originalDisplay;
}

// Internal implementations for hide function
function _impl_hide(element: HTMLElement): void {
  if (element.style.display !== 'none') {
    element.dataset.originalDisplay = element.style.display;
    element.style.display = 'none';
  }
}

// VISIBILITY
export function show<El extends HTMLElement>(element: El): void;
export function show<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
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
  
  if (args.length === 1 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_show(element);
    }
    return;
  }
  
  // Generator mode
  return (element: HTMLElement) => _impl_show(element);
}

export function hide<El extends HTMLElement>(element: El): void;
export function hide<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
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
  
  if (args.length === 1 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const element = resolveElement(args[0]);
    if (element) {
      _impl_hide(element);
    }
    return;
  }
  
  // Generator mode
  return (element: HTMLElement) => _impl_hide(element);
}

// Internal implementations for query function
function _impl_query<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T | null {
  return element.querySelector(selector) as T | null;
}

// Internal implementations for queryAll function
function _impl_queryAll<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T[] {
  return Array.from(element.querySelectorAll(selector)) as T[];
}

// DOM TRAVERSAL
export function query<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T | null;
export function query<T extends HTMLElement = HTMLElement>(selector: string): ElementFn<HTMLElement, T | null>;
export function query(...args: any[]): any {
  if (args.length === 2 && isElementLike(args[0])) {
    const [elementLike, selector] = args;
    const element = resolveElement(elementLike);
    return element ? _impl_query(element, selector) : null;
  }
  
  if (args.length === 2 && args[0] instanceof HTMLElement) {
    const [element, selector] = args;
    return _impl_query(element, selector);
  }
  
  if (args.length === 2 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const [parentSelector, childSelector] = args;
    const element = resolveElement(parentSelector);
    return element ? _impl_query(element, childSelector) : null;
  }
  
  // Generator mode
  const [selector] = args;
  return (element: HTMLElement) => _impl_query(element, selector);
}

export function queryAll<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T[];
export function queryAll<T extends HTMLElement = HTMLElement>(selector: string): ElementFn<HTMLElement, T[]>;
export function queryAll(...args: any[]): any {
  if (args.length === 2 && isElementLike(args[0])) {
    const [elementLike, selector] = args;
    const element = resolveElement(elementLike);
    return element ? _impl_queryAll(element, selector) : [];
  }
  
  if (args.length === 2 && args[0] instanceof HTMLElement) {
    const [element, selector] = args;
    return _impl_queryAll(element, selector);
  }
  
  if (args.length === 2 && typeof args[0] === 'string' && _looksLikeSelector(args[0])) {
    const [parentSelector, childSelector] = args;
    const element = resolveElement(parentSelector);
    return element ? _impl_queryAll(element, childSelector) : [];
  }
  
  // Generator mode
  const [selector] = args;
  return (element: HTMLElement) => _impl_queryAll(element, selector);
}

// Internal implementations for DOM functions
function _impl_parent<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector?: string): T | null {
  return selector ? element.closest<T>(selector) : (element.parentElement as T | null);
}

function _impl_children<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector?: string): T[] {
  const children = Array.from(element.children) as T[];
  return selector ? children.filter(child => child.matches(selector)) : children;
}

function _impl_siblings<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector?: string): T[] {
  if (!element.parentElement) return [];
  const siblings = Array.from(element.parentElement.children).filter(child => child !== element) as T[];
  return selector ? siblings.filter(sibling => sibling.matches(selector)) : siblings;
}

// Predicate to check if first argument is an element
function _isDirectCall(args: any[]): boolean {
  return args.length > 0 && isElementLike(args[0]);
}

export function parent<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector?: string): T | null;
export function parent<T extends HTMLElement = HTMLElement>(selector?: string): ElementFn<HTMLElement, T | null>;
export function parent<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  if (_isDirectCall(args)) {
    const [element, selector] = args;
    const resolved = resolveElement(element);
    return resolved ? _impl_parent(resolved, selector) : null;
  }
  const [selector] = args;
  return (element: HTMLElement) => _impl_parent(element, selector);
}

export function children<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector?: string): T[];
export function children<T extends HTMLElement = HTMLElement>(selector?: string): ElementFn<HTMLElement, T[]>;
export function children<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  if (_isDirectCall(args)) {
    const [element, selector] = args;
    const resolved = resolveElement(element);
    return resolved ? _impl_children(resolved, selector) : [];
  }
  const [selector] = args;
  return (element: HTMLElement) => _impl_children(element, selector);
}

export function siblings<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector?: string): T[];
export function siblings<T extends HTMLElement = HTMLElement>(selector?: string): ElementFn<HTMLElement, T[]>;
export function siblings<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  if (_isDirectCall(args)) {
    const [element, selector] = args;
    const resolved = resolveElement(element);
    return resolved ? _impl_siblings(resolved, selector) : [];
  }
  const [selector] = args;
  return (element: HTMLElement) => _impl_siblings(element, selector);
}

// Internal implementations for batchAll function
function _impl_batchAll(elements: (HTMLElement | string)[], operations: ElementFn<HTMLElement>[]): void {
  elements.forEach(elementLike => {
    const element = resolveElement(elementLike);
    if (element) {
      operations.forEach(op => op(element));
    }
  });
}

// BATCH OPERATIONS
export function batchAll(elements: (HTMLElement | string)[], operations: ElementFn<HTMLElement>[]): void {
  _impl_batchAll(elements, operations);
}

// Aliases
export const el = query;
export const all = queryAll;


// Parent-Child Composition
interface WatchedSelectorInfo<
  ChildEl extends HTMLElement = HTMLElement,
  ChildGen extends GeneratorFunction<ChildEl, any> = GeneratorFunction<ChildEl, any>
> {
  generator: ChildGen;
  contexts: Map<ChildEl, Awaited<ReturnType<ChildGen>>>;
  setupFn: (el: ChildEl) => void;
  teardownFn: (el: ChildEl) => void;
}

class ChildWatcherManager {
  private parentElement: HTMLElement;
  private observer: MutationObserver;
  private watchedSelectors: Map<string, WatchedSelectorInfo<any, any>> = new Map();

  constructor(parentElement: HTMLElement) {
    this.parentElement = parentElement;
    this.handleMutations = this.handleMutations.bind(this);
    this.observer = new MutationObserver(this.handleMutations);
    this.observer.observe(this.parentElement, { childList: true, subtree: true });
    cleanup(() => this.destroy());
  }

  private handleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement) {
          this.processNode(node, 'setup');
        }
      }
      for (const node of Array.from(mutation.removedNodes)) {
        if (node instanceof HTMLElement) {
          this.processNode(node, 'teardown');
        }
      }
    }
  }

  private processNode(node: HTMLElement, action: 'setup' | 'teardown'): void {
    this.watchedSelectors.forEach(({ setupFn, teardownFn }, selector) => {
      const fn = action === 'setup' ? setupFn : teardownFn;
      if (node.matches(selector)) {
        fn(node);
      }
      node.querySelectorAll(selector).forEach(child => fn(child as HTMLElement));
    });
  }

  public register<
    S extends string,
    ChildEl extends HTMLElement,
    ChildGen extends GeneratorFunction<ChildEl, any>
  >(
    childSelector: S,
    childGenerator: ChildGen
  ): Map<ChildEl, Awaited<ReturnType<ChildGen>>> {
    const existingWatcher = this.watchedSelectors.get(childSelector);
    if (existingWatcher) return existingWatcher.contexts;

    const childContexts = new Map<ChildEl, Awaited<ReturnType<ChildGen>>>();
    const setupChild = (element: ChildEl) => {
      if (childContexts.has(element)) return;
      registerParentContext(element, this.parentElement);
      runOn(element, childGenerator as any)
        .then(api => { if (api !== undefined) childContexts.set(element, api); })
        .catch(error => console.error(`Error in child generator for selector "${childSelector}":`, error));
    };
    const teardownChild = (element: ChildEl) => {
      if (!childContexts.has(element)) return;
      unregisterParentContext(element);
      executeElementCleanup(element);
      childContexts.delete(element);
    };

    this.watchedSelectors.set(childSelector, { generator: childGenerator, contexts: childContexts, setupFn: setupChild, teardownFn: teardownChild });
    this.parentElement.querySelectorAll<ChildEl>(childSelector).forEach(setupChild);
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

export function createChildWatcher<
  S extends string,
  ChildEl extends HTMLElement = ElementFromSelector<S>,
  ChildGen extends GeneratorFunction<ChildEl, any> = GeneratorFunction<ChildEl, any>
>(
  childSelector: S,
  childGenerator: ChildGen,
  ctx?: TypedGeneratorContext<any>
): YieldableMap<ChildEl, Awaited<ReturnType<ChildGen>>> {
  const context = getCurrentContext(ctx);
  if (!context) {
    console.warn('`createChildWatcher` was called outside of a `watch` generator context. It will not function correctly.');
    const emptyMap = new Map();
    return Object.assign(emptyMap, { then: (resolve: (v: any) => void) => resolve(emptyMap) });
  }

  const parentElement = context.element;
  const managerKey = '__childWatcherManager';
  let manager: ChildWatcherManager = getState(managerKey, ctx);
  if (!manager) {
    manager = new ChildWatcherManager(parentElement);
    setState(managerKey, manager, ctx);
  }

  const contexts = manager.register<S, ChildEl, ChildGen>(childSelector, childGenerator);
  return Object.assign(contexts, {
    then: (resolve: (value: typeof contexts) => void) => resolve(contexts),
  });
}

export const child = createChildWatcher;