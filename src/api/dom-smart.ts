/**
 * Smart DOM API Implementation with Automatic Pattern Detection
 *
 * This module demonstrates how to implement DOM manipulation functions
 * that automatically detect and support multiple API patterns for
 * backwards compatibility.
 */

import type {
  ElementFn,
  Workflow,
  WatchContext,
  TypedGeneratorContext,
  ElementFromSelector
} from '../types';

import { APIDetector, APIRouter, APIImplementation, isHTMLElement, isCSSSelector } from '../core/api-detection';
import { getCurrentContext } from '../core/context';

// ============================================================================
// Text Function - Smart Implementation
// ============================================================================

/**
 * Smart text() function that supports all API patterns:
 * 1. Direct element: text(element, 'content')
 * 2. CSS selector: text('#id', 'content')
 * 3. Old generator: function* () { yield text('content') }
 * 4. New generator: async function* () { yield* text('content') }
 * 5. Getter: text() returns current text
 */

// TypeScript overloads for type safety
export function text(element: HTMLElement, content: string): void;
export function text(selector: string, content: string): void;
export function text(content: string): ElementFn<HTMLElement> | Workflow<void>;
export function text(): ElementFn<HTMLElement, string> | Workflow<string>;
export function text(...args: any[]): any {
  // Define implementations for each pattern
  const implementations: APIImplementation = {
    // Direct element manipulation
    directElement: (element: HTMLElement, content: string) => {
      element.textContent = content;
    },

    // CSS selector manipulation
    directSelector: (selector: string, content: string) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.textContent = content;
        }
      });
    },

    // Old sync generator pattern - returns ElementFn
    syncGenerator: (content?: string) => {
      if (content === undefined) {
        // Getter - return function that returns text
        return (element: HTMLElement) => element.textContent || '';
      }
      // Setter - return function that sets text
      return (element: HTMLElement) => {
        element.textContent = content;
      };
    },

    // New async generator pattern - returns Workflow
    asyncGenerator: (content?: string) => {
      if (content === undefined) {
        // Getter workflow
        return (async function* (): AsyncGenerator<any, string, any> {
          const result = yield (context: WatchContext) => {
            return context.element.textContent || '';
          };
          return result as string;
        })();
      }
      // Setter workflow
      return (async function* (): AsyncGenerator<any, void, any> {
        yield (context: WatchContext) => {
          context.element.textContent = content;
        };
      })();
    },

    // Dollar wrapper pattern (similar to async generator)
    dollarWrapper: (content?: string) => {
      // The $ wrapper essentially delegates to the async generator
      return implementations.asyncGenerator(content);
    },

    // Getter pattern for retrieving text
    getter: () => {
      const ctx = getCurrentContext();
      if (ctx) {
        // In generator context, return appropriate type
        const detection = APIDetector.detect('text', []);
        if (detection.pattern === 'async-generator') {
          return implementations.asyncGenerator();
        } else {
          return implementations.syncGenerator();
        }
      }
      // Direct call, throw error
      throw new Error('text() with no arguments can only be called in generator context');
    }
  };

  // Route to appropriate implementation
  return APIRouter.route('text', args, implementations);
}

// ============================================================================
// AddClass Function - Smart Implementation
// ============================================================================

/**
 * Smart addClass() function supporting all patterns
 */
export function addClass(element: HTMLElement, className: string): void;
export function addClass(selector: string, className: string): void;
export function addClass(className: string): ElementFn<HTMLElement> | Workflow<void>;
export function addClass(...args: any[]): any {
  const implementations: APIImplementation<void> = {
    directElement: (element: HTMLElement, className: string) => {
      element.classList.add(className);
    },

    directSelector: (selector: string, className: string) => {
      document.querySelectorAll(selector).forEach(el => {
        if (el instanceof HTMLElement) {
          el.classList.add(className);
        }
      });
    },

    syncGenerator: (className: string) => {
      return (element: HTMLElement) => {
        element.classList.add(className);
      };
    },

    asyncGenerator: (className: string) => {
      return (async function* () {
        yield (context: WatchContext) => {
          context.element.classList.add(className);
        };
      })();
    },

    dollarWrapper: (className: string) => {
      return implementations.asyncGenerator(className);
    },

    getter: () => {
      throw new Error('addClass requires a className argument');
    }
  };

  return APIRouter.route('addClass', args, implementations);
}

// ============================================================================
// Style Function - Smart Implementation with Object Support
// ============================================================================

type StyleValue = string | number | null;
type StyleObject = Record<string, StyleValue>;

export function style(element: HTMLElement, prop: string, value: StyleValue): void;
export function style(element: HTMLElement, styles: StyleObject): void;
export function style(selector: string, prop: string, value: StyleValue): void;
export function style(selector: string, styles: StyleObject): void;
export function style(prop: string, value: StyleValue): ElementFn<HTMLElement> | Workflow<void>;
export function style(styles: StyleObject): ElementFn<HTMLElement> | Workflow<void>;
export function style(...args: any[]): any {
  // Helper to apply styles
  const applyStyles = (element: HTMLElement, styles: StyleObject | string, value?: StyleValue) => {
    if (typeof styles === 'object') {
      Object.entries(styles).forEach(([prop, val]) => {
        if (val !== null) {
          (element.style as any)[prop] = String(val);
        }
      });
    } else {
      if (value !== null && value !== undefined) {
        (element.style as any)[styles] = String(value);
      }
    }
  };

  const implementations: APIImplementation<void> = {
    directElement: (...args: any[]) => {
      const [element, propOrStyles, value] = args;
      applyStyles(element, propOrStyles, value);
    },

    directSelector: (...args: any[]) => {
      const [selector, propOrStyles, value] = args;
      document.querySelectorAll(selector).forEach(el => {
        if (el instanceof HTMLElement) {
          applyStyles(el, propOrStyles, value);
        }
      });
    },

    syncGenerator: (...args: any[]) => {
      const [propOrStyles, value] = args;
      return (element: HTMLElement) => {
        applyStyles(element, propOrStyles, value);
      };
    },

    asyncGenerator: (...args: any[]) => {
      const [propOrStyles, value] = args;
      return (async function* () {
        yield (context: WatchContext) => {
          applyStyles(context.element, propOrStyles, value);
        };
      })();
    },

    dollarWrapper: (...args: any[]) => {
      return implementations.asyncGenerator(...args);
    },

    getter: () => {
      throw new Error('style requires at least one argument');
    }
  };

  return APIRouter.route('style', args, implementations);
}

// ============================================================================
// State Management - Smart Implementation
// ============================================================================

export function setState<T>(key: string, value: T): ElementFn<HTMLElement> | Workflow<void>;
export function setState<T>(...args: any[]): any {
  const implementations: APIImplementation<void> = {
    directElement: () => {
      throw new Error('setState cannot be called directly on an element');
    },

    directSelector: () => {
      throw new Error('setState cannot be called with a selector');
    },

    syncGenerator: (key: string, value: T) => {
      return (element: HTMLElement) => {
        // Get or create state map for element
        const stateMap = getElementStateMap(element);
        stateMap.set(key, value);
      };
    },

    asyncGenerator: (key: string, value: T) => {
      return (async function* () {
        yield (context: WatchContext) => {
          // Use context's state management
          if (!context.state) {
            (context as any).state = new Map();
          }
          context.state.set(key, value);
        };
      })();
    },

    dollarWrapper: (key: string, value: T) => {
      return implementations.asyncGenerator(key, value);
    },

    getter: () => {
      throw new Error('setState requires key and value arguments');
    }
  };

  return APIRouter.route('setState', args, implementations);
}

export function getState<T>(key: string, defaultValue?: T): ElementFn<HTMLElement, T> | Workflow<T>;
export function getState<T>(...args: any[]): any {
  const implementations: APIImplementation<T> = {
    directElement: () => {
      throw new Error('getState cannot be called directly on an element');
    },

    directSelector: () => {
      throw new Error('getState cannot be called with a selector');
    },

    syncGenerator: (key: string, defaultValue?: T) => {
      return (element: HTMLElement): T => {
        const stateMap = getElementStateMap(element);
        return stateMap.has(key) ? stateMap.get(key) : defaultValue;
      };
    },

    asyncGenerator: (key: string, defaultValue?: T) => {
      return (async function* (): AsyncGenerator<any, T, any> {
        const result = yield (context: WatchContext) => {
          if (!context.state) {
            return defaultValue;
          }
          return context.state.has(key) ? context.state.get(key) : defaultValue;
        };
        return result as T;
      })();
    },

    dollarWrapper: (key: string, defaultValue?: T) => {
      return implementations.asyncGenerator(key, defaultValue);
    },

    getter: () => {
      throw new Error('getState requires at least a key argument');
    }
  };

  return APIRouter.route('getState', args, implementations);
}

// ============================================================================
// Event Handling - Smart Implementation
// ============================================================================

type EventHandler = (event: Event) => void | Promise<void> | Generator<any, void, any> | AsyncGenerator<any, void, any>;

export function click(element: HTMLElement, handler: EventHandler): void;
export function click(selector: string, handler: EventHandler): void;
export function click(handler: EventHandler): ElementFn<HTMLElement> | Workflow<void>;
export function click(...args: any[]): any {
  const implementations: APIImplementation<void> = {
    directElement: (element: HTMLElement, handler: EventHandler) => {
      element.addEventListener('click', async (event) => {
        const result = handler(event);
        if (result && typeof result === 'object') {
          // Handle generator/async generator results
          if (Symbol.asyncIterator in result) {
            // Execute async generator
            for await (const _ of result) {
              // Process yielded values if needed
            }
          } else if (Symbol.iterator in result) {
            // Execute sync generator
            for (const _ of result) {
              // Process yielded values if needed
            }
          }
        }
      });
    },

    directSelector: (selector: string, handler: EventHandler) => {
      document.querySelectorAll(selector).forEach(el => {
        if (el instanceof HTMLElement) {
          implementations.directElement(el, handler);
        }
      });
    },

    syncGenerator: (handler: EventHandler) => {
      return (element: HTMLElement) => {
        implementations.directElement(element, handler);
      };
    },

    asyncGenerator: (handler: EventHandler) => {
      return (async function* () {
        yield (context: WatchContext) => {
          context.element.addEventListener('click', async (event) => {
            const result = handler(event);
            if (result && typeof result === 'object') {
              if (Symbol.asyncIterator in result) {
                // Execute with context
                for await (const operation of result) {
                  if (typeof operation === 'function') {
                    operation(context);
                  }
                }
              }
            }
          });
        };
      })();
    },

    dollarWrapper: (handler: EventHandler) => {
      return implementations.asyncGenerator(handler);
    },

    getter: () => {
      throw new Error('click requires a handler argument');
    }
  };

  return APIRouter.route('click', args, implementations);
}

// ============================================================================
// Helper Functions
// ============================================================================

// WeakMap for storing element state in sync generators
const elementStateStorage = new WeakMap<HTMLElement, Map<string, any>>();

function getElementStateMap(element: HTMLElement): Map<string, any> {
  if (!elementStateStorage.has(element)) {
    elementStateStorage.set(element, new Map());
  }
  return elementStateStorage.get(element)!;
}

// ============================================================================
// Usage Examples
// ============================================================================

/*
// Example 1: Direct element manipulation
const button = document.getElementById('myButton') as HTMLButtonElement;
text(button, 'Click me!');
addClass(button, 'primary');
style(button, { backgroundColor: 'blue', color: 'white' });

// Example 2: CSS selector manipulation
text('#myButton', 'Click me!');
addClass('#myButton', 'primary');
style('#myButton', 'backgroundColor', 'blue');

// Example 3: Old sync generator pattern
import { watch } from '../watch';

watch('#myButton', function* () {
  yield text('Click me!');
  yield addClass('primary');
  yield style({ backgroundColor: 'blue' });

  const currentText = yield text(); // Getter
  console.log('Button text:', currentText);

  yield click(function* () {
    yield text('Clicked!');
    yield addClass('clicked');
  });
});

// Example 4: New async generator pattern
watch('#myButton', async function* () {
  yield* text('Click me!');
  yield* addClass('primary');
  yield* style({ backgroundColor: 'blue' });

  const currentText = yield* getText(); // New pattern uses different function
  console.log('Button text:', currentText);

  yield* click(async function* () {
    yield* text('Clicked!');
    yield* addClass('clicked');
  });
});

// Example 5: Mixed usage (backwards compatible)
watch('.old-style', function* () {
  // Old pattern still works
  yield text('Old pattern');
  yield addClass('legacy');
});

watch('.new-style', async function* () {
  // New pattern works alongside
  yield* text('New pattern');
  yield* addClass('modern');
});
*/

// ============================================================================
// Exports
// ============================================================================

export default {
  text,
  addClass,
  style,
  setState,
  getState,
  click
};
