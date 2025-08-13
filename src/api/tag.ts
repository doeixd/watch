// In file: src/api/tag.ts

import {
  watchState,
  cleanup,
  runOn,
  // Import all base primitives to be wrapped in the context
  addClass as baseAddClass,
  style as baseStyle,
  text as baseText,
  on as baseOn,
  onMount,
  onUnmount,
} from "watch-selector";
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
 * Wraps a TypedState and marks it as a reactive binding for the `tag` builder.
 *
 * Returns a `ReactiveBinding<T>` that signals to the tag builder APIs (attribute,
 * property, addClass, text, etc.) that the provided state is a reactive source
 * and should be updated as the state changes. The returned object contains the
 * original `state` and an internal `__isReactive` flag.
 *
 * This function does not itself attach observers; consumers of `ReactiveBinding`
 * (for example the `tag` builder) are responsible for wiring updates.
 *
 * @param state - A `TypedState` instance (typically created via `createState`)
 * @returns A `ReactiveBinding<T>` wrapper around `state`
 */
export function reactive<T>(state: TypedState<T>): ReactiveBinding<T> {
  return { __isReactive: true, state };
}

/**
 * Type guard that detects a ReactiveBinding.
 *
 * Returns true when `value` is an object exposing `__isReactive === true`,
 * narrowing the type to `ReactiveBinding<any>`.
 *
 * @param value - Value to test for the ReactiveBinding marker
 * @returns `true` if `value` is a ReactiveBinding; otherwise `false`
 */
function isReactive(value: any): value is ReactiveBinding<any> {
  return value && value.__isReactive === true;
}

/**
 * Flattens a nested array of TagChild values and appends them to the given element.
 *
 * Accepts nested arrays (flattened to any depth), ignores null/undefined, converts strings
 * and numbers to text nodes, and appends Node instances directly.
 *
 * @param element - The parent Element to receive the children.
 * @param children - Nested list of children (Node | string | number | null | undefined).
 */

function _appendChildren(element: Element, children: TagChild[]) {
  children.flat(Infinity).forEach((child) => {
    if (child == null) return;
    if (typeof child === "string" || typeof child === "number") {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
}
/**
 * Type guard that detects whether a value is a generator-based tag builder.
 *
 * Returns true when `arg` is a function created as a `GeneratorFunction` (i.e. a generator)
 * that is intended to be called with a TagBuilderContext to build an element.
 *
 * @param arg - Value to test
 * @returns `true` if `arg` is a generator function of the form `(ctx: TagBuilderContext<any>) => Generator`; otherwise `false`.
 */
function isGeneratorBuilder(
  arg: any,
): arg is (ctx: TagBuilderContext<any>) => Generator {
  return (
    typeof arg === "function" && arg.constructor.name === "GeneratorFunction"
  );
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

/**
 * Create a DOM element either via a generator-based declarative builder or a hyperscript-style call.
 *
 * When called with a single generator builder function, `tag(name, builder)` runs the builder to configure
 * the element using the TagBuilderContext primitives (attribute, property, style, on, child, addClass, text,
 * onMount, onUnmount) and returns a Workflow resolving to `{ element, api }` where `api` is the value returned
 * by the builder. Builder primitives accept ReactiveBinding values to wire reactive updates.
 *
 * When called as a standard hyperscript (`tag(name, ...args)`), it creates and returns the corresponding
 * HTMLElement (or SVGElement for known SVG tags) after applying attributes/children as provided.
 *
 * @returns A Workflow resolving to `{ element, api }` when used with a generator builder; otherwise the created element (`HTMLElement` or `SVGElement`).
 */
export function tag<K extends keyof HTMLElementTagNameMap>(
  name: K,
  ...args: any[]
): any {
  // --- Overload 1: Generator Builder Pattern ---
  if (args.length === 1 && isGeneratorBuilder(args[0])) {
    const builder = args[0];

    return (async function* (): Workflow<any> {
      const element = SVG_TAGS.has(name)
        ? document.createElementNS("http://www.w3.org/2000/svg", name)
        : document.createElement(name);

      const mountHandlers: ((el: any) => void | (() => void))[] = [];
      const unmountHandlers: ((el: any) => void)[] = [];

      const builderContext: TagBuilderContext<any> = {
        attribute: (n, v) => (el) => {
          if (isReactive(v)) {
            const unwatch = watchState(
              v.state,
              (newVal) =>
                el.toggleAttribute(n, !!newVal) ||
                el.setAttribute(n, String(newVal)),
            );
            cleanup(unwatch, el);
            el.setAttribute(n, String(v.state.get()));
          } else {
            el.toggleAttribute(n, !!v) || el.setAttribute(n, String(v));
          }
        },
        property: (n, v) => (el) => {
          if (isReactive(v)) {
            const unwatch = watchState(v.state, (newVal) => {
              (el as any)[n] = newVal;
            });
            cleanup(unwatch, el);
            (el as any)[n] = v.state.get();
          } else {
            (el as any)[n] = v;
          }
        },
        addClass:
          (...c) =>
          (el) => {
            let staticClasses: any[] = [];
            c.forEach((cn) => {
              if (isReactive(cn)) {
                let lastClass = cn.state.get();
                const unwatch = watchState(cn.state, (newVal) => {
                  if (lastClass) el.classList.remove(String(lastClass));
                  if (newVal) el.classList.add(String(newVal));
                  lastClass = newVal;
                });
                cleanup(unwatch, el);
                if (lastClass) staticClasses.push(lastClass);
              } else {
                staticClasses.push(cn);
              }
            });
            if (staticClasses.length > 0)
              baseAddClass(el, ...(staticClasses as string[]));
          },
        text: (c) => (el) => {
          if (isReactive(c)) {
            const unwatch = watchState(c.state, (newVal) => {
              el.textContent = String(newVal);
            });
            cleanup(unwatch, el);
            el.textContent = String(c.state.get());
          } else {
            baseText(el, String(c));
          }
        },
        style: (p: any, v?: any) => {
          if (typeof p === "object") {
            return baseStyle(p);
          } else {
            return baseStyle(p, v);
          }
        },
        on: (e, h, o) => baseOn(e, h as any, o as any),
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
  // ... hyperscript implementation remains the same ...
  return element as HTMLElementTagNameMap[K];
}
