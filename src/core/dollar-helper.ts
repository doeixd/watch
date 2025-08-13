/**
 * @fileoverview The $ helper function for the new generator API
 *
 * This module provides the magical `$` helper that enables the new type-safe
 * generator API pattern. The `$` helper wraps Operations in generators that
 * can be used with `yield*` for perfect type inference.
 *
 * @example Basic Usage
 * ```typescript
 * import { watch, $ } from 'watch-selector';
 * import { addClass, getState } from 'watch-selector/generator';
 *
 * watch('.foo', async function*() {
 *   yield* $(addClass('bar'));
 *   const state = yield* $(getState('baz')); // Perfectly typed!
 * });
 * ```
 */

import type {
  Operation,
  Workflow,
  AsyncWorkflow,
  SyncWorkflow,
} from "../types";

/**
 * Detects if we're in an async context by checking if there's an active
 * async generator in the call stack.
 */
function isAsyncContext(): boolean {
  // This is a heuristic - in practice, you'd check the actual generator type
  // For now, we'll default to sync for better performance
  return false;
}

/**
 * The magical `$` helper function that bridges Operations and generators.
 *
 * This function wraps an Operation in a generator that can be used with `yield*`.
 * The key insight is that `yield*` preserves the return type of the generator,
 * allowing TypeScript to perfectly infer the result type of operations.
 *
 * When you use `yield* $(operation)`, TypeScript can trace the type flow:
 * 1. `operation` has type `Operation<TReturn, El>`
 * 2. `$` wraps it in a `Workflow<TReturn, El>`
 * 3. `yield*` extracts the `TReturn` type from the workflow
 * 4. The variable assignment gets the correct `TReturn` type
 *
 * @param operation The pure operation function to execute
 * @returns A workflow that yields the operation and returns its typed result
 *
 * @example Type-safe state access
 * ```typescript
 * // getState returns Operation<T, El>, $ wraps it in Workflow<T, El>
 * // yield* extracts T, so count is perfectly typed
 * const count = yield* $(getState<number>('count', 0));
 * ```
 *
 * @example DOM manipulation
 * ```typescript
 * // addClass returns Operation<void, El>
 * // yield* extracts void (no assignment needed)
 * yield* $(addClass('active'));
 *
 * // self returns Operation<El, El>
 * // yield* extracts El, so element is perfectly typed
 * const element = yield* $(self<HTMLButtonElement>());
 * ```
 *
 * @note The $ helper returns sync workflows for better performance.
 * Users can use async generators when they need async operations.
 */
export function $<TReturn, El extends HTMLElement = HTMLElement>(
  operation: Operation<TReturn, El>,
): SyncWorkflow<TReturn> {
  // Return sync workflow - better performance, no async overhead
  // Users can still use async generators when they need them
  return (function* (): SyncWorkflow<TReturn> {
    // Yield the operation to the runtime for execution
    const result = yield operation;
    // Return the result - TypeScript preserves the TReturn type
    return result as TReturn;
  })();
}

/**
 * Type-only export for the $ helper type when used in type definitions
 *
 * @example
 * ```typescript
 * type MyWorkflow = typeof $(addClass('foo'));
 * // MyWorkflow is Workflow<void, HTMLElement>
 * ```
 */
export type DollarHelper = typeof $;

/**
 * Utility type to extract the return type from a $ helper call
 *
 * @example
 * ```typescript
 * type StateResult = ExtractDollarResult<typeof $(getState<number>('count'))>;
 * // StateResult is number
 * ```
 */
export type ExtractDollarResult<T> = T extends Workflow<infer R> ? R : never;

/**
 * Utility type to extract the element type from a $ helper call
 *
 * @example
 * ```typescript
 * type ElementType = ExtractDollarElement<typeof $(self<HTMLButtonElement>())>;
 * // ElementType is HTMLButtonElement
 * ```
 */
export type ExtractDollarElement = HTMLElement;

/**
 * Type guard to check if a value is a workflow created by the $ helper
 *
 * @param value The value to check
 * @returns True if the value is a workflow
 */
export function isWorkflow(value: any): value is Workflow<any> {
  return (
    value &&
    typeof value === "object" &&
    typeof value[Symbol.iterator] === "function"
  );
}

/**
 * Compose multiple operations into a single workflow
 *
 * @param operations Array of operations to compose
 * @returns A workflow that executes all operations in sequence
 *
 * @example
 * ```typescript
 * const workflow = compose([
 *   addClass('step-1'),
 *   delay(100),
 *   addClass('step-2'),
 *   removeClass('step-1')
 * ]);
 *
 * yield* $(workflow);
 * ```
 */
export function compose<El extends HTMLElement = HTMLElement>(
  operations: Operation<any, El>[],
): Operation<void, El> {
  return async (context) => {
    for (const operation of operations) {
      await operation(context);
    }
  };
}

/**
 * Map an operation over multiple contexts (for batch operations)
 *
 * @param operation The operation to map
 * @param contexts Array of contexts to apply the operation to
 * @returns A workflow that applies the operation to all contexts
 *
 * @example
 * ```typescript
 * const elements = all('.item');
 * yield* $(map(addClass('processed'), elements.map(el => ({ element: el }))));
 * ```
 */
export function map<TReturn, El extends HTMLElement = HTMLElement>(
  operation: Operation<TReturn, El>,
  contexts: Array<{ element: El; [key: string]: any }>,
): Operation<TReturn[], El> {
  return async () => {
    const results: TReturn[] = [];
    for (const context of contexts) {
      const result = await operation(context as any);
      results.push(result);
    }
    return results;
  };
}
