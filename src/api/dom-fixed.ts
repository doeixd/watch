/**
 * DOM API Implementation with Sync Generators
 *
 * This module implements DOM manipulation functions that support multiple API patterns:
 * 1. Direct element manipulation: text(element, 'content')
 * 2. CSS selector manipulation: text('#id', 'content')
 * 3. Generator with yield*: yield* text('content')
 *
 * All functions use sync generators and the yield* pattern for better type safety.
 */

import type { Workflow, WatchContext, Operation } from "../types";
import { getCurrentContext } from "../core/context";
import {
  isCSSSelector,
  isClassName,
  type CSSSelector,
  type ClassName,
} from "../utils/selector-types";

// ============================================================================
// Type Definitions
// ============================================================================

type StyleValue = string | number | null;
type StyleObject = Record<string, StyleValue>;
type AttributeObject = Record<string, string>;
type DataObject = Record<string, any>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a value is an HTML element
 */
export function isElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * Check if a value is an Element or string
 */
export function isElementLike(value: unknown): value is HTMLElement | string {
  return typeof value === "string" || value instanceof HTMLElement;
}

/**
 * Check if we're in a generator context
 */
function isInGeneratorContext(): boolean {
  return getCurrentContext() !== null;
}

/**
 * Resolve an element from either an HTMLElement or a selector string
 */
export function resolveElement(
  elementLike: HTMLElement | string,
): HTMLElement | null {
  if (typeof elementLike === "string") {
    try {
      return document.querySelector(elementLike) as HTMLElement;
    } catch {
      return null;
    }
  }
  if (elementLike instanceof HTMLElement) {
    return elementLike;
  }
  return null;
}

/**
 * Resolve elements from a selector string
 */
function resolveElements(selector: string): HTMLElement[] {
  const elements: HTMLElement[] = [];
  document.querySelectorAll(selector).forEach((el) => {
    if (el instanceof HTMLElement) {
      elements.push(el);
    }
  });
  return elements;
}

/**
 * Enhanced selector detection with better heuristics
 */
function looksLikeSelector(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return isCSSSelector(value);
}

// ============================================================================
// Text Function
// ============================================================================

export function text(element: HTMLElement, content: string | number): void;
export function text(element: HTMLElement): string;
export function text(selector: string, content: string | number): void;
export function text(selector: string): string | null;
export function text(selector: CSSSelector, content: string | number): void;
export function text(selector: CSSSelector): string | null;
export function text(content: string | number): Workflow<void>;
export function text(): Workflow<string>;

export function text(...args: any[]): any {
  // Direct element setter
  if (args.length === 2 && isElement(args[0])) {
    const [element, content] = args;
    element.textContent = String(content);
    return;
  }

  // Direct element getter
  if (args.length === 1 && isElement(args[0])) {
    const [element] = args;
    return element.textContent || "";
  }

  // CSS selector setter
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, content] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      el.textContent = String(content);
    });
    return;
  }

  // CSS selector getter
  if (args.length === 1 && typeof args[0] === "string" && !isInGeneratorContext()) {
    const [selector] = args;
    const element = document.querySelector(String(selector));
    return element ? element.textContent || "" : null;
  }

  // Generator setter pattern
  if (args.length === 1 && !isElement(args[0]) && !looksLikeSelector(args[0])) {
    const [content] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        context.element.textContent = String(content);
      }) as Operation<void>;
    })();
  }

  // Generator getter pattern
  if (args.length === 0) {
    return (function* (): Generator<Operation<string>, string, any> {
      const result = yield ((context: WatchContext) => {
        return context.element.textContent || "";
      }) as Operation<string>;
      return result;
    })();
  }

  throw new Error(`Invalid arguments for text(): ${args.length} arguments provided`);
}

// ============================================================================
// HTML Function
// ============================================================================

export function html(element: HTMLElement, content: string): void;
export function html(element: HTMLElement): string;
export function html(selector: string | CSSSelector, content: string): void;
export function html(selector: string | CSSSelector): string | null;
export function html(content: string): Workflow<void>;
export function html(): Workflow<string>;

export function html(...args: any[]): any {
  // Direct element setter
  if (args.length === 2 && isElement(args[0])) {
    const [element, content] = args;
    element.innerHTML = String(content);
    return;
  }

  // Direct element getter
  if (args.length === 1 && isElement(args[0])) {
    const [element] = args;
    return element.innerHTML;
  }

  // CSS selector setter
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, content] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      el.innerHTML = String(content);
    });
    return;
  }

  // CSS selector getter
  if (args.length === 1 && typeof args[0] === "string" && !isInGeneratorContext()) {
    const [selector] = args;
    const element = document.querySelector(String(selector));
    return element ? element.innerHTML : null;
  }

  // Generator setter pattern
  if (args.length === 1 && typeof args[0] === "string") {
    const [content] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        context.element.innerHTML = String(content);
      }) as Operation<void>;
    })();
  }

  // Generator getter pattern
  if (args.length === 0) {
    return (function* (): Generator<Operation<string>, string, any> {
      const result = yield ((context: WatchContext) => {
        return context.element.innerHTML;
      }) as Operation<string>;
      return result;
    })();
  }

  throw new Error(`Invalid arguments for html(): ${args.length} arguments provided`);
}

// ============================================================================
// Class Functions - Support Variadic Arguments
// ============================================================================

export function addClass(element: HTMLElement, ...classNames: string[]): void;
export function addClass(selector: string | CSSSelector, ...classNames: string[]): void;
export function addClass(...classNames: string[]): Workflow<void>;

export function addClass(...args: any[]): any {
  // Direct element manipulation
  if (args.length >= 1 && isElement(args[0])) {
    const [element, ...classNames] = args;
    classNames.forEach(className => {
      const classes = String(className).split(/\s+/).filter(Boolean);
      element.classList.add(...classes);
    });
    return;
  }

  // CSS selector manipulation
  if (args.length >= 2 && typeof args[0] === "string" && looksLikeSelector(args[0])) {
    const [selector, ...classNames] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      classNames.forEach(className => {
        const classes = String(className).split(/\s+/).filter(Boolean);
        el.classList.add(...classes);
      });
    });
    return;
  }

  // Generator pattern - all args are class names
  const classNames = args;
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      classNames.forEach((className: string) => {
        const classes = String(className).split(/\s+/).filter(Boolean);
        context.element.classList.add(...classes);
      });
    }) as Operation<void>;
  })();
}

export function removeClass(element: HTMLElement, ...classNames: string[]): void;
export function removeClass(selector: string | CSSSelector, ...classNames: string[]): void;
export function removeClass(...classNames: string[]): Workflow<void>;

export function removeClass(...args: any[]): any {
  // Direct element manipulation
  if (args.length >= 1 && isElement(args[0])) {
    const [element, ...classNames] = args;
    classNames.forEach(className => {
      const classes = String(className).split(/\s+/).filter(Boolean);
      element.classList.remove(...classes);
    });
    return;
  }

  // CSS selector manipulation
  if (args.length >= 2 && typeof args[0] === "string" && looksLikeSelector(args[0])) {
    const [selector, ...classNames] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      classNames.forEach(className => {
        const classes = String(className).split(/\s+/).filter(Boolean);
        el.classList.remove(...classes);
      });
    });
    return;
  }

  // Generator pattern - all args are class names
  const classNames = args;
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      classNames.forEach((className: string) => {
        const classes = String(className).split(/\s+/).filter(Boolean);
        context.element.classList.remove(...classes);
      });
    }) as Operation<void>;
  })();
}

export function toggleClass(element: HTMLElement, className: string, force?: boolean): boolean;
export function toggleClass(selector: string | CSSSelector, className: string, force?: boolean): boolean;
export function toggleClass(className: string, force?: boolean): Workflow<boolean>;

export function toggleClass(...args: any[]): any {
  // Direct element manipulation
  if ((args.length === 2 || args.length === 3) && isElement(args[0])) {
    const [element, className, force] = args;
    let result = false;
    const classes = String(className).split(/\s+/).filter(Boolean);
    classes.forEach(cls => {
      result = element.classList.toggle(cls, force);
    });
    return result;
  }

  // CSS selector manipulation
  if ((args.length === 2 || args.length === 3) && typeof args[0] === "string" && looksLikeSelector(args[0])) {
    const [selector, className, force] = args;
    const element = document.querySelector(String(selector));
    if (!element || !(element instanceof HTMLElement)) return false;
    let result = false;
    const classes = String(className).split(/\s+/).filter(Boolean);
    classes.forEach(cls => {
      result = element.classList.toggle(cls, force);
    });
    return result;
  }

  // Generator pattern
  if (args.length === 1 || args.length === 2) {
    const [className, force] = args;
    return (function* (): Generator<Operation<boolean>, boolean, any> {
      const result = yield ((context: WatchContext) => {
        let toggleResult = false;
        const classes = String(className).split(/\s+/).filter(Boolean);
        classes.forEach(cls => {
          toggleResult = context.element.classList.toggle(cls, force);
        });
        return toggleResult;
      }) as Operation<boolean>;
      return result;
    })();
  }

  throw new Error(`Invalid arguments for toggleClass(): ${args.length} arguments provided`);
}

export function hasClass(element: HTMLElement, className: string): boolean;
export function hasClass(selector: string | CSSSelector, className: string): boolean;
export function hasClass(className: string): Workflow<boolean>;

export function hasClass(...args: any[]): any {
  // Direct element check
  if (args.length === 2 && isElement(args[0])) {
    const [element, className] = args;
    const classes = String(className).split(/\s+/).filter(Boolean);
    return classes.every(cls => element.classList.contains(cls));
  }

  // CSS selector check (checks first element)
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, className] = args;
    const element = document.querySelector(String(selector));
    if (!element || !(element instanceof HTMLElement)) return false;
    const classes = String(className).split(/\s+/).filter(Boolean);
    return classes.every(cls => element.classList.contains(cls));
  }

  // Generator pattern
  if (args.length === 1) {
    const [className] = args;
    return (function* (): Generator<Operation<boolean>, boolean, any> {
      const result = yield ((context: WatchContext) => {
        const classes = String(className).split(/\s+/).filter(Boolean);
        return classes.every(cls => context.element.classList.contains(cls));
      }) as Operation<boolean>;
      return result;
    })();
  }

  throw new Error(`Invalid arguments for hasClass(): ${args.length} arguments provided`);
}

// ============================================================================
// Style Function
// ============================================================================

export function style(element: HTMLElement, property: string): string;
export function style(element: HTMLElement, property: string, value: StyleValue): void;
export function style(element: HTMLElement, styles: StyleObject): void;
export function style(selector: string | CSSSelector, property: string): string | null;
export function style(selector: string | CSSSelector, property: string, value: StyleValue): void;
export function style(selector: string | CSSSelector, styles: StyleObject): void;
export function style(property: string, value: StyleValue): Workflow<void>;
export function style(styles: StyleObject): Workflow<void>;
export function style(property: string): Workflow<string>;

export function style(...args: any[]): any {
  const applyStyles = (element: HTMLElement, propOrStyles: StyleObject | string, value?: StyleValue) => {
    if (typeof propOrStyles === "object") {
      Object.entries(propOrStyles).forEach(([prop, val]) => {
        if (val !== null && val !== undefined) {
          (element.style as any)[prop] = String(val);
        } else {
          (element.style as any)[prop] = "";
        }
      });
    } else {
      if (value !== null && value !== undefined) {
        (element.style as any)[propOrStyles] = String(value);
      } else {
        (element.style as any)[propOrStyles] = "";
      }
    }
  };

  // Direct element getter
  if (args.length === 2 && isElement(args[0]) && typeof args[1] === "string" && !args[2]) {
    const [element, property] = args;
    return getComputedStyle(element).getPropertyValue(property);
  }

  // Direct element setter
  if (isElement(args[0])) {
    const [element, propOrStyles, value] = args;
    applyStyles(element, propOrStyles, value);
    return;
  }

  // CSS selector getter
  if (args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string" && !isInGeneratorContext()) {
    const [selector, property] = args;
    const element = document.querySelector(String(selector));
    if (!element) return null;
    return getComputedStyle(element).getPropertyValue(property);
  }

  // CSS selector setter
  if (args.length >= 2 && typeof args[0] === "string" && looksLikeSelector(args[0])) {
    const [selector, propOrStyles, value] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      applyStyles(el, propOrStyles, value);
    });
    return;
  }

  // Generator setter with object
  if (args.length === 1 && typeof args[0] === "object") {
    const [styles] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        applyStyles(context.element, styles);
      }) as Operation<void>;
    })();
  }

  // Generator setter with prop/value
  if (args.length === 2) {
    const [prop, value] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        applyStyles(context.element, prop, value);
      }) as Operation<void>;
    })();
  }

  // Generator getter
  if (args.length === 1 && typeof args[0] === "string") {
    const [prop] = args;
    return (function* (): Generator<Operation<string>, string, any> {
      const result = yield ((context: WatchContext) => {
        return getComputedStyle(context.element).getPropertyValue(prop);
      }) as Operation<string>;
      return result;
    })();
  }

  throw new Error(`Invalid arguments for style(): ${args.length} arguments provided`);
}

// ============================================================================
// Attribute Functions
// ============================================================================

export function attr(element: HTMLElement, name: string): string | null;
export function attr(element: HTMLElement, name: string, value: string): void;
export function attr(element: HTMLElement, attrs: AttributeObject): void;
export function attr(selector: string | CSSSelector, name: string): string | null;
export function attr(selector: string | CSSSelector, name: string, value: string): void;
export function attr(selector: string | CSSSelector, attrs: AttributeObject): void;
export function attr(name: string, value: string): Workflow<void>;
export function attr(attrs: AttributeObject): Workflow<void>;
export function attr(name: string): Workflow<string | null>;

export function attr(...args: any[]): any {
  const applyAttrs = (element: HTMLElement, nameOrAttrs: AttributeObject | string, value?: string) => {
    if (typeof nameOrAttrs === "object") {
      Object.entries(nameOrAttrs).forEach(([name, val]) => {
        if (val !== null && val !== undefined) {
          element.setAttribute(name, String(val));
        } else {
          element.removeAttribute(name);
        }
      });
    } else {
      if (value !== null && value !== undefined) {
        element.setAttribute(nameOrAttrs, String(value));
      } else {
        element.removeAttribute(nameOrAttrs);
      }
    }
  };

  // Direct element getter
  if (args.length === 2 && isElement(args[0]) && typeof args[1] === "string" && args[2] === undefined) {
    const [element, name] = args;
    return element.getAttribute(name);
  }

  // Direct element setter
  if (isElement(args[0])) {
    const [element, nameOrAttrs, value] = args;
    applyAttrs(element, nameOrAttrs, value);
    return;
  }

  // CSS selector getter
  if (args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string" && !isInGeneratorContext()) {
    const [selector, name] = args;
    const element = document.querySelector(String(selector));
    return element ? element.getAttribute(name) : null;
  }

  // CSS selector setter
  if (args.length >= 2 && typeof args[0] === "string" && looksLikeSelector(args[0])) {
    const [selector, nameOrAttrs, value] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      applyAttrs(el, nameOrAttrs, value);
    });
    return;
  }

  // Generator setter with object
  if (args.length === 1 && typeof args[0] === "object") {
    const [attrs] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        applyAttrs(context.element, attrs);
      }) as Operation<void>;
    })();
  }

  // Generator setter with name/value
  if (args.length === 2) {
    const [name, value] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        applyAttrs(context.element, name, value);
      }) as Operation<void>;
    })();
  }

  // Generator getter
  if (args.length === 1 && typeof args[0] === "string") {
    const [name] = args;
    return (function* (): Generator<Operation<string | null>, string | null, any> {
      const result = yield ((context: WatchContext) => {
        return context.element.getAttribute(name);
      }) as Operation<string | null>;
      return result;
    })();
  }

  throw new Error(`Invalid arguments for attr(): ${args.length} arguments provided`);
}

export function removeAttr(element: HTMLElement, ...names: string[]): void;
export function removeAttr(selector: string | CSSSelector, ...names: string[]): void;
export function removeAttr(...names: string[]): Workflow<void>;

export function removeAttr(...args: any[]): any {
  // Direct element manipulation
  if (args.length >= 1 && isElement(args[0])) {
    const [element, ...names] = args;
    names.forEach(name => element.removeAttribute(name));
    return;
  }

  // CSS selector manipulation
  if (args.length >= 2 && typeof args[0] === "string" && looksLikeSelector(args[0])) {
    const [selector, ...names] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      names.forEach(name => el.removeAttribute(name));
    });
    return;
  }

  // Generator pattern
  const names = args;
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      names.forEach((name: string) => context.element.removeAttribute(name));
    }) as Operation<void>;
  })();
}

export function hasAttr(element: HTMLElement, name: string): boolean;
export function hasAttr(selector: string | CSSSelector, name: string): boolean;
export function hasAttr(name: string): Workflow<boolean>;

export function hasAttr(...args: any[]): any {
  // Direct element check
  if (args.length === 2 && isElement(args[0])) {
    const [element, name] = args;
    return element.hasAttribute(name);
  }

  // CSS selector check
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, name] = args;
    const element = document.querySelector(String(selector));
    if (!element) return false;
    return element.hasAttribute(name);
  }

  // Generator pattern
  if (args.length === 1) {
    const [name] = args;
    return (function* (): Generator<Operation<boolean>, boolean, any> {
      const result = yield ((context: WatchContext) => {
        return context.element.hasAttribute(name);
      }) as Operation<boolean>;
      return result;
    })();
  }

  throw new Error(`Invalid arguments for hasAttr(): ${args.length} arguments provided`);
}

// ============================================================================
// Property Functions
// ============================================================================

export function prop<T = any>(element: HTMLElement, name: string): T;
export function prop<T = any>(element: HTMLElement, name: string, value: T): void;
export function prop<T = any>(element: HTMLElement, props: DataObject): void;
export function prop<T = any>(selector: string | CSSSelector, name: string): T | null;
export function prop<T = any>(selector: string | CSSSelector, name: string, value: T): void;
export function prop<T = any>(selector: string | CSSSelector, props: DataObject): void;
export function prop<T = any>(name: string, value: T): Workflow<void>;
export function prop(props: DataObject): Workflow<void>;
export function prop<T = any>(name: string): Workflow<T>;

export function prop(...args: any[]): any {
  const applyProps = (element: HTMLElement, nameOrProps: DataObject | string, value?: any) => {
    if (typeof nameOrProps === "object") {
      Object.entries(nameOrProps).forEach(([name, val]) => {
        (element as any)[name] = val;
      });
    } else {
      (element as any)[nameOrProps] = value;
    }
  };

  // Direct element getter
  if (args.length === 2 && isElement(args[0]) && typeof args[1] === "string" && args[2] === undefined) {
    const [element, name] = args;
    return (element as any)[name];
  }

  // Direct element setter
  if (isElement(args[0])) {
    const [element, nameOrProps, value] = args;
    applyProps(element, nameOrProps, value);
    return;
  }

  // CSS selector getter
  if (args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string" && !isInGeneratorContext()) {
    const [selector, name] = args;
    const element = document.querySelector(String(selector));
    return element ? (element as any)[name] : null;
  }

  // CSS selector setter
  if (args.length >= 2 && typeof args[0] === "string" && looksLikeSelector(args[0])) {
    const [selector, nameOrProps, value] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      applyProps(el, nameOrProps, value);
    });
    return;
  }

  // Generator setter with object
  if (args.length === 1 && typeof args[0] === "object") {
    const [props] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        applyProps(context.element, props);
      }) as Operation<void>;
    })();
  }

  // Generator setter with name/value
  if (args.length === 2) {
    const [name, value] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        applyProps(context.element, name, value);
      }) as Operation<void>;
    })();
  }

  // Generator getter
  if (args.length === 1 && typeof args[0] === "string") {
    const [name] = args;
    return (function* (): Generator<Operation<any>, any, any> {
      const result = yield ((context: WatchContext) => {
        return (context.element as any)[name];
      }) as Operation<any>;
      return result;
    })();
  }

  throw new Error(`Invalid arguments for prop(): ${args.length} arguments provided`);
}

// ============================================================================
// Data Attribute Functions
// ============================================================================

export function data<T = any>(element: HTMLElement, key: string): T | undefined;
export function data<T = any>(element: HTMLElement, key: string, value: T): void;
export function data<T = any>(element: HTMLElement, data: DataObject): void;
export function data<T = any>(selector: string | CSSSelector, key: string): T | undefined;
export function data<T = any>(selector: string | CSSSelector, key: string, value: T): void;
export function data<T = any>(selector: string | CSSSelector, data: DataObject): void;
export function data<T = any>(key: string, value: T): Workflow<void>;
export function data(data: DataObject): Workflow<void>;
export function data<T = any>(key: string): Workflow<T | undefined>;

export function data(...args: any[]): any {
  const applyData = (element: HTMLElement, keyOrData: DataObject | string, value?: any) => {
    if (typeof keyOrData === "object") {
      Object.entries(keyOrData).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          element.dataset[key] = String(val);
        } else {
          delete element.dataset[key];
        }
      });
    } else {
      if (value !== null && value !== undefined) {
        element.dataset[keyOrData] = String(value);
      } else {
        delete element.dataset[keyOrData];
      }
    }
  };

  // Direct element getter
  if (args.length === 2 && isElement(args[0]) && typeof args[1] === "string" && args[2] === undefined) {
    const [element, key] = args;
    return element.dataset[key];
  }

  // Direct element setter
  if (isElement(args[0])) {
    const [element, keyOrData, value] = args;
    applyData(element, keyOrData, value);
    return;
  }

  // CSS selector getter
  if (args.length === 2 && typeof args[0] === "string" && typeof args[1] === "string" && !isInGeneratorContext()) {
    const [selector, key] = args;
    const element = document.querySelector(String(selector));
    return element instanceof HTMLElement ? element.dataset[key] : undefined;
  }

  // CSS selector setter
  if (args.length >= 2 && typeof args[0] === "string" && looksLikeSelector(args[0])) {
    const [selector, keyOrData, value] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      applyData(el, keyOrData, value);
    });
    return;
  }

  // Generator setter with object
  if (args.length === 1 && typeof args[0] === "object") {
    const [data] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        applyData(context.element, data);
      }) as Operation<void>;
    })();
  }

  // Generator setter with key/value
  if (args.length === 2) {
    const [key, value] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        applyData(context.element, key, value);
      }) as Operation<void>;
    })();
  }

  // Generator getter
  if (args.length === 1 && typeof args[0] === "string") {
    const [key] = args;
    return (function* (): Generator<Operation<string | undefined>, string | undefined, any> {
      const result = yield ((context: WatchContext) => {
        return context.element.dataset[key];
      }) as Operation<string | undefined>;
      return result;
    })();
  }

  throw new Error(`Invalid arguments for data(): ${args.length} arguments provided`);
}

// Continue in next part due to length...
