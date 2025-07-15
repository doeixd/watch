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

**Dual API Pattern:** Every function works both directly and within generators:
```typescript
// Direct usage
text(element, 'Hello');

// Generator usage
watch('button', function* () {
  yield text('Hello');
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

**Generator Composition:** Use `yield` to compose behaviors elegantly:
```typescript
watch('.counter', function* () {
  let count = 0;
  yield click(() => {
    count++;
    yield text(`Clicked ${count} times`);
  });
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

## Development Notes

### Type System
The library uses advanced TypeScript features for element type inference:
- `ElementFromSelector<S>` maps CSS selectors to specific element types
- `ElementHandler<El>` and `ElementFn<El>` provide type-safe element manipulation
- Generator functions maintain full type safety throughout composition

### Performance Considerations
- Single global MutationObserver for all observations
- Efficient selector-based routing and deduplication
- Automatic cleanup prevents memory leaks
- Minimal overhead design for real-world performance

### Testing Strategy
- Uses Vitest with happy-dom for DOM simulation
- Tests focus on core functionality, type safety, and edge cases
- Performance benchmarking and memory leak detection

## Build System
Uses pridepack for build management with TypeScript compilation and multiple output formats (ESM, CJS, types).