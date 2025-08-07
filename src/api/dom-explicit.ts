/**
 * Explicit Un-overloaded DOM Functions
 *
 * This module provides explicit, un-overloaded versions of all DOM manipulation
 * functions for maximum flexibility and clarity. Each function has a clear,
 * single purpose with no ambiguity in its signature.
 *
 * Naming conventions:
 * - *Direct - Direct element manipulation
 * - *Selector - CSS selector-based manipulation
 * - *Generator - Returns ElementFn for generator use
 * - *Get* - Getter variants
 * - *Set* - Setter variants (when needed for clarity)
 */

import type { ElementFn, ElementFromSelector } from "../types";
import {
  _impl_text_set,
  _impl_text_get,
  _impl_html_set,
  _impl_html_get,
  _impl_addClass,
  _impl_removeClass,
  _impl_toggleClass,
  _impl_hasClass,
  _impl_style_set_object,
  _impl_style_set_property,
  _impl_style_get_property,
  _impl_attr_set_object,
  _impl_attr_set_property,
  _impl_attr_get_property,
  _impl_prop_set_object,
  _impl_prop_set_property,
  _impl_prop_get_property,
  _impl_data_set_object,
  _impl_data_set_property,
  _impl_data_get_property,
  _impl_removeAttr,
  _impl_hasAttr,
  _impl_value_set,
  _impl_value_get,
  _impl_checked_set,
  _impl_checked_get,
  _impl_focus,
  _impl_blur,
  _impl_show,
  _impl_hide,
  _impl_query,
  _impl_queryAll,
  _impl_parent,
  _impl_children,
  _impl_siblings,
} from "./dom-internals";

// ============================================================================
// TEXT CONTENT FUNCTIONS
// ============================================================================

/**
 * Sets text content directly on an element.
 */
export function textDirect(element: HTMLElement, content: string): void {
  _impl_text_set(element, content);
}

/**
 * Sets text content on elements matching a selector.
 */
export function textSelector(selector: string, content: string): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_text_set(element, content);
  }
}

/**
 * Returns an ElementFn that sets text content (for generator use).
 */
export function textGenerator<El extends HTMLElement = HTMLElement>(
  content: string
): ElementFn<El> {
  return (element: El) => _impl_text_set(element, content);
}

/**
 * Gets text content directly from an element.
 */
export function textGetDirect(element: HTMLElement): string {
  return _impl_text_get(element);
}

/**
 * Gets text content from the first element matching a selector.
 */
export function textGetSelector(selector: string): string | null {
  const element = document.querySelector(selector) as HTMLElement;
  return element ? _impl_text_get(element) : null;
}

/**
 * Returns an ElementFn that gets text content (for generator use).
 */
export function textGetGenerator<El extends HTMLElement = HTMLElement>(): ElementFn<
  El,
  string
> {
  return (element: El) => _impl_text_get(element);
}

// ============================================================================
// HTML CONTENT FUNCTIONS
// ============================================================================

/**
 * Sets HTML content directly on an element.
 */
export function htmlDirect(element: HTMLElement, content: string): void {
  _impl_html_set(element, content);
}

/**
 * Sets HTML content on elements matching a selector.
 */
export function htmlSelector(selector: string, content: string): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_html_set(element, content);
  }
}

/**
 * Returns an ElementFn that sets HTML content (for generator use).
 */
export function htmlGenerator<El extends HTMLElement = HTMLElement>(
  content: string
): ElementFn<El> {
  return (element: El) => _impl_html_set(element, content);
}

/**
 * Gets HTML content directly from an element.
 */
export function htmlGetDirect(element: HTMLElement): string {
  return _impl_html_get(element);
}

/**
 * Gets HTML content from the first element matching a selector.
 */
export function htmlGetSelector(selector: string): string | null {
  const element = document.querySelector(selector) as HTMLElement;
  return element ? _impl_html_get(element) : null;
}

/**
 * Returns an ElementFn that gets HTML content (for generator use).
 */
export function htmlGetGenerator<El extends HTMLElement = HTMLElement>(): ElementFn<
  El,
  string
> {
  return (element: El) => _impl_html_get(element);
}

// ============================================================================
// CLASS MANIPULATION FUNCTIONS
// ============================================================================

/**
 * Adds classes directly to an element.
 */
export function addClassDirect(element: HTMLElement, ...classNames: string[]): void {
  _impl_addClass(element, ...classNames);
}

/**
 * Adds classes to elements matching a selector.
 */
export function addClassSelector(selector: string, ...classNames: string[]): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_addClass(element, ...classNames);
  }
}

/**
 * Returns an ElementFn that adds classes (for generator use).
 */
export function addClassGenerator<El extends HTMLElement = HTMLElement>(
  ...classNames: string[]
): ElementFn<El> {
  return (element: El) => _impl_addClass(element, ...classNames);
}

/**
 * Removes classes directly from an element.
 */
export function removeClassDirect(element: HTMLElement, ...classNames: string[]): void {
  _impl_removeClass(element, ...classNames);
}

/**
 * Removes classes from elements matching a selector.
 */
export function removeClassSelector(selector: string, ...classNames: string[]): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_removeClass(element, ...classNames);
  }
}

/**
 * Returns an ElementFn that removes classes (for generator use).
 */
export function removeClassGenerator<El extends HTMLElement = HTMLElement>(
  ...classNames: string[]
): ElementFn<El> {
  return (element: El) => _impl_removeClass(element, ...classNames);
}

/**
 * Toggles a class directly on an element.
 */
export function toggleClassDirect(
  element: HTMLElement,
  className: string,
  force?: boolean
): boolean {
  return _impl_toggleClass(element, className, force);
}

/**
 * Toggles a class on elements matching a selector.
 */
export function toggleClassSelector(
  selector: string,
  className: string,
  force?: boolean
): boolean {
  const element = document.querySelector(selector) as HTMLElement;
  return element ? _impl_toggleClass(element, className, force) : false;
}

/**
 * Returns an ElementFn that toggles a class (for generator use).
 */
export function toggleClassGenerator<El extends HTMLElement = HTMLElement>(
  className: string,
  force?: boolean
): ElementFn<El, boolean> {
  return (element: El) => _impl_toggleClass(element, className, force);
}

/**
 * Checks if an element has a class.
 */
export function hasClassDirect(element: HTMLElement, className: string): boolean {
  return _impl_hasClass(element, className);
}

/**
 * Checks if an element matching a selector has a class.
 */
export function hasClassSelector(selector: string, className: string): boolean {
  const element = document.querySelector(selector) as HTMLElement;
  return element ? _impl_hasClass(element, className) : false;
}

/**
 * Returns an ElementFn that checks for a class (for generator use).
 */
export function hasClassGenerator<El extends HTMLElement = HTMLElement>(
  className: string
): ElementFn<El, boolean> {
  return (element: El) => _impl_hasClass(element, className);
}

// ============================================================================
// STYLE MANIPULATION FUNCTIONS
// ============================================================================

/**
 * Sets a single style property directly on an element.
 */
export function styleSetDirect(
  element: HTMLElement,
  property: string,
  value: string
): void {
  _impl_style_set_property(element, property, value);
}

/**
 * Sets multiple style properties directly on an element.
 */
export function styleSetObjectDirect(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
): void {
  _impl_style_set_object(element, styles);
}

/**
 * Sets a style property on elements matching a selector.
 */
export function styleSetSelector(
  selector: string,
  property: string,
  value: string
): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_style_set_property(element, property, value);
  }
}

/**
 * Sets multiple style properties on elements matching a selector.
 */
export function styleSetObjectSelector(
  selector: string,
  styles: Partial<CSSStyleDeclaration>
): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_style_set_object(element, styles);
  }
}

/**
 * Returns an ElementFn that sets a style property (for generator use).
 */
export function styleSetGenerator<El extends HTMLElement = HTMLElement>(
  property: string,
  value: string
): ElementFn<El> {
  return (element: El) => _impl_style_set_property(element, property, value);
}

/**
 * Returns an ElementFn that sets multiple style properties (for generator use).
 */
export function styleSetObjectGenerator<El extends HTMLElement = HTMLElement>(
  styles: Partial<CSSStyleDeclaration>
): ElementFn<El> {
  return (element: El) => _impl_style_set_object(element, styles);
}

/**
 * Gets a style property value directly from an element.
 */
export function styleGetDirect(element: HTMLElement, property: string): string {
  return _impl_style_get_property(element, property);
}

/**
 * Gets a style property value from an element matching a selector.
 */
export function styleGetSelector(selector: string, property: string): string | null {
  const element = document.querySelector(selector) as HTMLElement;
  return element ? _impl_style_get_property(element, property) : null;
}

/**
 * Returns an ElementFn that gets a style property (for generator use).
 */
export function styleGetGenerator<El extends HTMLElement = HTMLElement>(
  property: string
): ElementFn<El, string> {
  return (element: El) => _impl_style_get_property(element, property);
}

// ============================================================================
// ATTRIBUTE MANIPULATION FUNCTIONS
// ============================================================================

/**
 * Sets an attribute directly on an element.
 */
export function attrSetDirect(element: HTMLElement, name: string, value: any): void {
  _impl_attr_set_property(element, name, value);
}

/**
 * Sets multiple attributes directly on an element.
 */
export function attrSetObjectDirect(
  element: HTMLElement,
  attrs: Record<string, any>
): void {
  _impl_attr_set_object(element, attrs);
}

/**
 * Sets an attribute on elements matching a selector.
 */
export function attrSetSelector(selector: string, name: string, value: any): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_attr_set_property(element, name, value);
  }
}

/**
 * Returns an ElementFn that sets an attribute (for generator use).
 */
export function attrSetGenerator<El extends HTMLElement = HTMLElement>(
  name: string,
  value: any
): ElementFn<El> {
  return (element: El) => _impl_attr_set_property(element, name, value);
}

/**
 * Gets an attribute value directly from an element.
 */
export function attrGetDirect(element: HTMLElement, name: string): string | null {
  return _impl_attr_get_property(element, name);
}

/**
 * Gets an attribute value from an element matching a selector.
 */
export function attrGetSelector(selector: string, name: string): string | null {
  const element = document.querySelector(selector) as HTMLElement;
  return element ? _impl_attr_get_property(element, name) : null;
}

/**
 * Removes attributes directly from an element.
 */
export function removeAttrDirect(element: HTMLElement, ...names: string[]): void {
  _impl_removeAttr(element, names);
}

/**
 * Removes attributes from elements matching a selector.
 */
export function removeAttrSelector(selector: string, ...names: string[]): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_removeAttr(element, names);
  }
}

/**
 * Returns an ElementFn that removes attributes (for generator use).
 */
export function removeAttrGenerator<El extends HTMLElement = HTMLElement>(
  ...names: string[]
): ElementFn<El> {
  return (element: El) => _impl_removeAttr(element, names);
}

// ============================================================================
// FORM VALUE FUNCTIONS
// ============================================================================

/**
 * Sets the value directly on a form element.
 */
export function valueDirect(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
): void {
  _impl_value_set(element, value);
}

/**
 * Sets the value on a form element matching a selector.
 */
export function valueSelector(selector: string, value: string): void {
  const element = document.querySelector(selector) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement;
  if (element) {
    _impl_value_set(element, value);
  }
}

/**
 * Returns an ElementFn that sets the value (for generator use).
 */
export function valueGenerator<
  El extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement = HTMLInputElement
>(value: string): ElementFn<El> {
  return (element: El) => _impl_value_set(element, value);
}

/**
 * Gets the value directly from a form element.
 */
export function valueGetDirect(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): string {
  return _impl_value_get(element);
}

/**
 * Gets the value from a form element matching a selector.
 */
export function valueGetSelector(selector: string): string | null {
  const element = document.querySelector(selector) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement;
  return element ? _impl_value_get(element) : null;
}

/**
 * Sets the checked state directly on a checkbox/radio input.
 */
export function checkedDirect(element: HTMLInputElement, checked: boolean): void {
  _impl_checked_set(element, checked);
}

/**
 * Sets the checked state on an input matching a selector.
 */
export function checkedSelector(selector: string, checked: boolean): void {
  const element = document.querySelector(selector) as HTMLInputElement;
  if (element) {
    _impl_checked_set(element, checked);
  }
}

/**
 * Returns an ElementFn that sets the checked state (for generator use).
 */
export function checkedGenerator<El extends HTMLInputElement = HTMLInputElement>(
  checked: boolean
): ElementFn<El> {
  return (element: El) => _impl_checked_set(element, checked);
}

/**
 * Gets the checked state directly from an input.
 */
export function checkedGetDirect(element: HTMLInputElement): boolean {
  return _impl_checked_get(element);
}

/**
 * Gets the checked state from an input matching a selector.
 */
export function checkedGetSelector(selector: string): boolean {
  const element = document.querySelector(selector) as HTMLInputElement;
  return element ? _impl_checked_get(element) : false;
}

// ============================================================================
// FOCUS MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Focuses an element directly.
 */
export function focusDirect(element: HTMLElement): void {
  _impl_focus(element);
}

/**
 * Focuses an element matching a selector.
 */
export function focusSelector(selector: string): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_focus(element);
  }
}

/**
 * Returns an ElementFn that focuses the element (for generator use).
 */
export function focusGenerator<El extends HTMLElement = HTMLElement>(): ElementFn<El> {
  return (element: El) => _impl_focus(element);
}

/**
 * Blurs an element directly.
 */
export function blurDirect(element: HTMLElement): void {
  _impl_blur(element);
}

/**
 * Blurs an element matching a selector.
 */
export function blurSelector(selector: string): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_blur(element);
  }
}

/**
 * Returns an ElementFn that blurs the element (for generator use).
 */
export function blurGenerator<El extends HTMLElement = HTMLElement>(): ElementFn<El> {
  return (element: El) => _impl_blur(element);
}

// ============================================================================
// VISIBILITY FUNCTIONS
// ============================================================================

/**
 * Shows an element directly.
 */
export function showDirect(element: HTMLElement): void {
  _impl_show(element);
}

/**
 * Shows an element matching a selector.
 */
export function showSelector(selector: string): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_show(element);
  }
}

/**
 * Returns an ElementFn that shows the element (for generator use).
 */
export function showGenerator<El extends HTMLElement = HTMLElement>(): ElementFn<El> {
  return (element: El) => _impl_show(element);
}

/**
 * Hides an element directly.
 */
export function hideDirect(element: HTMLElement): void {
  _impl_hide(element);
}

/**
 * Hides an element matching a selector.
 */
export function hideSelector(selector: string): void {
  const element = document.querySelector(selector) as HTMLElement;
  if (element) {
    _impl_hide(element);
  }
}

/**
 * Returns an ElementFn that hides the element (for generator use).
 */
export function hideGenerator<El extends HTMLElement = HTMLElement>(): ElementFn<El> {
  return (element: El) => _impl_hide(element);
}

// ============================================================================
// DOM TRAVERSAL FUNCTIONS
// ============================================================================

/**
 * Queries for a child element directly.
 */
export function queryDirect<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector: string
): T | null {
  return _impl_query(element, selector);
}

/**
 * Queries for a descendant of an element matching a parent selector.
 */
export function querySelector<T extends HTMLElement = HTMLElement>(
  parentSelector: string,
  childSelector: string
): T | null {
  const parent = document.querySelector(parentSelector) as HTMLElement;
  return parent ? _impl_query(parent, childSelector) : null;
}

/**
 * Returns an ElementFn that queries for a child (for generator use).
 */
export function queryGenerator<T extends HTMLElement = HTMLElement>(
  selector: string
): ElementFn<HTMLElement, T | null> {
  return (element: HTMLElement) => _impl_query(element, selector);
}

/**
 * Queries for all matching child elements directly.
 */
export function queryAllDirect<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector: string
): T[] {
  return _impl_queryAll(element, selector);
}

/**
 * Queries for all descendants of an element matching a parent selector.
 */
export function queryAllSelector<T extends HTMLElement = HTMLElement>(
  parentSelector: string,
  childSelector: string
): T[] {
  const parent = document.querySelector(parentSelector) as HTMLElement;
  return parent ? _impl_queryAll(parent, childSelector) : [];
}

/**
 * Returns an ElementFn that queries for all children (for generator use).
 */
export function queryAllGenerator<T extends HTMLElement = HTMLElement>(
  selector: string
): ElementFn<HTMLElement, T[]> {
  return (element: HTMLElement) => _impl_queryAll(element, selector);
}

/**
 * Gets the parent element directly.
 */
export function parentDirect<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string
): T | null {
  return _impl_parent(element, selector);
}

/**
 * Returns an ElementFn that gets the parent (for generator use).
 */
export function parentGenerator<T extends HTMLElement = HTMLElement>(
  selector?: string
): ElementFn<HTMLElement, T | null> {
  return (element: HTMLElement) => _impl_parent(element, selector);
}

/**
 * Gets child elements directly.
 */
export function childrenDirect<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string
): T[] {
  return _impl_children(element, selector);
}

/**
 * Returns an ElementFn that gets children (for generator use).
 */
export function childrenGenerator<T extends HTMLElement = HTMLElement>(
  selector?: string
): ElementFn<HTMLElement, T[]> {
  return (element: HTMLElement) => _impl_children(element, selector);
}

/**
 * Gets sibling elements directly.
 */
export function siblingsDirect<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string
): T[] {
  return _impl_siblings(element, selector);
}

/**
 * Returns an ElementFn that gets siblings (for generator use).
 */
export function siblingsGenerator<T extends HTMLElement = HTMLElement>(
  selector?: string
): ElementFn<HTMLElement, T[]> {
  return (element: HTMLElement) => _impl_siblings(element, selector);
}
