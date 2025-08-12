/**
 * @module explicit
 *
 * Explicit, non-overloaded versions of watch-selector functions.
 * These functions have clear, unambiguous names that indicate exactly what they do.
 *
 * @example
 * ```typescript
 * import { setTextElement, addClassSelector } from 'watch-selector/explicit';
 *
 * // Clear, explicit function names
 * setTextElement(button, 'Click me!');
 * addClassSelector('.items', 'found');
 * ```
 */

// Text manipulation
export {
  setTextElement,
  setTextSelector,
  setTextAll,
  setTextFirst,
  getTextElement,
  getTextSelector,
  getTextFirst,
  getTextAll,
  textGen,
  textGetGen,
  appendTextElement,
  appendTextSelector,
  prependTextElement,
  prependTextSelector,
} from "./text";

// HTML manipulation
export {
  setHtmlElement,
  setHtmlSelector,
  setHtmlAll,
  setHtmlFirst,
  getHtmlElement,
  getHtmlSelector,
  getHtmlFirst,
  getHtmlAll,
  htmlGen,
  htmlGetGen,
} from "./html";

// Class manipulation
export {
  addClassElement,
  addClassSelector,
  addClassAll,
  addClassFirst,
  addClassGen,
  removeClassElement,
  removeClassSelector,
  removeClassAll,
  removeClassFirst,
  removeClassGen,
  toggleClassElement,
  toggleClassSelector,
  toggleClassAll,
  toggleClassFirst,
  toggleClassGen,
  hasClassElement,
  hasClassSelector,
  hasClassAll,
  hasClassAny,
  hasClassGen,
  replaceClassElement,
  replaceClassSelector,
  setClassesElement,
  setClassesSelector,
} from "./class";

// Style manipulation
export {
  setStylesElement,
  setStylesSelector,
  setStylesAll,
  setStylesFirst,
  setStylesGen,
  setStyleElement,
  setStyleSelector,
  setStyleAll,
  setStyleFirst,
  setStyleGen,
  getStyleElement,
  getStyleSelector,
  getStyleFirst,
  getStyleAll,
  getStyleGen,
  removeStyleElement,
  removeStyleSelector,
  computedStyleElement,
  computedStyleSelector,
} from "./style";

// Attribute manipulation
export {
  setAttrElement,
  setAttrSelector,
  setAttrAll,
  setAttrFirst,
  setAttrGen,
  getAttrElement,
  getAttrSelector,
  getAttrFirst,
  getAttrAll,
  getAttrGen,
  removeAttrElement,
  removeAttrSelector,
  removeAttrAll,
  removeAttrFirst,
  removeAttrGen,
  hasAttrElement,
  hasAttrSelector,
  hasAttrAll,
  hasAttrAny,
  hasAttrGen,
  toggleAttrElement,
  toggleAttrSelector,
} from "./attr";

// Property manipulation
export {
  setPropElement,
  setPropSelector,
  setPropAll,
  setPropFirst,
  setPropGen,
  getPropElement,
  getPropSelector,
  getPropFirst,
  getPropAll,
  getPropGen,
} from "./prop";

// Data attribute manipulation
export {
  setDataElement,
  setDataSelector,
  setDataAll,
  setDataFirst,
  setDataGen,
  getDataElement,
  getDataSelector,
  getDataFirst,
  getDataAll,
  getDataGen,
  getAllDataElement,
  getAllDataSelector,
  removeDataElement,
  removeDataSelector,
} from "./data";

// Event handling
export {
  clickElement,
  clickSelector,
  clickAll,
  clickFirst,
  clickGen,
  clickDelegate,
  inputElement,
  inputSelector,
  inputAll,
  inputFirst,
  inputGen,
  changeElement,
  changeSelector,
  changeAll,
  changeFirst,
  changeGen,
  submitElement,
  submitSelector,
  submitGen,
  onElement,
  onSelector,
  onAll,
  onFirst,
  onGen,
  onDelegate,
  offElement,
  offSelector,
  offAll,
  emitElement,
  emitSelector,
  emitAll,
  emitCustom,
} from "./event";

// DOM traversal
export {
  queryElement,
  querySelector,
  queryDocument,
  queryGen,
  queryAllElement,
  queryAllSelector,
  queryAllDocument,
  queryAllGen,
  getParentElement,
  getParentSelector,
  getParentAll,
  getParentGen,
  getChildrenElement,
  getChildrenSelector,
  getChildrenAll,
  getChildrenGen,
  getSiblingsElement,
  getSiblingsSelector,
  getSiblingsAll,
  getSiblingsGen,
  closestElement,
  closestSelector,
  closestGen,
  containsElement,
  containsSelector,
  matchesElement,
  matchesSelector,
} from "./dom";

// Form manipulation
export {
  setValueElement,
  setValueSelector,
  setValueAll,
  setValueFirst,
  setValueGen,
  getValueElement,
  getValueSelector,
  getValueFirst,
  getValueAll,
  getValueGen,
  setCheckedElement,
  setCheckedSelector,
  setCheckedAll,
  setCheckedFirst,
  setCheckedGen,
  isCheckedElement,
  isCheckedSelector,
  isCheckedAll,
  isCheckedAny,
  isCheckedGen,
  setSelectedElement,
  setSelectedSelector,
  getSelectedElement,
  getSelectedSelector,
  getSelectedOptionsElement,
  getSelectedOptionsSelector,
} from "./form";

// Visibility manipulation
export {
  showElement,
  showSelector,
  showAll,
  showFirst,
  showGen,
  hideElement,
  hideSelector,
  hideAll,
  hideFirst,
  hideGen,
  toggleElement,
  toggleSelector,
  toggleAll,
  toggleFirst,
  toggleGen,
  isVisibleElement,
  isVisibleSelector,
  isHiddenElement,
  isHiddenSelector,
} from "./visibility";

// Focus manipulation
export {
  focusElement,
  focusSelector,
  focusFirst,
  focusGen,
  blurElement,
  blurSelector,
  blurFirst,
  blurGen,
  hasFocusElement,
  hasFocusSelector,
} from "./focus";

// Utility exports
export {
  isElement,
  isElementArray,
  isNodeList,
  isSelector,
  toArray,
  findElement,
  findElements,
} from "./utils";

// Type exports for explicit API
export type {
  ExplicitElementFn,
  ExplicitGeneratorFn,
  ExplicitEventHandler,
  ExplicitSelector,
} from "./types";

// Generator support for yield* patterns
export {
  // Text operations
  setTextFlow,
  getTextFlow,
  appendTextFlow,
  prependTextFlow,

  // Class operations
  addClassFlow,
  removeClassFlow,
  toggleClassFlow,
  hasClassFlow,

  // Attribute operations
  setAttrFlow,
  getAttrFlow,
  removeAttrFlow,

  // Style operations
  setStyleFlow,
  setStylesFlow,

  // Event operations
  clickFlow,
  inputFlow,

  // DOM query operations
  queryFlow,
  queryAllFlow,

  // Form operations
  setValueFlow,
  getValueFlow,
  setCheckedFlow,

  // Visibility operations
  showFlow,
  hideFlow,
  toggleVisibilityFlow,

  // Utility operations
  selfFlow,
  delayFlow,

  // Types
  type Workflow,
  type Operation,
} from "./generator-support";
