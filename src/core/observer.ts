// Global Observer System for Watch v5

import type { ElementHandler, SelectorRegistry, UnmountRegistry, UnmountHandler, WatchController, ManagedInstance, WatchTarget, ElementMatcher } from '../types';
import { getElementStateSnapshot } from './state';
import { executeGenerator } from './context';

// Global state
let globalObserver: MutationObserver | null = null;
let isObserving = false;

// Registries
export const selectorHandlers: SelectorRegistry = new Map();
export const unmountHandlers: UnmountRegistry = new WeakMap();

// NEW: Global registry for controllers.
const controllerRegistry = new Map<string | WatchTarget, WatchController<any>>();

// WeakMap to avoid polluting DOM elements with data attributes
let elementToIdMap = new WeakMap<HTMLElement, string>();

// Initialize the global observer system
export function initializeObserver(): void {
  if (globalObserver) return;
  
  globalObserver = new MutationObserver(processMutations);
  
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserving);
  } else {
    startObserving();
  }
}

// Start observing the document
function startObserving(): void {
  if (isObserving || !globalObserver) return;
  
  globalObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true
  });
  
  isObserving = true;
}

// Process mutations from the global observer
function processMutations(mutations: MutationRecord[]): void {
  const elementsToProcess = new Set<HTMLElement>();
  const removedElements = new Set<HTMLElement>();
  
  // Collect elements that need processing
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      // Handle added nodes
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          collectElements(node, elementsToProcess);
        }
      });
      
      // Handle removed nodes
      mutation.removedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          collectElements(node, removedElements);
        }
      });
    }
    
    if (mutation.type === 'attributes') {
      if (mutation.target instanceof HTMLElement) {
        elementsToProcess.add(mutation.target);
      }
    }
  });
  
  // Process added/changed elements
  if (elementsToProcess.size > 0) {
    processElements(elementsToProcess);
  }
  
  // Process removed elements
  if (removedElements.size > 0) {
    processRemovedElements(removedElements);
  }
}

// Collect all elements including children
function collectElements(root: HTMLElement, collector: Set<HTMLElement>): void {
  collector.add(root);
  
  // Use TreeWalker for efficient DOM traversal
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    null
  );
  
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node instanceof HTMLElement) {
      collector.add(node);
    }
  }
}

// Process elements against all registered selectors
function processElements(elements: Set<HTMLElement>): void {
  if (selectorHandlers.size === 0) return;
  
  // Group elements by selector for efficiency
  const selectorMatches = new Map<string, Set<HTMLElement>>();
  
  selectorHandlers.forEach((_handlers, selector) => {
    const matches = new Set<HTMLElement>();
    
    elements.forEach(element => {
      try {
        if (element.matches(selector)) {
          matches.add(element);
        }
      } catch (e) {
        // Invalid selector, skip
        console.warn(`Invalid selector: ${selector}`, e);
      }
    });
    
    if (matches.size > 0) {
      selectorMatches.set(selector, matches);
    }
  });
  
  // Execute handlers for matched elements
  selectorMatches.forEach((matches, selector) => {
    const handlers = selectorHandlers.get(selector);
    if (!handlers) return;
    
    matches.forEach(element => {
      handlers.forEach(handler => {
        try {
          handler(element);
        } catch (e) {
          console.error(`Error in handler for selector "${selector}":`, e);
        }
      });
    });
  });
}

// Process removed elements for cleanup
function processRemovedElements(elements: Set<HTMLElement>): void {
  elements.forEach(element => {
    // Use unified trigger function for all unmount handling
    try {
      // Import trigger function from events-hybrid
      const { triggerUnmountHandlers } = require('../api/events-hybrid');
      triggerUnmountHandlers(element);
    } catch (e) {
      // Fallback to legacy unmount handling if import fails
      const handlers = unmountHandlers.get(element);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(element);
          } catch (e) {
            console.error('Error in unmount handler:', e);
          }
        });
        
        // Clean up the registry
        unmountHandlers.delete(element);
      }
    }
    
    // Clean up element from all controller instances
    controllerRegistry.forEach(controller => {
      const instances = controller.getInstances();
      if (instances.has(element as any)) {
        // Remove from instances map
        (instances as Map<any, any>).delete(element);
      }
    });
  });
}

// Register a handler for a selector
export function register<S extends string>(
  selector: S,
  handler: ElementHandler<any>
): () => void {
  // Initialize observer if not already done
  initializeObserver();
  
  // Add to registry
  if (!selectorHandlers.has(selector)) {
    selectorHandlers.set(selector, new Set());
  }
  
  const handlers = selectorHandlers.get(selector)!;
  handlers.add(handler);
  
  // Apply to existing elements
  try {
    const existingElements = document.querySelectorAll(selector);
    existingElements.forEach(element => {
      if (element instanceof HTMLElement) {
        try {
          handler(element);
        } catch (e) {
          console.error(`Error applying handler to existing element:`, e);
        }
      }
    });
  } catch (e) {
    console.warn(`Invalid selector during registration: ${selector}`, e);
  }
  
  // Return unregister function
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      selectorHandlers.delete(selector);
    }
  };
}

// Register an unmount handler for an element
export function registerUnmount<El extends HTMLElement>(
  element: El,
  handler: UnmountHandler<El>
): () => void {
  if (!unmountHandlers.has(element)) {
    unmountHandlers.set(element, new Set());
  }
  
  const handlers = unmountHandlers.get(element)!;
  handlers.add(handler as UnmountHandler);
  
  return () => {
    handlers.delete(handler as UnmountHandler);
    if (handlers.size === 0) {
      unmountHandlers.delete(element);
    }
  };
}

// Get current observer status
export function getObserverStatus(): {
  isInitialized: boolean;
  isObserving: boolean;
  selectorCount: number;
  unmountCount: number;
} {
  return {
    isInitialized: globalObserver !== null,
    isObserving,
    selectorCount: selectorHandlers.size,
    unmountCount: 0 // WeakMap doesn't have size property
  };
}

/**
 * The new heart of the watch system. Gets or creates a singleton controller
 * for a given watch target, ensuring idempotency.
 * @internal
 */
export function getOrCreateController<El extends HTMLElement>(
  target: WatchTarget<El>
): WatchController<El> {
  // Create a consistent key for complex targets
  const targetKey = normalizeTargetKey(target);
  
  if (controllerRegistry.has(targetKey)) {
    return controllerRegistry.get(targetKey)!;
  }

  const instances = new Map<El, ManagedInstance>();
  const behaviorCleanupFns = new Set<() => void>();

  const controller = Object.assign(
    // Make the controller callable for backward compatibility
    function() {
      controller.destroy();
    },
    {
      subject: target,
      getInstances: () => instances,
      layer: (generator: () => Generator<any, void, unknown>) => {
        const cleanup = registerBehavior(target, generator, instances);
        behaviorCleanupFns.add(cleanup);
      },
      destroy: () => {
        behaviorCleanupFns.forEach(fn => fn());
        behaviorCleanupFns.clear();
        instances.clear();
        controllerRegistry.delete(targetKey);
      },
    }
  ) as WatchController<El>;

  controllerRegistry.set(targetKey, controller);
  return controller;
}

/**
 * Normalize WatchTarget to a consistent key for the controller registry
 * This ensures that functionally equivalent targets share the same controller
 * @internal
 */
function normalizeTargetKey(target: WatchTarget<any>): string | WatchTarget<any> {
  if (typeof target === 'string') {
    return target; // String selectors are already unique
  }
  
  if (target instanceof HTMLElement) {
    // Use WeakMap to avoid polluting DOM with data attributes
    if (!elementToIdMap.has(target)) {
      elementToIdMap.set(target, `watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
    return `element:${elementToIdMap.get(target)}`;
  }
  
  if (Array.isArray(target)) {
    // Create a key based on element IDs using WeakMap
    const elementIds = target.map(el => {
      if (el instanceof HTMLElement) {
        if (!elementToIdMap.has(el)) {
          elementToIdMap.set(el, `watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        }
        return elementToIdMap.get(el);
      }
      return 'unknown';
    }).join(',');
    return `array:${elementIds}`;
  }
  
  if (target instanceof NodeList) {
    // Convert NodeList to array and process similarly using WeakMap
    const elementIds = Array.from(target).map(el => {
      if (el instanceof HTMLElement) {
        if (!elementToIdMap.has(el)) {
          elementToIdMap.set(el, `watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
        }
        return elementToIdMap.get(el);
      }
      return 'unknown';
    }).join(',');
    return `nodelist:${elementIds}`;
  }
  
  if (typeof target === 'function') {
    // Function targets are harder to normalize, return the function itself
    // This means each function gets its own controller
    return target;
  }
  
  // Handle delegation objects { parent, childSelector }
  if (typeof target === 'object' && target !== null && 'parent' in target && 'childSelector' in target) {
    const delegationTarget = target as { parent: HTMLElement; childSelector: string };
    if (!elementToIdMap.has(delegationTarget.parent)) {
      elementToIdMap.set(delegationTarget.parent, `watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
    return `delegation:${elementToIdMap.get(delegationTarget.parent)}:${delegationTarget.childSelector}`;
  }
  
  // Handle scoped selector objects { parent, selector }
  if (typeof target === 'object' && target !== null && 'parent' in target && 'selector' in target) {
    const scopedTarget = target as { parent: HTMLElement; selector: string };
    if (!elementToIdMap.has(scopedTarget.parent)) {
      elementToIdMap.set(scopedTarget.parent, `watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
    return `scoped:${elementToIdMap.get(scopedTarget.parent)}:${scopedTarget.selector}`;
  }
  
  // Handle scoped matcher objects { parent, matcher }
  if (typeof target === 'object' && target !== null && 'parent' in target && 'matcher' in target) {
    const scopedTarget = target as { parent: HTMLElement; matcher: ElementMatcher<any> };
    if (!elementToIdMap.has(scopedTarget.parent)) {
      elementToIdMap.set(scopedTarget.parent, `watch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
    return `scoped:${elementToIdMap.get(scopedTarget.parent)}:matcher`;
  }
  
  // For any other type, return the target itself
  return target;
}

/**
 * Registers a single behavior (generator) for a target. This function is called
 * by `controller.layer()` and handles the low-level observation logic.
 * @internal
 */
function registerBehavior<El extends HTMLElement>(
  target: WatchTarget<El>,
  generator: () => Generator<any, void, unknown>,
  instances: Map<El, ManagedInstance>
): () => void {
  initializeObserver();

  const executedBehaviors = new WeakMap<HTMLElement, Set<Function>>();

  const setupFn: ElementHandler<El> = (element: El) => {
    const behaviorsForElement = executedBehaviors.get(element) || new Set();
    if (behaviorsForElement.has(generator)) return; // Behavior already layered.

    // Mark behavior as being executed to prevent duplicate execution
    behaviorsForElement.add(generator);
    executedBehaviors.set(element, behaviorsForElement);

    if (!instances.has(element)) {
      instances.set(element, {
        element,
        getState: () => getElementStateSnapshot(element),
      });
    }
    
    executeGenerator(
      element,
      typeof target === 'string' ? target : 'matcher',
      // The index/array arguments are now relative to the controller's instance list.
      Array.from(instances.keys()).indexOf(element),
      Array.from(instances.keys()),
      generator
    ).catch(error => {
      console.error('Error in behavior generator:', error);
      // Remove the failed behavior from the executed set so it can be retried
      behaviorsForElement.delete(generator);
      if (behaviorsForElement.size === 0) {
        executedBehaviors.delete(element);
      }
    });
  };

  // This helper function checks if an element matches a given WatchTarget.
  const elementMatchesSubject = (el: HTMLElement, subj: WatchTarget): boolean => {
    if (typeof subj === 'string') return el.matches(subj);
    if (subj instanceof HTMLElement) return el === subj;
    if (Array.isArray(subj)) return subj.includes(el as any);
    if (subj instanceof NodeList) return Array.from(subj).includes(el as any);
    if (typeof subj === 'function') return (subj as Function)(el); // Simplified
    
    // Handle delegation objects { parent, childSelector }
    if (typeof subj === 'object' && subj !== null && 'parent' in subj && 'childSelector' in subj) {
      const delegationTarget = subj as { parent: HTMLElement; childSelector: string };
      return (delegationTarget.parent.contains(el) || delegationTarget.parent === el) && 
             el.matches(delegationTarget.childSelector);
    }
    
    // Handle scoped selector objects { parent, selector }
    if (typeof subj === 'object' && subj !== null && 'parent' in subj && 'selector' in subj) {
      const scopedTarget = subj as { parent: HTMLElement; selector: string };
      return (scopedTarget.parent.contains(el) || scopedTarget.parent === el) && 
             el.matches(scopedTarget.selector);
    }
    
    // Handle scoped matcher objects { parent, matcher }
    if (typeof subj === 'object' && subj !== null && 'parent' in subj && 'matcher' in subj) {
      const scopedTarget = subj as { parent: HTMLElement; matcher: ElementMatcher<any> };
      return (scopedTarget.parent.contains(el) || scopedTarget.parent === el) && 
             scopedTarget.matcher(el);
    }
    
    return false;
  };

  // This is the raw handler attached to the global observer system.
  const actualHandler = (el: HTMLElement) => {
    if (elementMatchesSubject(el, target as WatchTarget)) {
      setupFn(el as El);
    }
  };

  // Use a generic selector for non-string targets to ensure they are checked.
  const selector = typeof target === 'string' ? target : '*';
  
  if (!selectorHandlers.has(selector)) {
    selectorHandlers.set(selector, new Set());
  }
  const handlers = selectorHandlers.get(selector)!;
  handlers.add(actualHandler);

  // Apply to all existing elements in the document that match.
  if (typeof target === 'string') {
    document.querySelectorAll(selector).forEach(element => {
      if (element instanceof HTMLElement) actualHandler(element);
    });
  } else {
    // For non-string targets, check all elements
    document.querySelectorAll('*').forEach(element => {
      if (element instanceof HTMLElement) actualHandler(element);
    });
  }

  // Return a cleanup function for this specific behavior layer.
  return () => {
    handlers.delete(actualHandler);
    if (handlers.size === 0) {
      selectorHandlers.delete(selector);
    }
    // Note: Instance-specific cleanup is handled by the `executeElementCleanup`
    // system when an element is removed from the DOM.
  };
}

// Cleanup function for testing
export function cleanup(): void {
  if (globalObserver) {
    globalObserver.disconnect();
    globalObserver = null;
  }
  
  isObserving = false;
  selectorHandlers.clear();
  controllerRegistry.clear();
  elementToIdMap = new WeakMap(); // Clear element IDs
  // Note: WeakMap will clean itself up
}
