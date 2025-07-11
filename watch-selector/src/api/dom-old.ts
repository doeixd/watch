// Comprehensive DOM manipulation functions with dual API support

import type { 
  ElementFn, 
  CSSPropertyName, 
  AttributeName,
  DataAttributeKey,
  FormElement
} from '../types.ts';

// Type guards and utilities
export function isElement(value: any): value is HTMLElement {
  return value instanceof HTMLElement;
}

export function isElementLike(value: any): value is HTMLElement | string {
  return typeof value === 'string' || value instanceof HTMLElement;
}

export function resolveElement(elementLike: HTMLElement | string): HTMLElement | null {
  if (typeof elementLike === 'string') {
    return document.querySelector(elementLike);
  }
  if (elementLike instanceof HTMLElement) {
    return elementLike;
  }
  return null;
}

// TEXT CONTENT - Enhanced with comprehensive overloads
export function text(element: HTMLElement, content: string): void;
export function text(element: HTMLElement): string;
export function text(selector: string, content: string): void;
export function text(selector: string): string | null;
export function text<El extends HTMLElement = HTMLElement>(content: string): ElementFn<El>;
export function text<El extends HTMLElement = HTMLElement>(): ElementFn<El, string>;
export function text(...args: any[]): any {
  if (args.length === 2) {
    const [elementLike, content] = args;
    const element = resolveElement(elementLike);
    if (element) {
      element.textContent = content;
    }
  } else if (args.length === 1 && isElementLike(args[0])) {
    const [elementLike] = args;
    const element = resolveElement(elementLike);
    return element?.textContent || null;
  } else if (args.length === 1) {
    const [content] = args;
    return ((element: HTMLElement) => {
      element.textContent = content;
    }) as ElementFn<HTMLElement>;
  } else {
    return ((element: HTMLElement) => element.textContent || '') as ElementFn<HTMLElement, string>;
  }
}

// CLASS MANIPULATION - Add, remove, toggle with dual API
export function addClass<El extends HTMLElement>(element: El, className: string): void;
export function addClass<El extends HTMLElement = HTMLElement>(className: string): ElementFn<El>;
export function addClass<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, className] = args as [El, string];
    element.classList.add(className);
  } else {
    const [className] = args as [string];
    return ((element: El) => {
      element.classList.add(className);
    }) as ElementFn<El>;
  }
}

export function removeClass<El extends HTMLElement>(element: El, className: string): void;
export function removeClass<El extends HTMLElement = HTMLElement>(className: string): ElementFn<El>;
export function removeClass<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, className] = args as [El, string];
    element.classList.remove(className);
  } else {
    const [className] = args as [string];
    return ((element: El) => {
      element.classList.remove(className);
    }) as ElementFn<El>;
  }
}

export function toggleClass<El extends HTMLElement>(element: El, className: string, force?: boolean): boolean;
export function toggleClass<El extends HTMLElement = HTMLElement>(className: string, force?: boolean): ElementFn<El, boolean>;
export function toggleClass<El extends HTMLElement>(...args: any[]): any {
  if (args.length >= 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, className, force] = args as [El, string, boolean?];
    return element.classList.toggle(className, force);
  } else {
    const [className, force] = args as [string, boolean?];
    return ((element: El) => {
      return element.classList.toggle(className, force);
    }) as ElementFn<El, boolean>;
  }
}

export function hasClass<El extends HTMLElement>(element: El, className: string): boolean;
export function hasClass<El extends HTMLElement = HTMLElement>(className: string): ElementFn<El, boolean>;
export function hasClass<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, className] = args as [El, string];
    return element.classList.contains(className);
  } else {
    const [className] = args as [string];
    return ((element: El) => {
      return element.classList.contains(className);
    }) as ElementFn<El, boolean>;
  }
}

// STYLE MANIPULATION - Direct and generator usage
export function style<El extends HTMLElement>(element: El, property: CSSPropertyName, value: string): void;
export function style<El extends HTMLElement>(element: El, styles: Partial<CSSStyleDeclaration>): void;
export function style<El extends HTMLElement = HTMLElement>(property: CSSPropertyName, value: string): ElementFn<El>;
export function style<El extends HTMLElement = HTMLElement>(styles: Partial<CSSStyleDeclaration>): ElementFn<El>;
export function style<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 3) {
    const [element, property, value] = args as [El, CSSPropertyName, string];
    (element.style as any)[property] = value;
  } else if (args.length === 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, styles] = args as [El, Partial<CSSStyleDeclaration>];
    Object.assign(element.style, styles);
  } else if (args.length === 2) {
    const [property, value] = args as [CSSPropertyName, string];
    return ((element: El) => {
      (element.style as any)[property] = value;
    }) as ElementFn<El>;
  } else {
    const [styles] = args as [Partial<CSSStyleDeclaration>];
    return ((element: El) => {
      Object.assign(element.style, styles);
    }) as ElementFn<El>;
  }
}

// ATTRIBUTE MANIPULATION - Direct and generator usage
export function attr<El extends HTMLElement>(element: El, name: AttributeName, value: string): void;
export function attr<El extends HTMLElement>(element: El, name: AttributeName): string | null;
export function attr<El extends HTMLElement = HTMLElement>(name: AttributeName, value: string): ElementFn<El>;
export function attr<El extends HTMLElement = HTMLElement>(name: AttributeName): ElementFn<El, string | null>;
export function attr<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 3) {
    const [element, name, value] = args as [El, AttributeName, string];
    element.setAttribute(name, value);
  } else if (args.length === 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, name] = args as [El, AttributeName];
    return element.getAttribute(name);
  } else if (args.length === 2) {
    const [name, value] = args as [AttributeName, string];
    return ((element: El) => {
      element.setAttribute(name, value);
    }) as ElementFn<El>;
  } else {
    const [name] = args as [AttributeName];
    return ((element: El) => {
      return element.getAttribute(name);
    }) as ElementFn<El, string | null>;
  }
}

export function removeAttr<El extends HTMLElement>(element: El, name: AttributeName): void;
export function removeAttr<El extends HTMLElement = HTMLElement>(name: AttributeName): ElementFn<El>;
export function removeAttr<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, name] = args as [El, AttributeName];
    element.removeAttribute(name);
  } else {
    const [name] = args as [AttributeName];
    return ((element: El) => {
      element.removeAttribute(name);
    }) as ElementFn<El>;
  }
}

export function hasAttr<El extends HTMLElement>(element: El, name: AttributeName): boolean;
export function hasAttr<El extends HTMLElement = HTMLElement>(name: AttributeName): ElementFn<El, boolean>;
export function hasAttr<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, name] = args as [El, AttributeName];
    return element.hasAttribute(name);
  } else {
    const [name] = args as [AttributeName];
    return ((element: El) => {
      return element.hasAttribute(name);
    }) as ElementFn<El, boolean>;
  }
}

// PROPERTY MANIPULATION - Type-safe property access
export function prop<El extends HTMLElement, K extends keyof El>(
  element: El, 
  property: K, 
  value: El[K]
): void;
export function prop<El extends HTMLElement, K extends keyof El>(
  element: El, 
  property: K
): El[K];
export function prop<El extends HTMLElement, K extends keyof El>(
  property: K, 
  value: El[K]
): ElementFn<El>;
export function prop<El extends HTMLElement, K extends keyof El>(
  property: K
): ElementFn<El, El[K]>;
export function prop<El extends HTMLElement, K extends keyof El>(...args: any[]): any {
  if (args.length === 3) {
    const [element, property, value] = args as [El, K, El[K]];
    element[property] = value;
  } else if (args.length === 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, property] = args as [El, K];
    return element[property];
  } else if (args.length === 2) {
    const [property, value] = args as [K, El[K]];
    return ((element: El) => {
      element[property] = value;
    }) as ElementFn<El>;
  } else {
    const [property] = args as [K];
    return ((element: El) => {
      return element[property];
    }) as ElementFn<El, El[K]>;
  }
}

// HTML CONTENT - Inner HTML manipulation
export function html<El extends HTMLElement>(element: El, content: string): void;
export function html<El extends HTMLElement>(element: El): string;
export function html<El extends HTMLElement = HTMLElement>(content: string): ElementFn<El>;
export function html<El extends HTMLElement = HTMLElement>(): ElementFn<El, string>;
export function html<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, content] = args as [El, string];
    element.innerHTML = content;
  } else if (args.length === 1 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element] = args as [El];
    return element.innerHTML;
  } else if (args.length === 1) {
    const [content] = args as [string];
    return ((element: El) => {
      element.innerHTML = content;
    }) as ElementFn<El>;
  } else {
    return ((element: El) => element.innerHTML) as ElementFn<El, string>;
  }
}

// DATA ATTRIBUTES - Dataset manipulation
export function data<El extends HTMLElement>(element: El, key: DataAttributeKey, value: string): void;
export function data<El extends HTMLElement>(element: El, key: DataAttributeKey): string | undefined;
export function data<El extends HTMLElement = HTMLElement>(key: DataAttributeKey, value: string): ElementFn<El>;
export function data<El extends HTMLElement = HTMLElement>(key: DataAttributeKey): ElementFn<El, string | undefined>;
export function data<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 3) {
    const [element, key, value] = args as [El, DataAttributeKey, string];
    element.dataset[key] = value;
  } else if (args.length === 2 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element, key] = args as [El, DataAttributeKey];
    return element.dataset[key];
  } else if (args.length === 2) {
    const [key, value] = args as [DataAttributeKey, string];
    return ((element: El) => {
      element.dataset[key] = value;
    }) as ElementFn<El>;
  } else {
    const [key] = args as [DataAttributeKey];
    return ((element: El) => element.dataset[key]) as ElementFn<El, string | undefined>;
  }
}

// FORM VALUES - Type-safe form handling
export function value<El extends FormElement>(element: El, val: string): void;
export function value<El extends FormElement>(element: El): string;
export function value<El extends FormElement = FormElement>(val: string): ElementFn<El>;
export function value<El extends FormElement = FormElement>(): ElementFn<El, string>;
export function value<El extends FormElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, val] = args as [El, string];
    element.value = val;
  } else if (args.length === 1 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element] = args as [El];
    return element.value;
  } else if (args.length === 1) {
    const [val] = args as [string];
    return ((element: El) => {
      element.value = val;
    }) as ElementFn<El>;
  } else {
    return ((element: El) => element.value) as ElementFn<El, string>;
  }
}

export function checked<El extends HTMLInputElement>(element: El, isChecked: boolean): void;
export function checked<El extends HTMLInputElement>(element: El): boolean;
export function checked<El extends HTMLInputElement = HTMLInputElement>(isChecked: boolean): ElementFn<El>;
export function checked<El extends HTMLInputElement = HTMLInputElement>(): ElementFn<El, boolean>;
export function checked<El extends HTMLInputElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, isChecked] = args as [El, boolean];
    element.checked = isChecked;
  } else if (args.length === 1 && typeof args[0] === 'object' && 'nodeType' in args[0]) {
    const [element] = args as [El];
    return element.checked;
  } else if (args.length === 1) {
    const [isChecked] = args as [boolean];
    return ((element: El) => {
      element.checked = isChecked;
    }) as ElementFn<El>;
  } else {
    return ((element: El) => element.checked) as ElementFn<El, boolean>;
  }
}

// FOCUS MANAGEMENT
export function focus<El extends HTMLElement>(element: El): void;
export function focus<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function focus<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 1) {
    const [element] = args as [El];
    element.focus();
  } else {
    return ((element: El) => {
      element.focus();
    }) as ElementFn<El>;
  }
}

export function blur<El extends HTMLElement>(element: El): void;
export function blur<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function blur<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 1) {
    const [element] = args as [El];
    element.blur();
  } else {
    return ((element: El) => {
      element.blur();
    }) as ElementFn<El>;
  }
}

// VISIBILITY
export function show<El extends HTMLElement>(element: El): void;
export function show<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function show<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 1) {
    const [element] = args as [El];
    element.style.display = '';
  } else {
    return ((element: El) => {
      element.style.display = '';
    }) as ElementFn<El>;
  }
}

export function hide<El extends HTMLElement>(element: El): void;
export function hide<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function hide<El extends HTMLElement>(...args: any[]): any {
  if (args.length === 1) {
    const [element] = args as [El];
    element.style.display = 'none';
  } else {
    return ((element: El) => {
      element.style.display = 'none';
    }) as ElementFn<El>;
  }
}

// DOM TRAVERSAL - Query and navigation helpers
export function query<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T | null;
export function query<T extends HTMLElement = HTMLElement>(selector: string): ElementFn<HTMLElement, T | null>;
export function query<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, selector] = args as [HTMLElement, string];
    return element.querySelector(selector) as T | null;
  } else {
    const [selector] = args as [string];
    return ((element: HTMLElement) => {
      return element.querySelector(selector) as T | null;
    }) as ElementFn<HTMLElement, T | null>;
  }
}

export function queryAll<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T[];
export function queryAll<T extends HTMLElement = HTMLElement>(selector: string): ElementFn<HTMLElement, T[]>;
export function queryAll<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, selector] = args as [HTMLElement, string];
    return Array.from(element.querySelectorAll(selector)) as T[];
  } else {
    const [selector] = args as [string];
    return ((element: HTMLElement) => {
      return Array.from(element.querySelectorAll(selector)) as T[];
    }) as ElementFn<HTMLElement, T[]>;
  }
}

export function parent<T extends HTMLElement = HTMLElement>(element: HTMLElement): T | null;
export function parent<T extends HTMLElement = HTMLElement>(): ElementFn<HTMLElement, T | null>;
export function parent<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  if (args.length === 1) {
    const [element] = args as [HTMLElement];
    return element.parentElement as T | null;
  } else {
    return ((element: HTMLElement) => {
      return element.parentElement as T | null;
    }) as ElementFn<HTMLElement, T | null>;
  }
}

export function children<T extends HTMLElement = HTMLElement>(element: HTMLElement): T[];
export function children<T extends HTMLElement = HTMLElement>(): ElementFn<HTMLElement, T[]>;
export function children<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  if (args.length === 1) {
    const [element] = args as [HTMLElement];
    return Array.from(element.children) as T[];
  } else {
    return ((element: HTMLElement) => {
      return Array.from(element.children) as T[];
    }) as ElementFn<HTMLElement, T[]>;
  }
}
