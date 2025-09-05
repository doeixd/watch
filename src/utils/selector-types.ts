/**
 * Branded types for CSS selectors and class names
 *
 * This module provides branded string types that help TypeScript distinguish
 * between CSS selectors and class names, while still being compatible with
 * regular strings at runtime.
 */

// ============================================================================
// Branded Type Definitions
// ============================================================================

/**
 * A branded type for CSS selectors (e.g., "#id", ".class", "div > span")
 */
export interface CSSSelector extends String {
  readonly __brand: "CSSSelector";
}

/**
 * A branded type for class names (e.g., "active", "btn-primary")
 */
export interface ClassName extends String {
  readonly __brand: "ClassName";
}

/**
 * A branded type for element IDs (e.g., "header", "submit-button")
 */
export interface ElementId extends String {
  readonly __brand: "ElementId";
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a string looks like a CSS selector
 * Uses heuristics to determine if a string is likely a selector
 */
export function isCSSSelector(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  // Trim whitespace for checking
  const trimmed = value.trim();
  if (!trimmed) return false;

  // Common CSS selector patterns
  const selectorPatterns = [
    /^[#.]/, // Starts with # or .
    /^[a-z]+[#.\[\s>+~:]/i, // Tag name followed by selector chars
    /[\s>+~]/, // Contains combinators
    /\[.*\]/, // Contains attribute selector
    /:[a-z]/i, // Contains pseudo-class
    /^[a-z]+$/i, // Just a tag name (like "div", "button", etc.)
  ];

  // Check if it matches any selector pattern
  if (selectorPatterns.some((pattern) => pattern.test(trimmed))) {
    return true;
  }

  // Additional checks for common HTML tag names
  const commonTags = [
    "div",
    "span",
    "p",
    "a",
    "button",
    "input",
    "form",
    "section",
    "article",
    "header",
    "footer",
    "nav",
    "main",
    "aside",
    "ul",
    "ol",
    "li",
    "table",
    "tr",
    "td",
    "th",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "img",
    "video",
    "audio",
    "canvas",
    "svg",
    "iframe",
    "label",
    "select",
    "textarea",
  ];

  const lowerValue = trimmed.toLowerCase();
  if (commonTags.includes(lowerValue)) {
    return true;
  }

  // If it doesn't match any patterns and isn't a tag, it's probably a class name
  return false;
}

/**
 * Check if a string looks like a class name (not a selector)
 */
export function isClassName(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  // If it looks like a selector, it's not a plain class name
  if (isCSSSelector(value)) return false;

  // Class names should not contain selector characters
  const invalidChars = /[#.\[\]>+~:()]/;
  if (invalidChars.test(trimmed)) return false;

  // Valid class name pattern (can contain letters, numbers, hyphens, underscores)
  const validClassName = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/;

  // Check each space-separated part if there are multiple classes
  const parts = trimmed.split(/\s+/);
  return parts.every((part) => validClassName.test(part));
}

/**
 * Check if a string looks like an element ID
 */
export function isElementId(value: string): boolean {
  if (!value || typeof value !== "string") return false;

  const trimmed = value.trim();
  if (!trimmed) return false;

  // IDs should not contain spaces or special selector characters
  const invalidChars = /[\s#.\[\]>+~:()]/;
  if (invalidChars.test(trimmed)) return false;

  // Valid ID pattern
  const validId = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
  return validId.test(trimmed);
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a branded CSS selector
 */
export function selector(value: string): CSSSelector {
  const branded = new String(value) as CSSSelector;

  // Make it behave like a regular string
  Object.defineProperty(branded, "toString", {
    value: function () {
      return value;
    },
    enumerable: false,
  });

  Object.defineProperty(branded, Symbol.toPrimitive, {
    value: function (hint: string) {
      if (hint === "string" || hint === "default") {
        return value;
      }
      return value;
    },
    enumerable: false,
  });

  Object.defineProperty(branded, "valueOf", {
    value: function () {
      return value;
    },
    enumerable: false,
  });

  return branded;
}

/**
 * Create a branded class name
 */
export function className(value: string): ClassName {
  const branded = new String(value) as ClassName;

  Object.defineProperty(branded, "toString", {
    value: function () {
      return value;
    },
    enumerable: false,
  });

  Object.defineProperty(branded, Symbol.toPrimitive, {
    value: function (hint: string) {
      if (hint === "string" || hint === "default") {
        return value;
      }
      return value;
    },
    enumerable: false,
  });

  Object.defineProperty(branded, "valueOf", {
    value: function () {
      return value;
    },
    enumerable: false,
  });

  return branded;
}

/**
 * Create a branded element ID
 */
export function elementId(value: string): ElementId {
  const branded = new String(value) as ElementId;

  Object.defineProperty(branded, "toString", {
    value: function () {
      return value;
    },
    enumerable: false,
  });

  Object.defineProperty(branded, Symbol.toPrimitive, {
    value: function (hint: string) {
      if (hint === "string" || hint === "default") {
        return value;
      }
      return value;
    },
    enumerable: false,
  });

  Object.defineProperty(branded, "valueOf", {
    value: function () {
      return value;
    },
    enumerable: false,
  });

  return branded;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Auto-detect and create the appropriate branded type
 */
export function auto(value: string): CSSSelector | ClassName | ElementId {
  if (value.startsWith("#")) {
    // It's an ID selector, extract the ID part
    const id = value.slice(1);
    if (isElementId(id)) {
      return selector(value); // Return as selector since it has #
    }
  }

  if (value.startsWith(".")) {
    // It's a class selector, but return as selector
    return selector(value);
  }

  if (isCSSSelector(value)) {
    return selector(value);
  }

  if (isElementId(value)) {
    return elementId(value);
  }

  // Default to class name for non-selector strings
  return className(value);
}

/**
 * Convert a branded type back to a plain string
 */
export function toString(
  value: CSSSelector | ClassName | ElementId | string,
): string {
  if (typeof value === "string") {
    return value;
  }
  return String(value);
}

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Extract the string value type from a branded type
 */
export type UnbrandString<T> = T extends CSSSelector
  ? string
  : T extends ClassName
    ? string
    : T extends ElementId
      ? string
      : T;

/**
 * Check if a value is any branded string type
 */
export function isBrandedString(
  value: unknown,
): value is CSSSelector | ClassName | ElementId {
  if (!value || typeof value !== "object") return false;

  const branded = value as any;
  return (
    branded.__brand === "CSSSelector" ||
    branded.__brand === "ClassName" ||
    branded.__brand === "ElementId"
  );
}

// ============================================================================
// Exports
// ============================================================================

// Note: We export everything as named exports, no default export
// to avoid issues with mixed import styles
