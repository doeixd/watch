  /**
   * @module
   *
   * This module contains functions helpful functions for adding event listeners to the dom. An alternative to web components or selector-observer
   *
   * @example
   * import { watch } from "@doeixd/watch";
   *
   * watch('.say-hello', ({on, state}) => {
   *  state.count = 0
   *  on('click', () => {
   *    alert(`Hello World${'!'.repeat(++state.count)}`)
   *  })
   * })
   *
*/
export * from './watch'