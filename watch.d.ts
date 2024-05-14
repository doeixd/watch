export function createObserver(fn: MutationCallback, options: MutationObserverInit): (element: HTMLElement | string) => void;

export function ensureRunAfterDOM(fn: Function): void;

type EventHandler = EventListenerOrEventListenerObject | null;
type EventHandlerOptions = boolean | AddEventListenerOptions | undefined;

type OnFunction = (
  el: HTMLElement
) => (
  eventName: string,
  handler: EventHandler,
  attrHandlerOrOptions?: EventHandlerOptions,
  attrHandlerOptions?: EventHandlerOptions
) => void;

interface WatchEventArgs {
  el: HTMLElement;
  selector: string;
  record?: MutationRecord;
  idx: number;
  arr: NodeList;
  state: any;
  style: {
    apply: (additionalStyles?: CSSStyleDeclaration) => void;
    revert: () => void;
  };
  cleanup: () => void;
  on: OnFunction;
}

type SetupFn = (args: WatchEventArgs) => void;

interface WatchOptions {
  parent?: HTMLElement;
  wrapper?: (fn: Function) => (args: WatchEventArgs) => SetupFn;
}

// declare global {
//   interface Window {
//     states: WeakMap<HTMLElement, any>;
//     remove: WeakMap<HTMLElement, Function[]>;
//     setups: WeakSet<HTMLElement>;
//   }
// }

export function watch(
  selector: string,
  setup_fn: SetupFn,
  options?: WatchOptions
): void;

export function JS(obj: any): string;

export function clone(obj: any): any;

export function applyInlineStylesToElement(element: HTMLElement): (styles: CSSStyleDeclaration) => { apply: (additionalStyles?: CSSStyleDeclaration) => void, revert: () => void };

export function html(html: string): unknown;

export const find: (selector: string, parent?: HTMLElement | ParentNode | null) => HTMLElement | null;

export const findAll: {
    <K extends keyof HTMLElementTagNameMap>(selectors: K): NodeListOf<HTMLElementTagNameMap[K]>;
    <K extends keyof SVGElementTagNameMap>(selectors: K): NodeListOf<SVGElementTagNameMap[K]>;
    (selectors: string): NodeListOf<Element>;
};

export function convertColor(color: string, toSpace: string): string;

export function setQueryParam(key: string, value: string, type?: 'soft' | 'hard'): void;

export function getQueryParam(key: string): string | null;

export function getAllQueryParam(key: string): string[];

export interface Params {
    get: typeof getQueryParam;
    set: typeof setQueryParam;
    getAll: typeof getAllQueryParam;
}
export const Params: Params;

export function match(regex: RegExp, value: string): string | null;

export function wait(ms: number, fn: Function): Promise<any>;