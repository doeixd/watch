// Core types for Watch v5

// Element type inference from selectors
export type ElementFromSelector<S extends string> = 
  S extends `input[type="text"]${string}` ? HTMLInputElement :
  S extends `input[type="email"]${string}` ? HTMLInputElement :
  S extends `input[type="password"]${string}` ? HTMLInputElement :
  S extends `input[type="search"]${string}` ? HTMLInputElement :
  S extends `input[type="tel"]${string}` ? HTMLInputElement :
  S extends `input[type="url"]${string}` ? HTMLInputElement :
  S extends `input[type="number"]${string}` ? HTMLInputElement :
  S extends `input[type="range"]${string}` ? HTMLInputElement :
  S extends `input[type="date"]${string}` ? HTMLInputElement :
  S extends `input[type="time"]${string}` ? HTMLInputElement :
  S extends `input[type="datetime-local"]${string}` ? HTMLInputElement :
  S extends `input[type="month"]${string}` ? HTMLInputElement :
  S extends `input[type="week"]${string}` ? HTMLInputElement :
  S extends `input[type="color"]${string}` ? HTMLInputElement :
  S extends `input[type="file"]${string}` ? HTMLInputElement :
  S extends `input[type="hidden"]${string}` ? HTMLInputElement :
  S extends `input[type="checkbox"]${string}` ? HTMLInputElement :
  S extends `input[type="radio"]${string}` ? HTMLInputElement :
  S extends `input[type="submit"]${string}` ? HTMLInputElement :
  S extends `input[type="reset"]${string}` ? HTMLInputElement :
  S extends `input[type="button"]${string}` ? HTMLInputElement :
  S extends `input[type="image"]${string}` ? HTMLInputElement :
  S extends `input${string}` ? HTMLInputElement :
  S extends `button${string}` ? HTMLButtonElement :
  S extends `form${string}` ? HTMLFormElement :
  S extends `a${string}` ? HTMLAnchorElement :
  S extends `img${string}` ? HTMLImageElement :
  S extends `select${string}` ? HTMLSelectElement :
  S extends `textarea${string}` ? HTMLTextAreaElement :
  S extends `div${string}` ? HTMLDivElement :
  S extends `span${string}` ? HTMLSpanElement :
  S extends `p${string}` ? HTMLParagraphElement :
  S extends `h1${string}` ? HTMLHeadingElement :
  S extends `h2${string}` ? HTMLHeadingElement :
  S extends `h3${string}` ? HTMLHeadingElement :
  S extends `h4${string}` ? HTMLHeadingElement :
  S extends `h5${string}` ? HTMLHeadingElement :
  S extends `h6${string}` ? HTMLHeadingElement :
  S extends `ul${string}` ? HTMLUListElement :
  S extends `ol${string}` ? HTMLOListElement :
  S extends `li${string}` ? HTMLLIElement :
  S extends `table${string}` ? HTMLTableElement :
  S extends `tr${string}` ? HTMLTableRowElement :
  S extends `td${string}` ? HTMLTableCellElement :
  S extends `th${string}` ? HTMLTableCellElement :
  S extends `thead${string}` ? HTMLTableSectionElement :
  S extends `tbody${string}` ? HTMLTableSectionElement :
  S extends `tfoot${string}` ? HTMLTableSectionElement :
  S extends `canvas${string}` ? HTMLCanvasElement :
  S extends `video${string}` ? HTMLVideoElement :
  S extends `audio${string}` ? HTMLAudioElement :
  S extends `iframe${string}` ? HTMLIFrameElement :
  S extends `script${string}` ? HTMLScriptElement :
  S extends `link${string}` ? HTMLLinkElement :
  S extends `style${string}` ? HTMLStyleElement :
  S extends `meta${string}` ? HTMLMetaElement :
  S extends `title${string}` ? HTMLTitleElement :
  S extends `head${string}` ? HTMLHeadElement :
  S extends `body${string}` ? HTMLBodyElement :
  S extends `html${string}` ? HTMLHtmlElement :
  HTMLElement;

// Handler types
export type ElementHandler<El extends HTMLElement = HTMLElement> = (element: El) => void;
export type ElementFn<El extends HTMLElement = HTMLElement, T = void> = (element: El) => T;

// Selector type
export type Selector = string;

// Context for generator execution - this will hold the current element
export interface GeneratorContext<El extends HTMLElement = HTMLElement> {
  readonly element: El;
  readonly selector: string;
  readonly index: number;
  readonly array: readonly El[];
}

// Current element proxy type - combines function and proxy behaviors
export type ElementProxy<El extends HTMLElement = HTMLElement> = El & {
  <T extends HTMLElement = HTMLElement>(selector: string): T | null;
  all<T extends HTMLElement = HTMLElement>(selector: string): T[];
};

// Self function type
export type SelfFunction<El extends HTMLElement = HTMLElement> = () => El;

// Generator function type - element type is inferred and maintained throughout
export type GeneratorFunction<El extends HTMLElement = HTMLElement, T = void> = () => Generator<ElementFn<El, any>, T, unknown>;

// Parent context type for child components
export interface ParentContext<ParentEl extends HTMLElement = HTMLElement, ParentApi = any> {
  element: ParentEl;
  api: ParentApi;
}

// Context function type - returns typed context
export type ContextFunction<El extends HTMLElement = HTMLElement> = () => WatchContext<El>;

// Type-safe generator context that maintains element type through inference
export interface TypedGeneratorContext<El extends HTMLElement = HTMLElement> {
  // These functions are properly typed for the current element
  self(): El;
  el<T extends HTMLElement = HTMLElement>(selector: string): T | null;
  all<T extends HTMLElement = HTMLElement>(selector: string): T[];
  cleanup(fn: CleanupFunction): void;
  
  // Context access
  ctx(): WatchContext<El>;
  
  // Element info
  readonly element: El;
  readonly selector: string;
  readonly index: number;
  readonly array: readonly El[];
}

// Pre-defined watch context for enhanced type safety
export interface PreDefinedWatchContext<
  S extends string = string,
  El extends HTMLElement = ElementFromSelector<S>,
  Options extends Record<string, unknown> = Record<string, unknown>
> {
  readonly selector: S;
  readonly elementType: El;
  readonly options: Options;
  readonly __brand: 'PreDefinedWatchContext';
}

// Options for creating watch contexts
export interface WatchContextOptions {
  // Debounce setup function calls
  debounce?: number;
  
  // Throttle setup function calls  
  throttle?: number;
  
  // Only run once
  once?: boolean;
  
  // Custom data to attach to context
  data?: Record<string, unknown>;
  
  // Custom element filter function
  filter?: (element: HTMLElement) => boolean;
  
  // Priority for execution order
  priority?: number;
}

// Overloaded function patterns for dual API
export type DualAPI<
  DirectArgs extends readonly unknown[],
  GeneratorArgs extends readonly unknown[],
  El extends HTMLElement = HTMLElement,
  ReturnType = void
> = {
  (...args: [...DirectArgs, El]): ReturnType;
  (...args: GeneratorArgs): ElementFn<El, ReturnType>;
};

// Event handler type that receives element as second parameter
export type ElementEventHandler<
  El extends HTMLElement = HTMLElement,
  K extends keyof HTMLElementEventMap = keyof HTMLElementEventMap
> = (event: HTMLElementEventMap[K], element: El) => void;

// Form element types
export type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

// CSS property name type
export type CSSPropertyName = keyof CSSStyleDeclaration;

// Attribute name type  
export type AttributeName = string;

// Data attribute key type
export type DataAttributeKey = string;

// Event name type
export type EventName<El extends HTMLElement = HTMLElement> = keyof HTMLElementEventMap;

// Matcher function type
export type ElementMatcher<El extends HTMLElement = HTMLElement> = (element: HTMLElement) => element is El;

// Enhanced matcher function with more control
export type AdvancedMatcher = (element: HTMLElement) => 'skip' | 'observe' | 'queue';

// Watch target types - now with advanced matcher
export type WatchTarget<El extends HTMLElement = HTMLElement> = 
  | string
  | El
  | El[]
  | NodeListOf<El>
  | ElementMatcher<El>
  | AdvancedMatcher;

// Observer event types
export interface AttributeChange {
  attributeName: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface TextChange {
  oldText: string;
  newText: string;
}

export interface VisibilityChange {
  isVisible: boolean;
  intersectionRatio: number;
  boundingClientRect: DOMRectReadOnly;
}

export interface ResizeChange {
  contentRect: DOMRectReadOnly;
  borderBoxSize: ResizeObserverSize[];
  contentBoxSize: ResizeObserverSize[];
}

// Lifecycle event types
export type MountHandler<El extends HTMLElement = HTMLElement> = (element: El) => void;
export type UnmountHandler<El extends HTMLElement = HTMLElement> = (element: El) => void;

// Cleanup function type
export type CleanupFunction = () => void;

// Registry types for global observer
export type SelectorRegistry = Map<string, Set<ElementHandler>>;
export type UnmountRegistry = WeakMap<HTMLElement, Set<UnmountHandler>>;

// Enhanced state management types
export type TypedState<T = any> = {
  get(): T;
  set(value: T): void;
  update(fn: (current: T) => T): void;
  init(value: T): void;
};

// Individual element instance with its own state
export interface WatchedInstance<El extends HTMLElement = HTMLElement> {
  element: El;
  state: Record<string, any>;
  observers: Set<MutationObserver | IntersectionObserver | ResizeObserver>;
  cleanupFns: (() => void)[];
}

// Shared configuration for all instances of a watch subject  
export interface WatchConfig<El extends HTMLElement = HTMLElement> {
  subject: WatchTarget<El>;
  parentScope: HTMLElement;
  mountFns: ((instance: WatchedInstance<El>) => void)[];
  unmountFns: ((instance: WatchedInstance<El>) => void)[];
  instances: Map<HTMLElement, WatchedInstance<El>>;
  globalObserver?: MutationObserver;
}

// Context state for generators - enhanced
export interface WatchContext<El extends HTMLElement = HTMLElement> {
  element: El;
  selector: string;
  index: number;
  array: readonly El[];
  
  // Enhanced state management
  state: Record<string, any>;
  observers: Set<MutationObserver | IntersectionObserver | ResizeObserver>;
  
  // Proxy element access
  el: ElementProxy<El>;
  
  // Self function
  self: SelfFunction<El>;
  
  // Enhanced cleanup registration
  cleanup: (fn: CleanupFunction) => void;
  addObserver: (observer: MutationObserver | IntersectionObserver | ResizeObserver) => void;
}

// Generator yield types
export type GeneratorYield<El extends HTMLElement = HTMLElement> = 
  | ElementFn<El, any>
  | Promise<ElementFn<El, any>>
  | Generator<ElementFn<El, any>, void, unknown>;
