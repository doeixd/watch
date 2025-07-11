## Implementation Guide: Parent-Child Component Composition

This guide details the implementation of a sophisticated parent-child communication system for the `watch-selector` library.

**Table of Contents:**
1.  **Feature Overview & Rationale**
2.  **Core Architectural Changes**
3.  **Code Implementation: Step-by-Step**
    *   3.1. `core/generator.ts`: API Registry & Parent Context
    *   3.2. `watch.ts`: Modifying `runOn` and `executeGenerator`
    *   3.3. `api/dom.ts`: The `createChildWatcher` Helper
4.  **README.md Documentation Updates**
    *   4.1. New "Component Composition" Section
    *   4.2. Updates to API Reference Tables
5.  **Gotchas & Best Practices**

---

### 1. Feature Overview & Rationale

This feature enables two patterns of communication between nested `watch` components:

*   **Child-to-Parent (API Exposure):** A child component can define and `return` a public API from its generator. The parent can then get a reactive `Map` of all its children's APIs to call methods on them.
*   **Parent-to-Child (Context Access):** A child component can access the context (element and API) of its direct parent watcher, allowing it to read parent state or trigger parent actions.

This transforms the library from a collection of element-watchers into a micro-framework for building hierarchical, encapsulated, and interactive components.

---

### 2. Core Architectural Changes

1.  **Generator Return Value:** We will now treat the `return` value of a generator as its public API.
2.  **API Registry:** A new global `WeakMap` (`generatorApiRegistry`) will be introduced to store the returned API for each element instance. This allows any part of the system to look up an element's public API.
3.  **Parent Context Registry:** Another `WeakMap` (`parentContextRegistry`) will link a child element to its parent watcher's element, establishing the hierarchy.
4.  **`runOn` Modification:** The `runOn` function will be modified to capture and register the generator's returned API.
5.  **New User-Facing Functions:**
    *   `createChildWatcher()`: The parent's tool to get a live collection of child APIs.
    *   `getParentContext()`: The child's tool to access its parent's context.

---

### 3. Code Implementation: Step-by-Step

#### 3.1. `src/core/generator.ts`: API Registry & Parent Context

This file is the logical place for the registries and the new context-accessing functions.

```typescript
// FILE: src/core/generator.ts

// ... (keep existing imports and code)
import type { 
  ElementFn, 
  TypedGeneratorContext, 
  CleanupFunction,
  ElementFromSelector 
} from '../types.ts';
import { getCurrentContext, parentContextRegistry } from './context.ts'; // Import parentContextRegistry

// --- NEW ---
// Global registry to store the public API returned by a generator for an element.
const generatorApiRegistry = new WeakMap<HTMLElement, any>();

/**
 * Retrieves the public API returned by an element's generator.
 * @param element The element whose API is being requested.
 * @returns The returned API object, or undefined if none exists.
 * @internal
 */
export function getContextApi<T = any>(element: HTMLElement): T | undefined {
  return generatorApiRegistry.get(element);
}
// --- END NEW ---

// ... (keep existing createTypedGeneratorContext, self, el, all, cleanup, ctx functions)

// --- NEW ---
/**
 * # getParentContext() - Access the Parent Watcher's Context
 * 
 * From within a child's generator (one initiated by `createChildWatcher`),
 * this function retrieves the element and public API of the direct parent watcher.
 * This creates a parent-to-child communication channel.
 * 
 * ## Usage
 * 
 * ```typescript
 * // In a child's generator:
 * function* childComponent() {
 *   // Specify the expected parent element and API types for full type safety.
 *   const parent = getParentContext<HTMLFormElement, { submit: () => void }>();
 * 
 *   if (parent) {
 *     console.log(`My parent is #${parent.element.id}`);
 *     // Call a method on the parent's API.
 *     parent.api.submit(); 
 *   }
 * }
 * ```
 * 
 * @returns An object containing the parent's `element` and `api`, or `null` if the element is not a watched child.
 */
export function getParentContext<
  ParentEl extends HTMLElement = HTMLElement,
  ParentApi = any
>(): { element: ParentEl; api: ParentApi } | null {
  const childElement = self(); // Gets the current (child) element from the context stack.
  const parentElement = parentContextRegistry.get(childElement);

  if (!parentElement) {
    return null;
  }

  const parentApi = getContextApi<ParentApi>(parentElement);

  return {
    element: parentElement as ParentEl,
    api: parentApi as ParentApi,
  };
}
// --- END NEW ---
```

#### 3.2. `src/core/context.ts`: Parent Registry

We need to add the `parentContextRegistry` here.

```typescript
// FILE: src/core/context.ts

// ... (keep existing imports and code)

// --- NEW ---
// Global registry to link a child element to its parent watcher's element.
// This is the backbone of the getParentContext() functionality.
export const parentContextRegistry = new WeakMap<HTMLElement, HTMLElement>();
// --- END NEW ---

// ... (keep existing contextStack and functions like getCurrentContext)

// --- NEW ---
// These helpers are used by createChildWatcher to manage the hierarchy.
export function registerParentContext(child: HTMLElement, parent: HTMLElement) {
  parentContextRegistry.set(child, parent);
}

export function unregisterParentContext(child: HTMLElement) {
  parentContextRegistry.delete(child);
}
// --- END NEW ---
```

#### 3.3. `watch.ts`: Modifying `runOn` and `executeGenerator`

We need `runOn` to return the generator's API. A small change to `executeGenerator` is also needed.

```typescript
// FILE: src/watch.ts

// ... (imports)
import { register } from './core/observer.ts';
// Make sure `executeGenerator` is imported from context.ts
import { executeGenerator } from './core/context.ts'; 
// ... (other imports)

// ... (keep watch() function as is)

// --- MODIFICATION ---
// The public `run` function remains unchanged.
export function run<S extends string>(
  // ... (signature)
): void {
  // ... (implementation)
}

/**
 * # runOn() - Execute Generator on a Single Element and Get API
 * 
 * Executes a generator on a specific element and returns the public API
 * object that the generator `return`s.
 * 
 * ## Usage
 * 
 * ```typescript
 * function* myComponent() {
 *   // ... logic
 *   return { sayHello: () => console.log('Hello') };
 * }
 * 
 * const element = document.getElementById('my-el');
 * const api = runOn(element, myComponent); // api is { sayHello: Function }
 * api?.sayHello(); // Outputs "Hello"
 * ```
 * 
 * @param element The specific HTML element to run the generator on.
 * @param generator Generator function that defines the behavior and returns an API.
 * @returns The public API returned by the generator, or `undefined`.
 */
export function runOn<El extends HTMLElement, T = any>(
  element: El,
  generator: () => Generator<ElementFn<El, any>, T, unknown>
): T | undefined {
  const arr = [element];
  const genInstance = generator();

  executeGenerator(
    element,
    `element-${element.tagName.toLowerCase()}`,
    0,
    arr,
    () => genInstance
  );

  // After the generator is fully iterated, its `return` value is available.
  const api = (genInstance as any).return;

  // The executeGenerator function will now handle storing the API.
  return api;
}
```

```typescript
// FILE: src/core/context.ts

// ... (imports)
import { generatorApiRegistry } from './generator'; // Import the new registry

// ...

// --- MODIFICATION to executeGenerator ---
export function executeGenerator<El extends HTMLElement, T = any>( // Add T for return type
  element: El,
  selector: string,
  index: number,
  array: readonly El[],
  generatorFn: () => Generator<any, T, unknown> // Add T here as well
): T | undefined { // Add return type
  // ... (create watchContext and generatorContext as before)
  
  // Push context onto stack
  pushContext(generatorContext);
  
  let returnValue: T | undefined; // Variable to hold the return value

  try {
    const generator = generatorFn();
    let result = generator.next();
    
    while (!result.done) {
      // ... (existing logic to execute yielded functions)
      result = generator.next();
    }
    // --- NEW ---
    // When the generator is done, capture its return value
    returnValue = result.value;
    if (returnValue) {
      generatorApiRegistry.set(element, returnValue);
    }
    // --- END NEW ---
  } catch (e) {
    console.error('Error in generator execution:', e);
  } finally {
    // Pop context from stack
    popContext();
  }

  return returnValue; // Return the API
}

// ... (rest of the file)
```

#### 3.4. `api/dom.ts`: The `createChildWatcher` Helper

This is the main new user-facing function for the parent.

```typescript
// FILE: src/api/dom.ts (or a new api/composition.ts)

// Add new imports at the top
import { runOn } from '../watch.ts';
import { cleanup } from '../core/generator.ts';
import { executeElementCleanup, registerParentContext, unregisterParentContext } from '../core/context.ts';
import type { ElementFromSelector, ElementFn, GeneratorFunction } from '../types.ts';
import { self } from '../core/generator.ts';

// ... (add this function to the file)

/**
 * # createChildWatcher() - Create a Reactive Collection of Child Contexts
 *
 * Establishes a live, type-safe link between a parent and its children. It
 * returns a reactive `Map` where keys are the child elements and values are the
 * public APIs returned by each child's generator. This is the primary tool for
 * child-to-parent communication.
 *
 * ## Usage
 *
 * ```typescript
 * // In the parent's generator:
 * function* parentComponent() {
 *   // Create the watcher. The type of `childApis` is inferred as:
 *   // Map<HTMLButtonElement, { click: () => void }>
 *   const childApis = createChildWatcher('button.child', childButtonLogic);
 *
 *   // Interact with the children's APIs
 *   yield click('#trigger-all-children', () => {
 *     for (const childApi of childApis.values()) {
 *       childApi.click(); // Call method on the child's API
 *     }
 *   });
 * }
 * ```
 *
 * @param childSelector The CSS selector for the child elements.
 * @param childGenerator The generator for the children, which should `return` a public API object.
 * @returns A reactive `Map<ChildEl, ChildApi>` that updates as children are added/removed.
 */
export function createChildWatcher<
  S extends string,
  ChildEl extends HTMLElement = ElementFromSelector<S>,
  ChildGen extends GeneratorFunction<ChildEl, any> = GeneratorFunction<ChildEl, any>
>(
  childSelector: S,
  childGenerator: ChildGen
): Map<ChildEl, Awaited<ReturnType<ChildGen>>> {
  // This function must be called from within a parent's generator context.
  const parentElement = self<HTMLElement>();
  const childContexts = new Map<ChildEl, Awaited<ReturnType<ChildGen>>>();

  const setupChild = (element: ChildEl) => {
    // Link child to parent for `getParentContext()` to work.
    registerParentContext(element, parentElement);
    // Execute the child's generator and get its returned API.
    const api = runOn(element, childGenerator as any);
    if (api) {
      childContexts.set(element, api);
    }
  };
  
  const teardownChild = (element: ChildEl) => {
    unregisterParentContext(element);
    executeElementCleanup(element); // Runs all cleanup fns for the child.
    childContexts.delete(element);
  };

  // 1. Initial setup for existing children
  const existingChildren = Array.from(parentElement.querySelectorAll(childSelector)) as ChildEl[];
  existingChildren.forEach(setupChild);

  // 2. Scoped MutationObserver to watch for dynamic changes
  const scopedObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          if (node.matches(childSelector)) setupChild(node as ChildEl);
          node.querySelectorAll<ChildEl>(childSelector).forEach(setupChild);
        }
      }
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement) {
          if (node.matches(childSelector)) teardownChild(node as ChildEl);
          node.querySelectorAll<ChildEl>(childSelector).forEach(teardownChild);
        }
      }
    }
  });

  scopedObserver.observe(parentElement, { childList: true, subtree: true });

  // 3. Register a cleanup function in the parent's context to stop this observer.
  // This is critical for preventing memory leaks.
  cleanup(() => {
    scopedObserver.disconnect();
    // Also clean up any remaining children when parent is destroyed
    for (const childEl of childContexts.keys()) {
        teardownChild(childEl);
    }
    childContexts.clear();
  });

  return childContexts;
}
```

---

### 4. README.md Documentation Updates

#### 4.1. New "Component Composition" Section

Add this new major section after "Core Concepts".

```markdown
## Component Composition: Building Hierarchies

Watch v5 supports full parent-child component communication, allowing you to build complex, nested, and encapsulated UIs.

### Child-to-Parent: Exposing an API with `createChildWatcher`

A child component can `return` an API from its generator. The parent can then use `createChildWatcher` to get a live collection of these APIs.

**Child Component (`./components/counter-button.ts`)**
```typescript
// childButtonLogic.ts
import { createState, on, self } from '@doeixd/watch';

export function* childButtonLogic() {
  const clickCount = createState('clicks', 0);
  
  yield on('click', () => clickCount.update(c => c + 1));

  // Define and return a public API
  return {
    getClicks: () => clickCount.get(),
    reset: () => {
      clickCount.set(0);
      console.log(`Button ${self().id} was reset.`);
    },
  };
}
```

**Parent Component**
```typescript
import { watch, createChildWatcher, click } from '@doeixd/watch';
import { childButtonLogic } from './components/counter-button';

watch('.button-container', function*() {
  // `childApis` is a reactive Map: Map<HTMLButtonElement, { getClicks, reset }>
  const childApis = createChildWatcher('button', childButtonLogic);

  // Parent can interact with children's APIs
  yield click('#reset-all-btn', () => {
    for (const api of childApis.values()) {
      api.reset();
    }
  });
});
```

### Parent-to-Child: Accessing the Parent with `getParentContext`

A child can access its parent's context and API, creating a top-down communication channel.

**Parent Component**
```typescript
watch('form#main-form', function*() {
  // The parent's API
  return {
    submitForm: () => self().submit(),
  };
});
```

**Child Component (inside the form)**
```typescript
import { getParentContext, on, self } from '@doeixd/watch';

watch('input.submit-on-enter', function*() {
  // Get the parent form's context and API
  const parentForm = getParentContext<HTMLFormElement, { submitForm: () => void }>();

  yield on('keydown', (e) => {
    if (e.key === 'Enter' && parentForm) {
      e.preventDefault();
      parentForm.api.submitForm(); // Call the parent's API method
    }
  });
});
```

```

#### 4.2. Updates to API Reference Tables

**Add a new table for Composition Helpers:**

| Function | Type | Description |
|---|---|---|
| `createChildWatcher` | `(selector, generator) => Map<ChildEl, ChildApi>` | Create a reactive collection of child component APIs |
| `getParentContext`| `() => { element: ParentEl, api: ParentApi } \| null`| Get the context of the parent watcher |

---

### 5. Gotchas & Best Practices

Add this new subsection to the README, perhaps under "Gotchas & Performance Considerations".

```markdown
### Composition Gotchas & Best Practices

#### 1. Avoid Tight Coupling with `getParentContext`

While `getParentContext()` is powerful, it makes a child component dependent on its parent. This can reduce reusability.

- **DO** use `getParentContext()` when a child is intrinsically part of a parent (e.g., a custom `<option>` inside a custom `<select>`).
- **PREFER** using `emit()` to send custom events from the child up to the parent for more decoupled communication. The parent can then listen for these events.

**Decoupled Example:**
```typescript
// Child: Emits an event
watch('.child', function*() {
  yield click(() => emit('child-action', { detail: 'data' }));
});

// Parent: Listens for the event
watch('.parent', function*() {
  yield on('child-action', (e) => {
    console.log('Child action occurred:', e.detail);
  });
});
```

#### 2. Generator Return Value is the API

Remember that only the `return` value of a generator is exposed as its public API. Internal state or functions are kept private, which is a good practice for encapsulation.

#### 3. Circular Dependencies

Be careful not to create infinite loops. A parent calling a child's API which in turn calls the parent's API can lead to a stack overflow if not handled correctly. Always ensure there is a clear, unidirectional flow of control for any given action.
```

This comprehensive guide should provide everything needed to successfully implement and document this powerful new feature set.