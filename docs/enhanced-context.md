# Enhanced Context API

The Enhanced Context API provides a more ergonomic way to use DOM manipulation functions within watch generators by attaching them directly to the context object passed to generator functions.

## Overview

Instead of importing and using DOM functions separately, the enhanced context provides all DOM manipulation functions as methods on the context object itself. This creates a more cohesive and convenient API, especially when working with multiple DOM operations.

## Basic Usage

### Standard Watch API (Original)

```typescript
import { watch, text, addClass, style } from 'watch-selector';

watch('button', function* () {
  yield text('Click me');
  yield addClass('interactive');
  yield style('color', 'blue');
});
```

### Enhanced Watch API (New)

```typescript
import { watchEnhanced } from 'watch-selector';

watchEnhanced('button', function* (ctx) {
  yield* ctx.text('Click me');
  yield* ctx.addClass('interactive');
  yield* ctx.style('color', 'blue');
});
```

## Key Differences

1. **Context Parameter**: Enhanced watch always passes a context parameter to the generator
2. **Attached Methods**: All DOM functions are available as methods on the context
3. **yield* Pattern**: Uses `yield*` instead of `yield` for better type inference
4. **No Imports Needed**: No need to import individual DOM functions

## Available Functions

All DOM manipulation functions from `dom-new.ts` are available on the enhanced context:

### Text and HTML Content
- `ctx.text(content?)` - Set or get text content
- `ctx.html(content?)` - Set or get HTML content

### Class Manipulation
- `ctx.addClass(className)` - Add classes
- `ctx.removeClass(className)` - Remove classes
- `ctx.toggleClass(className, force?)` - Toggle classes
- `ctx.hasClass(className)` - Check if class exists

### Style Manipulation
- `ctx.style(prop, value)` - Set a style property
- `ctx.style(styles)` - Set multiple styles
- `ctx.style(prop)` - Get a style property

### Attribute Manipulation
- `ctx.attr(name, value)` - Set an attribute
- `ctx.attr(attrs)` - Set multiple attributes
- `ctx.attr(name)` - Get an attribute
- `ctx.removeAttr(name)` - Remove an attribute
- `ctx.hasAttr(name)` - Check if attribute exists

### Property Manipulation
- `ctx.prop(name, value)` - Set a property
- `ctx.prop(name)` - Get a property

### Data Attributes
- `ctx.data(key, value)` - Set a data attribute
- `ctx.data(data)` - Set multiple data attributes
- `ctx.data(key)` - Get a data attribute
- `ctx.data()` - Get all data attributes

### Form Elements
- `ctx.value(value?)` - Set or get input value
- `ctx.checked(checked?)` - Set or get checked state

### Focus Management
- `ctx.focus()` - Focus the element
- `ctx.blur()` - Blur the element

### Visibility
- `ctx.show()` - Show the element
- `ctx.hide()` - Hide the element

### DOM Traversal
- `ctx.query(selector)` - Find child element
- `ctx.queryAll(selector)` - Find all child elements
- `ctx.parent(selector?)` - Get parent element
- `ctx.children(selector?)` - Get child elements
- `ctx.siblings(selector?)` - Get sibling elements

## Examples

### Complex DOM Manipulation

```typescript
import { watchEnhanced } from 'watch-selector';

watchEnhanced('.card', function* (ctx) {
  // Set initial content
  yield* ctx.addClass('initialized');
  yield* ctx.attr('role', 'article');
  
  // Style the card
  yield* ctx.style({
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  });
  
  // Find and modify child elements
  const title = yield* ctx.query('h2');
  if (title) {
    yield* ctx.addClass('card-title');
  }
});
```

### Form Handling

```typescript
import { watchEnhanced } from 'watch-selector';

watchEnhanced('input[type="email"]', function* (ctx) {
  // Set placeholder
  yield* ctx.attr('placeholder', 'Enter your email');
  
  // Add validation classes
  yield* ctx.addClass('form-control');
  
  // Set initial value if needed
  const currentValue = yield* ctx.value();
  if (!currentValue) {
    yield* ctx.value('user@example.com');
  }
  
  // Focus the input
  yield* ctx.focus();
});
```

### Reading Values

```typescript
import { watchEnhanced } from 'watch-selector';

watchEnhanced('.status', function* (ctx) {
  // Read current values
  const text = yield* ctx.text();
  const hasError = yield* ctx.hasClass('error');
  const dataId = yield* ctx.attr('data-id');
  
  // Conditional logic based on current state
  if (hasError) {
    yield* ctx.style('color', 'red');
    yield* ctx.attr('aria-invalid', 'true');
  } else {
    yield* ctx.style('color', 'green');
    yield* ctx.attr('aria-invalid', 'false');
  }
  
  console.log(`Status ${dataId}: ${text}`);
});
```

### Async Operations

```typescript
import { watchEnhanced } from 'watch-selector';

watchEnhanced('.async-content', async function* (ctx) {
  // Show loading state
  yield* ctx.text('Loading...');
  yield* ctx.addClass('loading');
  
  // Fetch data
  const response = await fetch('/api/data');
  const data = await response.json();
  
  // Update with results
  yield* ctx.text(data.content);
  yield* ctx.removeClass('loading');
  yield* ctx.addClass('loaded');
});
```

## API Functions

### watchEnhanced

```typescript
watchEnhanced<S extends string>(
  selector: S,
  generator: (ctx: EnhancedTypedGeneratorContext<ElementFromSelector<S>>) => Generator
): WatchController<ElementFromSelector<S>>
```

Watch elements with enhanced context. Supports all the same patterns as regular `watch()`.

### runOnEnhanced

```typescript
runOnEnhanced<El extends HTMLElement, T = void>(
  element: El,
  generator: (ctx: EnhancedTypedGeneratorContext<El>) => Generator<any, T>
): Promise<T | undefined>
```

Run a generator on a specific element with enhanced context.

### scopedWatchEnhanced

```typescript
scopedWatchEnhanced<ParentEl extends HTMLElement, S extends string>(
  parent: ParentEl,
  selector: S,
  generator: (ctx: EnhancedTypedGeneratorContext<ElementFromSelector<S>>) => Generator
): WatchController<ElementFromSelector<S>>
```

Watch child elements within a parent scope with enhanced context.

## Type Safety

The enhanced context maintains full type safety:

```typescript
import { watchEnhanced } from 'watch-selector';

// Element type is inferred from selector
watchEnhanced('button', function* (ctx) {
  const button = ctx.self(); // HTMLButtonElement
  const element = ctx.element; // HTMLButtonElement
});

watchEnhanced('input[type="email"]', function* (ctx) {
  const input = ctx.self(); // HTMLInputElement
  yield* ctx.value('test@example.com'); // Type-safe for input elements
});
```

## Context Properties

The enhanced context includes all base context properties:

- `ctx.element` - The current element
- `ctx.selector` - The selector used
- `ctx.index` - Index in the matched elements
- `ctx.array` - Array of all matched elements
- `ctx.self()` - Get the current element (typed)
- `ctx.el(selector)` - Query for child element
- `ctx.all(selector)` - Query for all child elements
- `ctx.cleanup(fn)` - Register cleanup function
- `ctx.ctx()` - Get the base watch context

## Migration Guide

To migrate from standard watch to enhanced watch:

1. Change `watch` to `watchEnhanced`
2. Add context parameter to generator function
3. Replace `yield` with `yield*`
4. Replace imported functions with `ctx.` methods
5. Remove individual function imports

### Before

```typescript
import { watch, text, addClass, on } from 'watch-selector';

watch('.item', function* () {
  yield text('Ready');
  yield addClass('initialized');
  yield on('click', () => {
    console.log('Clicked');
  });
});
```

### After

```typescript
import { watchEnhanced } from 'watch-selector';

watchEnhanced('.item', function* (ctx) {
  yield* ctx.text('Ready');
  yield* ctx.addClass('initialized');
  // Note: Event handling still needs to be imported separately
  // as it has different patterns
});
```

## Performance Considerations

The enhanced context has minimal performance overhead:

- Functions are attached once per context creation
- No additional memory allocation per operation
- Same underlying DOM manipulation functions
- Type checking happens at compile time only

## Limitations

Currently, the enhanced context includes DOM manipulation functions but not event handling functions, as they have different usage patterns and would require different integration approaches.

## Summary

The Enhanced Context API provides a more ergonomic and cohesive way to work with DOM manipulation in watch generators. It reduces the need for imports, provides better organization of related operations, and maintains full type safety while using the efficient `yield*` pattern for generator composition.