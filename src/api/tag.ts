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
  children.flat(Infinity).forEach((child) => {
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
