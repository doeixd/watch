/**
 * @module explicit/generator-support
 *
 * Generator support for the explicit API, enabling yield* patterns.
 * These functions return async generators (Workflow) that can be used with yield*.
 */

import type { ElementFn, WatchContext } from "../types";

/**
 * Workflow type for async generator functions that can be used with yield*.
 * This is what enables the clean yield* syntax without wrappers.
 */
export type Workflow<T = void> = AsyncGenerator<ElementFn<Element>, T, unknown>;

/**
 * Operation type for functions that operate on elements within a generator context.
 */
export type ExplicitOperation<T = void> = (context: WatchContext) => T;

// ============================================================================
// TEXT OPERATIONS - GENERATOR SUPPORT
// ============================================================================

/**
 * Sets text content on the current element using yield* pattern.
 *
 * @param content - The text or number to set as content
 * @returns Async generator that sets text when yielded with yield*
 *
 * @example
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { setTextFlow } from 'watch-selector/explicit/generator-support';
 *
 * watch('.message', async function* () {
 *   yield* setTextFlow('Hello World');
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Dynamic text updates
 * watch('.counter', async function* () {
 *   let count = 0;
 *   yield* setTextFlow(`Count: ${count}`);
 *
 *   yield* clickFlow(async function* () {
 *     count++;
 *     yield* setTextFlow(`Count: ${count}`);
 *   });
 * });
 * ```
 */
export async function* setTextFlow(content: string | number): Workflow<void> {
  yield (element: Element) => {
    element.textContent = String(content);
  };
}

/**
 * Gets text content from the current element using yield* pattern.
 *
 * @returns Async generator that returns text when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.button', async function* () {
 *   const text = yield* getTextFlow();
 *   console.log('Button text:', text);
 * });
 * ```
 */
export async function* getTextFlow(): Workflow<string> {
  const text = yield (element: Element) => {
    return element.textContent || "";
  };
  return text as string;
}

/**
 * Appends text to element's content using yield* pattern.
 *
 * @param content - Text to append
 * @returns Async generator that appends text when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.log', async function* () {
 *   yield* appendTextFlow('\nNew entry');
 * });
 * ```
 */
export async function* appendTextFlow(
  content: string | number,
): Workflow<void> {
  yield (element: Element) => {
    element.textContent = (element.textContent || "") + String(content);
  };
}

/**
 * Prepends text to element's content using yield* pattern.
 *
 * @param content - Text to prepend
 * @returns Async generator that prepends text when yielded with yield*
 */
export async function* prependTextFlow(
  content: string | number,
): Workflow<void> {
  yield (element: Element) => {
    element.textContent = String(content) + (element.textContent || "");
  };
}

// ============================================================================
// CLASS OPERATIONS - GENERATOR SUPPORT
// ============================================================================

/**
 * Adds CSS classes using yield* pattern.
 *
 * @param classes - Classes to add
 * @returns Async generator that adds classes when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.card', async function* () {
 *   yield* addClassFlow('active', 'highlighted');
 * });
 * ```
 */
export async function* addClassFlow(...classes: string[]): Workflow<void> {
  yield (element: Element) => {
    element.classList.add(...classes);
  };
}

/**
 * Removes CSS classes using yield* pattern.
 *
 * @param classes - Classes to remove
 * @returns Async generator that removes classes when yielded with yield*
 */
export async function* removeClassFlow(...classes: string[]): Workflow<void> {
  yield (element: Element) => {
    element.classList.remove(...classes);
  };
}

/**
 * Toggles a CSS class using yield* pattern.
 *
 * @param className - Class to toggle
 * @param force - Optional force add (true) or remove (false)
 * @returns Async generator that returns final state when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.menu', async function* () {
 *   const isOpen = yield* toggleClassFlow('open');
 *   console.log('Menu is now:', isOpen ? 'open' : 'closed');
 * });
 * ```
 */
export async function* toggleClassFlow(
  className: string,
  force?: boolean,
): Workflow<boolean> {
  const result = yield (element: Element) => {
    return element.classList.toggle(className, force);
  };
  return result as boolean;
}

/**
 * Checks if element has a class using yield* pattern.
 *
 * @param className - Class to check for
 * @returns Async generator that returns boolean when yielded with yield*
 */
export async function* hasClassFlow(className: string): Workflow<boolean> {
  const result = yield (element: Element) => {
    return element.classList.contains(className);
  };
  return result as boolean;
}

// ============================================================================
// ATTRIBUTE OPERATIONS - GENERATOR SUPPORT
// ============================================================================

/**
 * Sets an attribute using yield* pattern.
 *
 * @param name - Attribute name
 * @param value - Attribute value
 * @returns Async generator that sets attribute when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.link', async function* () {
 *   yield* setAttrFlow('href', 'https://example.com');
 *   yield* setAttrFlow('target', '_blank');
 * });
 * ```
 */
export async function* setAttrFlow(
  name: string,
  value: string | number | boolean,
): Workflow<void> {
  yield (element: Element) => {
    element.setAttribute(name, String(value));
  };
}

/**
 * Gets an attribute value using yield* pattern.
 *
 * @param name - Attribute name
 * @returns Async generator that returns attribute value when yielded with yield*
 */
export async function* getAttrFlow(name: string): Workflow<string | null> {
  const result = yield (element: Element) => {
    return element.getAttribute(name);
  };
  return result as string | null;
}

/**
 * Removes an attribute using yield* pattern.
 *
 * @param name - Attribute name
 * @returns Async generator that removes attribute when yielded with yield*
 */
export async function* removeAttrFlow(name: string): Workflow<void> {
  yield (element: Element) => {
    element.removeAttribute(name);
  };
}

// ============================================================================
// STYLE OPERATIONS - GENERATOR SUPPORT
// ============================================================================

/**
 * Sets a style property using yield* pattern.
 *
 * @param property - CSS property name
 * @param value - CSS value
 * @returns Async generator that sets style when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.box', async function* () {
 *   yield* setStyleFlow('backgroundColor', 'blue');
 *   yield* setStyleFlow('padding', '20px');
 * });
 * ```
 */
export async function* setStyleFlow(
  property: string,
  value: string,
): Workflow<void> {
  yield (element: Element) => {
    if (element instanceof HTMLElement) {
      (element.style as any)[property] = value;
    }
  };
}

/**
 * Sets multiple styles using yield* pattern.
 *
 * @param styles - Object with style properties
 * @returns Async generator that sets styles when yielded with yield*
 */
export async function* setStylesFlow(
  styles: Partial<CSSStyleDeclaration>,
): Workflow<void> {
  yield (element: Element) => {
    if (element instanceof HTMLElement) {
      Object.assign(element.style, styles);
    }
  };
}

// ============================================================================
// EVENT OPERATIONS - GENERATOR SUPPORT
// ============================================================================

/**
 * Adds a click handler using yield* pattern.
 *
 * @param handler - Click event handler (can be async generator)
 * @returns Async generator that adds handler when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.button', async function* () {
 *   yield* clickFlow(async function* (event) {
 *     yield* addClassFlow('clicked');
 *     yield* setTextFlow('Clicked!');
 *   });
 * });
 * ```
 */
export async function* clickFlow(
  handler: (
    event: MouseEvent,
  ) => void | Promise<void> | AsyncGenerator<any, void, unknown>,
): Workflow<void> {
  yield (element: Element) => {
    element.addEventListener("click", async (event) => {
      const result = handler(event as MouseEvent);
      if (
        result &&
        typeof result === "object" &&
        Symbol.asyncIterator in result
      ) {
        // Handler is an async generator
        for await (const _ of result) {
          // Process generator
        }
      } else if (result instanceof Promise) {
        await result;
      }
    });
  };
}

/**
 * Adds an input handler using yield* pattern.
 *
 * @param handler - Input event handler
 * @returns Async generator that adds handler when yielded with yield*
 */
export async function* inputFlow(
  handler: (event: InputEvent) => void | Promise<void>,
): Workflow<void> {
  yield (element: Element) => {
    element.addEventListener("input", handler as EventListener);
  };
}

// ============================================================================
// DOM QUERY OPERATIONS - GENERATOR SUPPORT
// ============================================================================

/**
 * Queries for a child element using yield* pattern.
 *
 * @param selector - CSS selector
 * @returns Async generator that returns found element when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.container', async function* () {
 *   const button = yield* queryFlow<HTMLButtonElement>('button');
 *   if (button) {
 *     console.log('Found button:', button);
 *   }
 * });
 * ```
 */
export async function* queryFlow<E extends Element = Element>(
  selector: string,
): Workflow<E | null> {
  const result = yield (element: Element) => {
    return element.querySelector<E>(selector);
  };
  return result as E | null;
}

/**
 * Queries for all matching child elements using yield* pattern.
 *
 * @param selector - CSS selector
 * @returns Async generator that returns NodeList when yielded with yield*
 */
export async function* queryAllFlow<E extends Element = Element>(
  selector: string,
): Workflow<NodeListOf<E>> {
  const result = yield (element: Element) => {
    return element.querySelectorAll<E>(selector);
  };
  return result as NodeListOf<E>;
}

// ============================================================================
// FORM OPERATIONS - GENERATOR SUPPORT
// ============================================================================

/**
 * Sets form element value using yield* pattern.
 *
 * @param value - Value to set
 * @returns Async generator that sets value when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('input[type="text"]', async function* () {
 *   yield* setValueFlow('Default text');
 * });
 * ```
 */
export async function* setValueFlow(value: string | number): Workflow<void> {
  yield (element: Element) => {
    if ("value" in element) {
      (element as HTMLInputElement).value = String(value);
    }
  };
}

/**
 * Gets form element value using yield* pattern.
 *
 * @returns Async generator that returns value when yielded with yield*
 */
export async function* getValueFlow(): Workflow<string> {
  const result = yield (element: Element) => {
    if ("value" in element) {
      return (element as HTMLInputElement).value;
    }
    return "";
  };
  return result as string;
}

/**
 * Sets checkbox/radio checked state using yield* pattern.
 *
 * @param checked - Checked state
 * @returns Async generator that sets checked when yielded with yield*
 */
export async function* setCheckedFlow(checked: boolean): Workflow<void> {
  yield (element: Element) => {
    if ("checked" in element) {
      (element as HTMLInputElement).checked = checked;
    }
  };
}

// ============================================================================
// VISIBILITY OPERATIONS - GENERATOR SUPPORT
// ============================================================================

/**
 * Shows element using yield* pattern.
 *
 * @returns Async generator that shows element when yielded with yield*
 */
export async function* showFlow(): Workflow<void> {
  yield (element: Element) => {
    if (element instanceof HTMLElement) {
      element.style.display = "";
    }
  };
}

/**
 * Hides element using yield* pattern.
 *
 * @returns Async generator that hides element when yielded with yield*
 */
export async function* hideFlow(): Workflow<void> {
  yield (element: Element) => {
    if (element instanceof HTMLElement) {
      element.style.display = "none";
    }
  };
}

/**
 * Toggles element visibility using yield* pattern.
 *
 * @param force - Optional force show (true) or hide (false)
 * @returns Async generator that toggles visibility when yielded with yield*
 */
export async function* toggleVisibilityFlow(force?: boolean): Workflow<void> {
  yield (element: Element) => {
    if (element instanceof HTMLElement) {
      if (force !== undefined) {
        element.style.display = force ? "" : "none";
      } else {
        const isHidden = element.style.display === "none";
        element.style.display = isHidden ? "" : "none";
      }
    }
  };
}

// ============================================================================
// UTILITY OPERATIONS - GENERATOR SUPPORT
// ============================================================================

/**
 * Gets the current element using yield* pattern.
 *
 * @returns Async generator that returns current element when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.button', async function* () {
 *   const button = yield* selfFlow<HTMLButtonElement>();
 *   console.log('Button:', button);
 * });
 * ```
 */
export async function* selfFlow<E extends Element = Element>(): Workflow<E> {
  const result = yield (element: Element) => {
    return element as E;
  };
  return result as E;
}

/**
 * Delays execution using yield* pattern.
 *
 * @param ms - Milliseconds to delay
 * @returns Async generator that delays when yielded with yield*
 *
 * @example
 * ```typescript
 * watch('.animated', async function* () {
 *   yield* addClassFlow('fade-in');
 *   yield* delayFlow(300);
 *   yield* removeClassFlow('fade-in');
 * });
 * ```
 */
export async function* delayFlow(ms: number): Workflow<void> {
  yield (element: Element) => {
    // The delay doesn't operate on the element, but still needs to yield a function
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  };
}
