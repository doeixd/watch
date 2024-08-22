// <reference lib="dom" />

  /**
   * @module
   *
   * This module contains functions helpful functions for adding event listeners to the dom. An alternative to web components or selector-observer
   *
   * @example
   * import { watch } from "@doeixd/watch";
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

interface GenericHandlerArgs<E extends Element  | Node = Element>  {
  el: E,
  selector: string,
  record: MutationRecord
}
type GenericEventHandler<El extends Element = Element, Ev extends Event = CustomEvent, Data = Ev extends { detail: infer Detail } ? Detail : unknown> =  (this: El, e: Ev, data?: Data) => void
type GenericHandler<E extends Element | Node = Element>  = (args: GenericHandlerArgs<E>,  ...rest: unknown[]) => void
type AttributeFilter = RegExp | string
type EventHandler = EventListenerOrEventListenerObject | AttributeFilter;
type EventHandlerOptions = GenericHandler | AddEventListenerOptions;
type AttributeString = 'attr' | 'attribute'
type EventMapFor<T extends Element> = DocumentEventMap & HTMLElementEventMap;
type UnmountString = 'unmount' | 'dispose' | 'cleanup';
type TextString = 'text' | 'textChanged' | 'textChange'


function isPlatformEventHandler <El extends Element, E extends keyof EventMapFor<El>>(eventName: E, handler: unknown): handler is ((this: El, ev: EventMapFor<El>[E]) => void) {
  if (typeof handler == 'function' && isEventName(eventName)) return true 
  return false
}

function isGenericEventHandler<El extends Element>(name, handler): handler is GenericEventHandler {
  if (typeof handler == 'function' && (!isPlatformEventHandler<El, typeof name>(name, handler) || !isEventName(name)) && !isTextString(name) && !isUnmountString(name)) return true
  return false
}

function isGenericHandler<El extends Element | Node, N extends string>(name: N, handler: unknown): handler is GenericHandler<El> {
  if (!isEventName(name) && typeof handler == 'function') return true
  return false
}

const isAttributeString = (arg: string): arg is AttributeString => /^attr/gi.test(arg.trim())
const isTextString = (arg: string): arg is TextString => /^(?:text|textChange)/gi.test(arg.trim())
const isUnmountString = (arg: string): arg is UnmountString => /^(?:unmount|dispose|cleanup)/gi.test(arg.trim())

function isAttributeFilter (arg: unknown): arg is AttributeFilter {
  if (typeof arg == 'string' || arg instanceof RegExp) return true
  return false
}
// type ValidEventNames<T> = keyof EventMapFor<T>;


// addEventListener<K extends keyof DocumentEventMap>(type: K, listener: (this: Document, ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
// type CreateOnFunction<El extends Element = Element> = (
//   el: El
// ) => <E extends keyof EventMapFor<El>>(
//   eventName: E,
//   handler: ((this: El, ev: EventMapFor<El>[E]) => void) | AttributeFilter | GenericHandler<El> | GenericEventHandler<El>,
//   attrHandlerOrOptions?: EventHandlerOptions,
//   attrHandlerOptions?: EventHandlerOptions
// ) => void;

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

function isEventName <El extends Element = Element> (arg: string): arg is keyof EventMapFor<El> {
  return eventDoesExists(arg)
} 

function isEventListenerOption (arg: unknown): arg is AddEventListenerOptions {
  if (typeof arg == 'object') return true
  return false
}

type CreateOnFunction<El1 extends Element = Element> = (
  el: El1
) => <El extends Element = El1, Type extends ((keyof EventMapFor<El> | TextString | AttributeString | UnmountString) | Event | string) = keyof EventMapFor<El> | AttributeString | UnmountString | TextString> (
  type: Type extends keyof EventMapFor<El> 
    ? Type
    : Type extends string
      ? Type extends AttributeString
        ? AttributeString
        : Type extends TextString
          ? TextString 
          : Type extends UnmountString
            ? UnmountString
            : string
      : never, 
  handlerOrAttributeFilter: Type extends keyof EventMapFor<El> 
    ? (this: El, ev: EventMapFor<El>[Type]) => void
    : Type extends string
      ? Type extends AttributeString
        ? AttributeFilter
        : Type extends TextString
          ? GenericHandler<CharacterData> 
          : Type extends UnmountString
            ? GenericHandler<El>
            : (this: El, e: Event) => void
      : Type extends Event
        ? (this: El, e: Type) => void
        : never, 
  optionsOrAttributeHandler?: Type extends keyof EventMapFor<El>
    ? AddEventListenerOptions
    : Type extends string
      ? Type extends AttributeString
        ? GenericHandler<El1> 
        : AddEventListenerOptions
      : Type extends Event
        ? AddEventListenerOptions
        : never
) => void 
  // Type extends keyof EventMapFor<El> 
  //   ? ( type: Type, 
  //       listener: (this: El, ev: EventMapFor<El>[Type] ) => void, 
  //       options?: AddEventListenerOptions
  //     ) => void 
  //   : Type extends string 
  //     ? Lowercase<Type> extends AttributeString 
  //       ? (type: AttributeString, attributeFilter: AttributeFilter, handler: (args: {el: El, record: MutationRecord, selector: string }) => void ) => void 
  //       : Lowercase<Type> extends TextString
  //         ? (type: TextString, handler: GenericHandler<CharacterData>) => void 
  //         : Lowercase<Type> extends UnmountString
  //           ? (type: UnmountString, handler: GenericHandler<El>) => void
  //           :(type: Type, handler: GenericHandler<El>) => void
  //     : (type: Type, handler: GenericHandler<El>) => void

interface WatchEventArgs<El extends Element = Element> {
  el: El;
  selector: string;
  record?: MutationRecord;
  idx: number;
  arr: NodeList | Element[] | El[];
  state: unknown;
  style: (styles: CSSStyleDeclaration) => { apply: (additionalStyles?: CSSStyleDeclaration) => void, revert: () => void }
  cleanup: () => void;
  on: ReturnType<CreateOnFunction<El>>;
}

type SetupFn<Return= unknown> = (args: WatchEventArgs) => Return;

interface WatchOptions {
  parent?: Node;
  wrapper: (fn: Function) => (args: WatchEventArgs) => SetupFn;
}

// declare global {
  interface Window {
    states: WeakMap<Element, any>;
    remove: WeakMap<Element, Function[]>;
    setups: WeakSet<Element>;
  }
// }

/**
 * Watches for DOM elements matching the given selector and calls the setup function when they are added or removed.
 * @param {string} selector - The CSS selector to watch for.
 * @param {SetupFn} setup_fn - The function to call when elements matching the selector are added or removed.
 * @param {WatchOptions} [options] - Options for the watch function. 
 * @param {Node} [options.parent=document] - The parent node to observe for changes.
 * @returns {WatchReturnType} An array of results from the setup function, one for each matching element.
 */
export function watch<W_El extends Element = Element, ReturnedType = unknown> (selector: string, setup_fn: SetupFn<ReturnedType>, options: WatchOptions = {parent: document, wrapper: ((fn) => (args) => fn(args))}): ReturnedType | undefined {
    var parent = options?.parent

    /**
     * A WeakMap to store state associated with DOM elements.
     * @type {WeakMap}
     */
    //@ts-expect-error
    var states = window?.states ?? new WeakMap();

    /**
     * A WeakMap to store cleanup functions associated with DOM elements.
     * @type {WeakMap}
     */
    //@ts-expect-error
    var remove = window?.remove ?? new WeakMap();

    /**
     * A WeakSet to track DOM elements that have been set up.
     * @type {WeakSet}
     */
    //@ts-expect-error
    var setups = window?.setups ?? new WeakSet();

    var result: ReturnedType | undefined;

    const setup = (args: Omit<WatchEventArgs, 'style' | 'state' | 'cleanup' | 'selector'> | WatchEventArgs) => {

    //@ts-expect-error
      window.states ??= states;
    //@ts-expect-error
      window.remove ??= remove;
    //@ts-expect-error
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
      result = setup_fn(args as WatchEventArgs);
      setups.add(args.el);
  }

  // type OnReturnedType<El extends Element, Type extends ((keyof EventMapFor<El> | TextString | UnmountString | AttributeString) | Event | string)> = Type extends (AttributeString | UnmountString | TextString) ? void : (() => void)
  type OnReturnedType<Type> = Type extends (AttributeString | UnmountString | TextString) ? void : (() => unknown);
/**
 * Creates an "on" function for attaching event listeners to a specific element.
 * 
 * This function supports:
 * - Standard DOM events (e.g., 'click', 'submit')
 * - Attribute change observation ('attr' or 'attribute')
 * - Text content changes ('text', 'textChanged', 'textChange')
 * - Unmount/cleanup handlers ('unmount', 'dispose', 'cleanup')
 * - Custom generic event handlers (functions not matching the above)
 * 
 * @template El1 The type of the element this function is created for.
 * 
 * @param el - The target element to attach events to.
 * 
 * @returns A function (`on`) for adding event listeners.
 */
  function createOnFunction<El1 extends Element = W_El> (el: El1) {
/**
 * Attaches an event listener to the element associated with the `createOnFunction` call.
 *
 * @template El  The base element type.
 * @template Type  The type of event or action being handled.
 *
 * @param type - The type of event or action. Can be:
 *   - A standard DOM event name (e.g., 'click', 'submit')
 *   - 'attr' or 'attribute' to watch for attribute changes
 *   - 'text', 'textChanged', or 'textChange' to watch for text content changes
 *   - 'unmount', 'dispose', or 'cleanup' to register a cleanup handler
 *   - A custom event name or any string to trigger a generic event handler
 *
 * @param handlerOrAttributeFilter - The event handler function or attribute filter:
 *   - For DOM events: A function to be called when the event occurs.
 *   - For attribute changes: A string (attribute name) or RegExp to filter attributes.
 *   - For text changes: A generic handler function for character data changes.
 *   - For unmount/cleanup: A generic handler function to be called on element removal.
 *   - For custom or generic events: A function to handle the event.
 *
 * @param optionsOrAttributeHandler - (Optional)
 *   - For DOM events: An `AddEventListenerOptions` object.
 *   - For attribute changes: A generic handler function for attribute changes.
 *   - For other types: Typically unused.
 */
    return function on<El extends Element = typeof el, 
      Type extends ((keyof EventMapFor<El> | TextString | UnmountString | AttributeString) | Event | string) = keyof EventMapFor<El> | AttributeString | TextString | UnmountString > (
  type: Type extends keyof EventMapFor<El> 
    ? Type
    : Type extends string
      ? Type extends AttributeString
        ? AttributeString
        : Type extends TextString
          ? TextString 
          : Type extends UnmountString
            ? UnmountString
            : string
      : Type extends (Event | CustomEvent)
        ? (Event | CustomEvent)
        : never,
  handlerOrAttributeFilter: Type extends keyof EventMapFor<El> 
    ? (this: El, ev: EventMapFor<El>[Type]) => void
    : Type extends string
      ? Type extends AttributeString
        ? AttributeFilter
        : Type extends TextString
          ? GenericHandler<CharacterData> 
          : Type extends UnmountString
            ? GenericHandler<El>
            : ((this: El, e: Event) => unknown)
      : Type extends (Event | CustomEvent)
        ? (Event | CustomEvent)
        // ? Type extends { detail: infer Detail } & CustomEvent
        //   ? GenericEventHandler<El, Type, Detail>
        //   : (this: El, e: Type) => unknown
        : Type, 
  optionsOrAttributeHandler?: Type extends keyof EventMapFor<El>
    ? AddEventListenerOptions
    : Type extends string
      ? Type extends AttributeString
        ? GenericHandler<El1> 
        : AddEventListenerOptions
      : Type extends Event
        ? AddEventListenerOptions
        : never
): OnReturnedType<Type> {

      // eventName = eventName.trim().toLowerCase();
      if (isEventName(type) && !isAttributeString(type) && typeof type === 'string') {

        if (isEventListenerOption(optionsOrAttributeHandler) && !isAttributeFilter(handlerOrAttributeFilter) && isPlatformEventHandler<W_El, typeof type>(type, handlerOrAttributeFilter) && typeof type === 'string') {
          const handler = (e) => {
            const boundHandler = handlerOrAttributeFilter.bind(el);

            if (e instanceof CustomEvent) { 
              const detail = e?.detail ?? {};
              boundHandler(e, detail);
            } else { 
              boundHandler(e)
            }
          }

          el.addEventListener(
            type,
            handler,
            optionsOrAttributeHandler
          );

          return (() => el?.removeEventListener(type, handler)) as OnReturnedType<Type> 
        }

        if (handlerOrAttributeFilter && !isAttributeFilter(handlerOrAttributeFilter)  && isPlatformEventHandler<W_El, typeof type>(type, handlerOrAttributeFilter)) {
          const handler = (e) => {
            const boundHandler = handlerOrAttributeFilter.bind(el);

            if (e instanceof CustomEvent) { 
              const detail = e?.detail ?? {};
              boundHandler(e, detail);
            } else { 
              boundHandler(e)
            }
          }

          el.addEventListener(
            type,
            handler,
          );

          return  (() => el?.removeEventListener(type, handler)) as OnReturnedType<Type>
        }

        return;
      }

      if (isAttributeString(type) && isAttributeFilter(handlerOrAttributeFilter)) {
        let attr = handlerOrAttributeFilter;
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

              if (shouldRun && typeof optionsOrAttributeHandler == 'function')
                optionsOrAttributeHandler({ el, selector, record: mutation });
            }
          },
          {
            attributes: true,
            attributeOldValue: true,
          }
        )(el);

        return;
      }

      // let t_event =eventName as AttributeString
      if (isTextString(type) && isGenericHandler<CharacterData, TextString>(type, handlerOrAttributeFilter)) {
        Array.from(el.childNodes)
          .filter((e) => e.nodeType === Node.TEXT_NODE && e?.textContent?.trim?.())
          .forEach((_el) => {
            createObserver(
              (mutations) => {
                for (let mutation of mutations) {
                  if (typeof handlerOrAttributeFilter =='function') handlerOrAttributeFilter({ el: _el as CharacterData, selector, record: mutation });
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

      if (['unmount', 'remove', 'dispose', 'cleanup'].includes(type)) {
        if (!remove.get(el)) remove.set(el, []);
        let re = remove.get(el)
        if(re && typeof handlerOrAttributeFilter == 'function') re.push(handlerOrAttributeFilter);
        return
      }
      
      if (!isAttributeString(type) && isEventName(type) && isGenericEventHandler<W_El>(type, handlerOrAttributeFilter)) { 
        var handler: GenericEventHandler<W_El> = (e) => {
          const boundHandler = handlerOrAttributeFilter.bind(el);

          if (e instanceof CustomEvent) { 
            const detail = e?.detail ?? {};
            boundHandler(e, detail);
          } else { 
            boundHandler(e)
          }
        }

        if (isEventListenerOption(optionsOrAttributeHandler)) {
          el?.addEventListener(type, handler, optionsOrAttributeHandler) 
        }

        return (() => el?.removeEventListener(type, handler)) as OnReturnedType<Type>
      }

      if (handlerOrAttributeFilter && isGenericEventHandler<W_El>(type, handlerOrAttributeFilter)) {
        el?.addEventListener(type, handler)

        return (() => el?.removeEventListener(type, handler)) as OnReturnedType<Type>
      }
    }
  }

  document.querySelectorAll(selector).forEach((el, idx, arr) => {
    let state = states.has(el) ? states.get(el) : {};
    states.set(el, state);
    setup({ on: createOnFunction(el as W_El), state, el, idx, arr });
  });

  createObserver(
    (mutations) => {
      for (let mutation of mutations) {
        if (!((mutation.target as any) instanceof Element)) continue;
        if (mutation.target instanceof Element && mutation.target?.matches?.(selector)) {
          let el = mutation.target as W_El;
          if (states.has(el)) continue;
          let state = states.has(el) ? states.get(el) : {};
          states.set(el, state);
          setup({ on: createOnFunction(el), state, record: mutation, arr: [el], idx: 0, el });
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
                on: createOnFunction(el as W_El),
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

              setup({ on: createOnFunction(el as W_El), state, record: mutation, arr, idx, el });
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

              setup({ on: createOnFunction(el as W_El), state, record: mutation, arr, idx, el });

              if (remove.has(el)) {
                let r = remove.get(el)
                if (r) r.forEach((fn) =>
                    fn({ on: createOnFunction(el as W_El), state, record: mutation, arr, idx, el })
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

  return result
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
export function clone<T extends object>(obj: T): T {
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
export const findAll = <K extends Element>(selector: string | keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, parent?: ParentNode | Element): Array<K> => Array.from((parent || document).querySelectorAll(selector));

/**
 * Converts a color value to the specified color space.
 * @param {string} color - The color value to convert.
 * @param {string} toSpace - The color space to convert to (e.g., 'srgb', 'display-p3', 'a98-rgb', 'rec2020', 'prophoto-rgb').
 * @returns {string} The converted color value in the specified color space.
 */
export function convertColor(color: string, toSpace: string): string {
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
  if (type == 'soft') history.pushState(Object.fromEntries(url.searchParams.entries()), '', url.href);
}

/**
 * Gets the value of a query parameter from the URL.
 * @param {string} key - The key of the query parameter.
 * @returns {string|null} The value of the query parameter, or null if it doesn't exist.
 */
export function getQueryParam(key: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

/**
 * Gets all values of a query parameter from the URL.
 * @param {string} key - The key of the query parameter.
 * @returns {string[]} An array of all values for the query parameter.
 */
export function getAllQueryParam(key: string): string[] {
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

/**
 * Creates a new `CustomEvent` object with optional data and initialization options.
 * 
 * @param name - The name of the event.
 * @param data - (Optional) An object containing arbitrary data associated with the event.
 * @param options - (Optional) An object containing options for event initialization (e.g., bubbles, cancelable).
 * @returns A new `CustomEvent` object.
 */
export function createEvent(name: string, data?: object, options?: EventInit): Event {
  if (typeof options === 'object') {
    return new CustomEvent(name, {
      detail: data,
      ...options,
    });
  }

  return new CustomEvent(name, {
    detail: data,
  });
}

/**
 * Triggers a custom event on all elements matching a given selector.
 *
 * @param selector - A CSS selector to identify the target elements.
 * @param event - A function that takes an element as input and returns the `Event` object to be dispatched.
 */
export function trigger(selector: string, event: (e: Element) => Event): void {
  findAll(selector).forEach(el => el.dispatchEvent(event(el)));
}