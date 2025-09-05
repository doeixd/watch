/**
 * @module fluent
 *
 * Fluent, chainable API for watch-selector.
 * Provides a jQuery-like interface with method chaining for elegant DOM manipulation.
 *
 * @example
 * ```typescript
 * import { selector, element } from 'watch-selector/fluent';
 *
 * // Chain multiple operations
 * selector('#button')
 *   .text('Click me!')
 *   .addClass('primary', 'large')
 *   .style('backgroundColor', 'blue')
 *   .click(() => console.log('Clicked!'));
 *
 * // Work with multiple elements
 * selector('.items')
 *   .addClass('found')
 *   .each((el, i) => console.log(`Item ${i}:`, el));
 * ```
 */

import type { ElementFromSelector } from "../types";

/**
 * Fluent interface for DOM manipulation with method chaining.
 */
export class FluentSelector<El extends Element = Element> {
  private elements: El[] = [];

  constructor(target: string | El | El[] | NodeListOf<El>) {
    if (typeof target === "string") {
      this.elements = Array.from(document.querySelectorAll(target)) as El[];
    } else if (target instanceof NodeList) {
      this.elements = Array.from(target);
    } else if (Array.isArray(target)) {
      this.elements = target;
    } else if (target instanceof Element) {
      this.elements = [target as El];
    } else {
      this.elements = [];
    }
  }

  // ============================================================================
  // Text Operations
  // ============================================================================

  /**
   * Sets text content on all matched elements.
   */
  text(content: string | number): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.textContent = String(content);
    });
    return this;
  }

  /**
   * Gets text content from the first matched element.
   */
  getText(): string | null {
    const el = this.elements[0];
    return el ? el.textContent || "" : null;
  }

  /**
   * Gets text content from all matched elements.
   */
  getTextAll(): string[] {
    return this.elements.map((el) => el.textContent || "");
  }

  /**
   * Appends text to existing content.
   */
  appendText(content: string | number): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.textContent = (el.textContent || "") + String(content);
    });
    return this;
  }

  /**
   * Prepends text to existing content.
   */
  prependText(content: string | number): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.textContent = String(content) + (el.textContent || "");
    });
    return this;
  }

  // ============================================================================
  // HTML Operations
  // ============================================================================

  /**
   * Sets HTML content on all matched elements WITHOUT sanitization.
   * WARNING: This method is unsafe and can introduce XSS vulnerabilities.
   * Use safeHtml() for untrusted content.
   * @deprecated Use safeHtml() for untrusted content
   */
  html(content: string): FluentSelector<El> {
    console.warn(
      "[watch-selector] html() is unsafe for untrusted content. Consider using safeHtml() instead.",
    );
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.innerHTML = content;
      }
    });
    return this;
  }

  /**
   * Sets sanitized HTML content on all matched elements.
   * Sanitizes content by parsing it in a sandboxed element and removing dangerous elements/attributes.
   */
  safeHtml(content: string): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        // Create a temporary element to parse the HTML
        const temp = document.createElement("div");
        temp.innerHTML = content;

        // Remove dangerous elements
        const dangerousElements = temp.querySelectorAll(
          "script, iframe, object, embed, link, style, meta, base",
        );
        dangerousElements.forEach((elem) => elem.remove());

        // Remove dangerous attributes
        const allElements = temp.querySelectorAll("*");
        allElements.forEach((elem) => {
          // Remove event handlers
          for (const attr of Array.from(elem.attributes)) {
            if (
              attr.name.startsWith("on") ||
              (attr.name === "href" && attr.value.startsWith("javascript:"))
            ) {
              elem.removeAttribute(attr.name);
            }
          }
        });

        el.innerHTML = temp.innerHTML;
      }
    });
    return this;
  }

  /**
   * Gets HTML content from the first matched element.
   */
  getHtml(): string | null {
    const el = this.elements[0];
    return el && el instanceof HTMLElement ? el.innerHTML : null;
  }

  // ============================================================================
  // Class Operations
  // ============================================================================

  /**
   * Adds CSS classes to all matched elements.
   */
  addClass(...classes: string[]): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.classList.add(...classes);
    });
    return this;
  }

  /**
   * Removes CSS classes from all matched elements.
   */
  removeClass(...classes: string[]): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.classList.remove(...classes);
    });
    return this;
  }

  /**
   * Toggles a CSS class on all matched elements.
   */
  toggleClass(className: string, force?: boolean): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.classList.toggle(className, force);
    });
    return this;
  }

  /**
   * Checks if the first matched element has a class.
   */
  hasClass(className: string): boolean {
    const el = this.elements[0];
    return el ? el.classList.contains(className) : false;
  }

  /**
   * Checks if any matched element has a class.
   */
  hasClassAny(className: string): boolean {
    return this.elements.some((el) => el.classList.contains(className));
  }

  /**
   * Checks which matched elements have a class.
   */
  hasClassAll(className: string): boolean[] {
    return this.elements.map((el) => el.classList.contains(className));
  }

  // ============================================================================
  // Style Operations
  // ============================================================================

  /**
   * Sets a CSS style property on all matched elements.
   */
  style(prop: string, value: string): FluentSelector<El>;
  style(styles: Partial<CSSStyleDeclaration>): FluentSelector<El>;
  style(
    propOrStyles: string | Partial<CSSStyleDeclaration>,
    value?: string,
  ): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        if (typeof propOrStyles === "string" && value !== undefined) {
          (el.style as any)[propOrStyles] = value;
        } else if (typeof propOrStyles === "object") {
          Object.assign(el.style, propOrStyles);
        }
      }
    });
    return this;
  }

  /**
   * Gets a style property from the first matched element.
   */
  getStyle(prop: string): string | null {
    const el = this.elements[0];
    if (el instanceof HTMLElement) {
      return (el.style as any)[prop] || null;
    }
    return null;
  }

  /**
   * Sets multiple styles at once.
   */
  styles(styles: Partial<CSSStyleDeclaration>): FluentSelector<El> {
    return this.style(styles);
  }

  // ============================================================================
  // Attribute Operations
  // ============================================================================

  /**
   * Sets an attribute on all matched elements.
   */
  attr(name: string, value: string | number | boolean): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.setAttribute(name, String(value));
    });
    return this;
  }

  /**
   * Gets an attribute from the first matched element.
   */
  getAttr(name: string): string | null {
    const el = this.elements[0];
    return el ? el.getAttribute(name) : null;
  }

  /**
   * Removes an attribute from all matched elements.
   */
  removeAttr(name: string): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.removeAttribute(name);
    });
    return this;
  }

  /**
   * Checks if the first matched element has an attribute.
   */
  hasAttr(name: string): boolean {
    const el = this.elements[0];
    return el ? el.hasAttribute(name) : false;
  }

  // ============================================================================
  // Property Operations
  // ============================================================================

  /**
   * Sets a DOM property on all matched elements.
   */
  prop<K extends keyof El>(name: K, value: El[K]): FluentSelector<El> {
    this.elements.forEach((el) => {
      (el as any)[name] = value;
    });
    return this;
  }

  /**
   * Gets a DOM property from the first matched element.
   */
  getProp<K extends keyof El>(name: K): El[K] | undefined {
    const el = this.elements[0];
    return el ? (el as any)[name] : undefined;
  }

  // ============================================================================
  // Data Attribute Operations
  // ============================================================================

  /**
   * Sets a data attribute on all matched elements.
   */
  data(key: string, value: any): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.dataset[key] = String(value);
      }
    });
    return this;
  }

  /**
   * Gets a data attribute from the first matched element.
   */
  getData(key: string): string | undefined {
    const el = this.elements[0];
    if (el instanceof HTMLElement) {
      return el.dataset[key];
    }
    return undefined;
  }

  // ============================================================================
  // Event Operations
  // ============================================================================

  /**
   * Attaches a click event handler to all matched elements.
   */
  click(
    handler: EventListener,
    options?: AddEventListenerOptions,
  ): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.addEventListener("click", handler as EventListener, options);
      }
    });
    return this;
  }

  /**
   * Attaches an event handler to all matched elements.
   */
  on(
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.addEventListener(event, handler, options);
    });
    return this;
  }

  /**
   * Removes an event handler from all matched elements.
   */
  off(
    event: string,
    handler: EventListener,
    options?: EventListenerOptions,
  ): FluentSelector<El> {
    this.elements.forEach((el) => {
      el.removeEventListener(event, handler, options);
    });
    return this;
  }

  /**
   * Triggers a custom event on all matched elements.
   */
  emit(eventName: string, detail?: any): FluentSelector<El> {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
    });
    this.elements.forEach((el) => {
      el.dispatchEvent(event);
    });
    return this;
  }

  // ============================================================================
  // DOM Traversal
  // ============================================================================

  /**
   * Finds child elements matching a selector.
   */
  find<S extends string>(selector: S): FluentSelector<ElementFromSelector<S>> {
    const found: Element[] = [];
    this.elements.forEach((el) => {
      const children = el.querySelectorAll(selector);
      found.push(...Array.from(children));
    });
    return new FluentSelector(found as ElementFromSelector<S>[]);
  }

  /**
   * Gets the parent elements.
   */
  parent(): FluentSelector<HTMLElement> {
    const parents: HTMLElement[] = [];
    this.elements.forEach((el) => {
      if (el.parentElement && !parents.includes(el.parentElement)) {
        parents.push(el.parentElement);
      }
    });
    return new FluentSelector(parents);
  }

  /**
   * Gets all child elements.
   */
  children(): FluentSelector<Element> {
    const children: Element[] = [];
    this.elements.forEach((el) => {
      children.push(...Array.from(el.children));
    });
    return new FluentSelector(children);
  }

  /**
   * Gets sibling elements.
   */
  siblings(): FluentSelector<Element> {
    const siblings: Element[] = [];
    this.elements.forEach((el) => {
      if (el.parentElement) {
        const allChildren = Array.from(el.parentElement.children);
        siblings.push(...allChildren.filter((child) => child !== el));
      }
    });
    return new FluentSelector(siblings);
  }

  /**
   * Filters to elements matching a selector.
   */
  filter(selector: string): FluentSelector<El> {
    const filtered = this.elements.filter((el) => el.matches(selector));
    return new FluentSelector(filtered);
  }

  /**
   * Gets the first matched element.
   */
  first(): FluentSelector<El> {
    return new FluentSelector(this.elements[0] ? [this.elements[0]] : []);
  }

  /**
   * Gets the last matched element.
   */
  last(): FluentSelector<El> {
    const last = this.elements[this.elements.length - 1];
    return new FluentSelector(last ? [last] : []);
  }

  /**
   * Gets element at specific index.
   */
  eq(index: number): FluentSelector<El> {
    const el = this.elements[index];
    return new FluentSelector(el ? [el] : []);
  }

  // ============================================================================
  // Visibility Operations
  // ============================================================================

  /**
   * Shows all matched elements by removing display: none.
   */
  show(): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.display = "";
      }
    });
    return this;
  }

  /**
   * Hides all matched elements by setting display: none.
   */
  hide(): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.display = "none";
      }
    });
    return this;
  }

  /**
   * Toggles visibility of all matched elements.
   */
  toggle(show?: boolean): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        if (show === undefined) {
          el.style.display = el.style.display === "none" ? "" : "none";
        } else {
          el.style.display = show ? "" : "none";
        }
      }
    });
    return this;
  }

  // ============================================================================
  // Form Operations
  // ============================================================================

  /**
   * Sets the value of form elements.
   */
  val(value: string): FluentSelector<El> {
    this.elements.forEach((el) => {
      if ("value" in el) {
        (el as any).value = value;
      }
    });
    return this;
  }

  /**
   * Gets the value of the first form element.
   */
  getVal(): string | undefined {
    const el = this.elements[0];
    if (el && "value" in el) {
      return (el as any).value;
    }
    return undefined;
  }

  /**
   * Sets the checked state of checkboxes/radios.
   */
  checked(state: boolean): FluentSelector<El> {
    this.elements.forEach((el) => {
      if ("checked" in el) {
        (el as any).checked = state;
      }
    });
    return this;
  }

  /**
   * Gets the checked state of the first checkbox/radio.
   */
  isChecked(): boolean {
    const el = this.elements[0];
    if (el && "checked" in el) {
      return (el as any).checked;
    }
    return false;
  }

  // ============================================================================
  // Focus Operations
  // ============================================================================

  /**
   * Sets focus on the first matched element.
   */
  focus(): FluentSelector<El> {
    const el = this.elements[0];
    if (el instanceof HTMLElement) {
      el.focus();
    }
    return this;
  }

  /**
   * Removes focus from all matched elements.
   */
  blur(): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.blur();
      }
    });
    return this;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Executes a function for each matched element.
   */
  each(fn: (element: El, index: number) => void): FluentSelector<El> {
    this.elements.forEach(fn);
    return this;
  }

  /**
   * Maps matched elements to a new array.
   */
  map<T>(fn: (element: El, index: number) => T): T[] {
    return this.elements.map(fn);
  }

  /**
   * Gets an element at a specific index, or all elements if no index provided.
   */
  get(index?: number): El | El[] | undefined {
    if (index === undefined) {
      return [...this.elements];
    }
    return this.elements[index];
  }

  /**
   * Gets the number of matched elements.
   */
  length(): number {
    return this.elements.length;
  }

  /**
   * Checks if any elements were matched.
   */
  exists(): boolean {
    return this.elements.length > 0;
  }

  /**
   * Checks if selector matches any elements.
   */
  is(selector: string): boolean {
    return this.elements.some((el) => el.matches(selector));
  }

  /**
   * Adds more elements to the current selection.
   */
  add(selector: string | Element | Element[]): FluentSelector<El> {
    const newElements: El[] = [...this.elements];

    if (typeof selector === "string") {
      const found = document.querySelectorAll(selector);
      newElements.push(...(Array.from(found) as El[]));
    } else if (Array.isArray(selector)) {
      newElements.push(...(selector as El[]));
    } else if (selector instanceof Element) {
      newElements.push(selector as El);
    }

    return new FluentSelector(newElements);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a FluentSelector from a CSS selector string.
 *
 * @param sel - CSS selector to find elements
 * @returns FluentSelector instance for chaining
 *
 * @example
 * ```typescript
 * selector('#button')
 *   .text('Click me!')
 *   .addClass('primary')
 *   .click(() => console.log('Clicked!'));
 * ```
 */
export function selector<S extends string>(
  sel: S,
): FluentSelector<ElementFromSelector<S>> {
  return new FluentSelector(sel) as FluentSelector<ElementFromSelector<S>>;
}

/**
 * Creates a FluentSelector from an element.
 *
 * @param el - Element to wrap
 * @returns FluentSelector instance for chaining
 *
 * @example
 * ```typescript
 * const button = document.querySelector('button');
 * element(button)
 *   .addClass('active')
 *   .text('Active');
 * ```
 */
export function element<El extends Element>(el: El): FluentSelector<El> {
  return new FluentSelector(el);
}

/**
 * Creates a FluentSelector from multiple elements.
 *
 * @param els - Array or NodeList of elements
 * @returns FluentSelector instance for chaining
 *
 * @example
 * ```typescript
 * const items = document.querySelectorAll('.item');
 * elements(items)
 *   .addClass('found')
 *   .each((el, i) => console.log(`Item ${i}`));
 * ```
 */
export function elements<El extends Element>(
  els: El[] | NodeListOf<El>,
): FluentSelector<El> {
  return new FluentSelector(els);
}

/**
 * Alias for selector() for jQuery-like syntax.
 */
export const $fluent = selector;

// Re-export the class for advanced usage
export { FluentSelector as Fluent };

// Generator support for yield* patterns
export {
  FluentGeneratorSelector,
  gen,
  genFor,
  combine,
  when,
  $gen,
  type Workflow,
} from "./generator";
