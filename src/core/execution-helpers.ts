// Execution helpers for Watch v5 - inspired by the reference implementation

import type { ElementFn, CleanupFunction } from '../types.ts';
import { getState, setState, createState } from './state.ts';
import { getCurrentContext } from './context.ts';

// Counter for generating stable keys
let executionCounter = 0;

// Execute function only once per element
export function once<El extends HTMLElement>(
  fn: ElementFn<El>
): ElementFn<El> {
  const fnId = ++executionCounter;
  const key = `__once_${fnId}`;
  
  return (element: El) => {
    const hasRun = getState<boolean>(key);
    if (!hasRun) {
      setState(key, true);
      return fn(element);
    }
  };
}

// Delay execution
export function delay<El extends HTMLElement>(
  ms: number,
  fn: ElementFn<El>
): ElementFn<El> {
  return (element: El) => {
    const timeoutId = setTimeout(() => fn(element), ms);
    
    // Add cleanup to current context if available
    const context = getCurrentContext();
    if (context) {
      // Store cleanup function
      const cleanupKey = `__cleanup_${++executionCounter}`;
      const cleanup = () => clearTimeout(timeoutId);
      setState(cleanupKey, cleanup);
    }
    
    return timeoutId;
  };
}

// Throttle execution
export function throttle<El extends HTMLElement>(
  ms: number,
  fn: ElementFn<El>
): ElementFn<El> {
  const fnId = ++executionCounter;
  const lastRunKey = `__throttle_${fnId}`;
  
  return (element: El) => {
    const now = Date.now();
    const lastRun = getState<number>(lastRunKey) || 0;
    
    if (now - lastRun >= ms) {
      setState(lastRunKey, now);
      return fn(element);
    }
  };
}

// Debounce execution
export function debounce<El extends HTMLElement>(
  ms: number,
  fn: ElementFn<El>
): ElementFn<El> {
  const fnId = ++executionCounter;
  const timeoutKey = `__debounce_${fnId}`;
  
  return (element: El) => {
    // Clear existing timeout
    const existingTimeout = getState<number>(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout
    const timeoutId = setTimeout(() => {
      fn(element);
      setState(timeoutKey, null);
    }, ms);
    
    setState(timeoutKey, timeoutId);
  };
}

// Conditional execution
export function when<El extends HTMLElement>(
  condition: (element: El) => boolean,
  thenFn: ElementFn<El>,
  elseFn?: ElementFn<El>
): ElementFn<El> {
  return (element: El) => {
    if (condition(element)) {
      return thenFn(element);
    } else if (elseFn) {
      return elseFn(element);
    }
  };
}

// Safe execution with error handling
export function safely<El extends HTMLElement, T = void>(
  fn: ElementFn<El, T>,
  fallback?: T,
  onError?: (error: Error, element: El) => void
): ElementFn<El, T | undefined> {
  return (element: El) => {
    try {
      return fn(element);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      if (onError) {
        onError(err, element);
      } else {
        console.warn('Watch function error:', err);
      }
      
      return fallback;
    }
  };
}

// Batch multiple operations
export function batch<El extends HTMLElement>(
  ...operations: ElementFn<El>[]
): ElementFn<El> {
  return (element: El) => {
    const results: any[] = [];
    operations.forEach(op => {
      try {
        results.push(op(element));
      } catch (e) {
        console.error('Error in batch operation:', e);
      }
    });
    return results;
  };
}

// Retry execution with backoff
export function retry<El extends HTMLElement, T = void>(
  fn: ElementFn<El, T>,
  maxAttempts: number = 3,
  backoffMs: number = 1000
): ElementFn<El, Promise<T>> {
  const fnId = ++executionCounter;
  const attemptsKey = `__retry_${fnId}_attempts`;
  
  return async (element: El): Promise<T> => {
    const attempts = getState<number>(attemptsKey) || 0;
    
    try {
      const result = await Promise.resolve(fn(element));
      setState(attemptsKey, 0); // Reset on success
      return result;
    } catch (error) {
      const newAttempts = attempts + 1;
      setState(attemptsKey, newAttempts);
      
      if (newAttempts >= maxAttempts) {
        setState(attemptsKey, 0); // Reset for next time
        throw error;
      }
      
      // Wait with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, backoffMs * Math.pow(2, attempts))
      );
      
      // Retry
      return retry(fn, maxAttempts, backoffMs)(element);
    }
  };
}

// Rate limiting
export function rateLimit<El extends HTMLElement>(
  maxCalls: number,
  windowMs: number,
  fn: ElementFn<El>
): ElementFn<El> {
  const fnId = ++executionCounter;
  const callsKey = `__rateLimit_${fnId}_calls`;
  const windowKey = `__rateLimit_${fnId}_window`;
  
  return (element: El) => {
    const now = Date.now();
    const windowStart = getState<number>(windowKey) || now;
    const calls = getState<number[]>(callsKey) || [];
    
    // Reset window if expired
    if (now - windowStart >= windowMs) {
      setState(windowKey, now);
      setState(callsKey, []);
      return fn(element);
    }
    
    // Check if we're under the limit
    if (calls.length < maxCalls) {
      calls.push(now);
      setState(callsKey, calls);
      return fn(element);
    }
    
    // Rate limited
    console.warn('Rate limit exceeded for function');
  };
}

// Memoization
export function memoize<El extends HTMLElement, T = any>(
  fn: ElementFn<El, T>,
  keyFn?: (element: El) => string
): ElementFn<El, T> {
  const fnId = ++executionCounter;
  const cacheKey = `__memoize_${fnId}`;
  
  return (element: El) => {
    const cache = getState<Map<string, T>>(cacheKey) || new Map();
    const key = keyFn ? keyFn(element) : element.tagName + element.className;
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(element);
    cache.set(key, result);
    setState(cacheKey, cache);
    
    return result;
  };
}

// Timeout wrapper
export function timeout<El extends HTMLElement, T = void>(
  ms: number,
  fn: ElementFn<El, T | Promise<T>>,
  timeoutValue?: T
): ElementFn<El, Promise<T>> {
  return async (element: El): Promise<T> => {
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => {
        if (timeoutValue !== undefined) {
          reject(timeoutValue);
        } else {
          reject(new Error(`Function timed out after ${ms}ms`));
        }
      }, ms);
    });
    
    const fnPromise = Promise.resolve(fn(element));
    
    return Promise.race([fnPromise, timeoutPromise]);
  };
}

// Compose multiple function wrappers
export function compose<El extends HTMLElement>(
  ...wrappers: ((fn: ElementFn<El>) => ElementFn<El>)[]
): (fn: ElementFn<El>) => ElementFn<El> {
  return (fn: ElementFn<El>) => {
    return wrappers.reduceRight((acc, wrapper) => wrapper(acc), fn);
  };
}

// Conditional wrapper
export function unless<El extends HTMLElement>(
  condition: (element: El) => boolean,
  fn: ElementFn<El>
): ElementFn<El> {
  return when((element: El) => !condition(element), fn);
}

// Async wrapper for element functions
export function async<El extends HTMLElement, T = void>(
  fn: ElementFn<El, Promise<T>>
): ElementFn<El, void> {
  return (element: El) => {
    fn(element).catch(error => {
      console.error('Async element function error:', error);
    });
  };
}
