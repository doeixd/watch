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

### Package Management
- `npm run prepublishOnly` - Clean and build before publishing
- `npm run release` - Create version release with standard-version and push tags

## Code Architecture

### Core Structure
The library follows a modular architecture centered around reactive DOM observation:

**Core Files:**
- `src/index.ts` - Main entry point with comprehensive exports
- `src/watch.ts` - Core watch function with multiple overloads for different use cases
- `src/scoped-watch.ts` - Scoped watching functionality for parent-child relationships
- `src/types.ts` - TypeScript type definitions

**Core Modules:**
- `src/core/` - Core functionality (context, observer, state, generators)
- `src/api/` - DOM manipulation and event handling APIs
- `src/core/observer.ts` - Global MutationObserver system
- `src/core/context.ts` - Element context and generator execution
- `src/core/state.ts` - Per-element state management
- `src/core/generator.ts` - Generator utilities and composition

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

**Complete API Flexibility:** Functions work in four distinct patterns with automatic context detection:
```typescript
// Pattern 1: Direct element manipulation (original)
text(element, 'Hello');

// Pattern 2: CSS selector manipulation (original)
text('#button', 'Hello');

// Pattern 3: Traditional generator usage (original)
watch('button', function* () {
  yield text('Hello');
});

// Pattern 4: Unified yield* pattern (NEW!)
import { $, text } from 'watch-selector';
watch('button', async function* () {
  yield* $(text('Hello')); // Perfect type inference!
});

// Pattern 5: Pure generator submodule (alternative import path)
import { text } from 'watch-selector/generator';
watch('button', async function* () {
  yield* text('Hello'); // Direct workflow, no $ needed
});
```

**Type Safety:** Elements are automatically typed based on CSS selectors:
```typescript
watch('button', function* () {
  // self() returns HTMLButtonElement
  const button = self();
});
```

**Global Observer:** Single MutationObserver for the entire application with efficient selector-based routing.

**Generator Composition:** Multiple patterns for elegant composition:
```typescript
// Traditional yield pattern
watch('.counter', function* () {
  let count = 0;
  yield click(() => {
    count++;
    yield text(`Clicked ${count} times`);
  });
});

// Unified yield* pattern with $ wrapper
watch('.counter', async function* () {
  const count = yield* $(getState<number>('count', 0));
  yield* $(click(() => {
    yield* $(setState('count', count + 1));
    yield* $(text(`Clicked ${count + 1} times`));
  }));
});

// Pure generator submodule (alternative import path)
import { addClass, getState } from 'watch-selector/generator';
watch('.counter', async function* () {
  const count = yield* getState<number>('count', 0); // No $ needed
});
```

### State Management
Each observed element gets isolated state that persists across DOM changes:
- `setState(key, value)` - Set element state
- `getState(key)` - Get element state  
- `updateState(key, updater)` - Update state with function
- `watchState(key, callback)` - React to state changes

### Event System
Comprehensive event handling with advanced features:
- Standard DOM events: `click`, `input`, `change`, `submit`
- Observer events: `onAttr`, `onText`, `onVisible`, `onResize`
- Lifecycle events: `onMount`, `onUnmount`
- Advanced options: debouncing, throttling, delegation, queuing

### Scoped Watching
Create watchers scoped to specific parent elements:
- `scopedWatch(parent, selector, generator)` - Basic scoped watching
- `scopedWatchTimeout()` - Auto-disconnect after timeout
- `scopedWatchOnce()` - Process limited number of elements
- `scopedWatchBatch()` - Multiple watchers for same parent

## Important Files

### Implementation Reference
- `test/IMPLEMENTATION.md` - Detailed v5 implementation plan and progress tracking
- Shows the dual API pattern, type inference system, and global observer architecture

### Examples
- `examples/` directory contains practical usage examples
- `enhanced-events-demo.ts` - Advanced event handling patterns
- `scoped-integration-test.ts` - Scoped watching examples

### API Architecture Overview

The library provides **two complementary API structures**:

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

**2. Pure Generator Submodule** (`src/generator/` and `/generator` exports) - **Direct Workflows**:
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

**Advanced Overloading System**: The main API uses extensive TypeScript overloads with runtime type guards:
- **Function Signature Detection**: Determines usage pattern from argument types and count
- **Automatic Return Type Switching**: Returns `void`, `T`, or `ElementFn<El, T>` based on context
- **Element vs Selector Logic**: Distinguishes between direct elements and CSS selectors
- **Generator Context Awareness**: Detects when running inside watch generators

Both APIs coexist and provide identical functionality with different usage patterns and import strategies.

## Development Notes

### Advanced Type System
The library uses sophisticated TypeScript features for comprehensive type safety:

**Element Type Inference**:
- `ElementFromSelector<S>` maps CSS selectors to specific element types (e.g., `'button'` → `HTMLButtonElement`)
- `ElementHandler<El>` and `ElementFn<El>` provide type-safe element manipulation
- Automatic element typing from selectors in `watch()` calls

**Extensive Function Overloading**:
- **8+ overloads per function** supporting different usage patterns
- **Runtime type guards** with predicates like `_is_text_direct_set()`, `_is_text_generator()`
- **Context-aware return types** that change based on usage pattern
- **Selector vs Element detection** with sophisticated heuristics

**Generator Type Safety**:
- Generator functions maintain full type safety throughout composition
- **$ Wrapper Pattern**: Preserves perfect type inference through `yield*` delegation
- **Workflow<T> typing**: Pure generator functions return correctly typed async generators
- **Event handler generators**: Support typed event objects and generator composition

**API Pattern Support**:
- **Quintuple API Support**: Direct elements, CSS selectors, generators, yield* with $, pure generator submodule
- **Parallel Module Structure**: Main package preserves original overloaded API, `/generator` submodule provides pure workflows
- **Backward Compatibility**: All existing code continues to work with new patterns available

### Performance Considerations
- Single global MutationObserver for all observations
- Efficient selector-based routing and deduplication
- Automatic cleanup prevents memory leaks
- Minimal overhead design for real-world performance

### Testing Strategy
- Uses Vitest with happy-dom for DOM simulation
- Tests focus on core functionality, type safety, and edge cases
- Performance benchmarking and memory leak detection

## Documentation Status

### Comprehensive API Documentation Added ✅

All major exported functions now have extensive JSDoc documentation with multiple examples:

**Main Dual API (`src/api/`)**:
- ✅ **DOM Functions**: `text`, `html`, `addClass`, `removeClass`, `toggleClass`, `hasClass`, `style`, `attr`, `prop`, `data`, `removeAttr`, `hasAttr`, `value`, `checked`, `focus`, `blur`, `show`, `hide`, `query`, `queryAll`, `parent`, `children`, `siblings`, `batchAll`
- ✅ **Event Functions**: `on`, `click`, `input`, `change`, `submit`, `createEventBehavior`, `composeEventHandlers`, `delegate`, `createCustomEvent`, `emit`, `onAttr`, `onText`, `onVisible`, `onResize`, `onMount`, `onUnmount`
- ✅ **Utility Functions**: `isElement`, `isElementLike`, `resolveElement`

**Generator Submodule (`src/generator/`)**:
- ✅ **DOM Operations**: `text`, `getText`, `appendText`, `prependText`, `html`, `addClass`, `removeClass`, `toggleClass` (and more)
- ✅ **State Operations**: `getState`, `setState`, `updateState`, `hasState`, `deleteState` (and more)
- ✅ **Event Operations**: All major event functions with generator-specific examples

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

**Usage Pattern Coverage**: Documentation covers all five API patterns:
1. Direct element manipulation
2. CSS selector manipulation  
3. Traditional generator usage
4. Unified `yield*` pattern with `$` wrapper
5. Pure generator submodule

**Type Safety**: All examples demonstrate proper TypeScript usage with:
- Element type inference from selectors
- Generic type parameters for state management
- Proper return type handling
- Integration between different API layers

## Build System
Uses pridepack for build management with TypeScript compilation and multiple output formats (ESM, CJS, types).