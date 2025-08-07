/**
 * DOM Internal Implementation Functions
 *
 * This module contains the core implementation functions for DOM manipulation.
 * These functions are used by both the overloaded API (dom.ts) and the
 * explicit API (dom-explicit.ts).
 */

// ============================================================================
// TEXT CONTENT IMPLEMENTATIONS
// ============================================================================

export function _impl_text_set(element: HTMLElement, content: string): void {
  element.textContent = String(content);
}

export function _impl_text_get(element: HTMLElement): string {
  return element.textContent ?? "";
}

// ============================================================================
// HTML CONTENT IMPLEMENTATIONS
// ============================================================================

export function _impl_html_set(element: HTMLElement, content: string): void {
  element.innerHTML = String(content);
}

export function _impl_html_get(element: HTMLElement): string {
  return element.innerHTML;
}

// ============================================================================
// CLASS MANIPULATION IMPLEMENTATIONS
// ============================================================================

export function _impl_addClass(element: HTMLElement, ...classNames: string[]): void {
  const splitClassNames = classNames.flatMap((name) =>
    name.split(/\s+/).filter(Boolean)
  );
  element.classList.add(...splitClassNames);
}

export function _impl_removeClass(element: HTMLElement, ...classNames: string[]): void {
  const splitClassNames = classNames.flatMap((name) =>
    name.split(/\s+/).filter(Boolean)
  );
  element.classList.remove(...splitClassNames);
}

export function _impl_toggleClass(
  element: HTMLElement,
  className: string,
  force?: boolean
): boolean {
  return element.classList.toggle(className, force);
}

export function _impl_hasClass(element: HTMLElement, className: string): boolean {
  return element.classList.contains(className);
}

// ============================================================================
// STYLE MANIPULATION IMPLEMENTATIONS
// ============================================================================

export function _impl_style_set_object(
  element: HTMLElement,
  styles: Partial<CSSStyleDeclaration>
): void {
  Object.entries(styles).forEach(([prop, value]) => {
    if (prop.startsWith("--")) {
      element.style.setProperty(prop, String(value));
    } else {
      (element.style as any)[prop] = value;
    }
  });
}

export function _impl_style_set_property(
  element: HTMLElement,
  property: string,
  value: string
): void {
  element.style.setProperty(property, value);
}

export function _impl_style_get_property(
  element: HTMLElement,
  property: string
): string {
  return (
    element.style.getPropertyValue(property) ||
    (element.style as any)[property] ||
    ""
  );
}

// ============================================================================
// ATTRIBUTE MANIPULATION IMPLEMENTATIONS
// ============================================================================

export function _impl_attr_set_object(
  element: HTMLElement,
  attrs: Record<string, any>
): void {
  Object.entries(attrs).forEach(([key, val]) => {
    element.setAttribute(key, String(val));
  });
}

export function _impl_attr_set_property(
  element: HTMLElement,
  name: string,
  value: any
): void {
  element.setAttribute(name, String(value));
}

export function _impl_attr_get_property(
  element: HTMLElement,
  name: string
): string | null {
  return element.getAttribute(name);
}

export function _impl_removeAttr(element: HTMLElement, names: string[]): void {
  names.flat().forEach((name) => element.removeAttribute(name));
}

export function _impl_hasAttr(element: HTMLElement, name: string): boolean {
  return element.hasAttribute(name);
}

// ============================================================================
// PROPERTY MANIPULATION IMPLEMENTATIONS
// ============================================================================

export function _impl_prop_set_object(
  element: HTMLElement,
  props: Record<string, any>
): void {
  Object.assign(element, props);
}

export function _impl_prop_set_property(
  element: HTMLElement,
  name: string,
  value: any
): void {
  (element as any)[name] = value;
}

export function _impl_prop_get_property(
  element: HTMLElement,
  name: string
): any {
  return (element as any)[name];
}

// ============================================================================
// DATA ATTRIBUTE IMPLEMENTATIONS
// ============================================================================

export function _impl_data_set_object(
  element: HTMLElement,
  data: Record<string, any>
): void {
  Object.entries(data).forEach(([key, val]) => {
    element.dataset[key] = String(val);
  });
}

export function _impl_data_set_property(
  element: HTMLElement,
  name: string,
  value: any
): void {
  element.dataset[name] = String(value);
}

export function _impl_data_get_property(
  element: HTMLElement,
  name: string
): string | undefined {
  return element.dataset[name];
}

// ============================================================================
// FORM VALUE IMPLEMENTATIONS
// ============================================================================

export function _impl_value_set(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  val: string
): void {
  element.value = val;
}

export function _impl_value_get(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): string {
  return element.value || "";
}

export function _impl_checked_set(element: HTMLInputElement, val: boolean): void {
  element.checked = val;
}

export function _impl_checked_get(element: HTMLInputElement): boolean {
  return element.checked;
}

// ============================================================================
// FOCUS MANAGEMENT IMPLEMENTATIONS
// ============================================================================

export function _impl_focus(element: HTMLElement): void {
  element.focus();
}

export function _impl_blur(element: HTMLElement): void {
  element.blur();
}

// ============================================================================
// VISIBILITY IMPLEMENTATIONS
// ============================================================================

const originalDisplayValues = new WeakMap<HTMLElement, string>();

export function _impl_show(element: HTMLElement): void {
  const original = originalDisplayValues.get(element) || "";
  element.style.display = original;
  if (element.style.display === "none") {
    element.style.display = "";
  }
}

export function _impl_hide(element: HTMLElement): void {
  const current = element.style.display;
  if (current !== "none") {
    originalDisplayValues.set(element, current);
    element.style.display = "none";
  }
}

// ============================================================================
// DOM TRAVERSAL IMPLEMENTATIONS
// ============================================================================

export function _impl_query<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector: string
): T | null {
  return element.querySelector(selector) as T | null;
}

export function _impl_queryAll<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector: string
): T[] {
  return Array.from(element.querySelectorAll(selector)) as T[];
}

export function _impl_parent<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string
): T | null {
  if (selector) {
    return element.closest(selector) as T | null;
  }
  return element.parentElement as T | null;
}

export function _impl_children<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string
): T[] {
  const children = Array.from(element.children) as T[];
  if (selector) {
    return children.filter((child) => child.matches(selector));
  }
  return children;
}

export function _impl_siblings<T extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector?: string
): T[] {
  const parent = element.parentElement;
  if (!parent) return [];

  const siblings = Array.from(parent.children).filter(
    (child) => child !== element
  ) as T[];

  if (selector) {
    return siblings.filter((sibling) => sibling.matches(selector));
  }
  return siblings;
}

// ============================================================================
// BATCH OPERATIONS IMPLEMENTATIONS
// ============================================================================

export function _impl_batchAll<El extends HTMLElement = HTMLElement>(
  elements: El[],
  operations: Array<(element: El) => any>
): void {
  for (const element of elements) {
    for (const operation of operations) {
      operation(element);
    }
  }
}
