// In file: src/api/tag.ts

import type { Workflow } from '../types';

// --- TYPE DEFINITIONS ---

/** An instruction yielded inside a `tag` builder to configure the element. */
export type BuilderInstruction = (element: HTMLElement) => void;

/** A union of possible child types for an element. */
type TagChild = Node | string | number | null | undefined | TagChild[];

// A set of common SVG tags to trigger the use of the SVG namespace.
const SVG_TAGS = new Set([
    'svg', 'path', 'g', 'circle', 'rect', 'line', 'polygon', 'polyline', 'text', 'defs', 'marker'
]);


// --- INTERNAL HELPERS ---

/**
 * Recursively appends children to an element, handling various types.
 * @internal
 */
function _appendChildren(element: Element, children: TagChild[]) {
    for (const child of children) {
        if (child === null || child === undefined) continue;

        if (Array.isArray(child)) {
            _appendChildren(element, child);
        } else if (child instanceof Node) {
            element.appendChild(child);
        } else {
            element.appendChild(document.createTextNode(String(child)));
        }
    }
}

/**
 * Type guard to check if an argument is a generator function for our builder.
 * @internal
 */
function isGeneratorBuilder(arg: any): arg is () => Generator<BuilderInstruction, void, unknown> {
    return typeof arg === 'function' && arg.constructor.name === 'GeneratorFunction';
}


// --- BUILDER PRIMITIVES (for `yield`ing inside the generator) ---

/**
 * Sets an attribute on the element being built. To be used with `yield`
 * inside a `tag` generator builder.
 * @param name The name of the attribute (e.g., 'class', 'data-id').
 * @param value The value. If boolean, the attribute is toggled.
 */
export function attribute(name: string, value: string | number | boolean): BuilderInstruction {
    return (element: HTMLElement) => {
        if (typeof value === 'boolean') {
            element.toggleAttribute(name, value);
        } else {
            element.setAttribute(name, String(value));
        }
    };
}

/**
 * Sets a DOM property on the element being built. To be used with `yield`
 * inside a `tag` generator builder.
 * @param name The name of the property (e.g., 'value', 'checked', 'disabled').
 * @param value The value to set for the property.
 */
export function property<K extends keyof HTMLElement>(name: K, value: HTMLElement[K]): BuilderInstruction {
    return (element: HTMLElement) => {
        (element as any)[name] = value;
    };
}

/**
 * Sets CSS styles on the element being built. To be used with `yield`
 * inside a `tag` generator builder.
 * @param styles An object of CSS properties (e.g., `{ backgroundColor: 'blue' }`).
 */
export function style(styles: Partial<CSSStyleDeclaration>): BuilderInstruction;
/**
 * Sets a single CSS style on the element being built.
 * @param prop The CSS property name (e.g., 'backgroundColor').
 * @param value The value for the CSS property.
 */
export function style(prop: keyof CSSStyleDeclaration, value: string): BuilderInstruction;
export function style(
    propOrStyles: keyof CSSStyleDeclaration | Partial<CSSStyleDeclaration>,
    value?: string
): BuilderInstruction {
    return (element: HTMLElement) => {
        if (typeof propOrStyles === 'object') {
            Object.assign(element.style, propOrStyles);
        } else if (value !== undefined) {
            (element.style as any)[propOrStyles] = value;
        }
    };
}

/**
 * Attaches an event listener to the element being built. To be used with `yield`
 * inside a `tag` generator builder.
 * @param eventName The name of the event (e.g., 'click', 'input').
 * @param handler The function to execute when the event fires.
 * @param options Optional event listener options.
 */
export function on<K extends keyof HTMLElementEventMap>(
    eventName: K,
    handler: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
): BuilderInstruction {
    return (element: HTMLElement) => {
        element.addEventListener(eventName, handler, options);
    };
}

/**
 * Appends children to the element being built. To be used with `yield`
 * inside a `tag` generator builder.
 * @param children The children to append (strings, numbers, Nodes, or nested arrays).
 */
export function child(...children: TagChild[]): BuilderInstruction {
    return (element: HTMLElement) => {
        _appendChildren(element, children);
    };
}


// --- THE MAIN `tag` FUNCTION ---

/**
 * Creates an HTML or SVG element programmatically using one of two powerful paradigms:
 * 1.  **Hyperscript:** A concise, function-based syntax for creating nested DOM trees.
 * 2.  **Generator Builder:** A declarative, `yield`-based workflow for configuring a single element.
 *
 * This function is fully type-safe and infers the specific element type (e.g., `HTMLButtonElement`)
 * from the tag name, providing excellent autocompletion and error checking.
 *
 * @template K The tag name of the element, used to infer the correct HTMLElement type.
 * @param name The tag name (e.g., 'div', 'button', 'svg:path').
 * @param args Can be an attributes object, children, or a single generator function for the builder pattern.
 */
export function tag<K extends keyof HTMLElementTagNameMap>(
    name: K,
    builder: () => Generator<BuilderInstruction, void, unknown>
): Workflow<HTMLElementTagNameMap[K]>;

export function tag<K extends keyof HTMLElementTagNameMap>(
    name: K,
    ...args: (Record<string, any> | TagChild)[]
): HTMLElementTagNameMap[K];

export function tag(
    name: string,
    ...args: any[]
): HTMLElement | Workflow<HTMLElement> {
    const element = SVG_TAGS.has(name)
        ? document.createElementNS('http://www.w3.org/2000/svg', name)
        : document.createElement(name);

    // --- Overload 1: Generator Builder Pattern ---
    if (args.length === 1 && isGeneratorBuilder(args[0])) {
        const builder = args[0];
        
        return (async function* (): Workflow<HTMLElement> {
            const builderIterator = builder();
            
            for (const instruction of builderIterator) {
                if (typeof instruction === 'function') {
                    instruction(element as HTMLElement);
                }
            }
            return element as HTMLElement;
        })();
    }

    // --- Overload 2: Standard Hyperscript Pattern ---
    for (const arg of args) {
        if (arg === null || arg === undefined) continue;

        if (Array.isArray(arg) || arg instanceof Node || typeof arg !== 'object' || arg.constructor !== Object) {
            _appendChildren(element, [arg]);
        } else {
            // This is a plain attributes object
            for (const key in arg) {
                const value = arg[key];
                if (value === null || value === undefined) continue;

                if (key.startsWith('on') && typeof value === 'function') {
                    const eventName = key.substring(2).toLowerCase();
                    element.addEventListener(eventName, value);
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign((element as HTMLElement).style, value);
                } else if (key === 'class' || key === 'className') {
                    element.setAttribute('class', String(value));
                } else if (typeof value === 'boolean') {
                    (element as HTMLElement).toggleAttribute(key, value);
                } else {
                    element.setAttribute(key, String(value));
                }
            }
        }
    }

    return element as HTMLElement;
}
