/**
 * @module watch-selector/explicit
 *
 * Explicit, non-overloaded versions of watch-selector functions.
 * These functions have clear, unambiguous names that indicate exactly what they do.
 * Import this module when you need predictable function behavior without overloading.
 *
 * @example Basic Usage
 * ```typescript
 * import { setTextElement, addClassSelector, clickElement } from 'watch-selector/explicit';
 *
 * // Clear, explicit function names - no ambiguity
 * const button = document.querySelector('button');
 * setTextElement(button, 'Click me!');
 * addClassSelector('.items', 'found');
 * clickElement(button, () => console.log('clicked'));
 * ```
 *
 * @example Generator Usage
 * ```typescript
 * import { textGen, addClassGen, clickGen } from 'watch-selector/explicit';
 * import { watch } from 'watch-selector';
 *
 * watch('button', function* () {
 *   yield* textGen('Ready');
 *   yield* addClassGen('interactive');
 *   yield* clickGen(() => console.log('clicked'));
 * });
 * ```
 *
 * @example Targeting Specific Elements
 * ```typescript
 * import {
 *   setTextElement,    // Single element
 *   setTextSelector,   // First matching element
 *   setTextAll,        // All matching elements
 *   setTextFirst       // Explicitly first element
 * } from 'watch-selector/explicit';
 *
 * const el = document.getElementById('button');
 * setTextElement(el, 'Direct element');
 * setTextSelector('#button', 'First match');
 * setTextAll('.buttons', 'All buttons');
 * setTextFirst('.button', 'Explicitly first');
 * ```
 *
 * @version 2.0.0
 * @author Patrick Glenn
 * @license MIT
 */

// Re-export everything from the explicit module
export * from "./explicit/index";

// Default export is the main explicit namespace for convenience
import * as explicitAPI from "./explicit/index";
export default explicitAPI;
