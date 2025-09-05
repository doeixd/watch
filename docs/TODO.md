












src/generator/dom.ts
Comment on lines +2349 to +2410
/**
 * Logs a message to the console using the pure generator API.
 *
 * This function provides a convenient way to add debugging output within
 * generator workflows. The message can include information about the current
 * element and state.
 *
 * @param message - The message to log to the console
 * @returns A Workflow<void> that logs the message when yielded
 *
 * @example Basic logging
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { log, addClass, getState } from 'watch-selector/generator';
 *
 * watch('.debug-element', async function* () {
 *   yield* log('Starting element processing');
 *
 *   yield* addClass('processing');
 *   yield* log('Added processing class');
 *
 *   const state = yield* getState('data');
 *   yield* log(`Current state: ${JSON.stringify(state)}`);
 * });
 * ```
 *
 * @example Logging with element info
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { log, self, getAttr } from 'watch-selector/generator';
 *
 * watch('[data-component]', async function* () {
 *   const element = yield* self();
 *   const componentType = yield* getAttr('data-component');
 *
 *   yield* log(`Processing component: ${componentType}`);
 *   yield* log(`Element ID: ${element.id || 'no-id'}`);
 *   yield* log(`Classes: ${element.className}`);
 * });
 * ```
 *
 * @example Conditional logging
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { log, hasClass, getState } from 'watch-selector/generator';
 *
 * const DEBUG = true; // Toggle for debugging
 *
 * watch('.interactive', async function* () {
 *   if (DEBUG) {
 *     const isActive = yield* hasClass('active');
 *     yield* log(`Element active state: ${isActive}`);
 *
 *     const clickCount = yield* getState('clicks', 0);
 *     yield* log(`Click count: ${clickCount}`);
 *   }
 * });
 * ```
 *
 * @see {@link run} - For running arbitrary functions
 * @see {@link delay} - For adding timing to workflows
 */
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Duplicate log function definitions

There are two log function definitions - one at line 2327 and another at line 2349. Both have similar functionality but the second one appears to be a duplicate with extended documentation.

Remove the duplicate definition. Keep only one log function:

-/**
- * Logs a message to the console using the pure generator API.
- *
- * This function provides a convenient way to add debugging output within
- * generator workflows. The message can include information about the current
- * element and state.
- *
- * @param message - The message to log to the console
- * @returns A Workflow<void> that logs the message when yielded
- *
- * @example Basic logging
- * ```typescript
- * import { watch } from 'watch-selector';
- * import { log, addClass, getState } from 'watch-selector/generator';
- *
- * watch('.debug-element', async function* () {
- *   yield* log('Starting element processing');
- *
- *   yield* addClass('processing');
- *   yield* log('Added processing class');
- *
- *   const state = yield* getState('data');
- *   yield* log(`Current state: ${JSON.stringify(state)}`);
- * });
- * ```
- *
- * @example Logging with element info
- * ```typescript
- * import { watch } from 'watch-selector';
- * import { log, self, getAttr } from 'watch-selector/generator';
- *
- * watch('[data-component]', async function* () {
- *   const element = yield* self();
- *   const componentType = yield* getAttr('data-component');
- *
- *   yield* log(`Processing component: ${componentType}`);
- *   yield* log(`Element ID: ${element.id || 'no-id'}`);
- *   yield* log(`Classes: ${element.className}`);
- * });
- * ```
- *
- * @example Conditional logging
- * ```typescript
- * import { watch } from 'watch-selector';
- * import { log, hasClass, getState } from 'watch-selector/generator';
- *
- * const DEBUG = true; // Toggle for debugging
- *
- * watch('.interactive', async function* () {
- *   if (DEBUG) {
- *     const isActive = yield* hasClass('active');
- *     yield* log(`Element active state: ${isActive}`);
- *
- *     const clickCount = yield* getState('clicks', 0);
- *     yield* log(`Click count: ${clickCount}`);
- *   }
- * });
- * ```
- *
- * @see {@link run} - For running arbitrary functions
- * @see {@link delay} - For adding timing to workflows
- */
🤖 Prompt for AI Agents
In src/generator/dom.ts around lines 2349–2410 there is a duplicate `log`
function and extended JSDoc that repeats the implementation already defined near
line 2327; remove the duplicate block (lines 2349–2410) and keep the original
`log` definition at ~2327, ensuring you delete both the duplicate JSDoc and
function implementation, update any nearby exports if necessary so only the
single `log` remains exported, and run TypeScript build/tests to confirm no
references were broken.


---


docs/QUICK-REFERENCE.md
Outdated
Comment on lines 128 to 132
// Get related elements
const parent = parentDOM(element);
const children = childrenDOM(element);
const siblings = siblingsDOM(element);
```
@coderabbitai coderabbitai bot 54 minutes ago
🛠️ Refactor suggestion

Inconsistent naming: use parent/children/siblings (not parentDOM/childrenDOM/siblingsDOM)

The main API reference (README “DOM Traversal”) uses parent, children, siblings. Align the quick reference to avoid confusion.

Apply:

-const parent = parentDOM(element);
-const children = childrenDOM(element);
-const siblings = siblingsDOM(element);
+const parent = parent(element);
+const children = children(element);
+const siblings = siblings(element);
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
// Get related elements
const parent = parentDOM(element);
const children = childrenDOM(element);
const siblings = siblingsDOM(element);
```
// Get related elements
const parent = parent(element);
const children = children(element);
const siblings = siblings(element);
🤖 Prompt for AI Agents
In docs/QUICK-REFERENCE.md around lines 128 to 132, the quick-reference code
uses parentDOM/childrenDOM/siblingsDOM which is inconsistent with the main API
names; update those identifiers to parent, children, and siblings respectively
(and any matching references in that small code block) so the quick reference
matches the README "DOM Traversal" naming.
@doeixd	Reply...
 doeixd marked this conversation as resolved.
docs/QUICK-REFERENCE.md
Comment on lines +246 to +261
const count = getState('count', 0); // with default
const user = getState('user');

// Set state
setState('count', 42);
setState('user', { name: 'John' });

// Update state
updateState('count', (current = 0) => current + 1);

// Check state
if (hasState('initialized')) { }

// Delete state
deleteState('count');
```
@coderabbitai coderabbitai bot 54 minutes ago
💡 Verification agent

🧩 Analysis chain
Align getState signature to include optional default value
The code and tests clearly support a second defaultValue parameter (e.g. getState('nonexistent', 'default')), but the API table in README.md only shows (key, ctx?) => T. Please update the signature everywhere to (key, defaultValue?, ctx?) => T.

• README.md (around line 2537): change
├─ from: | getState | (key, ctx?) => T
└─ to: | getState | (key, defaultValue?, ctx?) => T
• TypeScript definitions (e.g. index.d.ts or wherever getState is declared): add the defaultValue? overload before ctx?.
• No change needed in docs/QUICK-REFERENCE.md examples (they already show the default-value usage).

@doeixd	Reply...
docs/QUICK-REFERENCE.md
Outdated
Comment on lines 403 to 410
// Basic scoped watch
const watcher = scopedWatch('#container', '.item', function* () {
  yield addClass('found');
});

// Stop watching
watcher.disconnect();

@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Correct scopedWatch signature: first arg should be a parent element, not a selector string

Earlier docs specify scopedWatch(parent: Element, selector: string, ...). Using a selector string for parent is misleading.

Use an element reference:

-const watcher = scopedWatch('#container', '.item', function* () {
+const container = document.querySelector('#container')!;
+const watcher = scopedWatch(container, '.item', function* () {
📝 Committable suggestion
🤖 Prompt for AI Agents
In docs/QUICK-REFERENCE.md around lines 403 to 410, the example uses a selector
string as the first arg to scopedWatch but the correct signature expects a
parent Element; update the example and text to pass an Element (e.g.,
document.querySelector('#container') or document.getElementById('container')) as
the first argument, and change the surrounding explanation to state
scopedWatch(parent: Element, selector: string, ...) so readers know to supply an
Element reference instead of a selector string.
@doeixd	Reply...
 doeixd marked this conversation as resolved.
docs/TYPES.md
Outdated
Comment on lines 137 to 145
### `GeneratorFunction<El>`

Generator function type with element context.

```typescript
type GeneratorFunction<El extends HTMLElement = HTMLElement> = 
  (this: El) => Generator<any, void, any>;
```

@coderabbitai coderabbitai bot 54 minutes ago
🛠️ Refactor suggestion

Avoid naming collision with built-in GeneratorFunction

Defining a type alias named GeneratorFunction can be confused with the JS/TS built-in. Prefer a unique name like GeneratorFn.

-### `GeneratorFunction<El>`
+### `GeneratorFn<El>`
@@
- type GeneratorFunction<El extends HTMLElement = HTMLElement> = 
+ type GeneratorFn<El extends HTMLElement = HTMLElement> = 
   (this: El) => Generator<any, void, any>;
Also update any references in this doc from GeneratorFunction to GeneratorFn.

📝 Committable suggestion
🤖 Prompt for AI Agents
In docs/TYPES.md around lines 137 to 145, the type alias is named
GeneratorFunction which collides/confuses with the JS/TS built-in; rename the
alias to GeneratorFn (e.g., GeneratorFn<El extends HTMLElement = HTMLElement>)
and update every reference in this file from GeneratorFunction to GeneratorFn to
avoid ambiguity and naming collisions.
@doeixd	Reply...
 doeixd marked this conversation as resolved.
docs/TYPES.md
Comment on lines +724 to +742
### `DualAPI<El>`

API object with dual-mode functions.

```typescript
type DualAPI<El extends Element = Element> = {
  text: (content?: string | number) => void | string;
  html: (content?: string) => void | string;
  addClass: (...classes: string[]) => void;
  removeClass: (...classes: string[]) => void;
  toggleClass: (className: string, force?: boolean) => boolean;
  hasClass: (className: string) => boolean;
  style: (prop: string | object, value?: string) => void | string;
  attr: (name: string, value?: string | number | boolean) => void | string | null;
  prop: <K extends keyof El>(name: K, value?: El[K]) => void | El[K];
  data: (key: string, value?: any) => void | string | DOMStringMap;
  // ... more methods
};
```
@coderabbitai coderabbitai bot 54 minutes ago
💡 Verification agent

🧩 Analysis chain
Align DualAPI documentation with source definition

The DualAPI shown in docs/TYPES.md (lines 724–742) defines an object with methods (text, html, etc.), but in src/types.ts it’s actually an overloaded function type:

export type DualAPI<
  DirectArgs extends readonly unknown[],
  GeneratorArgs extends readonly unknown[],
  El extends HTMLElement = HTMLElement,
  ReturnType = void,
> = {
  (...args: [...DirectArgs, El]): ReturnType;
  (...args: GeneratorArgs): ElementFn<El, ReturnType>;
};
Please update the docs to match this signature. For example:

Replace the object‐method listing with a description of the two call signatures.
Show how DirectArgs and GeneratorArgs map to parameters and return types.
Remove or revise the illustrative method list (text, html, etc.) unless those are implemented via helpers on top of the core DualAPI type.
🤖 Prompt for AI Agents
In docs/TYPES.md around lines 724–742, the DualAPI docs currently show an object
with named methods but the real type in src/types.ts is an overloaded function
type with two call signatures; update the documentation to describe the two call
signatures (DirectArgs -> returns ReturnType when called with an element, and
GeneratorArgs -> returns an ElementFn when called without an element), explain
how DirectArgs and GeneratorArgs map to parameters and return types, and remove
or clearly mark the illustrative method list (text, html, etc.) unless those are
implemented separately as helpers; keep the examples and description aligned
with the src/types.ts generic parameter names and semantics.
@doeixd	Reply...
examples/api-comparison.ts
Outdated
Comment on lines 145 to 146
    const isActive = hasClass(button1, 'active');
    toggleClass(button1, 'active', !isActive);
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Fix undefined reference error in hasClass call.

The code attempts to use hasClass without importing it. Based on the structure, it should be part of the overloaded API imports.

You need to import hasClass and toggleClass from the main module:

-import { watch, text, addClass, click, attr, style } from 'watch-selector';
+import { watch, text, addClass, click, attr, style, hasClass, toggleClass } from 'watch-selector';
📝 Committable suggestion
🤖 Prompt for AI Agents
In examples/api-comparison.ts around lines 145-146, the call to hasClass causes
an undefined reference because hasClass (and toggleClass) are not imported;
update the top-level imports to include hasClass and toggleClass from the main
module (add them to the existing import statement that brings in the overloaded
API functions) so both functions are available where used.
@doeixd	Reply...
 doeixd marked this conversation as resolved.
examples/api-comparison.ts
    yield addClass('processed');
    yield attr('data-processed', 'true');

    const text = yield text();
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Fix incorrect generator function usage.

The code tries to yield text() with no arguments, but the text operation requires a workflow/generator that yields operations, not a direct value return.

The getter pattern in the generator context should be:

-const text = yield text();
+const currentText = yield ((ctx) => ctx.element.textContent || '');
Or use the proper getter if available in the API:

-const text = yield text();
+// If a getText operation exists in the generator API
+const currentText = yield getText();
Committable suggestion skipped: line range outside the PR's diff.

🧰 Tools
🤖 Prompt for AI Agents
In examples/api-comparison.ts around line 203, the generator is yielding text()
with no arguments but the text operation expects a workflow/generator that
yields operations (or the specific getter variant) rather than a direct value;
fix this by supplying a proper generator/workflow to text (or swap to the API's
provided getter) so you yield the operation with the required generator argument
instead of calling text() with no params.
@doeixd	Reply...
examples/api-comparison.ts
Outdated
Comment on lines 307 to 311
  $cards.get().forEach(card => {
    const title = explicit.getTextFirst('.title');
    if (title && title.length > 50) {
      explicit.addClassElement(card, 'long-title');
    }
@coderabbitai coderabbitai bot 54 minutes ago
🛠️ Refactor suggestion

Verify the correct usage of getTextFirst.

The code uses explicit.getTextFirst('.title') but the context suggests it should use the card element as the scope.

The selector should be scoped to the card element:

-const title = explicit.getTextFirst('.title');
+const title = card.querySelector('.title')?.textContent;
Or if the explicit API supports element-scoped queries:

-const title = explicit.getTextFirst('.title');
+const title = explicit.getTextElement(card.querySelector('.title'));
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
  $cards.get().forEach(card => {
    const title = explicit.getTextFirst('.title');
    if (title && title.length > 50) {
      explicit.addClassElement(card, 'long-title');
    }
  $cards.get().forEach(card => {
-    const title = explicit.getTextFirst('.title');
+    const title = card.querySelector('.title')?.textContent;
    if (title && title.length > 50) {
      explicit.addClassElement(card, 'long-title');
    }
🤖 Prompt for AI Agents
In examples/api-comparison.ts around lines 307 to 311, the call to
explicit.getTextFirst('.title') is not scoped to the current card element;
change it to use the card as the query scope (for example, call
explicit.getTextFirst(card, '.title') or the equivalent element-scoped API your
library provides) so the title is read from within the card before checking
length and adding the class.
@doeixd	Reply...
 doeixd marked this conversation as resolved.
examples/explicit-fluent-demo.html
Outdated
    document.getElementById('fluent-reset-btn').addEventListener('click', () => {
      fluent.$('.fluent-item')
        .removeClass('selected', 'completed', 'fade-in')
        .text((el, i) => `Chainable Item ${i + 1}`)
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Fix the text method implementation to handle the function parameter correctly.

The text method in the fluent API at line 609 sets text content using a function (el, i) => ..., but the implementation at line 425 doesn't handle function parameters. It directly assigns the content parameter to textContent.

The fluent API's text method should be updated to handle function parameters:

 text(content) {
-  this.elements.forEach(el => el.textContent = content);
+  this.elements.forEach((el, index) => {
+    const text = typeof content === 'function' ? content(el, index) : content;
+    el.textContent = text;
+  });
   return this;
 }
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
        .text((el, i) => `Chainable Item ${i + 1}`)
text(content) {
  this.elements.forEach((el, index) => {
    const text = typeof content === 'function'
      ? content(el, index)
      : content;
    el.textContent = text;
  });
  return this;
}
🤖 Prompt for AI Agents
In examples/explicit-fluent-demo.html around line 609 (implementation at ~line
425), the fluent API text method currently assigns the content parameter
directly to textContent and doesn't handle function arguments; update the text
method so when passed a function it calls that function for each matched element
with (el, index) and uses the returned value as the text, otherwise use the
provided value as-is (coerced to string); iterate over the elements, for each
element compute value = (typeof content === 'function') ? content(el, i) :
content, then set el.textContent = value != null ? String(value) : '' so
function-based and non-string inputs are handled safely.
@doeixd	Reply...
 doeixd marked this conversation as resolved.
src/api/extra.ts
Comment on lines 19 to 26
function _createElement(renderOutput: string | HTMLElement): HTMLElement {
    if (renderOutput instanceof HTMLElement) {
        return renderOutput;
    }
    const template = document.createElement('template');
    template.innerHTML = renderOutput.trim();
    return template.content.firstChild as HTMLElement;
  if (renderOutput instanceof HTMLElement) {
    return renderOutput;
  }
  const template = document.createElement("template");
  template.innerHTML = renderOutput.trim();
  return template.content.firstChild as HTMLElement;
}
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

⚠️ XSS vulnerability in _createElement helper

The function uses innerHTML to parse HTML strings without sanitization, which can lead to XSS vulnerabilities if user-controlled content is passed.

 function _createElement(renderOutput: string | HTMLElement): HTMLElement {
   if (renderOutput instanceof HTMLElement) {
     return renderOutput;
   }
+  // WARNING: Only use with trusted content
+  // Consider sanitizing or validating the HTML string
   const template = document.createElement("template");
   template.innerHTML = renderOutput.trim();
   return template.content.firstChild as HTMLElement;
 }
Consider adding input validation or using a sanitization library for untrusted content.

📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
function _createElement(renderOutput: string | HTMLElement): HTMLElement {
    if (renderOutput instanceof HTMLElement) {
        return renderOutput;
    }
    const template = document.createElement('template');
    template.innerHTML = renderOutput.trim();
    return template.content.firstChild as HTMLElement;
  if (renderOutput instanceof HTMLElement) {
    return renderOutput;
  }
  const template = document.createElement("template");
  template.innerHTML = renderOutput.trim();
  return template.content.firstChild as HTMLElement;
}
function _createElement(renderOutput: string | HTMLElement): HTMLElement {
  if (renderOutput instanceof HTMLElement) {
    return renderOutput;
  }
  // WARNING: Only use with trusted content
  // Consider sanitizing or validating the HTML string
  const template = document.createElement("template");
  template.innerHTML = renderOutput.trim();
  return template.content.firstChild as HTMLElement;
}
🧰 Tools
🤖 Prompt for AI Agents
In src/api/extra.ts around lines 19 to 26, _createElement currently assigns
untrusted strings to template.innerHTML which creates an XSS risk; replace that
assignment with a safe parsing path: if the input is expected to be untrusted
HTML, run the string through a sanitizer (e.g., DOMPurify.sanitize) before
inserting, or alternatively treat the input as plain text and create a text node
(document.createTextNode) instead of using innerHTML; if using a sanitizer, call
DOMPurify.sanitize(renderOutput) (or your project’s approved sanitizer) then set
the sanitized HTML on the template, and ensure the function rejects or escapes
dangerously large/invalid inputs so no raw user-controlled HTML is injected.
@doeixd	Reply...
src/api/extra.ts
Comment on lines +167 to +221
  return (container: HTMLElement): void => {
    // This function sets up the watcher and runs once.
    watchState(
      selectedIdStateKey,
      (newId, oldId) => {
        const cache: Map<string | number, DiffCacheEntry<T>> | undefined =
          getState(CACHE_KEY, container);

        if (!cache) {
          console.warn(
            `watchSelection cannot find the cache for diffList. Did you yield diffList() in this container first?`,
          );
          return;
        }
    };
}

        // Deselect the old item
        if (oldId !== null && oldId !== undefined) {
          const oldEntry = cache.get(oldId);
          if (oldEntry) {
            // This is a generator function, so we yield it.
            // Since we are in a simple callback, we need to run it.
            // For simplicity in this example, we call it directly.
            // A more robust implementation might use runOn.
            removeClass(oldEntry.element, className);
          }
        }

import { getState, setState, runOn } from 'watch-selector';
import type { Workflow, WatchContext } from '../types';
        // Select the new item
        if (newId !== null && newId !== undefined) {
          const newEntry = cache.get(newId);
          if (newEntry) {
            addClass(newEntry.element, className);
          }
        }
      },
      container,
    );

    // --- Initial State ---
    // Apply the class to the initially selected item on first run.
    const currentId = getState(selectedIdStateKey, container);
    if (currentId !== null && currentId !== undefined) {
      const cache: Map<string | number, DiffCacheEntry<T>> = getState(
        CACHE_KEY,
        container,
      );
      if (cache) {
        const entry = cache.get(currentId);
        if (entry) {
          addClass(entry.element, className);
        }
      }
    }
  };
}
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Type confusion with state management functions

The code calls removeClass and addClass directly on DOM elements at lines 190 and 198, but these appear to be generator functions that should be yielded or executed in a watch context, not called directly.

-        removeClass(oldEntry.element, className);
+        oldEntry.element.classList.remove(className);
-        addClass(newEntry.element, className);
+        newEntry.element.classList.add(className);
The same issue appears at lines 216:

-        addClass(entry.element, className);
+        entry.element.classList.add(className);
🤖 Prompt for AI Agents
In src/api/extra.ts around lines 167 to 221 the review flags that removeClass
and addClass are generator-style effects and must not be invoked directly from
this non-generator callback; instead execute them via the framework runner (e.g.
wrap the calls in runOn(...) or otherwise schedule/dispatch the generator so it
runs in the reactive context). Update the three sites (the removeClass call
~line 190, the addClass call ~line 198, and the initial addClass call ~line 216)
to call runOn(() => removeClass(...)) and runOn(() => addClass(...)) (or the
project-equivalent helper), and add the necessary import for runOn at the top of
the file if missing.
@doeixd	Reply...
src/api/extra.ts
Comment on lines +425 to +447
      const rerender = () => {
        // Use runOn to execute the generator in the context of our container element
        // Note: runOn needs to be imported from the main module
        // For now, we'll comment this out as it causes circular dependencies
        // runOn(container, componentGenerator);
      };

      // Set up watchers for each dependency
      dependencies.forEach((depKey) => {
        const unwatch = watchState(depKey, (newValue, oldValue) => {
          // Avoid re-rendering if the value is the same (e.g., for object references)
          if (newValue !== oldValue) {
            rerender();
        };
    })();
}

          }
        });
        // Ensure the watcher is cleaned up when the container is removed
        // Note: cleanup needs proper context handling
      });

      // Perform the initial render
      rerender();
    };
  })();
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Broken render function implementation

The render function has critical issues:

The rerender function is defined but never actually executes the component generator (line 429 is commented out)
The state watchers don't properly handle cleanup
The initial render at line 445 calls an empty function
This function is currently non-functional. The commented-out runOn call needs to be properly implemented or the function should be marked as incomplete/experimental.

 const rerender = () => {
-  // Use runOn to execute the generator in the context of our container element
-  // Note: runOn needs to be imported from the main module
-  // For now, we'll comment this out as it causes circular dependencies
-  // runOn(container, componentGenerator);
+  throw new Error('render() is not yet implemented - runOn dependency needs resolution');
 };
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
      const rerender = () => {
        // Use runOn to execute the generator in the context of our container element
        // Note: runOn needs to be imported from the main module
        // For now, we'll comment this out as it causes circular dependencies
        // runOn(container, componentGenerator);
      };
      // Set up watchers for each dependency
      dependencies.forEach((depKey) => {
        const unwatch = watchState(depKey, (newValue, oldValue) => {
          // Avoid re-rendering if the value is the same (e.g., for object references)
          if (newValue !== oldValue) {
            rerender();
        };
    })();
}
          }
        });
        // Ensure the watcher is cleaned up when the container is removed
        // Note: cleanup needs proper context handling
      });
      // Perform the initial render
      rerender();
    };
  })();
      const rerender = () => {
        throw new Error('render() is not yet implemented - runOn dependency needs resolution');
      };
      // Set up watchers for each dependency
      dependencies.forEach((depKey) => {
        const unwatch = watchState(depKey, (newValue, oldValue) => {
          // Avoid re-rendering if the value is the same (e.g., for object references)
          if (newValue !== oldValue) {
            rerender();
          }
        });
        // Ensure the watcher is cleaned up when the container is removed
        // Note: cleanup needs proper context handling
      });
      // Perform the initial render
      rerender();
@doeixd	Reply...
src/api/tag.ts
Comment on lines +115 to +118
  return (
    typeof arg === "function" && arg.constructor.name === "GeneratorFunction"
  );
}
@coderabbitai coderabbitai bot 54 minutes ago
💡 Verification agent

🧩 Analysis chain
Replace fragile constructor.name check with existing generator detection utility

Instead of relying on arg.constructor.name === "GeneratorFunction", leverage our shared isGeneratorFunction helper for a more reliable, consistent check:

• File: src/api/tag.ts (lines 115–118)
• Add at top:

import { isGeneratorFunction } from '../type-predicates';
• Update the predicate:

 function isGeneratorBuilder(
   arg: any,
 ): arg is (ctx: TagBuilderContext<any>) => Generator {
-  return (
-    typeof arg === "function" && arg.constructor.name === "GeneratorFunction"
-  );
+  return typeof arg === "function" && isGeneratorFunction(arg);
 }
This reuses our centralized logic (in src/api/type-predicates.ts), which falls back to inspecting the function’s source if minification mangles constructor names.

🤖 Prompt for AI Agents
In src/api/tag.ts around lines 115-118, replace the fragile check that does
typeof arg === "function" && arg.constructor.name === "GeneratorFunction" with
the shared utility: import isGeneratorFunction from src/api/type-predicates at
the top, then call isGeneratorFunction(arg) in place of the constructor.name
predicate; ensure the new import path matches existing project layout
(../type-predicates) and remove the constructor.name check so generator
detection uses the centralized, minification-safe helper.
@doeixd	Reply...
src/api/tag.ts
Comment on lines +166 to +176
            const unwatch = watchState(
              v.state,
              (newVal) =>
                el.toggleAttribute(n, !!newVal) ||
                el.setAttribute(n, String(newVal)),
            );
            cleanup(unwatch, el);
            el.setAttribute(n, String(v.state.get()));
          } else {
            el.toggleAttribute(n, !!v) || el.setAttribute(n, String(v));
          }
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Potential issue with toggleAttribute logic.

The expression el.toggleAttribute(n, !!newVal) || el.setAttribute(n, String(newVal)) uses OR operator which might not work as intended. If toggleAttribute returns true (attribute was added), setAttribute won't be called. If it returns false (attribute was removed because value is falsy), then setAttribute is called with a falsy value converted to string.

         attribute: (n, v) => (el) => {
           if (isReactive(v)) {
             const unwatch = watchState(
               v.state,
-              (newVal) =>
-                el.toggleAttribute(n, !!newVal) ||
-                el.setAttribute(n, String(newVal)),
+              (newVal) => {
+                if (newVal === false || newVal === null || newVal === undefined) {
+                  el.removeAttribute(n);
+                } else {
+                  el.setAttribute(n, String(newVal));
+                }
+              }
             );
             cleanup(unwatch, el);
-            el.setAttribute(n, String(v.state.get()));
+            const initialVal = v.state.get();
+            if (initialVal !== false && initialVal !== null && initialVal !== undefined) {
+              el.setAttribute(n, String(initialVal));
+            }
           } else {
-            el.toggleAttribute(n, !!v) || el.setAttribute(n, String(v));
+            if (v === false || v === null || v === undefined) {
+              el.removeAttribute(n);
+            } else {
+              el.setAttribute(n, String(v));
+            }
           }
         },
📝 Committable suggestion
🤖 Prompt for AI Agents
In src/api/tag.ts around lines 166 to 176, the use of `el.toggleAttribute(n,
!!newVal) || el.setAttribute(n, String(newVal))` is flawed because the OR
prevents the appropriate attribute update/remove behavior; replace this
expression with explicit logic: when the value is truthy set the attribute to
the stringified value, otherwise remove the attribute (or call toggleAttribute
with false) — apply the same explicit truthy/falsey handling for the non-state
branch so attributes aren’t incorrectly set to stringified falsy values.
@doeixd	Reply...
src/api/tag.ts
Comment on lines +280 to +281
  // ... hyperscript implementation remains the same ...
  return element as HTMLElementTagNameMap[K];
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Incomplete hyperscript implementation.

The comment indicates the hyperscript implementation should continue, but it only returns an empty element without processing the arguments.

The hyperscript overload appears incomplete. It should process the args parameter to set attributes and append children. Would you like me to implement the complete hyperscript functionality?

🤖 Prompt for AI Agents
In src/api/tag.ts around lines 280-281, the hyperscript implementation currently
returns a newly created element without processing the args parameter; implement
full args handling so attributes and children are applied: iterate args and for
each item, if it's an object treat it as props — set attributes (use
setAttribute for strings), map boolean/null/undefined appropriately (remove or
skip), attach event listeners for keys starting with "on", merge style objects
into element.style, and handle dataset/className/classList specially; if an arg
is a string/number create and append a TextNode; if it's a Node or an array
recursively append nodes/children; ignore falsey booleans; ensure
functions/components are either invoked (if intended) or treated as children per
existing API; after processing all args return the element.
@doeixd	Reply...
src/explicit/dom.ts
Comment on lines +175 to +193
export function queryAllElement<K extends keyof HTMLElementTagNameMap>(
  parent: Element,
  selector: K,
): NodeListOf<HTMLElementTagNameMap[K]>;
export function queryAllElement<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  selector: K,
): NodeListOf<SVGElementTagNameMap[K]>;
export function queryAllElement<E extends Element = Element>(
  parent: Element,
  selector: string,
): NodeListOf<E>;
export function queryAllElement(
  parent: Element,
  selector: string,
): NodeListOf<Element> {
  if (!parent) return document.querySelectorAll(selector);
  return parent.querySelectorAll(selector);
}
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Inconsistent behavior when parent is null.

When parent is null, the function falls back to document.querySelectorAll(selector) instead of returning an empty NodeList. This behavior is inconsistent with other functions that return null/empty collections for null inputs.

Apply this fix for consistent null handling:

 export function queryAllElement(
   parent: Element,
   selector: string,
 ): NodeListOf<Element> {
-  if (!parent) return document.querySelectorAll(selector);
+  if (!parent) return document.createElement("div").querySelectorAll(selector);
   return parent.querySelectorAll(selector);
 }
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
export function queryAllElement<K extends keyof HTMLElementTagNameMap>(
  parent: Element,
  selector: K,
): NodeListOf<HTMLElementTagNameMap[K]>;
export function queryAllElement<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  selector: K,
): NodeListOf<SVGElementTagNameMap[K]>;
export function queryAllElement<E extends Element = Element>(
  parent: Element,
  selector: string,
): NodeListOf<E>;
export function queryAllElement(
  parent: Element,
  selector: string,
): NodeListOf<Element> {
  if (!parent) return document.querySelectorAll(selector);
  return parent.querySelectorAll(selector);
}
export function queryAllElement<K extends keyof HTMLElementTagNameMap>(
  parent: Element,
  selector: K,
): NodeListOf<HTMLElementTagNameMap[K]>;
export function queryAllElement<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  selector: K,
): NodeListOf<SVGElementTagNameMap[K]>;
export function queryAllElement<E extends Element = Element>(
  parent: Element,
  selector: string,
): NodeListOf<E>;
export function queryAllElement(
  parent: Element,
  selector: string,
): NodeListOf<Element> {
  if (!parent) return document.createElement("div").querySelectorAll(selector);
  return parent.querySelectorAll(selector);
}
🤖 Prompt for AI Agents
In src/explicit/dom.ts around lines 175 to 193, the function currently falls
back to document.querySelectorAll when parent is falsy, causing inconsistent
behavior; change the overloads and implementation to accept parent: Element |
null (or undefined) and, when parent is null/undefined, return an empty NodeList
instead of querying the document — implement this by returning
document.createElement('div').querySelectorAll(selector) (an empty NodeList) and
update the overload signatures to use parent: Element | null so callers and
types match the new null-handling behavior.
@doeixd	Reply...
src/explicit/generator-support.ts
Comment on lines +18 to +19
 */
export type Operation<T = void> = (context: WatchContext) => T;
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Type conflict with exported Operation type

The Operation type defined here conflicts with the Operation type from src/types.ts. The types have different signatures:

Here: Operation<T = void> = (context: WatchContext) => T
In src/types.ts: Operation<TReturn, El extends HTMLElement = HTMLElement> = (context: WatchContext<El>) => TReturn | Promise<TReturn>
This inconsistency could lead to type confusion and compilation errors when both types are imported.

Consider renaming this local type or aligning it with the global Operation type definition to avoid conflicts:

-export type Operation<T = void> = (context: WatchContext) => T;
+export type ExplicitOperation<T = void> = (context: WatchContext) => T;
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
 */
export type Operation<T = void> = (context: WatchContext) => T;
 */
-export type Operation<T = void> = (context: WatchContext) => T;
+export type ExplicitOperation<T = void> = (context: WatchContext) => T;
🤖 Prompt for AI Agents
In src/explicit/generator-support.ts around lines 18 to 19, the local Operation
type (Operation<T = void> = (context: WatchContext) => T) conflicts with the
Operation type declared in src/types.ts; either import and reuse the global
Operation type (preserving its generics: Operation<TReturn, El extends
HTMLElement = HTMLElement> = (context: WatchContext<El>) => TReturn |
Promise<TReturn>) or rename the local type (e.g., ExplicitOperation) and update
all local references; if you reuse the global type, adjust the signature to
accept WatchContext generics and allow Promise returns, and if you rename,
export the new name to avoid accidental collisions elsewhere.
@doeixd	Reply...
src/explicit/generator-support.ts
Comment on lines +511 to +513
export async function* delayFlow(ms: number): Workflow<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Incorrect implementation of delayFlow

The delayFlow function doesn't yield any operation for the element context. It directly awaits a promise without yielding an ElementFn, breaking the expected generator pattern.

export async function* delayFlow(ms: number): Workflow<void> {
-  await new Promise(resolve => setTimeout(resolve, ms));
+  yield (element: Element) => {
+    // The delay doesn't operate on the element, but still needs to yield a function
+    return new Promise<void>(resolve => setTimeout(resolve, ms));
+  };
}
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
export async function* delayFlow(ms: number): Workflow<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}
export async function* delayFlow(ms: number): Workflow<void> {
  yield (element: Element) => {
    // The delay doesn't operate on the element, but still needs to yield a function
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  };
}
🤖 Prompt for AI Agents
In src/explicit/generator-support.ts around lines 511-513, the delayFlow
implementation currently awaits a Promise directly and does not yield an
ElementFn as required by the Workflow generator pattern; change it to be an
async generator that yields a single ElementFn which, when invoked with the
element context, returns a Promise that resolves after the specified ms and then
completes (i.e., yield a function that performs the setTimeout-based delay and
returns void/Promise<void>), ensuring the function yields exactly that operation
and conforms to Workflow<void> typing.
@doeixd	Reply...
src/explicit/html.ts
Comment on lines +46 to +49
export function setHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.innerHTML = content;
}
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Critical: XSS vulnerability in setHtmlElement

Direct innerHTML assignment without sanitization poses a security risk. While the warning is documented, the function should provide safer alternatives or built-in sanitization.

Consider implementing sanitization or providing a safer API:

 export function setHtmlElement(element: Element, content: string): void {
   if (!element || !(element instanceof HTMLElement)) return;
+  // Option 1: Add sanitization
+  // element.innerHTML = DOMPurify.sanitize(content);
+  // Option 2: Add a warning parameter
+  // export function setHtmlElement(element: Element, content: string, unsafe = false): void {
+  //   if (!unsafe) content = sanitize(content);
   element.innerHTML = content;
 }
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
export function setHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.innerHTML = content;
}
export function setHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  // Option 1: Add sanitization
  // element.innerHTML = DOMPurify.sanitize(content);
  // Option 2: Add a warning parameter
  // export function setHtmlElement(element: Element, content: string, unsafe = false): void {
  //   if (!unsafe) content = sanitize(content);
  element.innerHTML = content;
}
🧰 Tools
🤖 Prompt for AI Agents
In src/explicit/html.ts around lines 46 to 49, the function assigns content
directly to element.innerHTML creating an XSS risk; change the API to avoid raw
innerHTML by default (use element.textContent for plain text) and provide a
safe-sanitization path if HTML must be allowed: either accept an options flag
like { allowUnsafe?: boolean } that requires explicit opt-in, or import and
apply a proven sanitizer (e.g., DOMPurify.sanitize) before assigning to
innerHTML; keep the instanceof check and return early on invalid elements, and
ensure any sanitizer is bundled/typed and documented so callers intentionally
opt into rendering HTML.
@doeixd	Reply...
src/explicit/html.ts
Comment on lines +430 to +433
export function replaceHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.outerHTML = content;
}
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Critical: outerHTML replacement needs careful handling

Replacing outerHTML will remove the element from the DOM and break any existing references or event listeners attached to it.

Consider documenting this behavior more prominently or providing alternatives:

 /**
  * Replaces an element's outer HTML.
+ * WARNING: This removes the element from DOM and breaks existing references/listeners.
+ * Consider using replaceWith() for safer element replacement.
  *
  * @param element - The element to replace
  * @param content - The new HTML
  */
 export function replaceHtmlElement(element: Element, content: string): void {
   if (!element || !(element instanceof HTMLElement)) return;
+  // Alternative: Use replaceWith with a template element
+  // const template = document.createElement('template');
+  // template.innerHTML = content;
+  // element.replaceWith(...template.content.childNodes);
   element.outerHTML = content;
 }
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
export function replaceHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  element.outerHTML = content;
}
/**
 * Replaces an element's outer HTML.
 * WARNING: This removes the element from DOM and breaks existing references/listeners.
 * Consider using replaceWith() for safer element replacement.
 *
 * @param element - The element to replace
 * @param content - The new HTML
 */
export function replaceHtmlElement(element: Element, content: string): void {
  if (!element || !(element instanceof HTMLElement)) return;
  // Alternative: Use replaceWith with a template element
  // const template = document.createElement('template');
  // template.innerHTML = content;
  // element.replaceWith(...template.content.childNodes);
  element.outerHTML = content;
}
🧰 Tools
🤖 Prompt for AI Agents
In src/explicit/html.ts around lines 430 to 433, the function unconditionally
sets element.outerHTML which removes the element from the DOM and invalidates
references and attached event listeners; update the implementation to either (a)
prominently document this destructive behavior in the function comment and
README, or (b) add an optional parameter (e.g. preserveListeners = false) and
when true avoid replacing the element node: if content represents inner markup
set element.innerHTML = content to preserve the node and its listeners,
otherwise parse the content into nodes and replace only the element's children
(or selectively merge attributes) so the original element reference and attached
event listeners remain intact; ensure input validation and update function
signature and tests accordingly.
@doeixd	Reply...
src/explicit/visibility.ts
Comment on lines +25 to +29
    element.style.display = "";

    // Remove display property to restore default
    element.style.removeProperty("display");
  }
@coderabbitai coderabbitai bot 54 minutes ago
💡 Verification agent

🧩 Analysis chain
Remove redundant display reset assignment

Setting element.style.display = "" already clears the inline display style, so you can drop one of the two operations. To align with the pattern in src/generator/dom.ts, keep the explicit removal and remove the assignment:

File: src/explicit/visibility.ts
Lines: ~25–29
-   element.style.display = "";
    // Remove display property to restore default
    element.style.removeProperty("display");
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
    element.style.display = "";
    // Remove display property to restore default
    element.style.removeProperty("display");
  }
    // Remove display property to restore default
    element.style.removeProperty("display");
  }
🤖 Prompt for AI Agents
In src/explicit/visibility.ts around lines 25 to 29, there is a redundant inline
display reset: remove the line that sets element.style.display = "" and keep the
explicit removal call element.style.removeProperty("display") so only the
removeProperty call restores the default display style.
@doeixd	Reply...
src/explicit/visibility.ts
Outdated
Comment on lines 196 to 202
      // Check if element has inline display: none
      const isHidden = element.style.display === "none";
      if (isHidden) {
        showElement(element);
      } else {
        hideElement(element);
      }
@coderabbitai coderabbitai bot 54 minutes ago
🛠️ Refactor suggestion

Consider using getComputedStyle for more robust visibility detection.

The current implementation only checks inline display: none style. Elements can be hidden through CSS classes or stylesheets, which won't be detected. Consider checking the computed style for more accurate visibility detection.

     } else {
-      // Check if element has inline display: none
-      const isHidden = element.style.display === "none";
+      // Check computed style for more accurate visibility detection
+      const computedStyle = window.getComputedStyle(element);
+      const isHidden = computedStyle.display === "none";
       if (isHidden) {
         showElement(element);
       } else {
         hideElement(element);
       }
     }
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
      // Check if element has inline display: none
      const isHidden = element.style.display === "none";
      if (isHidden) {
        showElement(element);
      } else {
        hideElement(element);
      }
      // Check computed style for more accurate visibility detection
      const computedStyle = window.getComputedStyle(element);
      const isHidden = computedStyle.display === "none";
      if (isHidden) {
        showElement(element);
      } else {
        hideElement(element);
      }
🤖 Prompt for AI Agents
In src/explicit/visibility.ts around lines 196 to 202, the code only checks
element.style.display for inline "none", which misses styles applied via CSS
rules; replace that check with the element's computed style (e.g., const
isHidden = getComputedStyle(element).display === "none") and use that boolean to
decide between showElement and hideElement; ensure you call
window.getComputedStyle in environments where window is available or guard for
SSR if necessary.
@doeixd	Reply...
 doeixd marked this conversation as resolved.
src/explicit/visibility.ts
Comment on lines +287 to +301
  if (element instanceof HTMLElement) {
    // In happy-dom, check inline styles first
    if (
      element.style.display === "none" ||
      element.style.visibility === "hidden" ||
      element.style.opacity === "0"
    ) {
      return false;
    }
    // If no inline styles hide it, consider it visible
    return true;
  }

  return true;
}
@coderabbitai coderabbitai bot 54 minutes ago • 
⚠️ Potential issue

Visibility check logic may not work correctly in all environments.

The visibility check only examines inline styles and doesn't account for CSS rules or computed styles. Additionally, checking opacity === "0" as a string might miss numeric zero values.

 export function isVisibleElement(element: Element): boolean {
   if (!element) return false;
 
   if (element instanceof HTMLElement) {
-    // In happy-dom, check inline styles first
-    if (
-      element.style.display === "none" ||
-      element.style.visibility === "hidden" ||
-      element.style.opacity === "0"
-    ) {
-      return false;
-    }
-    // If no inline styles hide it, consider it visible
-    return true;
+    // Check computed styles for accurate visibility
+    const style = window.getComputedStyle(element);
+    return !(
+      style.display === "none" ||
+      style.visibility === "hidden" ||
+      parseFloat(style.opacity) === 0
+    );
   }
 
   return true;
 }
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
  if (element instanceof HTMLElement) {
    // In happy-dom, check inline styles first
    if (
      element.style.display === "none" ||
      element.style.visibility === "hidden" ||
      element.style.opacity === "0"
    ) {
      return false;
    }
    // If no inline styles hide it, consider it visible
    return true;
  }
  return true;
}
export function isVisibleElement(element: Element): boolean {
  if (!element) return false;
  if (element instanceof HTMLElement) {
    // Check computed styles for accurate visibility
    const style = window.getComputedStyle(element);
    return !(
      style.display === "none" ||
      style.visibility === "hidden" ||
      parseFloat(style.opacity) === 0
    );
  }
  return true;
}
🤖 Prompt for AI Agents
In src/explicit/visibility.ts around lines 287 to 301, the current branch only
checks inline styles (and compares opacity as the string "0"), which misses CSS
rules and numeric values; update the logic to use
window.getComputedStyle(element) when available to read display, visibility, and
opacity (use parseFloat or numeric comparison for opacity === 0), falling back
to the existing inline-style checks for environments without getComputedStyle
(e.g., happy-dom); return false if computed or inline display === "none" or
visibility === "hidden" or opacity (numeric) === 0, otherwise return true.
✅ Addressed in commits fd51903 to 9d2a948

@doeixd	Reply...
 coderabbitai[bot] marked this conversation as resolved.
src/fluent/generator.ts
Comment on lines +54 to +60
  html(content: string): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        element.innerHTML = content;
      }
    });
    return this;
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

⚠️ Potential XSS vulnerability with innerHTML assignment

Direct HTML content assignment using innerHTML can lead to XSS vulnerabilities if the content contains unsanitized user input. Consider using safer alternatives or document the security implications.

 html(content: string): FluentGeneratorSelector<El> {
   this.operations.push((element) => {
     if (element instanceof HTMLElement) {
+      // WARNING: Only use with trusted content. Consider using textContent for user input.
       element.innerHTML = content;
     }
   });
   return this;
 }
Consider adding a separate method for safe HTML updates or integrating a sanitization library like DOMPurify.

📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
  html(content: string): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        element.innerHTML = content;
      }
    });
    return this;
  html(content: string): FluentGeneratorSelector<El> {
    this.operations.push((element) => {
      if (element instanceof HTMLElement) {
        // WARNING: Only use with trusted content. Consider using textContent for user input.
        element.innerHTML = content;
      }
    });
    return this;
  }
🧰 Tools
🤖 Prompt for AI Agents
In src/fluent/generator.ts around lines 54 to 60, the method assigns raw HTML to
element.innerHTML which can introduce XSS; replace this unsafe behavior by
either using element.textContent for plain text updates or add a separate
htmlUnsafe/htmlSafe split: keep existing html (rename to htmlUnsafe) only if
intentionally required and clearly documented, and add a new html(content:
string) implementation that sanitizes input before assignment (e.g., integrate
DOMPurify.sanitize(content) or another approved sanitizer) and update
types/comments to reflect the security guarantee; ensure you add unit tests and
a short comment documenting the security implications and intended usage of each
method.
@doeixd	Reply...
src/fluent/generator.ts
Comment on lines +313 to +327
  if(condition: (element: El) => boolean): FluentGeneratorSelector<El> {
    const originalOps = [...this.operations];
    this.operations = [];

    const conditionalOp = (element: El) => {
      if (condition(element)) {
        for (const op of originalOps) {
          op(element);
        }
      }
    };

    this.operations.push(conditionalOp);
    return this;
  }
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Logic issue with conditional chain operation

The if method modifies the operations array but doesn't properly handle subsequent chaining. After calling if(), any further chained methods will be wrapped in the same conditional check, which may not be the intended behavior.

The current implementation replaces all operations with a single conditional operation. This means:

gen().addClass('foo').if(condition).addClass('bar').flow()
Would only conditionally apply 'foo' but always apply 'bar', which is counterintuitive.

Consider implementing conditional branching that preserves the chain context:

 if(condition: (element: El) => boolean): FluentGeneratorSelector<El> {
-  const originalOps = [...this.operations];
-  this.operations = [];
-
-  const conditionalOp = (element: El) => {
-    if (condition(element)) {
-      for (const op of originalOps) {
-        op(element);
-      }
-    }
-  };
-
-  this.operations.push(conditionalOp);
+  const wrappedOp = (element: El) => {
+    if (condition(element)) {
+      // Only execute operations added after this if() call
+      return true;
+    }
+    return false;
+  };
+  this.operations.push(wrappedOp);
   return this;
 }
🤖 Prompt for AI Agents
In src/fluent/generator.ts around lines 313 to 327, the current if()
implementation replaces this.operations causing later chained calls to be
unconditionally applied; instead capture the current operations as a base,
create a new temporary array (futureOps) to collect operations added after if(),
and push a single conditional wrapper into the original operations that, when
executed, will run only the futureOps if the condition is true; set
this.operations to the futureOps so subsequent chained calls append there, and
return this so chaining works as expected.
@doeixd	Reply...
src/fluent/generator.ts
Comment on lines +345 to +360
  find(selector: string): FluentGeneratorSelector<El> {
    const originalOps = [...this.operations];
    this.operations = [];

    const findOp = (element: El) => {
      const children = element.querySelectorAll(selector);
      children.forEach((child) => {
        for (const op of originalOps) {
          op(child as El);
        }
      });
    };

    this.operations.push(findOp);
    return this;
  }
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Similar logic issue with find() method

The find() method has the same issue as if() - it replaces all previous operations instead of properly composing them. This breaks the fluent chain semantics.

gen().addClass('parent-class').find('.child').addClass('child-class').flow()
Would not add 'parent-class' to the parent element as expected.

🤖 Prompt for AI Agents
In src/fluent/generator.ts around lines 345-360, the find() method clears
this.operations and thus removes previously registered ops (so earlier ops like
addClass on the parent are lost). Instead of resetting this.operations, capture
the current operations as originalOps, push a new findOp onto the operations
list that first runs originalOps on the current element (preserving parent
behavior) and then queries selector and runs the later/child-specific operations
on matched children; implement this by capturing originalOps and creating a
separate childOps array for operations added after the find call (or by using a
closure that runs only the subsequent operations when the findOp executes), then
leave the operations array intact except for appending the findOp so fluent
chaining composes rather than replaces operations.
@doeixd	Reply...
src/fluent/generator.ts
Comment on lines +379 to +384
  delay(ms: number): FluentGeneratorSelector<El> {
    this.operations.push(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
    return this;
  }
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Async operation in synchronous context

The delay method adds an async function to the operations array, but the operations are executed synchronously in the flow() method. This will not work as intended.

 delay(ms: number): FluentGeneratorSelector<El> {
-  this.operations.push(async () => {
-    await new Promise((resolve) => setTimeout(resolve, ms));
-  });
+  // Note: delay requires special handling in flow() to work properly
+  this.operations.push((element) => {
+    // This would need to be handled asynchronously in flow()
+    return new Promise((resolve) => setTimeout(resolve, ms));
+  });
   return this;
 }
The flow() method would need to be updated to handle Promise-returning operations.

📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
  delay(ms: number): FluentGeneratorSelector<El> {
    this.operations.push(async () => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    });
    return this;
  }
  delay(ms: number): FluentGeneratorSelector<El> {
    // Note: delay requires special handling in flow() to work properly
    this.operations.push((element) => {
      // This would need to be handled asynchronously in flow()
      return new Promise((resolve) => setTimeout(resolve, ms));
    });
    return this;
  }
🤖 Prompt for AI Agents
In src/fluent/generator.ts around lines 379 to 384, the delay method pushes an
async operation (returns a Promise) but flow() currently runs operations
synchronously; update flow() to support Promise-returning operations by making
flow async and awaiting each operation as you execute them (e.g. iterate
operations with for...of and await op()), and update flow's return
type/signature to return a Promise of its previous return type; alternatively
ensure operations are normalized to functions that always return a Promise and
adjust any callers to await flow().
@doeixd	Reply...
src/fluent/index.ts
Comment on lines +103 to +110
  html(content: string): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.innerHTML = content;
      }
    });
    return this;
  }
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Critical: Potential XSS vulnerability with innerHTML assignment

Setting HTML content via innerHTML without sanitization can lead to Cross-Site Scripting (XSS) vulnerabilities if the content contains untrusted user input.

While the JSDoc warning is present, consider implementing sanitization or providing a safer alternative:

 html(content: string): FluentSelector<El> {
   this.elements.forEach((el) => {
     if (el instanceof HTMLElement) {
+      // Consider adding sanitization here or documenting safe usage patterns
+      // e.g., using a library like DOMPurify: DOMPurify.sanitize(content)
       el.innerHTML = content;
     }
   });
   return this;
 }
Consider:

Integrating a sanitization library like DOMPurify
Providing a separate safeHtml() method that sanitizes by default
Adding runtime warnings when potentially dangerous content is detected
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
  html(content: string): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.innerHTML = content;
      }
    });
    return this;
  }
  html(content: string): FluentSelector<El> {
    this.elements.forEach((el) => {
      if (el instanceof HTMLElement) {
        // Consider adding sanitization here or documenting safe usage patterns
        // e.g., using a library like DOMPurify: DOMPurify.sanitize(content)
        el.innerHTML = content;
      }
    });
    return this;
  }
🧰 Tools
🤖 Prompt for AI Agents
In src/fluent/index.ts around lines 103 to 110, the html() method assigns
untrusted content directly to innerHTML which can introduce XSS; update the
implementation to sanitize content before assignment (e.g., import and call a
sanitizer such as DOMPurify.sanitize(content)) or add a new safeHtml() method
that performs sanitization and keep html() as an explicit-unsafe API with a
runtime console.warn about potential XSS; ensure sanitized output is used for
all HTMLElement.innerHTML assignments and document the dependency and behavior.
@doeixd	Reply...
src/generator/dom.ts
Comment on lines +1206 to 1217
 * @see {@link getProp} - For reading property values
 * @see {@link attr} - For setting HTML attributes (different from properties)
 * @see {@link value} - Specialized method for form element values
 * @see {@link checked} - Specialized method for checkbox/radio checked state
 */
export function removeAttr(name: string): Workflow<void> {
export function prop(name: string, value: any): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.removeAttribute(name);
      return undefined;
    };
    return result;
    yield ((context: WatchContext) => {
      (context.element as any)[name] = value;
    }) as Operation<void>;
  })();
}
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Function signature mismatch: prop vs removeAttr

The documentation for the prop function is incorrect - it describes removing attributes, but the function actually sets properties. This appears to be documentation copied from removeAttr.

The JSDoc documentation doesn't match the function implementation. Update the documentation to reflect that this function sets properties:

/**
- * Removes an attribute from an element using the pure generator API.
- *
- * This completely removes the attribute from the element. For boolean attributes
- * like 'disabled' or 'checked', this effectively sets them to false.
+ * Sets a DOM property on an element using the pure generator API.
+ *
+ * Properties are different from attributes - they represent the current state
+ * of the DOM element in JavaScript. For example, 'value' is a property of input
+ * elements, while 'value' as an attribute only sets the initial value.
  *
- * @param name - The name of the attribute to remove
- * @returns A Workflow<void> that removes the attribute when yielded
+ * @param name - The name of the property to set
+ * @param value - The value to set (can be any type)
+ * @returns A Workflow<void> that sets the property when yielded
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
 * @see {@link getProp} - For reading property values
 * @see {@link attr} - For setting HTML attributes (different from properties)
 * @see {@link value} - Specialized method for form element values
 * @see {@link checked} - Specialized method for checkbox/radio checked state
 */
export function removeAttr(name: string): Workflow<void> {
export function prop(name: string, value: any): Workflow<void> {
  return (async function* () {
    const result = yield (context: WatchContext) => {
      context.element.removeAttribute(name);
      return undefined;
    };
    return result;
    yield ((context: WatchContext) => {
      (context.element as any)[name] = value;
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
🤖 Prompt for AI Agents
In src/generator/dom.ts around lines 1206 to 1217, the JSDoc above the prop
function incorrectly describes removing attributes (likely copied from
removeAttr); update the comment to state that prop sets DOM element properties,
adjust the summary and description to match the implementation, remove or
correct any references to removing attributes, and ensure @see tags reference
related helpers (getProp, attr, value, checked) appropriately so the docs
accurately reflect that prop assigns a property on the element.
@doeixd	Reply...
src/generator/dom.ts
Comment on lines 1219 to 1257
/**
 * Check if an element has an attribute
 * @param name The attribute name
 * @returns Workflow that returns whether the attribute exists
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
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Duplicate documentation for removeAttr function

Lines 1219-1257 contain documentation for removeAttr, but the actual function definition is at line 1258. The documentation between lines 1206-1217 also claims to be for removing attributes but is attached to the prop function.

Remove the duplicate/misplaced documentation and ensure each function has the correct documentation:

-/**
- * Removes an attribute from an element using the pure generator API.
- *
- * This completely removes the attribute from the element. For boolean attributes
- * like 'disabled' or 'checked', this effectively sets them to false.
- *
- * @param name - The name of the attribute to remove
- * @returns A Workflow<void> that removes the attribute when yielded
- *
- * @example Removing form field attributes
- * ```typescript
- * import { watch } from 'watch-selector';
- * import { removeAttr, removeClass } from 'watch-selector/generator';
- *
- * watch('input.validated', async function* () {
- *   // Enable the field
- *   yield* removeAttr('disabled');
- *   yield* removeAttr('readonly');
- *   yield* removeClass('disabled');
- * });
- * ```
- *
- * @example Cleaning up data attributes
- * ```typescript
- * import { watch } from 'watch-selector';
- * import { removeAttr } from 'watch-selector/generator';
- *
- * watch('.processed-item', async function* () {
- *   // Remove temporary data attributes
- *   yield* removeAttr('data-processing');
- *   yield* removeAttr('data-temp-id');
- *   yield* removeAttr('data-validation-error');
- * });
- * ```
- *
- * @see {@link attr} - For setting attributes
- * @see {@link getAttr} - For reading attribute values
- * @see {@link hasAttr} - For checking attribute existence
- */
export function removeAttr(name: string): Workflow<void> {
🤖 Prompt for AI Agents
In src/generator/dom.ts around lines 1206-1217 and 1219-1258, there is a
duplicated/misplaced JSDoc for removeAttr: remove the incorrect/duplicate
documentation block that currently sits above the prop function (lines
~1206-1217), keep the correct documentation block that begins around 1219, and
ensure a single JSDoc comment immediately precedes the export function
removeAttr(name: string): Workflow<void> (line 1258). Verify examples and @see
tags remain only once and update the surrounding comments so prop has its
correct documentation instead of the removeAttr docs.
@doeixd	Reply...
src/generator/dom.ts
Comment on lines +1401 to +1514
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
 *
 * watch('select', async function* () {
 *   yield* prop('selectedIndex', 2);
 *   yield* prop('multiple', true);
 * });
 * ```
 *
 * @example Dynamic property updates
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prop, getState } from 'watch-selector/generator';
 *
 * watch('video', async function* () {
 *   const settings = yield* getState('videoSettings');
 *
 *   yield* prop('muted', settings?.muted ?? true);
 *   yield* prop('loop', settings?.loop ?? false);
 *   yield* prop('playbackRate', settings?.speed ?? 1.0);
 * });
 * ```
 *
 * @example Properties vs Attributes
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prop, attr } from 'watch-selector/generator';
 *
 * watch('input[type="text"]', async function* () {
 *   // Attribute sets initial/default value
 *   yield* attr('value', 'default');
 *
 *   // Property sets current value (what user sees)
 *   yield* prop('value', 'current value');
 * });
 * ```
 *
 * @example Working with custom properties
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prop, getProp } from 'watch-selector/generator';
 *
 * watch('.custom-element', async function* () {
 *   // Set custom properties
 *   yield* prop('customData', { id: 123, name: 'Test' });
 *   yield* prop('__internalState', new Map());
 *
 *   // Properties can hold any JavaScript value
 *   yield* prop('eventHandler', () => console.log('Clicked!'));
 * });
 * ```
 *
 * @example Video/Audio element properties
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prop, click } from 'watch-selector/generator';
 *
 * watch('video', async function* () {
 *   // Control playback properties
 *   yield* prop('muted', true);
 *   yield* prop('volume', 0.5);
 *   yield* prop('playbackRate', 1.5);
 *
 *   yield* click(async function* () {
 *     const video = yield* self<HTMLVideoElement>();
 *     if (video.paused) {
 *       video.play();
 *     } else {
 *       video.pause();
 *     }
 *   });
 * });
 * ```
 *
 * @example Setting custom properties
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { prop } from 'watch-selector/generator';
 *
 * watch('.video-player', async function* () {
 *   yield* prop('currentTime', 0);
 *   yield* prop('playbackRate', 1.5);
 *   yield* prop('volume', 0.8);
 * });
 * ```
 *
 * @see {@link getProp} - For reading property values
 * @see {@link attr} - For setting HTML attributes
 */
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Misplaced JSDoc comment block

There's a large JSDoc comment block (lines 1401-1514) that appears to be for a prop function setting properties, but it's placed between the hasAttr function and a comment separator. There's no corresponding function implementation for this documentation.

This documentation block should be moved to the actual prop function at line 1211, replacing the incorrect documentation there.

🤖 Prompt for AI Agents
src/generator/dom.ts lines 1401-1514 contain a large JSDoc block for the prop
function that is misplaced between hasAttr and a separator; move that entire
JSDoc block to line 1211 where the prop function is implemented, replacing the
incorrect/placeholder documentation currently at 1211, remove the original block
at 1401-1514, and ensure the moved comment sits immediately above the prop
function signature without altering its content or indentation so tooling and TS
docs pick it up correctly.
@doeixd	Reply...
src/generator/dom.ts
Comment on lines +2349 to +2410
/**
 * Logs a message to the console using the pure generator API.
 *
 * This function provides a convenient way to add debugging output within
 * generator workflows. The message can include information about the current
 * element and state.
 *
 * @param message - The message to log to the console
 * @returns A Workflow<void> that logs the message when yielded
 *
 * @example Basic logging
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { log, addClass, getState } from 'watch-selector/generator';
 *
 * watch('.debug-element', async function* () {
 *   yield* log('Starting element processing');
 *
 *   yield* addClass('processing');
 *   yield* log('Added processing class');
 *
 *   const state = yield* getState('data');
 *   yield* log(`Current state: ${JSON.stringify(state)}`);
 * });
 * ```
 *
 * @example Logging with element info
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { log, self, getAttr } from 'watch-selector/generator';
 *
 * watch('[data-component]', async function* () {
 *   const element = yield* self();
 *   const componentType = yield* getAttr('data-component');
 *
 *   yield* log(`Processing component: ${componentType}`);
 *   yield* log(`Element ID: ${element.id || 'no-id'}`);
 *   yield* log(`Classes: ${element.className}`);
 * });
 * ```
 *
 * @example Conditional logging
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { log, hasClass, getState } from 'watch-selector/generator';
 *
 * const DEBUG = true; // Toggle for debugging
 *
 * watch('.interactive', async function* () {
 *   if (DEBUG) {
 *     const isActive = yield* hasClass('active');
 *     yield* log(`Element active state: ${isActive}`);
 *
 *     const clickCount = yield* getState('clicks', 0);
 *     yield* log(`Click count: ${clickCount}`);
 *   }
 * });
 * ```
 *
 * @see {@link run} - For running arbitrary functions
 * @see {@link delay} - For adding timing to workflows
 */
@coderabbitai coderabbitai bot 54 minutes ago
⚠️ Potential issue

Duplicate log function definitions

There are two log function definitions - one at line 2327 and another at line 2349. Both have similar functionality but the second one appears to be a duplicate with extended documentation.

Remove the duplicate definition. Keep only one log function:

-/**
- * Logs a message to the console using the pure generator API.
- *
- * This function provides a convenient way to add debugging output within
- * generator workflows. The message can include information about the current
- * element and state.
- *
- * @param message - The message to log to the console
- * @returns A Workflow<void> that logs the message when yielded
- *
- * @example Basic logging
- * ```typescript
- * import { watch } from 'watch-selector';
- * import { log, addClass, getState } from 'watch-selector/generator';
- *
- * watch('.debug-element', async function* () {
- *   yield* log('Starting element processing');
- *
- *   yield* addClass('processing');
- *   yield* log('Added processing class');
- *
- *   const state = yield* getState('data');
- *   yield* log(`Current state: ${JSON.stringify(state)}`);
- * });
- * ```
- *
- * @example Logging with element info
- * ```typescript
- * import { watch } from 'watch-selector';
- * import { log, self, getAttr } from 'watch-selector/generator';
- *
- * watch('[data-component]', async function* () {
- *   const element = yield* self();
- *   const componentType = yield* getAttr('data-component');
- *
- *   yield* log(`Processing component: ${componentType}`);
- *   yield* log(`Element ID: ${element.id || 'no-id'}`);
- *   yield* log(`Classes: ${element.className}`);
- * });
- * ```
- *
- * @example Conditional logging
- * ```typescript
- * import { watch } from 'watch-selector';
- * import { log, hasClass, getState } from 'watch-selector/generator';
- *
- * const DEBUG = true; // Toggle for debugging
- *
- * watch('.interactive', async function* () {
- *   if (DEBUG) {
- *     const isActive = yield* hasClass('active');
- *     yield* log(`Element active state: ${isActive}`);
- *
- *     const clickCount = yield* getState('clicks', 0);
- *     yield* log(`Click count: ${clickCount}`);
- *   }
- * });
- * ```
- *
- * @see {@link run} - For running arbitrary functions
- * @see {@link delay} - For adding timing to workflows
- */
🤖 Prompt for AI Agents
In src/generator/dom.ts around lines 2349–2410 there is a duplicate `log`
function and extended JSDoc that repeats the implementation already defined near
line 2327; remove the duplicate block (lines 2349–2410) and keep the original
`log` definition at ~2327, ensuring you delete both the duplicate JSDoc and
function implementation, update any nearby exports if necessary so only the
single `log` remains exported, and run TypeScript build/tests to confirm no
references were broken.
@doeixd	Reply...
test/dom-manipulation.test.ts
Outdated
@@ -973,7 +973,7 @@ describe("DOM Manipulation Functions", () => {
      }).not.toThrow();

      expect(element.textContent).toBe("test");
      expect(element.classList.contains("test")).toBe(true);
      expect(element.classList.contains("existing")).toBe(true);
@coderabbitai coderabbitai bot 1 hour ago
⚠️ Potential issue

Fix the incorrect test assertion.

The test checks if a class "existing" is present, but the code only adds "test" class. This assertion will always fail.

Apply this diff to fix the test:

-expect(element.classList.contains("existing")).toBe(true);
+expect(element.classList.contains("test")).toBe(true);
📝 Committable suggestion
‼️ IMPORTANT
Carefully review the code before committing. Ensure that it accurately replaces the highlighted code, contains no missing lines, and has no issues with indentation. Thoroughly test & benchmark the code to ensure it meets the requirements.

Suggested change
      expect(element.classList.contains("existing")).toBe(true);
      expect(element.classList.contains("test")).toBe(true);
🤖 Prompt for AI Agents
In test/dom-manipulation.test.ts around line 976, the assertion checks for class
"existing" but the code only adds the "test" class; update the assertion to
expect "test" instead of "existing" (i.e., change the contains argument from
"existing" to "test") so the test reflects the actual behavior.








