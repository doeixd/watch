# Explicit API Specification

## Overview

This specification defines explicit, non-overloaded versions of the heavily overloaded functions in watch-selector. These functions have clear, unambiguous names that indicate exactly what they do, eliminating confusion from overload resolution.

## Rationale

The main API uses extensive TypeScript overloading to provide a flexible, context-aware interface. However, this can lead to:
- Confusion about which overload is being called
- Type inference issues in complex scenarios
- Difficulty understanding code behavior at a glance
- Challenges for developers coming from languages without overloading

The explicit API provides:
- **Clear intent** - Function names describe exactly what they do
- **No ambiguity** - Each function has a single, specific purpose
- **Better IntelliSense** - IDE autocomplete shows all available operations
- **Easier debugging** - Clear stack traces and error messages
- **Language agnostic** - Works well even without TypeScript

## Naming Conventions

### Pattern 1: Action-Target-Mode
```
{action}{Target}{Mode}
```
Examples:
- `textElement()` - Set text on an element
- `textSelector()` - Set text on elements matching selector
- `textGenerator()` - Return generator function for text

### Pattern 2: Get/Set Prefixes
```
get{Property}{Target}
set{Property}{Target}
```
Examples:
- `getTextElement()` - Get text from element
- `setTextElement()` - Set text on element
- `getTextSelector()` - Get text from first matching element
- `setTextSelector()` - Set text on all matching elements

### Pattern 3: Mode Suffixes
```
{action}{Property}{Suffix}
```
Suffixes:
- `El` / `Element` - Direct element operation
- `Sel` / `Selector` - Selector-based operation
- `Gen` / `Generator` - Generator function
- `All` - Apply to all matching elements
- `First` - Apply to first matching element
- `Query` - Query and return result

## Core Functions to Explicitize

### Text Manipulation

Current overloaded function:
```typescript
function text(element: Element, content: string): void;
function text(selector: string, content: string): void;
function text(content: string): ElementFn<Element, void>;
function text(element: Element): string;
function text(selector: string): string;
function text(): ElementFn<Element, string>;
```

Explicit versions:
```typescript
// Set operations
function setTextElement(element: Element, content: string): void;
function setTextSelector(selector: string, content: string): void;
function setTextAll(selector: string, content: string): void;
function setTextFirst(selector: string, content: string): void;

// Get operations
function getTextElement(element: Element): string;
function getTextSelector(selector: string): string | null;
function getTextFirst(selector: string): string | null;
function getTextAll(selector: string): string[];

// Generator operations
function textGen(content: string): ElementFn<Element, void>;
function textGetGen(): ElementFn<Element, string>;
```

### Class Manipulation

Current overloaded function:
```typescript
function addClass(element: Element, ...classes: string[]): void;
function addClass(selector: string, ...classes: string[]): void;
function addClass(...classes: string[]): ElementFn<Element, void>;
```

Explicit versions:
```typescript
// Add classes
function addClassElement(element: Element, ...classes: string[]): void;
function addClassSelector(selector: string, ...classes: string[]): void;
function addClassAll(selector: string, ...classes: string[]): void;
function addClassFirst(selector: string, ...classes: string[]): void;
function addClassGen(...classes: string[]): ElementFn<Element, void>;

// Remove classes
function removeClassElement(element: Element, ...classes: string[]): void;
function removeClassSelector(selector: string, ...classes: string[]): void;
function removeClassAll(selector: string, ...classes: string[]): void;
function removeClassFirst(selector: string, ...classes: string[]): void;
function removeClassGen(...classes: string[]): ElementFn<Element, void>;

// Toggle classes
function toggleClassElement(element: Element, className: string, force?: boolean): boolean;
function toggleClassSelector(selector: string, className: string, force?: boolean): boolean[];
function toggleClassFirst(selector: string, className: string, force?: boolean): boolean | null;
function toggleClassGen(className: string, force?: boolean): ElementFn<Element, boolean>;

// Check classes
function hasClassElement(element: Element, className: string): boolean;
function hasClassSelector(selector: string, className: string): boolean | null;
function hasClassAll(selector: string, className: string): boolean[];
function hasClassGen(className: string): ElementFn<Element, boolean>;
```

### Style Manipulation

Current overloaded function:
```typescript
function style(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void;
function style(element: HTMLElement, prop: string, value: string): void;
function style(element: HTMLElement, prop: string): string;
// ... many more overloads
```

Explicit versions:
```typescript
// Set multiple styles
function setStylesElement(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void;
function setStylesSelector(selector: string, styles: Partial<CSSStyleDeclaration>): void;
function setStylesAll(selector: string, styles: Partial<CSSStyleDeclaration>): void;
function setStylesGen(styles: Partial<CSSStyleDeclaration>): ElementFn<HTMLElement, void>;

// Set single style
function setStyleElement(element: HTMLElement, prop: string, value: string): void;
function setStyleSelector(selector: string, prop: string, value: string): void;
function setStyleAll(selector: string, prop: string, value: string): void;
function setStyleGen(prop: string, value: string): ElementFn<HTMLElement, void>;

// Get style
function getStyleElement(element: HTMLElement, prop: string): string;
function getStyleSelector(selector: string, prop: string): string | null;
function getStyleFirst(selector: string, prop: string): string | null;
function getStyleGen(prop: string): ElementFn<HTMLElement, string>;
```

### Attribute Manipulation

Current overloaded function:
```typescript
function attr(element: Element, name: string, value: string | number | boolean): void;
function attr(element: Element, name: string): string | null;
// ... many more overloads
```

Explicit versions:
```typescript
// Set attributes
function setAttrElement(element: Element, name: string, value: string | number | boolean): void;
function setAttrSelector(selector: string, name: string, value: string | number | boolean): void;
function setAttrAll(selector: string, name: string, value: string | number | boolean): void;
function setAttrGen(name: string, value: string | number | boolean): ElementFn<Element, void>;

// Get attributes
function getAttrElement(element: Element, name: string): string | null;
function getAttrSelector(selector: string, name: string): string | null;
function getAttrFirst(selector: string, name: string): string | null;
function getAttrAll(selector: string, name: string): (string | null)[];
function getAttrGen(name: string): ElementFn<Element, string | null>;

// Remove attributes
function removeAttrElement(element: Element, name: string): void;
function removeAttrSelector(selector: string, name: string): void;
function removeAttrAll(selector: string, name: string): void;
function removeAttrGen(name: string): ElementFn<Element, void>;

// Check attributes
function hasAttrElement(element: Element, name: string): boolean;
function hasAttrSelector(selector: string, name: string): boolean | null;
function hasAttrAll(selector: string, name: string): boolean[];
function hasAttrGen(name: string): ElementFn<Element, boolean>;
```

### Event Handling

Current overloaded function:
```typescript
function click(element: HTMLElement, handler: EventHandler, options?: EventOptions): void;
function click(selector: string, handler: EventHandler, options?: EventOptions): void;
function click(handler: EventHandler, options?: EventOptions): ElementFn<HTMLElement, void>;
```

Explicit versions:
```typescript
// Click events
function clickElement(element: HTMLElement, handler: EventHandler, options?: EventOptions): void;
function clickSelector(selector: string, handler: EventHandler, options?: EventOptions): void;
function clickAll(selector: string, handler: EventHandler, options?: EventOptions): void;
function clickFirst(selector: string, handler: EventHandler, options?: EventOptions): void;
function clickGen(handler: EventHandler, options?: EventOptions): ElementFn<HTMLElement, void>;

// Generic events
function onElement(element: HTMLElement, event: string, handler: EventHandler, options?: EventOptions): void;
function onSelector(selector: string, event: string, handler: EventHandler, options?: EventOptions): void;
function onAll(selector: string, event: string, handler: EventHandler, options?: EventOptions): void;
function onGen(event: string, handler: EventHandler, options?: EventOptions): ElementFn<HTMLElement, void>;

// Delegated events
function onDelegate(parent: Element, childSelector: string, event: string, handler: EventHandler): void;
function clickDelegate(parent: Element, childSelector: string, handler: EventHandler): void;
```

### DOM Traversal

Current overloaded function:
```typescript
function query<S extends string>(element: Element, selector: S): ElementFromSelector<S> | null;
function query<S extends string>(parentSelector: string, childSelector: S): ElementFromSelector<S> | null;
function query<S extends string>(selector: S): ElementFn<Element, ElementFromSelector<S> | null>;
```

Explicit versions:
```typescript
// Query operations
function queryElement<S extends string>(element: Element, selector: S): ElementFromSelector<S> | null;
function querySelector<S extends string>(parentSelector: string, childSelector: S): ElementFromSelector<S> | null;
function queryDocument<S extends string>(selector: S): ElementFromSelector<S> | null;
function queryGen<S extends string>(selector: S): ElementFn<Element, ElementFromSelector<S> | null>;

// Query all operations
function queryAllElement<S extends string>(element: Element, selector: S): ElementFromSelector<S>[];
function queryAllSelector<S extends string>(parentSelector: string, childSelector: S): ElementFromSelector<S>[];
function queryAllDocument<S extends string>(selector: S): ElementFromSelector<S>[];
function queryAllGen<S extends string>(selector: S): ElementFn<Element, ElementFromSelector<S>[]>;

// Parent operations
function getParentElement(element: Element): HTMLElement | null;
function getParentSelector(selector: string): HTMLElement | null;
function getParentGen(): ElementFn<Element, HTMLElement | null>;

// Children operations
function getChildrenElement(element: Element): Element[];
function getChildrenSelector(selector: string): Element[];
function getChildrenGen(): ElementFn<Element, Element[]>;

// Siblings operations
function getSiblingsElement(element: Element): Element[];
function getSiblingsSelector(selector: string): Element[];
function getSiblingsGen(): ElementFn<Element, Element[]>;
```

### Form Value Manipulation

Current overloaded function:
```typescript
function value(element: FormElement, val: string): void;
function value(element: FormElement): string;
// ... more overloads
```

Explicit versions:
```typescript
// Value operations
function setValueElement(element: FormElement, val: string): void;
function setValueSelector(selector: string, val: string): void;
function setValueAll(selector: string, val: string): void;
function setValueGen(val: string): ElementFn<FormElement, void>;

function getValueElement(element: FormElement): string;
function getValueSelector(selector: string): string | null;
function getValueFirst(selector: string): string | null;
function getValueAll(selector: string): string[];
function getValueGen(): ElementFn<FormElement, string>;

// Checked operations
function setCheckedElement(element: HTMLInputElement, state: boolean): void;
function setCheckedSelector(selector: string, state: boolean): void;
function setCheckedAll(selector: string, state: boolean): void;
function setCheckedGen(state: boolean): ElementFn<HTMLInputElement, void>;

function isCheckedElement(element: HTMLInputElement): boolean;
function isCheckedSelector(selector: string): boolean | null;
function isCheckedAll(selector: string): boolean[];
function isCheckedGen(): ElementFn<HTMLInputElement, boolean>;
```

## Fluent API Module

Alternative approach using a fluent/chainable API:

```typescript
// Selector-based fluent API
interface FluentSelector {
  // Text operations
  text(content: string): FluentSelector;
  getText(): string | null;
  getTextAll(): string[];
  
  // Class operations
  addClass(...classes: string[]): FluentSelector;
  removeClass(...classes: string[]): FluentSelector;
  toggleClass(className: string, force?: boolean): FluentSelector;
  hasClass(className: string): boolean | null;
  hasClassAll(className: string): boolean[];
  
  // Style operations
  style(prop: string, value: string): FluentSelector;
  styles(styles: Partial<CSSStyleDeclaration>): FluentSelector;
  getStyle(prop: string): string | null;
  
  // Attribute operations
  attr(name: string, value: string | number | boolean): FluentSelector;
  getAttr(name: string): string | null;
  removeAttr(name: string): FluentSelector;
  hasAttr(name: string): boolean | null;
  
  // Event operations
  click(handler: EventHandler, options?: EventOptions): FluentSelector;
  on(event: string, handler: EventHandler, options?: EventOptions): FluentSelector;
  
  // DOM traversal
  query<S extends string>(selector: S): FluentSelector;
  queryAll<S extends string>(selector: S): FluentSelector;
  parent(): FluentSelector;
  children(): FluentSelector;
  siblings(): FluentSelector;
  
  // Execution
  first(): FluentSelector;  // Apply to first match only
  all(): FluentSelector;    // Apply to all matches (default)
  each(fn: (element: Element, index: number) => void): FluentSelector;
  
  // Get elements
  elements(): Element[];
  element(): Element | null;
}

// Factory functions
function selector(selector: string): FluentSelector;
function element(element: Element): FluentSelector;
function elements(elements: Element[] | NodeList): FluentSelector;

// Usage examples:
selector('#button')
  .text('Click me!')
  .addClass('primary', 'large')
  .style('backgroundColor', 'blue')
  .click(() => console.log('Clicked!'));

selector('.items')
  .addClass('found')
  .each((el, i) => console.log(`Item ${i}:`, el));

const buttonText = selector('#submit').getText();
const allTexts = selector('.item').getTextAll();
```

## Implementation Structure

### File Organization
```
src/
  explicit/
    index.ts           # Main exports for explicit API
    text.ts            # Text manipulation functions
    class.ts           # Class manipulation functions
    style.ts           # Style manipulation functions
    attr.ts            # Attribute manipulation functions
    event.ts           # Event handling functions
    dom.ts             # DOM traversal functions
    form.ts            # Form value functions
    
  fluent/
    index.ts           # Fluent API exports
    selector.ts        # FluentSelector implementation
    element.ts         # FluentElement implementation
    
  builders/
    index.ts           # Builder pattern exports
    element-builder.ts # Element builder implementation
    event-builder.ts   # Event builder implementation
```

### Export Strategy

```typescript
// Main package maintains backward compatibility
export * from './api/dom';  // Original overloaded functions

// Explicit functions in submodule
export * as explicit from './explicit';

// Fluent API in submodule
export * as fluent from './fluent';

// Usage:
import { text } from 'watch-selector';                    // Overloaded
import { setTextElement } from 'watch-selector/explicit'; // Explicit
import { selector } from 'watch-selector/fluent';         // Fluent

// Or import everything explicit:
import * as explicit from 'watch-selector/explicit';
explicit.setTextElement(element, 'Hello');
explicit.addClassSelector('.items', 'found');
```

## Benefits by Use Case

### 1. Learning & Onboarding
Explicit functions are easier to understand:
```typescript
// Clear what each function does
setTextElement(btn, 'Submit');
addClassSelector('.active', 'highlighted');
clickElement(btn, handleClick);
```

### 2. Code Reviews
Intent is immediately clear:
```typescript
// Obvious this sets text on all matching elements
setTextAll('.status', 'Updated');

// Clear this only affects the first match
setTextFirst('.message', 'Hello');
```

### 3. Debugging
Better stack traces and error messages:
```typescript
// Error: setTextElement expects an Element, got null
setTextElement(null, 'text');

// Clear function name in stack trace
// at setTextElement (explicit/text.ts:10:5)
```

### 4. Testing
Easier to mock and spy on specific operations:
```typescript
// Can mock specific operations
jest.spyOn(explicit, 'setTextElement');
jest.spyOn(explicit, 'addClassSelector');

// Test specific behavior
expect(explicit.setTextElement).toHaveBeenCalledWith(element, 'Expected');
```

### 5. Migration
Easier to migrate from other libraries:
```typescript
// jQuery migration
$('.item').text('Hello');           // jQuery
setTextAll('.item', 'Hello');       // Explicit API

// Vanilla JS migration
element.textContent = 'Hello';      // Vanilla
setTextElement(element, 'Hello');   // Explicit API
```

## Type Safety Improvements

### Explicit Return Types
```typescript
// Always know what you're getting
const text: string = getTextElement(element);
const texts: string[] = getTextAll('.items');
const maybeText: string | null = getTextFirst('.optional');
```

### No Overload Confusion
```typescript
// TypeScript knows exactly which function signature
setTextElement(element, 'Hello');  // (element: Element, content: string) => void
getTextElement(element);           // (element: Element) => string
```

### Better Generic Inference
```typescript
// Clear generic boundaries
function processElement<T extends HTMLElement>(el: T) {
  setTextElement(el, 'Processed');
  return getAttrElement(el, 'id');
}
```

## Performance Considerations

### Tree Shaking
Explicit functions enable better tree shaking:
```typescript
// Only imports the specific functions used
import { setTextElement, addClassElement } from 'watch-selector/explicit';

// Bundler can eliminate unused functions
```

### No Runtime Overload Resolution
```typescript
// Direct function call - no runtime type checking
setTextElement(element, 'Hello');

// vs overloaded version which needs runtime checks
text(element, 'Hello');  // Needs to determine which overload
```

## Migration Guide

### From Overloaded API
```typescript
// Before (overloaded)
text(element, 'Hello');
text('#button', 'Click');
const content = text(element);

// After (explicit)
setTextElement(element, 'Hello');
setTextSelector('#button', 'Click');
const content = getTextElement(element);
```

### Gradual Migration
Both APIs can coexist:
```typescript
import { text } from 'watch-selector';                    // Keep using overloaded
import { setTextElement } from 'watch-selector/explicit'; // Use explicit where needed

// Mix and match as needed
text(element, 'Hello');           // Existing code
setTextElement(newElement, 'Hi'); // New code with explicit API
```

## Conclusion

The explicit API provides:
- **Clarity** - Function names describe exactly what they do
- **Predictability** - No surprises from overload resolution
- **Discoverability** - Better autocomplete and documentation
- **Debugging** - Clearer error messages and stack traces
- **Performance** - Better tree shaking and no runtime checks

Choose the explicit API when you value clarity and predictability over terseness.