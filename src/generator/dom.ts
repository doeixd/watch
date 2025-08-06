/**
 * @fileoverview Pure DOM operations for the generator submodule
 *
 * This module provides pure DOM manipulation operations that return Workflow<T>
 * directly, enabling the new `yield*` pattern without needing wrapper functions.
 *
 * @example Basic Usage
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { addClass, text, self } from 'watch-selector/generator';
 *
 * watch('button', async function*() {
 *   // Direct yield* syntax - no wrapper needed!
 *   yield* addClass('interactive');
 *   yield* text('Click me!');
 *
 *   // Get the element with perfect typing
 *   const button = yield* self<HTMLButtonElement>();
 * });
 * ```
 */

import type { Workflow, WatchContext } from "../types";

// ============================================================================
// TEXT CONTENT OPERATIONS
// ============================================================================

/**
 * Set the text content of an element using the pure generator API.
 *
 * This function returns a Workflow that can be used directly with `yield*` syntax,
 * providing a clean and type-safe way to manipulate text content within watch generators.
 * Unlike the main API, this function is designed specifically for generator composition.
 *
 * @param content The text content to set
 * @returns Workflow<void> that sets the text content when yielded
 *
 * @example Basic text setting
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, addClass } from 'watch-selector/generator';
 *
 * watch('button', async function* () {
 *   yield* text('Click me!');        // Set initial text
 *   yield* addClass('interactive');   // Add styling
 * });
 * ```
 *
 * @example Dynamic text updates
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, click, getState, setState } from 'watch-selector/generator';
 *
 * watch('.counter', async function* () {
 *   let count = yield* getState<number>('count', 0);
 *   yield* text(`Count: ${count}`);
 *
 *   yield* click(async function* () {
 *     count++;
 *     yield* setState('count', count);
 *     yield* text(`Count: ${count}`);
 *   });
 * });
 * ```
 *
 * @example Conditional text content
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, hasClass } from 'watch-selector/generator';
 *
 * watch('.status-indicator', async function* () {
 *   const isActive = yield* hasClass('active');
 *   const statusText = isActive ? 'Online' : 'Offline';
 *   yield* text(statusText);
 * });
 * ```
 */
export function text(content: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.textContent = content;
      return undefined;
    };
    return result;
  })();
}

/**
 * Get the text content of an element using the pure generator API.
 *
 * This function returns a Workflow that yields the current text content of the element.
 * It provides type-safe access to element text content within generator compositions.
 *
 * @returns Workflow<string> that returns the current text content
 *
 * @example Reading current text
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getText, text, click } from 'watch-selector/generator';
 *
 * watch('.editable-label', async function* () {
 *   const currentText = yield* getText();
 *   console.log('Current text:', currentText);
 *
 *   yield* click(async function* () {
 *     const text = yield* getText();
 *     yield* text(`Clicked: ${text}`);
 *   });
 * });
 * ```
 *
 * @example Text-based conditional logic
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getText, text, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('.message', async function* () {
 *   const messageText = yield* getText();
 *
 *   if (messageText.includes('error')) {
 *     yield* addClass('error-message');
 *     yield* removeClass('success-message');
 *   } else if (messageText.includes('success')) {
 *     yield* addClass('success-message');
 *     yield* removeClass('error-message');
 *   }
 * });
 * ```
 */
export function getText(): Workflow<string> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.textContent || "";
    };
    return result;
  })();
}

/**
 * Append text to the existing content using the pure generator API.
 *
 * This function adds new text to the end of the element's existing text content,
 * providing a clean way to incrementally build up text content within generators.
 *
 * @param content The text to append
 * @returns Workflow<void> that appends the text when yielded
 *
 * @example Building up text content
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, appendText, click } from 'watch-selector/generator';
 *
 * watch('.log-display', async function* () {
 *   yield* text('Log started\n');
 *
 *   yield* click(async function* () {
 *     const timestamp = new Date().toISOString();
 *     yield* appendText(`[${timestamp}] Button clicked\n`);
 *   });
 * });
 * ```
 *
 * @example Progressive content loading
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { appendText, delay } from 'watch-selector/generator';
 *
 * watch('.typewriter', async function* () {
 *   const message = "Hello, World!";
 *
 *   for (const char of message) {
 *     yield* appendText(char);
 *     yield* delay(100); // Typewriter effect
 *   }
 * });
 * ```
 */
export function appendText(content: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.textContent += content;
      return undefined;
    };
    return result;
  })();
}

/**
 * Prepend text to the existing content using the pure generator API.
 *
 * This function adds new text to the beginning of the element's existing text content,
 * useful for adding prefixes, timestamps, or priority messages.
 *
 * @param content The text to prepend
 * @returns Workflow<void> that prepends the text when yielded
 *
 * @example Adding timestamps to messages
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prependText, getText } from 'watch-selector/generator';
 *
 * watch('.timestamped-message', async function* () {
 *   const currentText = yield* getText();
 *   if (currentText && !currentText.startsWith('[')) {
 *     const timestamp = new Date().toLocaleTimeString();
 *     yield* prependText(`[${timestamp}] `);
 *   }
 * });
 * ```
 *
 * @example Priority message system
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prependText, hasClass } from 'watch-selector/generator';
 *
 * watch('.notification', async function* () {
 *   const isUrgent = yield* hasClass('urgent');
 *   if (isUrgent) {
 *     yield* prependText('🚨 URGENT: ');
 *   }
 * });
 * ```
 */
export function prependText(content: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.textContent = content + context.element.textContent;
      return undefined;
    };
    return result;
  })();
}

// ============================================================================
// HTML CONTENT OPERATIONS
// ============================================================================

/**
 * Set the HTML content of an element using the pure generator API.
 *
 * This function sets the innerHTML of an element, allowing you to insert rich HTML content
 * within generator compositions. Use with caution and ensure content is properly sanitized
 * to prevent XSS vulnerabilities.
 *
 * @param content The HTML content to set
 * @returns Workflow<void> that sets the HTML content when yielded
 *
 * @example Setting rich HTML content
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { html, addClass } from 'watch-selector/generator';
 *
 * watch('.rich-content', async function* () {
 *   yield* html(`
 *     <div class="content-header">
 *       <h2>Welcome</h2>
 *       <p>This is <strong>rich</strong> content.</p>
 *     </div>
 *   `);
 *   yield* addClass('content-loaded');
 * });
 * ```
 *
 * @example Dynamic HTML generation
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { html, getState } from 'watch-selector/generator';
 *
 * watch('.user-profile', async function* () {
 *   const user = yield* getState('currentUser');
 *
 *   if (user) {
 *     yield* html(`
 *       <div class="profile">
 *         <img src="${user.avatar}" alt="${user.name}">
 *         <h3>${user.name}</h3>
 *         <p>${user.email}</p>
 *       </div>
 *     `);
 *   }
 * });
 * ```
 *
 * @example Template-based content
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { html, click } from 'watch-selector/generator';
 *
 * watch('.template-container', async function* () {
 *   const createListItem = (item: any) => `
 *     <li class="list-item" data-id="${item.id}">
 *       <span class="item-name">${item.name}</span>
 *       <button class="delete-btn">Delete</button>
 *     </li>
 *   `;
 *
 *   const items = [
 *     { id: 1, name: 'Item 1' },
 *     { id: 2, name: 'Item 2' }
 *   ];
 *
 *   const listHTML = `<ul>${items.map(createListItem).join('')}</ul>`;
 *   yield* html(listHTML);
 * });
 * ```
 */
export function html(content: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.innerHTML = content;
      return undefined;
    };
    return result;
  })();
}

/**
 * Get the HTML content of an element
 * @returns Workflow that returns the HTML content
 */
export function getHtml(): Workflow<string> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.innerHTML;
    };
    return result;
  })();
}

/**
 * Append HTML to the existing content
 * @param content The HTML to append
 * @returns Workflow that appends the HTML
 */
export function appendHtml(content: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.innerHTML += content;
      return undefined;
    };
    return result;
  })();
}

/**
 * Prepend HTML to the existing content
 * @param content The HTML to prepend
 * @returns Workflow that prepends the HTML
 */
export function prependHtml(content: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.innerHTML = content + context.element.innerHTML;
      return undefined;
    };
    return result;
  })();
}

// ============================================================================
// CLASS MANIPULATION OPERATIONS
// ============================================================================

/**
 * Add a CSS class to an element using the pure generator API.
 *
 * This function adds one or more CSS classes to an element, providing a clean way
 * to manage element styling within generator compositions. Supports space-separated
 * class names for adding multiple classes at once.
 *
 * @param className The class name(s) to add (can be space-separated)
 * @returns Workflow<void> that adds the class(es) when yielded
 *
 * @example Basic class addition
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { addClass, click } from 'watch-selector/generator';
 *
 * watch('button', async function* () {
 *   yield* addClass('btn btn-primary');  // Add multiple classes
 *
 *   yield* click(async function* () {
 *     yield* addClass('btn-clicked');    // Add state class
 *   });
 * });
 * ```
 *
 * @example State-based styling
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { addClass, removeClass, getState } from 'watch-selector/generator';
 *
 * watch('.status-indicator', async function* () {
 *   const status = yield* getState<string>('connectionStatus', 'offline');
 *
 *   // Clear existing status classes
 *   yield* removeClass('status-online status-offline status-connecting');
 *
 *   // Add current status class
 *   yield* addClass(`status-${status}`);
 * });
 * ```
 *
 * @example Progressive enhancement
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { addClass, onMount } from 'watch-selector/generator';
 *
 * watch('.enhanced-component', async function* () {
 *   // Add base enhancement classes
 *   yield* addClass('js-enhanced');
 *
 *   // Add feature detection classes
 *   if (typeof IntersectionObserver !== 'undefined') {
 *     yield* addClass('has-intersection-observer');
 *   }
 *
 *   if ('serviceWorker' in navigator) {
 *     yield* addClass('has-service-worker');
 *   }
 * });
 * ```
 */
export function addClass(className: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.classList.add(className);
      return undefined;
    };
    return result;
  })();
}

/**
 * Remove a CSS class from an element using the pure generator API.
 *
 * This function removes one or more CSS classes from an element, providing a clean way
 * to manage element styling within generator compositions. Supports space-separated
 * class names for removing multiple classes at once.
 *
 * @param className The class name(s) to remove (can be space-separated)
 * @returns Workflow<void> that removes the class(es) when yielded
 *
 * @example Basic class removal
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { removeClass, click } from 'watch-selector/generator';
 *
 * watch('.dismissible-alert', async function* () {
 *   yield* click(async function* () {
 *     yield* removeClass('visible active');  // Remove multiple classes
 *     yield* addClass('dismissed');          // Add dismissal state
 *   });
 * });
 * ```
 *
 * @example State cleanup
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { removeClass, addClass, input } from 'watch-selector/generator';
 *
 * watch('input[type="email"]', async function* () {
 *   yield* input(async function* (event) {
 *     const input = event.target as HTMLInputElement;
 *
 *     // Clear previous validation states
 *     yield* removeClass('valid invalid pending');
 *
 *     // Add new state based on validation
 *     if (input.checkValidity()) {
 *       yield* addClass('valid');
 *     } else {
 *       yield* addClass('invalid');
 *     }
 *   });
 * });
 * ```
 *
 * @example Animation cleanup
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { removeClass, addClass, delay } from 'watch-selector/generator';
 *
 * watch('.animated-element', async function* () {
 *   // Start animation
 *   yield* addClass('animate-in');
 *
 *   // Wait for animation to complete
 *   yield* delay(300);
 *
 *   // Clean up animation classes
 *   yield* removeClass('animate-in');
 *   yield* addClass('animation-complete');
 * });
 * ```
 */
export function removeClass(className: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.classList.remove(className);
      return undefined;
    };
    return result;
  })();
}

/**
 * Toggle a CSS class on an element using the pure generator API.
 *
 * This function toggles a CSS class on an element, optionally with a force parameter
 * to explicitly add or remove the class. Returns whether the class is present after
 * the toggle operation.
 *
 * @param className The class name to toggle
 * @param force Optional force parameter (true to add, false to remove)
 * @returns Workflow<boolean> that returns whether the class is present after toggle
 *
 * @example Basic class toggling
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { toggleClass, click } from 'watch-selector/generator';
 *
 * watch('.expandable-panel', async function* () {
 *   yield* click(async function* () {
 *     const isExpanded = yield* toggleClass('expanded');
 *     console.log('Panel is now:', isExpanded ? 'expanded' : 'collapsed');
 *   });
 * });
 * ```
 *
 * @example Forced toggle based on state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { toggleClass, getState, click } from 'watch-selector/generator';
 *
 * watch('.theme-toggle', async function* () {
 *   yield* click(async function* () {
 *     const isDarkMode = yield* getState<boolean>('darkMode', false);
 *
 *     // Force toggle based on current state
 *     yield* toggleClass('dark-theme', !isDarkMode);
 *     yield* setState('darkMode', !isDarkMode);
 *   });
 * });
 * ```
 *
 * @example Conditional styling with toggle result
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { toggleClass, addClass, removeClass, click } from 'watch-selector/generator';
 *
 * watch('.interactive-item', async function* () {
 *   yield* click(async function* () {
 *     const isSelected = yield* toggleClass('selected');
 *
 *     if (isSelected) {
 *       yield* addClass('highlight');
 *       yield* removeClass('muted');
 *     } else {
 *       yield* removeClass('highlight');
 *       yield* addClass('muted');
 *     }
 *   });
 * });
 * ```
 */
export function toggleClass(
  className: string,
  force?: boolean,
): Workflow<boolean> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.classList.toggle(className, force);
    };
    return result;
  })();
}

/**
 * Check if an element has a CSS class
 * @param className The class name to check
 * @returns Workflow that returns whether the class is present
 */
export function hasClass(className: string): Workflow<boolean> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.classList.contains(className);
    };
    return result;
  })();
}

/**
 * Replace one class with another
 * @param oldClass The class to remove
 * @param newClass The class to add
 * @returns Workflow that replaces the class
 */
export function replaceClass(
  oldClass: string,
  newClass: string,
): Workflow<boolean> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.classList.replace(oldClass, newClass);
    };
    return result;
  })();
}

/**
 * Set the entire class list of an element
 * @param classes The classes to set (space-separated string or array)
 * @returns Workflow that sets the classes
 */
export function setClasses(classes: string | string[]): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (Array.isArray(classes)) {
        context.element.className = classes.join(" ");
      } else {
        context.element.className = classes;
      }
      return undefined;
    };
    return result;
  })();
}

// ============================================================================
// STYLE MANIPULATION OPERATIONS
// ============================================================================

/**
 * Set a CSS style property on an element
 * @param property The CSS property name
 * @param value The value to set
 * @returns Workflow that sets the style
 */
export function style(property: string, value: string): Workflow<void>;
export function style(styles: Record<string, string>): Workflow<void>;
export function style(
  propertyOrStyles: string | Record<string, string>,
  value?: string,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (typeof propertyOrStyles === "string" && value !== undefined) {
        (context.element.style as any)[propertyOrStyles] = value;
      } else if (typeof propertyOrStyles === "object") {
        Object.assign(context.element.style, propertyOrStyles);
      }
      return undefined;
    };
    return result;
  })();
}

/**
 * Set a specific CSS style property
 * @param property The CSS property name
 * @param value The value to set
 * @returns Workflow that sets the style property
 */
export function styleProperty(property: string, value: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      (context.element.style as any)[property] = value;
      return undefined;
    };
    return result;
  })();
}

/**
 * Get a CSS style property value
 * @param property The CSS property name
 * @returns Workflow that returns the style value
 */
export function getStyle(property: string): Workflow<string> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return getComputedStyle(context.element).getPropertyValue(property);
    };
    return result;
  })();
}

/**
 * Remove a CSS style property
 * @param property The CSS property name
 * @returns Workflow that removes the style property
 */
export function removeStyle(property: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      (context.element.style as any)[property] = "";
      return undefined;
    };
    return result;
  })();
}

// ============================================================================
// ATTRIBUTE MANIPULATION OPERATIONS
// ============================================================================

/**
 * Set an attribute on an element
 * @param name The attribute name
 * @param value The attribute value
 * @returns Workflow that sets the attribute
 */
export function attr(name: string, value: string): Workflow<void>;
export function attr(attributes: Record<string, string>): Workflow<void>;
export function attr(
  nameOrAttributes: string | Record<string, string>,
  value?: string,
): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      if (typeof nameOrAttributes === "string" && value !== undefined) {
        context.element.setAttribute(nameOrAttributes, value);
      } else if (typeof nameOrAttributes === "object") {
        Object.entries(nameOrAttributes).forEach(([name, val]) => {
          context.element.setAttribute(name, val);
        });
      }
      return undefined;
    };
    return result;
  })();
}

/**
 * Get an attribute value
 * @param name The attribute name
 * @returns Workflow that returns the attribute value
 */
export function getAttr(name: string): Workflow<string | null> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.getAttribute(name);
    };
    return result;
  })();
}

/**
 * Remove an attribute from an element
 * @param name The attribute name
 * @returns Workflow that removes the attribute
 */
export function removeAttr(name: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.removeAttribute(name);
      return undefined;
    };
    return result;
  })();
}

/**
 * Check if an element has an attribute
 * @param name The attribute name
 * @returns Workflow that returns whether the attribute exists
 */
export function hasAttr(name: string): Workflow<boolean> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.hasAttribute(name);
    };
    return result;
  })();
}

// ============================================================================
// PROPERTY MANIPULATION OPERATIONS
// ============================================================================

/**
 * Set a property on an element
 * @param name The property name
 * @param value The property value
 * @returns Workflow that sets the property
 */
export function prop(name: string, value: any): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      (context.element as any)[name] = value;
      return undefined;
    };
    return result;
  })();
}

/**
 * Get a property value
 * @param name The property name
 * @returns Workflow that returns the property value
 */
export function getProp(name: string): Workflow<any> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return (context.element as any)[name];
    };
    return result;
  })();
}

// ============================================================================
// DATA ATTRIBUTE OPERATIONS
// ============================================================================

/**
 * Set a data attribute on an element
 * @param key The data attribute key (without 'data-' prefix)
 * @param value The data attribute value
 * @returns Workflow that sets the data attribute
 */
export function data(key: string, value: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.setAttribute(`data-${key}`, value);
      return undefined;
    };
    return result;
  })();
}

/**
 * Get a data attribute value
 * @param key The data attribute key (without 'data-' prefix)
 * @returns Workflow that returns the data attribute value
 */
export function getData(key: string): Workflow<string | null> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.getAttribute(`data-${key}`);
    };
    return result;
  })();
}

/**
 * Remove a data attribute
 * @param key The data attribute key (without 'data-' prefix)
 * @returns Workflow that removes the data attribute
 */
export function removeData(key: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.removeAttribute(`data-${key}`);
      return undefined;
    };
    return result;
  })();
}

// ============================================================================
// FORM VALUE OPERATIONS
// ============================================================================

/**
 * Set the value of a form element
 * @param val The value to set
 * @returns Workflow that sets the value
 */
export function value(val: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      (context.element as any).value = val;
      return undefined;
    };
    return result;
  })();
}

/**
 * Get the value of a form element
 * @returns Workflow that returns the value
 */
export function getValue(): Workflow<string> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return (context.element as any).value || "";
    };
    return result;
  })();
}

/**
 * Set the checked state of a checkbox or radio input
 * @param isChecked The checked state
 * @returns Workflow that sets the checked state
 */
export function checked(isChecked: boolean): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      (context.element as any).checked = isChecked;
      return undefined;
    };
    return result;
  })();
}

/**
 * Get the checked state of a checkbox or radio input
 * @returns Workflow that returns the checked state
 */
export function isChecked(): Workflow<boolean> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return !!(context.element as any).checked;
    };
    return result;
  })();
}

// ============================================================================
// FOCUS OPERATIONS
// ============================================================================

/**
 * Focus an element
 * @returns Workflow that focuses the element
 */
export function focus(): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.focus();
      return undefined;
    };
    return result;
  })();
}

/**
 * Blur an element
 * @returns Workflow that blurs the element
 */
export function blur(): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.blur();
      return undefined;
    };
    return result;
  })();
}

// ============================================================================
// VISIBILITY OPERATIONS
// ============================================================================

/**
 * Show an element by setting display style
 * @param displayValue The display value to use (default: 'block')
 * @returns Workflow that shows the element
 */
export function show(displayValue: string = "block"): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.style.display = displayValue;
      return undefined;
    };
    return result;
  })();
}

/**
 * Hide an element by setting display to none
 * @returns Workflow that hides the element
 */
export function hide(): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.style.display = "none";
      return undefined;
    };
    return result;
  })();
}

/**
 * Toggle visibility of an element
 * @param displayValue The display value to use when showing (default: 'block')
 * @returns Workflow that returns whether the element is visible after toggle
 */
export function toggle(displayValue: string = "block"): Workflow<boolean> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const isHidden = context.element.style.display === "none";
      context.element.style.display = isHidden ? displayValue : "none";
      return isHidden;
    };
    return result;
  })();
}

// ============================================================================
// ELEMENT ACCESS OPERATIONS
// ============================================================================

/**
 * Get the current element with proper typing
 * @returns Workflow that returns the current element
 */
export function self<El extends HTMLElement = HTMLElement>(): Workflow<El> {
  return (async function* () {
    const result = yield (context: WatchContext<El>) => {
      return context.element;
    };
    return result;
  })();
}

/**
 * Query for a child element
 * @param selector The CSS selector
 * @returns Workflow that returns the first matching element or null
 */
export function query<T extends HTMLElement = HTMLElement>(
  selector: string,
): Workflow<T | null> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.querySelector<T>(selector);
    };
    return result;
  })();
}

/**
 * Query for all child elements
 * @param selector The CSS selector
 * @returns Workflow that returns an array of matching elements
 */
export function queryAll<T extends HTMLElement = HTMLElement>(
  selector: string,
): Workflow<T[]> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return Array.from(context.element.querySelectorAll<T>(selector));
    };
    return result;
  })();
}

/**
 * Get the parent element
 * @returns Workflow that returns the parent element or null
 */
export function parent<
  T extends HTMLElement = HTMLElement,
>(): Workflow<T | null> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return context.element.parentElement as T | null;
    };
    return result;
  })();
}

/**
 * Get the children elements
 * @returns Workflow that returns an array of child elements
 */
export function children<T extends HTMLElement = HTMLElement>(): Workflow<T[]> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      return Array.from(context.element.children) as T[];
    };
    return result;
  })();
}

/**
 * Get the sibling elements
 * @returns Workflow that returns an array of sibling elements
 */
export function siblings<T extends HTMLElement = HTMLElement>(): Workflow<T[]> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      const parent = context.element.parentElement;
      if (!parent) return [];
      return Array.from(parent.children).filter(
        (el) => el !== context.element,
      ) as T[];
    };
    return result;
  })();
}

// ============================================================================
// UTILITY OPERATIONS
// ============================================================================

/**
 * Delay execution for a specified amount of time
 * @param ms The delay in milliseconds
 * @returns Workflow that completes after the delay
 */
export function delay(ms: number): Workflow<void> {
  return (async function* () {
    const result = yield () => {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    };
    return result;
  })();
}

/**
 * Log a message to the console with the current element context
 * @param message The message to log
 * @returns Workflow that logs the message
 */
export function log(message: string): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      console.log(`[Watch] ${message}`, context.element);
      return undefined;
    };
    return result;
  })();
}

/**
 * Run a custom function with the current context
 * @param fn The function to run
 * @returns Workflow that runs the function and returns its result
 */
export function run<T>(
  fn: (context: WatchContext) => T | Promise<T>,
): Workflow<T> {
  return (async function* () {
    const result = yield fn;
    return result;
  })();
}
