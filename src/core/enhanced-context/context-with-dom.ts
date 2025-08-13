/**
 * Enhanced TypedGeneratorContext with attached DOM manipulation functions
 *
 * This module extends the TypedGeneratorContext to include all DOM manipulation
 * functions from dom-new.ts directly attached to the context object, providing
 * a more ergonomic API while maintaining full type safety.
 */

import type {
  TypedGeneratorContext,
  CleanupFunction,
  Workflow,
} from "../../types";
import type { CSSSelector, ClassName } from "../../utils/selector-types";
import * as domNew from "../../api/dom-new";
import * as events from "../../api/events";
import * as stateSync from "../../generator-sync/state";

// Type definitions for the DOM functions
type StyleValue = string | number | null;
type StyleObject = Record<string, StyleValue>;
type AttributeObject = Record<string, string>;
type DataObject = Record<string, any>;

/**
 * Enhanced TypedGeneratorContext with all DOM manipulation, event, and state functions attached.
 *
 * This interface extends the base generator context with methods for every DOM operation,
 * event handler, and state management function available in the library. All methods return
 * Workflow generators that can be yielded with `yield*` for clean, sequential async operations.
 *
 * The enhanced context provides:
 * - Full type safety with element types inferred from selectors
 * - Discoverable API with TypeScript intellisense
 * - Consistent yield* pattern for all operations
 * - Automatic cleanup when elements are removed
 *
 * @template El - The type of HTMLElement being watched (auto-inferred from selector)
 *
 * @example Basic usage with yield* pattern
 * ```typescript
 * watchEnhanced('.card', function* (ctx) {
 *   // All operations use yield* for consistency
 *   yield* ctx.addClass('initialized');
 *   yield* ctx.text('Loading...');
 *
 *   // Get values by yielding workflows
 *   const currentText = yield* ctx.text();
 *   const hasActive = yield* ctx.hasClass('active');
 * });
 * ```
 *
 * @example Complex component with full lifecycle
 * ```typescript
 * watchEnhanced('.interactive-widget', function* (ctx) {
 *   // Initialization
 *   yield* ctx.onMount(function* () {
 *     yield* ctx.addClass('mounted');
 *     const id = yield* ctx.attr('id');
 *     console.log('Widget mounted:', id);
 *   });
 *
 *   // State management
 *   yield* ctx.setState('clicks', 0);
 *
 *   // Event handling with generators
 *   yield* ctx.click(function* () {
 *     const clicks = yield* ctx.getState('clicks', 0);
 *     yield* ctx.setState('clicks', clicks + 1);
 *     yield* ctx.text(`Clicked ${clicks + 1} times`);
 *   });
 *
 *   // Observer events
 *   yield* ctx.onVisible(function* (isVisible) {
 *     if (isVisible) {
 *       yield* ctx.addClass('in-viewport');
 *     } else {
 *       yield* ctx.removeClass('in-viewport');
 *     }
 *   });
 *
 *   // Cleanup
 *   yield* ctx.onUnmount(function* () {
 *     console.log('Widget unmounted');
 *   });
 * });
 * ```
 */
export interface EnhancedTypedGeneratorContext<
  El extends HTMLElement = HTMLElement,
> extends TypedGeneratorContext<El> {
  // ============================================================================
  // Text and HTML Content
  // ============================================================================

  /**
   * Sets or gets the text content of the current element.
   *
   * When setting, accepts strings or numbers (numbers are converted to strings).
   * When getting (no arguments), returns the current text content.
   *
   * @param content - Text content to set (optional)
   * @returns Workflow<void> when setting, Workflow<string> when getting
   *
   * @example Setting and getting text with yield*
   * ```typescript
   * watchEnhanced('.message', function* (ctx) {
   *   // Set text content
   *   yield* ctx.text('Hello, World!');
   *   yield* ctx.text(42); // Numbers are converted to strings
   *
   *   // Get current text
   *   const current = yield* ctx.text();
   *   console.log('Current text:', current);
   * });
   * ```
   */
  text(content?: string | number): Workflow<void> | Workflow<string>;

  /**
   * Sets or gets the HTML content of the current element.
   *
   * ⚠️ Warning: Setting HTML can expose your application to XSS attacks.
   * Always sanitize user input before using this method.
   *
   * @param content - HTML content to set (optional)
   * @returns Workflow<void> when setting, Workflow<string> when getting
   *
   * @example Setting and getting HTML with yield*
   * ```typescript
   * watchEnhanced('.content', function* (ctx) {
   *   // Set HTML content (be careful with user input!)
   *   yield* ctx.html('<strong>Bold text</strong>');
   *
   *   // Get current HTML
   *   const currentHTML = yield* ctx.html();
   *   console.log('Current HTML:', currentHTML);
   *
   *   // Safe pattern with text content
   *   const userInput = 'User text';
   *   yield* ctx.html(`<span>${escapeHtml(userInput)}</span>`);
   * });
   * ```
   */
  html(content?: string): Workflow<void> | Workflow<string>;

  // ============================================================================
  // Class Manipulation
  // ============================================================================

  /**
   * Adds one or more CSS classes to the current element.
   *
   * Supports space-separated class names and automatically handles duplicates.
   * Classes are only added if they don't already exist on the element.
   *
   * @param className - Single class or space-separated classes to add
   * @returns Workflow that adds the classes
   *
   * @example Adding classes with yield*
   * ```typescript
   * watchEnhanced('.button', function* (ctx) {
   *   // Add single class
   *   yield* ctx.addClass('primary');
   *
   *   // Add multiple classes
   *   yield* ctx.addClass('large rounded shadow');
   *
   *   // Conditional classes
   *   const isActive = yield* ctx.getState('active', false);
   *   if (isActive) {
   *     yield* ctx.addClass('active highlighted');
   *   }
   * });
   * ```
   */
  addClass(className: string | ClassName): Workflow<void>;

  /**
   * Remove one or more classes from the current element
   * @param className - Class name(s) to remove (space-separated)
   * @returns Workflow that removes the classes
   */
  removeClass(className: string | ClassName): Workflow<void>;

  /**
   * Toggle one or more classes on the current element
   * @param className - Class name(s) to toggle (space-separated)
   * @param force - Force add (true) or remove (false)
   * @returns Workflow that toggles the classes
   */
  toggleClass(className: string | ClassName, force?: boolean): Workflow<void>;

  /**
   * Check if the current element has all specified classes
   * @param className - Class name(s) to check (space-separated)
   * @returns Workflow that returns true if all classes are present
   */
  hasClass(className: string | ClassName): Workflow<boolean>;

  // ============================================================================
  // Style Manipulation
  // ============================================================================

  /**
   * Set or get style properties on the current element
   * @param prop - Style property name or object of properties
   * @param value - Style value (if prop is a string)
   * @returns Workflow that sets styles or returns a style value
   */
  style(prop: string, value: StyleValue): Workflow<void>;
  style(styles: StyleObject): Workflow<void>;
  style(prop: string): Workflow<string>;
  style(prop: string, value?: StyleValue): Workflow<void> | Workflow<string>;

  // ============================================================================
  // Attribute Manipulation
  // ============================================================================

  /**
   * Set or get attributes on the current element
   * @param name - Attribute name or object of attributes
   * @param value - Attribute value (if name is a string)
   * @returns Workflow that sets attributes or returns an attribute value
   */
  attr(name: string, value: string): Workflow<void>;
  attr(attrs: AttributeObject): Workflow<void>;
  attr(name: string): Workflow<string | null>;

  /**
   * Remove an attribute from the current element
   * @param name - Attribute name to remove
   * @returns Workflow that removes the attribute
   */
  removeAttr(name: string): Workflow<void>;

  /**
   * Check if the current element has an attribute
   * @param name - Attribute name to check
   * @returns Workflow that returns true if attribute exists
   */
  hasAttr(name: string): Workflow<boolean>;

  // ============================================================================
  // Property Manipulation
  // ============================================================================

  /**
   * Set or get properties on the current element
   * @param name - Property name
   * @param value - Property value (optional)
   * @returns Workflow that sets property or returns current value
   */
  prop<T = any>(name: string, value?: T): Workflow<void> | Workflow<T>;

  // ============================================================================
  // Data Attributes
  // ============================================================================

  /**
   * Set or get data attributes on the current element
   * @param key - Data key or object of key-value pairs
   * @param value - Data value (if key is a string)
   * @returns Workflow that sets data or returns data value
   */
  data(key: string, value: any): Workflow<void>;
  data(data: DataObject): Workflow<void>;
  data(key: string): Workflow<any>;
  data(): Workflow<DOMStringMap>;

  // ============================================================================
  // Form Element Helpers
  // ============================================================================

  /**
   * Set or get the value of a form element
   * @param value - Value to set (optional)
   * @returns Workflow that sets value or returns current value
   */
  value(value?: string | number): Workflow<void> | Workflow<string>;

  /**
   * Set or get the checked state of a checkbox/radio
   * @param checked - Checked state to set (optional)
   * @returns Workflow that sets checked or returns current state
   */
  checked(checked?: boolean): Workflow<void> | Workflow<boolean>;

  // ============================================================================
  // Focus Management
  // ============================================================================

  /**
   * Focus the current element
   * @returns Workflow that focuses the element
   */
  focus(): Workflow<void>;

  /**
   * Blur (unfocus) the current element
   * @returns Workflow that blurs the element
   */
  blur(): Workflow<void>;

  // ============================================================================
  // Visibility
  // ============================================================================

  /**
   * Show the current element (removes display: none)
   * @returns Workflow that shows the element
   */
  show(): Workflow<void>;

  /**
   * Hide the current element (sets display: none)
   * @returns Workflow that hides the element
   */
  hide(): Workflow<void>;

  // ============================================================================
  // DOM Traversal
  // ============================================================================

  /**
   * Query for a child element
   * @param selector - CSS selector
   * @returns Workflow that returns the first matching element
   */
  query<T extends HTMLElement = HTMLElement>(
    selector: string | CSSSelector,
  ): Workflow<T | null>;

  /**
   * Query for all child elements
   * @param selector - CSS selector
   * @returns Workflow that returns all matching elements
   */
  queryAll<T extends HTMLElement = HTMLElement>(
    selector: string | CSSSelector,
  ): Workflow<T[]>;

  /**
   * Get the parent element
   * @param selector - Optional selector to match parent
   * @returns Workflow that returns the parent element
   */
  parent<T extends HTMLElement = HTMLElement>(
    selector?: string | CSSSelector,
  ): Workflow<T | null>;

  /**
   * Get child elements
   * @param selector - Optional selector to filter children
   * @returns Workflow that returns child elements
   */
  children<T extends HTMLElement = HTMLElement>(
    selector?: string | CSSSelector,
  ): Workflow<T[]>;

  /**
   * Get sibling elements
   * @param selector - Optional selector to filter siblings
   * @returns Workflow that returns sibling elements
   */
  siblings<T extends HTMLElement = HTMLElement>(
    selector?: string | CSSSelector,
  ): Workflow<T[]>;

  // ============================================================================
  // Event Handling
  // ============================================================================

  /**
   * Attaches a click event listener to the current element.
   *
   * The handler can be a regular function, async function, or generator function.
   * Generator handlers can yield* other context methods for complex interactions.
   * Supports debouncing and throttling for performance optimization.
   *
   * @param handler - Event handler (can be async or generator)
   * @param options - Event options including debounce/throttle
   * @returns Workflow that attaches the listener and returns cleanup function
   *
   * @example Click handler with generator and yield*
   * ```typescript
   * watchEnhanced('.button', function* (ctx) {
   *   yield* ctx.click(function* (event) {
   *     // Prevent default action
   *     event.preventDefault();
   *
   *     // Update UI with yield*
   *     yield* ctx.addClass('clicked');
   *     yield* ctx.text('Processing...');
   *
   *     // Get and update state
   *     const count = yield* ctx.getState('clicks', 0);
   *     yield* ctx.setState('clicks', count + 1);
   *
   *     // Async operations
   *     try {
   *       const result = await fetch('/api/action');
   *       yield* ctx.text('Success!');
   *     } catch (error) {
   *       yield* ctx.text('Failed');
   *       yield* ctx.addClass('error');
   *     }
   *   });
   * });
   * ```
   *
   * @example Debounced click handler
   * ```typescript
   * watchEnhanced('.save-button', function* (ctx) {
   *   yield* ctx.click(function* () {
   *     yield* ctx.text('Saving...');
   *     // Save logic here
   *   }, { debounce: 500 }); // Prevent rapid clicks
   * });
   * ```
   */
  click(
    handler: (
      event: MouseEvent,
    ) =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
    options?: AddEventListenerOptions & {
      debounce?: number;
      throttle?: number;
    },
  ): Workflow<CleanupFunction>;

  /**
   * Attach an input event listener
   * @param handler - Event handler function
   * @param options - Event listener options
   * @returns Workflow that attaches the listener
   */
  input(
    handler: (
      event: Event,
    ) =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
    options?: AddEventListenerOptions & {
      debounce?: number;
      throttle?: number;
    },
  ): Workflow<CleanupFunction>;

  /**
   * Attach a change event listener
   * @param handler - Event handler function
   * @param options - Event listener options
   * @returns Workflow that attaches the listener
   */
  change(
    handler: (
      event: Event,
    ) =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
    options?: AddEventListenerOptions & {
      debounce?: number;
      throttle?: number;
    },
  ): Workflow<CleanupFunction>;

  /**
   * Attach a submit event listener
   * @param handler - Event handler function
   * @param options - Event listener options
   * @returns Workflow that attaches the listener
   */
  submit(
    handler: (
      event: Event,
    ) =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
    options?: AddEventListenerOptions & {
      debounce?: number;
      throttle?: number;
    },
  ): Workflow<CleanupFunction>;

  /**
   * Attach a generic event listener
   * @param event - Event name
   * @param handler - Event handler function
   * @param options - Event listener options
   * @returns Workflow that attaches the listener
   */
  on(
    event: string,
    handler: (
      event: Event,
    ) =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
    options?: AddEventListenerOptions & {
      debounce?: number;
      throttle?: number;
    },
  ): Workflow<CleanupFunction>;

  // ============================================================================
  // Lifecycle Events
  // ============================================================================

  /**
   * Registers a handler to run when the element is mounted (added to DOM).
   *
   * The mount handler runs once when the element is first connected to the document.
   * Perfect for initialization, setup, and one-time configuration tasks.
   * The handler can be async or a generator for complex initialization sequences.
   *
   * @param handler - Handler to run on mount (can be async or generator)
   * @returns Workflow that registers the handler
   *
   * @example Initialization with yield* on mount
   * ```typescript
   * watchEnhanced('.component', function* (ctx) {
   *   yield* ctx.onMount(function* () {
   *     // Initialize component
   *     yield* ctx.addClass('initializing');
   *
   *     // Load initial data
   *     const config = await fetch('/api/config').then(r => r.json());
   *     yield* ctx.setState('config', config);
   *
   *     // Setup complete
   *     yield* ctx.removeClass('initializing');
   *     yield* ctx.addClass('ready');
   *
   *     console.log('Component mounted and configured');
   *   });
   * });
   * ```
   */
  onMount(
    handler: () =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
  ): Workflow<CleanupFunction>;

  /**
   * Register a handler to run when the element is unmounted
   * @param handler - Handler function
   * @returns Workflow that registers the handler
   */
  onUnmount(
    handler: () =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
  ): Workflow<CleanupFunction>;

  // ============================================================================
  // Observer Events
  // ============================================================================

  /**
   * Observes changes to a specific attribute on the current element.
   *
   * Uses MutationObserver to detect attribute changes in real-time.
   * The handler receives both the new and old values, allowing you to react
   * to changes and compare values. Automatically cleaned up when element is removed.
   *
   * @param attributeName - Name of the attribute to observe
   * @param handler - Handler called with new and old values (can be generator)
   * @returns Workflow that sets up the observer
   *
   * @example Reacting to attribute changes with yield*
   * ```typescript
   * watchEnhanced('[data-status]', function* (ctx) {
   *   yield* ctx.onAttr('data-status', function* (newValue, oldValue) {
   *     console.log(`Status changed from ${oldValue} to ${newValue}`);
   *
   *     // Update UI based on new status
   *     yield* ctx.removeClass(`status-${oldValue}`);
   *     yield* ctx.addClass(`status-${newValue}`);
   *
   *     // Update text
   *     switch(newValue) {
   *       case 'loading':
   *         yield* ctx.text('Loading...');
   *         yield* ctx.show('.spinner');
   *         break;
   *       case 'success':
   *         yield* ctx.text('Complete!');
   *         yield* ctx.hide('.spinner');
   *         break;
   *       case 'error':
   *         yield* ctx.text('Failed');
   *         yield* ctx.addClass('error');
   *         break;
   *     }
   *   });
   * });
   * ```
   */
  onAttr(
    attributeName: string,
    handler: (
      newValue: string | null,
      oldValue: string | null,
    ) =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
  ): Workflow<CleanupFunction>;

  /**
   * Observe text content changes
   * @param handler - Handler called with new and old text
   * @returns Workflow that sets up the observer
   */
  onText(
    handler: (
      newText: string,
      oldText: string,
    ) =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
  ): Workflow<CleanupFunction>;

  /**
   * Observe visibility changes
   * @param handler - Handler called with visibility state
   * @param options - IntersectionObserver options
   * @returns Workflow that sets up the observer
   */
  onVisible(
    handler: (
      isVisible: boolean,
    ) =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
    options?: {
      threshold?: number | number[];
      rootMargin?: string;
      root?: Element | null;
    },
  ): Workflow<CleanupFunction>;

  /**
   * Observe size changes
   * @param handler - Handler called with ResizeObserverEntry
   * @param options - Options including debounce delay
   * @returns Workflow that sets up the observer
   */
  onResize(
    handler: (
      entry: ResizeObserverEntry,
    ) =>
      | void
      | Promise<void>
      | Generator<any, void, any>
      | AsyncGenerator<any, void, any>,
    options?: { debounce?: number },
  ): Workflow<CleanupFunction>;

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Gets a state value for the current element
   * @param key - The state key to retrieve
   * @param defaultValue - Optional default value if the key doesn't exist
   * @returns A Workflow that returns the state value
   */
  getState<T = any>(key: string, defaultValue?: T): Workflow<T>;

  /**
   * Sets a state value for the current element
   * @param key - The state key to set
   * @param value - The value to set
   * @returns A Workflow that completes when the state is set
   */
  setState<T = any>(key: string, value: T): Workflow<void>;

  /**
   * Updates a state value using a function
   * @param key - The state key to update
   * @param updater - Function that receives the current value and returns the new value
   * @returns A Workflow that completes when the state is updated
   */
  updateState<T = any>(
    key: string,
    updater: (current: T | undefined) => T,
  ): Workflow<void>;

  /**
   * Checks if a state key exists
   * @param key - The state key to check
   * @returns A Workflow that returns true if the key exists
   */
  hasState(key: string): Workflow<boolean>;

  /**
   * Deletes a state value
   * @param key - The state key to delete
   * @returns A Workflow that completes when the state is deleted
   */
  deleteState(key: string): Workflow<void>;

  /**
   * Gets all state keys for the current element
   * @returns A Workflow that returns an array of state keys
   */
  getStateKeys(): Workflow<string[]>;

  /**
   * Clears all state for the current element
   * @returns A Workflow that completes when all state is cleared
   */
  clearState(): Workflow<void>;

  /**
   * Batch operation for multiple elements
   * @param operations - Array of operations to apply
   * @returns A Workflow that completes when all operations are done
   */
  batchAll(operations: Array<(el: El) => void>): Workflow<void>;
}

/**
 * Create an enhanced context with attached DOM manipulation functions
 *
 * This function takes a base TypedGeneratorContext and enhances it with
 * all DOM manipulation functions from dom-new.ts, bound to work with
 * the context's element.
 */
export function createEnhancedContext<El extends HTMLElement = HTMLElement>(
  baseContext: TypedGeneratorContext<El>,
): EnhancedTypedGeneratorContext<El> {
  // Create a proxy context that includes all DOM functions
  const enhancedContext = {
    ...baseContext,

    // Text and HTML
    text: (content?: string | number) => {
      if (content !== undefined) {
        return domNew.text(content);
      }
      return domNew.text();
    },

    html: (content?: string) => {
      if (content !== undefined) {
        return domNew.html(content);
      }
      return domNew.html();
    },

    // Class manipulation
    addClass: (className: string | ClassName) => domNew.addClass(className),
    removeClass: (className: string | ClassName) =>
      domNew.removeClass(className),
    toggleClass: (className: string | ClassName, force?: boolean) => {
      if (force !== undefined) {
        return domNew.toggleClass(className, force);
      }
      return domNew.toggleClass(className);
    },
    hasClass: (className: string | ClassName) => domNew.hasClass(className),

    // Style manipulation
    style: ((prop: string | StyleObject, value?: StyleValue) => {
      if (typeof prop === "string") {
        if (value !== undefined) {
          // Setting a single style property
          return domNew.style(prop, value);
        } else {
          // Getting a style property
          return domNew.style(prop);
        }
      } else {
        // Setting multiple styles with an object
        return domNew.style(prop);
      }
    }) as any,

    // Attribute manipulation
    attr: ((name: string | AttributeObject, value?: string) => {
      if (typeof name === "string") {
        if (value !== undefined) {
          // Setting a single attribute
          return domNew.attr(name, value);
        } else {
          // Getting an attribute
          return domNew.attr(name);
        }
      } else {
        // Setting multiple attributes with an object
        return domNew.attr(name);
      }
    }) as any,

    removeAttr: (name: string) => domNew.removeAttr(name),
    hasAttr: (name: string) => domNew.hasAttr(name),

    // Property manipulation
    prop: <T = any>(name: string, value?: T) => {
      if (value !== undefined) {
        return domNew.prop(name, value);
      }
      return domNew.prop(name);
    },

    // Data attributes
    data: ((key: string | DataObject, value?: any) => {
      if (typeof key === "string") {
        if (value !== undefined) {
          // Setting a single data attribute
          return domNew.data(key, value);
        } else {
          // Getting a data attribute
          return domNew.data(key);
        }
      } else {
        // Setting multiple data attributes with an object
        return domNew.data(key);
      }
    }) as any,

    // Form elements
    value: (value?: string | number) => {
      if (value !== undefined) {
        return domNew.value(String(value));
      }
      return domNew.value();
    },

    checked: (checked?: boolean) => {
      if (checked !== undefined) {
        return domNew.checked(checked);
      }
      return domNew.checked();
    },

    // Focus management
    focus: () => domNew.focus(),
    blur: () => domNew.blur(),

    // Visibility
    show: () => domNew.show(),
    hide: () => domNew.hide(),

    // DOM traversal
    query: <T extends HTMLElement = HTMLElement>(
      selector: string | CSSSelector,
    ) => domNew.query<T>(selector as string),

    queryAll: <T extends HTMLElement = HTMLElement>(
      selector: string | CSSSelector,
    ) => domNew.queryAll<T>(selector as string),

    parent: <T extends HTMLElement = HTMLElement>(
      selector?: string | CSSSelector,
    ) => {
      if (selector !== undefined) {
        // @ts-ignore - overload resolution
        return domNew.parent<T>(selector as string);
      }
      // @ts-ignore - overload resolution
      return domNew.parent<T>();
    },

    children: <T extends HTMLElement = HTMLElement>(
      selector?: string | CSSSelector,
    ) => {
      if (selector !== undefined) {
        // @ts-ignore - overload resolution
        return domNew.children<T>(selector as string);
      }
      // @ts-ignore - overload resolution
      return domNew.children<T>();
    },

    siblings: <T extends HTMLElement = HTMLElement>(
      selector?: string | CSSSelector,
    ) => {
      if (selector !== undefined) {
        // @ts-ignore - overload resolution
        return domNew.siblings<T>(selector as string);
      }
      // @ts-ignore - overload resolution
      return domNew.siblings<T>();
    },

    // Event handling
    click: (handler: any, options?: any) => events.click(handler, options),
    input: (handler: any, options?: any) => events.input(handler, options),
    change: (handler: any, options?: any) => events.change(handler, options),
    submit: (handler: any, options?: any) => events.submit(handler, options),
    on: (event: string, handler: any, options?: any) =>
      events.on(event, handler, options),

    // Lifecycle events
    onMount: (handler: any) => events.onMount(handler),
    onUnmount: (handler: any) => events.onUnmount(handler),

    // Observer events
    onAttr: (attributeName: string, handler: any) =>
      events.onAttr(attributeName, handler),
    onText: (handler: any) => events.onText(handler),
    onVisible: (handler: any, options?: any) =>
      events.onVisible(handler, options),
    onResize: (handler: any, options?: any) => {
      return events.onResize(handler, options);
    },

    // State Management
    getState: <T = any>(key: string, defaultValue?: T) => {
      return stateSync.getState(key, defaultValue);
    },

    setState: <T = any>(key: string, value: T) => {
      return stateSync.setState(key, value);
    },

    updateState: <T = any>(
      key: string,
      updater: (current: T | undefined) => T,
    ) => {
      return stateSync.updateState(key, updater);
    },

    hasState: (key: string) => {
      return stateSync.hasState(key);
    },

    deleteState: (key: string) => {
      return stateSync.deleteState(key);
    },

    getStateKeys: () => {
      return stateSync.getStateKeys();
    },

    clearState: () => {
      return stateSync.clearState();
    },

    // Batch operations
    batchAll: (operations: Array<(el: El) => void>) => {
      return domNew.batchAll([baseContext.element], operations);
    },
  };

  return enhancedContext as unknown as EnhancedTypedGeneratorContext<El>;
}

/**
 * Type guard to check if a context is enhanced
 */
export function isEnhancedContext(
  context: any,
): context is EnhancedTypedGeneratorContext {
  return (
    context &&
    typeof context === "object" &&
    "text" in context &&
    "html" in context &&
    "addClass" in context &&
    typeof context.text === "function" &&
    typeof context.html === "function" &&
    typeof context.addClass === "function"
  );
}
