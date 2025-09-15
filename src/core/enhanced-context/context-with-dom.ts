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
  WatchContext,
  ParentContext,
  EventHandler,
  EventHandlerResult,
} from "../../types";
import type { CSSSelector, ClassName } from "../../utils/selector-types";
import * as domNew from "../../api/dom-new";
import * as events from "../../api/events-sync";
import * as observerEvents from "../../generator-sync/events";
import * as stateSync from "../../generator-sync/state";
import * as coreState from "../state";
import * as generatorFns from "../generator";

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
 * watch('.card', function* (ctx) {
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
 * watch('.interactive-widget', function* (ctx) {
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
> {
  // ============================================================================
  // Core Generator Functions with Workflow Support
  // ============================================================================

  // Core properties from TypedGeneratorContext
  readonly element: El;
  readonly selector: string;
  readonly index: number;
  readonly array: readonly El[];

  /**
   * Get the current element with yield* support.
   * @returns Workflow<El> - The current element
   *
   * @example
   * ```typescript
   * watch('button', function* (ctx) {
   *   const button = yield* ctx.self();
   *   button.disabled = true;
   * });
   * ```
   */
  self(): Workflow<El>;

  /**
   * Query for a child element with type safety.
   * @param selector - CSS selector to query
   * @returns Workflow<T | null> - The found element or null
   *
   * @example
   * ```typescript
   * watch('.card', function* (ctx) {
   *   const button = yield* ctx.el<HTMLButtonElement>('.action-btn');
   *   if (button) button.click();
   * });
   * ```
   */
  el<T extends HTMLElement = HTMLElement>(selector: string): Workflow<T | null>;

  /**
   * Query for all matching child elements.
   * @param selector - CSS selector to query
   * @returns Workflow<T[]> - Array of matching elements
   *
   * @example
   * ```typescript
   * watch('.container', function* (ctx) {
   *   const items = yield* ctx.all<HTMLLIElement>('.item');
   *   items.forEach(item => item.classList.add('processed'));
   * });
   * ```
   */
  all<T extends HTMLElement = HTMLElement>(selector: string): Workflow<T[]>;

  /**
   * Register a cleanup function.
   * @param fn - Cleanup function to register
   * @returns Workflow<void>
   *
   * @example
   * ```typescript
   * watch('.widget', function* (ctx) {
   *   const interval = setInterval(() => update(), 1000);
   *   yield* ctx.cleanup(() => clearInterval(interval));
   * });
   * ```
   */
  cleanup(fn: CleanupFunction): Workflow<void>;

  /**
   * Get the current watch context.
   * @returns Workflow<WatchContext<El>> - The current context
   *
   * @example
   * ```typescript
   * watch('.item', function* (ctx) {
   *   const context = yield* ctx.ctx();
   *   console.log(`Processing ${context.selector} at index ${context.index}`);
   * });
   * ```
   */
  ctx(): Workflow<WatchContext<El>>;

  /**
   * Get the parent context from nested watch calls.
   * @returns Workflow<ParentContext | undefined> - The parent context or undefined
   *
   * @example
   * ```typescript
   * watch('.parent', function* (parentCtx) {
   *   watch('.child', function* (childCtx) {
   *     const parent = yield* childCtx.getParentContext();
   *     if (parent) {
   *       console.log('Parent element:', parent.element);
   *     }
   *   });
   * });
   * ```
   */
  getParentContext<
    ParentEl extends HTMLElement = HTMLElement,
    ParentApi = any,
  >(): Workflow<ParentContext<ParentEl, ParentApi> | undefined>;

  // ============================================================================
  // Event Functions with Workflow Support
  // ============================================================================

  /**
   * Attach an event listener with yield* support.
   * @param event - Event type
   * @param handler - Event handler (can be generator)
   * @param options - Event options
   * @returns Workflow<CleanupFunction>
   */
  on<K extends keyof HTMLElementEventMap>(
    event: K,
    handler: EventHandler<HTMLElementEventMap[K]>,
    options?: any,
  ): Workflow<CleanupFunction>;

  /**
   * Attach a click handler with yield* support.
   * @param handler - Click handler (can be generator)
   * @param options - Event options
   * @returns Workflow<CleanupFunction>
   */
  click(
    handler: EventHandler<MouseEvent>,
    options?: any,
  ): Workflow<CleanupFunction>;

  /**
   * Attach an input handler with yield* support.
   * @param handler - Input handler (can be generator)
   * @param options - Event options
   * @returns Workflow<CleanupFunction>
   */
  input(
    handler: EventHandler<InputEvent>,
    options?: any,
  ): Workflow<CleanupFunction>;

  /**
   * Attach a change handler with yield* support.
   * @param handler - Change handler (can be generator)
   * @param options - Event options
   * @returns Workflow<CleanupFunction>
   */
  change(
    handler: EventHandler<Event>,
    options?: any,
  ): Workflow<CleanupFunction>;

  /**
   * Attach a submit handler with yield* support.
   * @param handler - Submit handler (can be generator)
   * @param options - Event options
   * @returns Workflow<CleanupFunction>
   */
  submit(
    handler: EventHandler<SubmitEvent>,
    options?: any,
  ): Workflow<CleanupFunction>;

  /**
   * Watch for attribute changes with yield* support.
   * @param handler - Attribute change handler
   * @param options - Observer options
   * @returns Workflow<CleanupFunction>
   */
  onAttr(
    handler: (newValue: string | null, oldValue: string | null) => EventHandlerResult,
    options?: any,
  ): Workflow<CleanupFunction>;

  /**
   * Watch for text content changes with yield* support.
   * @param handler - Text change handler
   * @param options - Observer options
   * @returns Workflow<CleanupFunction>
   */
  onText(
    handler: (newText: string, oldText: string) => EventHandlerResult,
    options?: any,
  ): Workflow<CleanupFunction>;

  /**
   * Watch for visibility changes with yield* support.
   * @param handler - Visibility change handler
   * @param options - Observer options
   * @returns Workflow<CleanupFunction>
   */
  onVisible(
    handler: (isVisible: boolean) => EventHandlerResult,
    options?: any,
  ): Workflow<CleanupFunction>;

  /**
   * Watch for element resize with yield* support.
   * @param handler - Resize handler
   * @param options - Observer options
   * @returns Workflow<CleanupFunction>
   */
  onResize(
    handler: (entry: ResizeObserverEntry) => EventHandlerResult,
    options?: any,
  ): Workflow<CleanupFunction>;

  /**
   * Handle element mount with yield* support.
   * @param handler - Mount handler
   * @returns Workflow<CleanupFunction>
   */
  onMount(handler: () => EventHandlerResult): Workflow<CleanupFunction>;

  /**
   * Handle element unmount with yield* support.
   * @param handler - Unmount handler
   * @returns Workflow<CleanupFunction>
   */
  onUnmount(handler: () => EventHandlerResult): Workflow<CleanupFunction>;

  // ============================================================================
  // DOM Manipulation Functions (Top-level)
  // ============================================================================

  /**
   * Sets or gets the text content of the current element.
   * @param content - Text content to set (optional)
   * @returns Workflow<void> when setting, Workflow<string> when getting
   */
  text(content?: string | number): Workflow<void> | Workflow<string>;

  /**
   * Sets or gets the HTML content of the current element.
   * @param content - HTML content to set (optional)
   * @returns Workflow<void> when setting, Workflow<string> when getting
   */
  html(content?: string): Workflow<void> | Workflow<string>;

  /**
   * Adds one or more CSS classes to the current element.
   * @param className - Class name(s) to add
   * @returns void
   */
  addClass(className: string | ClassName): void;

  /**
   * Remove one or more classes from the current element
   * @param className - Class name(s) to remove
   * @returns void
   */
  removeClass(className: string | ClassName): void;

  /**
   * Toggle one or more classes on the current element
   * @param className - Class name(s) to toggle
   * @param force - Force add (true) or remove (false)
   * @returns void
   */
  toggleClass(className: string | ClassName, force?: boolean): void;

  /**
   * Check if the current element has all specified classes
   * @param className - Class name(s) to check
   * @returns true if all classes are present
   */
  hasClass(className: string | ClassName): boolean;

  /**
   * Set or get style properties on the current element
   * @param prop - Style property name or object of properties
   * @param value - Style value (if prop is a string)
   * @returns void when setting, string when getting
   */
  style(prop: string, value: StyleValue): void;
  style(styles: StyleObject): void;
  style(prop: string): string;

  /**
   * Set or get attributes on the current element
   * @param name - Attribute name or object of attributes
   * @param value - Attribute value (if name is a string)
   * @returns void when setting, string | null when getting
   */
  attr(name: string, value: string): void;
  attr(attrs: AttributeObject): void;
  attr(name: string): string | null;

  /**
   * Remove an attribute from the current element
   * @param name - Attribute name to remove
   * @returns void
   */
  removeAttr(name: string): void;

  /**
   * Check if the current element has an attribute
   * @param name - Attribute name to check
   * @returns true if attribute exists
   */
  hasAttr(name: string): boolean;

  /**
   * Set or get properties on the current element
   * @param name - Property name
   * @param value - Property value (optional)
   * @returns void when setting, T when getting
   */
  prop<T = any>(name: string, value: T): void;
  prop<T = any>(name: string): T;

  /**
   * Set or get data attributes on the current element
   * @param key - Data key or object of data attributes
   * @param value - Data value (if key is a string)
   * @returns void when setting, any when getting
   */
  data(key: string, value: any): void;
  data(data: DataObject): void;
  data(key: string): any;
  data(): DOMStringMap;

  /**
   * Set or get the value of form elements
   * @param value - Value to set (optional)
   * @returns void when setting, string when getting
   */
  value(value: string | number): void;
  value(): string;

  /**
   * Set or get the checked state of checkboxes/radio buttons
   * @param checked - Checked state to set (optional)
   * @returns void when setting, boolean when getting
   */
  checked(checked: boolean): void;
  checked(): boolean;

  /**
   * Focus the current element
   * @returns void
   */
  focus(): void;

  /**
   * Blur the current element
   * @returns void
   */
  blur(): void;

  /**
   * Show the current element
   * @returns void
   */
  show(): void;

  /**
   * Hide the current element
   * @returns void
   */
  hide(): void;

  /**
   * Query for a child element with type safety
   * @param selector - CSS selector to query
   * @returns T | null - The found element or null
   */
  query<T extends HTMLElement = HTMLElement>(selector: string): T | null;

  /**
   * Query for all matching child elements
   * @param selector - CSS selector to query
   * @returns T[] - Array of matching elements
   */
  queryAll<T extends HTMLElement = HTMLElement>(selector: string): T[];

  /**
   * Get the parent element
   * @param selector - Optional selector to match parent against
   * @returns T | null - The parent element or null
   */
  parent<T extends HTMLElement = HTMLElement>(selector?: string): T | null;

  /**
   * Get child elements
   * @param selector - Optional selector to filter children
   * @returns T[] - Array of child elements
   */
  children<T extends HTMLElement = HTMLElement>(selector?: string): T[];

  /**
   * Get sibling elements
   * @param selector - Optional selector to filter siblings
   * @returns T[] - Array of sibling elements
   */
  siblings<T extends HTMLElement = HTMLElement>(selector?: string): T[];

  // ============================================================================
  // State Management Functions (Top-level)
  // ============================================================================

  /**
   * Get state value with optional default
   * @param key - State key
   * @param defaultValue - Default value if key doesn't exist
   * @returns the state value
   */
  getState<T = any>(key: string, defaultValue?: T): T;

  /**
   * Set state value
   * @param key - State key
   * @param value - State value
   * @returns void
   */
  setState<T = any>(key: string, value: T): void;

  /**
   * Update state using a function
   * @param key - State key
   * @param updater - Function to update the state
   * @returns void
   */
  updateState<T = any>(
    key: string,
    updater: (current: T | undefined) => T,
  ): void;

  /**
   * Check if state key exists
   * @param key - State key to check
   * @returns true if key exists
   */
  hasState(key: string): boolean;

  /**
   * Delete a state key
   * @param key - State key to delete
   * @returns void
   */
  deleteState(key: string): void;

  /**
   * Get all state keys
   * @returns array of state keys
   */
  getStateKeys(): string[];

  /**
   * Clear all state
   * @returns void
   */
  clearState(): void;

  /**
   * Execute multiple operations on the current element
   * @param operations - Array of operations to execute
   * @returns void
   */
  batchAll(operations: Array<(el: El) => void>): void;

  // ============================================================================
  // Generator (.gen) Function Properties for Explicit Workflow Control
  // ============================================================================

  /**
   * Explicit generator (.gen) functions that always return Workflows.
   *
   * These provide explicit control over generator patterns and are ideal
   * for situations where the automatic detection might be ambiguous.
   * All .gen functions guarantee Workflow return types for use with yield*.
   *
   * @example Using explicit .gen functions for guaranteed behavior
   * ```typescript
   * watch('.card', function* (ctx) {
   *   // Explicit generator versions - always return Workflows
   *   yield* ctx.gen.click(function* (event) {
   *     yield* ctx.gen.addClass('clicked');
   *     yield* ctx.gen.setState('clicked', true);
   *   });
   *
   *   // Mix with regular context methods
   *   yield* ctx.text('Click me!');
   *   const isClicked = yield* ctx.gen.getState('clicked', false);
   * });
   * ```
   */
  readonly gen: {
    // ========================================================================
    // Event Generator Functions
    // ========================================================================

    /**
     * Explicit generator version of on() that always returns a Workflow.
     *
     * Provides guaranteed generator behavior for event handling with any event type.
     * Use this when you need explicit control over generator patterns or when
     * working with custom events.
     *
     * @param event - Event type (string) or branded DOMEventType
     * @param handler - Event handler function (can be generator)
     * @param options - Event listener options (capture, once, passive, etc.)
     * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
     *
     * @example Custom event handling with explicit generator
     * ```typescript
     * watch('.component', function* (ctx) {
     *   yield* ctx.gen.on('customEvent', function* (event) {
     *     yield* ctx.gen.setState('lastEvent', event.detail);
     *     yield* ctx.gen.addClass('event-received');
     *   });
     * });
     * ```
     *
     * @example Using branded event types for disambiguation
     * ```typescript
     * import { eventType } from 'watch-selector';
     *
     * watch('.button', function* (ctx) {
     *   // Guaranteed generator pattern with branded type
     *   yield* ctx.gen.on(eventType('click'), function* () {
     *     yield* ctx.gen.text('Clicked!');
     *   });
     * });
     * ```
     */
    on<K extends keyof HTMLElementEventMap>(
      event: K,
      handler: any,
      options?: any,
    ): Workflow<CleanupFunction>;

    /**
     * Explicit generator version of click() that always returns a Workflow.
     *
     * Provides guaranteed generator behavior for click event handling.
     * Perfect for complex click interactions that require state management
     * or sequential operations.
     *
     * @param handler - Click event handler function (can be generator)
     * @param options - Event listener options (once, capture, throttle, etc.)
     * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
     *
     * @example Button interaction with state management
     * ```typescript
     * watch('.toggle-button', function* (ctx) {
     *   yield* ctx.gen.click(function* (event) {
     *     const isActive = yield* ctx.gen.getState('active', false);
     *
     *     if (!isActive) {
     *       yield* ctx.gen.setState('active', true);
     *       yield* ctx.gen.addClass('active');
     *       yield* ctx.gen.text('Deactivate');
     *     } else {
     *       yield* ctx.gen.setState('active', false);
     *       yield* ctx.gen.removeClass('active');
     *       yield* ctx.gen.text('Activate');
     *     }
     *   });
     * });
     * ```
     *
     * @example Throttled click handling
     * ```typescript
     * watch('.api-button', function* (ctx) {
     *   yield* ctx.gen.click(function* () {
     *     yield* ctx.gen.addClass('loading');
     *     // API call would go here
     *     yield* ctx.gen.removeClass('loading');
     *   }, { throttle: 1000 });
     * });
     * ```
     */
    click(handler: any, options?: any): Workflow<CleanupFunction>;

    /**
     * Explicit generator version of input() that always returns a Workflow.
     *
     * Provides guaranteed generator behavior for input event handling.
     * Ideal for form validation, real-time updates, and debounced input processing.
     *
     * @param handler - Input event handler function (can be generator)
     * @param options - Event listener options (debounce, throttle, etc.)
     * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
     *
     * @example Real-time search with debouncing
     * ```typescript
     * watch('.search-input', function* (ctx) {
     *   yield* ctx.gen.input(function* (event) {
     *     const query = event.target.value;
     *     yield* ctx.gen.setState('query', query);
     *
     *     if (query.length >= 3) {
     *       yield* ctx.gen.addClass('searching');
     *       // Search API call would go here
     *       yield* ctx.gen.removeClass('searching');
     *     }
     *   }, { debounce: 300 });
     * });
     * ```
     *
     * @example Form validation on input
     * ```typescript
     * watch('input[type="email"]', function* (ctx) {
     *   yield* ctx.gen.input(function* (event) {
     *     const email = event.target.value;
     *     const isValid = /\S+@\S+\.\S+/.test(email);
     *
     *     yield* ctx.gen.setState('emailValid', isValid);
     *     yield* ctx.gen.toggleClass('invalid', !isValid);
     *   });
     * });
     * ```
     */
    input(handler: any, options?: any): Workflow<CleanupFunction>;

    /**
     * Explicit generator version of change() that always returns a Workflow.
     *
     * Provides guaranteed generator behavior for change event handling.
     * Perfect for select dropdowns, checkboxes, and form control state management.
     *
     * @param handler - Change event handler function (can be generator)
     * @param options - Event listener options
     * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
     *
     * @example Select dropdown with dependent fields
     * ```typescript
     * watch('select[name="category"]', function* (ctx) {
     *   yield* ctx.gen.change(function* (event) {
     *     const category = event.target.value;
     *     yield* ctx.gen.setState('selectedCategory', category);
     *
     *     // Show/hide dependent fields
     *     const subcategoryField = yield* ctx.gen.query('.subcategory');
     *     if (subcategoryField) {
     *       yield* ctx.gen.toggleClass(subcategoryField, 'visible', !!category);
     *     }
     *   });
     * });
     * ```
     *
     * @example Checkbox group management
     * ```typescript
     * watch('input[type="checkbox"]', function* (ctx) {
     *   yield* ctx.gen.change(function* (event) {
     *     const isChecked = event.target.checked;
     *     const value = event.target.value;
     *
     *     let selected = yield* ctx.gen.getState<string[]>('selected', []);
     *
     *     if (isChecked) {
     *       selected = [...selected, value];
     *     } else {
     *       selected = selected.filter(v => v !== value);
     *     }
     *
     *     yield* ctx.gen.setState('selected', selected);
     *   });
     * });
     * ```
     */
    change(handler: any, options?: any): Workflow<CleanupFunction>;

    /**
     * Explicit generator version of submit() that always returns a Workflow.
     *
     * Provides guaranteed generator behavior for form submission handling.
     * Perfect for form validation, async submission, and complex form workflows.
     *
     * @param handler - Submit event handler function (can be generator)
     * @param options - Event listener options
     * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
     *
     * @example Form submission with validation and async processing
     * ```typescript
     * watch('form.contact', function* (ctx) {
     *   yield* ctx.gen.submit(function* (event) {
     *     event.preventDefault();
     *
     *     // Show loading state
     *     yield* ctx.gen.addClass('submitting');
     *     yield* ctx.gen.attr('[type="submit"]', 'disabled', 'true');
     *
     *     // Validate form
     *     const isValid = yield* validateForm();
     *
     *     if (isValid) {
     *       try {
     *         // Submit form data
     *         const success = yield* submitFormData();
     *
     *         if (success) {
     *           yield* ctx.gen.addClass('success');
     *           yield* ctx.gen.text('.message', 'Form submitted successfully!');
     *         } else {
     *           yield* ctx.gen.addClass('error');
     *           yield* ctx.gen.text('.message', 'Submission failed.');
     *         }
     *       } catch (error) {
     *         yield* ctx.gen.addClass('error');
     *         yield* ctx.gen.text('.message', `Error: ${error.message}`);
     *       }
     *     }
     *
     *     // Reset loading state
     *     yield* ctx.gen.removeClass('submitting');
     *     yield* ctx.gen.removeAttr('[type="submit"]', 'disabled');
     *   });
     * });
     * ```
     */
    submit(handler: any, options?: any): Workflow<CleanupFunction>;

    /**
     * Explicit generator version of onFocus() that always returns a Workflow.
     *
     * Provides guaranteed generator behavior for focus event handling.
     * Perfect for form field enhancements, accessibility features, and UI feedback.
     *
     * @param handler - Focus event handler function (can be generator)
     * @param options - Event listener options
     * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
     *
     * @example Enhanced form field behavior on focus
     * ```typescript
     * watch('input[type="text"]', function* (ctx) {
     *   yield* ctx.gen.onFocus(function* (event) {
     *     // Visual feedback
     *     yield* ctx.gen.addClass('focused');
     *     const parentField = yield* ctx.gen.parent('.field');
     *     if (parentField) {
     *       yield* ctx.gen.addClass(parentField, 'field-focused');
     *     }
     *
     *     // Show help text
     *     const helpId = yield* ctx.gen.attr('aria-describedby');
     *     if (helpId) {
     *       const helpElement = yield* ctx.gen.query(`#${helpId}`);
     *       if (helpElement) {
     *         yield* ctx.gen.addClass(helpElement, 'visible');
     *       }
     *     }
     *
     *     // Clear previous errors
     *     yield* ctx.gen.removeClass('error');
     *   });
     * });
     * ```
     */
    onFocus(handler: any, options?: any): Workflow<CleanupFunction>;

    /**
     * Explicit generator version of onBlur() that always returns a Workflow.
     *
     * Provides guaranteed generator behavior for blur event handling.
     * Perfect for form validation, auto-save functionality, and cleanup operations.
     *
     * @param handler - Blur event handler function (can be generator)
     * @param options - Event listener options
     * @returns Workflow<CleanupFunction> - Always returns a workflow for yield*
     *
     * @example Input validation and auto-save on blur
     * ```typescript
     * watch('input[required]', function* (ctx) {
     *   yield* ctx.gen.onBlur(function* (event) {
     *     const value = event.target.value.trim();
     *     const fieldName = yield* ctx.gen.attr('name');
     *
     *     // Remove focus styling
     *     yield* ctx.gen.removeClass('focused');
     *
     *     // Validate field
     *     if (!value) {
     *       yield* ctx.gen.addClass('error');
     *       yield* ctx.gen.text('.error-message', `${fieldName} is required`);
     *     } else {
     *       yield* ctx.gen.removeClass('error');
     *       yield* ctx.gen.addClass('valid');
     *
     *       // Auto-save valid data
     *       yield* ctx.gen.setState(fieldName, value);
     *     }
     *   });
     * });
     * ```
     */
    onBlur(handler: any, options?: any): Workflow<CleanupFunction>;

    // ========================================================================
    // Core Generator Functions
    // ========================================================================

    /**
     * Explicit generator version of self() that always returns a Workflow.
     *
     * Returns the current element with guaranteed generator behavior.
     * Use this when you need explicit control over element access in generators.
     *
     * @returns Workflow<El> - Always returns a workflow yielding the current element
     *
     * @example Getting current element with explicit generator
     * ```typescript
     * watch('button', function* (ctx) {
     *   const button = yield* ctx.gen.self();
     *
     *   // Type-safe button manipulation
     *   button.disabled = true;
     *   button.textContent = 'Processing...';
     * });
     * ```
     *
     * @example Using self in conditional logic
     * ```typescript
     * watch('.toggle', function* (ctx) {
     *   const element = yield* ctx.gen.self();
     *
     *   if (element.hasAttribute('data-disabled')) {
     *     yield* ctx.gen.addClass('disabled');
     *   } else {
     *     yield* ctx.gen.addClass('interactive');
     *   }
     * });
     * ```
     */
    self(): Workflow<El>;

    /**
     * Explicit generator version of el() that always returns a Workflow.
     *
     * Queries for a child element with guaranteed generator behavior and type safety.
     * Returns null if no element is found.
     *
     * @template T - The expected element type (defaults to HTMLElement)
     * @param selector - CSS selector to query within the current element
     * @returns Workflow<T | null> - Always returns a workflow yielding the found element or null
     *
     * @example Type-safe element querying with null checks
     * ```typescript
     * watch('.card', function* (ctx) {
     *   const button = yield* ctx.gen.el<HTMLButtonElement>('.action-btn');
     *   const input = yield* ctx.gen.el<HTMLInputElement>('.name-input');
     *
     *   if (button && input) {
     *     // Type-safe manipulation
     *     button.disabled = !input.value;
     *     yield* ctx.gen.setState('hasValue', !!input.value);
     *   }
     * });
     * ```
     *
     * @example Safe navigation with explicit generator
     * ```typescript
     * watch('.container', function* (ctx) {
     *   const optionalElement = yield* ctx.gen.el('.optional-content');
     *
     *   if (optionalElement) {
     *     yield* ctx.gen.addClass(optionalElement, 'found');
     *     yield* ctx.gen.text(optionalElement, 'Content loaded');
     *   } else {
     *     yield* ctx.gen.addClass('no-content');
     *   }
     * });
     * ```
     */
    el<T extends HTMLElement = HTMLElement>(
      selector: string,
    ): Workflow<T | null>;

    /**
     * Explicit generator version of all() that always returns a Workflow.
     *
     * Queries for all matching child elements with guaranteed generator behavior.
     * Returns an empty array if no elements are found.
     *
     * @template T - The expected element type (defaults to HTMLElement)
     * @param selector - CSS selector to query within the current element
     * @returns Workflow<T[]> - Always returns a workflow yielding an array of found elements
     *
     * @example Processing multiple elements with type safety
     * ```typescript
     * watch('.container', function* (ctx) {
     *   const items = yield* ctx.gen.all<HTMLLIElement>('.item');
     *
     *   for (const [index, item] of items.entries()) {
     *     yield* ctx.gen.addClass(item, 'processed');
     *     yield* ctx.gen.attr(item, 'data-index', index.toString());
     *
     *     // Store item state
     *     yield* ctx.gen.setState(`item-${index}`, {
     *       element: item,
     *       processed: true,
     *       index
     *     });
     *   }
     * });
     * ```
     *
     * @example Batch operations with explicit generator
     * ```typescript
     * watch('.form', function* (ctx) {
     *   const inputs = yield* ctx.gen.all<HTMLInputElement>('input[required]');
     *
     *   let allValid = true;
     *   for (const input of inputs) {
     *     if (!input.value.trim()) {
     *       yield* ctx.gen.addClass(input, 'error');
     *       allValid = false;
     *     } else {
     *       yield* ctx.gen.removeClass(input, 'error');
     *     }
     *   }
     *
     *   yield* ctx.gen.setState('formValid', allValid);
     * });
     * ```
     */
    all<T extends HTMLElement = HTMLElement>(selector: string): Workflow<T[]>;

    /**
     * Explicit generator version of cleanup() that always returns a Workflow.
     *
     * Registers a cleanup function with guaranteed generator behavior.
     * The cleanup function will be called when the element is removed from the DOM.
     *
     * @param fn - Cleanup function to register
     * @returns Workflow<void> - Always returns a workflow for registration
     *
     * @example Resource cleanup with explicit generator
     * ```typescript
     * watch('.widget', function* (ctx) {
     *   const timer = setInterval(() => {
     *     // Update widget state
     *     const count = yield* ctx.gen.getState('count', 0);
     *     yield* ctx.gen.setState('count', count + 1);
     *   }, 1000);
     *
     *   yield* ctx.gen.cleanup(() => {
     *     clearInterval(timer);
     *     console.log('Timer cleaned up');
     *   });
     * });
     * ```
     *
     * @example Multiple cleanup handlers
     * ```typescript
     * watch('.component', function* (ctx) {
     *   const observer = new ResizeObserver(() => {});
     *   const subscription = eventBus.subscribe('update', handler);
     *
     *   yield* ctx.gen.cleanup(() => observer.disconnect());
     *   yield* ctx.gen.cleanup(() => subscription.unsubscribe());
     *   yield* ctx.gen.cleanup(() => console.log('Component cleaned up'));
     * });
     * ```
     */
    cleanup(fn: CleanupFunction): Workflow<void>;

    /**
     * Explicit generator version of ctx() that always returns a Workflow.
     *
     * Returns the current watch context with guaranteed generator behavior.
     * Useful for accessing context information, state, and element details.
     *
     * @returns Workflow<WatchContext<El>> - Always returns a workflow yielding the current context
     *
     * @example Accessing context information with explicit generator
     * ```typescript
     * watch('.item', function* (ctx) {
     *   const context = yield* ctx.gen.ctx();
     *
     *   console.log(`Processing ${context.selector} at index ${context.index}`);
     *   console.log(`Total elements: ${context.array.length}`);
     *
     *   // Use context state directly
     *   context.state.set('processed', true);
     *   context.state.set('timestamp', Date.now());
     * });
     * ```
     *
     * @example Type-safe context access
     * ```typescript
     * watch('button', function* (ctx) {
     *   const context = yield* ctx.gen.ctx<HTMLButtonElement>();
     *
     *   // context.element is automatically typed as HTMLButtonElement
     *   context.element.disabled = true;
     *
     *   yield* ctx.gen.setState('buttonState', {
     *     disabled: context.element.disabled,
     *     text: context.element.textContent
     *   });
     * });
     * ```
     */
    ctx(): Workflow<WatchContext<El>>;

    // ========================================================================
    // State Management Generator Functions
    // ========================================================================

    /**
     * Explicit generator version of getState() that always returns a Workflow.
     *
     * Retrieves state value with guaranteed generator behavior and type safety.
     * Returns the default value if the state key doesn't exist.
     *
     * @template T - The expected state value type
     * @param key - State key to retrieve
     * @param defaultValue - Default value if state doesn't exist
     * @returns Workflow<T | undefined> - Always returns a workflow yielding the state value
     *
     * @example Type-safe state retrieval with explicit generator
     * ```typescript
     * interface UserData {
     *   name: string;
     *   email: string;
     *   preferences: { theme: string; notifications: boolean };
     * }
     *
     * watch('.user-card', function* (ctx) {
     *   const userData = yield* ctx.gen.getState<UserData>('user');
     *   const clickCount = yield* ctx.gen.getState<number>('clicks', 0);
     *
     *   if (userData) {
     *     yield* ctx.gen.text('.name', userData.name);
     *     yield* ctx.gen.text('.email', userData.email);
     *   }
     *
     *   yield* ctx.gen.text('.clicks', `Clicked ${clickCount} times`);
     * });
     * ```
     *
     * @example State-driven conditional logic
     * ```typescript
     * watch('.toggle', function* (ctx) {
     *   const isActive = yield* ctx.gen.getState<boolean>('active', false);
     *   const mode = yield* ctx.gen.getState<string>('mode', 'light');
     *
     *   yield* ctx.gen.toggleClass('active', isActive);
     *   yield* ctx.gen.toggleClass('dark-mode', mode === 'dark');
     * });
     * ```
     */
    getState<T = any>(key: string, defaultValue?: T): Workflow<T | undefined>;

    /**
     * Explicit generator version of setState() that always returns a Workflow.
     *
     * Sets state value with guaranteed generator behavior and type safety.
     * Triggers state watchers if the value has changed.
     *
     * @template T - The state value type
     * @param key - State key to set
     * @param value - Value to set
     * @returns Workflow<void> - Always returns a workflow for state setting
     *
     * @example Type-safe state setting with explicit generator
     * ```typescript
     * interface AppState {
     *   user: { id: string; name: string };
     *   settings: { theme: string; language: string };
     *   counters: { clicks: number; views: number };
     * }
     *
     * watch('.app', function* (ctx) {
     *   yield* ctx.gen.setState<AppState['user']>('user', {
     *     id: '123',
     *     name: 'John Doe'
     *   });
     *
     *   yield* ctx.gen.setState<AppState['settings']>('settings', {
     *     theme: 'dark',
     *     language: 'en'
     *   });
     *
     *   yield* ctx.gen.setState<number>('lastUpdate', Date.now());
     * });
     * ```
     *
     * @example State updates with side effects
     * ```typescript
     * watch('.counter', function* (ctx) {
     *   yield* ctx.gen.click(function* () {
     *     const count = yield* ctx.gen.getState<number>('count', 0);
     *     const newCount = count + 1;
     *
     *     yield* ctx.gen.setState('count', newCount);
     *     yield* ctx.gen.setState('lastClicked', new Date().toISOString());
     *
     *     // Update UI based on new state
     *     yield* ctx.gen.text(`Count: ${newCount}`);
     *     yield* ctx.gen.toggleClass('milestone', newCount % 10 === 0);
     *   });
     * });
     * ```
     */
    setState<T = any>(key: string, value: T): Workflow<void>;

    /**
     * Explicit generator version of updateState() that always returns a Workflow.
     *
     * Updates state using a function with guaranteed generator behavior.
     * The updater function receives the current value and returns the new value.
     *
     * @template T - The state value type
     * @param key - State key to update
     * @param updater - Function that receives current value and returns new value
     * @returns Workflow<void> - Always returns a workflow for state updating
     *
     * @example Functional state updates with explicit generator
     * ```typescript
     * watchEnhance

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
   * watch('.message', function* (ctx) {
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
     * watch('.content', function* (ctx) {
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
     * watch('.button', function* (ctx) {
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
     * watch('.button', function* (ctx) {
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
     * watch('.save-button', function* (ctx) {
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
     * watch('.component', function* (ctx) {
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
     * watch('[data-status]', function* (ctx) {
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
  };
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
  // Create a proxy context that includes all DOM functions and generator utilities
  const enhancedContext = {
    ...baseContext,

    // Core generator functions with Workflow support - pass baseContext
    self: () => generatorFns.self<El>(baseContext),
    el: <T extends HTMLElement = HTMLElement>(selector: string) =>
      generatorFns.el<T>(selector, baseContext),
    all: <T extends HTMLElement = HTMLElement>(selector: string) =>
      generatorFns.all<T>(selector, baseContext),
    cleanup: (fn: CleanupFunction) => generatorFns.cleanup(fn, baseContext),
    ctx: () => generatorFns.ctx<El>(baseContext),
    getParentContext: <
      ParentEl extends HTMLElement = HTMLElement,
      ParentApi = any,
    >() => generatorFns.getParentContext<ParentEl, ParentApi>(baseContext),

    // Event functions with Workflow support
    on: <K extends keyof HTMLElementEventMap>(
      event: K,
      handler: EventHandler<HTMLElementEventMap[K]>,
      options?: any,
    ) => events.on(event, handler, options),
    click: (handler: EventHandler<MouseEvent>, options?: any) =>
      events.click(handler, options),
    input: (handler: EventHandler<InputEvent>, options?: any) =>
      events.input(handler, options),
    change: (handler: EventHandler<Event>, options?: any) =>
      events.change(handler, options),
    submit: (handler: EventHandler<SubmitEvent>, options?: any) =>
      events.submit(handler, options),

    // Observer event functions
    onAttr: (
      attributeName: string,
      handler: (newValue: string | null, oldValue: string | null) => EventHandlerResult,
    ) => observerEvents.onAttr(attributeName, handler),
    onText: (handler: (newText: string, oldText: string) => EventHandlerResult) =>
      observerEvents.onText(handler),
    onVisible: (handler: (isVisible: boolean) => EventHandlerResult) =>
      observerEvents.onVisible(handler),
    onResize: (handler: (entry: ResizeObserverEntry) => EventHandlerResult) =>
      observerEvents.onResize(handler),
    onMount: (handler: () => EventHandlerResult) =>
      observerEvents.onMount(handler),
    onUnmount: (handler: () => EventHandlerResult) =>
      observerEvents.onUnmount(handler),

    // Explicit .gen functions for guaranteed Workflow behavior
    gen: {
      // Event .gen functions - directly access .gen properties
      on: <K extends keyof HTMLElementEventMap>(
        event: K,
        handler: EventHandler<HTMLElementEventMap[K]>,
        options?: any,
      ) => events.on(event, handler, options),

      click: (handler: EventHandler<MouseEvent>, options?: any) =>
        events.click(handler, options),

      input: (handler: EventHandler<InputEvent>, options?: any) =>
        events.input(handler, options),

      change: (handler: EventHandler<Event>, options?: any) =>
        events.change(handler, options),

      submit: (handler: EventHandler<SubmitEvent>, options?: any) =>
        events.submit(handler, options),

      onFocus: (handler: EventHandler<FocusEvent>, options?: any) =>
        events.onFocus.gen(handler, options),

      onBlur: (handler: EventHandler<FocusEvent>, options?: any) =>
        events.onBlur.gen(handler, options),

      // Core generator .gen functions - directly access .gen properties
      self: () => generatorFns.self.gen<El>(baseContext),

      el: <T extends HTMLElement = HTMLElement>(selector: string) =>
        generatorFns.el.gen<T>(selector, baseContext),

      all: <T extends HTMLElement = HTMLElement>(selector: string) =>
        generatorFns.all.gen<T>(selector, baseContext),

      cleanup: (fn: CleanupFunction) =>
        generatorFns.cleanup.gen(fn, baseContext),

      ctx: () => generatorFns.ctx.gen<El>(baseContext),

      // State .gen functions
      getState: <T = any>(key: string, defaultValue?: T) =>
        stateSync.getState.gen(key, defaultValue),

      setState: <T = any>(key: string, value: T) =>
        stateSync.setState.gen(key, value),

      updateState: <T = any>(
        key: string,
        updater: (current: T | undefined) => T,
      ) => stateSync.updateState.gen(key, updater),

      hasState: (key: string) => stateSync.hasState.gen(key),

      deleteState: (key: string) => stateSync.deleteState.gen(key),

      getStateKeys: () => stateSync.getStateKeys.gen(),

      clearState: () => stateSync.clearState.gen(),
    },

    // Base context properties
    element: baseContext.element,
    selector: baseContext.selector,
    index: baseContext.index,
    array: baseContext.array,

    // Text and HTML
    text: (content?: string | number) => {
      if (content !== undefined) {
        return domNew.text(baseContext.element, content);
      }
      return domNew.text(baseContext.element);
    },

    html: (content?: string) => {
      if (content !== undefined) {
        return domNew.html(baseContext.element, content);
      }
      return domNew.html(baseContext.element);
    },

    // Class manipulation
    addClass: (className: string | ClassName) =>
      domNew.addClass(baseContext.element, className),
    removeClass: (className: string | ClassName) =>
      domNew.removeClass(baseContext.element, className),
    toggleClass: (className: string | ClassName, force?: boolean) => {
      if (force !== undefined) {
        return domNew.toggleClass(baseContext.element, className, force);
      }
      return domNew.toggleClass(baseContext.element, className);
    },
    hasClass: (className: string | ClassName) =>
      domNew.hasClass(baseContext.element, className),

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
        return domNew.parent<T>(selector as string);
      }
      return domNew.parent<T>();
    },

    children: <T extends HTMLElement = HTMLElement>(
      selector?: string | CSSSelector,
    ) => {
      if (selector !== undefined) {
        return domNew.children<T>(selector as string);
      }
      return domNew.children<T>();
    },

    siblings: <T extends HTMLElement = HTMLElement>(
      selector?: string | CSSSelector,
    ) => {
      if (selector !== undefined) {
        return domNew.siblings<T>(selector as string);
      }
      return domNew.siblings<T>();
    },

    // State Management
    getState: <T = any>(key: string, defaultValue?: T) => {
      const value = coreState.getState<T>(key, baseContext);
      return value !== undefined ? value : defaultValue;
    },

    setState: <T = any>(key: string, value: T) => {
      return coreState.setState(key, value, baseContext);
    },

    updateState: <T = any>(
      key: string,
      updater: (current: T | undefined) => T,
    ) => {
      return coreState.updateState(key, updater, baseContext);
    },

    hasState: (key: string) => {
      return coreState.hasState(key, baseContext);
    },

    deleteState: (key: string) => {
      return coreState.deleteState(key, baseContext);
    },

    getStateKeys: () => {
      const state = coreState.getElementStateSnapshot(baseContext.element);
      return Object.keys(state);
    },

    clearState: () => {
      return coreState.clearState(baseContext);
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
