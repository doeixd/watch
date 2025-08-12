/**
 * @module explicit/types
 *
 * Type definitions specific to the explicit API.
 * These types provide clear, unambiguous type definitions for the explicit functions.
 */

import type { ElementFn as BaseElementFn } from '../types';

/**
 * Explicit element function type - a function that operates on an element.
 * This is the same as ElementFn but renamed for clarity in the explicit API.
 */
export type ExplicitElementFn<El extends Element, R = void> = BaseElementFn<El, R>;

/**
 * Explicit generator function type - a generator function that yields element functions.
 * Used for functions that return generators for use in watch contexts.
 */
export type ExplicitGeneratorFn<El extends Element = Element> = (element: El) => void;

/**
 * Explicit event handler type - a function that handles events.
 * Simplified version without overloading for generator patterns.
 */
export type ExplicitEventHandler<E extends Event = Event, El extends Element = Element> =
  (this: El, event: E) => void | Promise<void>;

/**
 * Explicit selector type - just a string representing a CSS selector.
 * Named for clarity in the explicit API.
 */
export type ExplicitSelector = string;

/**
 * Result type for functions that may or may not find an element.
 * Used for first/single element operations.
 */
export type MaybeResult<T> = T | null;

/**
 * Result type for functions that operate on multiple elements.
 * Always returns an array, even if empty.
 */
export type MultiResult<T> = T[];

/**
 * Property key type for DOM element properties.
 * Constrains to valid property names.
 */
export type PropertyKey<El extends Element> = keyof El;

/**
 * Attribute value type for HTML attributes.
 * Can be string, number, or boolean.
 */
export type AttributeValue = string | number | boolean;

/**
 * Style property type for CSS properties.
 * Can be any valid CSS property name.
 */
export type StyleProperty = keyof CSSStyleDeclaration | string;

/**
 * Style value type for CSS values.
 * Always a string.
 */
export type StyleValue = string;

/**
 * Class name type for CSS classes.
 * Just a string, but named for clarity.
 */
export type ClassName = string;

/**
 * Event name type for DOM events.
 * Can be a known event or custom string.
 */
export type EventName = keyof HTMLElementEventMap | string;

/**
 * Form element type - union of all form-related elements.
 */
export type FormElement =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLFormElement;

/**
 * Input element type - specific input elements.
 */
export type InputElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Options for explicit event handlers.
 * Simplified version without complex overloading.
 */
export interface ExplicitEventOptions extends AddEventListenerOptions {
  /** Debounce delay in milliseconds */
  debounce?: number;
  /** Throttle delay in milliseconds */
  throttle?: number;
  /** Delegate to child selector */
  delegate?: string;
}
