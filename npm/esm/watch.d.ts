/// <reference lib="dom" />
export declare function createObserver(fn: MutationCallback, options: MutationObserverInit): (element: Node | string) => void;
/**
 * Ensures that a function runs after the DOM is loaded.
 * @param {Function} fn - The function to run after the DOM is loaded.
 */
export declare function ensureRunAfterDOM(fn: Function): void;
interface GenericHandlerArgs<E extends Element | Node = Element> {
    el: E;
    selector: string;
    record: MutationRecord;
}
type GenericHandler<E extends Element | Node = Element> = (args: GenericHandlerArgs<E>) => void;
type AttributeFilter = RegExp | string;
type AttributeString = 'attr' | 'attribute';
type EventMapFor<T extends Element> = DocumentEventMap & HTMLElementEventMap;
type UnmountString = 'unmount' | 'dispose' | 'cleanup';
type TextString = 'text' | 'textChanged' | 'textChange';
type CreateOnFunction<El1 extends Element = Element> = (el: El1) => <El extends Element = El1, Type extends ((keyof EventMapFor<El> | TextString | AttributeString | UnmountString) | Event | string) = keyof EventMapFor<El> | AttributeString | UnmountString | TextString>(type: Type extends keyof EventMapFor<El> ? Type : Type extends string ? Type extends AttributeString ? AttributeString : Type extends TextString ? TextString : Type extends UnmountString ? UnmountString : string : never, handlerOrAttributeFilter: Type extends keyof EventMapFor<El> ? (this: El, ev: EventMapFor<El>[Type]) => void : Type extends string ? Type extends AttributeString ? AttributeFilter : Type extends TextString ? GenericHandler<CharacterData> : Type extends UnmountString ? GenericHandler<El> : (this: El, e: Event) => void : Type extends Event ? (this: El, e: Type) => void : never, optionsOrAttributeHandler?: Type extends keyof EventMapFor<El> ? AddEventListenerOptions : Type extends string ? Type extends AttributeString ? GenericHandler<El1> : AddEventListenerOptions : Type extends Event ? AddEventListenerOptions : never) => void;
interface WatchEventArgs<El extends Element = Element> {
    el: El;
    selector: string;
    record?: MutationRecord;
    idx: number;
    arr: NodeList | Element[] | El[];
    state: unknown;
    style: (styles: CSSStyleDeclaration) => {
        apply: (additionalStyles?: CSSStyleDeclaration) => void;
        revert: () => void;
    };
    cleanup: () => void;
    on: ReturnType<CreateOnFunction<El>>;
}
type SetupFn = (args: WatchEventArgs) => void;
interface WatchOptions {
    parent?: Node;
    wrapper: (fn: Function) => (args: WatchEventArgs) => SetupFn;
}
/**
 * Watches for DOM elements matching the given selector and calls the setup function when they are added or removed.
 * @param {string} selector - The CSS selector to watch for.
 * @param {SetupFn} setup_fn - The function to call when elements matching the selector are added or removed.
 * @param {WatchOptions} [options] - Options for the watch function.
 */
export declare function watch<W_El extends Element = Element>(selector: string, setup_fn: SetupFn, options?: WatchOptions): void;
/**
 * Converts an object or value to a JSON string with indentation.
 * @param {Object|*} obj - The object or value to convert to JSON.
 * @returns {string} The JSON string representation of the input.
 */
export declare function JS(obj: object): string;
/**
 * Creates a deep copy of an object using JSON serialization and deserialization.
 * @param {Object} obj - The object to clone.
 * @returns {Object} The cloned object.
 */
export declare function clone<T extends object>(obj: T): T;
/**
 * Applies inline styles to an element and returns a function to apply or revert the styles.
 * @param {HTMLElement} element - The element to apply styles to.
 * @returns {(styles: CSSStyleDeclaration) => { apply: (additionalStyles?: CSSStyleDeclaration) => void, revert: () => void }} A function that takes a {@link CSSStyleDeclaration} object and returns an object with `apply` and `revert` methods for applying and reverting inline styles to the element.
 */
export declare function applyInlineStylesToElement(element: HTMLElement): (styles: CSSStyleDeclaration) => {
    apply: (additionalStyles?: CSSStyleDeclaration) => void;
    revert: () => void;
};
/**
 * Creates an HTMLElement from an HTML string.
 * @param {string} html - The HTML string to convert.
 * @returns {unknown} The created HTMLElement.
 */
export declare function html(html: string): unknown;
/**
 * Finds the first element that matches the given selector(s).
 * @param {string} selector - The CSS selector(s) to match.
 * @param {HTMLElement | ParentNode | null} [parent] - The parent element to search within.
 * @returns {HTMLElement | null} The first matching element, or null if none is found.
 */
export declare const find: (selector: string, parent?: Element | ParentNode) => Element | null;
/**
 * Finds all elements that match the given selector(s).
 * @param {string | keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap} selectors - The CSS selector(s) to match.
 * @param {HTMLElement | ParentNode | null} [parent] - The parent element to search within.
 * @returns {NodeListOf<Element> | NodeListOf<HTMLElementTagNameMap[K]> | NodeListOf<SVGElementTagNameMap[K]>} A {@link NodeList} of matching elements.
 */
export declare const findAll: <K extends Element>(selector: string | keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, parent?: ParentNode | Element) => K[];
/**
 * Converts a color value to the specified color space.
 * @param {string} color - The color value to convert.
 * @param {string} toSpace - The color space to convert to (e.g., 'srgb', 'display-p3', 'a98-rgb', 'rec2020', 'prophoto-rgb').
 * @returns {string} The converted color value in the specified color space.
 */
export declare function convertColor(color: string, toSpace: string): string;
/**
 * Sets a query parameter in the URL.
 * @param {string} key - The key of the query parameter.
 * @param {string} value - The value of the query parameter.
 * @param {string} [type='soft'] - The type of URL update ('soft' for history state change, 'hard' for full page reload).
 */
export declare function setQueryParam(key: string, value: string, type?: 'hard' | 'soft'): void;
/**
 * Gets the value of a query parameter from the URL.
 * @param {string} key - The key of the query parameter.
 * @returns {string|null} The value of the query parameter, or null if it doesn't exist.
 */
export declare function getQueryParam(key: string): string | null;
/**
 * Gets all values of a query parameter from the URL.
 * @param {string} key - The key of the query parameter.
 * @returns {string[]} An array of all values for the query parameter.
 */
export declare function getAllQueryParam(key: string): string[];
/**
 * An object containing functions to interact with URL query parameters.
 * @type {Params}
 * @property {typeof getQueryParam} get - Gets the value of a query parameter.
 * @property {typeof setQueryParam} set - Sets a query parameter.
 * @property {typeof getAllQueryParam} getAll - Gets all values of a query parameter.
 */
export declare const Params: {
    get: typeof getQueryParam;
    set: typeof setQueryParam;
    getAll: typeof getAllQueryParam;
};
/**
 * Matches a regular expression against a value and returns the first match.
 * @param {RegExp} regex - The regular expression to match.
 * @param {string} value - The value to match against.
 * @returns {string|undefined} The first match, or null if no match is found.
 */
export declare function match(regex: RegExp, value: string): string | undefined;
/**
 * Waits for the specified amount of time and then resolves with the result of the provided function.
 * @param {number} ms - The number of milliseconds to wait.
 * @param {Function} fn - The function to execute after the wait.
 * @returns {Promise} A Promise that resolves with the result of the provided function.
 */
export declare function wait<F extends (...args: any[]) => any>(ms: number, fn: F): Promise<ReturnType<F>>;
/**
 * Creates a new `CustomEvent` object with optional data and initialization options.
 *
 * @param name - The name of the event.
 * @param data - (Optional) An object containing arbitrary data associated with the event.
 * @param options - (Optional) An object containing options for event initialization (e.g., bubbles, cancelable).
 * @returns A new `CustomEvent` object.
 */
export declare function createEvent(name: string, data?: object, options?: EventInit): Event;
/**
 * Triggers a custom event on all elements matching a given selector.
 *
 * @param selector - A CSS selector to identify the target elements.
 * @param event - A function that takes an element as input and returns the `Event` object to be dispatched.
 */
export declare function trigger(selector: string, event: (e: Element) => Event): void;
export {};
//# sourceMappingURL=watch.d.ts.map