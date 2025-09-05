/**
 * @module watch-selector/fluent
 *
 * Fluent, chainable API for DOM manipulation with jQuery-like method chaining.
 * This module provides an intuitive, discoverable interface for DOM operations
 * that can be chained together for elegant, readable code.
 *
 * @example Basic Chaining
 * ```typescript
 * import { selector, element, $fluent } from 'watch-selector/fluent';
 *
 * // jQuery-like selector chaining
 * selector('.card')
 *   .addClass('interactive')
 *   .text('Ready')
 *   .click(() => console.log('clicked'))
 *   .show();
 *
 * // Works with existing elements too
 * const button = document.querySelector('button');
 * element(button)
 *   .addClass('active')
 *   .text('Active Button')
 *   .focus();
 * ```
 *
 * @example Advanced Chaining
 * ```typescript
 * import { selector, elements } from 'watch-selector/fluent';
 *
 * // Chain complex operations
 * selector('.todo-item')
 *   .addClass('pending')
 *   .attr('data-status', 'processing')
 *   .find('.checkbox')
 *   .checked(false)
 *   .parent()
 *   .style('opacity', '0.7');
 *
 * // Work with multiple elements
 * const items = document.querySelectorAll('.item');
 * elements(items)
 *   .addClass('found')
 *   .each((el, index) => {
 *     element(el).text(`Item ${index + 1}`);
 *   });
 * ```
 *
 * @example Integration with Watch
 * ```typescript
 * import { watch } from 'watch-selector';
 * import { selector } from 'watch-selector/fluent';
 *
 * watch('.dynamic-content', function* () {
 *   // Use fluent API within generators
 *   const card = selector(self())
 *     .addClass('mounted')
 *     .text('Loading...');
 *
 *   yield click(function* () {
 *     selector(self())
 *       .removeClass('loading')
 *       .addClass('loaded')
 *       .text('Content loaded!');
 *   });
 * });
 * ```
 *
 * @example Form Handling
 * ```typescript
 * import { selector } from 'watch-selector/fluent';
 *
 * // Fluent form manipulation
 * selector('form')
 *   .find('input[type="text"]')
 *   .val('')
 *   .focus()
 *   .parent()
 *   .find('button[type="submit"]')
 *   .text('Ready to Submit')
 *   .click((event) => {
 *     event.preventDefault();
 *     // Handle form submission
 *   });
 * ```
 *
 * @example Complex DOM Traversal
 * ```typescript
 * import { selector } from 'watch-selector/fluent';
 *
 * // Navigate and manipulate DOM tree
 * selector('.content')
 *   .find('.header')
 *   .addClass('visible')
 *   .siblings('.sidebar')
 *   .hide()
 *   .parent()
 *   .children('.footer')
 *   .show()
 *   .text('Footer updated');
 * ```
 *
 * @version 2.0.0
 * @author Patrick Glenn
 * @license MIT
 */

// Re-export everything from the fluent module
export * from "./fluent/index";

// Default export is the main fluent selector function for convenience
export { selector as default } from "./fluent/index";
