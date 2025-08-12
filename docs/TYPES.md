# Watch Selector Type Definitions

Complete reference for all TypeScript types exported by watch-selector.

## Table of Contents

- [Element Types](#element-types)
- [Handler Types](#handler-types)
- [Context Types](#context-types)
- [Event Types](#event-types)
- [State Types](#state-types)
- [Controller Types](#controller-types)
- [Workflow Types](#workflow-types)
- [Observer Types](#observer-types)
- [Utility Types](#utility-types)

## Element Types

### `ElementFromSelector<S>`

Maps CSS selector strings to their corresponding HTML element types.

```typescript
type ElementFromSelector<S extends string> = 
  S extends 'button' ? HTMLButtonElement :
  S extends 'input' ? HTMLInputElement :
  S extends 'form' ? HTMLFormElement :
  S extends 'a' ? HTMLAnchorElement :
  S extends 'img' ? HTMLImageElement :
  S extends 'video' ? HTMLVideoElement :
  S extends 'audio' ? HTMLAudioElement :
  S extends 'canvas' ? HTMLCanvasElement :
  S extends 'div' ? HTMLDivElement :
  S extends 'span' ? HTMLSpanElement :
  S extends 'p' ? HTMLParagraphElement :
  S extends 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' ? HTMLHeadingElement :
  S extends 'ul' | 'ol' ? HTMLUListElement | HTMLOListElement :
  S extends 'li' ? HTMLLIElement :
  S extends 'table' ? HTMLTableElement :
  S extends 'tr' ? HTMLTableRowElement :
  S extends 'td' | 'th' ? HTMLTableCellElement :
  S extends 'select' ? HTMLSelectElement :
  S extends 'option' ? HTMLOptionElement :
  S extends 'textarea' ? HTMLTextAreaElement :
  S extends 'label' ? HTMLLabelElement :
  S extends 'fieldset' ? HTMLFieldSetElement :
  S extends 'legend' ? HTMLLegendElement :
  S extends 'details' ? HTMLDetailsElement :
  S extends 'summary' ? HTMLElement :
  S extends 'dialog' ? HTMLDialogElement :
  S extends 'iframe' ? HTMLIFrameElement :
  S extends 'object' ? HTMLObjectElement :
  S extends 'embed' ? HTMLEmbedElement :
  S extends 'picture' ? HTMLPictureElement :
  S extends 'source' ? HTMLSourceElement :
  S extends 'track' ? HTMLTrackElement :
  S extends 'map' ? HTMLMapElement :
  S extends 'area' ? HTMLAreaElement :
  S extends 'slot' ? HTMLSlotElement :
  S extends 'template' ? HTMLTemplateElement :
  // Complex selectors default to HTMLElement
  HTMLElement;
```

**Usage:**
```typescript
// Type inference from selectors
type ButtonEl = ElementFromSelector<'button'>; // HTMLButtonElement
type InputEl = ElementFromSelector<'input'>; // HTMLInputElement
type CustomEl = ElementFromSelector<'.my-class'>; // HTMLElement
```

### `FormElement`

Union type for all form-related elements.

```typescript
type FormElement = 
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLButtonElement;
```

### `ElementMatcher<El>`

Function type for matching elements.

```typescript
type ElementMatcher<El extends HTMLElement = HTMLElement> = 
  (element: Element) => element is El;
```

## Handler Types

### `ElementHandler<El>`

Handler function type for watch callbacks.

```typescript
type ElementHandler<El extends HTMLElement = HTMLElement> = 
  | GeneratorFunction<El>
  | ((this: El) => void);
```

**Usage:**
```typescript
const handler: ElementHandler<HTMLButtonElement> = function* () {
  yield addClass('ready');
};

const simpleHandler: ElementHandler = function() {
  console.log('Element:', this);
};
```

### `ElementFn<El, R>`

Function that operates on an element within a generator context.

```typescript
type ElementFn<El extends Element, R = void> = (element: El) => R;
```

**Usage:**
```typescript
// Functions that yield ElementFn
watch('button', function* () {
  // ElementFn<HTMLButtonElement, void>
  yield addClass('active');
  
  // ElementFn<HTMLButtonElement, string>
  const text = yield getText();
});
```

### `GeneratorFn<El>`

Generator function type with element context.

### `CleanupFunction`

Function type for cleanup operations.

```typescript
type CleanupFunction = () => void;
```

## Context Types

### `WatchContext<El>`

Main context object available in watch generators.

```typescript
interface WatchContext<El extends HTMLElement = HTMLElement> {
  /** The element being watched */
  element: El;
  
  /** The selector used (if any) */
  selector?: string;
  
  /** Parent context (for nested watches) */
  parent?: ParentContext;
  
  /** Register cleanup function */
  cleanup: (fn: CleanupFunction) => void;
  
  /** Element state storage */
  state: Map<string, any>;
  
  /** Element API functions */
  api?: DualAPI<El>;
  
  /** Generator yield handler */
  yieldHandler?: (value: any) => any;
  
  /** Context options */
  options?: WatchContextOptions;
}
```

### `ParentContext`

Parent context for nested watch operations.

```typescript
interface ParentContext {
  /** Parent element */
  element: HTMLElement;
  
  /** Parent selector */
  selector?: string;
  
  /** Parent watch context */
  context: WatchContext;
  
  /** Parent state */
  state: Map<string, any>;
}
```

### `WatchContextOptions`

Options for watch context configuration.

```typescript
interface WatchContextOptions {
  /** Enable debug mode */
  debug?: boolean;
  
  /** Custom error handler */
  onError?: (error: Error) => void;
  
  /** Enable state persistence */
  persist?: boolean;
  
  /** Custom state storage */
  storage?: Storage;
  
  /** State serializer */
  serialize?: (value: any) => string;
  
  /** State deserializer */
  deserialize?: (value: string) => any;
  
  /** Context metadata */
  metadata?: Record<string, any>;
}
```

### `GeneratorContext<El>`

Context available within generator functions.

```typescript
interface GeneratorContext<El extends HTMLElement = HTMLElement> {
  /** Get current element */
  self: () => El;
  
  /** Query child element */
  el: <S extends string>(selector: S) => ElementFromSelector<S> | null;
  
  /** Query all child elements */
  all: <S extends string>(selector: S) => ElementFromSelector<S>[];
  
  /** Register cleanup */
  cleanup: (fn: CleanupFunction) => void;
}
```

## Event Types

### `HybridEventHandler<E, El>`

Flexible event handler supporting multiple patterns.

```typescript
type HybridEventHandler<
  E extends Event = Event,
  El extends HTMLElement = HTMLElement
> =
  | ((this: El, event: E) => void | Promise<void>)
  | ((this: El, event: E) => Generator<any, void, any>)
  | ((this: El, event: E) => AsyncGenerator<any, void, any>);
```

**Usage:**
```typescript
// Sync handler
const syncHandler: HybridEventHandler<MouseEvent> = (event) => {
  console.log('Clicked at:', event.clientX, event.clientY);
};

// Async handler
const asyncHandler: HybridEventHandler<SubmitEvent> = async (event) => {
  event.preventDefault();
  await submitForm();
};

// Generator handler
const genHandler: HybridEventHandler<InputEvent> = function* (event) {
  yield addClass('typing');
  yield delay(300);
  yield removeClass('typing');
};

// Async generator handler
const asyncGenHandler: HybridEventHandler = async function* (event) {
  yield* addClass('processing');
  await processEvent(event);
  yield* removeClass('processing');
};
```

### `HybridEventOptions`

Advanced options for event handlers.

```typescript
interface HybridEventOptions extends Omit<AddEventListenerOptions, 'signal'> {
  /** Delegate events to child selector */
  delegate?: string;
  
  /** Delegation phase */
  delegatePhase?: 'bubble' | 'capture';
  
  /** Debounce configuration */
  debounce?: number | DebounceOptions;
  
  /** Throttle configuration */
  throttle?: number | ThrottleOptions;
  
  /** Event filter function */
  filter?: (event: Event, element: HTMLElement) => boolean;
  
  /** Abort signal for cleanup */
  signal?: AbortSignal;
  
  /** Queue mode for async handlers */
  queue?: 'latest' | 'all' | 'none';
}
```

### `DebounceOptions`

Configuration for debouncing.

```typescript
interface DebounceOptions {
  /** Wait time in milliseconds */
  wait: number;
  
  /** Execute on leading edge */
  leading?: boolean;
  
  /** Execute on trailing edge (default: true) */
  trailing?: boolean;
}
```

### `ThrottleOptions`

Configuration for throttling.

```typescript
interface ThrottleOptions {
  /** Limit in milliseconds */
  limit: number;
  
  /** Execute on leading edge (default: true) */
  leading?: boolean;
  
  /** Execute on trailing edge */
  trailing?: boolean;
}
```

### `EventHandler<E, El>`

Basic event handler type.

```typescript
type EventHandler<
  E extends Event = Event,
  El extends HTMLElement = HTMLElement
> = (this: El, event: E) => void;
```

### `CustomEventHandler<T, El>`

Handler for custom events with detail data.

```typescript
type CustomEventHandler<
  T = any,
  El extends HTMLElement = HTMLElement
> = (this: El, event: CustomEvent<T>) => void;
```

## State Types

### `TypedState<T>`

Typed wrapper for element state.

```typescript
interface TypedState<T> {
  /** Get state value */
  get(): T | undefined;
  
  /** Set state value */
  set(value: T): void;
  
  /** Update state with function */
  update(updater: (current: T | undefined) => T): void;
  
  /** Delete state */
  delete(): void;
  
  /** Check if state exists */
  exists(): boolean;
  
  /** Watch for changes */
  watch(callback: (newValue: T, oldValue: T | undefined) => void): () => void;
}
```

**Usage:**
```typescript
const counter = createState<number>('count', 0);
counter.set(counter.get() + 1);

const userState = createTypedState<User>('user');
userState.watch((newUser, oldUser) => {
  console.log('User changed:', newUser);
});
```

## Controller Types

### `WatchController<El>`

Controller for managing watched elements.

```typescript
interface WatchController<El extends HTMLElement = HTMLElement> {
  /** Original watch target */
  readonly subject: WatchTarget<El>;
  
  /** Get managed instances */
  getInstances(): ReadonlyMap<El, ManagedInstance>;
  
  /** Add behavior layer */
  layer(generator: ElementHandler<El>): void;
  
  /** Run on specific element */
  run(element: El): void;
  
  /** Run on all elements */
  runAll(): void;
  
  /** Destroy controller */
  destroy(): void;
  
  /** Pause watching */
  pause(): void;
  
  /** Resume watching */
  resume(): void;
  
  /** Check if paused */
  isPaused(): boolean;
}
```

### `ManagedInstance`

Information about a managed element instance.

```typescript
interface ManagedInstance {
  /** When element was first observed */
  observedAt: number;
  
  /** Number of generators applied */
  generatorCount: number;
  
  /** Element state */
  state: Map<string, any>;
}
```

### `WatchTarget<El>`

Types that can be watched.

```typescript
type WatchTarget<El extends HTMLElement = HTMLElement> =
  | string  // CSS selector
  | El      // Direct element
  | El[]    // Array of elements
  | NodeListOf<El>  // NodeList
  | ElementMatcher<El>  // Matcher function
  | (() => El | El[] | NodeListOf<El>);  // Factory function
```

## Workflow Types

### `Workflow<T>`

Async generator type for workflow operations.

```typescript
type Workflow<T> = AsyncGenerator<Operation, T, any>;
```

### `WorkflowFunction<Args, Result>`

Function that returns a workflow.

```typescript
type WorkflowFunction<
  Args extends any[] = any[],
  Result = void
> = (...args: Args) => Workflow<Result>;
```

### `Operation`

Internal operation type for workflows.

```typescript
type Operation = {
  type: 'get' | 'set' | 'call';
  target?: any;
  property?: string | symbol;
  args?: any[];
};
```

## Observer Types

### `AttributeChange`

Data for attribute change events.

```typescript
interface AttributeChange {
  /** Attribute name */
  name: string;
  
  /** Previous value */
  oldValue: string | null;
  
  /** Current value */
  value: string | null;
}
```

### `TextChange`

Data for text content changes.

```typescript
interface TextChange {
  /** Previous text */
  oldValue: string;
  
  /** Current text */
  value: string;
}
```

### `VisibilityChange`

Data for visibility changes.

```typescript
interface VisibilityChange {
  /** Whether element is visible */
  isVisible: boolean;
  
  /** Intersection ratio (0-1) */
  intersectionRatio: number;
  
  /** Full intersection observer entry */
  entry: IntersectionObserverEntry;
}
```

### `ResizeChange`

Data for element resize events.

```typescript
interface ResizeChange {
  /** New width */
  width: number;
  
  /** New height */
  height: number;
  
  /** Previous width */
  oldWidth?: number;
  
  /** Previous height */
  oldHeight?: number;
}
```

### `MountHandler`

Handler for element mount events.

```typescript
type MountHandler = 
  | (() => void)
  | (() => Generator<any, void, any>);
```

### `UnmountHandler`

Handler for element unmount events.

```typescript
type UnmountHandler = 
  | ((element: HTMLElement) => void)
  | (() => void);
```

## Scoped Watch Types

### `ScopedWatcher`

Controller for scoped watch operations.

```typescript
interface ScopedWatcher {
  /** Stop watching */
  disconnect(): void;
  
  /** Check if active */
  isActive(): boolean;
  
  /** Get parent element */
  getParent(): HTMLElement;
  
  /** Get selector */
  getSelector(): string;
  
  /** Get controller (if any) */
  getController(): WatchController<any> | null;
}
```

### `ScopedWatchOptions`

Options for scoped watching.

```typescript
interface ScopedWatchOptions {
  /** Watch attributes */
  attributes?: boolean;
  
  /** Track old attribute values */
  attributeOldValue?: boolean;
  
  /** Specific attributes to watch */
  attributeFilter?: string[];
  
  /** Watch character data */
  characterData?: boolean;
  
  /** Track old character data */
  characterDataOldValue?: boolean;
  
  /** Watch entire subtree */
  subtree?: boolean;
}
```

## Utility Types

### `Selector`

String type for CSS selectors.

```typescript
type Selector = string;
```

### `CSSPropertyName`

Valid CSS property names.

```typescript
type CSSPropertyName = keyof CSSStyleDeclaration;
```

### `AttributeName`

HTML attribute names.

```typescript
type AttributeName = string;
```

### `DataAttributeKey`

Data attribute keys (without 'data-' prefix).

```typescript
type DataAttributeKey = string;
```

### `EventName`

DOM event names.

```typescript
type EventName = 
  | keyof HTMLElementEventMap
  | keyof WindowEventMap
  | keyof DocumentEventMap
  | string;
```

### `Prettify<T>`

Utility type to expand type aliases for better IDE display.

```typescript
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
```

### `DualAPI<El>`

API object with dual-mode functions.

```typescript
type DualAPI<El extends Element = Element> = {
  text: (content?: string | number) => void | string;
  html: (content?: string) => void | string;
  addClass: (...classes: string[]) => void;
  removeClass: (...classes: string[]) => void;
  toggleClass: (className: string, force?: boolean) => boolean;
  hasClass: (className: string) => boolean;
  style: (prop: string | object, value?: string) => void | string;
  attr: (name: string, value?: string | number | boolean) => void | string | null;
  prop: <K extends keyof El>(name: K, value?: El[K]) => void | El[K];
  data: (key: string, value?: any) => void | string | DOMStringMap;
  // ... more methods
};
```

## Type Guards

The library provides several type guard functions:

### Element Type Guards

```typescript
// Check if value is an Element
function isElement(value: any): value is Element;

// Check if value is element-like
function isElementLike(value: any): value is Element | Document | Window;

// Check if element is specific type
function isElementType<T extends Element>(
  element: Element,
  tagName: string
): element is T;

// Check if element is input
function isInputElement(element: Element): element is HTMLInputElement;
```

### Selector Type Guards

```typescript
// Check if string is a selector
function isSelector(value: any): value is string;

// Check if value is valid watch target
function isValidTarget(value: any): value is WatchTarget;
```

### Function Type Guards

```typescript
// Check if function is generator
function isGeneratorFunction(fn: any): fn is GeneratorFunction;

// Check if function is async generator
function isAsyncGeneratorFunction(fn: any): fn is AsyncGeneratorFunction;

// Check if value is ElementFn
function isElementFn(value: any): value is ElementFn<any, any>;

// Check if value is Workflow
function isWorkflow(value: any): value is Workflow<any>;
```

### Context Type Guards

```typescript
// Check if in generator context
function isInGeneratorContext(): boolean;

// Safely cast to element
function asElement<T extends Element>(value: any): T | null;

// Check if value is defined
function isDefined<T>(value: T | undefined | null): value is T;
```

## Generic Type Examples

### Creating Type-Safe Components

```typescript
// Define component props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

// Type-safe component factory
function createButton<T extends ButtonProps>(props: T) {
  return function* (this: HTMLButtonElement) {
    yield addClass(`btn-${props.variant}`, `btn-${props.size}`);
    
    if (props.onClick) {
      yield click(props.onClick);
    }
  };
}

// Usage with type inference
watch('button', createButton({
  variant: 'primary',
  size: 'large',
  onClick: () => console.log('Clicked!')
}));
```

### State with Complex Types

```typescript
// Define state shape
interface AppState {
  user: {
    id: number;
    name: string;
    email: string;
    preferences: {
      theme: 'light' | 'dark';
      language: string;
    };
  };
  cart: {
    items: Array<{
      id: string;
      quantity: number;
      price: number;
    }>;
    total: number;
  };
}

// Type-safe state access
watch('.app', function* () {
  const user = getState<AppState['user']>('user');
  const cart = createTypedState<AppState['cart']>('cart');
  
  cart.update(current => ({
    ...current,
    total: current.items.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    )
  }));
});
```

### Event Handler Types

```typescript
// Custom event with typed detail
interface UserActionDetail {
  action: 'login' | 'logout' | 'update';
  timestamp: number;
  userId?: string;
}

type UserActionHandler = CustomEventHandler<UserActionDetail>;

const handleUserAction: UserActionHandler = (event) => {
  // event.detail is fully typed
  switch (event.detail.action) {
    case 'login':
      console.log('User logged in at', event.detail.timestamp);
      break;
    case 'logout':
      console.log('User logged out');
      break;
    case 'update':
      console.log('User updated:', event.detail.userId);
      break;
  }
};
```

## Type Inference Examples

### Automatic Element Type Inference

```typescript
// Button automatically typed as HTMLButtonElement
watch('button', function* () {
  const btn = self(); // HTMLButtonElement
  btn.disabled = false; // Type-safe property
});

// Input automatically typed as HTMLInputElement
watch('input', function* () {
  const input = self(); // HTMLInputElement
  input.value = 'Hello'; // Type-safe property
});

// Form automatically typed as HTMLFormElement
watch('form', function* () {
  const form = self(); // HTMLFormElement
  form.submit(); // Type-safe method
});
```

### Query Type Inference

```typescript
watch('.container', function* () {
  // Type inferred from selector
  const button = yield query('button'); // HTMLButtonElement | null
  const input = yield query('input'); // HTMLInputElement | null
  const links = yield queryAll('a'); // HTMLAnchorElement[]
  
  if (button) {
    button.disabled = false; // Type-safe!
  }
});
```

### State Type Inference

```typescript
// Explicit type parameter
const count = getState<number>('count', 0); // number

// Type inferred from default value
const name = getState('name', 'John'); // string

// Complex type inference
const user = getState('user', { id: 1, name: 'John' }); // { id: number; name: string }
```
