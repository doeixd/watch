/**
 * @fileoverview Async wrapper for yielding async operations in sync generators
 *
 * This module provides a way to wrap async operations so they can be yielded
 * in sync generators. This allows us to keep the default workflow sync for
 * better performance while still supporting async operations when needed.
 *
 * @example Basic usage with fetch
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, addClass } from 'watch-selector/generator';
 * import { async } from 'watch-selector/async';
 *
 * watch('.data-loader', function*() {  // Note: sync generator
 *   yield* text('Loading...');
 *
 *   // Wrap async operation to yield it in sync generator
 *   const data = yield* async(async function*() {
 *     const response = await fetch('/api/data');
 *     return response.json();
 *   });
 *
 *   yield* text(data.message);
 *   yield* addClass('loaded');
 * });
 * ```
 *
 * @example Using with delays
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, addClass } from 'watch-selector/generator';
 * import { async, delay } from 'watch-selector/async';
 *
 * watch('.animated', function*() {
 *   yield* addClass('fade-in');
 *
 *   // Wait for animation
 *   yield* async(delay(300));
 *
 *   yield* text('Animation complete');
 * });
 * ```
 *
 * @module core/async-wrapper
 */

import type { SyncWorkflow, Operation, WatchContext } from "../types";

/**
 * Wraps an async operation or async generator so it can be yielded in a sync generator.
 * This is the bridge between sync and async worlds, allowing async operations
 * to be used within sync generators when needed.
 *
 * @param asyncOperation - An async function, promise, or async generator to wrap
 * @returns A sync workflow that executes the async operation
 *
 * @example Wrapping a promise
 * ```typescript
 * watch('.button', function*() {
 *   // Sync operations
 *   yield* text('Loading...');
 *
 *   // Wrap async operation
 *   const result = yield* async(
 *     fetch('/api/data').then(r => r.json())
 *   );
 *
 *   // Back to sync operations
 *   yield* text(result.message);
 * });
 * ```
 *
 * @example Wrapping an async generator
 * ```typescript
 * watch('.complex', function*() {
 *   yield* async(async function*() {
 *     yield* text('Starting...');
 *     await someAsyncOperation();
 *     yield* text('Done!');
 *   });
 * });
 * ```
 */
export function async<T = void>(
  asyncOperation:
    | Promise<T>
    | (() => Promise<T>)
    | (() => AsyncGenerator<any, T, any>)
    | AsyncGenerator<any, T, any>,
): SyncWorkflow<T> {
  return (function* (): SyncWorkflow<T> {
    // Create an operation that handles the async work
    const operation: Operation<T> = async (context: WatchContext) => {
      // Handle different types of async operations
      if (asyncOperation instanceof Promise) {
        // Direct promise
        return await asyncOperation;
      } else if (typeof asyncOperation === "function") {
        // Async function or async generator function
        const result = asyncOperation();

        if (
          result &&
          typeof (result as any)[Symbol.asyncIterator] === "function"
        ) {
          // It's an async generator, execute it
          const asyncGen = result as AsyncGenerator<any, T, any>;
          let genResult = await asyncGen.next();

          while (!genResult.done) {
            // If the yielded value is an operation, execute it
            if (typeof genResult.value === "function") {
              await genResult.value(context);
            }
            genResult = await asyncGen.next();
          }

          return genResult.value;
        } else {
          // It's a promise-returning function
          return await result;
        }
      } else if (
        asyncOperation &&
        typeof asyncOperation[Symbol.asyncIterator] === "function"
      ) {
        // Direct async generator
        const asyncGen = asyncOperation as AsyncGenerator<any, T, any>;
        let genResult = await asyncGen.next();

        while (!genResult.done) {
          if (typeof genResult.value === "function") {
            await genResult.value(context);
          }
          genResult = await asyncGen.next();
        }

        return genResult.value;
      } else {
        // Unknown type, try to await it
        return await (asyncOperation as any);
      }
    };

    // Yield the operation and return its result
    const result = yield operation;
    return result as T;
  })();
}

/**
 * Creates a delay that can be yielded in a sync generator.
 * This is one of the few operations that truly needs to be async.
 *
 * @param ms - Milliseconds to delay
 * @returns A sync workflow that waits for the specified time
 *
 * @example Adding delays between operations
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, addClass } from 'watch-selector/generator';
 * import { delay } from 'watch-selector/async';
 *
 * watch('.notification', function*() {
 *   yield* text('Hello!');
 *   yield* addClass('visible');
 *
 *   yield* delay(3000);  // Wait 3 seconds
 *
 *   yield* removeClass('visible');
 *   yield* text('');
 * });
 * ```
 */
export function delay(ms: number): SyncWorkflow<void> {
  return async(() => new Promise<void>((resolve) => setTimeout(resolve, ms)));
}

/**
 * Wraps a fetch operation for use in sync generators.
 * This is a convenience wrapper around the async function.
 *
 * @param input - URL or Request object
 * @param init - Request options
 * @returns A sync workflow that returns the Response
 *
 * @example Fetching data in a sync generator
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text } from 'watch-selector/generator';
 * import { fetchData } from 'watch-selector/async';
 *
 * watch('.weather', function*() {
 *   yield* text('Loading weather...');
 *
 *   const response = yield* fetchData('/api/weather');
 *   const data = yield* async(response.json());
 *
 *   yield* text(`Temperature: ${data.temp}°C`);
 * });
 * ```
 */
export function fetchData(
  input: RequestInfo | URL,
  init?: RequestInit,
): SyncWorkflow<Response> {
  return async(() => fetch(input, init));
}

/**
 * Runs multiple async operations in parallel and waits for all to complete.
 * This is useful for fetching multiple resources simultaneously.
 *
 * @param operations - Array of async operations to run in parallel
 * @returns A sync workflow that returns an array of results
 *
 * @example Parallel async operations
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text } from 'watch-selector/generator';
 * import { parallel } from 'watch-selector/async';
 *
 * watch('.dashboard', function*() {
 *   yield* text('Loading dashboard...');
 *
 *   const [user, posts, comments] = yield* parallel([
 *     fetch('/api/user').then(r => r.json()),
 *     fetch('/api/posts').then(r => r.json()),
 *     fetch('/api/comments').then(r => r.json()),
 *   ]);
 *
 *   yield* text(`Welcome ${user.name}!`);
 * });
 * ```
 */
export function parallel<T extends readonly unknown[]>(
  operations: T,
): SyncWorkflow<{ [K in keyof T]: Awaited<T[K]> }> {
  return async(() => Promise.all(operations)) as any;
}

/**
 * Runs multiple async operations in parallel and returns the first to complete.
 *
 * @param operations - Array of async operations to race
 * @returns A sync workflow that returns the first result
 *
 * @example Racing async operations
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text } from 'watch-selector/generator';
 * import { race, delay } from 'watch-selector/async';
 *
 * watch('.search', function*() {
 *   yield* text('Searching...');
 *
 *   const result = yield* race([
 *     fetch('/api/search?q=test').then(r => r.json()),
 *     delay(5000).then(() => ({ error: 'Timeout' })),
 *   ]);
 *
 *   if (result.error) {
 *     yield* text('Search timed out');
 *   } else {
 *     yield* text(`Found ${result.count} results`);
 *   }
 * });
 * ```
 */
export function race<T extends readonly unknown[]>(
  operations: T,
): SyncWorkflow<Awaited<T[number]>> {
  return async(() => Promise.race(operations)) as any;
}

/**
 * Retries an async operation with exponential backoff.
 *
 * @param operation - The async operation to retry
 * @param options - Retry options
 * @returns A sync workflow that returns the result or throws after max retries
 *
 * @example Retrying failed requests
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text } from 'watch-selector/generator';
 * import { retry } from 'watch-selector/async';
 *
 * watch('.api-status', function*() {
 *   yield* text('Checking API...');
 *
 *   try {
 *     const data = yield* retry(
 *       () => fetch('/api/health').then(r => r.json()),
 *       { maxAttempts: 3, delay: 1000 }
 *     );
 *     yield* text('API is healthy');
 *   } catch (error) {
 *     yield* text('API is down');
 *   }
 * });
 * ```
 */
export function retry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
  } = {},
): SyncWorkflow<T> {
  const { maxAttempts = 3, delay: initialDelay = 1000, backoff = 2 } = options;

  return async(async () => {
    let lastError: any;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= backoff;
        }
      }
    }

    throw lastError;
  });
}

/**
 * Debounces an async operation.
 *
 * @param operation - The async operation to debounce
 * @param wait - Milliseconds to wait
 * @returns A sync workflow that returns the debounced result
 */
export function debounce<T>(
  operation: () => Promise<T>,
  wait: number,
): SyncWorkflow<T> {
  let timeout: NodeJS.Timeout | null = null;

  return async(async () => {
    if (timeout) {
      clearTimeout(timeout);
    }

    return new Promise<T>((resolve) => {
      timeout = setTimeout(async () => {
        const result = await operation();
        resolve(result);
      }, wait);
    });
  });
}

/**
 * Type alias for better readability when using async in sync generators
 */
export type AsyncInSync<T> = SyncWorkflow<T>;

/**
 * Re-export the async function as 'await' for more intuitive naming
 * This allows: yield* await(somePromise) which reads naturally
 */
export { async as await };

// Default export
export default async;
