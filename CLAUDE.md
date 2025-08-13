# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **watch-selector** - a TypeScript library for reactive DOM observation and manipulation. It provides a powerful way to attach persistent behaviors to CSS selectors, with automatic cleanup and type safety. The library is designed for server-rendered sites, Chrome extensions, and anywhere you need DOM interactions without controlling the markup.

## Development Commands

### Build & Development
- `npm run build` - Build the project using pridepack
- `npm run dev` - Start development mode with pridepack
- `npm run watch` - Watch for changes and rebuild
- `npm run start` - Start pridepack server
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

### Testing
- `npm test` - Run all tests with Vitest (outputs to test-results.json)
- Tests use the `happy-dom` environment for DOM simulation
- Test files are in the `test/` directory with `.test.ts` suffix
- Type safety tests in `test/type-safety/` directory

### Package Management
- `npm run prepublishOnly` - Clean and build before publishing
- `npm run release` - Create version release with standard-version and push tags

## Code Architecture

### Core Structure
The library follows a modular architecture centered around reactive DOM observation:

**Core Files:**
- `src/index.ts` - Main entry point with comprehensive exports
- `src/watch.ts` - Core watch function with multiple overloads for different use cases
- `src/watch-enhanced.ts` - Enhanced watch with DOM functions attached to context
- `src/scoped-watch.ts` - Scoped watching functionality for parent-child relationships
- `src/types.ts` - TypeScript type definitions

**Core Modules:**
- `src/core/` - Core functionality (context, observer, state, generators)
- `src/api/` - DOM manipulation and event handling APIs
- `src/api/dom-new.ts` - New unified DOM API with enhanced type safety
- `src/api/events.ts` - Comprehensive event handling system
- `src/core/observer.ts` - Global MutationObserver system
- `src/core/context.ts` - Element context and generator execution
- `src/core/state.ts` - Per-element state management
- `src/core/generator.ts` - Generator utilities and composition
- `src/core/enhanced-context/` - Enhanced context with attached DOM functions

### Key Concepts

**Sophisticated Dual API Pattern:** Every function in the main package uses extensive TypeScript overloading to work seamlessly in multiple contexts:

```typescript
import { watch, text, addClass, click } from 'watch-selector';

// 1. DIRECT USAGE - Standalone DOM manipulation
const button = document.getElementById('my-button');
text(button, 'Click me!');           // Direct element manipulation
addClass(button, 'interactive');     // Direct class addition
const content = text(button);        // Direct content reading

// 2. CSS SELECTOR USAGE - Find and manipulate
text('#my-button', 'Click me!');     // Find by selector and set text
addClass('.buttons', 'ready');       // Find by selector and add class

// 3. GENERATOR USAGE - Within watch functions
watch('button', function* () {
  yield text('Ready');               // Generator-friendly ElementFn
  yield addClass('interactive');     // Auto-detects generator context
  
  yield click(function* () {         // Event handlers can be generators too
    yield text('Clicked!');
    yield addClass('clicked');
  });
});
```

**Enhanced Watch with Attached DOM Functions:** The `watchEnhanced` function provides a more ergonomic API with all DOM functions attached to the context:

```typescript
import { watchEnhanced } from 'watch-selector';

watchEnhanced('.card', function* (ctx) {
  // All DOM functions are available on context
  yield* ctx.text('Loading...');
  yield* ctx.addClass('interactive');
  
  // Query child elements with type safety
  const button = yield* ctx.query<HTMLButtonElement>('.action-btn');
  const content = yield* ctx.query<HTMLDivElement>('.content');
  
  // Event handling with generators
  yield* ctx.click(button, function* () {
    yield* ctx.toggleClass('expanded');
    const isExpanded = yield* ctx.hasClass('expanded');
    
    if (isExpanded) {
      yield* ctx.show(content);
    } else {
      yield* ctx.hide(content);
    }
  });
  
  // State management with type safety
  yield* ctx.setState('count', 0);
  const count = yield* ctx.getState<number>('count', 0);
});
```

**$ Wrapper for Advanced Patterns:** The magical `$` helper enables type-safe `yield*` patterns:
```typescript
import { watch, $, getState, setState, addClass } from 'watch-selector';

watch('.interactive', async function* () {
  // Perfect type inference through yield* delegation
  const count = yield* $(getState<number>('clicks', 0));
  yield* $(addClass('active'));
  yield* $(setState('clicks', count + 1));
});
```

**Complete API Flexibility:** Functions work in five distinct patterns with automatic context detection:
```typescript
// Pattern 1: Direct element manipulation
text(element, 'Hello');

// Pattern 2: CSS selector manipulation
text('#button', 'Hello');

// Pattern 3: Traditional generator usage (yield)
watch('button', function* () {
  yield text('Hello');
});

// Pattern 4: Unified yield* pattern with $ wrapper
import { $, text } from 'watch-selector';
watch('button', async function* () {
  yield* $(text('Hello')); // Perfect type inference!
});

// Pattern 5: Pure generator submodule
import { text } from 'watch-selector/generator';
watch('button', async function* () {
  yield* text('Hello'); // Direct workflow, no $ needed
});
```

### Enhanced Type System (dom-new.ts)

The new DOM API (`src/api/dom-new.ts`) provides enhanced type safety with:

**CSS Type Literals:**
- `CSSLength`: Type-safe CSS lengths (`'10px'`, `'2em'`, `'50%'`, `'auto'`, etc.)
- `CSSColor`: Type-safe colors (`'#ff0000'`, `'rgb(255,0,0)'`, `'transparent'`, etc.)
- `DisplayValue`: Constrained display values (`'none'`, `'block'`, `'flex'`, etc.)
- `PositionValue`: Position types (`'static'`, `'relative'`, `'absolute'`, etc.)

**Element Type Constraints:**
- `FormElement`: Union of form control types
- `FocusableElement`: Elements that can receive focus
- `ValueElement`: Elements with value properties
- `ElementConstraint`: Generic element type constraints

**Enhanced Query Functions:**
```typescript
// Type-safe element queries with inference
const button = query<HTMLButtonElement>('.btn');
const inputs = queryAll<HTMLInputElement>('input[type="text"]');

// Parent-child queries with type preservation
const container = query('.container');
const child = query(container, '.child');

// Traversal with type safety
const parent = parent(element);
const siblings = siblings<HTMLDivElement>(element);
const children = children<HTMLSpanElement>(element);
```

### Event System

Comprehensive event handling with advanced features:

**Standard DOM Events:**
```typescript
// Direct event attachment
click(button, () => console.log('clicked'));
input(field, (e) => console.log(e.target.value));

// Within generators
watch('.button', function* () {
  yield click(function* () {
    yield addClass('clicked');
  });
});
```

**Observer Events:**
```typescript
// React to attribute changes
yield onAttr('data-state', (oldValue, newValue) => {
  console.log(`State changed from ${oldValue} to ${newValue}`);
});

// Visibility observer
yield onVisible(() => {
  console.log('Element became visible');
});

// Text content observer
yield onText((oldText, newText) => {
  console.log(`Text changed to: ${newText}`);
});

// Resize observer
yield onResize((entry) => {
  console.log(`New size: ${entry.contentRect.width}x${entry.contentRect.height}`);
});
```

**Lifecycle Events:**
```typescript
// Mount/unmount hooks
yield onMount(function* () {
  console.log('Element added to DOM');
  yield addClass('mounted');
});

yield onUnmount(() => {
  console.log('Element removed from DOM');
});
```

**Advanced Event Options:**
```typescript
// Debounced input handling
yield input(function* (e) {
  yield text(`Searching for: ${e.target.value}`);
}, { debounce: 300 });

// Throttled scroll handling
yield on('scroll', function* () {
  yield addClass('scrolling');
}, { throttle: 100 });

// Event delegation
yield delegate('.item', 'click', function* (e) {
  yield addClass(e.target, 'selected');
});

// Queue mode for sequential processing
yield click(function* () {
  // Long running operation
  await someAsyncWork();
}, { queue: true });
```

### State Management

Each observed element gets isolated state that persists across DOM changes:

```typescript
// Set state with type safety
yield* setState<UserData>('user', { name: 'John', age: 30 });

// Get state with default value
const user = yield* getState<UserData>('user', defaultUser);

// Update state with function
yield* updateState<number>('count', (n) => n + 1);

// Watch state changes
yield* watchState<string>('status', (newStatus, oldStatus) => {
  console.log(`Status changed from ${oldStatus} to ${newStatus}`);
});

// Check state existence
if (yield* hasState('user')) {
  // State exists
}

// Delete state
yield* deleteState('temp');

// Get all state keys
const keys = yield* getStateKeys();
```

### Generator Composition

Multiple patterns for elegant composition:

```typescript
// Traditional yield pattern
watch('.counter', function* () {
  let count = 0;
  yield click(function* () {
    count++;
    yield text(`Clicked ${count} times`);
  });
});

// Unified yield* pattern with $ wrapper
watch('.counter', async function* () {
  const count = yield* $(getState<number>('count', 0));
  yield* $(click(function* () {
    yield* $(setState('count', count + 1));
    yield* $(text(`Clicked ${count + 1} times`));
  }));
});

// Enhanced context pattern
watchEnhanced('.counter', async function* (ctx) {
  const count = yield* ctx.getState<number>('count', 0);
  
  yield* ctx.click(function* () {
    const newCount = count + 1;
    yield* ctx.setState('count', newCount);
    yield* ctx.text(`Clicked ${newCount} times`);
  });
});

// Pure generator submodule
import { addClass, getState } from 'watch-selector/generator';
watch('.counter', async function* () {
  const count = yield* getState<number>('count', 0); // No $ needed
});
```

### Scoped Watching

Create watchers scoped to specific parent elements:

```typescript
// Basic scoped watching
scopedWatch(parentElement, '.child', function* () {
  yield addClass('observed');
});

// Enhanced scoped watching
scopedWatchEnhanced(parentElement, '.child', function* (ctx) {
  yield* ctx.addClass('observed');
  yield* ctx.on('click', function* () {
    yield* ctx.toggleClass('selected');
  });
});

// Auto-disconnect after timeout
scopedWatchTimeout(parent, '.temp', generator, 5000);

// Process limited number of elements
scopedWatchOnce(parent, '.item', generator, 3);

// Multiple watchers for same parent
scopedWatchBatch(parent, [
  ['.header', headerGenerator],
  ['.content', contentGenerator],
  ['.footer', footerGenerator]
]);
```

## Important Files

### Implementation Reference
- `test/IMPLEMENTATION.md` - Detailed v5 implementation plan and progress tracking
- Shows the dual API pattern, type inference system, and global observer architecture

### API Files
- `src/api/dom-new.ts` - New unified DOM API with enhanced type safety
- `src/api/events.ts` - Comprehensive event handling system
- `src/watch-enhanced.ts` - Enhanced watch with attached context methods
- `src/core/enhanced-context/context-with-dom.ts` - Enhanced context implementation

### Examples
- `examples/` directory contains practical usage examples
- `enhanced-events-demo.ts` - Advanced event handling patterns
- `scoped-integration-test.ts` - Scoped watching examples

### Type Safety Tests
- `test/type-safety/dom-new-types.test.ts` - DOM API type safety tests
- `test/type-safety/watch-enhanced-types.test.ts` - Enhanced watch type tests

## API Architecture Overview

The library provides **three complementary API structures**:

**1. Main Dual API** (`src/api/` and main exports) - **Extensively Overloaded Functions**:
- **Multiple Usage Patterns**: Each function has 4-8 TypeScript overloads supporting different contexts
- **Smart Context Detection**: Functions automatically detect usage pattern via sophisticated type guards
- **Import Path**: `'watch-selector'` main package
- **Usage Examples**:
  ```typescript
  // Direct element manipulation
  text(element, 'Hello');
  
  // CSS selector manipulation  
  text('#button', 'Hello');
  
  // Generator mode (automatically detected)
  watch('button', function* () {
    yield text('Hello');        // Returns ElementFn<El>
    const content = yield text(); // Returns ElementFn<El, string>
  });
  
  // Unified yield* pattern with $ wrapper
  yield* $(text('Hello'));
  ```

**2. Enhanced Context API** (`watchEnhanced` and `src/core/enhanced-context/`):
- **Attached Methods**: All DOM functions available as context methods
- **Improved Ergonomics**: More discoverable API with IntelliSense
- **Type Safety**: Full type inference and safety
- **Usage Example**:
  ```typescript
  import { watchEnhanced } from 'watch-selector';
  
  watchEnhanced('button', function* (ctx) {
    yield* ctx.text('Hello');
    yield* ctx.addClass('active');
    
    const parent = yield* ctx.parent();
    const siblings = yield* ctx.siblings();
  });
  ```

**3. Pure Generator Submodule** (`src/generator/` and `/generator` exports):
- **Pure Workflow Functions**: Each function returns `Workflow<T>` directly
- **No Overloading**: Single-purpose functions designed for `yield*`
- **Import Path**: `'watch-selector/generator'` submodule
- **Usage Example**:
  ```typescript
  import { text, addClass } from 'watch-selector/generator';
  
  watch('button', async function* () {
    yield* text('Hello');     // Direct workflow, no $ needed
    yield* addClass('active'); // Clean yield* syntax
  });
  ```

## Development Notes

### Advanced Type System

The library uses sophisticated TypeScript features for comprehensive type safety:

**Element Type Inference**:
- `ElementFromSelector<S>` maps CSS selectors to specific element types (e.g., `'button'` → `HTMLButtonElement`)
- `InferElementFromSelector<S>` provides advanced selector-based type inference
- `ElementHandler<El>` and `ElementFn<El>` provide type-safe element manipulation
- Automatic element typing from selectors in `watch()` calls

**Extensive Function Overloading**:
- **8+ overloads per function** supporting different usage patterns
- **Runtime type guards** with predicates for pattern detection
- **Context-aware return types** that change based on usage pattern
- **Selector vs Element detection** with sophisticated heuristics

**Generator Type Safety**:
- Generator functions maintain full type safety throughout composition
- **$ Wrapper Pattern**: Preserves perfect type inference through `yield*` delegation
- **Workflow<T> typing**: Pure generator functions return correctly typed async generators
- **Event handler generators**: Support typed event objects and generator composition
- **Operation<T> typing**: Type-safe operations within generators

**Enhanced Type Constraints** (dom-new.ts):
- **CSS Type Literals**: Constrained string literals for CSS values
- **Element Type Unions**: `FormElement`, `FocusableElement`, `ValueElement`
- **Generic Constraints**: Better type narrowing with `ElementConstraint`, `QueryConstraint`
- **Strict Type Mapping**: `StrictElementMap`, `StrictSVGElementMap`

### Performance Considerations

- Single global MutationObserver for all observations
- Efficient selector-based routing and deduplication
- Automatic cleanup prevents memory leaks
- Minimal overhead design for real-world performance
- Lazy initialization of enhanced contexts
- Efficient event delegation for multiple elements

### Testing Strategy

- Uses Vitest with `happy-dom` for DOM simulation
- Comprehensive type safety tests in `test/type-safety/`
- Tests focus on core functionality, type safety, and edge cases
- Performance benchmarking and memory leak detection
- Integration tests for complex scenarios

## Documentation Status

### Comprehensive API Documentation Added ✅

All major exported functions now have extensive JSDoc documentation with multiple examples:

**Main Dual API (`src/api/`)**:
- ✅ **DOM Functions**: `text`, `html`, `addClass`, `removeClass`, `toggleClass`, `hasClass`, `style`, `attr`, `prop`, `data`, `removeAttr`, `hasAttr`, `value`, `checked`, `focus`, `blur`, `show`, `hide`, `query`, `queryAll`, `parent`, `children`, `siblings`, `batchAll`, `safeHtml`
- ✅ **Event Functions**: `on`, `click`, `input`, `change`, `submit`, `createEventBehavior`, `composeEventHandlers`, `delegate`, `createCustomEvent`, `emit`, `onAttr`, `onText`, `onVisible`, `onResize`, `onMount`, `onUnmount`
- ✅ **Utility Functions**: `isElement`, `isElementLike`, `resolveElement`

**Enhanced Context API (`src/watch-enhanced.ts`)**:
- ✅ **Core Functions**: `watchEnhanced`, `runOnEnhanced`, `scopedWatchEnhanced`
- ✅ **Context Methods**: All DOM and event functions attached to context
- ✅ **Type Safety**: Full generic type support with inference

**Generator Submodule (`src/generator/`)**:
- ✅ **DOM Operations**: All DOM functions as pure workflows
- ✅ **State Operations**: `getState`, `setState`, `updateState`, `hasState`, `deleteState`, etc.
- ✅ **Event Operations**: All event functions with generator-specific examples

**Core Generator Utilities (`src/core/generator.ts`)**:
- ✅ **Context Functions**: `self`, `el`, `all`, `cleanup`, `ctx`, `getParentContext`
- ✅ **API Management**: `getContextApi`, `setContextApi`, `createTypedGeneratorContext`
- ✅ **Type Safety**: Full type inference and safety documentation

**$ Wrapper System**:
- ✅ **Unified API**: Complete documentation of the `$` helper for `yield*` patterns
- ✅ **Type Safety**: Perfect type inference through `yield*` delegation
- ✅ **Usage Patterns**: Multiple examples showing all supported patterns

### Documentation Features

**Comprehensive Examples**: Each function includes 3-5 real-world examples showing:
- Basic usage patterns
- Advanced configuration options
- Integration with other library functions
- Type safety demonstrations
- Error handling and edge cases

**Usage Pattern Coverage**: Documentation covers all API patterns:
1. Direct element manipulation
2. CSS selector manipulation  
3. Traditional generator usage (yield)
4. Unified `yield*` pattern with `$` wrapper
5. Pure generator submodule
6. Enhanced context with attached methods

**Type Safety**: All examples demonstrate proper TypeScript usage with:
- Element type inference from selectors
- Generic type parameters for state management
- Proper return type handling
- Integration between different API layers
- Enhanced type constraints and literals

## Build System

Uses pridepack for build management with TypeScript compilation and multiple output formats (ESM, CJS, types).

## Recent Enhancements

### Type Safety Improvements (Latest)
- Enhanced `dom-new.ts` with comprehensive type constraints
- Added CSS type literals for better type safety
- Improved `watch-enhanced.ts` with better generic support
- Fixed type issues throughout the codebase
- Added comprehensive type safety tests

### API Unification
- Unified all DOM functions into cohesive API
- Added `yield*` support throughout
- Enhanced context with attached methods
- Improved developer experience with IntelliSense

### Event System Expansion
- Added observer events (onAttr, onText, onVisible, onResize)
- Enhanced lifecycle hooks (onMount, onUnmount)
- Advanced event options (debounce, throttle, queue)
- Event delegation support