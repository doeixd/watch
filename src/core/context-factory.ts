/**
 * # Context Factory - Pre-defined Watch Contexts
 * 
 * Context factories provide a way to create pre-configured watch contexts with
 * enhanced type safety, debouncing, throttling, and other options. They make
 * it easy to create reusable element configurations.
 * 
 * ## Key Features
 * - **Enhanced Type Safety**: Element types are automatically inferred
 * - **Built-in Options**: Debouncing, throttling, filtering, and more
 * - **Reusable Configurations**: Create contexts once, use multiple times
 * - **Common Element Shortcuts**: Pre-defined contexts for common elements
 * 
 * ## Usage Patterns
 * 
 * ```typescript
 * // Create a debounced button context
 * const debouncedButton = button('.submit-btn', { debounce: 300 });
 * 
 * // Use with watch
 * watch(debouncedButton, function* () {
 *   yield click(() => console.log('Debounced click!'));
 * });
 * 
 * // Create a throttled input context
 * const throttledInput = input('.search', { throttle: 500 });
 * 
 * watch(throttledInput, function* () {
 *   yield input(() => performSearch(self().value));
 * });
 * ```
 */

import type { 
  PreDefinedWatchContext, 
  ElementFromSelector, 
  WatchContextOptions 
} from '../types.ts';

/**
 * # context() - Create a Pre-defined Watch Context
 * 
 * Create a reusable watch context with specific options like debouncing,
 * throttling, filtering, and more.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Basic context
 * const buttonContext = context('button');
 * 
 * // Context with options
 * const debouncedContext = context('.search-input', {
 *   debounce: 300,
 *   filter: (el) => !el.disabled,
 *   once: false
 * });
 * 
 * // Use with watch
 * watch(debouncedContext, function* () {
 *   yield on('input', () => performSearch(self().value));
 * });
 * ```
 * 
 * ## Available Options
 * 
 * - **debounce**: Debounce generator execution (milliseconds)
 * - **throttle**: Throttle generator execution (milliseconds)
 * - **once**: Only execute generator once per element
 * - **filter**: Function to filter which elements to observe
 * - **data**: Custom data to attach to the context
 * - **priority**: Execution priority order
 * 
 * @param selector - CSS selector for target elements
 * @param options - Context options
 * @returns Pre-defined watch context
 */
export function context<
  S extends string,
  El extends HTMLElement = ElementFromSelector<S>,
  Options extends WatchContextOptions = WatchContextOptions
>(
  selector: S,
  options: Options = {} as Options
): PreDefinedWatchContext<S, El, Options> {
  return {
    selector,
    elementType: {} as El, // Phantom type for type inference
    options,
    __brand: 'PreDefinedWatchContext'
  };
}

/**
 * # contextFor() - Create Context for Specific Element Type
 * 
 * Create a context with explicit element type specification. Useful when
 * the element type cannot be inferred from the selector.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Explicit element type
 * const canvasContext = contextFor(
 *   '.my-canvas',
 *   HTMLCanvasElement,
 *   { once: true }
 * );
 * 
 * watch(canvasContext, function* () {
 *   // TypeScript knows this is HTMLCanvasElement
 *   const ctx = self().getContext('2d');
 *   // ... canvas operations
 * });
 * ```
 * 
 * @param selector - CSS selector for target elements
 * @param elementType - Element constructor for type inference
 * @param options - Context options
 * @returns Pre-defined watch context with explicit element type
 */
export function contextFor<
  El extends HTMLElement,
  S extends string = string,
  Options extends WatchContextOptions = WatchContextOptions
>(
  selector: S,
  elementType: new() => El,
  options: Options = {} as Options
): PreDefinedWatchContext<S, El, Options> {
  return {
    selector,
    elementType: {} as El,
    options,
    __brand: 'PreDefinedWatchContext'
  };
}

/**
 * # button() - Pre-defined Button Context
 * 
 * Create a context specifically for button elements with enhanced type safety.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Basic button context
 * const submitButton = button('.submit-btn');
 * 
 * // Button with debouncing
 * const debouncedButton = button('.submit-btn', { debounce: 300 });
 * 
 * // Button with filtering
 * const enabledButton = button('button', {
 *   filter: (btn) => !btn.disabled
 * });
 * 
 * watch(submitButton, function* () {
 *   // TypeScript knows this is HTMLButtonElement
 *   yield click(() => {
 *     self().disabled = true;
 *     submitForm();
 *   });
 * });
 * ```
 * 
 * @param selector - CSS selector for button elements
 * @param options - Context options
 * @returns Pre-defined button context
 */
export const button = <S extends string>(
  selector: S, 
  options: WatchContextOptions = {}
) => context<S, HTMLButtonElement>(selector as any, options) as PreDefinedWatchContext<S, HTMLButtonElement>;

/**
 * # input() - Pre-defined Input Context
 * 
 * Create a context specifically for input elements with enhanced type safety.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Basic input context
 * const textInput = input('input[type="text"]');
 * 
 * // Input with throttling
 * const searchInput = input('.search', { throttle: 500 });
 * 
 * // Input with debouncing
 * const debouncedInput = input('.email', { debounce: 300 });
 * 
 * watch(searchInput, function* () {
 *   // TypeScript knows this is HTMLInputElement
 *   yield input(() => {
 *     const query = self().value;
 *     performSearch(query);
 *   });
 * });
 * ```
 * 
 * @param selector - CSS selector for input elements
 * @param options - Context options
 * @returns Pre-defined input context
 */
export const input = <S extends string>(
  selector: S,
  options: WatchContextOptions = {}
) => context<S, HTMLInputElement>(selector as any, options) as PreDefinedWatchContext<S, HTMLInputElement>;

export const form = <S extends string>(
  selector: S,
  options: WatchContextOptions = {}
) => context<S, HTMLFormElement>(selector as any, options) as PreDefinedWatchContext<S, HTMLFormElement>;

export const div = <S extends string>(
  selector: S,
  options: WatchContextOptions = {}
) => context<S, HTMLDivElement>(selector as any, options) as PreDefinedWatchContext<S, HTMLDivElement>;

export const span = <S extends string>(
  selector: S,
  options: WatchContextOptions = {}
) => context<S, HTMLSpanElement>(selector as any, options) as PreDefinedWatchContext<S, HTMLSpanElement>;

// Context combinators
export function withData<
  Ctx extends PreDefinedWatchContext<any, any, any>,
  Data extends Record<string, unknown>
>(
  ctx: Ctx,
  data: Data
): PreDefinedWatchContext<Ctx['selector'], Ctx['elementType'], Ctx['options'] & { data: Data }> {
  return {
    ...ctx,
    options: {
      ...ctx.options,
      data: {
        ...((ctx.options as any).data || {}),
        ...data
      }
    }
  };
}

export function withDebounce<
  Ctx extends PreDefinedWatchContext<any, any, any>
>(
  ctx: Ctx,
  delay: number
): PreDefinedWatchContext<Ctx['selector'], Ctx['elementType'], Ctx['options'] & { debounce: number }> {
  return {
    ...ctx,
    options: {
      ...ctx.options,
      debounce: delay
    }
  };
}

export function withThrottle<
  Ctx extends PreDefinedWatchContext<any, any, any>
>(
  ctx: Ctx,
  delay: number
): PreDefinedWatchContext<Ctx['selector'], Ctx['elementType'], Ctx['options'] & { throttle: number }> {
  return {
    ...ctx,
    options: {
      ...ctx.options,
      throttle: delay
    }
  };
}

export function once<
  Ctx extends PreDefinedWatchContext<any, any, any>
>(
  ctx: Ctx
): PreDefinedWatchContext<Ctx['selector'], Ctx['elementType'], Ctx['options'] & { once: true }> {
  return {
    ...ctx,
    options: {
      ...ctx.options,
      once: true
    }
  };
}

export function withFilter<
  Ctx extends PreDefinedWatchContext<any, any, any>
>(
  ctx: Ctx,
  filter: (element: HTMLElement) => boolean
): PreDefinedWatchContext<Ctx['selector'], Ctx['elementType'], Ctx['options'] & { filter: typeof filter }> {
  return {
    ...ctx,
    options: {
      ...ctx.options,
      filter
    }
  };
}

// Type guard to check if something is a PreDefinedWatchContext
export function isPreDefinedWatchContext(
  value: unknown
): value is PreDefinedWatchContext<any, any, any> {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__brand' in value &&
    (value as any).__brand === 'PreDefinedWatchContext'
  );
}

// Extract types from context
export type ExtractSelector<T> = T extends PreDefinedWatchContext<infer S, any, any> ? S : never;
export type ExtractElement<T> = T extends PreDefinedWatchContext<any, infer El, any> ? El : never;
export type ExtractOptions<T> = T extends PreDefinedWatchContext<any, any, infer Opts> ? Opts : never;
