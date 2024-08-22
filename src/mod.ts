/**
 * @module
 *
 * This module contains functions helpful functions for adding event listeners to the dom. An alternative to web components or selector-observer
 *
 * @example Using watch
 * ```ts
 * import { watch } from "jsr:@doeixd/watch";
 *
 * watch('.say-hello', ({on, state}) => {
 *   state.count = 0
 *
 *   on('click', () => {
 *     alert(`Hello World${'!'.repeat(++state.count)}`)
 *    })
 * })
 * ```
 *
 */
export * from './watch'
