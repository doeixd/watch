// Context management for generator execution

import type {
  WatchContext,
  ElementProxy,
  SelfFunction,
  CleanupFunction,
  GeneratorContext,
  TypedGeneratorContext,
} from "../types";
import { registerUnmount } from "./observer";

// Global context stack for tracking current element during generator execution
const contextStack: GeneratorContext[] = [];

// Global registry to link a child element to its parent watcher's element.
// This is the backbone of the getParentContext() functionality.
export const parentContextRegistry = new WeakMap<HTMLElement, HTMLElement>();

// Global state storage per element for persistent state management
const globalElementStates = new WeakMap<HTMLElement, Map<string, any>>();

// Get the current context - optionally override with passed context
export function getCurrentContext<El extends HTMLElement = HTMLElement>(
  ctx?: TypedGeneratorContext<El>,
): GeneratorContext<El> | null {
  if (ctx) {
    // Convert TypedGeneratorContext to GeneratorContext
    return {
      element: ctx.element,
      selector: ctx.selector,
      index: ctx.index,
      array: ctx.array,
    };
  }
  return (
    (contextStack[contextStack.length - 1] as GeneratorContext<El>) || null
  );
}

// Push a new context onto the stack
export function pushContext<El extends HTMLElement>(
  context: GeneratorContext<El>,
): void {
  contextStack.push(context);
}

// Pop the current context from the stack
export function popContext<
  El extends HTMLElement = HTMLElement,
>(): GeneratorContext<El> | null {
  return (contextStack.pop() as GeneratorContext<El>) || null;
}

// Create element proxy that acts as both the element and a query function
export function createElementProxy<El extends HTMLElement>(
  element: El,
): ElementProxy<El> {
  // Create a proxy that intercepts property access
  const proxy = new Proxy(element, {
    get(target, prop, receiver) {
      // If it's a function call (query), handle it specially
      if (typeof prop === "string" && prop === "apply") {
        return undefined; // This will make it not callable by default
      }

      // Pass through all element properties
      const value = Reflect.get(target, prop, receiver);

      // If it's a function, bind it to the target
      if (typeof value === "function") {
        return value.bind(target);
      }

      return value;
    },
  }) as El;

  // Add query functionality
  const queryFunction = <T extends HTMLElement = HTMLElement>(
    selector: string,
  ): T | null => {
    return element.querySelector(selector) as T | null;
  };

  // Add queryAll functionality
  const queryAllFunction = <T extends HTMLElement = HTMLElement>(
    selector: string,
  ): T[] => {
    return Array.from(element.querySelectorAll(selector)) as T[];
  };

  // Merge the proxy with the query function
  const elementProxy = Object.assign(queryFunction, proxy, {
    all: queryAllFunction,
  }) as ElementProxy<El>;

  return elementProxy;
}

// Create self function that returns the current element
export function createSelfFunction<El extends HTMLElement>(
  element: El,
): SelfFunction<El> {
  return () => element;
}

// Cleanup function registry per element
const cleanupRegistry = new WeakMap<HTMLElement, Set<CleanupFunction>>();

// Create cleanup function for registering element-specific cleanup
export function createCleanupFunction<El extends HTMLElement>(
  element: El,
): (fn: CleanupFunction) => void {
  return (fn: CleanupFunction) => {
    if (!cleanupRegistry.has(element)) {
      cleanupRegistry.set(element, new Set());
    }

    const cleanups = cleanupRegistry.get(element)!;
    cleanups.add(fn);
  };
}

// Execute cleanup functions for an element
export function executeCleanup<El extends HTMLElement>(element: El): void {
  const cleanups = cleanupRegistry.get(element);
  if (cleanups) {
    cleanups.forEach((fn) => {
      try {
        // Set the context temporarily for the cleanup function to work
        const cleanupContext = {
          element,
          selector: "",
          index: 0,
          array: [element] as readonly El[],
        };
        pushContext(cleanupContext);
        fn();
      } catch (e) {
        console.error("Error during cleanup:", e);
      } finally {
        // Clear the context after cleanup
        popContext();
      }
    });
    cleanupRegistry.delete(element);
  }
}

// Get or create the state Map for an element
function getElementStateMap(element: HTMLElement): Map<string, any> {
  if (!globalElementStates.has(element)) {
    globalElementStates.set(element, new Map());
  }
  return globalElementStates.get(element)!;
}

// Create a complete watch context for an element
export function createWatchContext<El extends HTMLElement>(
  element: El,
  selector: string,
  index: number,
  array: readonly El[],
): WatchContext<El> {
  const observers = new Set<
    MutationObserver | IntersectionObserver | ResizeObserver
  >();

  // Use global state management system for persistent state
  const elementStateMap = getElementStateMap(element);

  return {
    element,
    selector,
    index,
    array,
    state: elementStateMap,
    observers,
    el: createElementProxy(element),
    self: createSelfFunction(element),
    cleanup: createCleanupFunction(element),
    addObserver: (
      observer: MutationObserver | IntersectionObserver | ResizeObserver,
    ) => {
      observers.add(observer);
    },
  };
}

// Execute a generator function with proper context and type safety
export async function executeGenerator<
  El extends HTMLElement,
  T = GeneratorContext<El> | any,
>(
  element: El,
  selector: string,
  index: number,
  array: readonly El[],
  generatorFn: (
    ctx?: TypedGeneratorContext<El>,
  ) => Generator<any, T, unknown> | AsyncGenerator<any, T, unknown>,
  signal?: AbortSignal,
): Promise<T | undefined> {
  const generatorContext: GeneratorContext<El> = {
    element,
    selector,
    index,
    array,
  };

  // Push context onto stack
  pushContext(generatorContext);

  // Register unmount handler to clean up when element is removed
  registerUnmount(element, () => {
    // Clean up any state related to this element
    const event = new CustomEvent("cleanup", { detail: { element } });
    element.dispatchEvent(event);
  });

  let returnValue: T | undefined;

  try {
    // Create typed context for the generator - always pass it
    const typedContext: TypedGeneratorContext<El> = {
      self: () => element,
      el: <T extends HTMLElement = HTMLElement>(selector: string): T | null =>
        element.querySelector(selector) as T | null,
      all: <T extends HTMLElement = HTMLElement>(selector: string): T[] =>
        Array.from(element.querySelectorAll(selector)) as T[],
      cleanup: (fn: CleanupFunction): void => {
        const element = generatorContext.element;
        if (!cleanupRegistry.has(element)) {
          cleanupRegistry.set(element, new Set());
        }
        cleanupRegistry.get(element)!.add(fn);
      },
      ctx: () => {
        const watchContext = createWatchContext(
          element,
          selector,
          index,
          array,
        );
        return watchContext as any; // Type assertion needed
      },
      element,
      selector,
      index,
      array,
    };

    // Determine if the generator function expects a context parameter
    let generator:
      | Generator<any, any, unknown>
      | AsyncGenerator<any, any, unknown>;
    if (generatorFn.length === 0) {
      // Generator function expects no parameters - call without context
      generator = (generatorFn as any)();
    } else {
      // Generator function expects context parameter - call with context
      generator = (generatorFn as any)(typedContext);
    }

    // Handle both sync and async generators
    returnValue = await executeGeneratorSequence(generator, element, signal);
  } catch (e) {
    console.error("Error in generator execution:", e);
    // Re-throw the error to preserve promise rejection behavior
    throw e;
  } finally {
    // Pop context from stack
    popContext();
  }

  return returnValue;
}

// Helper function to execute generator sequences with support for yield*, async, and nested patterns
async function executeGeneratorSequence<El extends HTMLElement>(
  generator: Generator<any, any, unknown> | AsyncGenerator<any, any, unknown>,
  element: El,
  signal?: AbortSignal,
): Promise<any> {
  let result = await generator.next();

  while (!result.done) {
    // Check if the operation has been aborted
    if (signal?.aborted) {
      // Properly close the generator
      if (typeof generator.return === "function") {
        await generator.return(undefined);
      }
      const error = new Error("Operation aborted");
      error.name = "AbortError";
      throw error;
    }

    const yielded = result.value;

    try {
      const resultValue = await handleYieldedValue(yielded, element);
      result = await generator.next(resultValue);
    } catch (e) {
      console.error("Error executing yielded value:", e);
      // Re-throw the error to preserve promise rejection behavior
      throw e;
    }
  }

  return result.value;
}

// Handle different types of yielded values
async function handleYieldedValue<El extends HTMLElement>(
  yielded: any,
  element: El,
): Promise<any> {
  // Handle functions - could be element functions or Workflow operations
  if (typeof yielded === "function") {
    // Check if function looks like it expects a WatchContext (from generator submodule)
    // These functions typically have "context" as the first parameter name
    const fnStr = yielded.toString();
    
    // More precise check - look for context as a parameter name, not just anywhere in the function
    const paramMatch = fnStr.match(/^\s*(?:async\s+)?(?:function\s*)?[^(]*\(\s*([^)]*)\)/);
    const firstParam = paramMatch?.[1]?.trim().split(',')[0]?.trim() || '';
    const isWatchContextFn = firstParam.includes('context') || firstParam.includes('ctx');

    // Check if function looks like it expects an element (ElementFn pattern)
    // Look for element-related parameter names or single parameter functions
    const isElementFn =
      !isWatchContextFn &&
      (firstParam.includes("element") ||
        firstParam.includes("el") ||
        firstParam.includes("HTMLElement") ||
        yielded.length === 1); // Most ElementFns expect 1 argument

    // First try WatchContext functions (from generator submodule)
    if (isWatchContextFn) {
      const currentContext = getCurrentContext();
      if (currentContext) {
        const operationContext = createWatchContext(
          element,
          currentContext.selector,
          currentContext.index,
          currentContext.array,
        );
        try {
          const result = yielded(operationContext);
          if (result && typeof result.then === "function") {
            return await result;
          }
          return result;
        } catch (error) {
          console.error("Failed to execute WatchContext function:", error);
          // Fall through to try as ElementFn
        }
      }
    }

    // Try as ElementFn
    if (isElementFn || !isWatchContextFn) {
      try {
        const result = yielded(element);
        if (result && typeof result.then === "function") {
          return await result;
        }
        return result;
      } catch (error) {
        if (!isElementFn) {
          // If we haven't tried WatchContext yet, try it as fallback
          const currentContext = getCurrentContext();
          if (currentContext) {
            try {
              const operationContext = createWatchContext(
                element,
                currentContext.selector,
                currentContext.index,
                currentContext.array,
              );
              const result = yielded(operationContext);
              if (result && typeof result.then === "function") {
                return await result;
              }
              return result;
            } catch (contextError) {
              // Both approaches failed
              console.error(
                "Failed to execute function as ElementFn or WatchContext:",
                error,
              );
            }
          }
        }
        console.error("Failed to execute ElementFn with element:", error);
        throw error;
      }
    }

    // For other functions, try context-based approach first
    const currentContext = getCurrentContext();
    if (currentContext) {
      try {
        // Create proper WatchContext for the operation
        const operationContext = createWatchContext(
          element,
          currentContext.selector,
          currentContext.index,
          currentContext.array,
        );

        // Call the operation with the context
        const result = yielded(operationContext);

        // Handle async results
        if (result && typeof result.then === "function") {
          return await result;
        }
        return result;
      } catch (error) {
        // If context approach fails, try with element
        try {
          const result = yielded(element);
          if (result && typeof result.then === "function") {
            return await result;
          }
          return result;
        } catch (elementError) {
          // Both approaches failed, throw original error
          throw error;
        }
      }
    }

    // No context available, try direct element call
    try {
      const result = yielded(element);
      if (result && typeof result.then === "function") {
        return await result;
      }
      return result;
    } catch (error) {
      console.error("Failed to execute function with element:", error);
      throw error;
    }
  }

  // Handle promises
  if (yielded && typeof yielded.then === "function") {
    const resolved = await yielded;
    // If the resolved value is a function, execute it
    if (typeof resolved === "function") {
      return await handleYieldedValue(resolved, element);
    }
    return resolved;
  }

  // Handle generator delegation (yield*) for sync generators
  // Check for actual generator (has next method), not just any iterable like arrays
  if (
    yielded &&
    typeof yielded[Symbol.iterator] === "function" &&
    typeof yielded.next === "function"
  ) {
    return await executeGeneratorSequence(yielded, element);
  }

  // Handle async generator delegation (yield*) for async generators
  // Check for actual async generator (has next method), not just any async iterable
  if (
    yielded &&
    typeof yielded[Symbol.asyncIterator] === "function" &&
    typeof yielded.next === "function"
  ) {
    return await executeGeneratorSequence(yielded, element);
  }

  // Handle arrays of functions (batch operations)
  if (Array.isArray(yielded)) {
    // Check if the array contains functions that need to be executed
    // or if it's just a data array (like elements from queryAll)
    const hasExecutableFunctions = yielded.some(
      (item) => typeof item === "function" && !item.nodeType,
    );

    if (hasExecutableFunctions) {
      // Execute each function in the array
      const results = [];
      for (const item of yielded) {
        const result = await handleYieldedValue(item, element);
        results.push(result);
      }
      return results;
    } else {
      // It's a data array (like DOM elements), return as-is
      return yielded;
    }
  }

  // Handle null or undefined as no-op
  if (yielded === null || yielded === undefined) {
    return undefined;
  }

  // Handle primitive types (boolean, number, string) as return values
  // These are typically return values from DOM functions
  if (
    typeof yielded === "boolean" ||
    typeof yielded === "number" ||
    typeof yielded === "string"
  ) {
    return yielded;
  }

  // If we get here, it's an unsupported yield type
  console.warn("Unsupported yield type:", typeof yielded, yielded);
  return undefined;
}

// Global proxy for accessing current element when not in generator context
/**
 * Gets the current element from the active generator context.
 *
 * This function retrieves the element that is currently being processed in a watch
 * generator. It's a lower-level function that's typically used internally, but can
 * be useful for advanced scenarios where you need to access the element context.
 *
 * @template El - The type of HTMLElement expected
 * @returns The current element or null if no context is active
 *
 * @example
 * ```typescript
 * import { watch, getCurrentElement } from 'watch-selector';
 *
 * watch('button', function* () {
 *   const element = getCurrentElement<HTMLButtonElement>();
 *   if (element) {
 *     console.log('Current button:', element.textContent);
 *   }
 * });
 * ```
 */
export function getCurrentElement<
  El extends HTMLElement = HTMLElement,
>(): El | null {
  const context = getCurrentContext<El>();
  return context?.element || null;
}

/**
 * Gets a reference to the current element within a watch generator.
 *
 * This is one of the most important functions in the watch-selector library. It
 * provides access to the element that is currently being processed by a watch
 * generator. The element type is automatically inferred from the CSS selector
 * used in the watch function, providing full type safety.
 *
 * @template El - The type of HTMLElement (automatically inferred)
 * @param ctx - Optional context (usually auto-detected)
 * @returns The current element with proper typing
 * @throws Error if called outside of a generator context
 *
 * @example Basic usage
 * ```typescript
 * import { watch, self, click } from 'watch-selector';
 *
 * watch('button', function* () {
 *   const button = self(); // TypeScript knows this is HTMLButtonElement
 *   console.log('Button text:', button.textContent);
 *
 *   yield click(() => {
 *     button.disabled = true;
 *   });
 * });
 * ```
 *
 * @example Type inference with specific selectors
 * ```typescript
 * import { watch, self } from 'watch-selector';
 *
 * watch('input[type="email"]', function* () {
 *   const input = self(); // HTMLInputElement
 *   input.placeholder = 'Enter your email';
 * });
 *
 * watch('form', function* () {
 *   const form = self(); // HTMLFormElement
 *   form.noValidate = true;
 * });
 * ```
 *
 * @example Using self() in event handlers
 * ```typescript
 * import { watch, self, click, addClass } from 'watch-selector';
 *
 * watch('.toggle-button', function* () {
 *   yield click(function* () {
 *     const button = self();
 *     const isActive = button.classList.contains('active');
 *
 *     if (isActive) {
 *       yield removeClass('active');
 *     } else {
 *       yield addClass('active');
 *     }
 *   });
 * });
 * ```
 */
/**
 * Returns the current element being processed in a watch generator.
 *
 * The self() function provides direct access to the DOM element that triggered
 * the current generator execution. This is the element that matched the selector
 * in watch(). The element is properly typed based on the selector used.
 *
 * @template El - The type of HTMLElement (auto-inferred from selector)
 * @param ctx - Optional context (usually auto-detected)
 * @returns The current element being watched
 * @throws Error if called outside of a generator context
 *
 * @example Direct element access with yield*
 * ```typescript
 * import { watch, self, addClass } from 'watch-selector';
 *
 * watch('button', function* () {
 *   const button = self(); // Typed as HTMLButtonElement
 *
 *   // Direct DOM manipulation
 *   button.disabled = true;
 *   console.log('Button ID:', button.id);
 *
 *   // Or use with library functions
 *   yield* addClass('processing');
 * });
 * ```
 *
 * @example Accessing element properties
 * ```typescript
 * watch('input[type="checkbox"]', function* () {
 *   const checkbox = self() as HTMLInputElement;
 *
 *   yield* click(function* () {
 *     console.log('Checked:', checkbox.checked);
 *     console.log('Value:', checkbox.value);
 *
 *     // Update based on state
 *     if (checkbox.checked) {
 *       yield* addClass('selected');
 *     } else {
 *       yield* removeClass('selected');
 *     }
 *   });
 * });
 * ```
 *
 * @example Storing element reference for later use
 * ```typescript
 * watch('.draggable', function* () {
 *   const element = self();
 *   let isDragging = false;
 *
 *   yield* on('mousedown', function* (e) {
 *     isDragging = true;
 *     const startX = e.clientX - element.offsetLeft;
 *     const startY = e.clientY - element.offsetTop;
 *
 *     const handleMove = (e: MouseEvent) => {
 *       if (!isDragging) return;
 *       element.style.left = `${e.clientX - startX}px`;
 *       element.style.top = `${e.clientY - startY}px`;
 *     };
 *
 *     document.addEventListener('mousemove', handleMove);
 *
 *     yield* cleanup(() => {
 *       document.removeEventListener('mousemove', handleMove);
 *     });
 *   });
 * });
 * ```
 */
export function self<El extends HTMLElement = HTMLElement>(
  ctx?: TypedGeneratorContext<El>,
): El {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error("self() can only be called within a generator context");
  }
  return context.element as El;
}

/**
 * Finds a descendant element within the current element context.
 *
 * This function performs a querySelector on the current element, allowing you to
 * find child elements relative to the element being watched. It's particularly
 * useful for finding specific parts of a component or widget.
 *
 * @template T - The type of HTMLElement expected
 * @param selector - CSS selector to find within the current element
 * @param ctx - Optional context (usually auto-detected)
 * @returns The found element or null if not found
 * @throws Error if called outside of a generator context
 *
 * @example Finding form elements
 * ```typescript
 * import { watch, el, submit } from 'watch-selector';
 *
 * watch('.user-form', function* () {
 *   yield submit(function* (event) {
 *     event.preventDefault();
 *
 *     const emailInput = el<HTMLInputElement>('input[name="email"]');
 *     const passwordInput = el<HTMLInputElement>('input[name="password"]');
 *
 *     if (emailInput && passwordInput) {
 *       console.log('Email:', emailInput.value);
 *       console.log('Password:', passwordInput.value);
 *     }
 *   });
 * });
 * ```
 *
 * @example Component interaction
 * ```typescript
 * import { watch, el, click, addClass } from 'watch-selector';
 *
 * watch('.modal', function* () {
 *   yield click('.close-button', function* () {
 *     const modal = self();
 *     const overlay = el('.overlay');
 *
 *     yield addClass('closing');
 *     if (overlay) {
 *       overlay.style.opacity = '0';
 *     }
 *   });
 * });
 * ```
 *
 * @example Dynamic content access
 * ```typescript
 * import { watch, el, text, onMount } from 'watch-selector';
 *
 * watch('.product-card', function* () {
 *   yield onMount(function* () {
 *     const priceElement = el<HTMLSpanElement>('.price');
 *     const titleElement = el<HTMLHeadingElement>('h3');
 *
 *     if (priceElement && titleElement) {
 *       const price = parseFloat(priceElement.textContent || '0');
 *       if (price > 100) {
 *         yield addClass('expensive');
 *       }
 *     }
 *   });
 * });
 * ```
 */
/**
 * Finds a single descendant element within the current watch context.
 *
 * Searches for the first element matching the selector within the current element's
 * descendants. This is equivalent to calling querySelector on the current element.
 * Use this when you need to find a specific child element within your component.
 *
 * @template T - The type of HTMLElement expected (for type safety)
 * @param selector - CSS selector to find within the current element
 * @param ctx - Optional context (usually auto-detected)
 * @returns The found element or null if not found
 * @throws Error if called outside of a generator context
 *
 * @example Finding child elements in components with yield*
 * ```typescript
 * import { watch, el, click, addClass } from 'watch-selector';
 *
 * watch('.card', function* () {
 *   // Find specific elements within the card
 *   const title = el<HTMLHeadingElement>('.card-title');
 *   const button = el<HTMLButtonElement>('.card-action');
 *   const image = el<HTMLImageElement>('.card-image');
 *
 *   if (button && title) {
 *     yield* click(button, function* () {
 *       console.log('Card clicked:', title.textContent);
 *       yield* addClass('card-selected');
 *     });
 *   }
 *
 *   if (image) {
 *     image.loading = 'lazy';
 *   }
 * });
 * ```
 *
 * @example Form field access
 * ```typescript
 * watch('.user-form', function* () {
 *   yield* submit(function* (event) {
 *     event.preventDefault();
 *
 *     // Get form fields
 *     const emailInput = el<HTMLInputElement>('input[name="email"]');
 *     const passwordInput = el<HTMLInputElement>('input[name="password"]');
 *     const rememberCheckbox = el<HTMLInputElement>('input[type="checkbox"]');
 *
 *     if (emailInput && passwordInput) {
 *       const credentials = {
 *         email: emailInput.value,
 *         password: passwordInput.value,
 *         remember: rememberCheckbox?.checked || false
 *       };
 *
 *       yield* addClass('submitting');
 *       // Submit credentials...
 *     }
 *   });
 * });
 * ```
 *
 * @example Conditional rendering based on child elements
 * ```typescript
 * watch('.notification', function* () {
 *   const closeBtn = el('.close-btn');
 *   const icon = el<HTMLElement>('.icon');
 *   const message = el('.message');
 *
 *   // Make dismissible if close button exists
 *   if (closeBtn) {
 *     yield* click(closeBtn, function* () {
 *       yield* addClass('fade-out');
 *       setTimeout(() => self().remove(), 300);
 *     });
 *   }
 *
 *   // Set icon based on type
 *   const type = yield* getState('type', 'info');
 *   if (icon) {
 *     icon.className = `icon icon-${type}`;
 *   }
 * });
 * ```
 */
export function el<T extends HTMLElement = HTMLElement>(
  selector: string,
  ctx?: TypedGeneratorContext<any>,
): T | null {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error("el() can only be called within a generator context");
  }
  return context.element.querySelector(selector) as T | null;
}

// Context-aware DOM traversal functions
export function parent<T extends HTMLElement = HTMLElement>(
  selector?: string,
  ctx?: TypedGeneratorContext<any>,
): T | null {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error("parent() can only be called within a generator context");
  }
  return selector
    ? (context.element.closest(selector) as T | null)
    : (context.element.parentElement as T | null);
}

export function children<T extends HTMLElement = HTMLElement>(
  selector?: string,
  ctx?: TypedGeneratorContext<any>,
): T[] {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error("children() can only be called within a generator context");
  }
  const children = Array.from(context.element.children) as T[];
  return selector
    ? children.filter((child) => child.matches(selector))
    : children;
}

export function siblings<T extends HTMLElement = HTMLElement>(
  selector?: string,
  ctx?: TypedGeneratorContext<any>,
): T[] {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error("siblings() can only be called within a generator context");
  }
  if (!context.element.parentElement) return [];
  const siblings = Array.from(context.element.parentElement.children).filter(
    (child) => child !== context.element,
  ) as T[];
  return selector
    ? siblings.filter((sibling) => sibling.matches(selector))
    : siblings;
}

// Global el.all function
/**
 * Finds all descendant elements matching a selector within the current watch context.
 *
 * Searches for all elements matching the selector within the current element's
 * descendants. Returns an array (not NodeList) for easier iteration. This is
 * equivalent to calling querySelectorAll on the current element and converting
 * to an array.
 *
 * @template T - The type of HTMLElement expected (for type safety)
 * @param selector - CSS selector to find within the current element
 * @param ctx - Optional context (usually auto-detected)
 * @returns Array of found elements (empty array if none found)
 * @throws Error if called outside of a generator context
 *
 * @example Processing multiple child elements with yield*
 * ```typescript
 * import { watch, all, addClass, click } from 'watch-selector';
 *
 * watch('.gallery', function* () {
 *   // Get all images in the gallery
 *   const images = all<HTMLImageElement>('.gallery-image');
 *
 *   // Add lazy loading to all images
 *   images.forEach(img => {
 *     img.loading = 'lazy';
 *     img.decoding = 'async';
 *   });
 *
 *   // Add click handlers to all images
 *   for (const img of images) {
 *     yield* click(img, function* () {
 *       // Open in lightbox
 *       yield* addClass('lightbox-active');
 *       console.log('Viewing:', img.alt);
 *     });
 *   }
 *
 *   // Update counter
 *   yield* text('.image-count', `${images.length} images`);
 * });
 * ```
 *
 * @example Batch operations on form fields
 * ```typescript
 * watch('form', function* () {
 *   // Get all required fields
 *   const requiredFields = all<HTMLInputElement>('[required]');
 *
 *   // Add validation to each field
 *   for (const field of requiredFields) {
 *     yield* on('blur', field, function* () {
 *       if (!field.value.trim()) {
 *         yield* addClass('error', field);
 *         const label = el(`label[for="${field.id}"]`);
 *         if (label) {
 *           yield* addClass('error-label', label);
 *         }
 *       } else {
 *         yield* removeClass('error', field);
 *       }
 *     });
 *   }
 *
 *   // Clear all errors on reset
 *   yield* on('reset', function* () {
 *     requiredFields.forEach(field => {
 *       removeClass('error', field);
 *     });
 *   });
 * });
 * ```
 *
 * @example List item management
 * ```typescript
 * watch('.todo-list', function* () {
 *   const updateStats = function* () {
 *     const allItems = all('.todo-item');
 *     const completed = allItems.filter(item =>
 *       item.classList.contains('completed')
 *     );
 *
 *     yield* text('.total-count', `${allItems.length}`);
 *     yield* text('.completed-count', `${completed.length}`);
 *     yield* text('.remaining-count', `${allItems.length - completed.length}`);
 *
 *     // Show/hide clear button
 *     if (completed.length > 0) {
 *       yield* show('.clear-completed');
 *     } else {
 *       yield* hide('.clear-completed');
 *     }
 *   };
 *
 *   // Initial stats
 *   yield* updateStats();
 *
 *   // Update on changes
 *   yield* click('.todo-item', updateStats);
 * });
 * ```
 */
export function all<T extends HTMLElement = HTMLElement>(
  selector: string,
  ctx?: TypedGeneratorContext<any>,
): T[] {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error("all() can only be called within a generator context");
  }
  return Array.from(context.element.querySelectorAll(selector)) as T[];
}

// Add cleanup function to global context
/**
 * Registers a cleanup function to be called when the element is removed from the DOM.
 *
 * Cleanup functions are essential for preventing memory leaks. They are automatically
 * called when the watched element is removed from the DOM, either by direct removal
 * or when a parent element is removed. Use cleanup to remove event listeners,
 * cancel timers, close connections, or perform any other necessary teardown.
 *
 * @param fn - Function to call during cleanup (can be async)
 * @param ctx - Optional context (usually auto-detected)
 * @throws Error if called outside of a generator context
 *
 * @example Cleaning up timers and intervals with yield*
 * ```typescript
 * import { watch, cleanup, text } from 'watch-selector';
 *
 * watch('.countdown', function* () {
 *   let seconds = 60;
 *
 *   const interval = setInterval(() => {
 *     seconds--;
 *     yield* text(`Time remaining: ${seconds}s`);
 *
 *     if (seconds <= 0) {
 *       clearInterval(interval);
 *       yield* text('Time\'s up!');
 *     }
 *   }, 1000);
 *
 *   // Clean up interval when element is removed
 *   yield* cleanup(() => {
 *     clearInterval(interval);
 *     console.log('Countdown cleaned up');
 *   });
 * });
 * ```
 *
 * @example Cleaning up external event listeners
 * ```typescript
 * watch('.modal', function* () {
 *   const handleEscape = (e: KeyboardEvent) => {
 *     if (e.key === 'Escape') {
 *       yield* removeClass('open');
 *       yield* hide();
 *     }
 *   };
 *
 *   const handleClickOutside = (e: MouseEvent) => {
 *     if (!self().contains(e.target as Node)) {
 *       yield* removeClass('open');
 *       yield* hide();
 *     }
 *   };
 *
 *   // Add global listeners
 *   document.addEventListener('keydown', handleEscape);
 *   document.addEventListener('click', handleClickOutside);
 *
 *   // Clean up global listeners
 *   yield* cleanup(() => {
 *     document.removeEventListener('keydown', handleEscape);
 *     document.removeEventListener('click', handleClickOutside);
 *   });
 * });
 * ```
 *
 * @example Cleaning up async operations
 * ```typescript
 * watch('.live-data', function* () {
 *   let isActive = true;
 *
 *   const fetchData = async () => {
 *     while (isActive) {
 *       try {
 *         const response = await fetch('/api/live-data');
 *         const data = await response.json();
 *
 *         if (isActive) {
 *           yield* text(data.value);
 *           yield* attr('data-timestamp', data.timestamp);
 *         }
 *
 *         await new Promise(resolve => setTimeout(resolve, 5000));
 *       } catch (error) {
 *         console.error('Failed to fetch live data:', error);
 *         break;
 *       }
 *     }
 *   };
 *
 *   fetchData();
 *
 *   // Stop async operation on cleanup
 *   yield* cleanup(() => {
 *     isActive = false;
 *     console.log('Stopped fetching live data');
 *   });
 * });
 * ```
 *
 * @example WebSocket cleanup
 * ```typescript
 * watch('.chat-widget', function* () {
 *   const ws = new WebSocket('wss://chat.example.com');
 *
 *   ws.onmessage = (event) => {
 *     const message = JSON.parse(event.data);
 *     const messageEl = document.createElement('div');
 *     messageEl.textContent = message.text;
 *     el('.messages')?.appendChild(messageEl);
 *   };
 *
 *   ws.onopen = () => {
 *     yield* addClass('connected');
 *   };
 *
 *   ws.onerror = () => {
 *     yield* addClass('error');
 *     yield* text('.status', 'Connection error');
 *   };
 *
 *   // Clean up WebSocket connection
 *   yield* cleanup(() => {
 *     ws.close();
 *     console.log('WebSocket connection closed');
 *   });
 * });
 * ```
 */
export function cleanup(
  fn: CleanupFunction,
  ctx?: TypedGeneratorContext<any>,
): void {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error("cleanup() can only be called within a generator context");
  }

  // Register cleanup function for this element
  if (!cleanupRegistry.has(context.element)) {
    cleanupRegistry.set(context.element, new Set());
  }

  const cleanups = cleanupRegistry.get(context.element)!;
  cleanups.add(fn);
}

// Get current context as a function (ctx() function) with proper type inference
export function ctx<El extends HTMLElement = HTMLElement>(
  passedCtx?: TypedGeneratorContext<El>,
): WatchContext<El> {
  const context = getCurrentContext(passedCtx);
  if (!context) {
    throw new Error("ctx() can only be called within a generator context");
  }

  const watchContext = createWatchContext(
    context.element as El,
    context.selector,
    context.index,
    context.array as readonly El[],
  );

  return watchContext;
}

// These helpers are used by createChildWatcher to manage the hierarchy.
export function registerParentContext(
  child: HTMLElement,
  parent: HTMLElement,
): void {
  parentContextRegistry.set(child, parent);
}

export function unregisterParentContext(child: HTMLElement): void {
  parentContextRegistry.delete(child);
}

// Clear all contexts (for testing)
export function clearContexts(): void {
  contextStack.length = 0;
}
