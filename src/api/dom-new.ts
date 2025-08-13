/**
 * DOM API Implementation with Sync Generators and Branded Types
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
  type CSSSelector,
  type ClassName,
} from "../utils/selector-types";

// ============================================================================
// Type Definitions
// ============================================================================

// More specific style value types with literal types for common CSS values
type CSSLengthUnit =
  | "px"
  | "em"
  | "rem"
  | "%"
  | "vh"
  | "vw"
  | "vmin"
  | "vmax"
  | "ch"
  | "ex"
  | "cm"
  | "mm"
  | "in"
  | "pt"
  | "pc";
type CSSLength =
  | `${number}${CSSLengthUnit}`
  | number
  | "0"
  | "auto"
  | "inherit"
  | "initial"
  | "unset";
type CSSColor =
  | `#${string}`
  | `rgb(${string})`
  | `rgba(${string})`
  | `hsl(${string})`
  | `hsla(${string})`
  | "transparent"
  | "currentColor"
  | "inherit";

type StyleValue = string | number | null | undefined;
type StyleObject<
  K extends keyof CSSStyleDeclaration = keyof CSSStyleDeclaration,
> = {
  [P in K]?: CSSStyleDeclaration[P] | StyleValue;
};
type AttributeObject = Record<
  string,
  string | number | boolean | null | undefined
>;
type DataObject<T = any> = Record<string, T>;

// Type-safe style properties with autocomplete
type CSSStyleProperties = Partial<CSSStyleDeclaration>;

// Better display value types
type DisplayValue =
  | "none"
  | "block"
  | "inline"
  | "inline-block"
  | "flex"
  | "inline-flex"
  | "grid"
  | "inline-grid"
  | "table"
  | "table-row"
  | "table-cell"
  | "contents"
  | "list-item"
  | "run-in";

// Position types
type PositionValue = "static" | "relative" | "absolute" | "fixed" | "sticky";

// More specific element types for better inference
type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type FocusableElement = HTMLElement & { focus(): void; blur(): void };
type ValueElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement
  | HTMLOutputElement;

// Generic constraint for element queries with better type narrowing
type ElementConstraint = Element | HTMLElement | SVGElement;
type HTMLElementConstraint =
  | HTMLElement
  | HTMLDivElement
  | HTMLSpanElement
  | HTMLButtonElement
  | HTMLInputElement;
type QueryConstraint<T = Element> = T extends Element ? T : Element;

// Strict element type mapping for better inference
type StrictElementMap<K extends keyof HTMLElementTagNameMap> =
  HTMLElementTagNameMap[K];
type StrictSVGElementMap<K extends keyof SVGElementTagNameMap> =
  SVGElementTagNameMap[K];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard: Check if a value is an HTML element with generic constraint
 */
function isHTMLElement<T extends HTMLElement = HTMLElement>(
  value: unknown,
  tagName?: keyof HTMLElementTagNameMap,
): value is T {
  if (!(value instanceof HTMLElement)) return false;
  if (
    tagName &&
    (value as HTMLElement).tagName.toLowerCase() !== tagName.toLowerCase()
  ) {
    return false;
  }
  return true;
}

/**
 * Type guard for specific HTML element types
 */
// Removed unused isSpecificHTMLElement function

/**
 * Type guard: Check if a value is an Element with generic constraint
 */
function isElement<T extends Element = Element>(
  value: unknown,
  tagName?: keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap,
): value is T {
  if (!(value instanceof Element)) return false;
  if (tagName && value.tagName.toLowerCase() !== tagName.toLowerCase()) {
    return false;
  }
  return true;
}

// Removed unused isNode and isDocument functions

/**
 * Type guard: Check if element can receive focus
 */
function isFocusable(element: unknown): element is FocusableElement {
  return (
    element instanceof HTMLElement &&
    typeof (element as any).focus === "function" &&
    typeof (element as any).blur === "function"
  );
}

/**
 * Type guard: Check if element has a value property
 */
function hasValue(element: unknown): element is ValueElement {
  return (
    element instanceof HTMLElement &&
    "value" in element &&
    (element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement ||
      element instanceof HTMLOutputElement)
  );
}

// Removed unused isFormControl function

/**
 * Check if we're in a generator context
 */
function isInGeneratorContext(): boolean {
  return getCurrentContext() !== null;
}

/**
 * Resolve elements from a selector string with generic type support
 */
function resolveElements<T extends Element = HTMLElement>(
  selector: string,
  root: Element | Document = document,
): T[] {
  const elements: T[] = [];
  root.querySelectorAll(selector).forEach((el) => {
    elements.push(el as T);
  });
  return elements;
}

// Removed unused resolveElementsStrict function

/**
 * Resolve single element with generic type support
 */
function resolveElement<T extends Element = HTMLElement>(
  selector: string,
  root: Element | Document = document,
): T | null {
  const element = root.querySelector(selector);
  return element as T | null;
}

// Removed unused resolveElementSafe function

// Removed unused queryElement and queryElements functions

/**
 * Enhanced selector detection with better heuristics
 */
function looksLikeSelector(value: unknown): boolean {
  if (typeof value !== "string") return false;

  // Use our improved heuristic from selector-types
  return isCSSSelector(value);
}

// ============================================================================
// Text Function
// ============================================================================

/**
 * Sets or gets text content of elements with full type safety and multiple usage patterns.
 *
 * This function provides a unified API for text manipulation that works in three distinct patterns:
 * 1. Direct element manipulation - Pass an element directly
 * 2. CSS selector targeting - Use a selector string to find and modify elements
 * 3. Generator context - Use within watch() generators with yield
 *
 * @example Direct element manipulation
 * ```typescript
 * const button = document.querySelector('button');
 * // Set text
 * text(button, 'Click me');
 * // Get text
 * const content = text(button); // returns string
 * ```
 *
 * @example CSS selector pattern
 * ```typescript
 * // Set text for all matching elements
 * text('.button', 'Click me');
 * // Get text from first matching element
 * const content = text('.button'); // returns string | null
 * ```
 *
 * @example Generator context with yield
 * ```typescript
 * import { watch, text } from 'watch-selector';
 *
 * watch('.dynamic-content', function* () {
 *   // Set text
 *   yield text('Loading...');
 *
 *   // Get current text
 *   const current = yield text();
 *   console.log('Current text:', current);
 *
 *   // Update with dynamic content
 *   yield text(`Loaded at ${new Date().toLocaleTimeString()}`);
 * });
 * ```
 *
 * @example With template literals and variables
 * ```typescript
 * text('button', 'Click me');
 * ```
 *
 * @example Generator pattern
 * ```typescript
 * watch('button', function* () {
 *   yield* text('Click me');
 *   const content = yield* text();
 * });
 * ```
 */
export function text(element: HTMLElement, content: string | number): void;
export function text(selector: string, content: string | number): void;
export function text(selector: CSSSelector, content: string | number): void;
export function text<T extends HTMLElement = HTMLElement>(
  element: T,
  content: string | number,
): void;
export function text<T extends HTMLElement = HTMLElement>(element: T): string;
export function text(
  selector: string | CSSSelector,
  content: string | number,
): void;
export function text(selector: string | CSSSelector): string | null;
export function text(content: string | number): Workflow<void>;
export function text(): Workflow<string>;

export function text<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  // Direct element manipulation setter
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, content] = args as [T, string | number];
    element.textContent = String(content);
    return;
  }

  // Direct element manipulation getter
  if (args.length === 1 && isHTMLElement(args[0])) {
    const [element] = args as [T];
    return element.textContent || "";
  }

  // CSS selector manipulation setter
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, content] = args as [string, string | number];
    const elements = resolveElements<HTMLElement>(String(selector));
    elements.forEach((el) => {
      el.textContent = String(content);
    });
    return;
  }

  // CSS selector manipulation getter
  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    !isInGeneratorContext()
  ) {
    const [selector] = args as [string];
    const element = resolveElement<HTMLElement>(String(selector));
    return element ? element.textContent || "" : null;
  }

  // Generator setter pattern - returns sync Workflow
  if (args.length === 1) {
    const [content] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        context.element.textContent = String(content);
      }) as Operation<void>;
    })();
  }

  // Generator getter pattern - returns sync Workflow
  if (args.length === 0) {
    return (function* (): Generator<Operation<string>, string, any> {
      const result = yield ((context: WatchContext) => {
        return context.element.textContent || "";
      }) as Operation<string>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for text(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// HTML Function
// ============================================================================

/**
 * Sets or gets HTML content of elements with full type safety.
 *
 * ⚠️ WARNING: Setting HTML content can expose your application to XSS attacks.
 * Always sanitize user input before using it as HTML content.
 *
 * @example Direct element manipulation
 * ```typescript
 * const container = document.querySelector('.content');
 * // Set HTML (be careful with user input!)
 * html(container, '<strong>Bold text</strong>');
 * // Get HTML
 * const markup = html(container); // returns string
 * ```
 *
 * @example CSS selector pattern
 * ```typescript
 * // Set HTML for all matching elements
 * html('.card-body', '<p>Card content</p>');
 * // Get HTML from first matching element
 * const markup = html('.card-body'); // returns string | null
 * ```
 *
 * @example Generator context
 * ```typescript
 * import { watch, html } from 'watch-selector';
 *
 * watch('.markdown-output', function* () {
 *   yield html('<p>Rendering...</p>');
 *
 *   // Fetch and render markdown
 *   const response = await fetch('/api/content');
 *   const rendered = await response.text();
 *
 *   // ⚠️ Only use with trusted content!
 *   yield html(rendered);
 * });
 * ```
 *
 * @param element - The element to manipulate (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param content - HTML content to set (optional, if not provided, gets content)
 * @returns void when setting, string when getting, or Workflow in generator context
 */

export function html<T extends HTMLElement = HTMLElement>(
  element: T,
  content: string,
): void;
export function html<T extends HTMLElement = HTMLElement>(element: T): string;
export function html(selector: string | CSSSelector, content: string): void;
export function html(selector: string | CSSSelector): string | null;
export function html(content: string): Workflow<void>;
export function html(): Workflow<string>;

export function html<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  // Direct element manipulation setter
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, content] = args as [T, string];
    element.innerHTML = String(content);
    return;
  }

  // Direct element manipulation getter
  if (args.length === 1 && isHTMLElement(args[0])) {
    const [element] = args as [T];
    return element.innerHTML;
  }

  // CSS selector manipulation setter
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, content] = args as [string, string];
    const elements = resolveElements<HTMLElement>(String(selector));
    elements.forEach((el) => {
      el.innerHTML = String(content);
    });
    return;
  }

  // CSS selector manipulation getter
  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    !isInGeneratorContext()
  ) {
    const [selector] = args as [string];
    const element = resolveElement<HTMLElement>(String(selector));
    return element ? element.innerHTML : null;
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
// Class Functions
// ============================================================================

/**
 * Adds one or more CSS classes to elements with intelligent deduplication.
 *
 * Supports space-separated class names and automatically handles duplicates.
 * Classes are only added if they don't already exist on the element.
 *
 * @param element - HTMLElement to add classes to (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param className - Single class or space-separated classes to add
 * @returns void for direct/selector patterns, Workflow for generator pattern
 *
 * @example Adding classes in generators with yield*
 * ```typescript
 * import { watch, addClass, click } from 'watch-selector';
 *
 * watch('.card', function* () {
 *   // Add single class
 *   yield* addClass('interactive');
 *
 *   // Add multiple classes at once
 *   yield* addClass('shadow-lg rounded bordered');
 *
 *   yield* click(function* () {
 *     // Add state classes reactively
 *     yield* addClass('selected highlighted');
 *   });
 * });
 * ```
 *
 * @example Conditional class addition
 * ```typescript
 * watch('.notification', function* () {
 *   const type = yield* getState('type', 'info');
 *
 *   // Add classes based on state
 *   yield* addClass('notification');
 *   yield* addClass(`notification-${type}`);
 *
 *   if (type === 'error') {
 *     yield* addClass('urgent shake-animation');
 *   }
 * });
 * ```
 *
 * @example Animation and transition classes
 * ```typescript
 * watch('.modal', function* () {
 *   // Prepare for animation
 *   yield* addClass('modal-base');
 *
 *   // Trigger animation after a frame
 *   yield* onMount(function* () {
 *     requestAnimationFrame(() => {
 *       yield* addClass('fade-in slide-up');
 *     });
 *   });
 * });
 * ```
 */
// Class manipulation with generics
export function addClass<T extends Element = HTMLElement>(
  element: T,
  className: string | ClassName,
): void;
export function addClass<T extends Element = HTMLElement>(
  selector: string | CSSSelector,
  className: string | ClassName,
): void;
export function addClass(className: string | ClassName): Workflow<void>;

export function addClass<T extends Element = HTMLElement>(...args: any[]): any {
  // Direct element manipulation
  if (args.length === 2 && isElement(args[0])) {
    const [element, className] = args as [T, string | ClassName];
    const classes = String(className).split(/\s+/).filter(Boolean);
    element.classList.add(...classes);
    return;
  }

  // CSS selector manipulation
  if (args.length === 2 && looksLikeSelector(args[0])) {
    const [selector, className] = args as [
      string | CSSSelector,
      string | ClassName,
    ];
    const classes = String(className).split(/\s+/).filter(Boolean);
    const elements = resolveElements<T>(String(selector));
    elements.forEach((el) => {
      el.classList.add(...classes);
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

/**
 * Removes one or more CSS classes from elements.
 *
 * Supports space-separated class names and safely handles non-existent classes.
 *
 * @example Direct element manipulation
 * ```typescript
 * const modal = document.querySelector('.modal');
 * // Remove single class
 * removeClass(modal, 'hidden');
 * // Remove multiple classes
 * removeClass(modal, 'hidden fade-out disabled');
 * ```
 *
 * @example CSS selector pattern
 * ```typescript
 * // Remove classes from all matching elements
 * removeClass('.error-field', 'error highlighted');
 * // Clear loading states
 * removeClass('.loading', 'loading spinner');
 * ```
 *
 * @example Generator context
 * ```typescript
 * import { watch, removeClass, addClass, delay } from 'watch-selector';
 *
 * watch('.notification', function* () {
 *   yield addClass('visible slide-in');
 *   yield delay(3000);
 *   yield removeClass('visible');
 *   yield addClass('slide-out');
 * });
 * ```
 *
 * @param element - The element to remove classes from (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param className - Space-separated class names to remove
 * @returns void when used directly, Workflow in generator context
 */
/**
 * Removes one or more CSS classes from elements.
 *
 * Supports space-separated class names and safely handles non-existent classes.
 * No error is thrown if a class doesn't exist on the element.
 *
 * @param element - HTMLElement to remove classes from (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param className - Single class or space-separated classes to remove
 * @returns void for direct/selector patterns, Workflow for generator pattern
 *
 * @example Removing classes with yield* in generators
 * ```typescript
 * import { watch, removeClass, addClass, click } from 'watch-selector';
 *
 * watch('.toggle-button', function* () {
 *   yield* click(function* () {
 *     // Remove multiple classes at once
 *     yield* removeClass('inactive disabled');
 *     yield* addClass('active enabled');
 *   });
 * });
 * ```
 *
 * @example State transitions with class swapping
 * ```typescript
 * watch('.status-indicator', function* () {
 *   const status = yield* getState('status', 'pending');
 *
 *   // Clear all possible status classes
 *   yield* removeClass('status-pending status-loading status-success status-error');
 *
 *   // Add the current status class
 *   yield* addClass(`status-${status}`);
 * });
 * ```
 *
 * @example Animation cleanup
 * ```typescript
 * watch('.animated-element', function* () {
 *   yield* click(function* () {
 *     // Trigger animation
 *     yield* addClass('animating bounce');
 *
 *     // Clean up after animation completes
 *     setTimeout(() => {
 *       yield* removeClass('animating bounce');
 *       yield* addClass('animation-complete');
 *     }, 1000);
 *   });
 * });
 * ```
 */
export function removeClass<T extends Element = HTMLElement>(
  element: T,
  className: string | ClassName,
): void;
export function removeClass<T extends Element = HTMLElement>(
  selector: string | CSSSelector,
  className: string | ClassName,
): void;
export function removeClass(className: string | ClassName): Workflow<void>;

export function removeClass<T extends Element = HTMLElement>(
  ...args: any[]
): any {
  // Direct element manipulation
  if (args.length === 2 && isElement(args[0])) {
    const [element, className] = args as [T, string | ClassName];
    const classes = String(className).split(/\s+/).filter(Boolean);
    element.classList.remove(...classes);
    return;
  }

  // CSS selector manipulation
  if (args.length === 2 && looksLikeSelector(args[0])) {
    const [selector, className] = args as [
      string | CSSSelector,
      string | ClassName,
    ];
    const classes = String(className).split(/\s+/).filter(Boolean);
    const elements = resolveElements<T>(String(selector));
    elements.forEach((el) => {
      el.classList.remove(...classes);
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

/**
 * Sets or gets inline style properties on elements.
 *
 * Supports multiple usage patterns:
 * - Set single property: style(element, 'color', 'red')
 * - Set multiple properties: style(element, { color: 'red', fontSize: '16px' })
 * - Get property value: style(element, 'color')
 *
 * @example Direct element - setting styles
 * ```typescript
 * const box = document.querySelector('.box');
 * // Set single property
 * style(box, 'backgroundColor', '#ff0000');
 * style(box, 'padding', '20px');
 * // Set with number (adds 'px' for applicable properties)
 * style(box, 'width', 200); // becomes '200px'
 * // Set multiple properties at once
 *al force parameter.
 *
 * @example Direct element manipulation
 * ```typescript
 * const panel = document.querySelector('.panel');
 * // Toggle class
 * toggleClass(panel, 'expanded');
 * // Force add (true) or remove (false)
 * toggleClass(panel, 'active', isActive);
 * ```
 *
 * @example CSS selector pattern
 * ```typescript
 * // Toggle on all matching elements
 * toggleClass('.accordion-item', 'open');
 * // Force state based on condition
 * toggleClass('.menu', 'visible', window.innerWidth > 768);
 * ```
 *
 * @example Generator context
 * ```typescript
 * import { watch, toggleClass, click } from 'watch-selector';
 *
 * watch('.toggle-switch', function* () {
 *   yield click(function* () {
 *     yield toggleClass('on');
 *     const isOn = yield hasClass('on');
 *     console.log('Switch is:', isOn ? 'ON' : 'OFF');
 *   });
 * });
 * ```
 *
 * @param element - The element to toggle classes on (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param className - Space-separated class names to toggle
 * @param force - Optional: true to add, false to remove, undefined to toggle
 * @returns void when used directly, Workflow in generator context
 */
/**
 * Toggles CSS classes on elements with optional force flag.
 *
 * Intelligently adds or removes classes based on their current presence.
 * The optional force parameter allows explicit control over the operation.
 *
 * @param element - HTMLElement to toggle classes on (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param className - Single class or space-separated classes to toggle
 * @param force - If true, adds class; if false, removes class; if undefined, toggles
 * @returns void for direct/selector patterns, Workflow for generator pattern
 *
 * @example Basic toggle with yield* in generators
 * ```typescript
 * import { watch, toggleClass, click } from 'watch-selector';
 *
 * watch('.expandable', function* () {
 *   yield* click(function* () {
 *     // Toggle expanded state
 *     yield* toggleClass('expanded');
 *
 *     // Toggle multiple classes
 *     yield* toggleClass('open active highlighted');
 *   });
 * });
 * ```
 *
 * @example Forced toggle based on conditions
 * ```typescript
 * watch('.theme-toggle', function* () {
 *   yield* click(function* () {
 *     const isDark = yield* hasClass('dark-mode');
 *
 *     // Force toggle based on current state
 *     yield* toggleClass('dark-mode', !isDark);
 *     yield* toggleClass('light-mode', isDark);
 *   });
 * });
 * ```
 *
 * @example Accordion behavior with toggles
 * ```typescript
 * watch('.accordion-item', function* () {
 *   yield* click(function* () {
 *     // Close all other items
 *     const siblings = yield* siblings();
 *     for (const sibling of siblings) {
 *       toggleClass(sibling, 'expanded', false);
 *     }
 *
 *     // Toggle current item
 *     yield* toggleClass('expanded');
 *   });
 * });
 * ```
 */
export function toggleClass<T extends Element = HTMLElement>(
  element: T,
  className: string | ClassName,
  force?: boolean,
): void;
export function toggleClass(
  selector: string | CSSSelector,
  className: string | ClassName,
  force?: boolean,
): void;
export function toggleClass(
  className: string | ClassName,
  force?: boolean,
): Workflow<void>;

export function toggleClass(...args: any[]): any {
  // Direct element manipulation
  if ((args.length === 2 || args.length === 3) && isHTMLElement(args[0])) {
    const [element, className, force] = args;
    const classes = String(className).split(/\s+/).filter(Boolean);
    classes.forEach((cls) => {
      element.classList.toggle(cls, force);
    });
    return;
  }

  // CSS selector manipulation
  if ((args.length === 2 || args.length === 3) && looksLikeSelector(args[0])) {
    const [selector, className, force] = args;
    const classes = String(className).split(/\s+/).filter(Boolean);
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      classes.forEach((cls) => {
        el.classList.toggle(cls, force);
      });
    });
    return;
  }

  // Generator pattern
  if (args.length === 1 || args.length === 2) {
    const [className, force] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        const classes = String(className).split(/\s+/).filter(Boolean);
        classes.forEach((cls) => {
          context.element.classList.toggle(cls, force);
        });
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for toggleClass(): ${args.length} arguments provided`,
  );
}

/**
 * Checks if an element has ALL specified CSS classes.
 *
 * Returns true only if the element contains every specified class.
 * For checking if element has ANY of the classes, use multiple calls.
 *
 * @example Direct element manipulation
 * ```typescript
 * const button = document.querySelector('button');
 * // Check single class
 * if (hasClass(button, 'active')) {
 *   console.log('Button is active');
 * }
 * // Check multiple classes (ALL must be present)
 * if (hasClass(button, 'primary large')) {
 *   console.log('Button is primary AND large');
 * }
 * ```
 *
 * @example CSS selector pattern
 * ```typescript
 * // Check first matching element
 * const isVisible = hasClass('.modal', 'visible');
 * // Check multiple classes
 * const isReady = hasClass('.component', 'initialized loaded');
 * ```
 *
 * @example Generator context
 * ```typescript
 * import { watch, hasClass, addClass, removeClass } from 'watch-selector';
 *
 * watch('.toggle-element', function* () {
 *   const wasActive = yield hasClass('active');
 *
 *   if (wasActive) {
 *     yield removeClass('active');
 *     yield addClass('inactive');
 *   } else {
 *     yield removeClass('inactive');
 *     yield addClass('active');
 *   }
 * });
 * ```
 *
 * @param element - The element to check (direct pattern)
 * @param selector - CSS selector to find element (selector pattern)
 * @param className - Space-separated class names to check for
 * @returns boolean indicating if ALL classes are present, or Workflow<boolean> in generator context
 */
export function hasClass(
  element: HTMLElement,
  className: string | ClassName,
): boolean;
/**
 * Checks if an element has a specific attribute.
 *
 * @example Direct element
 * ```typescript
 * const input = document.querySelector('input');
 * if (hasAttr(input, 'required')) {
 *   console.log('Field is required');
 * }
 * ```
 *
 * @example CSS selector pattern
 * ```typescript
 * const hasPlaceholder = hasAttr('input.search', 'placeholder');
 * const isDisabled = hasAttr('button.submit', 'disabled');
 * ```
 *
 * @example Generator context
 * ```typescript
 * import { watch, hasAttr, attr, addClass } from 'watch-selector';
 *
 * watch('input', function* () {
 *   if (yield hasAttr('required')) {
 *     yield addClass('required-field');
 *     yield attr('aria-required', 'true');
 *   }
 * });
 * ```
 *
 * @param element - The element to check (direct pattern)
 * @param selector - CSS selector to find element (selector pattern)
 * @param name - Attribute name to check for
 * @returns boolean indicating if attribute exists, Workflow<boolean> in generator context
 */
export function hasClass(
  selector: string | CSSSelector,
  className: string | ClassName,
): boolean;
export function hasClass(className: string | ClassName): Workflow<boolean>;

export function hasClass(...args: any[]): any {
  // Direct element check
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, className] = args;
    const classes = String(className).split(/\s+/).filter(Boolean);
    return classes.every((cls) => element.classList.contains(cls));
  }

  // CSS selector check (checks first element)
  if (args.length === 2 && looksLikeSelector(args[0])) {
    const [selector, className] = args;
    const element = document.querySelector(String(selector));
    if (!element || !(element instanceof HTMLElement)) return false;
    const classes = String(className).split(/\s+/).filter(Boolean);
    return classes.every((cls) => element.classList.contains(cls));
  }

  // Generator pattern
  if (args.length === 1) {
    const [className] = args;
    return (function* (): Generator<Operation<boolean>, boolean, any> {
      const result = yield ((context: WatchContext) => {
        const classes = String(className).split(/\s+/).filter(Boolean);
        return classes.every((cls) => context.element.classList.contains(cls));
      }) as Operation<boolean>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for hasClass(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Style Function
// ============================================================================

/**
 * Sets or gets CSS style properties on elements with type safety.
 *
 * Supports setting individual properties, multiple properties via object,
 * or getting computed style values. Automatically handles vendor prefixes
 * and unit conversion for numeric values.
 *
 * @example Direct element - single property
 * ```typescript
 * const div = document.querySelector('.box');
 * // Set single style
 * style(div, 'backgroundColor', 'red');
 * style(div, 'width', 100); // Automatically adds 'px'
 * style(div, 'opacity', 0.5);
 *
 * // Get computed style
 * const width = style(div, 'width'); // returns "100px"
 * ```
 *
 * @example Direct element - multiple properties
 * ```typescript
 * const panel = document.querySelector('.panel');
 * style(panel, {
 *   backgroundColor: '#f0f0f0',
 *   padding: 20,        // becomes '20px'
 *   borderRadius: '8px',
 *   opacity: 0.9,
 *   display: 'flex'
 * });
 * ```
 *
 * @example CSS selector pattern
 * ```typescript
 * // Style all matching elements
 * style('.card', 'boxShadow', '0 2px 4px rgba(0,0,0,0.1)');
 *
 * // Apply multiple styles
 * style('.highlighted', {
 *   backgroundColor: 'yellow',
 *   fontWeight: 'bold',
 *   padding: 10
 * });
 *
 * // Get style from first match
 * const bgColor = style('.card', 'backgroundColor');
 * ```
 *
 * @example Generator context with animations
 * ```typescript
 * import { watch, style, delay } from 'watch-selector';
 *
 * watch('.animate-box', function* () {
 *   // Fade in animation
 *   yield style('opacity', 0);
 *   yield style('transform', 'translateY(20px)');
 *
 *   yield delay(100);
 *
 *   yield style({
 *     opacity: 1,
 *     transform: 'translateY(0)',
 *     transition: 'all 0.3s ease'
 *   });
 * });
 * ```
 *
 * @example Responsive styling
 * ```typescript
 * import { watch, style, onResize } from 'watch-selector';
 *
 * watch('.responsive-element', function* () {
 *   yield onResize(function* (entry) {
 *     const width = entry.contentRect.width;
 *
 *     if (width < 600) {
 *       yield style({ fontSize: '14px', padding: '10px' });
 *     } else {
 *       yield style({ fontSize: '18px', padding: '20px' });
 *     }
 *   });
 * });
 * ```
 *
 * @param element - The element to style (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param prop - CSS property name (camelCase or kebab-case)
 * @param value - Style value (numbers auto-convert to px for applicable properties)
 * @param styles - Object of property-value pairs for multiple styles
 * @returns void when setting, string when getting, Workflow in generator context
 */
/**
 * Manipulates inline styles on elements with support for objects and individual properties.
 *
 * Handles CSS property names in both camelCase and kebab-case formats.
 * Automatically adds 'px' units to numeric values for applicable properties.
 * Setting a value to null or empty string removes the style property.
 *
 * @param element - HTMLElement to style (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param prop - CSS property name or object of property-value pairs
 * @param value - CSS value (string, number, or null to remove)
 * @returns void when setting, string when getting single property, Workflow for generators
 *
 * @example Setting styles with yield* in generators
 * ```typescript
 * import { watch, style, click } from 'watch-selector';
 *
 * watch('.animated-box', function* () {
 *   // Set single style property
 *   yield* style('background-color', '#3498db');
 *   yield* style('padding', 20); // Auto-adds 'px'
 *
 *   // Set multiple styles with object
 *   yield* style({
 *     width: 200,           // Becomes '200px'
 *     height: 100,          // Becomes '100px'
 *     backgroundColor: '#2ecc71',
 *     borderRadius: '8px',
 *     transition: 'all 0.3s ease'
 *   });
 * });
 * ```
 *
 * @example Dynamic styling based on state
 * ```typescript
 * watch('.progress-bar', function* () {
 *   const progress = yield* getState('progress', 0);
 *
 *   yield* style({
 *     width: `${progress}%`,
 *     backgroundColor: progress === 100 ? '#27ae60' : '#3498db',
 *     transition: 'width 0.5s ease'
 *   });
 *
 *   // Get computed style
 *   const currentWidth = yield* style('width');
 *   console.log('Current width:', currentWidth);
 * });
 * ```
 *
 * @example Animations with dynamic styles
 * ```typescript
 * watch('.floating-element', function* () {
 *   let position = 0;
 *
 *   yield* onMount(function* () {
 *     const animate = () => {
 *       position += 1;
 *       yield* style('transform', `translateY(${Math.sin(position * 0.1) * 10}px)`);
 *       requestAnimationFrame(animate);
 *     };
 *     animate();
 *   });
 * });
 * ```
 *
 * @example Removing styles
 * ```typescript
 * watch('.resettable', function* () {
 *   yield* click(function* () {
 *     // Remove specific styles by setting to null
 *     yield* style('backgroundColor', null);
 *     yield* style('border', '');
 *
 *     // Or remove multiple at once
 *     yield* style({
 *       width: null,
 *       height: null,
 *       position: null
 *     });
 *   });
 * });
 * ```
 */
// Style manipulation with better type inference
export function style<T extends HTMLElement = HTMLElement>(
  element: T,
  prop: keyof CSSStyleDeclaration | string,
  value: StyleValue,
): void;
export function style<T extends HTMLElement = HTMLElement>(
  element: T,
  styles: Partial<CSSStyleDeclaration> | StyleObject,
): void;
export function style<T extends HTMLElement = HTMLElement>(
  element: T,
  prop: keyof CSSStyleDeclaration | string,
): string;
export function style(
  selector: string | CSSSelector,
  prop: keyof CSSStyleDeclaration | string,
  value: StyleValue,
): void;
export function style(
  selector: string | CSSSelector,
  styles: Partial<CSSStyleDeclaration> | StyleObject,
): void;
export function style(
  selector: string | CSSSelector,
  prop: keyof CSSStyleDeclaration | string,
): string | null;
export function style(
  prop: keyof CSSStyleDeclaration | string,
  value: StyleValue,
): Workflow<void>;
export function style(
  styles: Partial<CSSStyleDeclaration> | StyleObject,
): Workflow<void>;
export function style(
  prop: keyof CSSStyleDeclaration | string,
): Workflow<string>;

export function style(...args: any[]): any {
  const applyStyles = <E extends HTMLElement>(
    element: E,
    propOrStyles: StyleObject | string,
    value?: StyleValue,
  ) => {
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

  // Direct element manipulation
  if (isHTMLElement(args[0])) {
    const [element, propOrStyles, value] = args;
    applyStyles(element, propOrStyles, value);
    return;
  }

  // CSS selector manipulation with 3 args (selector, prop, value)
  if (args.length === 3 && looksLikeSelector(args[0])) {
    const [selector, prop, value] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      applyStyles(el, prop, value);
    });
    return;
  }

  // CSS selector manipulation with 2 args (selector, styles object)
  if (
    args.length === 2 &&
    looksLikeSelector(args[0]) &&
    typeof args[1] === "object"
  ) {
    const [selector, styles] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      applyStyles(el, styles);
    });
    return;
  }

  // Generator setter with prop/value
  if (
    args.length === 2 &&
    typeof args[0] === "string" &&
    typeof args[1] !== "object"
  ) {
    const [prop, value] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        applyStyles(context.element, prop, value);
      }) as Operation<void>;
    })();
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

  throw new Error(
    `Invalid arguments for style(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Attribute Functions
// ============================================================================

export function attr<T extends Element = HTMLElement>(
  element: T,
  name: string,
  value: string | number | boolean,
): void;
export function attr<T extends Element = HTMLElement>(
  element: T,
  attrs: AttributeObject,
): void;
export function attr<T extends Element = HTMLElement>(
  element: T,
  name: string,
): string | null;
export function attr(
  selector: string | CSSSelector,
  name: string,
  value: string | number | boolean,
): void;
export function attr(
  selector: string | CSSSelector,
  attrs: AttributeObject,
): void;
export function attr(
  selector: string | CSSSelector,
  name: string,
): string | null;
export function attr(
  name: string,
  value: string | number | boolean,
): Workflow<void>;
export function attr(attrs: AttributeObject): Workflow<void>;
export function attr(name: string): Workflow<string | null>;

export function attr<T extends Element = HTMLElement>(...args: any[]): any {
  const applyAttrs = <E extends Element>(
    element: E,
    nameOrAttrs: AttributeObject | string,
    value?: string | number | boolean,
  ) => {
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

  // Direct element manipulation setter
  if (args.length >= 2 && isElement(args[0])) {
    const [element, nameOrAttrs, value] = args as [
      T,
      string | AttributeObject,
      string | number | boolean | undefined,
    ];
    if (typeof nameOrAttrs === "string" && value === undefined) {
      // Getter pattern
      return element.getAttribute(nameOrAttrs);
    }
    applyAttrs(element, nameOrAttrs, value as string | number | boolean);
    return;
  }

  // CSS selector manipulation with 3 args (selector, name, value)
  if (args.length === 3 && looksLikeSelector(args[0])) {
    const [selector, name, value] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      applyAttrs(el, name, value);
    });
    return;
  }

  // CSS selector manipulation with 2 args (selector, attrs object)
  if (
    args.length === 2 &&
    looksLikeSelector(args[0]) &&
    typeof args[1] === "object"
  ) {
    const [selector, attrs] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      applyAttrs(el, attrs);
    });
    return;
  }

  // Generator setter with name/value
  if (
    args.length === 2 &&
    typeof args[0] === "string" &&
    typeof args[1] !== "object"
  ) {
    const [name, value] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        if (typeof value === "boolean") {
          if (value) {
            context.element.setAttribute(name, "");
          } else {
            context.element.removeAttribute(name);
          }
        } else {
          context.element.setAttribute(name, String(value));
        }
      }) as Operation<void>;
    })();
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

  // Generator getter
  if (args.length === 1 && typeof args[0] === "string") {
    const [name] = args;
    return (function* (): Generator<
      Operation<string | null>,
      string | null,
      any
    > {
      const result = yield ((context: WatchContext) => {
        return context.element.getAttribute(name);
      }) as Operation<string | null>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for attr(): ${args.length} arguments provided`,
  );
}

export function removeAttr<T extends HTMLElement = HTMLElement>(
  element: T,
  name: string | string[],
): void;
export function removeAttr(
  selector: string | CSSSelector,
  name: string | string[],
): void;
export function removeAttr(name: string | string[]): Workflow<void>;

export function removeAttr(...args: any[]): any {
  // Direct element manipulation
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, name] = args;
    const names = Array.isArray(name) ? name : [name];
    names.forEach((n) => element.removeAttribute(n));
    return;
  }

  // CSS selector manipulation
  if (args.length === 2 && looksLikeSelector(args[0])) {
    const [selector, name] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      el.removeAttribute(name);
    });
    return;
  }

  // Generator pattern
  if (args.length === 1) {
    const [name] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        const names = Array.isArray(name) ? name : [name];
        names.forEach((n) => context.element.removeAttribute(n));
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for removeAttr(): ${args.length} arguments provided`,
  );
}

export function hasAttr<T extends HTMLElement = HTMLElement>(
  element: T,
  name: string,
): boolean;
export function hasAttr(selector: string | CSSSelector, name: string): boolean;
export function hasAttr(name: string): Workflow<boolean>;

export function hasAttr(...args: any[]): any {
  // Direct element check
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, name] = args;
    return element.hasAttribute(name);
  }

  // CSS selector check
  if (args.length === 2 && looksLikeSelector(args[0])) {
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

  throw new Error(
    `Invalid arguments for hasAttr(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Property Functions
// ============================================================================

/**
 * Manipulates JavaScript properties on DOM elements.
 *
 * Properties are part of the DOM object and can be any JavaScript type (boolean, number, object, etc).
 * Use this for properties like 'checked', 'disabled', 'value', 'selectedIndex', custom properties, etc.
 * Properties reflect the current state, while attributes represent the initial HTML markup.
 *
 * @param element - HTMLElement to manipulate properties on (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param name - Property name to get or set
 * @param value - Property value of any type
 * @returns void when setting, T when getting, Workflow for generators
 *
 * @example Boolean properties with yield*
 * ```typescript
 * import { watch, prop, click } from 'watch-selector';
 *
 * watch('.checkbox-wrapper', function* () {
 *   // Set boolean properties
 *   yield* prop('checked', true);
 *   yield* prop('disabled', false);
 *   yield* prop('required', true);
 *
 *   yield* click(function* () {
 *     // Toggle checked state
 *     const isChecked = yield* prop('checked');
 *     yield* prop('checked', !isChecked);
 *
 *     // Update related elements
 *     if (!isChecked) {
 *       yield* addClass('selected');
 *     } else {
 *       yield* removeClass('selected');
 *     }
 *   });
 * });
 * ```
 *
 * @example Form element properties
 * ```typescript
 * watch('.form-select', function* () {
 *   // Set selected index
 *   yield* prop('selectedIndex', 2);
 *
 *   // Get current selection
 *   const index = yield* prop('selectedIndex');
 *   const selectedOption = yield* prop('selectedOptions');
 *
 *   yield* change(function* () {
 *     const value = yield* prop('value');
 *     console.log('Selected:', value);
 *
 *     // Enable submit button when something is selected
 *     const submitBtn = yield* query('.submit-btn');
 *     if (submitBtn) {
 *       prop(submitBtn, 'disabled', !value);
 *     }
 *   });
 * });
 * ```
 *
 * @example Custom properties and objects
 * ```typescript
 * watch('.data-container', function* () {
 *   // Store complex data as properties
 *   yield* prop('customData', {
 *     id: 123,
 *     name: 'Test Item',
 *     metadata: { created: new Date() }
 *   });
 *
 *   // Store functions as properties
 *   yield* prop('validator', (value: string) => {
 *     return value.length > 0 && value.length < 100;
 *   });
 *
 *   // Retrieve and use custom properties
 *   const data = yield* prop('customData');
 *   const validator = yield* prop('validator');
 *
 *   if (validator && data) {
 *     const isValid = validator(data.name);
 *     yield* toggleClass('valid', isValid);
 *   }
 * });
 * ```
 *
 * @example Video/Audio element properties
 * ```typescript
 * watch('video', function* () {
 *   // Control playback properties
 *   yield* prop('volume', 0.5);
 *   yield* prop('muted', false);
 *   yield* prop('playbackRate', 1.25);
 *
 *   // Monitor properties
 *   const duration = yield* prop('duration');
 *   const currentTime = yield* prop('currentTime');
 *
 *   yield* text(`${currentTime}s / ${duration}s`);
 * });
 * ```
 */
export function prop<T = any>(
  element: HTMLElement,
  name: string,
  value: T,
): void;
export function prop<T = any>(element: HTMLElement, props: DataObject): void;
export function prop<T = any>(
  selector: string | CSSSelector,
  name: string,
  value: T,
): void;
export function prop<T = any>(
  selector: string | CSSSelector,
  props: DataObject,
): void;
export function prop<T = any>(name: string, value: T): Workflow<void>;
export function prop(props: DataObject): Workflow<void>;
export function prop<T = any>(name: string): Workflow<T>;

export function prop(...args: any[]): any {
  const applyProps = <E extends HTMLElement>(
    element: E,
    propOrProps: Record<string, any> | string,
    value?: any,
  ) => {
    if (typeof propOrProps === "object") {
      Object.entries(propOrProps).forEach(([name, val]) => {
        (element as any)[name] = val;
      });
    } else {
      (element as any)[propOrProps] = value;
    }
  };

  // Direct element manipulation setter/getter
  if (isHTMLElement(args[0])) {
    const [element, propOrProps, value] = args as [
      HTMLElement,
      string | Record<string, any>,
      any,
    ];
    if (typeof propOrProps === "string" && value === undefined) {
      // Getter pattern
      return (element as any)[propOrProps];
    }
    applyProps(element, propOrProps, value);
    return;
  }

  // CSS selector manipulation
  if (args.length >= 2 && looksLikeSelector(args[0])) {
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

  throw new Error(
    `Invalid arguments for prop(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Data Attribute Functions
// ============================================================================

/**
 * Manipulates HTML5 data-* attributes with automatic camelCase conversion.
 *
 * Provides a convenient API for working with data attributes. Automatically handles
 * the conversion between camelCase property names and kebab-case attribute names.
 * For example, 'userId' becomes 'data-user-id' in the HTML.
 *
 * @param element - HTMLElement to manipulate data attributes on (direct pattern)
 * @param selector - CSS selector to find elements (selector pattern)
 * @param key - Data key (without 'data-' prefix) or object of key-value pairs
 * @param value - Data value (automatically serialized if not a string)
 * @returns void when setting, T when getting single, object when getting all, Workflow for generators
 *
 * @example Setting and getting data attributes with yield*
 * ```typescript
 * import { watch, data, click } from 'watch-selector';
 *
 * watch('.product-card', function* () {
 *   // Set single data attribute (becomes data-product-id)
 *   yield* data('productId', '12345');
 *
 *   // Set multiple data attributes with object
 *   yield* data({
 *     productId: '12345',
 *     categoryName: 'Electronics',  // becomes data-category-name
 *     inStock: true,                // becomes data-in-stock="true"
 *     price: 99.99                   // becomes data-price="99.99"
 *   });
 *
 *   // Get single data attribute
 *   const productId = yield* data('productId');
 *   console.log('Product ID:', productId);
 * });
 * ```
 *
 * @example Complex data serialization
 * ```typescript
 * watch('.user-profile', function* () {
 *   // Store complex data (automatically JSON stringified)
 *   yield* data('userPreferences', {
 *     theme: 'dark',
 *     language: 'en',
 *     notifications: true
 *   });
 *
 *   // Retrieve and parse complex data
 *   const prefs = yield* data('userPreferences');
 *   const parsed = typeof prefs === 'string' ? JSON.parse(prefs) : prefs;
 *
 *   yield* addClass(`theme-${parsed.theme}`);
 * });
 * ```
 *
 * @example Dynamic data attributes for tracking
 * ```typescript
 * watch('.trackable-element', function* () {
 *   // Set tracking data
 *   yield* data({
 *     trackCategory: 'engagement',
 *     trackAction: 'view',
 *     trackLabel: 'hero-banner',
 *     trackValue: Date.now()
 *   });
 *
 *   yield* click(function* () {
 *     // Update tracking on interaction
 *     yield* data('trackAction', 'click');
 *     yield* data('trackValue', Date.now());
 *
 *     // Send to analytics
 *     const trackingData = {
 *       category: yield* data('trackCategory'),
 *       action: yield* data('trackAction'),
 *       label: yield* data('trackLabel')
 *     };
 *     console.log('Track event:', trackingData);
 *   });
 * });
 * ```
 *
 * @example Component state in data attributes
 * ```typescript
 * watch('.accordion', function* () {
 *   // Initialize component state
 *   yield* data({
 *     expanded: false,
 *     animating: false,
 *     height: 'auto'
 *   });
 *
 *   yield* click(function* () {
 *     const isExpanded = yield* data('expanded') === 'true';
 *
 *     // Toggle state
 *     yield* data('expanded', !isExpanded);
 *     yield* data('animating', true);
 *
 *     // Update UI based on state
 *     yield* toggleClass('expanded', !isExpanded);
 *
 *     setTimeout(() => {
 *       yield* data('animating', false);
 *     }, 300);
 *   });
 * });
 * ```
 */
export function data<T = any>(element: HTMLElement, data: DataObject): void;
export function data<T = any>(
  element: HTMLElement,
  key: string,
  value: T,
): void;
export function data<T = any>(element: HTMLElement, data: DataObject): void;
export function data<T = any>(
  selector: string | CSSSelector,
  key: string,
  value: T,
): void;
export function data<T = any>(
  selector: string | CSSSelector,
  data: DataObject,
): void;
export function data<T = any>(key: string, value: T): Workflow<void>;
export function data(data: DataObject): Workflow<void>;
export function data<T = any>(key: string): Workflow<T | undefined>;

export function data(...args: any[]): any {
  const applyData = <E extends HTMLElement, V = any>(
    element: E,
    keyOrData: DataObject | string,
    value?: V,
  ) => {
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

  // Direct element manipulation
  if (isHTMLElement(args[0])) {
    const [element, keyOrData, value] = args;
    applyData(element, keyOrData, value);
    return;
  }

  // CSS selector manipulation
  if (args.length >= 2 && looksLikeSelector(args[0])) {
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
    return (function* (): Generator<
      Operation<string | undefined>,
      string | undefined,
      any
    > {
      const result = yield ((context: WatchContext) => {
        return context.element.dataset[key];
      }) as Operation<string | undefined>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for data(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Form Functions
// ============================================================================

/**
 * Removes focus from an element.
 *
 * @example Direct element
 * ```typescript
 * const input = document.querySelector('input');
 * blur(input);
 * ```
 *
 * @example CSS selector pattern
 * ```typescript
 * blur('input:focus'); // Blur currently focused input
 * ```
 *
 * @example Generator context
 * ```typescript
 * import { watch, blur, keydown } from 'watch-selector';
 *
 * watch('input.auto-blur', function* () {
 *   yield keydown(function* (e) {
 *     if (e.key === 'Enter') {
 *       yield blur(); // Remove focus on Enter
 *     }
 *   });
 * });
 * ```
 *
 * @param element - The element to blur
 * @param selector - CSS selector to find element to blur
 * @returns void when used directly, Workflow<void> in generator context
 */
/**
 * Hides an element by setting 'display: none'.
 *
 * @example Direct element
 * ```typescript
 * const popup = document.querySelector('.popup');
 * hide(popup);
 * ```
 *
 * @example CSS selector pattern
 * ```typescript
 * hide('.loading-spinner');
 * hide('[data-temporary]');
 * ```
 *
 * @example Generator context with timing
 * ```typescript
 * import { watch, hide, show, delay } from 'watch-selector';
 *
 * watch('.flash-message', function* () {
 *   yield show();
 *   yield delay(3000); // Show for 3 seconds
 *   yield hide();
 * });
 * ```
 *
 * @param element - The element to hide
 * @param selector - CSS selector to find elements to hide
 * @returns void when used directly, Workflow<void> in generator context
 **/
export function value<T extends ValueElement>(
  element: T,
  val: string | number,
): void;
export function value<T extends ValueElement>(element: T): string;
export function value(
  selector: string | CSSSelector,
  val: string | number,
): void;
export function value(selector: string | CSSSelector): string | null;
export function value(val: string | number): Workflow<void>;
export function value(): Workflow<string>;

export function value(...args: any[]): any {
  // Direct element setter
  // Direct element manipulation setter
  if (args.length === 2 && hasValue(args[0])) {
    const [element, val] = args as [ValueElement, string | number];
    element.value = String(val);
    return;
  }

  // Direct element manipulation getter
  if (args.length === 1 && hasValue(args[0])) {
    const [element] = args as [ValueElement];
    return element.value;
  }

  // CSS selector setter
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, val] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      if ("value" in el) {
        (el as any).value = String(val);
      }
    });
    return;
  }

  // CSS selector getter
  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    !isInGeneratorContext()
  ) {
    const [selector] = args;
    const element = document.querySelector(String(selector));
    return element && "value" in element ? (element as any).value : null;
  }

  // Generator setter pattern
  if (args.length === 1 && typeof args[0] === "string") {
    const [val] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        if (hasValue(context.element)) {
          context.element.value = String(val);
        }
      }) as Operation<void>;
    })();
  }

  // Generator getter pattern
  if (args.length === 0) {
    return (function* (): Generator<Operation<string>, string, any> {
      const result = yield ((context: WatchContext) => {
        return "value" in context.element ? (context.element as any).value : "";
      }) as Operation<string>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for value(): ${args.length} arguments provided`,
  );
}

export function checked<T extends HTMLInputElement = HTMLInputElement>(
  element: T,
  val: boolean,
): void;
export function checked<T extends HTMLInputElement = HTMLInputElement>(
  element: T,
): boolean;
export function checked(selector: string | CSSSelector, val: boolean): void;
export function checked(selector: string | CSSSelector): boolean | null;
export function checked(val: boolean): Workflow<void>;
export function checked(): Workflow<boolean>;

export function checked(...args: any[]): any {
  // Direct element setter
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, val] = args;
    if ("checked" in element) {
      (element as any).checked = Boolean(val);
    }
    return;
  }

  // Direct element getter
  if (args.length === 1 && isHTMLElement(args[0])) {
    const [element] = args;
    return "checked" in element ? (element as any).checked : false;
  }

  // CSS selector setter
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, val] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      if ("checked" in el) {
        (el as any).checked = Boolean(val);
      }
    });
    return;
  }

  // CSS selector getter
  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    !isInGeneratorContext()
  ) {
    const [selector] = args;
    const element = document.querySelector(String(selector));
    return element && "checked" in element ? (element as any).checked : false;
  }

  // Generator setter pattern
  if (args.length === 1 && typeof args[0] === "boolean") {
    const [val] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        if ("checked" in context.element) {
          (context.element as any).checked = Boolean(val);
        }
      }) as Operation<void>;
    })();
  }

  // Generator getter pattern
  if (args.length === 0) {
    return (function* (): Generator<Operation<boolean>, boolean, any> {
      const result = yield ((context: WatchContext) => {
        return "checked" in context.element
          ? (context.element as any).checked
          : false;
      }) as Operation<boolean>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for checked(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Focus Functions
// ============================================================================

/**
 * Sets focus on an element, making it the active element for keyboard input.
 *
 * Triggers focus events and updates the document's activeElement. Useful for
 * improving accessibility, managing form navigation, and creating keyboard-driven
 * interfaces. The element must be focusable (inputs, buttons, links, or elements
 * with tabindex).
 *
 * @param element - HTMLElement to focus (direct pattern)
 * @param selector - CSS selector to find element to focus
 * @returns void for direct/selector patterns, Workflow for generators
 *
 * @example Auto-focus search input with yield*
 * ```typescript
 * import { watch, focus, onMount } from 'watch-selector';
 *
 * watch('.search-modal', function* () {
 *   yield* onMount(function* () {
 *     // Focus search input when modal opens
 *     const searchInput = yield* query('.search-input');
 *     if (searchInput) {
 *       // Small delay to ensure modal animation completes
 *       setTimeout(() => {
 *         focus(searchInput);
 *       }, 100);
 *     }
 *   });
 * });
 * ```
 *
 * @example Form field navigation
 * ```typescript
 * watch('.form-field', function* () {
 *   yield* on('keydown', function* (event) {
 *     if (event.key === 'Enter') {
 *       event.preventDefault();
 *
 *       // Move to next field on Enter
 *       const fields = yield* queryAll('.form-field');
 *       const currentIndex = fields.indexOf(event.target as HTMLElement);
 *
 *       if (currentIndex < fields.length - 1) {
 *         focus(fields[currentIndex + 1]);
 *       } else {
 *         // Focus submit button at the end
 *         yield* focus('.submit-btn');
 *       }
 *     }
 *   });
 * });
 * ```
 *
 * @example Focus management in dropdown
 * ```typescript
 * watch('.dropdown', function* () {
 *   let focusIndex = -1;
 *
 *   yield* click('.dropdown-trigger', function* () {
 *     yield* toggleClass('open');
 *
 *     if (yield* hasClass('open')) {
 *       // Focus first item when opening
 *       const firstItem = yield* query('.dropdown-item');
 *       if (firstItem) {
 *         focus(firstItem);
 *         focusIndex = 0;
 *       }
 *     }
 *   });
 *
 *   // Keyboard navigation
 *   yield* on('keydown', function* (event) {
 *     const items = yield* queryAll('.dropdown-item');
 *
 *     if (event.key === 'ArrowDown') {
 *       event.preventDefault();
 *       focusIndex = Math.min(focusIndex + 1, items.length - 1);
 *       focus(items[focusIndex]);
 *     } else if (event.key === 'ArrowUp') {
 *       event.preventDefault();
 *       focusIndex = Math.max(focusIndex - 1, 0);
 *       focus(items[focusIndex]);
 *     }
 *   });
 * });
 * ```
 *
 * @example Focus trap for modal accessibility
 * ```typescript
 * watch('.modal', function* () {
 *   yield* onMount(function* () {
 *     // Store previously focused element
 *     const previousFocus = document.activeElement as HTMLElement;
 *
 *     // Focus first focusable element in modal
 *     const focusableElements = yield* queryAll(
 *       'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
 *     );
 *
 *     if (focusableElements.length > 0) {
 *       focus(focusableElements[0]);
 *     }
 *
 *     // Restore focus on close
 *     yield* onUnmount(() => {
 *       if (previousFocus) {
 *         focus(previousFocus);
 *       }
 *     });
 *   });
 * });
 * ```
 */
export function focus<T extends FocusableElement = FocusableElement>(
  element: T,
): void;
export function focus<T extends FocusableElement = FocusableElement>(
  element: T,
): void;
export function focus(selector: string | CSSSelector): void;
export function focus(): Workflow<void>;

export function focus(...args: any[]): any {
  // Direct element manipulation
  // Direct element focus
  if (args.length === 1 && isFocusable(args[0])) {
    const [element] = args;
    element.focus();
    return;
  }

  // CSS selector manipulation
  if (args.length === 1 && typeof args[0] === "string") {
    const [selector] = args;
    const element = document.querySelector(String(selector));
    if (element && element instanceof HTMLElement) {
      element.focus();
    }
    return;
  }

  // Generator pattern
  if (args.length === 0) {
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        if (isFocusable(context.element)) {
          context.element.focus();
        }
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for focus(): ${args.length} arguments provided`,
  );
}

/**
 * Removes focus from an element, triggering blur events.
 *
 * The blur method causes an element to lose focus, making it no longer the
 * activeElement. This triggers blur events and can be used for validation,
 * saving data, or hiding UI elements. After blur, focus typically returns
 * to the document body unless another element is explicitly focused.
 *
 * @param element - HTMLElement to blur (direct pattern)
 * @param selector - CSS selector to find element to blur
 * @returns void for direct/selector patterns, Workflow for generators
 *
 * @example Input validation on blur with yield*
 * ```typescript
 * import { watch, blur, addClass, removeClass } from 'watch-selector';
 *
 * watch('.validate-on-blur', function* () {
 *   yield* on('input', function* () {
 *     // Remove validation classes while typing
 *     yield* removeClass('valid invalid');
 *   });
 *
 *   yield* on('blur', function* () {
 *     const value = yield* value();
 *
 *     // Validate when user leaves field
 *     if (value.length < 3) {
 *       yield* addClass('invalid');
 *       yield* attr('aria-invalid', 'true');
 *     } else {
 *       yield* addClass('valid');
 *       yield* attr('aria-invalid', 'false');
 *     }
 *
 *     // Save draft
 *     yield* setState('draft', value);
 *   });
 * });
 * ```
 *
 * @example Auto-save on blur
 * ```typescript
 * watch('.auto-save-field', function* () {
 *   let isDirty = false;
 *
 *   yield* input(function* () {
 *     isDirty = true;
 *     yield* addClass('unsaved');
 *   });
 *
 *   yield* on('blur', function* () {
 *     if (isDirty) {
 *       const content = yield* value();
 *
 *       // Show saving indicator
 *       yield* addClass('saving');
 *       yield* removeClass('unsaved');
 *
 *       // Save data
 *       try {
 *         await fetch('/api/save', {
 *           method: 'POST',
 *           body: JSON.stringify({ content })
 *         });
 *
 *         yield* removeClass('saving');
 *         yield* addClass('saved');
 *         isDirty = false;
 *
 *         // Clear saved indicator after delay
 *         setTimeout(() => {
 *           yield* removeClass('saved');
 *         }, 2000);
 *       } catch (error) {
 *         yield* removeClass('saving');
 *         yield* addClass('error');
 *       }
 *     }
 *   });
 * });
 * ```
 *
 * @example Dropdown close on blur
 * ```typescript
 * watch('.searchable-dropdown', function* () {
 *   yield* on('focus', '.dropdown-input', function* () {
 *     yield* addClass('open');
 *     yield* show('.dropdown-menu');
 *   });
 *
 *   yield* on('blur', '.dropdown-input', function* (event) {
 *     // Delay to allow clicking on dropdown items
 *     setTimeout(() => {
 *       // Check if focus moved to a dropdown item
 *       const focusedElement = document.activeElement;
 *       const isInDropdown = yield* query('.dropdown-menu')?.contains(focusedElement);
 *
 *       if (!isInDropdown) {
 *         yield* removeClass('open');
 *         yield* hide('.dropdown-menu');
 *       }
 *     }, 200);
 *   });
 * });
 * ```
 *
 * @example Programmatic blur for closing popups
 * ```typescript
 * watch('.popup-trigger', function* () {
 *   yield* click(function* () {
 *     const popup = yield* query('.popup');
 *
 *     if (popup) {
 *       yield* toggleClass('active', popup);
 *
 *       if (yield* hasClass('active', popup)) {
 *         // Focus popup for keyboard navigation
 *         focus(popup);
 *       } else {
 *         // Blur to remove focus from popup
 *         blur(popup);
 *         // Return focus to trigger
 *         yield* focus();
 *       }
 *     }
 *   });
 *
 *   // Close on Escape key
 *   yield* on('keydown', function* (event) {
 *     if (event.key === 'Escape') {
 *       const popup = yield* query('.popup');
 *       if (popup && yield* hasClass('active', popup)) {
 *         blur(popup);
 *         yield* removeClass('active', popup);
 *         yield* focus(); // Return focus to trigger
 *       }
 *     }
 *   });
 * });
 * ```
 */
export function blur<T extends FocusableElement = FocusableElement>(
  element: T,
): void;
export function blur<T extends FocusableElement = FocusableElement>(
  element: T,
): void;
export function blur(selector: string | CSSSelector): void;
export function blur(): Workflow<void>;

export function blur(...args: any[]): any {
  // Direct element manipulation
  // Direct element blur
  if (args.length === 1 && isFocusable(args[0])) {
    const [element] = args;
    element.blur();
    return;
  }

  // CSS selector manipulation
  if (args.length === 1 && typeof args[0] === "string") {
    const [selector] = args;
    const element = document.querySelector(String(selector));
    if (element && element instanceof HTMLElement) {
      element.blur();
    }
    return;
  }

  // Generator pattern
  if (args.length === 0) {
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        if (isFocusable(context.element)) {
          context.element.blur();
        }
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for blur(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Visibility Functions
// ============================================================================

/**
 * Shows a hidden element by removing 'display: none' style.
 *
 * Removes any inline display: none style, allowing the element to return to its
 * default or CSS-defined display value. This is more reliable than setting a
 * specific display value as it respects the element's natural display type.
 *
 * @param element - HTMLElement to show (direct pattern)
 * @param selector - CSS selector to find elements to show
 * @returns void for direct/selector patterns, Workflow for generators
 *
 * @example Basic show/hide toggle with yield*
 * ```typescript
 * import { watch, show, hide, click } from 'watch-selector';
 *
 * watch('.collapsible', function* () {
 *   // Initially hide content
 *   yield* hide('.content');
 *
 *   yield* click('.toggle-btn', function* () {
 *     const content = yield* query('.content');
 *     const isHidden = content?.style.display === 'none';
 *
 *     if (isHidden) {
 *       yield* show('.content');
 *       yield* text('.toggle-btn', 'Hide Content');
 *     } else {
 *       yield* hide('.content');
 *       yield* text('.toggle-btn', 'Show Content');
 *     }
 *   });
 * });
 * ```
 *
 * @example Conditional visibility based on state
 * ```typescript
 * watch('.notification-area', function* () {
 *   const hasNotifications = yield* getState('notificationCount', 0) > 0;
 *
 *   if (hasNotifications) {
 *     yield* show('.notification-badge');
 *     yield* show('.notification-list');
 *   } else {
 *     yield* hide('.notification-badge');
 *     yield* hide('.notification-list');
 *     yield* show('.empty-state');
 *   }
 * });
 * ```
 *
 * @example Progressive disclosure pattern
 * ```typescript
 * watch('.progressive-form', function* () {
 *   // Hide advanced sections initially
 *   yield* hide('.advanced-options');
 *   yield* hide('.expert-settings');
 *
 *   yield* change('#user-level', function* () {
 *     const level = yield* value();
 *
 *     switch(level) {
 *       case 'beginner':
 *         yield* hide('.advanced-options');
 *         yield* hide('.expert-settings');
 *         break;
 *       case 'intermediate':
 *         yield* show('.advanced-options');
 *         yield* hide('.expert-settings');
 *         break;
 *       case 'expert':
 *         yield* show('.advanced-options');
 *         yield* show('.expert-settings');
 *         break;
 *     }
 *   });
 * });
 * ```
 *
 * @example Loading states with visibility
 * ```typescript
 * watch('.data-container', function* () {
 *   yield* click('.load-btn', async function* () {
 *     // Show loading, hide content and error
 *     yield* show('.loading-spinner');
 *     yield* hide('.content');
 *     yield* hide('.error-message');
 *
 *     try {
 *       const data = await fetch('/api/data').then(r => r.json());
 *
 *       // Show content, hide loading
 *       yield* hide('.loading-spinner');
 *       yield* show('.content');
 *       yield* text('.content', data.message);
 *     } catch (error) {
 *       // Show error, hide loading
 *       yield* hide('.loading-spinner');
 *       yield* show('.error-message');
 *       yield* text('.error-message', 'Failed to load data');
 *     }
 *   });
 * });
 * ```
 */
export function show<T extends HTMLElement = HTMLElement>(element: T): void;
export function show(selector: string | CSSSelector): void;
export function show(): Workflow<void>;

export function show(...args: any[]): any {
  const showElement = (el: HTMLElement) => {
    el.style.display = "";
    if (getComputedStyle(el).display === "none") {
      el.style.display = "block";
    }
  };

  // Direct element manipulation
  if (args.length === 1 && isHTMLElement(args[0])) {
    const [element] = args;
    showElement(element);
    return;
  }

  // CSS selector manipulation
  if (args.length === 1 && typeof args[0] === "string") {
    const [selector] = args;
    const elements = resolveElements(String(selector));
    elements.forEach(showElement);
    return;
  }

  // Generator pattern
  if (args.length === 0) {
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        showElement(context.element);
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for show(): ${args.length} arguments provided`,
  );
}

/**
 * Hides an element by setting 'display: none' inline style.
 *
 * Applies an inline style of display: none, which takes precedence over
 * CSS rules. The element remains in the DOM but is completely removed from
 * the document flow and is not visible or accessible to screen readers.
 *
 * @param element - HTMLElement to hide (direct pattern)
 * @param selector - CSS selector to find elements to hide
 * @returns void for direct/selector patterns, Workflow for generators
 *
 * @example Dismissible alerts with yield*
 * ```typescript
 * import { watch, hide, addClass } from 'watch-selector';
 *
 * watch('.alert', function* () {
 *   yield* click('.dismiss-btn', function* () {
 *     // Add fade out animation
 *     yield* addClass('fade-out');
 *
 *     // Hide after animation completes
 *     setTimeout(() => {
 *       yield* hide();
 *     }, 300);
 *   });
 *
 *   // Auto-dismiss after 5 seconds
 *   yield* onMount(function* () {
 *     setTimeout(() => {
 *       yield* addClass('fade-out');
 *       setTimeout(() => {
 *         yield* hide();
 *       }, 300);
 *     }, 5000);
 *   });
 * });
 * ```
 *
 * @example Filter/search with hiding
 * ```typescript
 * watch('.filter-container', function* () {
 *   yield* input('.search-input', function* () {
 *     const searchTerm = (yield* value()).toLowerCase();
 *     const items = yield* queryAll('.item');
 *
 *     for (const item of items) {
 *       const text = item.textContent?.toLowerCase() || '';
 *
 *       if (text.includes(searchTerm)) {
 *         show(item);
 *       } else {
 *         hide(item);
 *       }
 *     }
 *
 *     // Show/hide "no results" message
 *     const visibleItems = items.filter(item =>
 *       item.style.display !== 'none'
 *     );
 *
 *     if (visibleItems.length === 0) {
 *       yield* show('.no-results');
 *     } else {
 *       yield* hide('.no-results');
 *     }
 *   });
 * });
 * ```
 *
 * @example Tab panel visibility
 * ```typescript
 * watch('.tabs', function* () {
 *   // Hide all panels except first
 *   const panels = yield* queryAll('.tab-panel');
 *   panels.forEach((panel, index) => {
 *     if (index > 0) hide(panel);
 *   });
 *
 *   yield* click('.tab-button', function* (event) {
 *     const tabIndex = yield* data('tab-index');
 *
 *     // Hide all panels
 *     yield* queryAll('.tab-panel').then(panels =>
 *       panels.forEach(panel => hide(panel))
 *     );
 *
 *     // Show selected panel
 *     yield* show(`.tab-panel[data-index="${tabIndex}"]`);
 *
 *     // Update active states
 *     yield* removeClass('.tab-button', 'active');
 *     yield* addClass('active');
 *   });
 * });
 * ```
 */
export function hide<T extends HTMLElement = HTMLElement>(element: T): void;
export function hide(selector: string | CSSSelector): void;
export function hide(): Workflow<void>;

export function hide(...args: any[]): any {
  // Direct element manipulation
  if (args.length === 1 && isHTMLElement(args[0])) {
    const [element] = args;
    element.style.display = "none";
    return;
  }

  // CSS selector manipulation
  if (args.length === 1 && typeof args[0] === "string") {
    const [selector] = args;
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      el.style.display = "none";
    });
    return;
  }

  // Generator pattern
  if (args.length === 0) {
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        context.element.style.display = "none";
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for hide(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Query Functions with Enhanced Type Safety
// ============================================================================

// Map CSS selectors to element types for better inference
type SelectorElementMap = {
  input: HTMLInputElement;
  button: HTMLButtonElement;
  form: HTMLFormElement;
  a: HTMLAnchorElement;
  img: HTMLImageElement;
  video: HTMLVideoElement;
  audio: HTMLAudioElement;
  canvas: HTMLCanvasElement;
  select: HTMLSelectElement;
  textarea: HTMLTextAreaElement;
  div: HTMLDivElement;
  span: HTMLSpanElement;
  p: HTMLParagraphElement;
  h1: HTMLHeadingElement;
  h2: HTMLHeadingElement;
  h3: HTMLHeadingElement;
  h4: HTMLHeadingElement;
  h5: HTMLHeadingElement;
  h6: HTMLHeadingElement;
  table: HTMLTableElement;
  tr: HTMLTableRowElement;
  td: HTMLTableCellElement;
  th: HTMLTableCellElement;
  ul: HTMLUListElement;
  ol: HTMLOListElement;
  li: HTMLLIElement;
  label: HTMLLabelElement;
  fieldset: HTMLFieldSetElement;
  legend: HTMLLegendElement;
  option: HTMLOptionElement;
  optgroup: HTMLOptGroupElement;
  progress: HTMLProgressElement;
  meter: HTMLMeterElement;
  output: HTMLOutputElement;
  details: HTMLDetailsElement;
  summary: HTMLElement;
  dialog: HTMLDialogElement;
  script: HTMLScriptElement;
  style: HTMLStyleElement;
  link: HTMLLinkElement;
  meta: HTMLMetaElement;
  base: HTMLBaseElement;
  title: HTMLTitleElement;
  iframe: HTMLIFrameElement;
  embed: HTMLEmbedElement;
  object: HTMLObjectElement;
  param: HTMLParamElement;
  source: HTMLSourceElement;
  track: HTMLTrackElement;
  area: HTMLAreaElement;
  map: HTMLMapElement;
  svg: SVGSVGElement;
  path: SVGPathElement;
  circle: SVGCircleElement;
  rect: SVGRectElement;
  line: SVGLineElement;
  polyline: SVGPolylineElement;
  polygon: SVGPolygonElement;
  text: SVGTextElement;
  g: SVGGElement;
};

// Infer element type from selector string
type InferElementFromSelector<S extends string> =
  S extends keyof SelectorElementMap
    ? SelectorElementMap[S]
    : S extends `${infer Tag}#${string}`
      ? Tag extends keyof SelectorElementMap
        ? SelectorElementMap[Tag]
        : HTMLElement
      : S extends `${infer Tag}.${string}`
        ? Tag extends keyof SelectorElementMap
          ? SelectorElementMap[Tag]
          : HTMLElement
        : S extends `${infer Tag}[${string}]`
          ? Tag extends keyof SelectorElementMap
            ? SelectorElementMap[Tag]
            : HTMLElement
          : HTMLElement;

// Query function with enhanced type inference
export function query<S extends string>(
  element: Element,
  selector: S,
): InferElementFromSelector<S> | null;
export function query<T extends Element = HTMLElement>(
  element: Element,
  selector: string,
): T | null;
export function query<S extends string>(
  selector: S,
  childSelector: string,
): InferElementFromSelector<S> | null;
export function query<T extends Element = HTMLElement>(
  selector: string,
  childSelector: string,
): T | null;
export function query<S extends string, P extends Element = Element>(
  element: P,
  selector: S,
): InferElementFromSelector<S> | null;
export function query<
  T extends Element = HTMLElement,
  P extends Element = Element,
>(element: P, selector: string): T | null;
export function query<S extends string>(
  selector: S,
): InferElementFromSelector<S> | null;
export function query<T extends Element = HTMLElement>(
  selector: string,
): T | null;
export function query<S extends string>(
  parentSelector: string,
  childSelector: S,
): InferElementFromSelector<S> | null;
export function query<T extends Element = HTMLElement>(
  parentSelector: string,
  childSelector: string,
): T | null;
export function query<S extends string>(
  childSelector: S,
): Workflow<InferElementFromSelector<S> | null>;
export function query<T extends Element = HTMLElement>(
  childSelector: string,
): Workflow<T | null>;

export function query(...args: any[]): any {
  // Direct element query
  if (args.length === 2 && isElement(args[0])) {
    const [element, selector] = args;
    return element.querySelector(selector) as any;
  }

  // Document selector or parent-child query
  if (args.length === 2 && typeof args[0] === "string") {
    const [parentSelector, childSelector] = args;
    const parent = document.querySelector(parentSelector);
    return (parent?.querySelector(childSelector) as any) || null;
  }

  // Direct document query
  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    !isInGeneratorContext()
  ) {
    const [selector] = args;
    return document.querySelector(selector) as any;
  }

  // Generator pattern
  if (args.length === 1) {
    const [selector] = args;
    return (function* (): Generator<
      Operation<Element | null>,
      Element | null,
      any
    > {
      const result = yield ((context: WatchContext) => {
        return context.element.querySelector(selector);
      }) as Operation<Element | null>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for query(): ${args.length} arguments provided`,
  );
}

/**
 * Queries for all child elements matching a CSS selector.
 *
 * Searches within the element's descendants for all matches of the given selector.
 * Returns an array (not NodeList) for easier iteration. Always returns an array,
 * even if empty. Uses querySelectorAll internally with Array.from conversion.
 *
 * @param element - Parent element to search within (direct pattern)
 * @param selector - Parent selector, then child selector (selector pattern)
 * @param childSelector - CSS selector for child elements
 * @returns T[] for direct/selector patterns, Workflow<T[]> for generators
 *
 * @example Batch operations on multiple elements with yield*
 * ```typescript
 * import { watch, queryAll, addClass } from 'watch-selector';
 *
 * watch('.gallery', function* () {
 *   // Get all images
 *   const images = yield* queryAll<HTMLImageElement>('.gallery-image');
 *
 *   // Add loading state to all
 *   images.forEach(img => addClass(img, 'loading'));
 *
 *   // Process each image
 *   for (const img of images) {
 *     img.addEventListener('load', () => {
 *       removeClass(img, 'loading');
 *       addClass(img, 'loaded');
 *     });
 *   }
 *
 *   // Get count for pagination
 *   const totalImages = images.length;
 *   yield* text('.image-count', `${totalImages} images`);
 * });
 * ```
 *
 * @example Filtering and mapping elements
 * ```typescript
 * watch('.todo-list', function* () {
 *   const allItems = yield* queryAll<HTMLLIElement>('.todo-item');
 *
 *   // Filter completed items
 *   const completedItems = allItems.filter(item =>
 *     item.classList.contains('completed')
 *   );
 *
 *   // Update counter
 *   yield* text('.completed-count', `${completedItems.length} completed`);
 *   yield* text('.remaining-count', `${allItems.length - completedItems.length} remaining`);
 *
 *   // Add click handlers to all items
 *   for (const item of allItems) {
 *     click(item, () => {
 *       toggleClass(item, 'completed');
 *     });
 *   }
 * });
 * ```
 *
 * @example Form validation on multiple fields
 * ```typescript
 * watch('.form', function* () {
 *   yield* submit(function* (event) {
 *     event.preventDefault();
 *
 *     const requiredFields = yield* queryAll<HTMLInputElement>('[required]');
 *     let isValid = true;
 *
 *     for (const field of requiredFields) {
 *       if (!field.value.trim()) {
 *         addClass(field, 'error');
 *         isValid = false;
 *       } else {
 *         removeClass(field, 'error');
 *       }
 *     }
 *
 *     if (isValid) {
 *       // Submit form
 *       yield* addClass('submitting');
 *     } else {
 *       // Show error message
 *       yield* show('.validation-error');
 *     }
 *   });
 * });
 * ```
 */
// QueryAll with enhanced type inference
export function queryAll<S extends string, P extends Element = Element>(
  element: P,
  selector: S,
): InferElementFromSelector<S>[];
export function queryAll<
  T extends Element = HTMLElement,
  P extends Element = Element,
>(element: P, selector: string): T[];
export function queryAll<S extends string>(
  selector: S,
  childSelector: string,
): InferElementFromSelector<S>[];
export function queryAll<T extends Element = HTMLElement>(
  selector: string,
  childSelector: string,
): T[];
export function queryAll<S extends string>(
  selector: S,
): InferElementFromSelector<S>[];
export function queryAll<T extends Element = HTMLElement>(
  selector: string,
): T[];
export function queryAll<S extends string>(
  childSelector: S,
): Workflow<InferElementFromSelector<S>[]>;
export function queryAll<T extends Element = HTMLElement>(
  childSelector: string,
): Workflow<T[]>;

export function queryAll(...args: any[]): any {
  // Direct element query
  if (args.length === 2 && isElement(args[0])) {
    const [element, selector] = args;
    return Array.from(element.querySelectorAll(selector)) as any[];
  }

  // Document selector or parent-child query
  if (args.length === 2 && typeof args[0] === "string") {
    const [parentSelector, childSelector] = args;
    const parent = document.querySelector(parentSelector);
    if (!parent) return [];
    return Array.from(parent.querySelectorAll(childSelector)) as any[];
  }

  // Direct document query
  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    !isInGeneratorContext()
  ) {
    const [selector] = args;
    return Array.from(document.querySelectorAll(selector)) as any[];
  }

  // Generator pattern
  if (args.length === 1) {
    const [selector] = args;
    return (function* (): Generator<Operation<Element[]>, Element[], any> {
      const result = yield ((context: WatchContext) => {
        return Array.from(context.element.querySelectorAll(selector));
      }) as Operation<Element[]>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for queryAll(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// DOM Traversal Functions
// ============================================================================

/**
 * Queries for a single child element matching a CSS selector.
 *
 * Searches within the element's descendants for the first match of the given
 * selector. Returns null if no match is found. Uses querySelector internally,
 * supporting all valid CSS selectors including pseudo-classes and combinators.
 *
 * @param element - Parent element to search within (direct pattern)
 * @param selector - Parent selector, then child selector (selector pattern)
 * @param childSelector - CSS selector for the child element
 * @returns T | null for direct/selector patterns, Workflow<T | null> for generators
 *
 * @example Finding child elements with yield*
 * ```typescript
 * import { watch, query, click } from 'watch-selector';
 *
 * watch('.card', function* () {
 *   // Find specific child element
 *   const title = yield* query<HTMLHeadingElement>('.card-title');
 *   const button = yield* query<HTMLButtonElement>('.action-btn');
 *
 *   if (title && button) {
 *     yield* click(button, function* () {
 *       const currentTitle = title.textContent;
 *       console.log('Clicked card:', currentTitle);
 *     });
 *   }
 *
 *   // Check for optional elements
 *   const badge = yield* query('.premium-badge');
 *   if (badge) {
 *     yield* addClass('premium-card');
 *   }
 * });
 * ```
 *
 * @example Nested queries for complex structures
 * ```typescript
 * watch('.data-table', function* () {
 *   const headerRow = yield* query('thead tr');
 *
 *   if (headerRow) {
 *     // Query within the header row
 *     const sortableHeaders = query(headerRow, '.sortable');
 *
 *     if (sortableHeaders) {
 *       yield* click(sortableHeaders, function* () {
 *         yield* toggleClass('sorted-asc sorted-desc');
 *       });
 *     }
 *   }
 *
 *   // Find specific cells
 *   const rows = yield* queryAll('tbody tr');
 *   for (const row of rows) {
 *     const statusCell = query(row, '.status-cell');
 *     const status = statusCell?.textContent;
 *
 *     if (status === 'error') {
 *       addClass(row, 'error-row');
 *     }
 *   }
 * });
 * ```
 *
 * @example Type-safe element queries
 * ```typescript
 * watch('.media-player', function* () {
 *   // Query with specific element types
 *   const video = yield* query<HTMLVideoElement>('video');
 *   const playBtn = yield* query<HTMLButtonElement>('.play-btn');
 *   const progressBar = yield* query<HTMLProgressElement>('.progress');
 *
 *   if (video && playBtn && progressBar) {
 *     yield* click(playBtn, function* () {
 *       if (video.paused) {
 *         video.play();
 *         yield* text(playBtn, 'Pause');
 *       } else {
 *         video.pause();
 *         yield* text(playBtn, 'Play');
 *       }
 *     });
 *
 *     // Update progress bar
 *     video.addEventListener('timeupdate', () => {
 *       progressBar.value = (video.currentTime / video.duration) * 100;
 *     });
 *   }
 * });
 * ```
 */
// Parent with type-safe generics
export function parent<T extends Element = HTMLElement>(
  element: Element,
  parentSelector?: string,
): T | null;
export function parent<T extends Element = HTMLElement>(
  selector: string,
  parentSelector?: string,
): T | null;
export function parent<T extends Element = HTMLElement>(
  parentSelector?: string,
): Workflow<T | null>;
/**
 * Gets the parent element, optionally matching a selector.
 *
 * Returns the immediate parent element. If a selector is provided, traverses up
 * the DOM tree to find the first ancestor matching the selector (similar to closest).
 * Returns null if no parent exists or no matching ancestor is found.
 *
 * @param element - Element whose parent to find (direct pattern)
 * @param selector - CSS selector to find element first (selector pattern)
 * @param parentSelector - Optional selector the parent must match
 * @returns T | null for direct/selector patterns, Workflow<T | null> for generators
 *
 * @example Finding parent containers with yield*
 * ```typescript
 * import { watch, parent, addClass } from 'watch-selector';
 *
 * watch('.child-element', function* () {
 *   // Get immediate parent
 *   const immediateParent = yield* parent();
 *
 *   // Find specific parent by selector
 *   const card = yield* parent('.card');
 *   const section = yield* parent('section');
 *
 *   if (card) {
 *     yield* click(function* () {
 *       // Affect parent card when child is clicked
 *       addClass(card, 'selected');
 *     });
 *   }
 * });
 * ```
 *
 * @example Event delegation via parent traversal
 * ```typescript
 * watch('.delete-btn', function* () {
 *   yield* click(function* () {
 *     // Find the parent list item to remove
 *     const listItem = yield* parent('li');
 *
 *     if (listItem) {
 *       // Animate before removing
 *       addClass(listItem, 'fade-out');
 *
 *       setTimeout(() => {
 *         listItem.remove();
 *       }, 300);
 *     }
 *   });
 * });
 * ```
 *
 * @example Finding data from parent elements
 * ```typescript
 * watch('.nested-component', function* () {
 *   // Find parent with data attributes
 *   const dataContainer = yield* parent('[data-id]');
 *
 *   if (dataContainer) {
 *     const id = dataContainer.dataset.id;
 *     const type = dataContainer.dataset.type;
 *
 *     yield* click(function* () {
 *       console.log(`Clicked item ${id} of type ${type}`);
 *     });
 *   }
 *
 *   // Find form parent for input validation
 *   const form = yield* parent('form');
 *   if (form) {
 *     yield* on('invalid', function* () {
 *       addClass(form, 'has-errors');
 *     });
 *   }
 * });
 * ```
 */
/**
 * Gets sibling elements, optionally filtered by selector.
 *
 * Returns all sibling elements (excluding the element itself). Siblings are elements
 * that share the same parent. If a selector is provided, returns only siblings
 * matching that selector. Always returns an array, even if empty.
 *
 * @param element - Element whose siblings to find (direct pattern)
 * @param selector - Element selector (selector pattern)
 * @param siblingSelector - Optional selector to filter siblings
 * @returns T[] for direct/selector patterns, Workflow<T[]> for generators
 *
 * @example Exclusive selection with siblings and yield*
 * ```typescript
 * import { watch, siblings, addClass, removeClass } from 'watch-selector';
 *
 * watch('.option', function* () {
 *   yield* click(function* () {
 *     // Deselect all siblings
 *     const allSiblings = yield* siblings();
 *     for (const sibling of allSiblings) {
 *       removeClass(sibling, 'selected');
 *     }
 *
 *     // Select clicked element
 *     yield* addClass('selected');
 *   });
 * });
 * ```
 *
 * @example Accordion with sibling awareness
 * ```typescript
 * watch('.accordion-header', function* () {
 *   yield* click(function* () {
 *     const content = yield* query('.accordion-content');
 *
 *     // Close all sibling accordions
 *     const siblingHeaders = yield* siblings('.accordion-header');
 *     for (const header of siblingHeaders) {
 *       const siblingContent = query(header.parentElement!, '.accordion-content');
 *       if (siblingContent) {
 *         removeClass(header, 'expanded');
 *         hide(siblingContent);
 *       }
 *     }
 *
 *     // Toggle current accordion
 *     yield* toggleClass('expanded');
 *     if (content) {
 *       if (yield* hasClass('expanded')) {
 *         show(content);
 *       } else {
 *         hide(content);
 *       }
 *     }
 *   });
 * });
 * ```
 *
 * @example Navigation highlighting with siblings
 * ```typescript
 * watch('.nav-item', function* () {
 *   yield* click(function* () {
 *     // Remove active from all siblings
 *     const siblingItems = yield* siblings('.nav-item');
 *     siblingItems.forEach(item => {
 *       removeClass(item, 'active');
 *       removeClass(item, 'bg-primary');
 *     });
 *
 *     // Add active to clicked item
 *     yield* addClass('active bg-primary');
 *
 *     // Update related content based on navigation
 *     const targetId = yield* data('target');
 *
 *     // Hide all sibling content panels
 *     const allPanels = document.querySelectorAll('.content-panel');
 *     allPanels.forEach(panel => hide(panel as HTMLElement));
 *
 *     // Show target panel
 *     if (targetId) {
 *       show(document.getElementById(targetId) as HTMLElement);
 *     }
 *   });
 * });
 * ```
 */
// Note: children, siblings, and parent implementations are defined below

export function parent(...args: any[]): any {
  // Direct element parent
  if (args.length === 1 && isElement(args[0])) {
    const [element] = args as [Element];
    return element.parentElement as HTMLElement | null;
  }

  // CSS selector parent (non-generator context)
  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    looksLikeSelector(args[0])
  ) {
    const element = document.querySelector(args[0]);
    if (!element) return null;
    return element.parentElement;
  }

  // Generator pattern without filter
  // Generator pattern
  if (args.length === 0) {
    return (function* (): Generator<
      Operation<HTMLElement | null>,
      HTMLElement | null,
      any
    > {
      const result = yield ((context: WatchContext) => {
        return context.element.parentElement as HTMLElement | null;
      }) as Operation<HTMLElement | null>;
      return result;
    })();
  }

  // Generator pattern with optional selector filter
  if (args.length === 1) {
    const [selector] = args;
    return (function* (): Generator<
      Operation<Element | null>,
      Element | null,
      any
    > {
      const result = yield ((context: WatchContext) => {
        if (!selector) {
          return context.element.parentElement;
        }
        let current = context.element.parentElement;
        while (current) {
          if (current.matches(selector)) {
            return current;
          }
          current = current.parentElement;
        }
        return null;
      }) as Operation<Element | null>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for parent(): ${args.length} arguments provided`,
  );
}

// Children traversal with improved type inference
export function children<T extends Element = HTMLElement>(
  element: Element,
): T[];
export function children<T extends Element = HTMLElement>(
  selector: string,
): T[];
export function children<T extends Element = HTMLElement>(): Workflow<T[]>;
export function children<T extends Element = HTMLElement>(
  selector?: string,
): Workflow<T[]>;

export function children<T extends Element = HTMLElement>(...args: any[]): any {
  // Direct element children
  if (args.length === 1 && isElement(args[0])) {
    const [element] = args as [Element];
    return Array.from(element.children).filter(
      (child): child is T => child instanceof Element,
    ) as T[];
  }

  // CSS selector children (non-generator context)
  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    looksLikeSelector(args[0])
  ) {
    const element = document.querySelector(args[0]);
    if (!element) return [];
    return Array.from(element.children);
  }

  // Generator pattern without filter
  // Generator pattern
  if (args.length === 0) {
    return (function* (): Generator<Operation<T[]>, T[], any> {
      const result = yield ((context: WatchContext) => {
        return Array.from(context.element.children).filter(
          (child): child is T => child instanceof Element,
        ) as T[];
      }) as Operation<T[]>;
      return result;
    })();
  }

  // Generator pattern with optional selector filter
  if (args.length === 1) {
    const [selector] = args;
    return (function* (): Generator<Operation<Element[]>, Element[], any> {
      const result = yield ((context: WatchContext) => {
        if (!selector) {
          return Array.from(context.element.children);
        }
        return Array.from(context.element.children).filter((child) =>
          child.matches(selector),
        );
      }) as Operation<Element[]>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for children(): ${args.length} arguments provided`,
  );
}

export function siblings<T extends Element = HTMLElement>(
  element: Element,
  selector?: string,
): T[];
export function siblings<T extends Element = HTMLElement>(
  selector: string,
): T[];
export function siblings<T extends Element = HTMLElement>(): Workflow<T[]>;
export function siblings<T extends Element = HTMLElement>(
  selector?: string,
): Workflow<T[]>;

export function siblings<T extends Element = HTMLElement>(...args: any[]): any {
  const getSiblings = <E extends Element>(element: E): T[] => {
    const parent = element.parentElement;
    if (!parent) return [];
    return Array.from(parent.children).filter(
      (child): child is T => child !== element && child instanceof Element,
    ) as T[];
  };

  // Direct element siblings
  if (args.length === 1 && isElement(args[0])) {
    const [element] = args as [Element];
    return getSiblings<Element>(element);
  }

  // CSS selector siblings (non-generator context)
  if (
    args.length === 1 &&
    typeof args[0] === "string" &&
    looksLikeSelector(args[0])
  ) {
    const element = document.querySelector(args[0]);
    if (!element) return [];
    return getSiblings<Element>(element);
  }

  // Generator pattern without filter
  if (args.length === 0) {
    return (function* (): Generator<Operation<T[]>, T[], any> {
      const result = yield ((context: WatchContext) => {
        return getSiblings<Element>(context.element);
      }) as Operation<T[]>;
      return result;
    })();
  }

  // Generator pattern with optional selector filter
  if (args.length === 1) {
    const [selector] = args as [string | undefined];
    return (function* (): Generator<Operation<T[]>, T[], any> {
      const result = yield ((context: WatchContext) => {
        if (!selector) {
          return getSiblings<Element>(context.element);
        }
        return getSiblings<Element>(context.element).filter(
          (sibling): sibling is T => sibling.matches(selector),
        ) as T[];
      }) as Operation<T[]>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for siblings(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Safe HTML Function
// ============================================================================

export function safeHtml<T extends HTMLElement = HTMLElement>(
  element: T,
  content: string,
): void;
export function safeHtml(selector: string | CSSSelector, content: string): void;
export function safeHtml(content: string): Workflow<void>;

export function safeHtml(...args: any[]): any {
  const sanitizeHtml = (content: string): string => {
    // Create a temporary element to parse the HTML
    const temp = document.createElement("div");
    temp.innerHTML = content;

    // Remove dangerous elements
    const dangerousElements = temp.querySelectorAll(
      'script, iframe, object, embed, link[rel="import"], meta, base',
    );
    dangerousElements.forEach((el) => el.remove());

    // Remove dangerous attributes
    const allElements = temp.getElementsByTagName("*");
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const attrs = el.attributes;
      for (let j = attrs.length - 1; j >= 0; j--) {
        const attr = attrs[j];
        if (
          attr.name.startsWith("on") ||
          attr.value.includes("javascript:") ||
          attr.value.includes("data:text/html")
        ) {
          el.removeAttribute(attr.name);
        }
      }
    }

    return temp.innerHTML;
  };

  // Direct element manipulation
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, content] = args;
    element.innerHTML = sanitizeHtml(String(content));
    return;
  }

  // CSS selector manipulation
  if (args.length === 2 && typeof args[0] === "string") {
    const [selector, content] = args;
    const sanitized = sanitizeHtml(String(content));
    const elements = resolveElements(String(selector));
    elements.forEach((el) => {
      el.innerHTML = sanitized;
    });
    return;
  }

  // Generator pattern
  if (args.length === 1) {
    const [content] = args;
    return (function* (): Generator<Operation<void>, void, any> {
      yield ((context: WatchContext) => {
        context.element.innerHTML = sanitizeHtml(String(content));
      }) as Operation<void>;
    })();
  }

  throw new Error(
    `Invalid arguments for safeHtml(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Batch Operations
// ============================================================================

export function batchAll<T extends Element = HTMLElement>(
  elements: (T | string)[],
  operations: Array<(el: T) => void>,
): void;
export function batchAll<T extends Element = HTMLElement>(
  selector: string,
  operations: Array<(el: T) => void>,
): void;
export function batchAll<T extends Element = HTMLElement>(
  elements: (T | string)[],
  operations: Array<(el: T) => void>,
): Workflow<void>;

export function batchAll<T extends Element = HTMLElement>(...args: any[]): any {
  const executeBatch = <E extends Element>(
    elements: (E | string)[],
    operations: Array<(el: E) => void>,
  ) => {
    const resolvedElements: E[] = [];

    elements.forEach((elementLike) => {
      if (typeof elementLike === "string") {
        const found = document.querySelectorAll(elementLike);
        found.forEach((el) => {
          if (el instanceof Element) {
            resolvedElements.push(el as E);
          }
        });
      } else if (elementLike instanceof Element) {
        resolvedElements.push(elementLike as E);
      }
    });

    resolvedElements.forEach((element) => {
      operations.forEach((op) => op(element));
    });
  };

  // Handle string selector as first argument
  if (
    args.length === 2 &&
    typeof args[0] === "string" &&
    !isInGeneratorContext()
  ) {
    const [selector, operations] = args as [string, Array<(el: T) => void>];
    const elements = document.querySelectorAll(selector);
    executeBatch<T>(Array.from(elements) as T[], operations);
    return;
  }

  // Direct execution with elements array
  if (args.length === 2) {
    const [elements, operations] = args as [
      (T | string)[],
      Array<(el: T) => void>,
    ];

    // Check if we're in a generator context
    if (isInGeneratorContext()) {
      // Return a workflow for generator context
      return (function* (): Generator<Operation<void>, void, any> {
        yield ((context: WatchContext) => {
          executeBatch<T>(elements, operations);
        }) as Operation<void>;
      })();
    } else {
      // Direct execution
      executeBatch<T>(elements, operations);
      return;
    }
  }

  throw new Error(
    `Invalid arguments for batchAll(): ${args.length} arguments provided`,
  );
}

// ============================================================================
// Interfaces for Type Safety
// ============================================================================

interface ChildWatcherInfo<El extends Element = HTMLElement> {
  selector: string;
  generator: (element: El) => Generator<any, void, any>;
  elements: Set<El>;
  cleanup: Map<El, () => void>;
  contexts: Map<El, any>;
}

class ChildWatcherManager<T extends Element = HTMLElement> {
  private parentElement: T;
  private observer: MutationObserver | null = null;
  private watchers: Map<string, ChildWatcherInfo<Element>> = new Map();

  constructor(parentElement: T) {
    this.parentElement = parentElement;
  }

  start() {
    if (this.observer) return;

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Handle added nodes
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            this.processAddedNode(node);
          }
        }

        // Handle removed nodes
        for (const node of Array.from(mutation.removedNodes)) {
          if (node instanceof HTMLElement) {
            this.processRemovedNode(node);
          }
        }
      }
    });

    this.observer.observe(this.parentElement, {
      childList: true,
      subtree: true,
    });
  }

  private processAddedNode(node: Element) {
    this.watchers.forEach((watcher) => {
      // Check if the node itself matches
      if (node.matches(watcher.selector)) {
        this.setupChild(node, watcher);
      }

      // Check descendants
      node.querySelectorAll(watcher.selector).forEach((child) => {
        if (child instanceof Element) {
          this.setupChild(child, watcher);
        }
      });
    });
  }

  private processRemovedNode(node: Element) {
    this.watchers.forEach((watcher) => {
      // Check if the node itself was being watched
      if (watcher.elements.has(node)) {
        this.teardownChild(node, watcher);
      }

      // Check descendants
      node.querySelectorAll(watcher.selector).forEach((child) => {
        if (child instanceof Element && watcher.elements.has(child)) {
          this.teardownChild(child, watcher);
        }
      });
    });
  }

  private setupChild(element: Element, watcher: ChildWatcherInfo<Element>) {
    if (watcher.elements.has(element)) return;

    // Add element to tracked set
    watcher.elements.add(element);

    // Create a minimal context for the child
    const context: WatchContext = {
      element: element as HTMLElement,
      state: new Map(),
      signal: new AbortController().signal,
    } as WatchContext;

    // Execute the generator
    const gen = watcher.generator(element);
    let result = gen.next();

    const cleanupFns: Array<() => void> = [];

    while (!result.done) {
      const value = result.value;

      if (typeof value === "function") {
        const opResult = value(context);

        // If the operation returns a cleanup function, store it
        if (typeof opResult === "function") {
          cleanupFns.push(opResult);
        }

        result = gen.next(opResult);
      } else {
        result = gen.next();
      }
    }

    watcher.contexts.set(element, result.value);
    if (cleanupFns.length > 0) {
      watcher.cleanup.set(element, () => {
        cleanupFns.forEach((fn) => fn());
      });
    }

    // Store context if needed
    if (watcher.contexts) {
      watcher.contexts.set(element, context);
    }
  }

  private teardownChild(child: Element, info: ChildWatcherInfo<Element>): void {
    const cleanup = info.cleanup.get(child);
    if (cleanup) {
      cleanup();
    }
    info.elements.delete(child);
    info.cleanup.delete(child);
  }

  register<El extends HTMLElement = HTMLElement>(
    selector: string,
    generator: (element: El) => Generator<any, any, any>,
  ): Map<El, any> {
    const existingWatcher = this.watchers.get(selector);
    if (existingWatcher) {
      const result = new Map<El, any>();
      existingWatcher.elements.forEach((el) => {
        result.set(el as El, null);
      });
      return result;
    }

    const watcher: ChildWatcherInfo<Element> = {
      selector,
      generator: generator as any,
      elements: new Set(),
      cleanup: new Map(),
      contexts: new Map(),
    };

    this.watchers.set(selector, watcher);

    // Process existing children
    this.parentElement.querySelectorAll(selector).forEach((child) => {
      if (child instanceof Element) {
        this.setupChild(child, watcher);
      }
    });

    // Start observing if not already
    this.start();

    const result = new Map<El, any>();
    watcher.elements.forEach((el) => {
      result.set(el as El, null);
    });
    return result;
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Clean up all watchers
    this.watchers.forEach((watcher) => {
      watcher.cleanup.forEach((cleanup) => cleanup());
      watcher.contexts.clear();
      watcher.cleanup.clear();
    });

    this.watchers.clear();
  }
}

// Store managers per parent element
const childWatcherManagers = new WeakMap<
  Element,
  ChildWatcherManager<Element>
>();

export function createChildWatcher<El extends HTMLElement = HTMLElement>(
  element: HTMLElement,
  selector: string,
  generator: (element: El) => Generator<any, any, any>,
): Map<El, any>;
export function createChildWatcher<El extends HTMLElement = HTMLElement>(
  selector: string,
  generatorFn: (element: HTMLElement) => Generator<any, void, any>,
): Workflow<Map<El, any>>;

export function createChildWatcher<El extends Element = HTMLElement>(
  ...args: any[]
): any {
  // Direct element version
  // Direct element child watcher
  if (args.length === 3 && isElement(args[0])) {
    const [element, selector, generator] = args as [
      Element,
      string,
      (element: Element) => Generator<any, void, any>,
    ];
    let manager = childWatcherManagers.get(element);
    if (!manager) {
      manager = new ChildWatcherManager<Element>(element);
      childWatcherManagers.set(element, manager);
    }
    return manager.register(
      selector,
      generator as (element: Element) => Generator<any, void, any>,
    );
  }

  // Generator pattern
  if (args.length === 2) {
    const [selector, generator] = args as [
      string,
      (element: Element) => Generator<any, void, any>,
    ];
    return (function* (): Generator<
      Operation<Map<HTMLElement, any>>,
      Map<HTMLElement, any>,
      any
    > {
      const result = yield ((context: WatchContext) => {
        let manager = childWatcherManagers.get(context.element);
        if (!manager) {
          manager = new ChildWatcherManager<Element>(context.element);
          childWatcherManagers.set(context.element, manager);

          // Register cleanup
          if (context.signal) {
            context.signal.addEventListener("abort", () => {
              manager!.destroy();
              childWatcherManagers.delete(context.element);
            });
          }
        }

        return manager.register(
          selector,
          generator as (element: Element) => Generator<any, void, any>,
        );
      }) as Operation<Map<HTMLElement, any>>;
      return result;
    })();
  }

  throw new Error(
    `Invalid arguments for createChildWatcher(): ${args.length} arguments provided`,
  );
}

// Alias for createChildWatcher
export const child = createChildWatcher;

// ============================================================================
// Type Exports for Better Developer Experience
// ============================================================================

export type {
  CSSLength,
  CSSLengthUnit,
  CSSColor,
  DisplayValue,
  PositionValue,
  StyleValue,
  StyleObject,
  AttributeObject,
  DataObject,
  CSSStyleProperties,
  FormElement,
  FocusableElement,
  ValueElement,
  ElementConstraint,
  HTMLElementConstraint,
  QueryConstraint,
  StrictElementMap,
  StrictSVGElementMap,
  InferElementFromSelector,
  SelectorElementMap,
  ChildWatcherInfo,
};

// ============================================================================
// Aliases
// ============================================================================

export const el = query;
export const all = queryAll;

// ============================================================================
// Utility Functions (exported for compatibility)
// ============================================================================

export {
  isHTMLElement as isElement,
  isElement as isElementLike,
  resolveElement,
};
