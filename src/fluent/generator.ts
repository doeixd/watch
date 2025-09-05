/**
 * @module fluent/generator
 *
 * Fluent API with generator support for yield* patterns.
 * Provides a chainable interface that returns async generators (Workflows).
 */

import type { ElementFromSelector } from "../types";

/**
 * Workflow type for async generator functions that can be used with yield*.
 */
export type Workflow<T = void> = AsyncGenerator<
  (element: Element) => any,
  T,
  unknown
>;

/**
 * FluentGeneratorSelector provides a chainable API that returns async generators.
 * Each method returns an async generator that can be used with yield* for clean composition.
 *
 * @example
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { gen } from 'watch-selector/fluent/generator';
 *
 * watch('.card', async function* () {
 *   // Chain operations with yield*
 *   yield* gen()
 *     .addClass('active')
 *     .text('Updated')
 *     .style({ backgroundColor: 'blue' })
 *     .flow();
 * });
 * ```
 */
export class FluentGeneratorSelector<El extends Element = Element> {
  private operations: Array<(element: El) => void | any> = [];

  /**
   * Adds a text operation to the chain.
   */
  text(content: string | number): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      element.textContent = String(content);
    });
    return this;
  }

  /**
   * Adds an HTML operation to the chain.
   */
  html(content: string): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        // WARNING: Only use with trusted content. Consider using textContent for user input.
        element.innerHTML = content;
      }
    });
    return this;
  }

  /**
   * Adds a class addition operation to the chain.
   */
  addClass(...classes: string[]): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      element.classList.add(...classes);
    });
    return this;
  }

  /**
   * Adds a class removal operation to the chain.
   */
  removeClass(...classes: string[]): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      element.classList.remove(...classes);
    });
    return this;
  }

  /**
   * Adds a class toggle operation to the chain.
   */
  toggleClass(className: string, force?: boolean): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      return element.classList.toggle(className, force);
    });
    return this;
  }

  /**
   * Adds a style operation to the chain.
   */
  style(styles: Partial<CSSStyleDeclaration>): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        Object.assign(element.style, styles);
      }
    });
    return this;
  }

  /**
   * Adds an attribute operation to the chain.
   */
  attr(
    name: string,
    value: string | number | boolean,
  ): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      element.setAttribute(name, String(value));
    });
    return this;
  }

  /**
   * Adds an attribute removal operation to the chain.
   */
  removeAttr(name: string): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      element.removeAttribute(name);
    });
    return this;
  }

  /**
   * Adds a property operation to the chain.
   */
  prop<K extends keyof El>(name: K, value: El[K]): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      (element as any)[name] = value;
    });
    return this;
  }

  /**
   * Adds a data attribute operation to the chain.
   */
  data(key: string, value: any): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        element.dataset[key] = String(value);
      }
    });
    return this;
  }

  /**
   * Adds a value operation to the chain (for form elements).
   */
  val(value: string | number): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if ("value" in element) {
        (element as any).value = String(value);
      }
    });
    return this;
  }

  /**
   * Adds a checked operation to the chain (for checkboxes/radios).
   */
  checked(state: boolean): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if ("checked" in element) {
        (element as any).checked = state;
      }
    });
    return this;
  }

  /**
   * Adds a show operation to the chain.
   */
  show(): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        element.style.display = "";
      }
    });
    return this;
  }

  /**
   * Adds a hide operation to the chain.
   */
  hide(): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        element.style.display = "none";
      }
    });
    return this;
  }

  /**
   * Adds a focus operation to the chain.
   */
  focus(): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        element.focus();
      }
    });
    return this;
  }

  /**
   * Adds a blur operation to the chain.
   */
  blur(): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        element.blur();
      }
    });
    return this;
  }

  /**
   * Adds a click handler to the chain.
   */
  click(handler: (event: MouseEvent) => void): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      element.addEventListener("click", handler as EventListener);
    });
    return this;
  }

  /**
   * Adds a generic event listener to the chain.
   */
  on(event: string, handler: EventListener): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      element.addEventListener(event, handler);
    });
    return this;
  }

  /**
   * Executes all chained operations as an async generator.
   * This is the method that returns the Workflow for use with yield*.
   *
   * @returns Async generator that executes all operations when yielded with yield*
   *
   * @example
   * ```typescript
   * watch('.button', async function* () {
   *   yield* gen()
   *     .addClass('ready')
   *     .text('Click me!')
   *     .flow();
   * });
   * ```
   */
  async *flow(): Workflow<void> {
    // Yield a function that executes all operations
    yield async (element: Element) => {
      for (const operation of this.operations) {
        await operation(element as El);
      }
    };
  }

  /**
   * Executes operations and returns a value from the element.
   *
   * @param getter - Function to extract a value from the element
   * @returns Async generator that returns the extracted value
   *
   * @example
   * ```typescript
   * watch('.input', async function* () {
   *   const value = yield* gen()
   *     .addClass('active')
   *     .flowReturn(el => (el as HTMLInputElement).value);
   * });
   * ```
   */
  async *flowReturn<T>(getter: (element: El) => T): Workflow<T> {
    let result: T;
    yield (element: Element) => {
      // Execute all operations
      for (const operation of this.operations) {
        operation(element as El);
      }
      // Get the return value
      result = getter(element as El);
      return result;
    };
    return result!;
  }

  /**
   * Conditionally executes the chain based on a predicate.
   *
   * @param condition - Function that returns true to execute the chain
   * @returns FluentGeneratorSelector for continued chaining
   *
   * @example
   * ```typescript
   * watch('.item', async function* () {
   *   yield* gen()
   *     .if(el => !el.classList.contains('processed'))
   *     .addClass('processed')
   *     .text('Done')
   *     .flow();
   * });
   * ```
   */
  if(condition: (element: El) => boolean): FluentGeneratorSelector<El> {
    const previousOps = [...this.operations];

    // Clear operations to collect subsequent ones
    this.operations = [];

    // Store operations that will be added after if()
    const conditionalOps: Array<(element: El) => void | any> = [];

    // Create a proxy to capture operations meant to be conditional
    const proxy = new Proxy(this, {
      get(target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver);

        // For methods that add operations, capture them for conditional execution
        if (
          typeof original === "function" &&
          prop !== "flow" &&
          prop !== "flowReturn" &&
          prop !== "if" &&
          prop !== "find"
        ) {
          return function (...args: any[]) {
            original.apply(target, args);

            // Capture the last added operation for conditional execution
            if (target.operations.length > 0) {
              conditionalOps.push(
                target.operations[target.operations.length - 1],
              );
            }

            return receiver;
          };
        }

        // For flow methods, apply the conditional logic
        if (prop === "flow" || prop === "flowReturn") {
          return function (...args: any[]) {
            // Replace operations with the conditional operation
            target.operations = [
              async (element: El) => {
                // First run previous operations
                for (const op of previousOps) {
                  await op(element);
                }

                // Then conditionally run subsequent operations
                if (condition(element)) {
                  for (const conditionalOp of conditionalOps) {
                    await conditionalOp(element);
                  }
                }
              },
            ];

            // Call the original flow method
            return (original as any).apply(target, args);
          };
        }

        return original;
      },
    });

    return proxy as FluentGeneratorSelector<El>;
  }

  /**
   * Applies operations to child elements matching a selector.
   *
   * @param selector - CSS selector for child elements
   * @returns FluentGeneratorSelector for continued chaining
   *
   * @example
   * ```typescript
   * watch('.container', async function* () {
   *   yield* gen()
   *     .find('.item')
   *     .addClass('found')
   *     .flow();
   * });
   * ```
   */
  find(selector: string): FluentGeneratorSelector<El> {
    const previousOps = [...this.operations];

    // Clear operations and replace with a new one that handles children
    this.operations = [];

    // Store operations that will be added after find()
    const childOps: Array<(element: El) => void | any> = [];

    // Create a proxy to capture operations meant for children
    const proxy = new Proxy(this, {
      get(target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver);

        // For methods that add operations, capture them for children
        if (
          typeof original === "function" &&
          prop !== "flow" &&
          prop !== "flowReturn"
        ) {
          return function (...args: any[]) {
            original.apply(target, args);

            // Capture the last added operation for children
            if (target.operations.length > 0) {
              childOps.push(target.operations[target.operations.length - 1]);
            }

            return receiver;
          };
        }

        // For flow methods, apply the find logic
        if (prop === "flow" || prop === "flowReturn") {
          return function (...args: any[]) {
            // Replace operations with the find operation
            target.operations = [
              async (element: Element) => {
                // First run previous operations on the parent
                for (const op of previousOps) {
                  await op(element as El);
                }

                // Then find children and apply child operations
                const children = element.querySelectorAll(selector);
                children.forEach((child) => {
                  for (const childOp of childOps) {
                    childOp(child as El);
                  }
                });
              },
            ];

            // Call the original flow method
            return (original as any).apply(target, args);
          };
        }

        return original;
      },
    });

    return proxy as FluentGeneratorSelector<El>;
  }

  /**
   * Delays execution for a specified time.
   *
   * @param ms - Milliseconds to delay
   * @returns FluentGeneratorSelector for continued chaining
   *
   * @example
   * ```typescript
   * watch('.animated', async function* () {
   *   yield* gen()
   *     .addClass('fade-in')
   *     .delay(300)
   *     .removeClass('fade-in')
   *     .flow();
   * });
   * ```
   */
  delay(ms: number): FluentGeneratorSelector<El> {
    this.operations.push(() => {
      return new Promise((resolve) => setTimeout(resolve, ms));
    });
    return this;
  }
}

/**
 * Creates a new fluent generator chain.
 *
 * @returns A new FluentGeneratorSelector instance
 *
 * @example
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { gen } from 'watch-selector/fluent/generator';
 *
 * watch('.card', async function* () {
 *   yield* gen()
 *     .addClass('active')
 *     .text('Active Card')
 *     .flow();
 * });
 * ```
 */
export function gen<
  El extends Element = Element,
>(): FluentGeneratorSelector<El> {
  return new FluentGeneratorSelector<El>();
}

/**
 * Creates a fluent generator chain with type inference from selector.
 *
 * @param _selector - CSS selector (used only for type inference)
 * @returns A new FluentGeneratorSelector with inferred element type
 *
 * @example
 * ```typescript
 * watch('button', async function* () {
 *   yield* genFor('button')
 *     .prop('disabled', false)
 *     .text('Enabled')
 *     .flow();
 * });
 * ```
 */
export function genFor<S extends string>(
  _selector: S,
): FluentGeneratorSelector<ElementFromSelector<S>> {
  return new FluentGeneratorSelector<ElementFromSelector<S>>();
}

/**
 * Combines multiple generator workflows into a single workflow.
 *
 * @param workflows - Array of workflows to combine
 * @returns Combined workflow that executes all in sequence
 *
 * @example
 * ```typescript
 * import { setTextFlow, addClassFlow } from 'watch-selector/explicit/generator-support';
 *
 * watch('.status', async function* () {
 *   yield* combine([
 *     setTextFlow('Loading...'),
 *     addClassFlow('loading'),
 *     delayFlow(1000),
 *     setTextFlow('Ready'),
 *     removeClassFlow('loading')
 *   ]);
 * });
 * ```
 */
export async function* combine<T = void>(
  workflows: Array<Workflow<any>>,
): Workflow<T> {
  let lastResult: any;
  for (const workflow of workflows) {
    // Process each workflow
    for await (const operation of workflow) {
      lastResult = yield operation;
    }
  }
  return lastResult;
}

/**
 * Executes a workflow conditionally.
 *
 * @param condition - Condition to check
 * @param workflow - Workflow to execute if condition is true
 * @returns Workflow that conditionally executes
 *
 * @example
 * ```typescript
 * watch('.button', async function* () {
 *   const isActive = yield* hasClassFlow('active');
 *   yield* when(!isActive, addClassFlow('inactive'));
 * });
 * ```
 */
export async function* when<T = void>(
  condition: boolean | (() => boolean),
  workflow: Workflow<T>,
): Workflow<T | undefined> {
  const shouldExecute =
    typeof condition === "function" ? condition() : condition;

  if (shouldExecute) {
    let result: T | undefined;
    for await (const operation of workflow) {
      result = (yield operation) as T;
    }
    return result;
  }

  return undefined;
}

/**
 * Alias for gen() with jQuery-like syntax.
 */
export const $gen = gen;
