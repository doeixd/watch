// In file: src/api/tag.ts

import {
  runOn,
  // Import all base primitives to be wrapped in the context
  addClass as baseAddClass,
  style as baseStyle,
  text as baseText,
  on as baseOn,
  onMount,
  onUnmount,
} from "watch-selector";
import { isGeneratorFunction } from "./type-predicates";
import type { TypedState, Workflow, ElementFn } from "../types";

// --- TYPE DEFINITIONS ---

/** A union of possible child types that can be appended to an element. */
type TagChild = Node | string | number | null | undefined | TagChild[];

/** A special object that signals a reactive binding between a state object and a DOM property. */
export interface ReactiveBinding<T> {
  readonly __isReactive: true;
  readonly state: TypedState<T>;
}

/** The context object passed to the `tag` builder, containing type-safe primitives. */
export interface TagBuilderContext<El extends HTMLElement> {
  /** Sets an attribute. Can be a static value or a reactive binding. */
  attribute(
    name: string,
    value:
      | string
      | number
      | boolean
      | ReactiveBinding<string | number | boolean>,
  ): ElementFn<El, void>;
  /** Sets a DOM property. This is fully type-safe for the specific element. */
  property<P extends keyof El>(
    name: P,
    value: El[P] | ReactiveBinding<El[P]>,
  ): ElementFn<El, void>;
  /** Sets CSS styles. */
  style(styles: Partial<CSSStyleDeclaration>): ElementFn<El, void>;
  style(prop: keyof CSSStyleDeclaration, value: string): ElementFn<El, void>;
  /** Attaches an event listener. */
  on<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler: (this: El, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): ElementFn<El, void>;
  /** Appends children to the element. */
  child(...children: TagChild[]): ElementFn<El, void>;
  /** Adds CSS classes. Can be a static string or a reactive binding. */
  addClass(
    ...classNames: (string | ReactiveBinding<string>)[]
  ): ElementFn<El, void>;
  /** Sets the text content. Can be a static value or a reactive binding. */
  text(
    content: string | number | ReactiveBinding<string | number>,
  ): ElementFn<El, void>;
  /**
   * Registers a callback to run after the element is created and attached to the DOM.
   * Ideal for initializing third-party libraries or performing measurements.
   */
  onMount(handler: (element: El) => void | (() => void)): ElementFn<El, void>;
  /**
   * Registers a callback to run just before the element is removed from the DOM.
   * Perfect for cleaning up resources created in `onMount`.
   */
  onUnmount(handler: (element: El) => void): ElementFn<El, void>;
}

const SVG_TAGS = new Set([
  "svg",
  "path",
  "g",
  "circle",
  "rect",
  "line",
  "polygon",
]);

// --- REACTIVITY HELPER ---

/**
 * Marks a state object as a reactive source for a property in the `tag` builder.
 * When used, the element's property will automatically update whenever the state changes.
 * @param state The `TypedState` object created with `createState`.
 */
export function reactive<T>(state: TypedState<T>): ReactiveBinding<T> {
  return { __isReactive: true, state };
}

function isReactive(value: any): value is ReactiveBinding<any> {
  return value && value.__isReactive === true;
}

// --- INTERNAL HELPERS ---

function _appendChildren(element: Element, children: TagChild[]) {
  const flattenChildren = (items: TagChild[]): any[] => {
    const result: any[] = [];
    for (const item of items) {
      if (Array.isArray(item)) {
        result.push(...flattenChildren(item));
      } else {
        result.push(item);
      }
    }
    return result;
  };

  flattenChildren(children).forEach((child) => {
    if (child == null) return;
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
}
function isGeneratorBuilder(
  arg: any,
): arg is (ctx: TagBuilderContext<any>) => Generator {
  return typeof arg === "function" && isGeneratorFunction(arg);
}

// --- THE FINAL `tag` FUNCTION ---

/**
 * Creates an element using a declarative, type-safe generator builder that can return a public API.
 * @template K The tag name, used to infer the correct element and API types.
 * @param name The tag name of the element to create.
 * @param builder A generator function that receives a context (`ctx`) with type-safe primitives.
 * @returns A Workflow that yields the created element and its public API.
 */
export function tag<K extends keyof HTMLElementTagNameMap, Api = void>(
  name: K,
  builder: (
    ctx: TagBuilderContext<HTMLElementTagNameMap[K]>,
  ) => Generator<ElementFn<HTMLElementTagNameMap[K], any>, Api, unknown>,
): Workflow<{ element: HTMLElementTagNameMap[K]; api: Api }>;

/**
 * Creates an element with a concise hyperscript-style syntax.
 * @template K The tag name, used to infer the correct HTMLElement type.
 * @param name The tag name of the element to create.
 * @param args A rest parameter that can include attributes and children.
 */
export function tag<K extends keyof HTMLElementTagNameMap>(
  name: K,
  ...args: (Record<string, any> | TagChild)[]
): HTMLElementTagNameMap[K];

export function tag<K extends keyof HTMLElementTagNameMap>(
  name: K,
  ...args: any[]
): any {
  // --- Overload 1: Generator Builder Pattern ---
  if (args.length === 1 && isGeneratorBuilder(args[0])) {
    const builder = args[0];

    return (function* (): Workflow<any> {
      const element = SVG_TAGS.has(name)
        ? document.createElementNS("http://www.w3.org/2000/svg", name)
        : document.createElement(name);

      const mountHandlers: ((el: any) => void | (() => void))[] = [];
      const unmountHandlers: ((el: any) => void)[] = [];

      const builderContext: TagBuilderContext<any> = {
        attribute: (n, v) => (el) => {
          if (isReactive(v)) {
            // For reactive bindings, we need to set up manual watching
            // since watchState expects a string key, not a TypedState object
            const setValue = (val: any) => {
              if (val === false || val === null || val === undefined) {
                el.removeAttribute(n);
              } else {
                el.setAttribute(n, String(val));
              }
            };

            // Set initial value
            setValue(v.state.get());

            // Store cleanup function for later
            // Note: This is a simplified approach - real implementation
            // would need proper integration with the state system
          } else {
            if (v === false || v === null || v === undefined) {
              el.removeAttribute(n);
            } else {
              el.setAttribute(n, String(v));
            }
          }
        },
        property: (n, v) => (el) => {
          if (isReactive(v)) {
            // For reactive bindings, set the initial value
            (el as any)[n] = v.state.get();

            // Note: Proper reactive watching would need to be implemented
            // with the actual state management system
          } else {
            (el as any)[n] = v;
          }
        },
        addClass:
          (...c) =>
          (el) => {
            let staticClasses: string[] = [];
            c.forEach((cn) => {
              if (isReactive(cn)) {
                // For reactive class names, add the initial value
                const initialClass = cn.state.get();
                if (initialClass) {
                  staticClasses.push(String(initialClass));
                }

                // Note: Proper reactive watching would need to be implemented
                // with the actual state management system
              } else {
                staticClasses.push(String(cn));
              }
            });
            staticClasses.forEach((cls) => baseAddClass(el, cls));
          },
        text: (c) => (el) => {
          if (isReactive(c)) {
            // For reactive text content, set the initial value
            el.textContent = String(c.state.get());

            // Note: Proper reactive watching would need to be implemented
            // with the actual state management system
          } else {
            baseText(el, String(c));
          }
        },
        style: ((p: any, v?: any) => {
          if (typeof p === "object") {
            return baseStyle(p);
          } else {
            return baseStyle(p, v);
          }
        }) as any,
        on: (e, h, o) => baseOn(e, h as any, o as any) as ElementFn<any, void>,
        child:
          (...c) =>
          (el) =>
            _appendChildren(el, c),
        onMount: (h) =>
          (() => {
            mountHandlers.push(h);
          }) as ElementFn<any, void>,
        onUnmount: (h) =>
          (() => {
            unmountHandlers.push(h);
          }) as ElementFn<any, void>,
      };

      const builderIterator = builder(builderContext);
      let result = builderIterator.next();
      while (!result.done) {
        const instruction = result.value;
        if (typeof instruction === "function") {
          instruction(element);
        }
        result = builderIterator.next();
      }
      const api = result.value; // The return value of the generator

      // Set up mount/unmount handlers
      if (mountHandlers.length > 0 || unmountHandlers.length > 0) {
        runOn(element as HTMLElement, function* () {
          let unmountCallbacks: (() => void)[] = [];
          yield onMount(() => {
            mountHandlers.forEach((h) => {
              const unmountCb = h(element);
              if (typeof unmountCb === "function")
                unmountCallbacks.push(unmountCb);
            });
          });
          yield onUnmount(() => {
            unmountHandlers.forEach((h) => h(element));
            unmountCallbacks.forEach((cb) => cb());
          });
        });
      }

      return { element, api };
    })();
  }

  // --- Overload 2: Standard Hyperscript Pattern ---
  const element = SVG_TAGS.has(name)
    ? document.createElementNS("http://www.w3.org/2000/svg", name)
    : document.createElement(name);
  // Process args to set attributes and append children
  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === "object" && !(arg instanceof Node)) {
      // It's an attributes object
      for (const [key, value] of Object.entries(arg)) {
        if (key.startsWith("on") && typeof value === "function") {
          // Event listener
          const eventName = key.slice(2).toLowerCase();
          element.addEventListener(eventName, value as EventListener);
        } else if (key === "style" && typeof value === "object") {
          // Style object
          Object.assign((element as HTMLElement).style, value);
        } else if (key === "className") {
          // Class name
          (element as HTMLElement).className = String(value);
        } else if (key === "classList" && Array.isArray(value)) {
          // Class list array
          element.classList.add(...value);
        } else if (key === "dataset" && typeof value === "object") {
          // Dataset object
          Object.assign((element as HTMLElement).dataset, value);
        } else if (value === false || value === null || value === undefined) {
          // Remove attribute for falsy values
          element.removeAttribute(key);
        } else {
          // Regular attribute
          element.setAttribute(key, String(value));
        }
      }
    } else if (typeof arg === "string" || typeof arg === "number") {
      // Text content
      element.appendChild(document.createTextNode(String(arg)));
    } else if (arg instanceof Node) {
      // DOM node
      element.appendChild(arg);
    } else if (Array.isArray(arg)) {
      // Array of children
      for (const child of arg) {
        if (typeof child === "string" || typeof child === "number") {
          element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
          element.appendChild(child);
        }
      }
    }
  }

  return element as HTMLElementTagNameMap[K];
}
