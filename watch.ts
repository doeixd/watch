
  /**
   * @module
   *
   * This module contains functions helpful functions for adding event listeners to the dom. An alternative to web components or selector-observer
   *
   * @example
   * import { watch } from "@doeixd/doeixd";
   *
   * watch('.say-hello', ({on, state}) => {
   *  state.count = 0
   *  on('click', () => {
   *    alert(`Hello World${'!'.repeat(++state.count)}`)
   *  })
   * })
   * 
*/

/**
 * Creates a new MutationObserver instance and returns a function to observe an element.
 * @param {MutationCallback} fn - The callback function for the MutationObserver.
 * @param {MutationObserverInit} options - The options for the MutationObserver.
 * @returns {(element: Element | string) => void} A function that takes an element (or selector) and observes it with the provided options.
 */
export function createObserver(fn: MutationCallback, options: MutationObserverInit):(element: Node | string) => void  {
  const observer = new MutationObserver(fn);
  return function (element) {
    if (typeof element == 'string') element = document.querySelector(element) || '' as string;
    try {
      if (element instanceof Node) observer.observe(element, options);
    } catch (e) {}
  };
}

/**
 * Ensures that a function runs after the DOM is loaded.
 * @param {Function} fn - The function to run after the DOM is loaded.
 */
export function ensureRunAfterDOM(fn: Function) {
  let handleDOMLoaded = function() {
    fn()
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleDOMLoaded);
  } else {
    handleDOMLoaded();
  }
}

interface AttributeHandlerArgs  {
  el: Element,
  selector: string,
  record: MutationRecord
}
type AttributeHandler = (args: AttributeHandlerArgs) => void
type EventHandler = EventListenerOrEventListenerObject | null;
type EventHandlerOptions = AttributeHandler | AddEventListenerOptions;

type OnFunction = (
  el: Element
) => (
  eventName: keyof ElementEventMap,
  handler: EventHandler,
  attrHandlerOrOptions?: EventHandlerOptions,
  attrHandlerOptions?: EventHandlerOptions
) => void;

interface WatchEventArgs {
  el: Element;
  selector: string;
  record?: MutationRecord;
  idx: number;
  arr: NodeList | Element[];
  state: unknown;
  style: (styles: CSSStyleDeclaration) => { apply: (additionalStyles?: CSSStyleDeclaration) => void, revert: () => void }
  cleanup: () => void;
  on: ReturnType<OnFunction>;
}

type SetupFn = (args: WatchEventArgs) => void;

interface WatchOptions {
  parent?: Node;
  wrapper: (fn: Function) => (args: WatchEventArgs) => SetupFn;
}

declare global {
  interface Window {
    states: WeakMap<Element, any>;
    remove: WeakMap<Element, Function[]>;
    setups: WeakSet<Element>;
  }
}

/**
 * Watches for DOM elements matching the given selector and calls the setup function when they are added or removed.
 * @param {string} selector - The CSS selector to watch for.
 * @param {SetupFn} setup_fn - The function to call when elements matching the selector are added or removed.
 * @param {WatchOptions} [options] - Options for the watch function.
 */
export function watch(selector: string, setup_fn: SetupFn, options: WatchOptions = {parent: document, wrapper: ((fn) => (args) => fn(args))}) {
    var parent = options?.parent
    var wrapper = options?.wrapper

    /**
     * A WeakMap to store state associated with DOM elements.
     * @type {WeakMap}
     */
    var states = window?.states ?? new WeakMap();

    /**
     * A WeakMap to store cleanup functions associated with DOM elements.
     * @type {WeakMap}
     */
    var remove = window?.remove ?? new WeakMap();

    /**
     * A WeakSet to track DOM elements that have been set up.
     * @type {WeakSet}
     */
    var setups = window?.setups ?? new WeakSet();

    const setup = (args: Omit<WatchEventArgs, 'style' | 'state' | 'cleanup' | 'selector'> | WatchEventArgs) => {

      window.states ??= states;
      window.remove ??= remove;
      window.setups ??= setups;

      const cleanup = () => {
        if (remove.has(args.el)) {
          let fns = remove.get(args.el)
          if (fns) fns.forEach((fn) => fn?.(args)) 
        }
        setups.delete(args.el);
        remove.delete(args.el);
        states.delete(args.el);
      };

      if (args.el instanceof HTMLElement) {((args as WatchEventArgs).style = applyInlineStylesToElement(args.el))}
      (args as WatchEventArgs).cleanup = cleanup;
      if (setups.has(args.el)) return;
      wrapper(setup_fn)(args as WatchEventArgs);
      setups.add(args.el);
  }

  const eventNames = [
    ...new Set(
      [
        ...Object.getOwnPropertyNames(document),
        ...Object.getOwnPropertyNames(
          Object.getPrototypeOf(Object.getPrototypeOf(document))
        ),
        ...Object.getOwnPropertyNames(Object.getPrototypeOf(window)),
      ].filter(
        (k) =>
          k.startsWith('on') &&
          (document[k] == null || typeof document[k] == 'function')
      )
    ),
  ];

  const eventDoesExists = (name = '') => {
    return eventNames.includes(
      'on' + name.toLowerCase().trim().replace(/^on/i, '')
    );
  };
  let on =
    (el: Element) => (eventName: keyof ElementEventMap, handler: EventHandler, attrHandlerOrOptions?: EventHandlerOptions, attrHandlerOptions?: EventHandlerOptions) => {
      // eventName = eventName.trim().toLowerCase();
      if (eventDoesExists(eventName)) {
        if (typeof attrHandlerOptions == 'object' && handler) {
          // @ts-expect-error
          el.addEventListener(
            eventName,
            handler,
            attrHandlerOrOptions
          );
      }
        return;
      }

      if (['attr', 'attribute'].includes(eventName)) {
        let attr = handler;
        createObserver(
          (mutations) => {
            for (let mutation of mutations) {
              let shouldRun = false;
              if (typeof attr == 'string') {
                if (mutation.attributeName == attr) shouldRun = true;
              }
              if (attr instanceof RegExp) {
                if (attr.test(mutation?.attributeName || '')) shouldRun = true;
              }

              if (shouldRun && typeof attrHandlerOrOptions == 'function')
                attrHandlerOrOptions({ el, selector, record: mutation });
            }
          },
          {
            attributes: true,
            attributeOldValue: true,
          }
        )(el);

        return;
      }

      if (['text', 'textChange', 'textChanged'].includes(eventName)) {
        Array.from(el.childNodes)
          .filter((e) => e.nodeType === Node.TEXT_NODE && e?.textContent?.trim?.())
          .forEach((_el) => {
            createObserver(
              (mutations) => {
                for (let mutation of mutations) {
                  // @ts-expect-error
                  if (typeof handler =='function') handler({ el: _el, selector, record: mutation });
                }
              },
              {
                subtree: true,
                characterData: true,
                characterDataOldValue: true,
              }
            )(_el);
          });
        return;
      }

      if (['unmount', 'remove', 'dispose', 'cleanup'].includes(eventName)) {
        if (!remove.get(el)) remove.set(el, []);
        let re = remove.get(el)
        if(re && typeof handler == 'function') re.push(handler);
        return
      }
      
      // @ts-expect-error
      if (handler && typeof attrHandlerOptions == 'object') el?.addEventListener(eventName, handler, attrHandlerOrOptions)
    };

  document.querySelectorAll(selector).forEach((el, idx, arr) => {
    let state = states.has(el) ? states.get(el) : {};
    states.set(el, state);
    setup({ on: on(el), state, el, idx, arr });
  });

  createObserver(
    (mutations) => {
      for (let mutation of mutations) {
        if (!((mutation.target as any) instanceof Element)) continue;
        if (mutation.target instanceof Element && mutation.target?.matches?.(selector)) {
          let el = mutation.target;
          if (states.has(el)) continue;
          let state = states.has(el) ? states.get(el) : {};
          states.set(el, state);
          setup({ on: on(el), state, record: mutation, arr: [el], idx: 0, el });
        }

        if (mutation?.addedNodes?.length) {
          let idx = -1;
          for (let el of mutation.addedNodes) {
            idx += 1;
            if (!(mutation.target instanceof Element)) continue;
            if (el instanceof Element && el?.matches?.(selector)) {
              let state = states.has(el) ? states.get(el) : {};
              states.set(el, state);
              setup({
                on: on(el),
                state,
                record: mutation,
                arr: mutation?.addedNodes ?? [],
                idx,
                el,
              });
            }

            if (el instanceof Element)
            el?.querySelectorAll?.(selector).forEach((el, idx, arr) => {
              let state = states.has(el) ? states.get(el) : {};
              states.set(el, state);

              setup({ on: on(el), state, record: mutation, arr, idx, el });
            });
          }
        }

        if (mutation?.removedNodes?.length) {
          for (let el of mutation.removedNodes) {
            if (!(mutation.target as unknown) as any instanceof Element) continue;
            if (el instanceof Element)
            el?.querySelectorAll?.(selector).forEach((el, idx, arr) => {
              let state = states.has(el) ? states.get(el) : {};
              states.set(el, state);

              setup({ on: on(el), state, record: mutation, arr, idx, el });

              if (remove.has(el)) {
                let r = remove.get(el)
                if (r) r.forEach((fn) =>
                    fn({ on: on(el), state, record: mutation, arr, idx, el })
                  );
              }
            });
          }
        }
      }
    },
    {
      subtree: true,
      childList: true,
      attributes: true,
    }
  )(parent || document);
}

/**
 * Converts an object or value to a JSON string with indentation.
 * @param {Object|*} obj - The object or value to convert to JSON.
 * @returns {string} The JSON string representation of the input.
 */
export function JS(obj: object): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Creates a deep copy of an object using JSON serialization and deserialization.
 * @param {Object} obj - The object to clone.
 * @returns {Object} The cloned object.
 */
export function clone(obj: object) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Applies inline styles to an element and returns a function to apply or revert the styles.
 * @param {HTMLElement} element - The element to apply styles to.
 * @returns {(styles: CSSStyleDeclaration) => { apply: (additionalStyles?: CSSStyleDeclaration) => void, revert: () => void }} A function that takes a {@link CSSStyleDeclaration} object and returns an object with `apply` and `revert` methods for applying and reverting inline styles to the element.
 */
export function applyInlineStylesToElement(element: HTMLElement): (styles: CSSStyleDeclaration) => { apply: (additionalStyles?: CSSStyleDeclaration) => void, revert: () => void } {
    return function (styles) {
    const oldStyles = JSON.parse(JSON.stringify(element.style));

    const applyStyles = (obj) => {
      Object.entries(obj).forEach(([key, value]) => {
        element.style[key] = value;
      });
    };

    return {
      apply: (additionalStyles) => {
        applyStyles({ ...styles, ...additionalStyles });
      },
      revert: () => {
        applyStyles(oldStyles);
      },
    };
  };
}

/**
 * Creates an HTMLElement from an HTML string.
 * @param {string} html - The HTML string to convert.
 * @returns {unknown} The created HTMLElement.
 */
export function html(html: string): unknown {
  var template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild;
}



/**
 * Finds the first element that matches the given selector(s).
 * @param {string} selector - The CSS selector(s) to match.
 * @param {HTMLElement | ParentNode | null} [parent] - The parent element to search within.
 * @returns {HTMLElement | null} The first matching element, or null if none is found.
 */
export const find = (selector: string, parent?: Element | ParentNode): Element | null => (parent || document).querySelector(selector);

/**
 * Finds all elements that match the given selector(s).
 * @param {string | keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap} selectors - The CSS selector(s) to match.
 * @param {HTMLElement | ParentNode | null} [parent] - The parent element to search within.
 * @returns {NodeListOf<Element> | NodeListOf<HTMLElementTagNameMap[K]> | NodeListOf<SVGElementTagNameMap[K]>} A {@link NodeList} of matching elements.
 */
export const findAll = (selector: string | keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, parent?: ParentNode | Element) => Array.from((parent || document).querySelectorAll(selector));

/**
 * Converts a color value to the specified color space.
 * @param {string} color - The color value to convert.
 * @param {string} toSpace - The color space to convert to (e.g., 'srgb', 'display-p3', 'a98-rgb', 'rec2020', 'prophoto-rgb').
 * @returns {string} The converted color value in the specified color space.
 */
export function convertColor(color: string, toSpace: string) {
  let div = document.createElement('div');
  div.style.color = `color-mix(in ${toSpace}, ${color} 100%, transparent)`;
  div.style.display = 'none';
  document.body.appendChild(div);
  let result = window.getComputedStyle(div).color;
  div.remove();
  return result;
}

/**
 * Sets a query parameter in the URL.
 * @param {string} key - The key of the query parameter.
 * @param {string} value - The value of the query parameter.
 * @param {string} [type='soft'] - The type of URL update ('soft' for history state change, 'hard' for full page reload).
 */
export function setQueryParam(key: string, value: string, type: 'hard' | 'soft' = 'soft') {
  const url = new URL(window.location.toString());
  url.searchParams.set(key, value);
  if (type == 'hard') window.location.search = url.href;
  if (type == 'soft') history.pushState(url.searchParams, '', url.href);
}

/**
 * Gets the value of a query parameter from the URL.
 * @param {string} key - The key of the query parameter.
 * @returns {string|null} The value of the query parameter, or null if it doesn't exist.
 */
export function getQueryParam(key): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

/**
 * Gets all values of a query parameter from the URL.
 * @param {string} key - The key of the query parameter.
 * @returns {string[]} An array of all values for the query parameter.
 */
export function getAllQueryParam(key): string[] {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.getAll(key);
}

/**
 * An object containing functions to interact with URL query parameters.
 * @type {Params}
 * @property {typeof getQueryParam} get - Gets the value of a query parameter.
 * @property {typeof setQueryParam} set - Sets a query parameter.
 * @property {typeof getAllQueryParam} getAll - Gets all values of a query parameter.
 */
export const Params = {
  get: getQueryParam,
  set: setQueryParam,
  getAll: getAllQueryParam,
};


/**
 * Matches a regular expression against a value and returns the first match.
 * @param {RegExp} regex - The regular expression to match.
 * @param {string} value - The value to match against.
 * @returns {string|undefined} The first match, or null if no match is found.
 */
export function match(regex: RegExp, value: string): string | undefined {
  return String(value).match(regex)?.[0];
}

/**
 * Waits for the specified amount of time and then resolves with the result of the provided function.
 * @param {number} ms - The number of milliseconds to wait.
 * @param {Function} fn - The function to execute after the wait.
 * @returns {Promise} A Promise that resolves with the result of the provided function.
 */
export function wait<F extends (...args) => any>(ms: number, fn: F): Promise<ReturnType<F>> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fn().then((l) => l)), ms);
  });
}