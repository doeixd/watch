// Main watch function with overloads and generator support

import type { 
  ElementFromSelector, 
  ElementFn, 
  ElementMatcher, 
  WatchTarget, 
  WatchContext, 
  CleanupFunction,
  PreDefinedWatchContext
} from './types.ts';
import { register } from './core/observer.ts';
import { executeGenerator } from './core/context.ts';
import { isPreDefinedWatchContext } from './core/context-factory.ts';
import { debounceGenerator, throttleGenerator, onceGenerator } from './core/generator-utils.ts';

// Watch function overloads - the heart of the system

// 1. String selector - infer element type from selector
export function watch<S extends string>(
  selector: S, 
  generator: () => Generator<ElementFn<ElementFromSelector<S>>, void, unknown>
): CleanupFunction;

// 2. Single element - infer exact element type
export function watch<El extends HTMLElement>(
  element: El,
  generator: () => Generator<ElementFn<El>, void, unknown>
): CleanupFunction;

// 3. Matcher function - HTMLElement
export function watch<El extends HTMLElement>(
  matcher: ElementMatcher<El>,
  generator: () => Generator<ElementFn<El>, void, unknown>
): CleanupFunction;

// 4. Array of elements - infer union type
export function watch<El extends HTMLElement>(
  elements: El[],
  generator: () => Generator<ElementFn<El>, void, unknown>
): CleanupFunction;

// 5. NodeList - infer element type
export function watch<El extends HTMLElement>(
  nodeList: NodeListOf<El>,
  generator: () => Generator<ElementFn<El>, void, unknown>
): CleanupFunction;

// 6. Event Delegation - parent element with child selector
export function watch<Parent extends HTMLElement, S extends string>(
  parent: Parent,
  childSelector: S,
  generator: () => Generator<ElementFn<ElementFromSelector<S>>, void, unknown>
): CleanupFunction;

// 7. Pre-defined watch context - enhanced type safety
export function watch<
  Ctx extends PreDefinedWatchContext<any, any, any>,
  El extends Ctx['elementType'] = Ctx['elementType']
>(
  context: Ctx,
  generator: () => Generator<ElementFn<El>, void, unknown>
): CleanupFunction;

// Implementation
export function watch<T extends WatchTarget | HTMLElement | PreDefinedWatchContext<any, any, any>>(
  target: T,
  selectorOrGenerator?: string | (() => Generator<ElementFn<any>, void, unknown>),
  generator?: () => Generator<ElementFn<any>, void, unknown>
): CleanupFunction {
  
  // Handle pre-defined watch context case
  if (isPreDefinedWatchContext(target)) {
    const context = target;
    const actualGenerator = selectorOrGenerator as () => Generator<ElementFn<any>, void, unknown>;
    
    // Apply options like debounce, throttle, etc.
    let wrappedGenerator = actualGenerator;
    
    if (context.options.debounce) {
      wrappedGenerator = debounceGenerator(actualGenerator, context.options.debounce);
    }
    
    if (context.options.throttle) {
      wrappedGenerator = throttleGenerator(actualGenerator, context.options.throttle);
    }
    
    if (context.options.once) {
      wrappedGenerator = onceGenerator(actualGenerator);
    }
    
    const setupFn = (element: HTMLElement) => {
      // Apply filter if specified
      if (context.options.filter && !context.options.filter(element)) {
        return;
      }
      
      const arr = [element];
      executeGenerator(
        element,
        context.selector,
        0,
        arr,
        wrappedGenerator
      );
    };
    
    return register(context.selector, setupFn);
  }
  
  // Handle event delegation case: watch(parent, childSelector, generator)
  if (arguments.length === 3 && target instanceof HTMLElement && typeof selectorOrGenerator === 'string') {
    const parent = target;
    const childSelector = selectorOrGenerator;
    const delegatedGenerator = generator!;
    
    // Create delegation handlers for common events
    const delegationHandlers = new Map<string, (event: Event) => void>();
    
    const createDelegationHandler = (eventType: string) => {
      return (event: Event) => {
        const target = event.target as HTMLElement;
        const matchedChild = target.closest(childSelector) as HTMLElement;
        
        if (matchedChild && parent.contains(matchedChild)) {
          // Create array with single element for consistency
          const arr = [matchedChild] as any[];
          
          // Execute generator for the matched child
          executeGenerator(
            matchedChild,
            childSelector,
            0,
            arr,
            delegatedGenerator
          );
        }
      };
    };
    
    // Set up event delegation for common events
    const eventTypes = ['click', 'input', 'change', 'submit', 'focus', 'blur', 'keydown', 'keyup'];
    
    eventTypes.forEach(eventType => {
      const handler = createDelegationHandler(eventType);
      delegationHandlers.set(eventType, handler);
      parent.addEventListener(eventType, handler, true);
    });
    
    // Also apply to existing matching children
    const existingChildren = Array.from(parent.querySelectorAll(childSelector));
    existingChildren.forEach((child, index) => {
      if (child instanceof HTMLElement) {
        executeGenerator(
          child,
          childSelector,
          index,
          existingChildren as any[],
          delegatedGenerator
        );
      }
    });
    
    return () => {
      // Remove all delegation handlers
      delegationHandlers.forEach((handler, eventType) => {
        parent.removeEventListener(eventType, handler, true);
      });
      delegationHandlers.clear();
    };
  }
  
  // Handle normal cases: watch(target, generator)
  const actualGenerator = selectorOrGenerator as () => Generator<ElementFn<any>, void, unknown>;
  
  // String selector - traditional observation
  if (typeof target === 'string') {
    const selector = target;
    
    const setupFn = (element: HTMLElement) => {
      // Create a temporary array for this single element
      const arr = [element];
      
      executeGenerator(
        element,
        selector,
        0,
        arr,
        actualGenerator
      );
    };
    
    return register(selector, setupFn);
  }
  
  // Single element - apply immediately + observe for removal
  if (target instanceof HTMLElement) {
    const element = target;
    const arr = [element];
    
    // Apply immediately
    executeGenerator(
      element,
      `element-${element.tagName.toLowerCase()}`,
      0,
      arr,
      actualGenerator
    );
    
    // Observe for removal
    const removalObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.removedNodes.forEach(node => {
          if (node === element || (node instanceof Element && node.contains(element))) {
            // Element was removed - cleanup
            removalObserver.disconnect();
          }
        });
      });
    });
    
    if (element.parentNode) {
      removalObserver.observe(element.parentNode, { childList: true, subtree: true });
    }
    
    return () => removalObserver.disconnect();
  }
  
  // Matcher function - observe all elements
  if (typeof target === 'function') {
    const matcher = target as ElementMatcher<any>;
    
    const setupFn = (element: HTMLElement) => {
      if (matcher(element)) {
        const arr = [element];
        
        executeGenerator(
          element,
          'matcher-function',
          0,
          arr,
          actualGenerator
        );
      }
    };
    
    // Apply to existing elements
    const existingElements = Array.from(document.querySelectorAll('*'));
    existingElements.forEach(el => {
      if (el instanceof HTMLElement) {
        setupFn(el);
      }
    });
    
    // Observe for new elements
    const matcherObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            setupFn(node);
            // Also check children
            const childElements = Array.from(node.querySelectorAll('*'));
            childElements.forEach(child => {
              if (child instanceof HTMLElement) {
                setupFn(child);
              }
            });
          }
        });
      });
    });
    
    matcherObserver.observe(document.body, { childList: true, subtree: true });
    return () => matcherObserver.disconnect();
  }
  
  // Array of elements or NodeList - apply to each
  const elements = Array.isArray(target) ? target : Array.from(target as NodeListOf<HTMLElement>);
  const cleanupFns: CleanupFunction[] = [];
  
  elements.forEach((element, index) => {
    if (element instanceof HTMLElement) {
      // Execute generator for each element
      executeGenerator(
        element,
        'element-array',
        index,
        elements,
        actualGenerator
      );
      
      // Observe for removal
      const removalObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          mutation.removedNodes.forEach(node => {
            if (node === element || (node instanceof Element && node.contains(element))) {
              removalObserver.disconnect();
            }
          });
        });
      });
      
      if (element.parentNode) {
        removalObserver.observe(element.parentNode, { childList: true, subtree: true });
        cleanupFns.push(() => removalObserver.disconnect());
      }
    }
  });
  
  return () => {
    cleanupFns.forEach(fn => fn());
  };
}

// Utility function to run a generator on existing elements
export function run<S extends string>(
  selector: S,
  generator: () => Generator<ElementFn<ElementFromSelector<S>>, void, unknown>
): void {
  const elements = Array.from(document.querySelectorAll(selector));
  
  elements.forEach((element, index) => {
    if (element instanceof HTMLElement) {
      executeGenerator(
        element as ElementFromSelector<S>,
        selector,
        index,
        elements as ElementFromSelector<S>[],
        generator
      );
    }
  });
}

// Helper to run generator on a single element
export function runOn<El extends HTMLElement>(
  element: El,
  generator: () => Generator<ElementFn<El>, void, unknown>
): void {
  const arr = [element];
  
  executeGenerator(
    element,
    `element-${element.tagName.toLowerCase()}`,
    0,
    arr,
    generator
  );
}
