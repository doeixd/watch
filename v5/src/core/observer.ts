// Global Observer System for Watch v5

import type { ElementHandler, SelectorRegistry, UnmountRegistry, UnmountHandler } from '../types.ts';

// Global state
let globalObserver: MutationObserver | null = null;
let isObserving = false;

// Registries
export const selectorHandlers: SelectorRegistry = new Map();
export const unmountHandlers: UnmountRegistry = new WeakMap();

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
  
  selectorHandlers.forEach((handlers, selector) => {
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
    // Trigger unmount handlers
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

// Cleanup function for testing
export function cleanup(): void {
  if (globalObserver) {
    globalObserver.disconnect();
    globalObserver = null;
  }
  
  isObserving = false;
  selectorHandlers.clear();
  // Note: WeakMap will clean itself up
}
