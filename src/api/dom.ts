// Comprehensive DOM manipulation functions with dual API support

import type {
  ElementFn,
  FormElement,
  ElementFromSelector,
  GeneratorFunction,
  TypedGeneratorContext,
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

// TEXT CONTENT
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
      element.textContent = String(content);
    }
    return;
  }
  if (args.length === 1 && isElementLike(args[0])) {
    const element = resolveElement(args[0]);
    return element?.textContent ?? null;
  }
  if (args.length === 1) {
    const [content] = args;
    return (element: HTMLElement) => {
      element.textContent = String(content);
    };
  }
  return (element: HTMLElement) => element.textContent ?? '';
}

// HTML CONTENT
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
      element.innerHTML = String(content);
    }
    return;
  }
  if (args.length === 1 && isElementLike(args[0])) {
    const element = resolveElement(args[0]);
    return element?.innerHTML ?? null;
  }
  if (args.length === 1) {
    const [content] = args;
    return (element: HTMLElement) => {
      element.innerHTML = String(content);
    };
  }
  return (element: HTMLElement) => element.innerHTML;
}

// CLASS MANIPULATION
export function addClass(element: HTMLElement, ...classNames: string[]): void;
export function addClass(selector: string, ...classNames: string[]): void;
export function addClass<El extends HTMLElement = HTMLElement>(...classNames: string[]): ElementFn<El>;
export function addClass(...args: any[]): any {
  const [elementLike, ...classNames] = args;
  if (isElementLike(elementLike)) {
    const element = resolveElement(elementLike);
    if (element) {
      const splitClassNames = classNames.flatMap(name => name.split(/\s+/).filter(Boolean));
      element.classList.add(...splitClassNames);
    }
  } else {
    const allClassNames = [elementLike, ...classNames];
    return (element: HTMLElement) => {
      const splitClassNames = allClassNames.flatMap(name => name.split(/\s+/).filter(Boolean));
      element.classList.add(...splitClassNames);
    };
  }
}

export function removeClass(element: HTMLElement, ...classNames: string[]): void;
export function removeClass(selector: string, ...classNames: string[]): void;
export function removeClass<El extends HTMLElement = HTMLElement>(...classNames: string[]): ElementFn<El>;
export function removeClass(...args: any[]): any {
  const [elementLike, ...classNames] = args;
  if (isElementLike(elementLike)) {
    const element = resolveElement(elementLike);
    if (element) {
      const splitClassNames = classNames.flatMap(name => name.split(/\s+/).filter(Boolean));
      element.classList.remove(...splitClassNames);
    }
  } else {
    const allClassNames = [elementLike, ...classNames];
    return (element: HTMLElement) => {
      const splitClassNames = allClassNames.flatMap(name => name.split(/\s+/).filter(Boolean));
      element.classList.remove(...splitClassNames);
    };
  }
}

export function toggleClass(element: HTMLElement, className: string, force?: boolean): boolean;
export function toggleClass(selector: string, className: string, force?: boolean): boolean;
export function toggleClass<El extends HTMLElement = HTMLElement>(className: string, force?: boolean): ElementFn<El, boolean>;
export function toggleClass(...args: any[]): any {
  if (isElementLike(args[0])) {
    const [elementLike, className, force] = args;
    const element = resolveElement(elementLike);
    return element ? element.classList.toggle(className, force) : false;
  }
  const [className, force] = args;
  return (element: HTMLElement) => element.classList.toggle(className, force);
}

export function hasClass(element: HTMLElement, className: string): boolean;
export function hasClass(selector: string, className: string): boolean;
export function hasClass<El extends HTMLElement = HTMLElement>(className: string): ElementFn<El, boolean>;
export function hasClass(...args: any[]): any {
  if (isElementLike(args[0])) {
    const [elementLike, className] = args;
    const element = resolveElement(elementLike);
    return element ? element.classList.contains(className) : false;
  }
  const [className] = args;
  return (element: HTMLElement) => element.classList.contains(className);
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
  if (isElementLike(args[0])) {
    const [elementLike, stylesOrProp, value] = args;
    const element = resolveElement(elementLike);
    if (!element) return value === undefined ? null : undefined;

    if (typeof stylesOrProp === 'object') {
      Object.assign(element.style, stylesOrProp);
    } else if (value === undefined) {
      return element.style.getPropertyValue(stylesOrProp) || (element.style as any)[stylesOrProp];
    } else {
      element.style.setProperty(stylesOrProp, value);
    }
  } else if (typeof args[0] === 'object') {
    return (element: HTMLElement) => Object.assign(element.style, args[0]);
  } else {
    return (element: HTMLElement) => element.style.setProperty(args[0], args[1]);
  }
}

// ATTRIBUTE & PROPERTY MANIPULATION
function createAccessor(type: 'attr' | 'prop' | 'data') {
  return function(...args: any[]): any {
    if (isElementLike(args[0])) {
      const [elementLike, nameOrObj, value] = args;
      const element = resolveElement(elementLike);
      if (!element) return;
      if (typeof nameOrObj === 'object') {
        Object.entries(nameOrObj).forEach(([key, val]) => {
          if (type === 'attr') element.setAttribute(key, String(val));
          else if (type === 'prop') (element as any)[key] = val;
          else if (type === 'data') element.dataset[key] = String(val);
        });
      } else if (value === undefined) {
        if (type === 'attr') return element.getAttribute(nameOrObj);
        if (type === 'prop') return (element as any)[nameOrObj];
        if (type === 'data') return element.dataset[nameOrObj];
      } else {
        if (type === 'attr') element.setAttribute(nameOrObj, String(value));
        else if (type === 'prop') (element as any)[nameOrObj] = value;
        else if (type === 'data') element.dataset[nameOrObj] = String(value);
      }
    } else {
      const [nameOrObj, value] = args;
      return (element: HTMLElement) => {
        if (typeof nameOrObj === 'object') {
          Object.entries(nameOrObj).forEach(([key, val]) => {
            if (type === 'attr') element.setAttribute(key, String(val));
            else if (type === 'prop') (element as any)[key] = val;
            else if (type === 'data') element.dataset[key] = String(val);
          });
        } else if (value === undefined) {
            if (type === 'attr') return element.getAttribute(nameOrObj);
            if (type === 'prop') return (element as any)[nameOrObj];
            if (type === 'data') return element.dataset[nameOrObj];
        } else {
          if (type === 'attr') element.setAttribute(nameOrObj, String(value));
          else if (type === 'prop') (element as any)[nameOrObj] = value;
          else if (type === 'data') element.dataset[nameOrObj] = String(value);
        }
      };
    }
  };
}

export const attr = createAccessor('attr');
export const prop = createAccessor('prop');
export const data = createAccessor('data');

export function removeAttr(element: HTMLElement, ...names: string[]): void;
export function removeAttr(selector: string, ...names: string[]): void;
export function removeAttr<El extends HTMLElement = HTMLElement>(...names: string[]): ElementFn<El>;
export function removeAttr(...args: any[]): any {
  if (isElementLike(args[0])) {
    const [elementLike, ...names] = args;
    const element = resolveElement(elementLike);
    if (element) {
      names.flat().forEach(name => element.removeAttribute(name));
    }
  } else {
    return (element: HTMLElement) => {
      args.flat().forEach(name => element.removeAttribute(name));
    };
  }
}

export function hasAttr(element: HTMLElement, name: string): boolean;
export function hasAttr(selector: string, name: string): boolean;
export function hasAttr<El extends HTMLElement = HTMLElement>(name: string): ElementFn<El, boolean>;
export function hasAttr(...args: any[]): any {
  if (isElementLike(args[0])) {
    const [elementLike, name] = args;
    const element = resolveElement(elementLike);
    return element ? element.hasAttribute(name) : false;
  }
  const [name] = args;
  return (element: HTMLElement) => element.hasAttribute(name);
}

// FORM VALUES
export const value = createAccessor('prop');
export const checked = createAccessor('prop');

// FOCUS MANAGEMENT
export function focus<El extends HTMLElement>(element: El): void;
export function focus<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function focus(...args: any[]): any {
  if (args.length === 1 && isElementLike(args[0])) {
    resolveElement(args[0])?.focus();
  } else {
    return (element: HTMLElement) => element.focus();
  }
}

export function blur<El extends HTMLElement>(element: El): void;
export function blur<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function blur(...args: any[]): any {
  if (args.length === 1 && isElementLike(args[0])) {
    resolveElement(args[0])?.blur();
  } else {
    return (element: HTMLElement) => element.blur();
  }
}

// VISIBILITY
export function show<El extends HTMLElement>(element: El): void;
export function show<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function show(...args: any[]): any {
  const showFn = (element: HTMLElement) => {
    const display = element.dataset.originalDisplay ?? '';
    element.style.display = display;
    delete element.dataset.originalDisplay;
  };
  if (args.length === 1 && isElementLike(args[0])) {
    showFn(resolveElement(args[0])!);
  } else {
    return showFn;
  }
}

export function hide<El extends HTMLElement>(element: El): void;
export function hide<El extends HTMLElement = HTMLElement>(): ElementFn<El>;
export function hide(...args: any[]): any {
  const hideFn = (element: HTMLElement) => {
    if (element.style.display !== 'none') {
        element.dataset.originalDisplay = element.style.display;
        element.style.display = 'none';
    }
  };
  if (args.length === 1 && isElementLike(args[0])) {
    hideFn(resolveElement(args[0])!);
  } else {
    return hideFn;
  }
}

// DOM TRAVERSAL
export function query<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T | null;
export function query<T extends HTMLElement = HTMLElement>(selector: string): ElementFn<HTMLElement, T | null>;
export function query(...args: any[]): any {
  if (isElementLike(args[0])) {
    const [element, selector] = args;
    return resolveElement(element)?.querySelector(selector) ?? null;
  }
  const [selector] = args;
  return (element: HTMLElement) => element.querySelector(selector);
}

export function queryAll<T extends HTMLElement = HTMLElement>(element: HTMLElement, selector: string): T[];
export function queryAll<T extends HTMLElement = HTMLElement>(selector: string): ElementFn<HTMLElement, T[]>;
export function queryAll(...args: any[]): any {
  if (isElementLike(args[0])) {
    const [element, selector] = args;
    return Array.from(resolveElement(element)?.querySelectorAll(selector) ?? []);
  }
  const [selector] = args;
  return (element: HTMLElement) => Array.from(element.querySelectorAll(selector));
}

export function parent<T extends HTMLElement = HTMLElement>(selector?: string): ElementFn<HTMLElement, T | null> {
  return (element: HTMLElement) => selector ? element.closest<T>(selector) : (element.parentElement as T | null);
}

export function children<T extends HTMLElement = HTMLElement>(selector?: string): ElementFn<HTMLElement, T[]> {
  return (element: HTMLElement) => {
    const children = Array.from(element.children) as T[];
    return selector ? children.filter(child => child.matches(selector)) : children;
  };
}

export function siblings<T extends HTMLElement = HTMLElement>(selector?: string): ElementFn<HTMLElement, T[]> {
  return (element: HTMLElement) => {
    if (!element.parentElement) return [];
    const siblings = Array.from(element.parentElement.children).filter(child => child !== element) as T[];
    return selector ? siblings.filter(sibling => sibling.matches(selector)) : siblings;
  };
}

// BATCH OPERATIONS
export function batchAll(elements: (HTMLElement | string)[], operations: ElementFn<HTMLElement>[]): void {
  elements.forEach(elementLike => {
    const element = resolveElement(elementLike);
    if (element) {
      operations.forEach(op => op(element));
    }
  });
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