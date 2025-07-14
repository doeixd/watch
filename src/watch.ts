/**
 * # Watch v5 - Reactive DOM Observation Library
 * 
 * The Watch library provides a powerful way to reactively observe and manipulate DOM elements
 * using generator functions. It automatically handles element lifecycle, state management,
 * and cleanup while maintaining full type safety.
 * 
 * ## Key Features
 * - **Type-safe element observation** - Elements are automatically typed based on selectors
 * - **Generator-based reactivity** - Use `yield` to declaratively define element behavior
 * - **Automatic cleanup** - All observers and event listeners are cleaned up automatically
 * - **State management** - Per-element state that persists across observations
 * - **Event delegation** - Efficient event handling for dynamic content
 * - **Dual API** - Functions work both directly and within generators
 */

import type { 
  ElementFromSelector, 
  ElementFn, 
  ElementMatcher, 
  WatchTarget, 
  PreDefinedWatchContext,
  WatchController,
  ManagedInstance,
  TypedGeneratorContext
} from './types';
import { getOrCreateController } from './core/observer';
import { executeGenerator } from './core/context';
import { isPreDefinedWatchContext } from './core/context-factory';
import { debounceGenerator, throttleGenerator, onceGenerator } from './core/generator-utils';
import { setContextApi } from './core/generator';

// Watch function overloads - the heart of the system

/**
 * # watch() - The Core Reactive DOM Observer
 * 
 * The `watch` function is the heart of the Watch library. It observes DOM elements and runs 
 * generator functions reactively, with full type safety and automatic cleanup.
 * 
 * ## Overloads
 * 
 * ### 1. String Selector - Observe elements by CSS selector
 * ```typescript
 * watch('button', function* () {
 *   // Element type is automatically inferred as HTMLButtonElement
 *   yield click(() => console.log('Button clicked!'));
 *   yield text('Click me');
 * });
 * 
 * // Or with explicit context parameter for better ergonomics
 * watch('button', function* (ctx) {
 *   yield click(() => console.log('Button clicked!'));
 *   yield text('Click me');
 * });
 * ```
 * 
 * ### 2. Single Element - Observe a specific element
 * ```typescript
 * const myButton = document.getElementById('myButton');
 * watch(myButton, function* () {
 *   yield style({ color: 'red' });
 *   yield on('click', () => console.log('Clicked!'));
 * });
 * ```
 * 
 * ### 3. Element Matcher - Use a function to match elements
 * ```typescript
 * watch((el): el is HTMLInputElement => el.type === 'email', function* () {
 *   yield attr('placeholder', 'Enter your email');
 *   yield on('input', (e) => validateEmail(e.target.value));
 * });
 * ```
 * 
 * ### 4. Array of Elements - Observe multiple specific elements
 * ```typescript
 * const buttons = Array.from(document.querySelectorAll('.my-button'));
 * watch(buttons, function* () {
 *   yield addClass('watched');
 *   yield click(() => console.log('Button clicked!'));
 * });
 * ```
 * 
 * ### 5. NodeList - Observe all elements in a NodeList
 * ```typescript
 * const inputs = document.querySelectorAll('input[type="text"]');
 * watch(inputs, function* () {
 *   yield focus(() => yield addClass('focused'));
 *   yield blur(() => yield removeClass('focused'));
 * });
 * ```
 * 
 * ### 6. Event Delegation - Parent element with child selector
 * ```typescript
 * const container = document.getElementById('container');
 * watch(container, 'button', function* () {
 *   // Efficiently handles clicks on any button inside container
 *   yield click(() => console.log('Dynamic button clicked!'));
 * });
 * ```
 * 
 * ### 7. Pre-defined Context - Enhanced type safety with options
 * ```typescript
 * const buttonContext = button('.my-button', { 
 *   debounce: 300,
 *   once: true 
 * });
 * watch(buttonContext, function* () {
 *   yield click(() => console.log('Debounced click!'));
 * });
 * ```
 * 
 * ## Generator Functions
 * 
 * Generator functions define the reactive behavior for observed elements:
 * 
 * ```typescript
 * watch('form', function* () {
 *   // Set initial state
 *   yield setState('valid', false);
 *   
 *   // Set up validation
 *   yield on('input', () => {
 *     const isValid = self().checkValidity();
 *     yield setState('valid', isValid);
 *     yield toggleClass('invalid', !isValid);
 *   });
 *   
 *   // Handle submission
 *   yield submit((e) => {
 *     if (!getState('valid')) {
 *       e.preventDefault();
 *       yield text('Please fix errors');
 *     }
 *   });
 * });
 * ```
 * 
 * ## State Management
 * 
 * Each observed element gets its own isolated state:
 * 
 * ```typescript
 * watch('input', function* () {
 *   // Initialize state
 *   yield setState('previousValue', '');
 *   yield setState('changeCount', 0);
 *   
 *   yield on('change', () => {
 *     const current = self().value;
 *     const previous = getState('previousValue');
 *     
 *     if (current !== previous) {
 *       yield updateState('changeCount', count => count + 1);
 *       yield setState('previousValue', current);
 *     }
 *   });
 * });
 * ```
 * 
 * ## Cleanup
 * 
 * All observers, event listeners, and resources are automatically cleaned up:
 * 
 * ```typescript
 * const cleanup = watch('div', function* () {
 *   // This will be cleaned up automatically
 *   yield on('click', () => console.log('Clicked'));
 *   
 *   // You can also register custom cleanup
 *   yield cleanup(() => {
 *     console.log('Element being cleaned up');
 *   });
 * });
 * 
 * // Manually trigger cleanup if needed
 * cleanup();
 * ```
 * 
 * @param selector - CSS selector string that matches target elements
 * @param generator - Generator function that defines reactive behavior
 * @returns WatchController to manage the watch operation
 */
// 1. String Selector
export function watch<S extends string>(
  selector: S, 
  generator: (ctx: TypedGeneratorContext<ElementFromSelector<S>>) => Generator<ElementFn<ElementFromSelector<S>>, void, unknown>
): WatchController<ElementFromSelector<S>>;

// 2. Single element
export function watch<El extends HTMLElement>(
  element: El,
  generator: (ctx: TypedGeneratorContext<El>) => Generator<ElementFn<El>, void, unknown>
): WatchController<El>;

// 3. Matcher function
export function watch<El extends HTMLElement>(
  matcher: ElementMatcher<El>,
  generator: (ctx: TypedGeneratorContext<El>) => Generator<ElementFn<El>, void, unknown>
): WatchController<El>;

// 4. Array of elements
export function watch<El extends HTMLElement>(
  elements: El[],
  generator: (ctx: TypedGeneratorContext<El>) => Generator<ElementFn<El>, void, unknown>
): WatchController<El>;

// 5. NodeList
export function watch<El extends HTMLElement>(
  nodeList: NodeListOf<El>,
  generator: (ctx: TypedGeneratorContext<El>) => Generator<ElementFn<El>, void, unknown>
): WatchController<El>;

// 6. Event Delegation
export function watch<Parent extends HTMLElement, S extends string>(
  parent: Parent,
  childSelector: S,
  generator: (ctx: TypedGeneratorContext<ElementFromSelector<S>>) => Generator<ElementFn<ElementFromSelector<S>>, void, unknown>
): WatchController<ElementFromSelector<S>>;

// 7. Pre-defined watch context
export function watch<
  Ctx extends PreDefinedWatchContext<any, any, any>,
  El extends Ctx['elementType'] = Ctx['elementType']
>(
  context: Ctx,
  generator: (ctx: TypedGeneratorContext<El>) => Generator<ElementFn<El>, void, unknown>
): WatchController<El>;

// Implementation
export function watch<T extends WatchTarget | HTMLElement | PreDefinedWatchContext<any, any, any>>(
  target: T,
  selectorOrGenerator?: string | ((ctx: TypedGeneratorContext<any>) => Generator<ElementFn<any>, void, unknown>),
  generator?: (ctx: TypedGeneratorContext<any>) => Generator<ElementFn<any>, void, unknown>
): WatchController<any> {
  
  // Handle pre-defined watch context case
  if (isPreDefinedWatchContext(target)) {
    const context = target;
    const actualGenerator = selectorOrGenerator as (ctx: TypedGeneratorContext<any>) => Generator<ElementFn<any>, void, unknown>;
    
    // Apply options like debounce, throttle, etc.
    let wrappedGenerator = actualGenerator;
    
    if (context.options.debounce) {
      wrappedGenerator = debounceGenerator(actualGenerator, context.options.debounce);
    }
    
    if (context.options.throttle) {
      wrappedGenerator = throttleGenerator(actualGenerator, context.options.throttle);
    }
    
    if (context.options.once) {
      wrappedGenerator = onceGenerator(actualGenerator);
    }
    
    // Get or create controller for this context
    const controller = getOrCreateController(context.selector);
    controller.layer(wrappedGenerator);
    return controller;
  }
  
  // Handle event delegation case: watch(parent, childSelector, generator)
  if (arguments.length === 3 && target instanceof HTMLElement && typeof selectorOrGenerator === 'string') {
    const parent = target;
    const childSelector = selectorOrGenerator;
    const delegatedGenerator = generator!;
    
    // Create a special target that combines the parent element and child selector
    // This ensures each parent-child combination gets its own controller
    const delegatedTarget = { parent: parent as HTMLElement, childSelector };
    
    // Get or create controller for this delegation
    const controller = getOrCreateController(delegatedTarget);
    controller.layer(delegatedGenerator);
    return controller;
  }
  
  // Handle normal cases: watch(target, generator)
  const actualGenerator = selectorOrGenerator as (ctx: TypedGeneratorContext<any>) => Generator<ElementFn<any>, void, unknown>;
  
  // Get or create controller for this target
  const controller = getOrCreateController(target as WatchTarget);
  controller.layer(actualGenerator);
  return controller;
}

/**
 * # run() - Execute Generator on Existing Elements
 * 
 * The `run` function executes a generator function on all existing elements that match
 * a selector, without setting up ongoing observation. This is useful for one-time
 * operations on existing DOM elements.
 * 
 * Unlike `watch()`, `run()` does not observe for new elements or element removal.
 * It's perfect for initialization tasks or one-time transformations.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Apply initial styling to all existing buttons
 * run('button', function* () {
 *   yield addClass('styled');
 *   yield style({ borderRadius: '4px' });
 * });
 * 
 * // Initialize form validation on existing forms
 * run('form', function* () {
 *   yield setState('pristine', true);
 *   yield attr('novalidate', 'true');
 * });
 * 
 * // Set up complex initial state
 * run('.counter', function* () {
 *   const initialValue = parseInt(self().dataset.initial || '0');
 *   yield setState('count', initialValue);
 *   yield text(`Count: ${initialValue}`);
 * });
 * ```
 * 
 * ## Differences from watch()
 * 
 * | Feature | `watch()` | `run()` |
 * |---------|-----------|---------|
 * | Ongoing observation | ✅ | ❌ |
 * | Works with new elements | ✅ | ❌ |
 * | Cleanup required | ✅ | ❌ |
 * | One-time execution | ❌ | ✅ |
 * | State management | ✅ | ✅ |
 * | Event handling | ✅ | ✅ |
 * 
 * ## When to Use
 * 
 * - **Initialization**: Set up initial state or styling
 * - **One-time transformations**: Apply changes that don't need ongoing observation
 * - **Performance**: When you know elements won't change after initial setup
 * - **Static content**: Working with content that won't be dynamically added/removed
 * 
 * @param selector - CSS selector string that matches target elements
 * @param generator - Generator function that defines the behavior to execute
 */
export function run<S extends string>(
  selector: S,
  generator: (ctx: TypedGeneratorContext<ElementFromSelector<S>>) => Generator<ElementFn<ElementFromSelector<S>>, void, unknown>
): void {
  const elements = Array.from(document.querySelectorAll(selector));
  
  elements.forEach((element, index) => {
    if (element instanceof HTMLElement) {
      executeGenerator(
        element as ElementFromSelector<S>,
        selector,
        index,
        elements as ElementFromSelector<S>[],
        generator
      ).then(returnValue => {
        // Store the API if it exists
        if (returnValue !== undefined) {
          setContextApi(element, returnValue);
        }
      }).catch(error => {
        console.error('Error in run generator:', error);
      });
    }
  });
}

/**
 * # runOn() - Execute Generator on a Single Element
 * 
 * The `runOn` function executes a generator function on a single specific element,
 * without setting up ongoing observation. This is useful for applying behavior
 * to a known element instance.
 * 
 * ## Usage
 * 
 * ```typescript
 * const button = document.getElementById('myButton');
 * 
 * // Apply behavior to a specific element
 * runOn(button, function* () {
 *   yield addClass('initialized');
 *   yield style({ backgroundColor: 'blue' });
 *   yield text('Ready!');
 * });
 * 
 * // Set up initial state for a specific element
 * const counter = document.querySelector('.counter');
 * runOn(counter, function* () {
 *   yield setState('count', 0);
 *   yield text('Count: 0');
 *   
 *   // Even though this is one-time, event handlers still work
 *   yield click(() => {
 *     const count = getState('count') + 1;
 *     yield setState('count', count);
 *     yield text(`Count: ${count}`);
 *   });
 * });
 * ```
 * 
 * ## Type Safety
 * 
 * The element type is preserved and inferred:
 * 
 * ```typescript
 * const input = document.querySelector('input[type="email"]') as HTMLInputElement;
 * 
 * runOn(input, function* () {
 *   // TypeScript knows this is HTMLInputElement
 *   yield attr('placeholder', 'Enter your email');
 *   yield value('user@example.com');
 *   
 *   // Access element-specific properties
 *   const currentValue = self().value; // ✅ Type-safe
 * });
 * ```
 * 
 * ## When to Use
 * 
 * - **Specific elements**: When you have a reference to a specific element
 * - **Initialization**: Set up initial state or behavior for known elements
 * - **Dynamic elements**: Apply behavior to elements created dynamically
 * - **Component setup**: Initialize behavior for component root elements
 * 
 * @param element - The specific HTML element to run the generator on
 * @param generator - Generator function that defines the behavior to execute
 */
export function runOn<El extends HTMLElement, T = any>(
  element: El,
  generator: (ctx: TypedGeneratorContext<El>) => Generator<ElementFn<El>, T, unknown> | AsyncGenerator<ElementFn<El>, T, unknown>
): Promise<T | undefined> {
  const arr = [element];
  
  return executeGenerator(
    element,
    `element-${element.tagName.toLowerCase()}`,
    0,
    arr,
    generator
  ).then(returnValue => {
    // Store the API if it exists
    if (returnValue !== undefined) {
      setContextApi(element, returnValue);
    }
    return returnValue;
  });
}

// --- Standalone Controller Functions ---

/**
 * Adds a new behavior "layer" to an existing WatchController.
 * This is the functional alternative to `controller.layer()`.
 */
export function layer<El extends HTMLElement>(
  controller: WatchController<El>,
  generator: () => Generator<ElementFn<El, any>, any, unknown>
): void {
  controller.layer(generator);
}

/**
 * Returns a read-only Map of the current elements being managed by a WatchController.
 * This is the functional alternative to `controller.getInstances()`.
 */
export function getInstances<El extends HTMLElement>(
  controller: WatchController<El>
): ReadonlyMap<El, ManagedInstance> {
  return controller.getInstances();
}

/**
 * Destroys a WatchController and all its associated behaviors.
 * This is the functional alternative to `controller.destroy()`.
 */
export function destroy(controller: WatchController<any>): void {
  controller.destroy();
}
