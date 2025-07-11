// Context factory for creating pre-defined watch contexts

import type { 
  PreDefinedWatchContext, 
  ElementFromSelector, 
  WatchContextOptions 
} from '../types.ts';

// Create a pre-defined watch context with enhanced type safety
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

// Helper to create context with specific element type
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

// Predefined contexts for common elements
export const button = <S extends string>(
  selector: S, 
  options: WatchContextOptions = {}
) => context<S, HTMLButtonElement>(selector as any, options) as PreDefinedWatchContext<S, HTMLButtonElement>;

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
