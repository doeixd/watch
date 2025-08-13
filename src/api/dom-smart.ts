/**
 * Smart DOM API Implementation with Automatic Pattern Detection
 *
 * This module implements DOM manipulation functions that automatically detect
 * and support multiple API patterns, now simplified for sync-by-default with
 * yield* pattern support.
 */

import type { ElementFn, Workflow, WatchContext, Operation } from "../types";

import { getCurrentContext } from "../core/context";

// ============================================================================
// Pattern Detection Utilities
// ============================================================================

/**
 * Check if a value looks like a CSS selector
 */
function isCSSSelector(value: unknown): value is string {
  if (typeof value !== "string") return false;

  // Common CSS selector patterns
  const selectorPatterns = [
    /^[#.]/, // Starts with # or .
    /^[a-z]/i, // Starts with tag name
    /[\s>+~]/, // Contains combinators
    /\[.*\]/, // Contains attribute selector
    /:[a-z]/i, // Contains pseudo-class
  ];

  return selectorPatterns.some((pattern) => pattern.test(value));
}

/**
 * Check if a value is an HTML element
 */
function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * Check if we're in a generator context
 */
function isInGeneratorContext(): boolean {
  return getCurrentContext() !== null;
}

// ============================================================================
// Text Function - Smart Implementation
// ============================================================================

/**
 * Smart text() function that supports all API patterns:
 * 1. Direct element: text(element, 'content')
 * 2. CSS selector: text('#id', 'content')
 * 3. Generator with yield: yield text('content')
 * 4. Generator with yield*: yield* text('content')
 */

// Direct element manipulation
export function text(element: HTMLElement, content: string): void;
// CSS selector manipulation
export function text(selector: string, content: string): void;
// Generator pattern - returns Workflow for yield*
export function text(content: string): Workflow<void>;
// Getter pattern - returns current text
export function text(): Workflow<string>;

export function text(...args: any[]): any {
  // Case 1: Direct element manipulation - text(element, content)
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, content] = args;
    element.textContent = String(content);
    return;
  }

  // Case 2: CSS selector manipulation - text(selector, content)
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, content] = args;
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.textContent = String(content);
      }
    });
    return;
  }

  // Case 3 & 4: Generator patterns
  if (isInGeneratorContext() || args.length <= 1) {
    // Setter - text(content)
    if (args.length === 1) {
      const [content] = args;
      return (function* (): Generator<Operation<void>, void, any> {
        yield ((context: WatchContext) => {
          context.element.textContent = String(content);
        }) as Operation<void>;
      })();
    }

    // Getter - text()
    if (args.length === 0) {
      return (function* (): Generator<Operation<string>, string, any> {
        const result = yield ((context: WatchContext) => {
          return context.element.textContent || "";
        }) as Operation<string>;
        return result;
      })();
    }
  }

  throw new Error(
    `Invalid arguments for text(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// AddClass Function - Smart Implementation
// ============================================================================

export function addClass(element: HTMLElement, className: string): void;
export function addClass(selector: string, className: string): void;
export function addClass(className: string): Workflow<void>;

export function addClass(...args: any[]): any {
  // Direct element manipulation
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, className] = args;
    const classes = String(className).split(/\s+/).filter(Boolean);
    element.classList.add(...classes);
    return;
  }

  // CSS selector manipulation
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, className] = args;
    const classes = String(className).split(/\s+/).filter(Boolean);
    document.querySelectorAll(selector).forEach((el) => {
      if (el instanceof HTMLElement) {
        el.classList.add(...classes);
      }
    });
    return;
  }

  // Generator pattern
  if (args.length === 1) {
    const [className] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        const classes = String(className).split(/\s+/).filter(Boolean);
        context.element.classList.add(...classes);
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for addClass(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// RemoveClass Function
// ============================================================================

export function removeClass(element: HTMLElement, className: string): void;
export function removeClass(selector: string, className: string): void;
export function removeClass(className: string): Workflow<void>;

export function removeClass(...args: any[]): any {
  // Direct element manipulation
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, className] = args;
    const classes = String(className).split(/\s+/).filter(Boolean);
    element.classList.remove(...classes);
    return;
  }

  // CSS selector manipulation
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, className] = args;
    const classes = String(className).split(/\s+/).filter(Boolean);
    document.querySelectorAll(selector).forEach((el) => {
      if (el instanceof HTMLElement) {
        el.classList.remove(...classes);
      }
    });
    return;
  }

  // Generator pattern
  if (args.length === 1) {
    const [className] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        const classes = String(className).split(/\s+/).filter(Boolean);
        context.element.classList.remove(...classes);
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for removeClass(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Style Function - Smart Implementation with Object Support
// ============================================================================

type StyleValue = string | number | null;
type StyleObject = Record<string, StyleValue>;

export function style(
  element: HTMLElement,
  prop: string,
  value: StyleValue,
): void;
export function style(element: HTMLElement, styles: StyleObject): void;
export function style(selector: string, prop: string, value: StyleValue): void;
export function style(selector: string, styles: StyleObject): void;
export function style(prop: string, value: StyleValue): Workflow<void>;
export function style(styles: StyleObject): Workflow<void>;

export function style(...args: any[]): any {
  const applyStyles = (
    element: HTMLElement,
    styles: StyleObject | string,
    value?: StyleValue,
  ) => {
    if (typeof styles === "object") {
      Object.entries(styles).forEach(([prop, val]) => {
        if (val !== null) {
          (element.style as any)[prop] = String(val);
        } else {
          (element.style as any)[prop] = "";
        }
      });
    } else {
      if (value !== null && value !== undefined) {
        (element.style as any)[styles] = String(value);
      } else {
        (element.style as any)[styles] = "";
      }
    }
  };

  // Direct element manipulation
  if (isHTMLElement(args[0])) {
    const [element, propOrStyles, value] = args;
    applyStyles(element, propOrStyles, value);
    return;
  }

  // CSS selector manipulation
  if (
    args.length >= 2 &&
    typeof args[0] === "string" &&
    isCSSSelector(args[0])
  ) {
    const [selector, propOrStyles, value] = args;
    document.querySelectorAll(selector).forEach((el) => {
      if (el instanceof HTMLElement) {
        applyStyles(el, propOrStyles, value);
      }
    });
    return;
  }

  // Generator pattern
  const [propOrStyles, value] = args;
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      applyStyles(context.element, propOrStyles, value);
    }) as Operation<void>;
  })();
}

// ============================================================================
// State Management - Smart Implementation
// ============================================================================

export function setState<T>(key: string, value: T): Workflow<void>;
export function setState<T>(...args: any[]): any {
  const [key, value] = args;
  return (function* (): Generator<Operation<void>, void, any> {
    yield ((context: WatchContext) => {
      if (!context.state) {
        (context as any).state = new Map();
      }
      context.state.set(key, value);
    }) as Operation<void>;
  })();
}

export function getState<T>(key: string, defaultValue?: T): Workflow<T>;
export function getState<T>(...args: any[]): any {
  const [key, defaultValue] = args;
  return (function* (): Generator<Operation<T>, T, any> {
    const result = yield ((context: WatchContext) => {
      if (!context.state) {
        return defaultValue;
      }
      return context.state.has(key) ? context.state.get(key) : defaultValue;
    }) as Operation<T>;
    return result;
  })();
}

// ============================================================================
// Event Handling - Smart Implementation
// ============================================================================

type EventHandler = (event: Event) => void | Generator<any, void, any>;

export function click(element: HTMLElement, handler: EventHandler): void;
export function click(selector: string, handler: EventHandler): void;
export function click(handler: EventHandler): Workflow<void>;

export function click(...args: any[]): any {
  const attachHandler = (element: HTMLElement, handler: EventHandler) => {
    element.addEventListener("click", (event) => {
      const result = handler(event);
      if (result && typeof result === "object" && Symbol.iterator in result) {
        // Execute sync generator
        const gen = result as Generator<any, void, any>;
        let genResult = gen.next();
        while (!genResult.done) {
          // If yielded value is a function, execute it with the element
          if (typeof genResult.value === "function") {
            genResult.value(element);
          }
          genResult = gen.next();
        }
      }
    });
  };

  // Direct element manipulation
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, handler] = args;
    attachHandler(element, handler);
    return;
  }

  // CSS selector manipulation
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, handler] = args;
    document.querySelectorAll(selector).forEach((el) => {
      if (el instanceof HTMLElement) {
        attachHandler(el, handler);
      }
    });
    return;
  }

  // Generator pattern
  if (args.length === 1) {
    const [handler] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        context.element.addEventListener("click", (event) => {
          const result = handler(event);
          if (
            result &&
            typeof result === "object" &&
            Symbol.iterator in result
          ) {
            // Execute generator with context
            const gen = result as Generator<any, void, any>;
            let genResult = gen.next();
            while (!genResult.done) {
              if (typeof genResult.value === "function") {
                genResult.value(context);
              }
              genResult = gen.next();
            }
          }
        });
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for click(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// HTML Function
// ============================================================================

export function html(element: HTMLElement, content: string): void;
export function html(selector: string, content: string): void;
export function html(content: string): Workflow<void>;
export function html(): Workflow<string>;

export function html(...args: any[]): any {
  // Direct element manipulation
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, content] = args;
    element.innerHTML = String(content);
    return;
  }

  // CSS selector manipulation
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, content] = args;
    document.querySelectorAll(selector).forEach((el) => {
      if (el instanceof HTMLElement) {
        el.innerHTML = String(content);
      }
    });
    return;
  }

  // Generator setter pattern
  if (args.length === 1) {
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

  throw new Error(
    `Invalid arguments for html(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Attr Function
// ============================================================================

export function attr(element: HTMLElement, name: string, value: string): void;
export function attr(selector: string, name: string, value: string): void;
export function attr(name: string, value: string): Workflow<void>;
export function attr(name: string): Workflow<string | null>;

export function attr(...args: any[]): any {
  // Direct element manipulation
  if (args.length === 3 && isHTMLElement(args[0])) {
    const [element, name, value] = args;
    element.setAttribute(String(name), String(value));
    return;
  }

  // CSS selector manipulation
  if (args.length === 3 && typeof args[0] === "string") {
    const [selector, name, value] = args;
    document.querySelectorAll(selector).forEach((el) => {
      if (el instanceof HTMLElement) {
        el.setAttribute(String(name), String(value));
      }
    });
    return;
  }

  // Generator setter pattern
  if (args.length === 2) {
    const [name, value] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        context.element.setAttribute(String(name), String(value));
      }) as Operation<void>;
    })();
  }

  // Generator getter pattern
  if (args.length === 1) {
    const [name] = args;
    return (function* (): Generator<
      Operation<string | null>,
      string | null,
      any
    > {
      const result = yield ((context: WatchContext) => {
        return context.element.getAttribute(String(name));
      }) as Operation<string | null>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for attr(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Exports
// ============================================================================

export default {
  text,
  html,
  addClass,
  removeClass,
  style,
  attr,
  setState,
  getState,
  click,
};
