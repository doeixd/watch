import { getState, setState } from '../core/state';
import type { ElementFn } from '../types';
import { getState, watchState } from '../core/state';
import { addClass, removeClass } from './dom';
import type { ElementFn } from '../types';

/**
 * A state cache entry for a single item managed by diffList.
 * @internal
 */
interface DiffCacheEntry<T> {
  element: HTMLElement;
  item: T;
  key: string | number;
}

/**
 * Creates an element from either an HTML string or an existing HTMLElement.
 * @internal
 */
function _createElement(renderOutput: string | HTMLElement): HTMLElement {
    if (renderOutput instanceof HTMLElement) {
        return renderOutput;
    }
    const template = document.createElement('template');
    template.innerHTML = renderOutput.trim();
    return template.content.firstChild as HTMLElement;
}

/**
 * Efficiently reconciles a list of data with DOM nodes inside a container element.
 * This is a powerful primitive for rendering dynamic lists that avoids destroying and
 * recreating DOM nodes unnecessarily. It handles additions, removals, and reordering.
 *
 * It works by keeping a state cache of the rendered elements, keyed by a unique
 * identifier from your data. On each run, it calculates the minimal set of DOM
 * operations (add, remove, move) to match the new data state.
 *
 * @template T The type of items in the data array.
 * @param data The new array of data items to render.
 * @param keyFn A function that returns a unique and stable key (string or number) for each data item.
 * @param renderFn A function that takes a data item and returns its HTML string representation or an HTMLElement. This is only called for new items.
 * @returns An ElementFn to be yielded inside a `watch` generator.
 *
 * @example
 * // In a watch generator for a <ul> container
 * const todos = createState('todos', [
 *   { id: 1, text: 'Learn watch-selector', done: false },
 *   { id: 2, text: 'Build awesome things', done: true },
 * ]);
 *
 * // On any change to the 'todos' state, re-run this:
 * yield diffList(
 *   todos.get(),
 *   (todo) => todo.id, // Key function
 *   (todo) => `<li class="${todo.done ? 'done' : ''}">${todo.text}</li>` // Render function
 * );
 *
 * // Now, if you reorder, add, or remove todos, only the necessary
 * // DOM nodes will be moved, added, or removed, instead of re-rendering everything.
 */
export function diffList<T>(
    data: T[],
    keyFn: (item: T) => string | number,
    renderFn: (item: T) => string | HTMLElement,
): ElementFn<HTMLElement, void> {
    const CACHE_KEY = '__diffListCache__';

    return (container: HTMLElement): void => {
        const oldCache: Map<string | number, DiffCacheEntry<T>> = getState(CACHE_KEY, container) || new Map();
        const newCache: Map<string | number, DiffCacheEntry<T>> = new Map();
        
        // --- 1. Handle Removals ---
        // Find keys that are in the old cache but not in the new data.
        const newKeys = new Set(data.map(keyFn));
        for (const [key, entry] of oldCache.entries()) {
            if (!newKeys.has(key)) {
                entry.element.remove();
            }
        }

        // --- 2. Handle Additions and Moves ---
        let lastNode: Node | null = null;
        data.forEach((item, index) => {
            const key = keyFn(item);
            let entry = oldCache.get(key);

            if (entry) {
                // Item exists, it's a potential move or update
                entry.item = item; // Update item data in cache
            } else {
                // Item is new, render it
                const element = _createElement(renderFn(item));
                entry = { element, item, key };
            }

            // --- Reconciliation Logic ---
            // This ensures nodes are in the correct order.
            const expectedNode = lastNode ? lastNode.nextSibling : container.firstChild;
            if (entry.element !== expectedNode) {
                container.insertBefore(entry.element, expectedNode);
            }
            
            lastNode = entry.element;
            newCache.set(key, entry);
        });

        // --- 3. Update State ---
        // Store the new cache for the next reconciliation.
        setState(CACHE_KEY, newCache, container);
    };
}




/**
 * Configuration for the watchSelection primitive.
 */
export interface WatchSelectionConfig<T> {
  /** The state key where the array of list data is stored. */
  dataStateKey: string;
  /** The state key where the ID of the currently selected item is stored. */
  selectedIdStateKey: string;
  /** The class name to apply to the selected item's element. */
  className?: string;
}

/**
 * Creates a highly efficient selection manager for a list rendered with `diffList`.
 *
 * Instead of re-rendering the entire list when the selection changes, this primitive
 * watches the selection state and directly adds/removes a class from only two elements:
 * the previously selected one and the newly selected one.
 *
 * It relies on the cache created by `diffList` to find the elements quickly.
 *
 * @template T The type of items in the data array.
 * @param config Configuration object for the selection manager.
 * @returns An ElementFn to be yielded inside a `watch` generator to initialize the manager.
 *
 * @example
 * // In a watch generator for a list container
 * const items = createState('items', [...]);
 * const selectedItemId = createState('selectedItemId', null);
 *
 * // First, render the list
 * yield diffList(items.get(), item => item.id, item => `<div>${item.name}</div>`);
 *
 * // Then, set up the efficient selection watcher
 * yield watchSelection({
 *   dataStateKey: 'items',
 *   selectedIdStateKey: 'selectedItemId',
 *   className: 'selected'
 * });
 *
 * // Now, whenever you change the `selectedItemId` state, the 'selected' class
 * // will be updated on the correct DOM nodes automatically and efficiently.
 * selectedItemId.set(newId);
 */
export function watchSelection<T>(
    config: WatchSelectionConfig<T>,
): ElementFn<HTMLElement, void> {
    const { dataStateKey, selectedIdStateKey, className = 'selected' } = config;
    const CACHE_KEY = '__diffListCache__';

    return (container: HTMLElement): void => {
        // This function sets up the watcher and runs once.
        watchState(selectedIdStateKey, (newId, oldId) => {
            const cache: Map<string | number, DiffCacheEntry<T>> | undefined = getState(CACHE_KEY, container);

            if (!cache) {
                console.warn(`watchSelection cannot find the cache for diffList. Did you yield diffList() in this container first?`);
                return;
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

            // Select the new item
            if (newId !== null && newId !== undefined) {
                const newEntry = cache.get(newId);
                if (newEntry) {
                    addClass(newEntry.element, className);
                }
            }
        }, container);

        // --- Initial State ---
        // Apply the class to the initially selected item on first run.
        const currentId = getState(selectedIdStateKey, container);
        if (currentId !== null && currentId !== undefined) {
            const cache: Map<string | number, DiffCacheEntry<T>> = getState(CACHE_KEY, container);
            if (cache) {
                const entry = cache.get(currentId);
                if (entry) {
                    addClass(entry.element, className);
                }
            }
        }
    };
}


import { getState, setState, runOn } from 'watch-selector';
import type { Workflow, WatchContext } from '../types';

/**
 * A state cache entry for a single item managed by For.
 * @internal
 */
interface ForCacheEntry<T> {
  element: HTMLElement;
  item: T;
  key: string | number;
}

/**
 * Creates an element from either an HTML string or an existing HTMLElement.
 * @internal
 */
function _createElement(renderOutput: string | HTMLElement): HTMLElement {
    if (renderOutput instanceof HTMLElement) {
        return renderOutput;
    }
    // Using a template element is a robust way to parse an HTML string
    const template = document.createElement('template');
    template.innerHTML = renderOutput.trim();
    const element = template.content.firstChild;
    if (!(element instanceof HTMLElement)) {
        throw new Error('For render function must return a single root element.');
    }
    return element;
}

/**
 * Renders a list of items with efficient, keyed reconciliation.
 *
 * This powerful primitive maps an array of data to a list of DOM nodes. It avoids
 * re-rendering the entire list on every update by uniquely "keying" each item.
 * When the data changes, `For*` calculates the minimum number of DOM operations
 * (additions, removals, and crucially, moves) needed to reflect the new state.
 *
 * @template T The type of items in the data array.
 * @param data The array of data items to render.
 * @param keyFn A function that returns a unique and stable key (string or number) for each item.
 * @param renderFn A function that takes a data item and returns its HTML string or an HTMLElement. **This function is only called for new items**, making it highly performant.
 * @returns A Workflow to be used with `yield*` in a `watch` generator.
 *
 * @example
 * // In a watch generator for a <ul> container:
 * const todos = createState('todos', [
 *   { id: 1, text: 'Learn watch-selector' },
 *   { id: 2, text: 'Build awesome things' },
 * ]);
 *
 * // This will efficiently render and update the list
 * yield* For(
 *   todos.get(),
 *   (todo) => todo.id,
 *   (todo) => `<li>${todo.text}</li>`
 * );
 *
 * // If you later shuffle the `todos` array and re-run `yield* For(...)`,
 * // the <li> elements will be reordered in the DOM, not destroyed and recreated.
 */
export function For<T>(
    data: T[],
    keyFn: (item: T) => string | number,
    renderFn: (item: T) => string | HTMLElement,
): Workflow<void> {
    const CACHE_KEY = '__ForCache__';

    return (async function*() {
        yield (context: WatchContext) => {
            const container = context.element;
            const oldCache: Map<string | number, ForCacheEntry<T>> = getState(CACHE_KEY, context) || new Map();
            const newCache: Map<string | number, ForCacheEntry<T>> = new Map();
            
            const newKeys = new Set(data.map(keyFn));

            // 1. Handle Removals: Remove elements that are no longer in the data.
            for (const [key, entry] of oldCache.entries()) {
                if (!newKeys.has(key)) {
                    entry.element.remove();
                }
            }

            let lastNode: Node | null = null;

            // 2. Handle Additions and Moves
            data.forEach((item) => {
                const key = keyFn(item);
                const existingEntry = oldCache.get(key);

                let element: HTMLElement;
                if (existingEntry) {
                    // Item already exists, reuse its DOM element
                    element = existingEntry.element;
                } else {
                    // Item is new, so we call the render function
                    element = _createElement(renderFn(item));
                }
                
                // 3. Re-order elements to match the new data order.
                // This is the core of the reconciliation logic.
                const expectedNode = lastNode ? lastNode.nextSibling : container.firstChild;
                if (element !== expectedNode) {
                    container.insertBefore(element, expectedNode);
                }
                
                lastNode = element;
                newCache.set(key, { element, item, key });
            });

            // 4. Update the state cache for the next run.
            setState(CACHE_KEY, newCache, context);
        };
    })();
}


/**
 * A state cache entry for the element managed by Show.
 * @internal
 */
interface ShowState {
  element: HTMLElement;
  isShown: boolean;
}

/**
 * Conditionally renders a block of content by adding or removing it from the DOM.
 *
 * `Show*` is an efficient way to manage conditional UI. When the condition is true,
 * it calls a render function and inserts the result into the DOM. When the condition
 * becomes false, it removes the element. The render function is only called when
 * the element needs to be created, not on every state change.
 *
 * @param condition A boolean expression. If true, the content is shown; if false, it's hidden.
 * @param renderFn A function that returns the HTML string or HTMLElement to render when the condition is true.
 * @returns A Workflow to be used with `yield*` in a `watch` generator.
 *
 * @example
 * const isLoggedIn = createState('isLoggedIn', false);
 *
 * // In a watch generator for a container element:
 * yield* Show(
 *   isLoggedIn.get(),
 *   () => `<div>Welcome back, user!</div>`
 * );
 *
 * // Later...
 * isLoggedIn.set(true);
 * // The welcome message will be rendered and added to the DOM.
 */
export function Show(
    condition: boolean,
    renderFn: () => string | HTMLElement,
): Workflow<void> {
    const STATE_KEY = '__showState__';

    return (async function*() {
        yield (context: WatchContext) => {
            const container = context.element;
            const state: ShowState | undefined = getState(STATE_KEY, context);

            if (condition) {
                if (!state || !state.isShown) {
                    // Condition is true, but element isn't shown, so render and add it.
                    const element = _createElement(renderFn());
                    container.appendChild(element);
                    setState(STATE_KEY, { element, isShown: true }, context);
                }
            } else {
                if (state && state.isShown) {
                    // Condition is false, but element is shown, so remove it.
                    state.element.remove();
                    setState(STATE_KEY, { ...state, isShown: false }, context);
                }
            }
        };
    })();
}


/**
 * Creates a reactive render loop for a component generator.
 *
 * `render*` is a powerful higher-order primitive that turns a standard generator
 * into a reactive component. It automatically re-runs the provided generator
 * function whenever any of its declared state dependencies change, ensuring the
 * UI is always in sync with the state.
 *
 * @param componentGenerator The generator function to run. This function should contain
 *   the rendering logic for the component, likely using primitives like `For*` and `Show*`.
 * @param dependencies An array of state keys that this component depends on. The component
 *   will re-render whenever any of these state keys are changed via `setState` or `updateState`.
 * @returns A Workflow that sets up the reactive render loop.
 *
 * @example
 * const todos = createState('todos', []);
 * const filter = createState('filter', 'all');
 *
 * function* TodoListComponent() {
 *   const filteredTodos = getFilteredTodos(todos.get(), filter.get());
 *   yield* For(filteredTodos, todo => todo.id, todo => `<li>${todo.text}</li>`);
 * }
 *
 * // In a watch generator for the app root:
 * // This will now automatically re-render the TodoListComponent
 * // whenever 'todos' or 'filter' state changes.
 * yield* render(TodoListComponent, ['todos', 'filter']);
 */
export function render(
    componentGenerator: () => Generator<any, any, any> | AsyncGenerator<any, any, any>,
    dependencies: string[],
): Workflow<void> {
    return (async function*() {
        yield (context: WatchContext) => {
            const container = context.element;

            const rerender = () => {
                // Use runOn to execute the generator in the context of our container element
                runOn(container, componentGenerator);
            };

            // Set up watchers for each dependency
            dependencies.forEach(depKey => {
                const unwatch = watchState(depKey, (newValue, oldValue) => {
                    // Avoid re-rendering if the value is the same (e.g., for object references)
                    if (newValue !== oldValue) {
                        rerender();
                    }
                }, context);
                // Ensure the watcher is cleaned up when the container is removed
                cleanup(unwatch, context);
            });

            // Perform the initial render
            rerender();
        };
    })();
}



// /**
//  * A type representing the possible children for the tag function.
//  * Can be a DOM node, a string, a number, null/undefined, or a nested array of other children.
//  */
// type TagChild = Node | string | number | null | undefined | TagChild[];

// /**
//  * Creates an HTML element programmatically with a flexible and concise syntax.
//  *
//  * This hyperscript-style function is a powerful utility for building DOM structures
//  * in JavaScript without resorting to messy string concatenation. It's an ideal
//  * companion for `watch-selector`'s rendering primitives like `For*` and `Show*`.
//  *
//  * @param name The tag name of the element to create (e.g., 'div', 'button', 'span').
//  * @param args A rest parameter that can include:
//  *   - **An attributes object**: A plain object where keys are attribute names.
//  *   - **Children**: Strings, numbers, DOM nodes, or other `tag()` calls.
//  *   - **Arrays of children**: Nested arrays are automatically flattened.
//  * @returns The created HTMLElement.
//  *
//  * @example
//  * // Basic usage
//  * const myDiv = tag('div', { class: 'container' }, 'Hello World');
//  * // <div class="container">Hello World</div>
//  *
//  * @example
//  * // Nested structure with event handlers and styles
//  * const app = tag('main', { id: 'app' },
//  *   tag('h1', { style: { color: 'navy' } }, 'My App'),
//  *   tag('p', 'This is a list of items:'),
//  *   tag('ul',
//  *     ['Item 1', 'Item 2', 'Item 3'].map(item => tag('li', item))
//  *   ),
//  *   tag('button',
//  *     {
//  *       id: 'action-btn',
//  *       disabled: false,
//  *       // Event handlers are automatically attached
//  *       onclick: (e) => alert('Button clicked!'),
//  *     },
//  *     'Click Me'
//  *   )
//  * );
//  * document.body.appendChild(app);
//  *
//  * @example
//  * // Integration with watch-selector's `For*` primitive
//  * watch('#user-list', function*() {
//  *   const users = createState('users', [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}]);
//  *
//  *   yield* For(
//  *      users.get(),
//  *      user => user.id,
//  *      user => tag('div', { class: 'user-card' },
//  *          tag('p', `ID: ${user.id}`),
//  *          tag('strong', `Name: ${user.name}`)
//  *      )
//  *   );
//  * });
//  */
// export function tag(
//     name: string,
//     ...args: (Record<string, any> | TagChild)[]
// ): HTMLElement {
//     const element = document.createElement(name);

//     /**
//      * Helper function to recursively append children to the element.
//      * It handles strings, numbers, Nodes, and nested arrays.
//      */
//     function appendChildren(children: TagChild[]) {
//         for (const child of children) {
//             if (child === null || child === undefined) {
//                 continue; // Ignore null/undefined children
//             }

//             if (Array.isArray(child)) {
//                 // Recursively handle nested arrays
//                 appendChildren(child);
//             } else if (child instanceof Node) {
//                 // Append DOM nodes directly
//                 element.appendChild(child);
//             } else {
//                 // Convert strings, numbers, etc., to text nodes
//                 element.appendChild(document.createTextNode(String(child)));
//             }
//         }
//     }

//     // Iterate through the arguments to process attributes and children
//     for (const arg of args) {
//         if (arg === null || arg === undefined) {
//             continue;
//         }

//         if (Array.isArray(arg)) {
//             // Argument is an array of children
//             appendChildren(arg);
//         } else if (arg instanceof Node) {
//             // Argument is a single child node
//             element.appendChild(arg);
//         } else if (typeof arg === 'object' && arg.constructor === Object) {
//             // Argument is a plain object, treat as attributes
//             for (const key in arg) {
//                 const value = arg[key];
//                 if (value === null || value === undefined) continue;

//                 // Handle special cases for attributes
//                 if (key.startsWith('on') && typeof value === 'function') {
//                     // Event listeners: onclick -> click
//                     const eventName = key.substring(2).toLowerCase();
//                     element.addEventListener(eventName, value);
//                 } else if (key === 'style' && typeof value === 'object') {
//                     // Style object: { color: 'red', fontSize: '16px' }
//                     Object.assign(element.style, value);
//                 } else if (key === 'class' || key === 'className') {
//                     // Class attribute
//                     element.className = String(value);
//                 } else if (typeof value === 'boolean') {
//                     // Boolean attributes: disabled, checked, etc.
//                     // The `toggleAttribute` API correctly handles true/false.
//                     element.toggleAttribute(key, value);
//                 } else {
//                     // All other attributes
//                     element.setAttribute(key, String(value));
//                 }
//             }
//         } else {
//             // Argument is a primitive (string, number), treat as a child text node
//             element.appendChild(document.createTextNode(String(arg)));
//         }
//     }

//     return element;
// }
