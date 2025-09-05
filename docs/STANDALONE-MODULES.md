# Standalone Modules Guide

**watch-selector** now supports standalone module imports for the explicit and fluent APIs. This guide shows you how to use them and migrate from namespace imports.

## Overview

Starting in v2.1.0, you can import explicit and fluent APIs as dedicated modules:

```typescript
// ✅ NEW: Standalone module imports
import { setTextElement, addClassElement } from 'watch-selector/explicit';
import { selector, element } from 'watch-selector/fluent';

// ✅ STILL WORKS: Namespace imports (backward compatible)
import { explicit, fluent } from 'watch-selector';
explicit.setTextElement(element, 'text');
fluent.selector('#button').addClass('active');
```

## Module Comparison

| Module | Purpose | Best For | Import Size |
|--------|---------|----------|-------------|
| **Main** | Generator-based reactive DOM | Dynamic applications, complex state | ~153KB |
| **Explicit** | Clear, unambiguous functions | Utility scripts, simple operations | ~28KB |
| **Fluent** | jQuery-like method chaining | Complex DOM manipulation, traversal | ~11KB |

## Explicit Module (`watch-selector/explicit`)

### Core Philosophy
- **One function, one purpose** - No overloading ambiguity
- **Clear naming** - Function name describes exactly what it does
- **Type safety** - Explicit element vs selector handling

### Basic Usage

```typescript
import {
  setTextElement,
  setTextSelector,
  setTextAll,
  addClassElement,
  clickElement
} from 'watch-selector/explicit';

// Work with elements directly
const button = document.getElementById('submit');
setTextElement(button, 'Submit');
addClassElement(button, 'primary');
clickElement(button, () => console.log('clicked'));

// Work with selectors (operates on first match)
setTextSelector('#status', 'Ready');
addClassSelector('.card', 'loaded');

// Work with all matching elements
setTextAll('.item', 'Updated');
```

### Generator Support

All explicit functions have generator versions for use with `yield*`:

```typescript
import { textGen, addClassGen, clickGen } from 'watch-selector/explicit';
import { watch } from 'watch-selector';

watch('.dynamic-element', function* () {
  yield* textGen('Dynamic content');
  yield* addClassGen('interactive');
  yield* clickGen(() => console.log('Generator click'));
});
```

### Complete Function Reference

**Text Functions:**
- `setTextElement(el, text)` - Set text on element
- `setTextSelector(sel, text)` - Set text on first match
- `setTextAll(sel, text)` - Set text on all matches
- `getTextElement(el)` - Get text from element
- `appendTextElement(el, text)` - Append text to element
- `prependTextElement(el, text)` - Prepend text to element

**Class Functions:**
- `addClassElement(el, ...classes)` - Add classes to element
- `addClassSelector(sel, ...classes)` - Add classes to first match
- `removeClassElement(el, ...classes)` - Remove classes from element
- `toggleClassElement(el, class)` - Toggle class on element
- `hasClassElement(el, class)` - Check if element has class

**Event Functions:**
- `clickElement(el, handler)` - Add click listener to element
- `clickSelector(sel, handler)` - Add click listener to first match
- `inputElement(el, handler)` - Add input listener to element
- `onElement(el, event, handler)` - Add any event listener to element

## Fluent Module (`watch-selector/fluent`)

### Core Philosophy
- **Method chaining** - jQuery-like interface for readable code
- **Fluent traversal** - Navigate DOM tree with chained methods
- **Batch operations** - Work with multiple elements elegantly

### Basic Usage

```typescript
import { selector, element, elements, $fluent } from 'watch-selector/fluent';

// Selector-based chaining
selector('#main-button')
  .text('Click Me!')
  .addClass('primary', 'large')
  .style('backgroundColor', 'blue')
  .click(() => console.log('Clicked!'))
  .show();

// Element-based chaining
const button = document.querySelector('button');
element(button)
  .addClass('enhanced')
  .text('Enhanced Button')
  .focus();

// Multiple elements
const cards = document.querySelectorAll('.card');
elements(cards)
  .addClass('styled')
  .each((el, index) => {
    element(el).text(`Card ${index + 1}`);
  });

// jQuery-style alias
$fluent('.item').addClass('found').show();
```

### DOM Traversal

The fluent API excels at complex DOM navigation:

```typescript
import { selector } from 'watch-selector/fluent';

// Navigate complex structures
selector('.article')
  .find('.header')
  .addClass('visible')
  .text('Article Title')
  .siblings('.content')
  .show()
  .find('p')
  .addClass('paragraph')
  .parent()
  .parent()
  .find('.footer')
  .addClass('article-footer');

// Form handling with traversal
selector('.form-group')
  .find('input[type="email"]')
  .val('user@example.com')
  .addClass('filled')
  .parent()
  .find('label')
  .addClass('active')
  .parent()
  .find('.validation')
  .hide();
```

### Event Handling

```typescript
import { selector, element } from 'watch-selector/fluent';

// Simple event handling
selector('.menu-toggle')
  .click(() => {
    selector('.menu').toggle();
  })
  .addClass('interactive');

// Complex event chains
selector('.todo-form')
  .find('input[type="text"]')
  .on('input', function() {
    const value = this.value;
    element(this)
      .toggleClass('valid', value.length > 0)
      .siblings('.counter')
      .text(`${value.length} characters`);
  })
  .parent()
  .find('button')
  .click((event) => {
    event.preventDefault();
    
    const form = event.target.closest('form');
    selector(form)
      .addClass('submitting')
      .find('input')
      .attr('disabled', 'true');
  });
```

### Integration with Watch

```typescript
import { watch } from 'watch-selector';
import { selector, element } from 'watch-selector/fluent';

watch('.dynamic-component', function* () {
  // Use fluent API for setup
  const component = selector(self())
    .addClass('initializing')
    .text('Loading...');

  // Add reactive behavior
  yield* clickGen(function* (event) {
    const target = event.target as Element;
    
    // Fluent manipulation within generators
    element(target)
      .toggleClass('active')
      .siblings()
      .removeClass('active');
  });
  
  // Final setup
  component
    .removeClass('initializing')
    .addClass('ready')
    .text('Component Ready');
});
```

## Migration Guide

### From Namespace Imports

**Before:**
```typescript
import { explicit, fluent } from 'watch-selector';

explicit.setTextElement(element, 'text');
fluent.selector('#button').addClass('active');
```

**After:**
```typescript
import { setTextElement } from 'watch-selector/explicit';
import { selector } from 'watch-selector/fluent';

setTextElement(element, 'text');
selector('#button').addClass('active');
```

### Benefits of Migration

1. **Better Tree Shaking** - Bundlers can eliminate unused code
2. **Smaller Bundles** - Only import what you need
3. **Clearer Intent** - Module choice indicates coding style
4. **Better IntelliSense** - More focused autocompletion

## When to Use Which Module

### Use **Main Module** (`watch-selector`) when:
- Building reactive applications
- Need generator-based composition
- Want automatic DOM observation
- Require state management
- Building complex interactive components

```typescript
import { watch, text, addClass, getState } from 'watch-selector';

watch('.counter', function* () {
  const count = yield* getState('count', 0);
  yield* text(`Count: ${count}`);
  yield* click(function* () {
    yield* setState('count', count + 1);
  });
});
```

### Use **Explicit Module** (`watch-selector/explicit`) when:
- Writing utility functions
- Need predictable function behavior
- Prefer clear, unambiguous names
- Working with known elements
- Building simple scripts

```typescript
import { setTextElement, addClassElement } from 'watch-selector/explicit';

function updateButton(button: HTMLButtonElement, text: string) {
  setTextElement(button, text);
  addClassElement(button, 'updated');
}
```

### Use **Fluent Module** (`watch-selector/fluent`) when:
- Performing complex DOM manipulation
- Need elegant method chaining
- Working with multiple related operations
- Prefer jQuery-like syntax
- Building UI transformation scripts

```typescript
import { selector } from 'watch-selector/fluent';

selector('.modal')
  .addClass('show')
  .find('.close-button')
  .click(() => selector('.modal').removeClass('show'))
  .parent()
  .find('.content')
  .text('Modal content updated');
```

## Performance Considerations

### Bundle Size Impact

| Import Style | Typical Bundle Size | Use Case |
|--------------|-------------------|----------|
| Main module only | ~153KB | Full reactive applications |
| Explicit only | ~28KB | Utility scripts, simple operations |
| Fluent only | ~11KB | DOM manipulation scripts |
| Mixed imports | Varies | Complex applications with different needs |

### Memory Usage

- **Explicit**: Minimal overhead, direct function calls
- **Fluent**: Slight overhead for chaining objects
- **Main**: Higher overhead for observer system and state management

### Execution Speed

- **Explicit**: Fastest - direct DOM operations
- **Fluent**: Fast - minimal chaining overhead  
- **Main**: Moderate - includes reactive observation

## TypeScript Support

All modules provide full TypeScript support:

### Explicit Module Types

```typescript
import type { ExplicitElementFn, ExplicitGeneratorFn } from 'watch-selector/explicit';

// Functions are strictly typed
const setText: ExplicitElementFn<[string | number], void> = setTextElement;
const textGen: ExplicitGeneratorFn<[string], void> = textGen;
```

### Fluent Module Types

```typescript
import type { FluentSelector } from 'watch-selector/fluent';

// Chaining maintains type safety
const typedChain: FluentSelector<HTMLButtonElement> = 
  selector<HTMLButtonElement>('#button')
    .addClass('typed')
    .text('Type-safe text');
```

## Best Practices

### Module Selection
1. **Start with explicit** for simple scripts and utilities
2. **Use fluent** for complex DOM manipulation sequences  
3. **Use main module** for reactive applications and dynamic content
4. **Mix modules** based on specific needs within the same project

### Import Optimization
```typescript
// ✅ Import only what you need
import { setTextElement, addClassElement } from 'watch-selector/explicit';

// ❌ Don't import entire namespaces unless you need them
import * as explicit from 'watch-selector/explicit'; // Larger bundle
```

### Performance Tips
- Use explicit module for one-off operations
- Use fluent module for related operation sequences
- Use main module only when you need reactivity
- Consider lazy loading modules for conditional features

## Example Projects

### Utility Script (Explicit)
```typescript
import { setTextElement, addClassElement, clickElement } from 'watch-selector/explicit';

// Simple enhancement script
document.querySelectorAll('button').forEach(button => {
  addClassElement(button, 'enhanced');
  clickElement(button, () => {
    setTextElement(button, 'Clicked!');
  });
});
```

### UI Enhancement (Fluent)
```typescript
import { selector } from 'watch-selector/fluent';

// Complex UI transformations
selector('.dashboard')
  .find('.widget')
  .addClass('interactive')
  .each((widget, index) => {
    selector(widget)
      .find('.title')
      .text(`Widget ${index + 1}`)
      .parent()
      .find('.content')
      .style('animationDelay', `${index * 100}ms`)
      .addClass('animate-in');
  });
```

### Reactive Application (Main)
```typescript
import { watch, text, addClass, getState, setState } from 'watch-selector';

// Full reactive system
watch('.app', function* () {
  const state = yield* getState('appState', { users: [], loading: false });
  
  yield* text(state.loading ? 'Loading...' : `${state.users.length} users`);
  yield* addClass(state.loading ? 'loading' : 'loaded');
  
  yield* click(function* () {
    yield* setState('appState', { ...state, loading: true });
    // Fetch and update...
  });
});
```

## Troubleshooting

### Common Issues

**Import not found:**
```bash
Module '"watch-selector/explicit"' has no exported member 'someFunction'
```
- Check the function name spelling
- Verify the function exists in the explicit module
- Use main module import if the function isn't in explicit

**Type errors with chaining:**
```typescript
// ❌ Wrong
selector('#button').someUnknownMethod();

// ✅ Correct
selector('#button').addClass('class').text('text');
```

**Generator yield* errors:**
```typescript
// ❌ Wrong - use generator versions
yield* setTextElement(element, 'text');

// ✅ Correct - use generator functions
yield* textGen('text');
```

### Getting Help

1. Check this guide for usage patterns
2. Review the [API documentation](./API.md)
3. Look at [examples/](../examples/) for real-world usage
4. Check [type definitions](../dist/types/) for TypeScript support

## Backward Compatibility

All existing code continues to work without changes:

```typescript
// ✅ Still works - namespace imports
import { explicit, fluent } from 'watch-selector';

// ✅ Still works - main module imports
import { watch, text, addClass } from 'watch-selector';

// ✅ New - standalone module imports
import { setTextElement } from 'watch-selector/explicit';
import { selector } from 'watch-selector/fluent';
```

The standalone modules are additive - they don't replace existing functionality, they provide additional import options for better optimization and developer experience.