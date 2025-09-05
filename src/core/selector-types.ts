/**
 * @fileoverview Branded types for CSS selectors and class names
 *
 * This module provides type-safe branded types for distinguishing between
 * CSS selectors and class names, with runtime utilities for creating and
 * checking these types.
 */

// ============================================================================
// Branded Type Definitions
// ============================================================================

/**
 * Branded type for CSS selectors (e.g., "#id", ".class", "div > span")
 */
export interface CSSSelector extends String {
  readonly __brand: "CSSSelector";
}

/**
 * Branded type for class names (e.g., "active", "btn-primary")
 */
export interface ClassName extends String {
  readonly __brand: "ClassName";
}

/**
 * Branded type for element IDs (e.g., "header", "submit-button")
 */
export interface ElementID extends String {
  readonly __brand: "ElementID";
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a CSSSelector
 */
export function isCSSSelector(value: unknown): value is CSSSelector {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).__brand === "CSSSelector"
  );
}

/**
 * Check if a value is a ClassName
 */
export function isClassName(value: unknown): value is ClassName {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).__brand === "ClassName"
  );
}

/**
 * Check if a value is an ElementID
 */
export function isElementID(value: unknown): value is ElementID {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).__brand === "ElementID"
  );
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a CSSSelector from a string
 *
 * @example
 * const selector = css("#header .nav-item");
 * const elements = document.querySelectorAll(selector.toString());
 */
export function css(selector: string): CSSSelector {
  return Object.assign(new String(selector), {
    __brand: "CSSSelector" as const,
    toString: () => selector,
    valueOf: () => selector,
    [Symbol.toPrimitive]: () => selector,
  }) as CSSSelector;
}

/**
 * Create a ClassName from a string
 *
 * @example
 * const className = cls("active");
 * element.classList.add(className.toString());
 */
export function cls(className: string): ClassName {
  return Object.assign(new String(className), {
    __brand: "ClassName" as const,
    toString: () => className,
    valueOf: () => className,
    [Symbol.toPrimitive]: () => className,
  }) as ClassName;
}

/**
 * Create an ElementID from a string
 *
 * @example
 * const id = id("submit-button");
 * const element = document.getElementById(id.toString());
 */
export function id(idName: string): ElementID {
  return Object.assign(new String(idName), {
    __brand: "ElementID" as const,
    toString: () => idName,
    valueOf: () => idName,
    [Symbol.toPrimitive]: () => idName,
  }) as ElementID;
}

// ============================================================================
// Heuristic Detection
// ============================================================================

/**
 * Detect if a string looks like a CSS selector
 * This uses heuristics and may not be 100% accurate
 */
export function looksLikeCSSSelector(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  // Check for selector-specific characters
  const selectorIndicators = [
    /^[#.]/, // Starts with # or .
    /^[a-z]+[#.]/i, // Tag followed by # or .
    /[\s>+~]/, // Contains combinators
    /\[.*\]/, // Contains attribute selector
    /:[a-z]/i, // Contains pseudo-class
    /^[a-z]+$/i, // Just a tag name
  ];

  return selectorIndicators.some((pattern) => pattern.test(value));
}

/**
 * Detect if a string looks like a class name
 * This uses heuristics and may not be 100% accurate
 */
export function looksLikeClassName(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  // Class names typically:
  // - Don't start with # or .
  // - Don't contain spaces (unless multiple classes)
  // - Don't contain CSS combinators
  // - May contain hyphens, underscores

  if (value.match(/^[#.]/) || value.match(/[\s>+~\[\]]/)) {
    return false;
  }

  // Check for common class name patterns
  const classPatterns = [
    /^[a-z][\w-]*$/i, // Simple class name
    /^[a-z][\w-]*(\s+[a-z][\w-]*)*$/i, // Multiple class names
  ];

  return classPatterns.some((pattern) => pattern.test(value));
}

/**
 * Automatically detect and create the appropriate branded type
 *
 * @example
 * const selector = auto("#header"); // Returns CSSSelector
 * const className = auto("active"); // Returns ClassName
 */
export function auto(value: string): CSSSelector | ClassName {
  if (looksLikeCSSSelector(value)) {
    return css(value);
  }
  return cls(value);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a ClassName to a CSSSelector by prepending a dot
 *
 * @example
 * const className = cls("active");
 * const selector = classToSelector(className); // ".active"
 */
export function classToSelector(className: ClassName): CSSSelector {
  const str = className.toString();
  const selector = str.startsWith(".") ? str : `.${str}`;
  return css(selector);
}

/**
 * Convert an ElementID to a CSSSelector by prepending a hash
 *
 * @example
 * const elementId = id("header");
 * const selector = idToSelector(elementId); // "#header"
 */
export function idToSelector(elementId: ElementID): CSSSelector {
  const str = elementId.toString();
  const selector = str.startsWith("#") ? str : `#${str}`;
  return css(selector);
}

/**
 * Combine multiple selectors with a combinator
 *
 * @example
 * const parent = css("#container");
 * const child = css(".item");
 * const combined = combine(parent, ">", child); // "#container > .item"
 */
export function combine(
  first: CSSSelector,
  combinator: " " | ">" | "+" | "~",
  second: CSSSelector
): CSSSelector {
  return css(`${first.toString()}${combinator}${second.toString()}`);
}

/**
 * Create a selector that matches multiple alternatives
 *
 * @example
 * const selector = any(css(".active"), css(".selected")); // ".active, .selected"
 */
export function any(...selectors: CSSSelector[]): CSSSelector {
  return css(selectors.map((s) => s.toString()).join(", "));
}

/**
 * Create a selector with pseudo-class
 *
 * @example
 * const hoverSelector = withPseudo(css(".button"), "hover"); // ".button:hover"
 */
export function withPseudo(
  selector: CSSSelector,
  pseudo: string
): CSSSelector {
  const pseudoStr = pseudo.startsWith(":") ? pseudo : `:${pseudo}`;
  return css(`${selector.toString()}${pseudoStr}`);
}

/**
 * Create a selector with attribute
 *
 * @example
 * const selector = withAttr(css("input"), "type", "text"); // "input[type='text']"
 */
export function withAttr(
  selector: CSSSelector,
  attr: string,
  value?: string
): CSSSelector {
  if (value !== undefined) {
    return css(`${selector.toString()}[${attr}='${value}']`);
  }
  return css(`${selector.toString()}[${attr}]`);
}

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Extract string value from branded type
 */
export function valueOf(branded: CSSSelector | ClassName | ElementID): string {
  return branded.toString();
}

/**
 * Type for values that can be used as selectors
 */
export type SelectorLike = string | CSSSelector;

/**
 * Type for values that can be used as class names
 */
export type ClassLike = string | ClassName;

/**
 * Type for values that can be used as element IDs
 */
export type IDLike = string | ElementID;

/**
 * Convert SelectorLike to string
 */
export function toSelectorString(value: SelectorLike): string {
  return typeof value === "string" ? value : value.toString();
}

/**
 * Convert ClassLike to string
 */
export function toClassString(value: ClassLike): string {
  return typeof value === "string" ? value : value.toString();
}

/**
 * Convert IDLike to string
 */
export function toIDString(value: IDLike): string {
  return typeof value === "string" ? value : value.toString();
}

// ============================================================================
// DOM Integration Helpers
// ============================================================================

/**
 * Query elements using a branded selector
 */
export function query<T extends Element = Element>(
  selector: CSSSelector,
  parent: ParentNode = document
): T | null {
  return parent.querySelector<T>(selector.toString());
}

/**
 * Query all elements using a branded selector
 */
export function queryAll<T extends Element = Element>(
  selector: CSSSelector,
  parent: ParentNode = document
): T[] {
  return Array.from(parent.querySelectorAll<T>(selector.toString()));
}

/**
 * Add classes to an element using branded class names
 */
export function addClasses(element: Element, ...classes: ClassName[]): void {
  element.classList.add(...classes.map((c) => c.toString()));
}

/**
 * Remove classes from an element using branded class names
 */
export function removeClasses(
  element: Element,
  ...classes: ClassName[]
): void {
  element.classList.remove(...classes.map((c) => c.toString()));
}

/**
 * Check if element has a class using branded class name
 */
export function hasClass(element: Element, className: ClassName): boolean {
  return element.classList.contains(className.toString());
}

/**
 * Set element ID using branded ID
 */
export function setID(element: Element, elementId: ElementID): void {
  element.id = elementId.toString();
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export { css as selector, cls as className, id as elementId };
