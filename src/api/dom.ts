// Comprehensive DOM manipulation functions with dual API support

import type { 
  ElementFn, 
  FormElement,
  ElementFromSelector,
  GeneratorFunction,
  TypedGeneratorContext
} from '../types';
import { runOn } from '../watch';
import { cleanup, executeElementCleanup } from '../core/generator';
import { getCurrentContext, registerParentContext, unregisterParentContext } from '../core/context';
import { getState, setState } from '../core/state';

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

// HTML CONTENT - Enhanced with comprehensive overloads
export function html(element: HTMLElement, content: string): void;
export function html(element: HTMLElement): string;
export function html(selector: string, content: string): void;
export function html(selector: string): string | null;
export function html<El extends HTMLElement = HTMLElement>(content: string): ElementFn<El>;
export function html<El extends HTMLElement = HTMLElement>(): ElementFn<El, string>;
export function html(...args: any[]): any {
  if (args.length === 2) {
    const [elementLike, content] = args;
    const element = resolveElement(elementLike);
    if (element) {
      element.innerHTML = content;
    }
  } else if (args.length === 1 && isElementLike(args[0])) {
    const [elementLike] = args;
    const element = resolveElement(elementLike);
    return element?.innerHTML || null;
  } else if (args.length === 1) {
    const [content] = args;
    return ((element: HTMLElement) => {
      element.innerHTML = content;
    }) as ElementFn<HTMLElement>;
  } else {
    return ((element: HTMLElement) => element.innerHTML) as ElementFn<HTMLElement, string>;
  }
}

// CLASS MANIPULATION - Enhanced with multiple class support
export function addClass(element: HTMLElement, ...classNames: string[]): void;
export function addClass(selector: string, ...classNames: string[]): void;
export function addClass<El extends HTMLElement = HTMLElement>(...classNames: string[]): ElementFn<El>;
export function addClass(...args: any[]): any {
  if (args.length >= 2 && isElementLike(args[0])) {
    const [elementLike, ...classNames] = args;
    const element = resolveElement(elementLike);
    if (element) {
      // Split space-separated class names
      const splitClassNames = classNames.flatMap(name => name.split(/\s+/).filter(Boolean));
      element.classList.add(...splitClassNames);
    }
    return;
  } else {
    const classNames = args;
    return ((element: HTMLElement) => {
      // Split space-separated class names
      const splitClassNames = classNames.flatMap(name => name.split(/\s+/).filter(Boolean));
      element.classList.add(...splitClassNames);
    }) as ElementFn<HTMLElement>;
  }
}

export function removeClass(element: HTMLElement, ...classNames: string[]): void;
export function removeClass(selector: string, ...classNames: string[]): void;
export function removeClass<El extends HTMLElement = HTMLElement>(...classNames: string[]): ElementFn<El>;
export function removeClass(...args: any[]): any {
  if (args.length >= 2 && isElementLike(args[0])) {
    const [elementLike, ...classNames] = args;
    const element = resolveElement(elementLike);
    if (element) {
      // Split space-separated class names
      const splitClassNames = classNames.flatMap(name => name.split(/\s+/).filter(Boolean));
      element.classList.remove(...splitClassNames);
    }
    return;
  } else {
    const classNames = args;
    return ((element: HTMLElement) => {
      // Split space-separated class names
      const splitClassNames = classNames.flatMap(name => name.split(/\s+/).filter(Boolean));
      element.classList.remove(...splitClassNames);
    }) as ElementFn<HTMLElement>;
  }
}

export function toggleClass(element: HTMLElement, className: string, force?: boolean): boolean;
export function toggleClass(selector: string, className: string, force?: boolean): boolean;
export function toggleClass<El extends HTMLElement = HTMLElement>(className: string, force?: boolean): ElementFn<El, boolean>;
export function toggleClass(...args: any[]): any {
  if (args.length >= 2 && isElementLike(args[0])) {
    const [elementLike, className, force] = args;
    const element = resolveElement(elementLike);
    return element ? element.classList.toggle(className, force) : false;
  } else {
    const [className, force] = args;
    return ((element: HTMLElement) => {
      return element.classList.toggle(className, force);
    }) as ElementFn<HTMLElement, boolean>;
  }
}

export function hasClass(element: HTMLElement, className: string): boolean;
export function hasClass(selector: string, className: string): boolean;
export function hasClass<El extends HTMLElement = HTMLElement>(className: string): ElementFn<El, boolean>;
export function hasClass(...args: any[]): any {
  if (args.length === 2) {
    const [elementLike, className] = args;
    const element = resolveElement(elementLike);
    return element ? element.classList.contains(className) : false;
  } else {
    const [className] = args;
    return ((element: HTMLElement) => {
      return element.classList.contains(className);
    }) as ElementFn<HTMLElement, boolean>;
  }
}

/**
 * # style() - CSS Style Manipulation
 * 
 * Manipulate CSS styles on elements with full type safety and dual API support.
 * Supports both individual property setting and bulk style objects.
 * 
 * ## Usage
 * 
 * ### Direct Usage
 * ```typescript
 * // Set individual style property
 * style(myElement, 'color', 'red');
 * style('.my-element', 'backgroundColor', 'blue');
 * 
 * // Set multiple styles with object
 * style(myElement, {
 *   color: 'red',
 *   backgroundColor: 'blue',
 *   padding: '10px',
 *   borderRadius: '4px'
 * });
 * ```
 * 
 * ### Generator Usage
 * ```typescript
 * watch('button', function* () {
 *   yield style({
 *     padding: '10px 20px',
 *     borderRadius: '4px',
 *     backgroundColor: '#007bff',
 *     color: 'white'
 *   });
 *   
 *   yield on('hover', () => {
 *     yield style('backgroundColor', '#0056b3');
 *   });
 * });
 * 
 * // Dynamic styles based on state
 * watch('.progress-bar', function* () {
 *   const progress = getState('progress');
 *   yield style('width', `${progress}%`);
 * });
 * ```
 * 
 * ## Style Object Support
 * 
 * You can pass a style object for bulk updates:
 * 
 * ```typescript
 * const buttonStyles = {
 *   padding: '12px 24px',
 *   fontSize: '16px',
 *   fontWeight: 'bold',
 *   border: 'none',
 *   borderRadius: '6px',
 *   cursor: 'pointer'
 * };
 * 
 * style(element, buttonStyles);
 * ```
 * 
 * ## CSS Property Names
 * 
 * Use camelCase for CSS properties (backgroundColor, fontSize, etc.):
 * 
 * ```typescript
 * style(element, 'backgroundColor', 'red');  // ✅ Correct
 * style(element, 'background-color', 'red'); // ❌ Won't work
 * ```
 * 
 * @param element - Element or selector
 * @param styles - Style object or property name
 * @param value - Property value (when setting individual property)
 * @returns void for direct usage, ElementFn for generators
 */
export function style(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void;
export function style(element: HTMLElement, property: string, value: string): void;
export function style(selector: string, styles: Partial<CSSStyleDeclaration>): void;
export function style(selector: string, property: string, value: string): void;
export function style<El extends HTMLElement = HTMLElement>(styles: Partial<CSSStyleDeclaration>): ElementFn<El>;
export function style<El extends HTMLElement = HTMLElement>(property: string, value: string): ElementFn<El>;
export function style(...args: any[]): any {
  if (args.length === 2 && isElementLike(args[0])) {
    const [elementLike, stylesOrProperty] = args;
    const element = resolveElement(elementLike);
    if (element) {
      if (typeof stylesOrProperty === 'object') {
        Object.assign(element.style, stylesOrProperty);
      }
    }
  } else if (args.length === 3 && isElementLike(args[0])) {
    const [elementLike, property, value] = args;
    const element = resolveElement(elementLike);
    if (element) {
      (element.style as any)[property] = value;
    }
  } else if (args.length === 1) {
    const [stylesOrProperty] = args;
    if (typeof stylesOrProperty === 'object') {
      return ((element: HTMLElement) => {
        Object.assign(element.style, stylesOrProperty);
      }) as ElementFn<HTMLElement>;
    }
  } else if (args.length === 2) {
    const [property, value] = args;
    return ((element: HTMLElement) => {
      (element.style as any)[property] = value;
    }) as ElementFn<HTMLElement>;
  }
}

// ATTRIBUTE MANIPULATION - Enhanced
export function attr(element: HTMLElement, name: string, value: string): void;
export function attr(element: HTMLElement, name: string): string | null;
export function attr(selector: string, name: string, value: string): void;
export function attr(selector: string, name: string): string | null;
export function attr<El extends HTMLElement = HTMLElement>(name: string, value: string): ElementFn<El>;
export function attr<El extends HTMLElement = HTMLElement>(name: string): ElementFn<El, string | null>;
export function attr(...args: any[]): any {
  if (args.length === 3) {
    const [elementLike, name, value] = args;
    const element = resolveElement(elementLike);
    if (element) {
      element.setAttribute(name, value);
    }
  } else if (args.length === 2 && isElementLike(args[0])) {
    const [elementLike, name] = args;
    const element = resolveElement(elementLike);
    return element?.getAttribute(name) || null;
  } else if (args.length === 2) {
    const [name, value] = args;
    return ((element: HTMLElement) => {
      element.setAttribute(name, value);
    }) as ElementFn<HTMLElement>;
  } else {
    const [name] = args;
    return ((element: HTMLElement) => {
      return element.getAttribute(name);
    }) as ElementFn<HTMLElement, string | null>;
  }
}

export function removeAttr(element: HTMLElement, name: string): void;
export function removeAttr(selector: string, name: string): void;
export function removeAttr<El extends HTMLElement = HTMLElement>(name: string): ElementFn<El>;
export function removeAttr(...args: any[]): any {
  if (args.length === 2) {
    const [elementLike, name] = args;
    const element = resolveElement(elementLike);
    if (element) {
      element.removeAttribute(name);
    }
  } else {
    const [name] = args;
    return ((element: HTMLElement) => {
      element.removeAttribute(name);
    }) as ElementFn<HTMLElement>;
  }
}

export function hasAttr(element: HTMLElement, name: string): boolean;
export function hasAttr(selector: string, name: string): boolean;
export function hasAttr<El extends HTMLElement = HTMLElement>(name: string): ElementFn<El, boolean>;
export function hasAttr(...args: any[]): any {
  if (args.length === 2) {
    const [elementLike, name] = args;
    const element = resolveElement(elementLike);
    return element ? element.hasAttribute(name) : false;
  } else {
    const [name] = args;
    return ((element: HTMLElement) => {
      return element.hasAttribute(name);
    }) as ElementFn<HTMLElement, boolean>;
  }
}

// PROPERTY MANIPULATION - Enhanced
export function prop(element: HTMLElement, property: string, value: any): void;
export function prop(element: HTMLElement, property: string): any;
export function prop(selector: string, property: string, value: any): void;
export function prop(selector: string, property: string): any;
export function prop<El extends HTMLElement = HTMLElement>(property: string, value: any): ElementFn<El>;
export function prop<El extends HTMLElement = HTMLElement>(property: string): ElementFn<El, any>;
export function prop(...args: any[]): any {
  if (args.length === 3) {
    const [elementLike, property, value] = args;
    const element = resolveElement(elementLike);
    if (element) {
      (element as any)[property] = value;
    }
  } else if (args.length === 2 && isElementLike(args[0])) {
    const [elementLike, property] = args;
    const element = resolveElement(elementLike);
    return element ? (element as any)[property] : undefined;
  } else if (args.length === 2) {
    const [property, value] = args;
    return ((element: HTMLElement) => {
      (element as any)[property] = value;
    }) as ElementFn<HTMLElement>;
  } else {
    const [property] = args;
    return ((element: HTMLElement) => {
      return (element as any)[property];
    }) as ElementFn<HTMLElement, any>;
  }
}

// DATA ATTRIBUTES - Enhanced
export function data(element: HTMLElement, key: string, value: string): void;
export function data(element: HTMLElement, key: string): string | undefined;
export function data(selector: string, key: string, value: string): void;
export function data(selector: string, key: string): string | undefined;
export function data<El extends HTMLElement = HTMLElement>(key: string, value: string): ElementFn<El>;
export function data<El extends HTMLElement = HTMLElement>(key: string): ElementFn<El, string | undefined>;
export function data(...args: any[]): any {
  if (args.length === 3) {
    const [elementLike, key, value] = args;
    const element = resolveElement(elementLike);
    if (element) {
      element.dataset[key] = value;
    }
  } else if (args.length === 2 && isElementLike(args[0])) {
    const [elementLike, key] = args;
    const element = resolveElement(elementLike);
    return element?.dataset[key];
  } else if (args.length === 2) {
    const [key, value] = args;
    return ((element: HTMLElement) => {
      element.dataset[key] = value;
    }) as ElementFn<HTMLElement>;
  } else {
    const [key] = args;
    return ((element: HTMLElement) => element.dataset[key]) as ElementFn<HTMLElement, string | undefined>;
  }
}

// FORM VALUES - Enhanced
export function value(element: FormElement, val: string): void;
export function value(element: FormElement): string;
export function value(selector: string, val: string): void;
export function value(selector: string): string | null;
export function value<El extends FormElement = FormElement>(val: string): ElementFn<El>;
export function value<El extends FormElement = FormElement>(): ElementFn<El, string>;
export function value(...args: any[]): any {
  if (args.length === 2) {
    const [elementLike, val] = args;
    const element = resolveElement(elementLike) as FormElement;
    if (element && 'value' in element) {
      element.value = val;
    }
  } else if (args.length === 1 && isElementLike(args[0])) {
    const [elementLike] = args;
    const element = resolveElement(elementLike) as FormElement;
    return element?.value || '';
  } else if (args.length === 1) {
    const [val] = args;
    return ((element: FormElement) => {
      element.value = val;
    }) as ElementFn<FormElement>;
  } else {
    return ((element: FormElement) => element.value || '') as ElementFn<FormElement, string>;
  }
}

export function checked(element: HTMLInputElement, isChecked: boolean): void;
export function checked(element: HTMLInputElement): boolean;
export function checked(selector: string, isChecked: boolean): void;
export function checked(selector: string): boolean;
export function checked<El extends HTMLInputElement = HTMLInputElement>(isChecked: boolean): ElementFn<El>;
export function checked<El extends HTMLInputElement = HTMLInputElement>(): ElementFn<El, boolean>;
export function checked(...args: any[]): any {
  if (args.length === 2) {
    const [elementLike, isChecked] = args;
    const element = resolveElement(elementLike) as HTMLInputElement;
    if (element && element.type === 'checkbox' || element.type === 'radio') {
      element.checked = isChecked;
    }
  } else if (args.length === 1 && isElementLike(args[0])) {
    const [elementLike] = args;
    const element = resolveElement(elementLike) as HTMLInputElement;
    return element?.checked || false;
  } else if (args.length === 1) {
    const [isChecked] = args;
    return ((element: HTMLInputElement) => {
      element.checked = isChecked;
    }) as ElementFn<HTMLInputElement>;
  } else {
    return ((element: HTMLInputElement) => element.checked) as ElementFn<HTMLInputElement, boolean>;
  }
}

// FOCUS MANAGEMENT - Enhanced
export function focus(element: HTMLElement): void;
export function focus(selector: string): void;
export function focus<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function focus(...args: any[]): any {
  if (args.length === 1) {
    const [elementLike] = args;
    const element = resolveElement(elementLike);
    if (element) {
      element.focus();
    }
  } else {
    return ((element: HTMLElement) => {
      element.focus();
    }) as ElementFn<HTMLElement>;
  }
}

export function blur(element: HTMLElement): void;
export function blur(selector: string): void;
export function blur<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function blur(...args: any[]): any {
  if (args.length === 1) {
    const [elementLike] = args;
    const element = resolveElement(elementLike);
    if (element) {
      element.blur();
    }
  } else {
    return ((element: HTMLElement) => {
      element.blur();
    }) as ElementFn<HTMLElement>;
  }
}

// VISIBILITY - Enhanced
export function show(element: HTMLElement): void;
export function show(selector: string): void;
export function show<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function show(...args: any[]): any {
  if (args.length === 1) {
    const [elementLike] = args;
    const element = resolveElement(elementLike);
    if (element) {
      element.style.display = '';
    }
  } else {
    return ((element: HTMLElement) => {
      element.style.display = '';
    }) as ElementFn<HTMLElement>;
  }
}

export function hide(element: HTMLElement): void;
export function hide(selector: string): void;
export function hide<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function hide(...args: any[]): any {
  if (args.length === 1) {
    const [elementLike] = args;
    const element = resolveElement(elementLike);
    if (element) {
      element.style.display = 'none';
    }
  } else {
    return ((element: HTMLElement) => {
      element.style.display = 'none';
    }) as ElementFn<HTMLElement>;
  }
}

// DOM TRAVERSAL - Enhanced
export function query<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T | null;
export function query<T extends HTMLElement = HTMLElement>(selector: string): ElementFn<HTMLElement, T | null>;
export function query<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, selector] = args;
    return element.querySelector(selector) as T | null;
  } else {
    const [selector] = args;
    return ((element: HTMLElement) => {
      return element.querySelector(selector) as T | null;
    }) as ElementFn<HTMLElement, T | null>;
  }
}

export function queryAll<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T[];
export function queryAll<T extends HTMLElement = HTMLElement>(selector: string): ElementFn<HTMLElement, T[]>;
export function queryAll<T extends HTMLElement = HTMLElement>(...args: any[]): any {
  if (args.length === 2) {
    const [element, selector] = args;
    return Array.from(element.querySelectorAll(selector)) as T[];
  } else {
    const [selector] = args;
    return ((element: HTMLElement) => {
      return Array.from(element.querySelectorAll(selector)) as T[];
    }) as ElementFn<HTMLElement, T[]>;
  }
}

export function parent<T extends HTMLElement = HTMLElement>(selector?: string): ElementFn<HTMLElement, T | null> {
  return (element: HTMLElement) => {
    if (selector) {
      return element.closest<T>(selector);
    }
    return element.parentElement as T | null;
  };
}

export function children<T extends HTMLElement = HTMLElement>(): ElementFn<HTMLElement, T[]> {
  return (element: HTMLElement) => {
    return Array.from(element.children) as T[];
  };
}

export function siblings<T extends HTMLElement = HTMLElement>(selector?: string): ElementFn<HTMLElement, T[]> {
  return (element: HTMLElement) => {
    const parent = element.parentElement;
    if (!parent) return [];
    
    const allSiblings = Array.from(parent.children) as T[];
    const siblings = allSiblings.filter(sibling => sibling !== element);
    
    if (selector) {
      return siblings.filter(sibling => sibling.matches(selector));
    }
    return siblings;
  };
}

// Batch operations
export function batchAll(elements: (HTMLElement | string)[], ...operations: ElementFn<HTMLElement>[]): void {
  elements.forEach(elementLike => {
    const element = resolveElement(elementLike);
    if (element) {
      operations.forEach(op => op(element));
    }
  });
}

// Alias for consistency with context functions
export const el = query;
export const all = queryAll;



/**
 * @internal
 * This interface describes the properties stored for each watched child selector.
 * It's generic to preserve the specific element and generator types.
 */
interface WatchedSelectorInfo<
  ChildEl extends HTMLElement = HTMLElement,
  ChildGen extends GeneratorFunction<ChildEl, any> = GeneratorFunction<ChildEl, any>
> {
  generator: ChildGen;
  contexts: Map<ChildEl, Awaited<ReturnType<ChildGen>>>;
  setupFn: (el: ChildEl) => void;
  teardownFn: (el: ChildEl) => void;
}

/**
 * @internal
 * Manages all child watchers for a single parent element. This internal class
 * is the core of the `child()` function's efficiency and robustness.
 *
 * It ensures that only one `MutationObserver` is ever attached to a parent element,
 * regardless of how many `child()` watchers are declared within its `watch` scope.
 * This prevents performance degradation from multiple redundant observers.
 *
 * An instance of this class is created on the first `child()` call for a given
 * parent and is then stored in the parent's private state for reuse.
 */
class ChildWatcherManager {
  private parentElement: HTMLElement;
  private observer: MutationObserver;
  // The Map now stores `WatchedSelectorInfo` with an `any` type, but we will
  // use generics in the `register` method to ensure type safety upon retrieval.
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
    // Iterate over all registered selectors and their specific handlers.
    this.watchedSelectors.forEach(({ setupFn, teardownFn }, selector) => {
      const fn = action === 'setup' ? setupFn : teardownFn;
      if (node.matches(selector)) {
        fn(node);
      }
      node.querySelectorAll(selector).forEach(fn);
    });
  }

  /**
   * Registers a new child selector to be watched. This method is now fully generic.
   */
  public register<
    S extends string,
    ChildEl extends HTMLElement,
    ChildGen extends GeneratorFunction<ChildEl, any>
  >(
    childSelector: S,
    childGenerator: ChildGen
  ): Map<ChildEl, Awaited<ReturnType<ChildGen>>> {
    const existingWatcher = this.watchedSelectors.get(childSelector);
    if (existingWatcher) {
      return existingWatcher.contexts;
    }

    const childContexts = new Map<ChildEl, Awaited<ReturnType<ChildGen>>>();

    // These closures capture the specific ChildEl type from the generic signature.
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

    // We create a strongly-typed info object here.
    const selectorInfo: WatchedSelectorInfo<ChildEl, ChildGen> = {
      generator: childGenerator,
      contexts: childContexts,
      setupFn: setupChild,
      teardownFn: teardownChild,
    };
    
    // Although the map is `Map<string, any>`, we store the fully-typed object.
    this.watchedSelectors.set(childSelector, selectorInfo);
    
    // Process existing elements with the correctly-typed setup function.
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

// A Promise-like interface to make the returned map "yield-able".
interface YieldableMap<K, V> extends Map<K, V> {
  then(resolve: (value: Map<K, V>) => void): void;
}

/**
 * # createChildWatcher() - Create a Reactive Collection of Child Component APIs
 *
 * Establishes a live, type-safe link between a parent and its children. This
 * function is the primary tool for building complex, communicative component
 * hierarchies.
 *
 * It returns a reactive `Map` where keys are the child `HTMLElement` instances
 * and values are the public APIs `return`ed by each child's generator. This
 * map automatically updates as child elements are added to or removed from the DOM.
 *
 * ## Usage
 *
 * ```typescript
 * // In the parent's generator:
 * function* parentComponent() {
 *   const childApis = createChildWatcher('button.counter', counterLogic);
 *
 *   yield click('.reset-all', () => {
 *     for (const childApi of childApis.values()) {
 *       childApi.reset();
 *     }
 *   });
 * }
 * ```
 *
 * ## Best Practices
 *
 * 1.  **Call from a `watch` Context:** This function must be called from within a
 *     `watch()` generator, as it needs a parent context to attach to.
 * 2.  **Child API Design:** For a child to be useful to its parent, its generator
 *     should `return` an object containing methods the parent can call.
 * 3.  **Efficiency:** Multiple calls to `createChildWatcher` within the same parent
 *     are highly efficient, as they all share a single `MutationObserver`.
 *
 * @param childSelector The CSS selector used to find child elements.
 * @param childGenerator The generator function that defines the child's behavior and returns its public API.
 * @returns A reactive `Map<ChildEl, ChildApi>` that updates as children are added or removed.
 *          The map is also "thenable" for safe use with `yield` if needed.
 */
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
    console.warn('`createChildWatcher` was called outside of a `watch` generator context. It will not function correctly. Please ensure it is called inside a `watch()` generator.');
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

  // The `register` method is fully generic, so it returns a correctly typed Map.
  const contexts = manager.register<S, ChildEl, ChildGen>(childSelector, childGenerator);

  // The `contexts` variable is now correctly typed as `Map<ChildEl, ...>`,
  // so the `Object.assign` call will also be correctly typed.
  return Object.assign(contexts, {
    then: (resolve: (value: typeof contexts) => void) => resolve(contexts),
  });
}

/**
 * # child() - Alias for createChildWatcher()
 *
 * A shorter, more intuitive alias for `createChildWatcher`. It creates a
 * reactive collection of child component APIs.
 *
 * @param childSelector The CSS selector for the child elements.
 * @param childGenerator The generator for the children, which should `return` a public API object.
 * @returns A reactive `Map<ChildEl, ChildApi>` that updates as children are added or removed.
 */
export const child = createChildWatcher;