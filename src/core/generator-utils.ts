// Utility functions for wrapping generators with timing controls

import type { ElementFn } from '../types.ts';

// Debounce a generator function
export function debounceGenerator<El extends HTMLElement>(
  generatorFn: () => Generator<ElementFn<El>, void, unknown>,
  delay: number
): () => Generator<ElementFn<El>, void, unknown> {
  const timers = new WeakMap<HTMLElement, number>();
  
  return function* () {
    // We need to get the current element to debounce per-element
    const generator = generatorFn();
    let result = generator.next();
    
    while (!result.done) {
      const originalFn = result.value;
      
      // Wrap the element function with debouncing
      const debouncedFn: ElementFn<El> = (element: El) => {
        // Clear existing timer for this element
        const existingTimer = timers.get(element);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }
        
        // Set new timer
        const timer = setTimeout(() => {
          originalFn(element);
          timers.delete(element);
        }, delay);
        
        timers.set(element, timer as unknown as number);
      };
      
      yield debouncedFn;
      result = generator.next();
    }
  };
}

// Throttle a generator function
export function throttleGenerator<El extends HTMLElement>(
  generatorFn: () => Generator<ElementFn<El>, void, unknown>,
  delay: number
): () => Generator<ElementFn<El>, void, unknown> {
  const lastCalls = new WeakMap<HTMLElement, number>();
  
  return function* () {
    const generator = generatorFn();
    let result = generator.next();
    
    while (!result.done) {
      const originalFn = result.value;
      
      // Wrap the element function with throttling
      const throttledFn: ElementFn<El> = (element: El) => {
        const now = Date.now();
        const lastCall = lastCalls.get(element) || 0;
        
        if (now - lastCall >= delay) {
          originalFn(element);
          lastCalls.set(element, now);
        }
      };
      
      yield throttledFn;
      result = generator.next();
    }
  };
}

// Run a generator only once per element
export function onceGenerator<El extends HTMLElement>(
  generatorFn: () => Generator<ElementFn<El>, void, unknown>
): () => Generator<ElementFn<El>, void, unknown> {
  const executed = new WeakSet<HTMLElement>();
  
  return function* () {
    const generator = generatorFn();
    let result = generator.next();
    
    while (!result.done) {
      const originalFn = result.value;
      
      // Wrap the element function to run only once
      const onceFn: ElementFn<El> = (element: El) => {
        if (!executed.has(element)) {
          originalFn(element);
          executed.add(element);
        }
      };
      
      yield onceFn;
      result = generator.next();
    }
  };
}

// Delay a generator function
export function delayGenerator<El extends HTMLElement>(
  generatorFn: () => Generator<ElementFn<El>, void, unknown>,
  delay: number
): () => Generator<ElementFn<El>, void, unknown> {
  return function* () {
    const generator = generatorFn();
    let result = generator.next();
    
    while (!result.done) {
      const originalFn = result.value;
      
      // Wrap the element function with delay
      const delayedFn: ElementFn<El> = (element: El) => {
        setTimeout(() => originalFn(element), delay);
      };
      
      yield delayedFn;
      result = generator.next();
    }
  };
}

// Batch multiple element function calls
export function batchGenerator<El extends HTMLElement>(
  generatorFn: () => Generator<ElementFn<El>, void, unknown>,
  batchSize: number = 10
): () => Generator<ElementFn<El>, void, unknown> {
  return function* () {
    const generator = generatorFn();
    let result = generator.next();
    
    while (!result.done) {
      const originalFn = result.value;
      
      // Collect elements to batch process
      const elementBatch: El[] = [];
      
      const batchedFn: ElementFn<El> = (element: El) => {
        elementBatch.push(element);
        
        if (elementBatch.length >= batchSize) {
          // Process batch
          const batch = elementBatch.splice(0, batchSize);
          requestAnimationFrame(() => {
            batch.forEach(el => originalFn(el));
          });
        }
      };
      
      yield batchedFn;
      result = generator.next();
    }
  };
}
