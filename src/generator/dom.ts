/**
 * @fileoverview Pure DOM operations for the generator submodule
 *
 * This module provides pure DOM manipulation operations that return Workflow<T>
 * directly, enabling the new `yield*` pattern without needing wrapper functions.
 * Each function returns an async generator that yields operations to be executed
 * by the watch runtime with full type safety and automatic cleanup.
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
 *   console.log(button.disabled); // TypeScript knows it's a button!
 * });
 * ```
 *
 * @example Complex DOM Manipulation
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, html, addClass, removeClass, toggleClass, style, attr } from 'watch-selector/generator';
 *
 * watch('.card', async function*() {
 *   // Text content
 *   yield* text('Loading...');
 *
 *   // HTML content (be careful with XSS!)
 *   yield* html('<strong>Welcome!</strong>');
 *
 *   // Class manipulation
 *   yield* addClass('visible animated');
 *   yield* removeClass('hidden');
 *   const isActive = yield* toggleClass('active'); // Returns new state
 *
 *   // Inline styles
 *   yield* style('color', 'blue');
 *   yield* style({
 *     backgroundColor: 'white',
 *     padding: '10px'
 *   });
 *
 *   // Attributes
 *   yield* attr('data-id', '123');
 *   yield* attr({
 *     'aria-label': 'Card component',
 *     'role': 'article'
 *   });
 * });
 * ```
 *
 * @module generator/dom
 */

import type { Workflow, WatchContext, Operation } from "../types";

// ============================================================================
// TEXT CONTENT OPERATIONS
// ============================================================================

/**
 * Sets the text content of an element using the pure generator API.
 *
 * This function returns a Workflow that can be used directly with `yield*` syntax,
 * providing a clean and type-safe way to manipulate text content within watch generators.
 * The text is automatically escaped to prevent XSS attacks. Use `html()` if you need
 * to set HTML content.
 *
 * @param content - The text content to set. Will be converted to string if not already.
 * @returns A Workflow<void> that sets the text content when yielded
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
 * @example Dynamic text updates with state
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
 * @example Conditional text based on element state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, hasClass, getAttr } from 'watch-selector/generator';
 *
 * watch('.status-indicator', async function* () {
 *   const isActive = yield* hasClass('active');
 *   const userName = yield* getAttr('data-user') || 'Guest';
 *   yield* text(`${userName}: ${isActive ? 'Online' : 'Offline'}`);
 * });
 * ```
 *
 * @example Formatting and localization
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { text, getState } from 'watch-selector/generator';
 *
 * watch('.price-display', async function* () {
 *   const price = yield* getState<number>('price', 0);
 *   const formatted = new Intl.NumberFormat('en-US', {
 *     style: 'currency',
 *     currency: 'USD'
 *   }).format(price);
 *   yield* text(formatted);
 * });
 * ```
 *
 * @see {@link html} - For setting HTML content
 * @see {@link getText} - For reading current text content
 * @see {@link appendText} - For appending to existing text
 */
export function text(content: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.textContent = content;
    }) as Operation<void>;
  })();
}

/**
 * Gets the text content of an element using the pure generator API.
 *
 * This function returns a Workflow that yields the current text content of the element.
 * It provides type-safe access to element text content within generator compositions.
 * Returns an empty string if the element has no text content.
 *
 * @returns A Workflow<string> that returns the current text content (never null)
 *
 * @example Reading and displaying text
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getText, text, click } from 'watch-selector/generator';
 *
 * watch('.editable-label', async function* () {
 *   const currentText = yield* getText();
 *   console.log('Current text:', currentText);
 *
 *   yield* click(async function* () {
 *     const oldText = yield* getText();
 *     yield* text(`Previously: ${oldText}`);
 *   });
 * });
 * ```
 *
 * @example Text validation and feedback
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getText, addClass, removeClass, attr } from 'watch-selector/generator';
 *
 * watch('.message', async function* () {
 *   const messageText = yield* getText();
 *
 *   // Style based on content
 *   if (messageText.includes('error')) {
 *     yield* addClass('error-message');
 *     yield* removeClass('success-message warning-message');
 *     yield* attr('role', 'alert');
 *   } else if (messageText.includes('success')) {
 *     yield* addClass('success-message');
 *     yield* removeClass('error-message warning-message');
 *     yield* attr('role', 'status');
 *   } else if (messageText.includes('warning')) {
 *     yield* addClass('warning-message');
 *     yield* removeClass('error-message success-message');
 *     yield* attr('role', 'alert');
 *   }
 * });
 * ```
 *
 * @example Text length monitoring
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getText, text, toggleClass } from 'watch-selector/generator';
 *
 * watch('.tweet-input', async function* () {
 *   const content = yield* getText();
 *   const remaining = 280 - content.length;
 *
 *   // Update counter
 *   const counter = yield* query('.char-counter');
 *   if (counter) {
 *     yield* text(`${remaining} characters remaining`);
 *     yield* toggleClass('over-limit', remaining < 0);
 *   }
 * });
 * ```
 *
 * @see {@link text} - For setting text content
 * @see {@link appendText} - For appending to existing text
 * @see {@link prependText} - For prepending to existing text
 */
export function getText(): Workflow<string> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.textContent || "";
    }) as Operation<string>;
    return result;
  })();
}

/**
 * Appends text to the existing content using the pure generator API.
 *
 * This function adds new text to the end of the element's existing text content,
 * providing a clean way to incrementally build up text content within generators.
 * Useful for logs, chat messages, or any content that grows over time.
 *
 * @param content - The text to append to existing content
 * @returns A Workflow<void> that appends the text when yielded
 *
 * @example Building a log display
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
    yield ((context: WatchContext) => {
      context.element.textContent += content;
    }) as Operation<void>;
  })();
}

/**
 * Prepends text to the beginning of existing content using the pure generator API.
 *
 * This function adds new text to the beginning of the element's existing text content,
 * useful for adding prefixes, timestamps, or priority messages that should appear first.
 *
 * @param content - The text to prepend to existing content
 * @returns A Workflow<void> that prepends the text when yielded
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
    yield ((context: WatchContext) => {
      context.element.textContent = content + context.element.textContent;
    }) as Operation<void>;
  })();
}

// ============================================================================
// HTML CONTENT OPERATIONS
// ============================================================================

/**
 * Sets the HTML content of an element using the pure generator API.
 *
 * This function sets the innerHTML of an element, allowing you to insert rich HTML content
 * within generator compositions.
 *
 * ⚠️ **Security Warning**: This function sets innerHTML directly. Always sanitize user input
 * to prevent XSS attacks. Consider using `text()` for user-provided content.
 *
 * @param content - The HTML content to set. Will replace all existing content.
 * @returns A Workflow<void> that sets the HTML content when yielded
 *
 * @example Setting rich HTML content (safe, hardcoded)
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
    yield ((context: WatchContext) => {
      // WARNING: Direct innerHTML assignment can introduce XSS vulnerabilities
      // Consider using text() for untrusted content to prevent XSS
      console.warn(
        "[watch-selector] Direct innerHTML assignment detected. Use text() for untrusted content to prevent XSS.",
      );
      context.element.innerHTML = content;
    }) as Operation<void>;
  })();
}

/**
 * Sets sanitized HTML content on an element using the pure generator API.
 * Removes dangerous elements and attributes to prevent XSS attacks.
 *
 * @param content - The HTML content to sanitize and set
 * @returns A Workflow<void> that sets the sanitized HTML when yielded
 *
 * @example Safe HTML from user input
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { safeHtml, getState } from 'watch-selector/generator';
 *
 * watch('.comment-display', async function* () {
 *   const userContent = yield* getState<string>('userComment');
 *   // Safely display user-generated HTML content
 *   yield* safeHtml(userContent || '');
 * });
 * ```
 *
 * @example Rendering rich text safely
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { safeHtml } from 'watch-selector/generator';
 *
 * watch('.rich-text-editor', async function* () {
 *   const richContent = '<p>Hello <script>alert("XSS")</script></p>';
 *   // Script tags and dangerous attributes are removed
 *   yield* safeHtml(richContent);
 * });
 * ```
 *
 * @see {@link html} - For trusted HTML content (with XSS warning)
 * @see {@link text} - For plain text content (automatically escaped)
 */
export function safeHtml(content: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      // Create a temporary element to parse the HTML
      const temp = document.createElement("div");
      temp.innerHTML = content;

      // Remove dangerous elements
      const dangerousElements = temp.querySelectorAll(
        "script, iframe, object, embed, link, style, meta, base",
      );
      dangerousElements.forEach((elem) => elem.remove());

      // Remove dangerous attributes
      const allElements = temp.querySelectorAll("*");
      allElements.forEach((elem) => {
        // Remove event handlers and javascript: URLs
        for (const attr of Array.from(elem.attributes)) {
          if (
            attr.name.startsWith("on") ||
            (attr.name === "href" && attr.value.startsWith("javascript:")) ||
            (attr.name === "src" && attr.value.startsWith("javascript:"))
          ) {
            elem.removeAttribute(attr.name);
          }
        }
      });

      context.element.innerHTML = temp.innerHTML;
    }) as Operation<void>;
  })();
}

/**
 * Gets the HTML content of an element using the pure generator API.
 *
 * This function returns the innerHTML of an element as a string,
 * useful for reading rich content or cloning element structures.
 *
 * @returns A Workflow<string> that returns the current HTML content
 *
 * @example Reading and cloning HTML
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getHtml, html } from 'watch-selector/generator';
 *
 * watch('.template', async function* () {
 *   const template = yield* getHtml();
 *
 *   // Clone to another element
 *   const target = yield* query('.target');
 *   if (target) {
 *     yield* html(template);
 *   }
 * });
 * ```
 *
 * @see {@link html} - For setting HTML content
 * @see {@link getText} - For getting text content only
 */
export function getHtml(): Workflow<string> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.innerHTML;
    }) as Operation<string>;
    return result;
  })();
}

/**
 * Appends HTML to the existing content using the pure generator API.
 *
 * ⚠️ **Security Warning**: Always sanitize user input to prevent XSS attacks.
 *
 * @param content - The HTML to append to existing content
 * @returns A Workflow<void> that appends the HTML when yielded
 *
 * @example Adding list items dynamically
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { appendHtml, getState } from 'watch-selector/generator';
 *
 * watch('ul.todo-list', async function* () {
 *   const todos = yield* getState<string[]>('todos', []);
 *   for (const todo of todos) {
 *     yield* appendHtml(`<li>${todo}</li>`);
 *   }
 * });
 * ```
 *
 * @see {@link html} - For replacing all HTML content
 * @see {@link prependHtml} - For prepending HTML content
 */
export function appendHtml(content: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.innerHTML += content;
    }) as Operation<void>;
  })();
}

/**
 * Prepends HTML to the beginning of existing content using the pure generator API.
 *
 * ⚠️ **Security Warning**: Always sanitize user input to prevent XSS attacks.
 *
 * @param content - The HTML to prepend to existing content
 * @returns A Workflow<void> that prepends the HTML when yielded
 *
 * @example Adding priority notifications
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prependHtml } from 'watch-selector/generator';
 *
 * watch('.notifications', async function* () {
 *   yield* prependHtml(`
 *     <div class="alert alert-urgent">
 *       <strong>Important!</strong> System maintenance scheduled.
 *     </div>
 *   `);
 * });
 * ```
 *
 * @see {@link html} - For replacing all HTML content
 * @see {@link appendHtml} - For appending HTML content
 */
export function prependHtml(content: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      // WARNING: Direct innerHTML assignment can introduce XSS vulnerabilities
      console.warn(
        "[watch-selector] Direct innerHTML assignment detected. Consider using text() for untrusted content.",
      );
      context.element.innerHTML = content + context.element.innerHTML;
    }) as Operation<void>;
  })();
}

// ============================================================================
// CLASS MANIPULATION OPERATIONS
// ============================================================================

/**
 * Adds one or more CSS classes to an element using the pure generator API.
 *
 * This function adds CSS classes to an element's classList, providing a clean way
 * to manage element styling within generator compositions. Duplicate classes are
 * automatically ignored by the browser.
 *
 * @param className - The class name(s) to add. Can be space-separated for multiple classes.
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
    yield ((context: WatchContext) => {
      context.element.classList.add(className);
    }) as Operation<void>;
  })();
}

/**
 * Removes one or more CSS classes from an element using the pure generator API.
 *
 * This function removes CSS classes from an element's classList. If a class
 * doesn't exist, the operation is safely ignored.
 *
 * @param className - The class name(s) to remove. Can be space-separated for multiple classes.
 * @returns A Workflow<void> that removes the class(es) when yielded
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
    yield ((context: WatchContext) => {
      context.element.classList.remove(className);
    }) as Operation<void>;
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
    const result = yield ((context: WatchContext) => {
      return context.element.classList.toggle(className, force);
    }) as Operation<boolean>;
    return result;
  })();
}

/**
 * Checks if an element has a specific CSS class using the pure generator API.
 *
 * @param className - The class name to check for
 * @returns A Workflow<boolean> that returns true if the class exists, false otherwise
 *
 * @example Conditional styling based on class presence
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { hasClass, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('.toggle-element', async function* () {
 *   const isExpanded = yield* hasClass('expanded');
 *
 *   if (isExpanded) {
 *     yield* removeClass('collapsed');
 *     yield* addClass('open');
 *   } else {
 *     yield* addClass('collapsed');
 *     yield* removeClass('open');
 *   }
 * });
 * ```
 */
export function hasClass(className: string): Workflow<boolean> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.classList.contains(className);
    }) as Operation<boolean>;
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
    const result = yield ((context: WatchContext) => {
      return context.element.classList.replace(oldClass, newClass);
    }) as Operation<boolean>;
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
    yield ((context: WatchContext) => {
      if (Array.isArray(classes)) {
        context.element.className = classes.join(" ");
      } else {
        context.element.className = classes;
      }
    }) as Operation<void>;
  })();
}

// ============================================================================
// STYLE MANIPULATION OPERATIONS
// ============================================================================

/**
 * Sets CSS style properties on an element using the pure generator API.
 *
 * This function provides a type-safe way to manipulate inline styles on elements.
 * Supports both individual property setting and batch style updates via an object.
 * CSS property names can use either camelCase or kebab-case notation.
 *
 * @param property - The CSS property name (camelCase or kebab-case)
 * @param value - The value to set for the property
 * @returns A Workflow<void> that sets the style(s) when yielded
 *
 * @overload
 * @param styles - An object mapping CSS properties to their values
 * @returns A Workflow<void> that sets all the styles when yielded
 *
 * @example Basic style setting
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { style, click } from 'watch-selector/generator';
 *
 * watch('.animated-box', async function* () {
 *   // Single property
 *   yield* style('backgroundColor', 'blue');
 *   yield* style('padding', '20px');
 *
 *   // Kebab-case also works
 *   yield* style('font-size', '16px');
 * });
 * ```
 *
 * @example Batch style updates
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { style, click } from 'watch-selector/generator';
 *
 * watch('.theme-toggle', async function* () {
 *   yield* click(async function* () {
 *     // Set multiple styles at once
 *     yield* style({
 *       backgroundColor: '#1a1a1a',
 *       color: 'white',
 *       borderRadius: '8px',
 *       transition: 'all 0.3s ease'
 *     });
 *   });
 * });
 * ```
 *
 * @example Dynamic styling based on state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { style, getState, onResize } from 'watch-selector/generator';
 *
 * watch('.responsive-element', async function* () {
 *   const isMobile = window.innerWidth < 768;
 *
 *   yield* style({
 *     display: 'flex',
 *     flexDirection: isMobile ? 'column' : 'row',
 *     gap: isMobile ? '10px' : '20px'
 *   });
 *
 *   yield* onResize(async function* () {
 *     const nowMobile = window.innerWidth < 768;
 *     yield* style('flexDirection', nowMobile ? 'column' : 'row');
 *   });
 * });
 * ```
 *
 * @example Animation with styles
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { style, delay, click } from 'watch-selector/generator';
 *
 * watch('.fade-element', async function* () {
 *   // Initial state
 *   yield* style({
 *     opacity: '0',
 *     transform: 'translateY(20px)',
 *     transition: 'all 0.5s ease'
 *   });
 *
 *   // Fade in after delay
 *   yield* delay(100);
 *   yield* style({
 *     opacity: '1',
 *     transform: 'translateY(0)'
 *   });
 * });
 * ```
 *
 * @see {@link getStyle} - For reading current style values
 * @see {@link removeStyle} - For removing style properties
 * @see {@link addClass} - For applying pre-defined CSS classes
 */
export function style(property: string, value: string): Workflow<void>;
export function style(styles: Record<string, string>): Workflow<void>;
export function style(
  propertyOrStyles: string | Record<string, string>,
  value?: string,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      if (typeof propertyOrStyles === "string" && value !== undefined) {
        (context.element.style as any)[propertyOrStyles] = value;
      } else if (typeof propertyOrStyles === "object") {
        Object.assign(context.element.style, propertyOrStyles);
      }
    }) as Operation<void>;
  })();
}

/**
 * Set a specific CSS style property
 * @param property The CSS property name
 * @param value The value to set
 * @returns Workflow that sets the style property
 */
export function setStyleProperty(
  property: string,
  value: string,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      (context.element.style as any)[property] = value;
    }) as Operation<void>;
  })();
}

/**
 * Gets a specific CSS style property value from an element.
 *
 * This function retrieves the computed or inline style value for a given CSS property.
 * Returns the current value as a string, which may be empty if the property is not set.
 *
 * @param property - The CSS property name to retrieve (camelCase or kebab-case)
 * @returns A Workflow<string> that returns the style value when yielded
 *
 * @example Reading style values
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { styleProperty, style } from 'watch-selector/generator';
 *
 * watch('.styled-element', async function* () {
 *   const currentColor = yield* styleProperty('color');
 *   const currentPadding = yield* styleProperty('padding');
 *
 *   console.log(`Current color: ${currentColor}`);
 *   console.log(`Current padding: ${currentPadding}`);
 * });
 * ```
 *
 * @example Toggling styles based on current value
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { styleProperty, style, click } from 'watch-selector/generator';
 *
 * watch('.toggle-visibility', async function* () {
 *   yield* click(async function* () {
 *     const currentDisplay = yield* styleProperty('display');
 *     yield* style('display', currentDisplay === 'none' ? 'block' : 'none');
 *   });
 * });
 * ```
 *
 * @see {@link style} - For setting style properties
 * @see {@link getStyle} - Alternative method for getting styles
 */
export function styleProperty(property: string): Workflow<string> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return getComputedStyle(context.element).getPropertyValue(property);
    }) as Operation<string>;
    return result;
  })();
}

/**
 * Removes an inline style property from an element using the pure generator API.
 *
 * This only removes inline styles set via the style attribute, not styles from stylesheets.
 *
 * @param property - The CSS property name to remove
 * @returns A Workflow<void> that removes the style property when yielded
 *
 * @example Clearing inline styles
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { removeStyle } from 'watch-selector/generator';
 *
 * watch('.reset-styles', async function* () {
 *   // Remove specific inline styles
 *   yield* removeStyle('color');
 *   yield* removeStyle('backgroundColor');
 *   yield* removeStyle('padding');
 * });
 * ```
 */
export function removeStyle(property: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      (context.element.style as any)[property] = "";
    }) as Operation<void>;
  })();
}

// ============================================================================
// ATTRIBUTE MANIPULATION OPERATIONS
// ============================================================================

/**
 * Sets HTML attributes on an element using the pure generator API.
 *
 * This function sets one or more attributes on an element. Supports both
 * individual attribute setting and batch updates via an object.
 * Setting an attribute to an empty string creates an empty attribute,
 * while removing requires using removeAttr().
 *
 * @param name - The attribute name to set
 * @param value - The value to set for the attribute
 * @returns A Workflow<void> that sets the attribute(s) when yielded
 *
 * @overload
 * @param attributes - An object mapping attribute names to their values
 * @returns A Workflow<void> that sets all the attributes when yielded
 *
 * @example Setting data attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { attr, click } from 'watch-selector/generator';
 *
 * watch('.data-element', async function* () {
 *   // Single attribute
 *   yield* attr('data-id', '12345');
 *   yield* attr('data-category', 'products');
 *
 *   // Track interactions
 *   yield* click(async function* () {
 *     const timestamp = Date.now().toString();
 *     yield* attr('data-last-clicked', timestamp);
 *   });
 * });
 * ```
 *
 * @example Setting accessibility attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { attr, hasClass } from 'watch-selector/generator';
 *
 * watch('.accessible-button', async function* () {
 *   // Batch setting ARIA attributes
 *   yield* attr({
 *     'role': 'button',
 *     'aria-label': 'Submit form',
 *     'aria-pressed': 'false',
 *     'tabindex': '0'
 *   });
 *
 *   // Update based on state
 *   const isPressed = yield* hasClass('pressed');
 *   yield* attr('aria-pressed', isPressed ? 'true' : 'false');
 * });
 * ```
 *
 * @example Dynamic attribute updates
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { attr, input, getState } from 'watch-selector/generator';
 *
 * watch('input[type="range"]', async function* () {
 *   yield* input(async function* (event) {
 *     const input = event.target as HTMLInputElement;
 *     const value = input.value;
 *
 *     // Update related attributes
 *     yield* attr({
 *       'data-value': value,
 *       'aria-valuenow': value,
 *       'title': `Current value: ${value}`
 *     });
 *   });
 * });
 * ```
 *
 * @example SEO and metadata attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { attr, getState } from 'watch-selector/generator';
 *
 * watch('article', async function* () {
 *   const metadata = yield* getState('articleMeta');
 *
 *   if (metadata) {
 *     yield* attr({
 *       'itemscope': '',
 *       'itemtype': 'https://schema.org/Article',
 *       'data-author': metadata.author,
 *       'data-published': metadata.date
 *     });
 *   }
 * });
 * ```
 *
 * @see {@link getAttr} - For reading attribute values
 * @see {@link removeAttr} - For removing attributes
 * @see {@link hasAttr} - For checking attribute existence
 * @see {@link data} - Specialized method for data-* attributes
 */
export function attr(name: string, value: string): Workflow<void>;
export function attr(attributes: Record<string, string>): Workflow<void>;
export function attr(
  nameOrAttributes: string | Record<string, string>,
  value?: string,
): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      if (typeof nameOrAttributes === "string" && value !== undefined) {
        context.element.setAttribute(nameOrAttributes, value);
      } else if (typeof nameOrAttributes === "object") {
        Object.entries(nameOrAttributes).forEach(([name, val]) => {
          context.element.setAttribute(name, val);
        });
      }
    }) as Operation<void>;
  })();
}

/**
 * Gets an attribute value from an element using the pure generator API.
 *
 * Returns the attribute value as a string, or null if the attribute doesn't exist.
 * For boolean attributes (like 'disabled', 'checked'), use `hasAttr()` instead.
 *
 * @param name - The name of the attribute to get
 * @returns A Workflow<string | null> that returns the attribute value or null
 *
 * @example Reading and using attribute values
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getAttr, text } from 'watch-selector/generator';
 *
 * watch('.product', async function* () {
 *   const productId = yield* getAttr('data-product-id');
 *   const price = yield* getAttr('data-price');
 *
 *   if (productId && price) {
 *     yield* text(`Product #${productId}: $${price}`);
 *   }
 * });
 * ```
 *
 * @example Conditional logic based on attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getAttr, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('.form-field', async function* () {
 *   const validationType = yield* getAttr('data-validate');
 *   const isRequired = yield* getAttr('required');
 *
 *   if (validationType === 'email') {
 *     yield* addClass('email-field');
 *   }
 *
 *   if (isRequired !== null) {
 *     yield* addClass('required-field');
 *   }
 * });
 * ```
 *
 * @see {@link attr} - For setting attribute values
 * @see {@link hasAttr} - For checking attribute existence
 * @see {@link removeAttr} - For removing attributes
 */
export function getAttr(name: string): Workflow<string | null> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.getAttribute(name);
    }) as Operation<string | null>;
    return result;
  })();
}

/**
 * Removes an attribute from an element using the pure generator API.
 *
 * This completely removes the attribute from the element. For boolean attributes
 * like 'disabled' or 'checked', this effectively sets them to false.
 *
 * @param name - The name of the attribute to remove
 * @returns A Workflow<void> that removes the attribute when yielded
 *
 * @example Removing form field attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { removeAttr, removeClass } from 'watch-selector/generator';
 *
 * watch('input.validated', async function* () {
 *   // Enable the field
 *   yield* removeAttr('disabled');
 *   yield* removeAttr('readonly');
 *   yield* removeClass('disabled');
 * });
 * ```
 *
 * @example Cleaning up data attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { removeAttr } from 'watch-selector/generator';
 *
 * watch('.processed-item', async function* () {
 *   // Remove temporary data attributes
 *   yield* removeAttr('data-processing');
 *   yield* removeAttr('data-temp-id');
 *   yield* removeAttr('data-validation-error');
 * });
 * ```
 *
 * @see {@link attr} - For setting attributes
 * @see {@link getAttr} - For reading attribute values
 * @see {@link hasAttr} - For checking attribute existence
 */
export function removeAttr(name: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.removeAttribute(name);
    }) as Operation<void>;
  })();
}

/**
 * Sets a DOM property on an element using the pure generator API.
 *
 * Properties are different from attributes - they represent the current state
 * of the DOM element in JavaScript. For example, 'value' is a property of input
 * elements, while 'value' as an attribute only sets the initial value.
 *
 * @param name - The name of the property to set
 * @param value - The value to set (can be any type)
 * @returns A Workflow<void> that sets the property when yielded
 *
 * @example Setting form element properties
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prop, click } from 'watch-selector/generator';
 *
 * watch('input[type="checkbox"]', async function* () {
 *   // Set checkbox state
 *   yield* prop('checked', true);
 *   yield* prop('indeterminate', true);
 *
 *   // Disable on click
 *   yield* click(async function* () {
 *     yield* prop('disabled', true);
 *   });
 * });
 * ```
 *
 * @see {@link getProp} - For reading property values
 * @see {@link attr} - For setting HTML attributes (different from properties)
 * @see {@link value} - Specialized method for form element values
 * @see {@link checked} - Specialized method for checkbox/radio checked state
 */
export function prop(name: string, value: any): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      (context.element as any)[name] = value;
    }) as Operation<void>;
  })();
}

/**
 * Gets a DOM property value from an element using the pure generator API.
 *
 * Properties are different from attributes - they represent the current state
 * of the DOM element in JavaScript. For example, 'value' is a property of input
 * elements that reflects the current value, while 'value' as an attribute only
 * sets the initial value.
 *
 * @param name - The name of the property to get
 * @returns A Workflow<any> that returns the property value
 *
 * @example Reading form element values
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getProp, text } from 'watch-selector/generator';
 *
 * watch('input[type="range"]', async function* () {
 *   const value = yield* getProp('value');
 *   const min = yield* getProp('min');
 *   const max = yield* getProp('max');
 *
 *   yield* text(`${value} (${min}-${max})`);
 * });
 * ```
 *
 * @example Reading element dimensions and positions
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getProp, style } from 'watch-selector/generator';
 *
 * watch('.scrollable', async function* () {
 *   const scrollTop = yield* getProp('scrollTop');
 *   const scrollHeight = yield* getProp('scrollHeight');
 *   const clientHeight = yield* getProp('clientHeight');
 *
 *   const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
 *
 *   yield* style('--scroll-progress', `${scrollPercentage}%`);
 * });
 * ```
 *
 * @example Checking element state properties
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getProp, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('video', async function* () {
 *   const paused = yield* getProp('paused');
 *   const muted = yield* getProp('muted');
 *   const duration = yield* getProp('duration');
 *
 *   if (paused) {
 *     yield* addClass('video-paused');
 *   } else {
 *     yield* removeClass('video-paused');
 *   }
 *
 *   console.log(`Video duration: ${duration}s, muted: ${muted}`);
 * });
 * ```
 *
 * @see {@link prop} - For setting property values
 * @see {@link getAttr} - For reading HTML attributes
 */
export function getProp(name: string): Workflow<any> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return (context.element as any)[name];
    }) as Operation<any>;
    return result;
  })();
}

/**
 * Checks if an element has a specific attribute using the pure generator API.
 *
 * This is particularly useful for boolean attributes like 'disabled', 'checked',
 * 'required', etc., where the mere presence of the attribute matters.
 *
 * @param name - The name of the attribute to check
 * @returns A Workflow<boolean> that returns true if the attribute exists
 *
 * @example Checking boolean attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { hasAttr, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('input', async function* () {
 *   const isDisabled = yield* hasAttr('disabled');
 *   const isRequired = yield* hasAttr('required');
 *   const isReadonly = yield* hasAttr('readonly');
 *
 *   if (isDisabled) {
 *     yield* addClass('field-disabled');
 *   }
 *
 *   if (isRequired) {
 *     yield* addClass('field-required');
 *   }
 * });
 * ```
 *
 * @example Feature detection
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { hasAttr, attr } from 'watch-selector/generator';
 *
 * watch('video', async function* () {
 *   const hasAutoplay = yield* hasAttr('autoplay');
 *   const hasControls = yield* hasAttr('controls');
 *
 *   if (!hasControls && !hasAutoplay) {
 *     // Add custom controls
 *     yield* attr('controls', 'true');
 *   }
 * });
 * ```
 *
 * @see {@link getAttr} - For reading attribute values
 * @see {@link attr} - For setting attributes
 * @see {@link removeAttr} - For removing attributes
 */
export function hasAttr(name: string): Workflow<boolean> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.hasAttribute(name);
    }) as Operation<boolean>;
    return result;
  })();
}

// ============================================================================
// PROPERTY MANIPULATION OPERATIONS
// ============================================================================

// ============================================================================
// DATA ATTRIBUTE OPERATIONS
// ============================================================================

/**
 * Sets a data attribute on an element using the pure generator API.
 *
 * Data attributes are a standard way to store custom data on HTML elements.
 * This function automatically adds the 'data-' prefix to the key.
 *
 * @param key - The data key (without 'data-' prefix)
 * @param value - The value to store (will be converted to string)
 * @returns A Workflow<void> that sets the data attribute when yielded
 *
 * @example Storing application state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { data, getData } from 'watch-selector/generator';
 *
 * watch('.user-card', async function* () {
 *   yield* data('user-id', '12345');
 *   yield* data('role', 'admin');
 *   yield* data('last-login', new Date().toISOString());
 * });
 * ```
 *
 * @example Storing UI state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { data, toggleClass } from 'watch-selector/generator';
 *
 * watch('.collapsible', async function* () {
 *   const isExpanded = yield* toggleClass('expanded');
 *   yield* data('expanded', isExpanded ? 'true' : 'false');
 *   yield* data('animation-state', 'complete');
 * });
 * ```
 *
 * @see {@link getData} - For reading data attributes
 * @see {@link removeData} - For removing data attributes
 * @see {@link attr} - For setting regular attributes
 */
export function data(key: string, value: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.setAttribute(`data-${key}`, value);
    }) as Operation<void>;
  })();
}

/**
 * Gets a data attribute value from an element using the pure generator API.
 *
 * Reads custom data stored in data-* attributes. The 'data-' prefix is
 * automatically added to the key.
 *
 * @param key - The data key (without 'data-' prefix)
 * @returns A Workflow<string | null> that returns the data value or null
 *
 * @example Reading and using data attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getData, addClass, text } from 'watch-selector/generator';
 *
 * watch('.product-card', async function* () {
 *   const productId = yield* getData('product-id');
 *   const price = yield* getData('price');
 *   const currency = yield* getData('currency') || 'USD';
 *
 *   if (price) {
 *     yield* text(`${currency} ${price}`);
 *   }
 * });
 * ```
 *
 * @example Configuration from data attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getData, style } from 'watch-selector/generator';
 *
 * watch('.animated-element', async function* () {
 *   const duration = yield* getData('animation-duration') || '300';
 *   const easing = yield* getData('animation-easing') || 'ease-in-out';
 *   const delay = yield* getData('animation-delay') || '0';
 *
 *   yield* style({
 *     'transition': `all ${duration}ms ${easing} ${delay}ms`
 *   });
 * });
 * ```
 *
 * @see {@link data} - For setting data attributes
 * @see {@link removeData} - For removing data attributes
 */
export function getData(key: string): Workflow<string | null> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.getAttribute(`data-${key}`);
    }) as Operation<string | null>;
    return result;
  })();
}

/**
 * Removes a data attribute from an element using the pure generator API.
 *
 * Completely removes a data-* attribute from the element. The 'data-' prefix
 * is automatically added to the key.
 *
 * @param key - The data key to remove (without 'data-' prefix)
 * @returns A Workflow<void> that removes the data attribute when yielded
 *
 * @example Cleaning up temporary data
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { removeData, removeClass } from 'watch-selector/generator';
 *
 * watch('.processed', async function* () {
 *   // Remove temporary processing data
 *   yield* removeData('processing-id');
 *   yield* removeData('processing-start');
 *   yield* removeData('processing-status');
 *   yield* removeClass('processing');
 * });
 * ```
 *
 * @see {@link data} - For setting data attributes
 * @see {@link getData} - For reading data attributes
 * @see {@link removeAttr} - For removing regular attributes
 */
export function removeData(key: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.removeAttribute(`data-${key}`);
    }) as Operation<void>;
  })();
}

// ============================================================================
// FORM VALUE OPERATIONS
// ============================================================================

/**
 * Sets the value of a form element using the pure generator API.
 *
 * This sets the 'value' property of form elements like input, textarea, and select.
 * For checkboxes and radio buttons, consider using `checked()` instead.
 *
 * @param val - The value to set (will be converted to string for most inputs)
 * @returns A Workflow<void> that sets the value when yielded
 *
 * @example Setting form field values
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { value, getState } from 'watch-selector/generator';
 *
 * watch('input[name="username"]', async function* () {
 *   const savedUsername = yield* getState<string>('username', '');
 *   yield* value(savedUsername);
 * });
 *
 * watch('textarea.bio', async function* () {
 *   yield* value('Enter your bio here...');
 * });
 * ```
 *
 * @example Dynamic form population
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { value, getData } from 'watch-selector/generator';
 *
 * watch('.form-field', async function* () {
 *   const defaultValue = yield* getData('default') || '';
 *   const savedValue = yield* getState('value', defaultValue);
 *   yield* value(savedValue);
 * });
 * ```
 *
 * @see {@link getValue} - For reading current values
 * @see {@link checked} - For checkbox/radio button state
 * @see {@link prop} - For setting other properties
 */
export function value(val: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      (context.element as any).value = val;
    }) as Operation<void>;
  })();
}

/**
 * Gets the current value of a form element using the pure generator API.
 *
 * Returns the current value property of form elements. For checkboxes and
 * radio buttons, this returns the 'value' attribute, not the checked state.
 *
 * @returns A Workflow<string> that returns the current value
 *
 * @example Reading and validating form values
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getValue, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('input[type="email"]', async function* () {
 *   const email = yield* getValue();
 *
 *   if (email && email.includes('@')) {
 *     yield* addClass('valid');
 *     yield* removeClass('invalid');
 *   } else if (email) {
 *     yield* addClass('invalid');
 *     yield* removeClass('valid');
 *   }
 * });
 * ```
 *
 * @example Syncing form values
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { getValue, value, setState } from 'watch-selector/generator';
 *
 * watch('input.synced', async function* () {
 *   const currentValue = yield* getValue();
 *   yield* setState('lastValue', currentValue);
 *
 *   // Sync to another field
 *   const mirror = yield* query('input.mirror');
 *   if (mirror) {
 *     yield* value(currentValue);
 *   }
 * });
 * ```
 *
 * @see {@link value} - For setting values
 * @see {@link isChecked} - For checkbox/radio checked state
 */
export function getValue(): Workflow<string> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return (context.element as any).value || "";
    }) as Operation<string>;
    return result;
  })();
}

/**
 * Sets the checked state of a checkbox or radio button using the pure generator API.
 *
 * This sets the 'checked' property of checkbox and radio input elements.
 * For other form elements, use `value()` instead.
 *
 * @param isChecked - Whether the element should be checked
 * @returns A Workflow<void> that sets the checked state when yielded
 *
 * @example Managing checkbox state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { checked, getState, setState } from 'watch-selector/generator';
 *
 * watch('input[type="checkbox"]#agree', async function* () {
 *   const agreed = yield* getState<boolean>('agreed', false);
 *   yield* checked(agreed);
 * });
 * ```
 *
 * @example Radio button selection
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { checked, queryAll } from 'watch-selector/generator';
 *
 * watch('.radio-group', async function* () {
 *   const radios = yield* queryAll<HTMLInputElement>('input[type="radio"]');
 *
 *   // Check the first option by default
 *   if (radios.length > 0) {
 *     yield* checked(true);
 *   }
 * });
 * ```
 *
 * @see {@link isChecked} - For reading checked state
 * @see {@link value} - For setting input values
 */
export function checked(isChecked: boolean): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      (context.element as any).checked = isChecked;
    }) as Operation<void>;
  })();
}

/**
 * Gets the checked state of a checkbox or radio button using the pure generator API.
 *
 * Returns true if the element is checked, false otherwise. Always returns
 * false for non-checkable elements.
 *
 * @returns A Workflow<boolean> that returns the checked state
 *
 * @example Conditional logic based on checkbox state
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { isChecked, show, hide } from 'watch-selector/generator';
 *
 * watch('input#show-advanced', async function* () {
 *   const showAdvanced = yield* isChecked();
 *
 *   const advancedSection = yield* query('.advanced-options');
 *   if (advancedSection) {
 *     if (showAdvanced) {
 *       yield* show();
 *     } else {
 *       yield* hide();
 *     }
 *   }
 * });
 * ```
 *
 * @example Form validation with checkboxes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { isChecked, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('form', async function* () {
 *   const termsAccepted = yield* isChecked();
 *   const privacyAccepted = yield* isChecked();
 *
 *   if (termsAccepted && privacyAccepted) {
 *     yield* removeClass('invalid');
 *   } else {
 *     yield* addClass('invalid');
 *   }
 * });
 * ```
 *
 * @see {@link checked} - For setting checked state
 * @see {@link getValue} - For reading input values
 */
export function isChecked(): Workflow<boolean> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return !!(context.element as any).checked;
    }) as Operation<boolean>;
    return result;
  })();
}

// ============================================================================
// FOCUS OPERATIONS
// ============================================================================

/**
 * Sets focus to an element using the pure generator API.
 *
 * Programmatically focuses the element, which will trigger focus events
 * and show the keyboard on mobile devices for input elements.
 *
 * @returns A Workflow<void> that focuses the element when yielded
 *
 * @example Auto-focusing form fields
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { focus, hasClass } from 'watch-selector/generator';
 *
 * watch('input.auto-focus', async function* () {
 *   yield* focus();
 * });
 *
 * watch('.error-field', async function* () {
 *   const hasError = yield* hasClass('error');
 *   if (hasError) {
 *     // Focus the first error field
 *     yield* focus();
 *   }
 * });
 * ```
 *
 * @example Sequential focus management
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { focus, getValue, blur } from 'watch-selector/generator';
 *
 * watch('input.auto-next', async function* () {
 *   const value = yield* getValue();
 *
 *   if (value.length >= 4) {  // e.g., for PIN inputs
 *     yield* blur();
 *     const next = yield* query('input.auto-next:not(:focus)');
 *     if (next) {
 *       yield* focus();
 *     }
 *   }
 * });
 * ```
 *
 * @see {@link blur} - For removing focus
 */
export function focus(): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.focus();
    }) as Operation<void>;
  })();
}

/**
 * Blur an element
 * @returns Workflow that blurs the element
 */
export function blur(): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.blur();
    }) as Operation<void>;
  })();
}

// ============================================================================
// VISIBILITY OPERATIONS
// ============================================================================

/**
 * Shows an element by setting its display property using the pure generator API.
 *
 * Removes the 'display: none' style. You can specify the display value to use
 * when showing the element (block, flex, grid, inline, etc.).
 *
 * @param displayValue - The display value to set (default: 'block')
 * @returns A Workflow<void> that shows the element when yielded
 *
 * @example Basic show/hide
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { show, hide, isChecked } from 'watch-selector/generator';
 *
 * watch('.toggleable', async function* () {
 *   const checkbox = yield* query('input[type="checkbox"]');
 *   const shouldShow = yield* isChecked();
 *
 *   if (shouldShow) {
 *     yield* show();
 *   } else {
 *     yield* hide();
 *   }
 * });
 * ```
 *
 * @example Showing with specific display values
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { show } from 'watch-selector/generator';
 *
 * watch('.flex-container', async function* () {
 *   yield* show('flex');
 * });
 *
 * watch('.grid-container', async function* () {
 *   yield* show('grid');
 * });
 *
 * watch('.inline-element', async function* () {
 *   yield* show('inline-block');
 * });
 * ```
 *
 * @see {@link hide} - For hiding elements
 * @see {@link toggle} - For toggling visibility
 * @see {@link style} - For other style manipulations
 */
export function show(displayValue: string = ""): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      if (displayValue === "") {
        context.element.style.removeProperty("display");
      } else {
        context.element.style.display = displayValue;
      }
    }) as Operation<void>;
  })();
}

/**
 * Hides an element by setting display to 'none' using the pure generator API.
 *
 * This completely hides the element from view and removes it from the document flow.
 * Use `show()` to make it visible again.
 *
 * @returns A Workflow<void> that hides the element when yielded
 *
 * @example Conditional hiding
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { hide, getData } from 'watch-selector/generator';
 *
 * watch('.conditional-element', async function* () {
 *   const shouldHide = yield* getData('hide-when');
 *   const condition = yield* getData('condition');
 *
 *   if (shouldHide === condition) {
 *     yield* hide();
 *   }
 * });
 * ```
 *
 * @see {@link show} - For showing elements
 * @see {@link toggle} - For toggling visibility
 */
export function hide(): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      context.element.style.display = "none";
    }) as Operation<void>;
  })();
}

/**
 * Toggle visibility of an element
 * @param displayValue The display value to use when showing (default: 'block')
 * @returns Workflow that returns whether the element is visible after toggle
 */
export function toggle(displayValue: string = ""): Workflow<boolean> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      const isHidden = context.element.style.display === "none";
      if (isHidden) {
        if (displayValue === "") {
          context.element.style.removeProperty("display");
        } else {
          context.element.style.display = displayValue;
        }
      } else {
        context.element.style.display = "none";
      }
      return isHidden;
    }) as Operation<boolean>;
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
    const result = yield ((context: WatchContext<El>) => {
      return context.element;
    }) as Operation<El>;
    return result;
  })();
}

/**
 * Finds a single child element matching a CSS selector using the pure generator API.
 *
 * Searches within the current element for the first descendant matching the selector.
 * Returns null if no element is found.
 *
 * @template T - The expected element type (defaults to HTMLElement)
 * @param selector - The CSS selector to search for
 * @returns A Workflow<T | null> that returns the found element or null
 *
 * @example Finding and manipulating child elements
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { query, text, addClass } from 'watch-selector/generator';
 *
 * watch('.card', async function* () {
 *   const title = yield* query<HTMLHeadingElement>('.card-title');
 *   if (title) {
 *     yield* text('Updated Title');
 *   }
 *
 *   const button = yield* query<HTMLButtonElement>('.card-action');
 *   if (button) {
 *     yield* addClass('primary');
 *   }
 * });
 * ```
 *
 * @example Conditional rendering based on child presence
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { query, addClass, removeClass } from 'watch-selector/generator';
 *
 * watch('.container', async function* () {
 *   const errorMsg = yield* query('.error-message');
 *
 *   if (errorMsg) {
 *     yield* addClass('has-error');
 *     yield* removeClass('valid');
 *   } else {
 *     yield* addClass('valid');
 *     yield* removeClass('has-error');
 *   }
 * });
 * ```
 *
 * @see {@link queryAll} - For finding all matching elements
 * @see {@link self} - For getting the current element
 */
export function query<T extends HTMLElement = HTMLElement>(
  selector: string,
): Workflow<T | null> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.querySelector<T>(selector);
    }) as Operation<T | null>;
    return result;
  })();
}

/**
 * Finds all child elements matching a CSS selector using the pure generator API.
 *
 * Searches within the current element for all descendants matching the selector.
 * Returns an empty array if no elements are found.
 *
 * @template T - The expected element type (defaults to HTMLElement)
 * @param selector - The CSS selector to search for
 * @returns A Workflow<T[]> that returns an array of found elements
 *
 * @example Processing multiple child elements
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { queryAll, addClass } from 'watch-selector/generator';
 *
 * watch('.gallery', async function* () {
 *   const images = yield* queryAll<HTMLImageElement>('img');
 *
 *   for (let i = 0; i < images.length; i++) {
 *     // Note: Operating on elements directly, not through generator
 *     images[i].loading = 'lazy';
 *     images[i].dataset.index = String(i);
 *   }
 *
 *   console.log(`Found ${images.length} images`);
 * });
 * ```
 *
 * @example Filtering and counting elements
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { queryAll, text } from 'watch-selector/generator';
 *
 * watch('.todo-list', async function* () {
 *   const allItems = yield* queryAll<HTMLLIElement>('li');
 *   const completed = yield* queryAll<HTMLLIElement>('li.completed');
 *   const pending = allItems.length - completed.length;
 *
 *   const counter = yield* query('.counter');
 *   if (counter) {
 *     yield* text(`${pending} of ${allItems.length} remaining`);
 *   }
 * });
 * ```
 *
 * @see {@link query} - For finding a single element
 * @see {@link children} - For getting direct children only
 */
export function queryAll<T extends HTMLElement = HTMLElement>(
  selector: string,
): Workflow<T[]> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return Array.from(context.element.querySelectorAll<T>(selector));
    }) as Operation<T[]>;
    return result;
  })();
}

/**
 * Gets the current element being watched using the pure generator API.
 *
 * Returns a typed reference to the element that the watch function is currently
 * processing. The type can be specified for better TypeScript support.
 *
 * @template El - The specific HTML element type (defaults to HTMLElement)
 * @returns A Workflow<El> that returns the current element
 *
 * @example Getting typed element reference
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { self } from 'watch-selector/generator';
 *
 * watch('button', async function* () {
 *   const button = yield* self<HTMLButtonElement>();
 *
 *   // TypeScript knows this is a button
 *   console.log(button.type);  // 'button' | 'submit' | 'reset'
 *   button.disabled = true;
 * });
 *
 * watch('input[type="file"]', async function* () {
 *   const fileInput = yield* self<HTMLInputElement>();
 *
 *   // Access file-specific properties
 *   const files = fileInput.files;
 *   if (files && files.length > 0) {
 *     console.log('Selected file:', files[0].name);
 *   }
 * });
 * ```
 *
 * @example Using element reference for direct manipulation
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { self, addClass } from 'watch-selector/generator';
 *
 * watch('.draggable', async function* () {
 *   const element = yield* self();
 *
 *   // Use native methods when needed
 *   element.addEventListener('dragstart', (e) => {
 *     e.dataTransfer?.setData('text/plain', element.id);
 *   });
 *
 *   yield* addClass('drag-enabled');
 * });
 * ```
 *
 * @see {@link query} - For finding child elements
 * @see {@link parent} - For getting parent element
 */
export function parent<
  T extends HTMLElement = HTMLElement,
>(): Workflow<T | null> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return context.element.parentElement as T | null;
    }) as Operation<T | null>;
    return result;
  })();
}

/**
 * Get the children elements
 * @returns Workflow that returns an array of child elements
 */
export function children<T extends HTMLElement = HTMLElement>(): Workflow<T[]> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      return Array.from(context.element.children) as T[];
    }) as Operation<T[]>;
    return result;
  })();
}

/**
 * Get the sibling elements
 * @returns Workflow that returns an array of sibling elements
 */
export function siblings<T extends HTMLElement = HTMLElement>(): Workflow<T[]> {
  return (async function* () {
    const result = yield ((context: WatchContext) => {
      const parent = context.element.parentElement;
      if (!parent) return [];
      return Array.from(parent.children).filter(
        (el) => el !== context.element,
      ) as T[];
    }) as Operation<T[]>;
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
    yield (() => {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }) as Operation<void>;
  })();
}

/**
 * Logs a message to the console along with the current element using the pure generator API.
 *
 * Useful for debugging generator workflows. The message is prefixed with '[Watch]'
 * and includes a reference to the current element.
 *
 * @param message - The message to log
 * @returns A Workflow<void> that logs when yielded
 *
 * @example Debugging workflow execution
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { log, addClass, getState } from 'watch-selector/generator';
 *
 * watch('.debug-element', async function* () {
 *   yield* log('Starting workflow');
 *
 *   const state = yield* getState('status');
 *   yield* log(`Current status: ${state}`);
 *
 *   yield* addClass('processed');
 *   yield* log('Processing complete');
 * });
 * ```
 */
export function log(message: string): Workflow<void> {
  return (async function* () {
    yield ((context: WatchContext) => {
      console.log(`[Watch] ${message}`, context.element);
    }) as Operation<void>;
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
    const result = yield fn as Operation<T>;
    return result;
  })();
}
