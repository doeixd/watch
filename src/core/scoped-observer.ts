// Scoped Observer System for Watch v5
// Creates isolated observers for specific parent elements

import { executeGenerator } from './context';
import { registerUnmount, getOrCreateController } from './observer';
import type { ElementMatcher, WatchController } from '../types';

export interface ScopedWatchOptions {
  /** Enable attribute watching */
  attributes?: boolean;
  /** Enable attribute old value tracking */
  attributeOldValue?: boolean;
  /** Specific attribute names to watch */
  attributeFilter?: string[];
  /** Enable character data watching */
  characterData?: boolean;
  /** Enable character data old value tracking */
  characterDataOldValue?: boolean;
  /** Enable subtree watching */
  subtree?: boolean;
}

export interface ScopedWatcher {
  /** Stop watching and clean up */
  disconnect(): void;
  /** Check if the watcher is active */
  isActive(): boolean;
  /** Get the parent element being watched */
  getParent(): HTMLElement;
  /** Get the selector being watched */
  getSelector(): string;
  /** Get the WatchController for this scoped watcher (if using controller mode) */
  getController(): WatchController<any> | null;
}

// Track all scoped watchers for cleanup
const activeScopedWatchers = new WeakMap<HTMLElement, Set<ScopedWatcher>>();

export function createScopedWatcher<S extends string>(
  parent: HTMLElement,
  selectorOrMatcher: S | ElementMatcher<any>,
  generator: () => Generator<any, any, unknown> | AsyncGenerator<any, any, unknown>,
  options: ScopedWatchOptions = {}
): ScopedWatcher {
  
  let observer: MutationObserver | null = null;
  let isActive = false;
  const processedElements = new WeakSet<HTMLElement>();
  
  // Determine if we're using a selector or matcher function
  const isSelector = typeof selectorOrMatcher === 'string';
  const selector = isSelector ? selectorOrMatcher as string : '';
  const matcher = isSelector ? null : selectorOrMatcher as ElementMatcher<any>;
  
  // Default options
  const observerOptions = {
    childList: true,
    subtree: options.subtree !== false, // Default to true
    attributes: options.attributes || false,
    attributeOldValue: options.attributeOldValue || false,
    attributeFilter: options.attributeFilter,
    characterData: options.characterData || false,
    characterDataOldValue: options.characterDataOldValue || false,
  };

  // Process elements that match the selector
  const processElements = (elements: NodeList | HTMLElement[]): void => {
    const elementsArray = Array.from(elements);
    
    elementsArray.forEach((node, index) => {
      if (!(node instanceof HTMLElement)) return;
      
      // Check if element matches selector or matcher
      let matches = false;
      try {
        if (isSelector && selector) {
          matches = node.matches(selector);
        } else if (matcher) {
          matches = matcher(node);
        }
        
        if (matches) {
          // Avoid duplicate processing
          if (processedElements.has(node)) return;
          processedElements.add(node);
          
          // Execute generator for this element
          const elementArray = [node] as any[];
          const displayName = isSelector ? selector : 'matcher function';
          executeGenerator(
            node,
            displayName,
            index,
            elementArray,
            generator
          ).catch(error => {
            console.error(`Error in scoped generator for "${displayName}":`, error);
          });
        }
      } catch (e) {
        const displayName = isSelector ? selector : 'matcher function';
        console.warn(`Invalid ${displayName} in scoped watcher:`, e);
      }
      
      // Also check descendants if subtree is enabled
      if (observerOptions.subtree) {
        try {
          if (isSelector && selector) {
            const descendants = node.querySelectorAll(selector);
            descendants.forEach((descendant, descIndex) => {
              if (!(descendant instanceof HTMLElement)) return;
              if (processedElements.has(descendant)) return;
              processedElements.add(descendant);
              
              const descendantArray = [descendant] as any[];
              executeGenerator(
                descendant,
                selector,
                descIndex,
                descendantArray,
                generator
              ).catch(error => {
                console.error(`Error in scoped generator for descendant "${selector}":`, error);
              });
            });
          } else if (matcher) {
            // For matcher functions, we need to walk the tree manually
            const walker = document.createTreeWalker(
              node,
              NodeFilter.SHOW_ELEMENT,
              (node) => node !== node && matcher(node as HTMLElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
            );
            
            let descendant: HTMLElement | null = walker.nextNode() as HTMLElement;
            let descIndex = 0;
            while (descendant) {
              if (processedElements.has(descendant)) {
                descendant = walker.nextNode() as HTMLElement;
                continue;
              }
              processedElements.add(descendant);
              
              const descendantArray = [descendant] as any[];
              executeGenerator(
                descendant,
                'matcher function',
                descIndex++,
                descendantArray,
                generator
              ).catch(error => {
                console.error('Error in scoped generator for matched descendant:', error);
              });
              
              descendant = walker.nextNode() as HTMLElement;
            }
          }
        } catch (e) {
          const displayName = isSelector ? selector : 'matcher function';
          console.warn(`Error processing descendants for ${displayName}:`, e);
        }
      }
    });
  };

  // Handle mutations
  const handleMutations = (mutations: MutationRecord[]): void => {
    const elementsToProcess = new Set<HTMLElement>();
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        // Process added nodes
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            elementsToProcess.add(node);
          }
        });
      } else if (mutation.type === 'attributes') {
        // Process attribute changes
        if (mutation.target instanceof HTMLElement) {
          elementsToProcess.add(mutation.target);
        }
      } else if (mutation.type === 'characterData') {
        // Process character data changes
        const parent = mutation.target.parentElement;
        if (parent instanceof HTMLElement) {
          elementsToProcess.add(parent);
        }
      }
    });
    
    if (elementsToProcess.size > 0) {
      processElements(Array.from(elementsToProcess));
    }
  };

  // Create the observer
  observer = new MutationObserver(handleMutations);
  
  // Start observing
  observer.observe(parent, observerOptions);
  isActive = true;

  // Process existing elements
  try {
    if (isSelector && selector) {
      const existingElements = parent.querySelectorAll(selector);
      processElements(existingElements);
    } else if (matcher) {
      // For matcher functions, walk the tree to find existing matches
      const walker = document.createTreeWalker(
        parent,
        NodeFilter.SHOW_ELEMENT,
        (node) => matcher(node as HTMLElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
      );
      
      const existingElements: HTMLElement[] = [];
      let element: HTMLElement | null = walker.nextNode() as HTMLElement;
      while (element) {
        existingElements.push(element);
        element = walker.nextNode() as HTMLElement;
      }
      
      processElements(existingElements);
    }
  } catch (e) {
    const displayName = isSelector ? selector : 'matcher function';
    console.warn(`Error processing existing elements for ${displayName}:`, e);
  }

  // Create the watcher object
  const watcher: ScopedWatcher = {
    disconnect(): void {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      isActive = false;
      
      // Remove from tracking
      const watchers = activeScopedWatchers.get(parent);
      if (watchers) {
        watchers.delete(watcher);
        if (watchers.size === 0) {
          activeScopedWatchers.delete(parent);
        }
      }
    },
    
    isActive(): boolean {
      return isActive;
    },
    
    getParent(): HTMLElement {
      return parent;
    },
    
    getSelector(): string {
      return isSelector ? selector : '[matcher function]';
    },
    
    getController(): WatchController<any> | null {
      return null; // Regular scoped watchers don't have controllers
    }
  };

  // Track this watcher
  if (!activeScopedWatchers.has(parent)) {
    activeScopedWatchers.set(parent, new Set());
  }
  activeScopedWatchers.get(parent)!.add(watcher);
  
  // Register cleanup when parent is removed
  registerUnmount(parent, () => {
    watcher.disconnect();
  });

  return watcher;
}

// Utility function to disconnect all scoped watchers for a parent
export function disconnectScopedWatchers(parent: HTMLElement): void {
  const watchers = activeScopedWatchers.get(parent);
  if (watchers) {
    watchers.forEach(watcher => watcher.disconnect());
  }
}

// Get all active scoped watchers for a parent
export function getScopedWatchers(parent: HTMLElement): ScopedWatcher[] {
  const watchers = activeScopedWatchers.get(parent);
  return watchers ? Array.from(watchers) : [];
}

/**
 * Create a scoped watcher that integrates with the WatchController system.
 * This enables behavior layering and advanced controller features within scoped contexts.
 */
export function createScopedWatcherWithController<S extends string>(
  parent: HTMLElement,
  selectorOrMatcher: S | ElementMatcher<any>,
  generator: () => Generator<any, any, unknown> | AsyncGenerator<any, any, unknown>,
  options: ScopedWatchOptions = {}
): ScopedWatcher & { controller: WatchController<any> } {
  
  let observer: MutationObserver | null = null;
  let isActive = false;
  const processedElements = new WeakSet<HTMLElement>();
  
  // Determine if we're using a selector or matcher function
  const isSelector = typeof selectorOrMatcher === 'string';
  const selector = isSelector ? selectorOrMatcher as string : '';
  const matcher = isSelector ? null : selectorOrMatcher as ElementMatcher<any>;
  
  // Create a scoped target identifier using the parent element and selector/matcher
  const scopedTarget = isSelector ? 
    { parent, selector } :
    { parent, matcher };
  
  // Get or create controller for this scoped target
  const controller = getOrCreateController(scopedTarget);
  
  // Add the generator as a layer to the controller
  controller.layer(generator);
  
  // Default options
  const observerOptions = {
    childList: true,
    subtree: options.subtree !== false,
    attributes: options.attributes || false,
    attributeOldValue: options.attributeOldValue || false,
    attributeFilter: options.attributeFilter,
    characterData: options.characterData || false,
    characterDataOldValue: options.characterDataOldValue || false,
  };

  // Handle mutations - delegate to controller
  const handleMutations = (mutations: MutationRecord[]): void => {
    const elementsToProcess = new Set<HTMLElement>();
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            elementsToProcess.add(node);
          }
        });
      } else if (mutation.type === 'attributes') {
        if (mutation.target instanceof HTMLElement) {
          elementsToProcess.add(mutation.target);
        }
      } else if (mutation.type === 'characterData') {
        const parent = mutation.target.parentElement;
        if (parent instanceof HTMLElement) {
          elementsToProcess.add(parent);
        }
      }
    });
    
    // Let the controller system handle the elements
    // This ensures proper behavior layering and state management
    elementsToProcess.forEach(element => {
      if (element.parentElement === parent || parent.contains(element)) {
        let matches = false;
        try {
          if (isSelector && selector) {
            matches = element.matches(selector);
          } else if (matcher) {
            matches = matcher(element);
          }
          
          if (matches && !processedElements.has(element)) {
            processedElements.add(element);
            // The controller will handle the execution
          }
        } catch (e) {
          const displayName = isSelector ? selector : 'matcher function';
          console.warn(`Invalid ${displayName} in scoped controller watcher:`, e);
        }
      }
    });
  };

  // Create the observer
  observer = new MutationObserver(handleMutations);
  observer.observe(parent, observerOptions);
  isActive = true;

  // Process existing elements through the controller
  try {
    if (isSelector && selector) {
      const existingElements = parent.querySelectorAll(selector);
      existingElements.forEach(element => {
        if (element instanceof HTMLElement) {
          processedElements.add(element);
        }
      });
    } else if (matcher) {
      const walker = document.createTreeWalker(
        parent,
        NodeFilter.SHOW_ELEMENT,
        (node) => matcher(node as HTMLElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
      );
      
      let element: HTMLElement | null = walker.nextNode() as HTMLElement;
      while (element) {
        processedElements.add(element);
        element = walker.nextNode() as HTMLElement;
      }
    }
  } catch (e) {
    const displayName = isSelector ? selector : 'matcher function';
    console.warn(`Error processing existing elements for scoped controller ${displayName}:`, e);
  }

  // Create the enhanced watcher object
  const watcher: ScopedWatcher & { controller: WatchController<any> } = {
    controller,
    
    disconnect(): void {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      isActive = false;
      
      // Destroy the controller to clean up all layers
      controller.destroy();
      
      // Remove from tracking
      const watchers = activeScopedWatchers.get(parent);
      if (watchers) {
        watchers.delete(watcher);
        if (watchers.size === 0) {
          activeScopedWatchers.delete(parent);
        }
      }
    },
    
    isActive(): boolean {
      return isActive;
    },
    
    getParent(): HTMLElement {
      return parent;
    },
    
    getSelector(): string {
      return isSelector ? selector : '[matcher function]';
    },
    
    getController(): WatchController<any> {
      return controller;
    }
  };

  // Track this watcher
  if (!activeScopedWatchers.has(parent)) {
    activeScopedWatchers.set(parent, new Set());
  }
  activeScopedWatchers.get(parent)!.add(watcher);
  
  // Register cleanup when parent is removed
  registerUnmount(parent, () => {
    watcher.disconnect();
  });

  return watcher;
}
