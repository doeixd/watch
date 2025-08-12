# Watch Selector API Documentation

Comprehensive API reference for the watch-selector library - a powerful, type-safe DOM observation library with generator-based composition.

## Table of Contents

- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Main API](#main-api)
  - [Core Functions](#core-functions)
  - [DOM Manipulation](#dom-manipulation)
  - [Event Handling](#event-handling)
  - [State Management](#state-management)
  - [Context Functions](#context-functions)
  - [Execution Helpers](#execution-helpers)
  - [Scoped Watching](#scoped-watching)
- [Generator Submodule](#generator-submodule)
- [Type Definitions](#type-definitions)
- [Advanced Patterns](#advanced-patterns)

## Installation

```bash
npm install watch-selector
```

## Core Concepts

Watch Selector provides multiple ways to interact with the DOM:

### 1. Direct Element Manipulation
```typescript
import { text, addClass } from 'watch-selector';

const button = document.querySelector('button');
text(button, 'Click me!');
addClass(button, 'interactive');
```

### 2. CSS Selector Manipulation
```typescript
import { text, addClass } from 'watch-selector';

text('#my-button', 'Click me!');
addClass('.buttons', 'interactive');
```

### 3. Generator Pattern (Traditional)
```typescript
import { watch, text, addClass } from 'watch-selector';

watch('button', function* () {
  yield text('Click me!');
  yield addClass('interactive');
});
```

### 4. Async Generator with $ Helper
```typescript
import { watch, $, text, addClass } from 'watch-selector';

watch('button', async function* () {
  yield* $(text('Click me!'));
  yield* $(addClass('interactive'));
});
```

### 5. Pure Generator Submodule
```typescript
import { watch } from 'watch-selector';
import { text, addClass } from 'watch-selector/generator';

watch('button', async function* () {
  yield* text('Click me!');
  yield* addClass('interactive');
});
```

## Main API

### Core Functions

#### `watch()`

Watch for elements matching a CSS selector and attach persistent behaviors.

```typescript
function watch<S extends string>(
  selector: S,
  handler: ElementHandler<ElementFromSelector<S>>
): WatchController<ElementFromSelector<S>>;

function watch<El extends HTMLElement>(
  element: El,
  handler: ElementHandler<El>
): WatchController<El>;

function watch<El extends HTMLElement>(
  target: WatchTarget<El>,
  handler: ElementHandler<El>
): WatchController<El>;
```

**Parameters:**
- `selector`: CSS selector string to match elements
- `element`: Direct element reference
- `target`: Advanced target (selector, element, or matcher function)
- `handler`: Generator function or regular function to run on matched elements

**Returns:** `WatchController` for managing the watcher

**Examples:**

```typescript
// Basic usage with type inference
watch('button', function* () {
  // 'this' is typed as HTMLButtonElement
  yield addClass('interactive');
  yield click(() => console.log('Clicked!'));
});

// Watch specific element
const myButton = document.getElementById('my-button');
watch(myButton, function* () {
  yield text('Ready');
});

// Advanced matcher function
watch(
  el => el.classList.contains('special'),
  function* () {
    yield addClass('enhanced');
  }
);

// Using the controller
const controller = watch('.dynamic', function* () {
  yield addClass('watched');
});

// Layer additional behaviors
controller.layer(function* () {
  yield addClass('enhanced');
});

// Get managed instances
const instances = controller.getInstances();

// Clean up
controller.destroy();
```

#### `run()`

Execute a generator function on an element immediately.

```typescript
function run<El extends HTMLElement>(
  element: El,
  generator: ElementHandler<El>
): void;
```

**Parameters:**
- `element`: The element to run the generator on
- `generator`: Generator function to execute

**Example:**

```typescript
const button = document.querySelector('button');
run(button, function* () {
  yield addClass('processed');
  yield text('Done!');
});
```

#### `runOn()`

Execute a generator on elements matching a selector.

```typescript
function runOn<S extends string>(
  selector: S,
  generator: ElementHandler<ElementFromSelector<S>>
): void;
```

**Parameters:**
- `selector`: CSS selector to find elements
- `generator`: Generator to run on each matched element

**Example:**

```typescript
runOn('.process-me', function* () {
  yield addClass('processed');
  yield text('Processed!');
});
```

#### `layer()`

Add additional behaviors to an existing watcher.

```typescript
function layer<El extends HTMLElement>(
  controller: WatchController<El>,
  generator: ElementHandler<El>
): void;
```

**Parameters:**
- `controller`: The watch controller to layer onto
- `generator`: Additional generator to apply

**Example:**

```typescript
const controller = watch('button', function* () {
  yield addClass('base');
});

layer(controller, function* () {
  yield addClass('enhanced');
  yield click(() => console.log('Enhanced click!'));
});
```

#### `getInstances()`

Get all elements currently managed by a controller.

```typescript
function getInstances<El extends HTMLElement>(
  controller: WatchController<El>
): ReadonlyMap<El, ManagedInstance>;
```

**Returns:** Map of elements to their managed instance data

#### `destroy()`

Stop watching and clean up all resources.

```typescript
function destroy<El extends HTMLElement>(
  controller: WatchController<El>
): void;
```

### DOM Manipulation

#### Text Content

##### `text()`

Get or set text content of an element.

```typescript
// Set text content
function text(element: Element, content: string | number): void;
function text(selector: string, content: string | number): void;
function text(content: string | number): ElementFn<Element, void>;

// Get text content
function text(element: Element): string;
function text(selector: string): string;
function text(): ElementFn<Element, string>;
```

**Examples:**

```typescript
// Direct element
const button = document.querySelector('button');
text(button, 'Click me!');
const content = text(button); // Get text

// CSS selector
text('#my-button', 'Click me!');
const content = text('#my-button'); // Get text

// In generator
watch('button', function* () {
  yield text('Ready');
  const current = yield text(); // Get current text
});

// With $ helper
watch('button', async function* () {
  yield* $(text('Ready'));
  const current = yield* $(text());
});
```

#### HTML Content

##### `html()`

Get or set HTML content of an element.

```typescript
// Set HTML content
function html(element: Element, content: string): void;
function html(selector: string, content: string): void;
function html(content: string): ElementFn<Element, void>;

// Get HTML content
function html(element: Element): string;
function html(selector: string): string;
function html(): ElementFn<Element, string>;
```

**Examples:**

```typescript
// Set HTML
html('#content', '<strong>Bold text</strong>');

// In generator
watch('.content', function* () {
  yield html('<p>New content</p>');
  const current = yield html(); // Get HTML
});
```

#### Class Manipulation

##### `addClass()`

Add one or more CSS classes to an element.

```typescript
function addClass(element: Element, ...classes: string[]): void;
function addClass(selector: string, ...classes: string[]): void;
function addClass(...classes: string[]): ElementFn<Element, void>;
```

**Examples:**

```typescript
// Add single class
addClass(element, 'active');

// Add multiple classes
addClass('#button', 'active', 'highlighted');

// In generator
watch('button', function* () {
  yield addClass('interactive', 'ready');
});
```

##### `removeClass()`

Remove one or more CSS classes from an element.

```typescript
function removeClass(element: Element, ...classes: string[]): void;
function removeClass(selector: string, ...classes: string[]): void;
function removeClass(...classes: string[]): ElementFn<Element, void>;
```

**Examples:**

```typescript
removeClass(element, 'active');
removeClass('#button', 'loading', 'disabled');

watch('button', function* () {
  yield removeClass('loading');
});
```

##### `toggleClass()`

Toggle CSS classes on an element.

```typescript
function toggleClass(element: Element, className: string, force?: boolean): boolean;
function toggleClass(selector: string, className: string, force?: boolean): boolean;
function toggleClass(className: string, force?: boolean): ElementFn<Element, boolean>;
```

**Parameters:**
- `className`: Class to toggle
- `force`: Optional - true to add, false to remove

**Returns:** Whether the class is present after toggling

**Examples:**

```typescript
// Toggle class
const isActive = toggleClass(element, 'active');

// Force add
toggleClass('#button', 'active', true);

// In generator
watch('button', function* () {
  const hasClass = yield toggleClass('active');
});
```

##### `hasClass()`

Check if an element has a CSS class.

```typescript
function hasClass(element: Element, className: string): boolean;
function hasClass(selector: string, className: string): boolean;
function hasClass(className: string): ElementFn<Element, boolean>;
```

**Returns:** True if the element has the class

**Examples:**

```typescript
if (hasClass(element, 'active')) {
  console.log('Element is active');
}

watch('button', function* () {
  const isActive = yield hasClass('active');
  if (isActive) {
    yield text('Active!');
  }
});
```

#### Style Manipulation

##### `style()`

Get or set CSS styles on an element.

```typescript
// Set multiple styles
function style(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void;
function style(selector: string, styles: Partial<CSSStyleDeclaration>): void;
function style(styles: Partial<CSSStyleDeclaration>): ElementFn<HTMLElement, void>;

// Set single style
function style(element: HTMLElement, prop: string, value: string): void;
function style(selector: string, prop: string, value: string): void;
function style(prop: string, value: string): ElementFn<HTMLElement, void>;

// Get style
function style(element: HTMLElement, prop: string): string;
function style(selector: string, prop: string): string;
function style(prop: string): ElementFn<HTMLElement, string>;
```

**Examples:**

```typescript
// Set multiple styles
style(element, {
  color: 'red',
  fontSize: '16px',
  display: 'block'
});

// Set single style
style('#button', 'backgroundColor', 'blue');

// Get style
const color = style(element, 'color');

// In generator
watch('.styled', function* () {
  yield style({ color: 'green', padding: '10px' });
  yield style('border', '1px solid black');
  const bg = yield style('backgroundColor');
});
```

#### Attribute Manipulation

##### `attr()`

Get or set attributes on an element.

```typescript
// Set attribute
function attr(element: Element, name: string, value: string | number | boolean): void;
function attr(selector: string, name: string, value: string | number | boolean): void;
function attr(name: string, value: string | number | boolean): ElementFn<Element, void>;

// Get attribute
function attr(element: Element, name: string): string | null;
function attr(selector: string, name: string): string | null;
function attr(name: string): ElementFn<Element, string | null>;
```

**Examples:**

```typescript
// Set attribute
attr(element, 'data-id', '123');
attr('#link', 'href', 'https://example.com');

// Get attribute
const id = attr(element, 'data-id');

// In generator
watch('[data-toggle]', function* () {
  yield attr('aria-expanded', 'true');
  const role = yield attr('role');
});
```

##### `removeAttr()`

Remove an attribute from an element.

```typescript
function removeAttr(element: Element, name: string): void;
function removeAttr(selector: string, name: string): void;
function removeAttr(name: string): ElementFn<Element, void>;
```

**Examples:**

```typescript
removeAttr(element, 'disabled');

watch('input', function* () {
  yield removeAttr('readonly');
});
```

##### `hasAttr()`

Check if an element has an attribute.

```typescript
function hasAttr(element: Element, name: string): boolean;
function hasAttr(selector: string, name: string): boolean;
function hasAttr(name: string): ElementFn<Element, boolean>;
```

**Examples:**

```typescript
if (hasAttr(element, 'disabled')) {
  console.log('Element is disabled');
}

watch('button', function* () {
  const isDisabled = yield hasAttr('disabled');
});
```

#### Property Manipulation

##### `prop()`

Get or set DOM properties on an element.

```typescript
// Set property
function prop<El extends Element, K extends keyof El>(
  element: El,
  name: K,
  value: El[K]
): void;
function prop<K extends keyof HTMLElement>(
  selector: string,
  name: K,
  value: HTMLElement[K]
): void;
function prop<El extends Element, K extends keyof El>(
  name: K,
  value: El[K]
): ElementFn<El, void>;

// Get property
function prop<El extends Element, K extends keyof El>(
  element: El,
  name: K
): El[K];
function prop<K extends keyof HTMLElement>(
  selector: string,
  name: K
): HTMLElement[K];
function prop<El extends Element, K extends keyof El>(
  name: K
): ElementFn<El, El[K]>;
```

**Examples:**

```typescript
// Set property
prop(input, 'value', 'Hello');
prop(checkbox, 'checked', true);

// Get property
const value = prop(input, 'value');
const isChecked = prop(checkbox, 'checked');

// In generator with type safety
watch('input', function* () {
  yield prop('value', 'Default text');
  yield prop('disabled', false);
  const currentValue = yield prop('value');
});
```

#### Data Attributes

##### `data()`

Get or set data attributes on an element.

```typescript
// Set data attribute
function data(element: HTMLElement, key: string, value: any): void;
function data(selector: string, key: string, value: any): void;
function data(key: string, value: any): ElementFn<HTMLElement, void>;

// Get data attribute
function data(element: HTMLElement, key: string): string | undefined;
function data(selector: string, key: string): string | undefined;
function data(key: string): ElementFn<HTMLElement, string | undefined>;

// Get all data attributes
function data(element: HTMLElement): DOMStringMap;
function data(selector: string): DOMStringMap;
function data(): ElementFn<HTMLElement, DOMStringMap>;
```

**Examples:**

```typescript
// Set data attribute
data(element, 'userId', '123');

// Get data attribute
const userId = data(element, 'userId');

// Get all data attributes
const allData = data(element);

// In generator
watch('[data-component]', function* () {
  yield data('initialized', 'true');
  const componentType = yield data('component');
  const all = yield data(); // Get all data attributes
});
```

#### Form Values

##### `value()`

Get or set the value of a form element.

```typescript
// Set value
function value(element: FormElement, val: string): void;
function value(selector: string, val: string): void;
function value(val: string): ElementFn<FormElement, void>;

// Get value
function value(element: FormElement): string;
function value(selector: string): string;
function value(): ElementFn<FormElement, string>;
```

**Examples:**

```typescript
// Set input value
value(input, 'Hello World');

// Get input value
const text = value(input);

// In generator
watch('input[type="text"]', function* () {
  yield value('Default text');
  const current = yield value();
});
```

##### `checked()`

Get or set the checked state of a checkbox or radio button.

```typescript
// Set checked state
function checked(element: HTMLInputElement, state: boolean): void;
function checked(selector: string, state: boolean): void;
function checked(state: boolean): ElementFn<HTMLInputElement, void>;

// Get checked state
function checked(element: HTMLInputElement): boolean;
function checked(selector: string): boolean;
function checked(): ElementFn<HTMLInputElement, boolean>;
```

**Examples:**

```typescript
// Check a checkbox
checked(checkbox, true);

// Get checked state
const isChecked = checked(checkbox);

// In generator
watch('input[type="checkbox"]', function* () {
  yield checked(true);
  const state = yield checked();
});
```

#### Focus Management

##### `focus()`

Set focus on an element.

```typescript
function focus(element: HTMLElement): void;
function focus(selector: string): void;
function focus(): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
focus(input);
focus('#search-input');

watch('input', function* () {
  yield focus();
});
```

##### `blur()`

Remove focus from an element.

```typescript
function blur(element: HTMLElement): void;
function blur(selector: string): void;
function blur(): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
blur(input);

watch('input', function* () {
  yield blur();
});
```

#### Visibility

##### `show()`

Show an element by removing 'display: none'.

```typescript
function show(element: HTMLElement): void;
function show(selector: string): void;
function show(): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
show(element);
show('#modal');

watch('.hidden', function* () {
  yield show();
});
```

##### `hide()`

Hide an element by setting 'display: none'.

```typescript
function hide(element: HTMLElement): void;
function hide(selector: string): void;
function hide(): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
hide(element);
hide('#modal');

watch('.modal', function* () {
  yield hide();
});
```

#### DOM Traversal

##### `query()`

Find a child element matching a selector.

```typescript
function query<S extends string>(
  element: Element,
  selector: S
): ElementFromSelector<S> | null;
function query<S extends string>(
  parentSelector: string,
  childSelector: S
): ElementFromSelector<S> | null;
function query<S extends string>(
  selector: S
): ElementFn<Element, ElementFromSelector<S> | null>;
```

**Examples:**

```typescript
// Find child element
const button = query(container, 'button');

// Chain selectors
const submit = query('#form', 'button[type="submit"]');

// In generator
watch('.container', function* () {
  const button = yield query('button');
  if (button) {
    text(button, 'Found!');
  }
});
```

##### `queryAll()`

Find all child elements matching a selector.

```typescript
function queryAll<S extends string>(
  element: Element,
  selector: S
): ElementFromSelector<S>[];
function queryAll<S extends string>(
  parentSelector: string,
  childSelector: S
): ElementFromSelector<S>[];
function queryAll<S extends string>(
  selector: S
): ElementFn<Element, ElementFromSelector<S>[]>;
```

**Examples:**

```typescript
// Find all matching children
const buttons = queryAll(container, 'button');

// In generator
watch('.container', function* () {
  const items = yield queryAll('.item');
  items.forEach(item => addClass(item, 'found'));
});
```

##### `parentDOM()`

Get the parent element.

```typescript
function parentDOM(element: Element): HTMLElement | null;
function parentDOM(selector: string): HTMLElement | null;
function parentDOM(): ElementFn<Element, HTMLElement | null>;
```

**Examples:**

```typescript
const parent = parentDOM(element);

watch('.child', function* () {
  const parent = yield parentDOM();
  if (parent) {
    addClass(parent, 'has-active-child');
  }
});
```

##### `childrenDOM()`

Get all child elements.

```typescript
function childrenDOM(element: Element): Element[];
function childrenDOM(selector: string): Element[];
function childrenDOM(): ElementFn<Element, Element[]>;
```

**Examples:**

```typescript
const children = childrenDOM(container);

watch('.parent', function* () {
  const children = yield childrenDOM();
  children.forEach(child => addClass(child, 'child-element'));
});
```

##### `siblingsDOM()`

Get all sibling elements.

```typescript
function siblingsDOM(element: Element): Element[];
function siblingsDOM(selector: string): Element[];
function siblingsDOM(): ElementFn<Element, Element[]>;
```

**Examples:**

```typescript
const siblings = siblingsDOM(element);

watch('.active', function* () {
  const siblings = yield siblingsDOM();
  siblings.forEach(sibling => removeClass(sibling, 'active'));
});
```

#### Batch Operations

##### `batchAll()`

Apply multiple operations to an element in sequence.

```typescript
function batchAll<El extends Element>(
  element: El,
  ...operations: ElementFn<El, any>[]
): void;
function batchAll<El extends Element>(
  selector: string,
  ...operations: ElementFn<Element, any>[]
): void;
function batchAll<El extends Element>(
  ...operations: ElementFn<El, any>[]
): ElementFn<El, void>;
```

**Examples:**

```typescript
// Apply multiple operations
batchAll(
  element,
  addClass('active'),
  text('Active!'),
  style({ color: 'green' })
);

// In generator
watch('button', function* () {
  yield batchAll(
    addClass('ready'),
    text('Click me'),
    attr('aria-label', 'Click to continue')
  );
});
```

### Event Handling

#### Basic Events

##### `on()`

Attach an event listener to an element.

```typescript
function on<K extends keyof HTMLElementEventMap>(
  element: HTMLElement,
  event: K,
  handler: HybridEventHandler<HTMLElementEventMap[K], HTMLElement>,
  options?: HybridEventOptions
): void;
function on<K extends keyof HTMLElementEventMap>(
  selector: string,
  event: K,
  handler: HybridEventHandler<HTMLElementEventMap[K], HTMLElement>,
  options?: HybridEventOptions
): void;
function on<K extends keyof HTMLElementEventMap>(
  event: K,
  handler: HybridEventHandler<HTMLElementEventMap[K], HTMLElement>,
  options?: HybridEventOptions
): ElementFn<HTMLElement, void>;
```

**Parameters:**
- `event`: Event name
- `handler`: Event handler (function or generator)
- `options`: Advanced options (debounce, throttle, delegate, etc.)

**Examples:**

```typescript
// Basic event listener
on(element, 'click', (event) => {
  console.log('Clicked!');
});

// With options
on('#button', 'click', handler, {
  debounce: 300,
  delegate: '.child-button',
  once: true
});

// Generator handler
watch('button', function* () {
  yield on('click', function* (event) {
    yield addClass('clicked');
    yield text('Clicked!');
  });
});

// Advanced options
watch('.form', function* () {
  yield on('input', function* (event) {
    const value = (event.target as HTMLInputElement).value;
    yield setState('query', value);
  }, {
    debounce: { wait: 300, trailing: true },
    delegate: 'input[type="search"]',
    queue: 'latest'
  });
});
```

##### `click()`

Attach a click event handler.

```typescript
function click(
  element: HTMLElement,
  handler: HybridEventHandler<MouseEvent, HTMLElement>,
  options?: HybridEventOptions
): void;
function click(
  selector: string,
  handler: HybridEventHandler<MouseEvent, HTMLElement>,
  options?: HybridEventOptions
): void;
function click(
  handler: HybridEventHandler<MouseEvent, HTMLElement>,
  options?: HybridEventOptions
): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
// Simple click handler
click(button, () => console.log('Clicked!'));

// Generator click handler
watch('button', function* () {
  yield click(function* (event) {
    yield addClass('active');
    yield delay(1000);
    yield removeClass('active');
  });
});

// With debouncing
watch('.rapid-click', function* () {
  yield click((event) => {
    console.log('Debounced click');
  }, { debounce: 500 });
});
```

##### `input()`

Attach an input event handler.

```typescript
function input(
  element: HTMLElement,
  handler: HybridEventHandler<Event, HTMLElement>,
  options?: HybridEventOptions
): void;
function input(
  selector: string,
  handler: HybridEventHandler<Event, HTMLElement>,
  options?: HybridEventOptions
): void;
function input(
  handler: HybridEventHandler<Event, HTMLElement>,
  options?: HybridEventOptions
): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
// Track input changes
input(textField, (event) => {
  const value = (event.target as HTMLInputElement).value;
  console.log('Input:', value);
});

// With debouncing for search
watch('#search', function* () {
  yield input(function* (event) {
    const query = (event.target as HTMLInputElement).value;
    yield setState('searchQuery', query);
    // Perform search...
  }, { debounce: 300 });
});
```

##### `change()`

Attach a change event handler.

```typescript
function change(
  element: HTMLElement,
  handler: HybridEventHandler<Event, HTMLElement>,
  options?: HybridEventOptions
): void;
function change(
  selector: string,
  handler: HybridEventHandler<Event, HTMLElement>,
  options?: HybridEventOptions
): void;
function change(
  handler: HybridEventHandler<Event, HTMLElement>,
  options?: HybridEventOptions
): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
// Handle select changes
change(select, (event) => {
  const value = (event.target as HTMLSelectElement).value;
  console.log('Selected:', value);
});

// Handle checkbox changes
watch('input[type="checkbox"]', function* () {
  yield change(function* (event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    yield setState('enabled', isChecked);
  });
});
```

##### `submit()`

Attach a submit event handler.

```typescript
function submit(
  element: HTMLElement,
  handler: HybridEventHandler<SubmitEvent, HTMLElement>,
  options?: HybridEventOptions
): void;
function submit(
  selector: string,
  handler: HybridEventHandler<SubmitEvent, HTMLElement>,
  options?: HybridEventOptions
): void;
function submit(
  handler: HybridEventHandler<SubmitEvent, HTMLElement>,
  options?: HybridEventOptions
): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
// Handle form submission
submit(form, (event) => {
  event.preventDefault();
  const formData = new FormData(event.target as HTMLFormElement);
  // Process form data...
});

// Generator form handler
watch('form', function* () {
  yield submit(function* (event) {
    event.preventDefault();
    yield addClass('submitting');
    
    const formData = new FormData(event.target as HTMLFormElement);
    await submitToAPI(formData);
    
    yield removeClass('submitting');
    yield addClass('success');
  });
});
```

#### Event Utilities

##### `emit()`

Emit a custom event from an element.

```typescript
function emit(
  element: HTMLElement,
  eventName: string,
  detail?: any
): void;
function emit(
  selector: string,
  eventName: string,
  detail?: any
): void;
function emit(
  eventName: string,
  detail?: any
): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
// Emit custom event
emit(element, 'user-action', { action: 'click', timestamp: Date.now() });

// In generator
watch('button', function* () {
  yield click(function* () {
    yield emit('button-clicked', { id: 'btn-1' });
  });
});
```

##### `createEventBehavior()`

Create a reusable event behavior.

```typescript
function createEventBehavior<
  E extends Event = Event,
  El extends HTMLElement = HTMLElement
>(
  eventName: keyof HTMLElementEventMap | string,
  handler: HybridEventHandler<E, El>,
  options?: HybridEventOptions
): ElementFn<El, void>;
```

**Examples:**

```typescript
// Create reusable behaviors
const rippleEffect = createEventBehavior('click', function* () {
  yield addClass('ripple');
  yield delay(600);
  yield removeClass('ripple');
});

const trackClick = createEventBehavior('click', (event) => {
  analytics.track('click', {
    element: event.target
  });
});

// Use behaviors
watch('.material-button', function* () {
  yield rippleEffect;
  yield trackClick;
});
```

##### `composeEventHandlers()`

Compose multiple event handlers into one.

```typescript
function composeEventHandlers<
  E extends Event = Event,
  El extends HTMLElement = HTMLElement
>(
  ...handlers: Array<HybridEventHandler<E, El> | ElementFn<El, void>>
): HybridEventHandler<E, El>;
```

**Examples:**

```typescript
// Compose multiple handlers
const combinedHandler = composeEventHandlers(
  (event) => console.log('First handler'),
  function* (event) {
    yield addClass('processing');
  },
  async (event) => {
    await processEvent(event);
  }
);

watch('button', function* () {
  yield click(combinedHandler);
});
```

##### `delegate()`

Create a delegated event handler.

```typescript
function delegate<E extends Event = Event>(
  selector: string,
  handler: HybridEventHandler<E, HTMLElement>
): HybridEventHandler<E, HTMLElement>;
```

**Examples:**

```typescript
// Delegate events to child elements
const delegatedHandler = delegate('.item', function* (event) {
  const item = event.currentTarget as HTMLElement;
  yield addClass('selected');
});

watch('.list', function* () {
  yield click(delegatedHandler);
});
```

##### `createCustomEvent()`

Create a custom event with detail data.

```typescript
function createCustomEvent<T = any>(
  name: string,
  detail?: T,
  options?: EventInit
): CustomEvent<T>;
```

**Examples:**

```typescript
const event = createCustomEvent('user-action', {
  action: 'save',
  timestamp: Date.now()
}, { bubbles: true });

element.dispatchEvent(event);
```

#### Observer Events

##### `onAttr()`

Listen for attribute changes on an element.

```typescript
function onAttr(
  element: Element,
  callback: (change: AttributeChange) => void,
  attributeFilter?: string[]
): void;
function onAttr(
  selector: string,
  callback: (change: AttributeChange) => void,
  attributeFilter?: string[]
): void;
function onAttr(
  callback: (change: AttributeChange) => void,
  attributeFilter?: string[]
): ElementFn<Element, void>;
```

**Parameters:**
- `callback`: Function called when attributes change
- `attributeFilter`: Optional array of attribute names to watch

**Examples:**

```typescript
// Watch all attribute changes
onAttr(element, (change) => {
  console.log(`Attribute ${change.name} changed from ${change.oldValue} to ${change.value}`);
});

// Watch specific attributes
onAttr('#button', (change) => {
  if (change.name === 'disabled') {
    console.log('Button disabled state changed');
  }
}, ['disabled', 'aria-expanded']);

// In generator
watch('[data-toggle]', function* () {
  yield onAttr((change) => {
    if (change.name === 'data-state') {
      console.log('State changed to:', change.value);
    }
  });
});
```

##### `onText()`

Listen for text content changes on an element.

```typescript
function onText(
  element: Element,
  callback: (change: TextChange) => void
): void;
function onText(
  selector: string,
  callback: (change: TextChange) => void
): void;
function onText(
  callback: (change: TextChange) => void
): ElementFn<Element, void>;
```

**Examples:**

```typescript
// Watch text changes
onText(element, (change) => {
  console.log(`Text changed from "${change.oldValue}" to "${change.value}"`);
});

// In generator
watch('.counter', function* () {
  yield onText((change) => {
    if (parseInt(change.value) > 100) {
      yield addClass('high-count');
    }
  });
});
```

##### `onVisible()`

Listen for visibility changes (entering/leaving viewport).

```typescript
function onVisible(
  element: HTMLElement,
  callback: (change: VisibilityChange) => void,
  options?: IntersectionObserverInit
): void;
function onVisible(
  selector: string,
  callback: (change: VisibilityChange) => void,
  options?: IntersectionObserverInit
): void;
function onVisible(
  callback: (change: VisibilityChange) => void,
  options?: IntersectionObserverInit
): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
// Track visibility
onVisible(element, (change) => {
  if (change.isVisible) {
    console.log('Element is now visible');
    startAnimation();
  } else {
    console.log('Element is no longer visible');
    pauseAnimation();
  }
});

// With threshold options
watch('.lazy-load', function* () {
  yield onVisible((change) => {
    if (change.isVisible && change.intersectionRatio > 0.5) {
      yield loadContent();
    }
  }, { threshold: 0.5 });
});
```

##### `onResize()`

Listen for element size changes.

```typescript
function onResize(
  element: HTMLElement,
  callback: (change: ResizeChange) => void
): void;
function onResize(
  selector: string,
  callback: (change: ResizeChange) => void
): void;
function onResize(
  callback: (change: ResizeChange) => void
): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
// Track size changes
onResize(element, (change) => {
  console.log(`New size: ${change.width}x${change.height}`);
  console.log(`Old size: ${change.oldWidth}x${change.oldHeight}`);
});

// In generator
watch('.responsive', function* () {
  yield onResize((change) => {
    if (change.width < 768) {
      yield addClass('mobile');
    } else {
      yield removeClass('mobile');
    }
  });
});
```

#### Lifecycle Events

##### `onMount()`

Execute handler when element is added to DOM.

```typescript
function onMount(
  element: HTMLElement,
  handler: MountHandler
): void;
function onMount(
  selector: string,
  handler: MountHandler
): void;
function onMount(
  handler: MountHandler
): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
// Run initialization when mounted
onMount(element, () => {
  console.log('Element mounted');
  initializeComponent();
});

// Generator mount handler
watch('.component', function* () {
  yield onMount(function* () {
    yield addClass('mounted');
    yield animate('fade-in');
  });
});
```

##### `onUnmount()`

Execute handler when element is removed from DOM.

```typescript
function onUnmount(
  element: HTMLElement,
  handler: UnmountHandler
): void;
function onUnmount(
  selector: string,
  handler: UnmountHandler
): void;
function onUnmount(
  handler: UnmountHandler
): ElementFn<HTMLElement, void>;
```

**Examples:**

```typescript
// Cleanup when unmounted
onUnmount(element, () => {
  console.log('Element unmounted');
  cleanup();
});

// In generator
watch('.temporary', function* () {
  yield onUnmount(() => {
    console.log('Element removed');
    saveState();
  });
});
```

### State Management

#### Basic State Operations

##### `getState()`

Get state value for an element.

```typescript
function getState<T = any>(key: string, defaultValue?: T): T | undefined;
```

**Parameters:**
- `key`: State key
- `defaultValue`: Optional default value if state doesn't exist

**Returns:** The state value or default value

**Examples:**

```typescript
// In generator context
watch('.stateful', function* () {
  const count = getState<number>('count', 0);
  const user = getState<User>('user');
  
  if (user) {
    yield text(`Hello, ${user.name}`);
  }
});

// With $ helper for async generators
watch('.counter', async function* () {
  const count = yield* $(getState<number>('count', 0));
  yield* $(text(`Count: ${count}`));
});
```

##### `setState()`

Set state value for an element.

```typescript
function setState<T = any>(key: string, value: T): void;
```

**Parameters:**
- `key`: State key
- `value`: Value to set

**Examples:**

```typescript
// In generator context
watch('.counter', function* () {
  yield click(() => {
    const count = getState<number>('count', 0);
    setState('count', count + 1);
    text(self(), `Count: ${count + 1}`);
  });
});

// With complex state
watch('.user-card', function* () {
  setState('user', {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com'
  });
});
```

##### `updateState()`

Update state value using a function.

```typescript
function updateState<T = any>(
  key: string,
  updater: (current: T | undefined) => T
): void;
```

**Parameters:**
- `key`: State key
- `updater`: Function that receives current value and returns new value

**Examples:**

```typescript
// Increment counter
watch('.counter', function* () {
  yield click(() => {
    updateState<number>('count', (current = 0) => current + 1);
  });
});

// Update array state
watch('.todo-list', function* () {
  yield click('.add', () => {
    updateState<string[]>('todos', (todos = []) => [
      ...todos,
      'New Todo'
    ]);
  });
});
```

##### `hasState()`

Check if state key exists.

```typescript
function hasState(key: string): boolean;
```

**Returns:** True if the state key exists

**Examples:**

```typescript
watch('.conditional', function* () {
  if (hasState('initialized')) {
    yield text('Already initialized');
  } else {
    setState('initialized', true);
    yield text('Initializing...');
  }
});
```

##### `deleteState()`

Remove a state key.

```typescript
function deleteState(key: string): void;
```

**Examples:**

```typescript
watch('.resettable', function* () {
  yield click('.reset', () => {
    deleteState('count');
    deleteState('user');
    text(self(), 'Reset complete');
  });
});
```

#### Advanced State Operations

##### `createState()`

Create a typed state with initial value.

```typescript
function createState<T>(key: string, initialValue: T): TypedState<T>;
```

**Returns:** TypedState object with get/set methods

**Examples:**

```typescript
watch('.typed-counter', function* () {
  const counter = createState('count', 0);
  
  yield click(() => {
    counter.set(counter.get() + 1);
    text(self(), `Count: ${counter.get()}`);
  });
});
```

##### `createTypedState()`

Create a strongly-typed state wrapper.

```typescript
function createTypedState<T>(key: string): TypedState<T>;
```

**Examples:**

```typescript
interface UserState {
  name: string;
  email: string;
  age: number;
}

watch('.user-form', function* () {
  const userState = createTypedState<UserState>('user');
  
  userState.set({
    name: 'John',
    email: 'john@example.com',
    age: 30
  });
  
  const user = userState.get();
});
```

##### `watchState()`

Watch for state changes.

```typescript
function watchState<T = any>(
  key: string,
  callback: (newValue: T, oldValue: T | undefined) => void
): () => void;
```

**Returns:** Cleanup function to stop watching

**Examples:**

```typescript
watch('.reactive', function* () {
  // Watch state changes
  const unwatch = watchState<number>('count', (newValue, oldValue) => {
    console.log(`Count changed from ${oldValue} to ${newValue}`);
    text(self(), `Count: ${newValue}`);
  });
  
  // Clean up on unmount
  yield onUnmount(() => {
    unwatch();
  });
});
```

##### `createComputed()`

Create a computed state value.

```typescript
function createComputed<T>(
  key: string,
  dependencies: string[],
  compute: (...values: any[]) => T
): TypedState<T>;
```

**Examples:**

```typescript
watch('.computed', function* () {
  const total = createComputed(
    'total',
    ['price', 'quantity'],
    (price: number, quantity: number) => price * quantity
  );
  
  setState('price', 10);
  setState('quantity', 5);
  
  yield text(`Total: $${total.get()}`); // Total: $50
});
```

##### `setStateReactive()`

Set state and trigger watchers immediately.

```typescript
function setStateReactive<T = any>(key: string, value: T): void;
```

**Examples:**

```typescript
watch('.reactive-update', function* () {
  watchState('message', (msg) => {
    text(self(), msg);
  });
  
  yield click(() => {
    setStateReactive('message', 'Updated!'); // Triggers watcher immediately
  });
});
```

##### `batchStateUpdates()`

Batch multiple state updates.

```typescript
function batchStateUpdates(updates: () => void): void;
```

**Examples:**

```typescript
watch('.batch-update', function* () {
  yield click(() => {
    batchStateUpdates(() => {
      setState('a', 1);
      setState('b', 2);
      setState('c', 3);
      // All watchers triggered once after batch
    });
  });
});
```

##### `createPersistedState()`

Create state that persists to localStorage.

```typescript
function createPersistedState<T>(
  key: string,
  initialValue: T,
  options?: { storage?: Storage; serialize?: (value: T) => string; deserialize?: (value: string) => T }
): TypedState<T>;
```

**Examples:**

```typescript
watch('.settings', function* () {
  const theme = createPersistedState('theme', 'light');
  
  yield click('.toggle-theme', () => {
    theme.set(theme.get() === 'light' ? 'dark' : 'light');
    // Automatically saved to localStorage
  });
});
```

##### `clearAllState()`

Clear all state for an element.

```typescript
function clearAllState(): void;
```

**Examples:**

```typescript
watch('.clearable', function* () {
  yield click('.clear-all', () => {
    clearAllState();
    text(self(), 'All state cleared');
  });
});
```

##### `debugState()` / `logState()`

Debug and log current element state.

```typescript
function debugState(): void;
function logState(prefix?: string): void;
```

**Examples:**

```typescript
watch('.debug', function* () {
  setState('user', { name: 'John' });
  setState('count', 42);
  
  debugState(); // Logs all state to console
  logState('Current state:'); // Logs with prefix
});
```

### Context Functions

Functions available within generator contexts.

##### `self()`

Get the current element being processed.

```typescript
function self<El extends HTMLElement = HTMLElement>(): El;
```

**Returns:** The current element

**Examples:**

```typescript
watch('button', function* () {
  const button = self<HTMLButtonElement>();
  console.log('Processing:', button);
  
  yield click(() => {
    const el = self();
    text(el, 'Clicked!');
  });
});
```

##### `el()`

Query for a child element within the current element.

```typescript
function el<S extends string>(
  selector: S
): ElementFromSelector<S> | null;
```

**Returns:** The found element or null

**Examples:**

```typescript
watch('.card', function* () {
  const title = el('.title');
  if (title) {
    text(title, 'Card Title');
  }
  
  const button = el('button');
  if (button) {
    addClass(button, 'primary');
  }
});
```

##### `all()`

Query for all child elements matching a selector.

```typescript
function all<S extends string>(
  selector: S
): ElementFromSelector<S>[];
```

**Returns:** Array of matching elements

**Examples:**

```typescript
watch('.list', function* () {
  const items = all('.item');
  items.forEach((item, index) => {
    text(item, `Item ${index + 1}`);
  });
  
  const buttons = all('button');
  buttons.forEach(btn => addClass(btn, 'styled'));
});
```

##### `cleanup()`

Register a cleanup function to run when the element is unmounted.

```typescript
function cleanup(fn: () => void): void;
```

**Examples:**

```typescript
watch('.component', function* () {
  const interval = setInterval(() => {
    console.log('Tick');
  }, 1000);
  
  // Register cleanup
  cleanup(() => {
    clearInterval(interval);
    console.log('Cleaned up');
  });
});
```

##### `ctx()`

Get the current watch context.

```typescript
function ctx(): WatchContext;
```

**Returns:** The current watch context object

**Examples:**

```typescript
watch('.advanced', function* () {
  const context = ctx();
  console.log('Context:', context);
  
  // Access context properties
  if (context.parent) {
    console.log('Has parent context');
  }
});
```

##### `getParentContext()` / `parentContext()`

Get the parent watch context if it exists.

```typescript
function getParentContext(): ParentContext | null;
function parentContext(): ParentContext | null;
```

**Returns:** Parent context or null

**Examples:**

```typescript
watch('.nested', function* () {
  const parent = getParentContext();
  if (parent) {
    console.log('Parent element:', parent.element);
    console.log('Parent selector:', parent.selector);
  }
});
```

### Execution Helpers

Utilities for controlling execution flow.

##### `delay()`

Delay execution for a specified time.

```typescript
function delay(ms: number): ElementFn<any, Promise<void>>;
```

**Parameters:**
- `ms`: Milliseconds to delay

**Examples:**

```typescript
watch('.animated', function* () {
  yield addClass('start');
  yield delay(1000);
  yield addClass('middle');
  yield delay(1000);
  yield addClass('end');
});
```

##### `once()`

Execute a function only once per element.

```typescript
function once<T>(fn: () => T): ElementFn<any, T | undefined>;
```

**Returns:** Result of function or undefined if already executed

**Examples:**

```typescript
watch('.initialize-once', function* () {
  yield once(() => {
    console.log('This only runs once per element');
    initializeExpensiveResource();
  });
});
```

##### `throttle()`

Throttle function execution.

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): T;
```

**Parameters:**
- `fn`: Function to throttle
- `limit`: Minimum time between executions in ms

**Examples:**

```typescript
watch('.scroll-container', function* () {
  const handleScroll = throttle(() => {
    console.log('Scrolled');
    updateScrollPosition();
  }, 100);
  
  yield on('scroll', handleScroll);
});
```

##### `debounce()`

Debounce function execution.

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options?: { leading?: boolean; trailing?: boolean }
): T;
```

**Parameters:**
- `fn`: Function to debounce
- `wait`: Wait time in ms
- `options`: Leading/trailing edge options

**Examples:**

```typescript
watch('.search', function* () {
  const search = debounce((query: string) => {
    performSearch(query);
  }, 300);
  
  yield input((event) => {
    const value = (event.target as HTMLInputElement).value;
    search(value);
  });
});
```

##### `when()`

Execute function when condition is met.

```typescript
function when(
  condition: () => boolean,
  fn: () => void,
  options?: { timeout?: number; checkInterval?: number }
): ElementFn<any, Promise<void>>;
```

**Examples:**

```typescript
watch('.conditional', function* () {
  yield when(
    () => hasState('ready'),
    () => {
      text(self(), 'Ready!');
    },
    { timeout: 5000 }
  );
});
```

##### `retry()`

Retry a function on failure.

```typescript
function retry<T>(
  fn: () => T | Promise<T>,
  options?: { attempts?: number; delay?: number; backoff?: number }
): ElementFn<any, Promise<T>>;
```

**Examples:**

```typescript
watch('.api-dependent', function* () {
  const data = yield retry(
    () => fetchDataFromAPI(),
    { attempts: 3, delay: 1000, backoff: 2 }
  );
  
  yield text(`Data: ${JSON.stringify(data)}`);
});
```

### Scoped Watching

Create watchers scoped to specific parent elements.

##### `scopedWatch()`

Create a watcher scoped to a parent element.

```typescript
function scopedWatch<S extends string, P extends HTMLElement = HTMLElement>(
  parent: P | string,
  selector: S,
  handler: ElementHandler<ElementFromSelector<S>>,
  options?: ScopedWatchOptions
): ScopedWatcher;
```

**Parameters:**
- `parent`: Parent element or selector
- `selector`: Child selector to watch
- `handler`: Generator function for matched elements
- `options`: MutationObserver options

**Returns:** ScopedWatcher control object

**Examples:**

```typescript
// Watch for new items in a specific list
const listWatcher = scopedWatch('#todo-list', '.todo-item', function* () {
  yield addClass('new-item');
  yield click(() => {
    toggleClass(self(), 'completed');
  });
});

// Stop watching
listWatcher.disconnect();

// Check if active
if (listWatcher.isActive()) {
  console.log('Still watching');
}
```

##### `scopedWatchBatch()`

Create multiple scoped watchers for the same parent.

```typescript
function scopedWatchBatch<P extends HTMLElement = HTMLElement>(
  parent: P | string,
  watchers: Array<{
    selector: string;
    handler: ElementHandler<any>;
  }>,
  options?: ScopedWatchOptions
): ScopedWatcher;
```

**Examples:**

```typescript
const formWatcher = scopedWatchBatch('#dynamic-form', [
  {
    selector: 'input[type="text"]',
    handler: function* () {
      yield attr('placeholder', 'Enter text...');
    }
  },
  {
    selector: 'button',
    handler: function* () {
      yield addClass('form-button');
    }
  }
]);
```

##### `scopedWatchTimeout()`

Create a scoped watcher that auto-disconnects after a timeout.

```typescript
function scopedWatchTimeout<S extends string, P extends HTMLElement = HTMLElement>(
  parent: P | string,
  selector: S,
  handler: ElementHandler<ElementFromSelector<S>>,
  timeout: number,
  options?: ScopedWatchOptions
): ScopedWatcher;
```

**Parameters:**
- `timeout`: Time in ms before auto-disconnect

**Examples:**

```typescript
// Watch for 10 seconds then stop
scopedWatchTimeout(
  '.temporary-container',
  '.item',
  function* () {
    yield addClass('processed');
  },
  10000
);
```

##### `scopedWatchOnce()`

Create a scoped watcher that processes a limited number of elements.

```typescript
function scopedWatchOnce<S extends string, P extends HTMLElement = HTMLElement>(
  parent: P | string,
  selector: S,
  handler: ElementHandler<ElementFromSelector<S>>,
  count?: number,
  options?: ScopedWatchOptions
): ScopedWatcher;
```

**Parameters:**
- `count`: Number of elements to process before auto-disconnect (default: 1)

**Examples:**

```typescript
// Process only the first 3 items added
scopedWatchOnce(
  '#stream',
  '.message',
  function* () {
    yield addClass('highlighted');
  },
  3
);
```

## Generator Submodule

The generator submodule provides pure workflow functions for use with `yield*`.

### Import

```typescript
import { watch } from 'watch-selector';
import { text, addClass, click, getState, setState } from 'watch-selector/generator';
```

### Key Differences

1. **No Overloading**: Functions return `Workflow<T>` directly
2. **Clean Syntax**: Use `yield*` without wrapper functions
3. **Type Safety**: Perfect type inference through async generators
4. **Single Purpose**: Each function has one clear purpose

### Example Usage

```typescript
import { watch } from 'watch-selector';
import {
  text,
  addClass,
  removeClass,
  click,
  delay,
  getState,
  setState,
  self
} from 'watch-selector/generator';

watch('.button', async function* () {
  // Direct yield* - no $ wrapper needed
  yield* addClass('ready');
  
  // Get typed element
  const button = yield* self<HTMLButtonElement>();
  
  // Set text
  yield* text('Click me!');
  
  // Handle events with generators
  yield* click(async function* (event) {
    yield* addClass('clicked');
    yield* delay(300);
    yield* removeClass('clicked');
    
    // State management
    const count = yield* getState<number>('clicks', 0);
    yield* setState('clicks', count + 1);
    yield* text(`Clicked ${count + 1} times`);
  });
});
```

### Available Functions

All functions from the main API are available in generator form:

- **DOM**: `text`, `html`, `addClass`, `removeClass`, `toggleClass`, `style`, `attr`, `prop`, `data`, `value`, `checked`, `focus`, `blur`, `show`, `hide`
- **Traversal**: `self`, `query`, `queryAll`, `parent`, `children`, `siblings`
- **Events**: `click`, `input`, `change`, `submit`, `on`, `emit`, `onAttr`, `onText`, `onVisible`, `onResize`, `onMount`, `onUnmount`
- **State**: `getState`, `setState`, `updateState`, `hasState`, `deleteState`, `watchState`, `computedState`
- **Utilities**: `delay`, `log`, `run`

## Type Definitions

### Core Types

#### `ElementFromSelector<S>`

Maps CSS selectors to their corresponding element types.

```typescript
type ElementFromSelector<S extends string> = 
  S extends 'button' ? HTMLButtonElement :
  S extends 'input' ? HTMLInputElement :
  S extends 'form' ? HTMLFormElement :
  S extends 'a' ? HTMLAnchorElement :
  S extends 'img' ? HTMLImageElement :
  // ... many more mappings
  HTMLElement;
```

#### `ElementHandler<El>`

Handler function type for watch callbacks.

```typescript
type ElementHandler<El extends HTMLElement = HTMLElement> = 
  | GeneratorFunction<El>
  | ((this: El) => void);
```

#### `ElementFn<El, R>`

Function that operates on an element in generator context.

```typescript
type ElementFn<El extends Element, R = void> = (element: El) => R;
```

#### `WatchContext`

Context object available in watch generators.

```typescript
interface WatchContext<El extends HTMLElement = HTMLElement> {
  element: El;
  selector?: string;
  parent?: ParentContext;
  cleanup: (fn: () => void) => void;
  state: Map<string, any>;
  // ... more properties
}
```

#### `WatchController<El>`

Controller for managing watched elements.

```typescript
interface WatchController<El extends HTMLElement = HTMLElement> {
  readonly subject: WatchTarget<El>;
  getInstances(): ReadonlyMap<El, ManagedInstance>;
  layer(generator: ElementHandler<El>): void;
  run(element: El): void;
  runAll(): void;
  destroy(): void;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
}
```

#### `Workflow<T>`

Async generator type for workflow functions.

```typescript
type Workflow<T> = AsyncGenerator<Operation, T, any>;
```

### Event Types

#### `HybridEventHandler<E, El>`

Flexible event handler supporting multiple patterns.

```typescript
type HybridEventHandler<E extends Event = Event, El extends HTMLElement = HTMLElement> =
  | ((this: El, event: E) => void | Promise<void>)
  | ((this: El, event: E) => Generator<any, void, any>)
  | ((this: El, event: E) => AsyncGenerator<any, void, any>);
```

#### `HybridEventOptions`

Advanced event listener options.

```typescript
interface HybridEventOptions extends Omit<AddEventListenerOptions, 'signal'> {
  delegate?: string;
  delegatePhase?: 'bubble' | 'capture';
  debounce?: number | DebounceOptions;
  throttle?: number | ThrottleOptions;
  filter?: (event: Event, element: HTMLElement) => boolean;
  signal?: AbortSignal;
  queue?: 'latest' | 'all' | 'none';
}
```

### State Types

#### `TypedState<T>`

Typed state wrapper.

```typescript
interface TypedState<T> {
  get(): T | undefined;
  set(value: T): void;
  update(updater: (current: T | undefined) => T): void;
  delete(): void;
  exists(): boolean;
}
```

### Observer Types

#### `AttributeChange`

Attribute change event data.

```typescript
interface AttributeChange {
  name: string;
  oldValue: string | null;
  value: string | null;
}
```

#### `TextChange`

Text content change event data.

```typescript
interface TextChange {
  oldValue: string;
  value: string;
}
```

#### `VisibilityChange`

Visibility change event data.

```typescript
interface VisibilityChange {
  isVisible: boolean;
  intersectionRatio: number;
  entry: IntersectionObserverEntry;
}
```

#### `ResizeChange`

Resize event data.

```typescript
interface ResizeChange {
  width: number;
  height: number;
  oldWidth?: number;
  oldHeight?: number;
}
```

## Advanced Patterns

### Component Pattern

Create reusable component behaviors:

```typescript
// Define component behavior
function createCounter() {
  return function* () {
    const count = createState('count', 0);
    
    yield addClass('counter');
    yield text(`Count: ${count.get()}`);
    
    yield click(() => {
      count.set(count.get() + 1);
      text(self(), `Count: ${count.get()}`);
    });
  };
}

// Use component
watch('.counter-widget', createCounter());
```

### Composition Pattern

Compose multiple behaviors:

```typescript
// Define behaviors
const makeInteractive = function* () {
  yield addClass('interactive');
  yield attr('tabindex', '0');
};

const addRipple = function* () {
  yield click(function* () {
    yield addClass('ripple');
    yield delay(600);
    yield removeClass('ripple');
  });
};

const trackAnalytics = function* () {
  yield click(() => {
    analytics.track('button_click', {
      element: self().id
    });
  });
};

// Compose behaviors
watch('.material-button', function* () {
  yield* makeInteractive();
  yield* addRipple();
  yield* trackAnalytics();
});
```

### State Machine Pattern

Implement state machines:

```typescript
type State = 'idle' | 'loading' | 'success' | 'error';

watch('.async-button', function* () {
  const state = createState<State>('state', 'idle');
  
  const updateUI = (newState: State) => {
    removeClass(self(), 'idle', 'loading', 'success', 'error');
    addClass(self(), newState);
    
    switch (newState) {
      case 'idle':
        text(self(), 'Submit');
        break;
      case 'loading':
        text(self(), 'Loading...');
        break;
      case 'success':
        text(self(), 'Success!');
        break;
      case 'error':
        text(self(), 'Error! Try again');
        break;
    }
  };
  
  yield click(async () => {
    if (state.get() === 'loading') return;
    
    state.set('loading');
    updateUI('loading');
    
    try {
      await submitForm();
      state.set('success');
      updateUI('success');
      
      setTimeout(() => {
        state.set('idle');
        updateUI('idle');
      }, 2000);
    } catch (error) {
      state.set('error');
      updateUI('error');
      
      setTimeout(() => {
        state.set('idle');
        updateUI('idle');
      }, 3000);
    }
  });
});
```

### Reactive Forms Pattern

Build reactive forms with validation:

```typescript
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

function createForm(initialValues: Record<string, any>) {
  return function* () {
    const formState = createState<FormState>('form', {
      values: initialValues,
      errors: {},
      touched: {},
      isValid: true,
      isSubmitting: false
    });
    
    // Validate field
    const validateField = (name: string, value: any) => {
      const state = formState.get()!;
      const errors = { ...state.errors };
      
      // Example validation
      if (!value) {
        errors[name] = 'This field is required';
      } else {
        delete errors[name];
      }
      
      formState.set({
        ...state,
        errors,
        isValid: Object.keys(errors).length === 0
      });
    };
    
    // Handle input changes
    yield input(function* (event) {
      const input = event.target as HTMLInputElement;
      const { name, value } = input;
      
      const state = formState.get()!;
      formState.set({
        ...state,
        values: { ...state.values, [name]: value },
        touched: { ...state.touched, [name]: true }
      });
      
      validateField(name, value);
      
      // Show error if touched
      if (state.touched[name] && state.errors[name]) {
        const error = el(`.error-${name}`);
        if (error) {
          text(error, state.errors[name]);
          show(error);
        }
      }
    }, { delegate: 'input, select, textarea' });
    
    // Handle form submission
    yield submit(async function* (event) {
      event.preventDefault();
      
      const state = formState.get()!;
      if (!state.isValid) return;
      
      formState.set({ ...state, isSubmitting: true });
      yield addClass('submitting');
      
      try {
        await submitToAPI(state.values);
        yield addClass('success');
        yield text('.message', 'Form submitted successfully!');
      } catch (error) {
        yield addClass('error');
        yield text('.message', 'Submission failed. Please try again.');
      } finally {
        formState.set({ ...state, isSubmitting: false });
        yield removeClass('submitting');
      }
    });
  };
}

// Use the form
watch('#contact-form', createForm({
  name: '',
  email: '',
  message: ''
}));
```

### Animation Pattern

Create complex animations:

```typescript
import { watch } from 'watch-selector';
import { addClass, removeClass, delay, style } from 'watch-selector/generator';

function* fadeIn(duration = 300) {
  yield style({ opacity: '0', transition: `opacity ${duration}ms` });
  yield delay(10); // Force reflow
  yield style('opacity', '1');
  yield delay(duration);
}

function* slideDown(duration = 300) {
  const element = self();
  const height = element.scrollHeight;
  
  yield style({
    height: '0',
    overflow: 'hidden',
    transition: `height ${duration}ms`
  });
  yield delay(10);
  yield style('height', `${height}px`);
  yield delay(duration);
  yield style('height', 'auto');
}

function* bounce(times = 3) {
  for (let i = 0; i < times; i++) {
    yield addClass('bounce');
    yield delay(200);
    yield removeClass('bounce');
    yield delay(100);
  }
}

// Compose animations
watch('.animated-element', async function* () {
  yield* fadeIn();
  yield* slideDown();
  yield* bounce();
});
```

### Plugin System Pattern

Create a plugin system:

```typescript
interface Plugin {
  name: string;
  install: GeneratorFunction;
  config?: any;
}

class PluginManager {
  private plugins: Plugin[] = [];
  
  register(plugin: Plugin) {
    this.plugins.push(plugin);
  }
  
  *applyPlugins() {
    for (const plugin of this.plugins) {
      console.log(`Installing plugin: ${plugin.name}`);
      yield* plugin.install.call(this);
    }
  }
}

// Define plugins
const tooltipPlugin: Plugin = {
  name: 'tooltip',
  install: function* () {
    const tooltip = attr(self(), 'data-tooltip');
    if (tooltip) {
      yield onMouseenter(() => showTooltip(tooltip));
      yield onMouseleave(() => hideTooltip());
    }
  }
};

const validationPlugin: Plugin = {
  name: 'validation',
  install: function* () {
    if (self().tagName === 'INPUT') {
      yield blur(function* () {
        const value = (self() as HTMLInputElement).value;
        if (!value) {
          yield addClass('error');
        } else {
          yield removeClass('error');
        }
      });
    }
  }
};

// Use plugins
const manager = new PluginManager();
manager.register(tooltipPlugin);
manager.register(validationPlugin);

watch('[data-enhance]', function* () {
  yield* manager.applyPlugins();
});
```

### Performance Optimization Pattern

Optimize for performance:

```typescript
// Virtualized list pattern
watch('.virtual-list', function* () {
  const items = getState<any[]>('items', []);
  const itemHeight = 50;
  const containerHeight = 500;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const scrollTop = 0;
  
  // Only render visible items
  const renderVisibleItems = () => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount, items.length);
    
    const container = self();
    container.innerHTML = '';
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.style.position = 'absolute';
      item.style.top = `${i * itemHeight}px`;
      item.style.height = `${itemHeight}px`;
      item.textContent = items[i].label;
      container.appendChild(item);
    }
  };
  
  // Debounced scroll handler
  yield on('scroll', debounce(() => {
    scrollTop = self().scrollTop;
    renderVisibleItems();
  }, 16)); // ~60fps
  
  // Initial render
  renderVisibleItems();
});

// Lazy loading pattern
watch('[data-lazy]', function* () {
  yield onVisible(function* (change) {
    if (change.isVisible) {
      const src = attr(self(), 'data-lazy');
      if (src) {
        yield attr('src', src);
        yield removeAttr('data-lazy');
        yield addClass('loaded');
      }
    }
  }, { threshold: 0.1 });
});

// Request animation frame pattern
watch('.smooth-animation', function* () {
  let animationId: number;
  let progress = 0;
  
  const animate = () => {
    progress += 0.01;
    if (progress > 1) progress = 0;
    
    style(self(), 'transform', `translateX(${progress * 100}px)`);
    animationId = requestAnimationFrame(animate);
  };
  
  yield onMount(() => {
    animationId = requestAnimationFrame(animate);
  });
  
  yield onUnmount(() => {
    cancelAnimationFrame(animationId);
  });
});
```

### Testing Pattern

Structure code for testability:

```typescript
// Testable behavior factory
export function createCounterBehavior(options = {}) {
  const { initial = 0, step = 1, max = Infinity } = options;
  
  return function* () {
    const count = createState('count', initial);
    
    yield addClass('counter');
    yield text(`Count: ${count.get()}`);
    
    yield click('.increment', () => {
      const current = count.get();
      if (current < max) {
        count.set(current + step);
        text(self(), `Count: ${count.get()}`);
      }
    }, { delegate: true });
    
    yield click('.decrement', () => {
      const current = count.get();
      if (current > 0) {
        count.set(current - step);
        text(self(), `Count: ${count.get()}`);
      }
    }, { delegate: true });
    
    yield click('.reset', () => {
      count.set(initial);
      text(self(), `Count: ${count.get()}`);
    }, { delegate: true });
  };
}

// Test the behavior
import { test, expect } from 'vitest';
import { createCounterBehavior } from './counter';

test('counter increments correctly', () => {
  const element = document.createElement('div');
  const behavior = createCounterBehavior({ initial: 0, step: 2 });
  
  // Run behavior
  run(element, behavior);
  
  // Simulate clicks
  const incrementBtn = element.querySelector('.increment');
  incrementBtn?.click();
  
  expect(element.textContent).toBe('Count: 2');
});
```

### Error Handling Pattern

Robust error handling:

```typescript
// Error boundary pattern
function withErrorBoundary(handler: GeneratorFunction) {
  return function* () {
    try {
      yield* handler.call(this);
    } catch (error) {
      console.error('Component error:', error);
      
      yield addClass('error-state');
      yield text('.error-message', 'Something went wrong');
      
      // Report to error tracking
      if (window.errorReporter) {
        window.errorReporter.report(error);
      }
      
      // Provide recovery action
      yield click('.retry', function* () {
        yield removeClass('error-state');
        yield* handler.call(this);
      });
    }
  };
}

// Use with error boundary
watch('.risky-component', withErrorBoundary(function* () {
  const data = yield fetchRiskyData();
  yield renderData(data);
}));

// Graceful degradation pattern
watch('.enhanced-feature', function* () {
  // Check for required APIs
  if (!window.IntersectionObserver) {
    yield addClass('fallback-mode');
    return;
  }
  
  // Enhanced functionality
  yield onVisible(function* (change) {
    if (change.isVisible) {
      yield loadAdvancedFeature();
    }
  });
});
```

## Best Practices

### 1. Memory Management

Always clean up resources:

```typescript
watch('.component', function* () {
  const interval = setInterval(updateTime, 1000);
  const controller = new AbortController();
  
  // Register cleanup
  cleanup(() => {
    clearInterval(interval);
    controller.abort();
  });
  
  // Use abort signal for fetch
  yield click(async () => {
    const response = await fetch('/api/data', {
      signal: controller.signal
    });
  });
});
```

### 2. Type Safety

Leverage TypeScript's type system:

```typescript
// Define component props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

// Type-safe component
function createButton(props: ButtonProps) {
  return function* () {
    yield addClass(`btn-${props.variant}`, `btn-${props.size}`);
    
    if (props.disabled) {
      yield attr('disabled', 'true');
      yield addClass('disabled');
    }
  };
}

// Type inference from selectors
watch('button', function* () {
  const button = self(); // Typed as HTMLButtonElement
  button.disabled = false; // Type-safe property access
});
```

### 3. Performance

Optimize for performance:

```typescript
// Batch DOM updates
watch('.list', function* () {
  yield batchAll(
    addClass('ready'),
    text('Loading...'),
    style({ opacity: '0.5' })
  );
  
  const items = await loadItems();
  
  // Use DocumentFragment for bulk inserts
  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    fragment.appendChild(li);
  });
  
  self().appendChild(fragment);
});

// Debounce expensive operations
watch('.search', function* () {
  yield input(async (event) => {
    const query = (event.target as HTMLInputElement).value;
    const results = await searchAPI(query);
    renderResults(results);
  }, { debounce: 300 });
});
```

### 4. Accessibility

Build accessible interfaces:

```typescript
watch('.modal', function* () {
  // Set ARIA attributes
  yield attr('role', 'dialog');
  yield attr('aria-modal', 'true');
  yield attr('aria-labelledby', 'modal-title');
  
  // Trap focus
  const focusableElements = all('button, input, select, a');
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  yield keydown((event) => {
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
    
    if (event.key === 'Escape') {
      closeModal();
    }
  });
  
  // Focus first element on mount
  yield onMount(() => {
    firstElement?.focus();
  });
});
```

### 5. Testing

Write testable code:

```typescript
// Separate behavior logic
export const buttonBehavior = {
  ripple: function* () {
    yield addClass('ripple');
    yield delay(600);
    yield removeClass('ripple');
  },
  
  loading: function* (isLoading: boolean) {
    if (isLoading) {
      yield addClass('loading');
      yield attr('disabled', 'true');
    } else {
      yield removeClass('loading');
      yield removeAttr('disabled');
    }
  }
};

// Test behaviors independently
import { buttonBehavior } from './behaviors';
import { run } from 'watch-selector';

test('ripple effect', async () => {
  const element = document.createElement('button');
  
  await run(element, buttonBehavior.ripple);
  
  expect(element.classList.contains('ripple')).toBe(false);
});
```

## Migration Guide

### From jQuery

```javascript
// jQuery
$('.button').addClass('active').text('Ready').on('click', handler);

// Watch Selector
watch('.button', function* () {
  yield addClass('active');
  yield text('Ready');
  yield click(handler);
});
```

### From Vanilla JS

```javascript
// Vanilla JS
document.querySelectorAll('.item').forEach(item => {
  item.classList.add('found');
  item.addEventListener('click', () => {
    item.classList.toggle('selected');
  });
});

// Watch Selector
watch('.item', function* () {
  yield addClass('found');
  yield click(() => {
    toggleClass(self(), 'selected');
  });
});
```

### From React Hooks

```jsx
// React
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}

// Watch Selector
watch('.counter', function* () {
  const count = createState('count', 0);
  
  yield text(`Count: ${count.get()}`);
  yield click(() => {
    count.set(count.get() + 1);
    text(self(), `Count: ${count.get()}`);
  });
});
```

## Browser Support

Watch Selector supports all modern browsers:
- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Opera 74+

Required browser APIs:
- MutationObserver
- WeakMap/WeakSet
- Proxy (for some advanced features)
- Async Generators

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © Patrick Glenn

## Links

- [GitHub Repository](https://github.com/patrickg/watch-selector)
- [NPM Package](https://www.npmjs.com/package/watch-selector)
- [Examples](./examples/)
- [API Reference](./API.md)
- [Migration Guide](#migration-guide)
