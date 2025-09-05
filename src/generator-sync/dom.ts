/**
 * @fileoverview Synchronous DOM operations for the generator submodule
 *
 * This module provides synchronous DOM manipulation operations that return SyncWorkflow<T>
 * directly, enabling the new `yield*` pattern in synchronous generators without forcing async.
 * Each function returns a sync generator that yields operations to be executed
 * by the watch runtime with full type safety and automatic cleanup.
 *
 * @example Basic Usage with Sync Generators
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { addClass, text, self } from 'watch-selector/generator-sync';
 *
 * watch('button', function*() {  // Note: sync function*, not async
 *   // Direct yield* syntax in sync generator - no async needed!
 *   yield* addClass('interactive');
 *   yield* text('Click me!');
 *
 *   // Get the element with perfect typing
 *   const button = yield* self<HTMLButtonElement>();
 *   console.log(button.disabled); // TypeScript knows it's a button!
 * });
 * ```
 *
 * @example When to Use Sync vs Async
 * ```typescript
 * // Use SYNC generators when:
 * // - You don't need await/async operations
 * // - You want better performance
 * // - You're doing simple DOM manipulations
 * import { text, addClass } from 'watch-selector/generator-sync';
 *
 * watch('.simple', function*() {
 *   yield* text('Hello');
 *   yield* addClass('ready');
 * });
 *
 * // Use ASYNC generators when:
 * // - You need to await promises
 * // - You're fetching data
 * // - You're using setTimeout/delays
 * import { text, addClass } from 'watch-selector/generator';
 *
 * watch('.complex', async function*() {
 *   const data = await fetch('/api/data').then(r => r.json());
 *   yield* text(data.message);
 *   yield* addClass('loaded');
 * });
 * ```
 *
 * @module generator-sync/dom
 */

import type { SyncWorkflow, WatchContext, Operation } from "../types";

// ============================================================================
// TEXT CONTENT OPERATIONS
// ============================================================================

/**
 * Sets the text content of an element using the sync generator API.
 *
 * This function returns a SyncWorkflow that can be used directly with `yield*` syntax
 * in synchronous generators, avoiding the overhead of async generators when not needed.
 *
 * @param content - The text content to set
 * @returns A SyncWorkflow<void> that sets the text content when yielded
 *
 * @example Basic sync text setting
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, addClass } from 'watch-selector/generator-sync';
 *
 * watch('button', function* () {  // Sync generator
 *   yield* text('Click me!');
 *   yield* addClass('interactive');
 * });
 * ```
 */
export function text(content: string): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.textContent = content;
    }) as Operation<void>;
  })();
}

/**
 * Gets the text content of an element using the sync generator API.
 *
 * @returns A SyncWorkflow<string> that returns the current text content
 *
 * @example Reading text in sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getText, setText } from 'watch-selector/generator-sync';
 *
 * watch('.mirror', function* () {
 *   const content = yield* getText();
 *   yield* setText(`Mirror: ${content}`);
 * });
 * ```
 */
export function getText(): SyncWorkflow<string> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.textContent || '';
    }) as Operation<string>;
    return result as string;
  })();
}

// ============================================================================
// HTML CONTENT OPERATIONS
// ============================================================================

/**
 * Sets the HTML content of an element using the sync generator API.
 *
 * @param content - The HTML content to set
 * @returns A SyncWorkflow<void> that sets the HTML content
 *
 * @warning Be careful with user-provided content to avoid XSS attacks
 */
export function html(content: string): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.innerHTML = content;
    }) as Operation<void>;
  })();
}

/**
 * Gets the HTML content of an element using the sync generator API.
 *
 * @returns A SyncWorkflow<string> that returns the HTML content
 */
export function getHtml(): SyncWorkflow<string> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.innerHTML;
    }) as Operation<string>;
    return result as string;
  })();
}

// ============================================================================
// CLASS MANIPULATION OPERATIONS
// ============================================================================

/**
 * Adds one or more CSS classes to an element using the sync generator API.
 *
 * @param className - Space-separated list of classes to add
 * @returns A SyncWorkflow<void> that adds the classes
 *
 * @example Adding classes in sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { addClass, removeClass } from 'watch-selector/generator-sync';
 *
 * watch('.card', function* () {
 *   yield* addClass('visible animated');
 *   yield* removeClass('hidden');
 * });
 * ```
 */
export function addClass(className: string): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const classes = className.split(' ').filter(c => c);
      context.element.classList.add(...classes);
    }) as Operation<void>;
  })();
}

/**
 * Removes one or more CSS classes from an element using the sync generator API.
 *
 * @param className - Space-separated list of classes to remove
 * @returns A SyncWorkflow<void> that removes the classes
 */
export function removeClass(className: string): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const classes = className.split(' ').filter(c => c);
      context.element.classList.remove(...classes);
    }) as Operation<void>;
  })();
}

/**
 * Toggles a CSS class on an element using the sync generator API.
 *
 * @param className - The class to toggle
 * @param force - Optional force parameter (true to add, false to remove)
 * @returns A SyncWorkflow<boolean> that returns the new state
 */
export function toggleClass(className: string, force?: boolean): SyncWorkflow<boolean> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.classList.toggle(className, force);
    }) as Operation<boolean>;
    return result as boolean;
  })();
}

/**
 * Checks if an element has a CSS class using the sync generator API.
 *
 * @param className - The class to check for
 * @returns A SyncWorkflow<boolean> that returns true if the class exists
 */
export function hasClass(className: string): SyncWorkflow<boolean> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.classList.contains(className);
    }) as Operation<boolean>;
    return result as boolean;
  })();
}

// ============================================================================
// STYLE OPERATIONS
// ============================================================================

/**
 * Sets inline styles on an element using the sync generator API.
 *
 * @param styles - Object with CSS property names and values
 * @returns A SyncWorkflow<void> that sets the styles
 *
 * @example Setting styles in sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { style } from 'watch-selector/generator-sync';
 *
 * watch('.box', function* () {
 *   yield* style({
 *     backgroundColor: 'blue',
 *     padding: '10px',
 *     borderRadius: '5px'
 *   });
 * });
 * ```
 */
export function style(styles: Partial<CSSStyleDeclaration>): SyncWorkflow<void>;
export function style(property: string, value: string): SyncWorkflow<void>;
export function style(
  propOrStyles: string | Partial<CSSStyleDeclaration>,
  value?: string
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      if (typeof propOrStyles === 'string' && value !== undefined) {
        (context.element.style as any)[propOrStyles] = value;
      } else if (typeof propOrStyles === 'object') {
        Object.assign(context.element.style, propOrStyles);
      }
    }) as Operation<void>;
  })();
}

// ============================================================================
// ATTRIBUTE OPERATIONS
// ============================================================================

/**
 * Sets attributes on an element using the sync generator API.
 *
 * @param attributes - Object with attribute names and values, or single attribute name
 * @param value - Value when setting a single attribute
 * @returns A SyncWorkflow<void> that sets the attributes
 */
export function attr(attributes: Record<string, string>): SyncWorkflow<void>;
export function attr(name: string, value: string): SyncWorkflow<void>;
export function attr(
  nameOrAttrs: string | Record<string, string>,
  value?: string
): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      if (typeof nameOrAttrs === 'string' && value !== undefined) {
        context.element.setAttribute(nameOrAttrs, value);
      } else if (typeof nameOrAttrs === 'object') {
        for (const [key, val] of Object.entries(nameOrAttrs)) {
          context.element.setAttribute(key, val);
        }
      }
    }) as Operation<void>;
  })();
}

/**
 * Gets an attribute value from an element using the sync generator API.
 *
 * @param name - The attribute name
 * @returns A SyncWorkflow<string | null> that returns the attribute value
 */
export function getAttr(name: string): SyncWorkflow<string | null> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.getAttribute(name);
    }) as Operation<string | null>;
    return result as string | null;
  })();
}

/**
 * Removes an attribute from an element using the sync generator API.
 *
 * @param name - The attribute name to remove
 * @returns A SyncWorkflow<void> that removes the attribute
 */
export function removeAttr(name: string): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.removeAttribute(name);
    }) as Operation<void>;
  })();
}

// ============================================================================
// ELEMENT ACCESS OPERATIONS
// ============================================================================

/**
 * Gets the current element being processed in the sync generator.
 *
 * @returns A SyncWorkflow that returns the typed element
 *
 * @example Getting typed element in sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { self } from 'watch-selector/generator-sync';
 *
 * watch('button', function* () {
 *   const button = yield* self<HTMLButtonElement>();
 *   console.log(button.disabled); // TypeScript knows it's a button
 * });
 * ```
 */
export function self<El extends HTMLElement = HTMLElement>(): SyncWorkflow<El> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.element as El;
    }) as Operation<El>;
    return result as El;
  })();
}

/**
 * Queries for a child element using the sync generator API.
 *
 * @param selector - CSS selector to query
 * @returns A SyncWorkflow that returns the element or null
 */
export function query<El extends HTMLElement = HTMLElement>(
  selector: string
): SyncWorkflow<El | null> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.querySelector(selector) as El | null;
    }) as Operation<El | null>;
    return result as El | null;
  })();
}

/**
 * Queries for all child elements using the sync generator API.
 *
 * @param selector - CSS selector to query
 * @returns A SyncWorkflow that returns an array of elements
 */
export function queryAll<El extends HTMLElement = HTMLElement>(
  selector: string
): SyncWorkflow<El[]> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      return Array.from(context.element.querySelectorAll(selector)) as El[];
    }) as Operation<El[]>;
    return result as El[];
  })();
}

// ============================================================================
// VISIBILITY OPERATIONS
// ============================================================================

/**
 * Shows an element by removing display: none using the sync generator API.
 *
 * @returns A SyncWorkflow<void> that shows the element
 */
export function show(): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.style.display = '';
    }) as Operation<void>;
  })();
}

/**
 * Hides an element by setting display: none using the sync generator API.
 *
 * @returns A SyncWorkflow<void> that hides the element
 */
export function hide(): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.style.display = 'none';
    }) as Operation<void>;
  })();
}

/**
 * Toggles element visibility using the sync generator API.
 *
 * @returns A SyncWorkflow<boolean> that returns true if now visible
 */
export function toggle(): SyncWorkflow<boolean> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      const isHidden = context.element.style.display === 'none' ||
                       window.getComputedStyle(context.element).display === 'none';
      context.element.style.display = isHidden ? '' : 'none';
      return !isHidden;
    }) as Operation<boolean>;
    return result as boolean;
  })();
}

// ============================================================================
// FORM OPERATIONS
// ============================================================================

/**
 * Sets the value of a form element using the sync generator API.
 *
 * @param val - The value to set
 * @returns A SyncWorkflow<void> that sets the value
 */
export function value(val: string): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const el = context.element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if ('value' in el) {
        el.value = val;
      }
    }) as Operation<void>;
  })();
}

/**
 * Gets the value of a form element using the sync generator API.
 *
 * @returns A SyncWorkflow<string> that returns the value
 */
export function getValue(): SyncWorkflow<string> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      const el = context.element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      return 'value' in el ? el.value : '';
    }) as Operation<string>;
    return result as string;
  })();
}

/**
 * Sets the checked state of a checkbox or radio button using the sync generator API.
 *
 * @param state - The checked state to set
 * @returns A SyncWorkflow<void> that sets the checked state
 */
export function checked(state: boolean): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      const el = context.element as HTMLInputElement;
      if ('checked' in el) {
        el.checked = state;
      }
    }) as Operation<void>;
  })();
}

/**
 * Gets the checked state of a checkbox or radio button using the sync generator API.
 *
 * @returns A SyncWorkflow<boolean> that returns the checked state
 */
export function isChecked(): SyncWorkflow<boolean> {
  return (function* () {
    const result = yield ((context: WatchContext) => {
      const el = context.element as HTMLInputElement;
      return 'checked' in el ? el.checked : false;
    }) as Operation<boolean>;
    return result as boolean;
  })();
}

// ============================================================================
// FOCUS OPERATIONS
// ============================================================================

/**
 * Focuses an element using the sync generator API.
 *
 * @returns A SyncWorkflow<void> that focuses the element
 */
export function focus(): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.focus();
    }) as Operation<void>;
  })();
}

/**
 * Blurs (removes focus from) an element using the sync generator API.
 *
 * @returns A SyncWorkflow<void> that blurs the element
 */
export function blur(): SyncWorkflow<void> {
  return (function* () {
    yield ((context: WatchContext) => {
      context.element.blur();
    }) as Operation<void>;
  })();
}

// ============================================================================
// CONVENIENCE ALIASES
// ============================================================================

export { text as setText };
export { html as setHtml };
export { value as setValue };
export { checked as setChecked };
export { self as element };
export { self as el };
