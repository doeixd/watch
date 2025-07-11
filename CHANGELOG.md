# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [2.0.0](https://github.com/doeixd/watch/compare/v1.0.7...v2.0.0) (2025-07-11)


### ⚠ BREAKING CHANGES

* Replaced dual event APIs with unified system

## Major Changes

### Unified Event API
- Merged basic and hybrid event systems into single powerful API
- Removed confusing "hybrid" terminology from user-facing areas
- All event functions now support both traditional and generator handlers
- Maintained 100% backward compatibility for existing code

### Enhanced Event Handling
- Generator event handlers with full Watch context access
- Advanced debouncing/throttling with leading/trailing edge control
- Async generator queuing (latest/all/none) for concurrency control
- Capture/bubble phase delegation support
- Event composition and reusable behaviors
- Complete CustomEvent support with type inference

### Critical Bug Fixes
- Fixed memory leak in generator-mode event listeners
- Fixed context availability for non-generator handlers
- Fixed onUnmount WeakMap scope issue preventing cleanup
- Fixed element detection to support SVG and other Element types
- Added proper cleanup integration with unmount system

### Developer Experience
- Added comprehensive module documentation with examples
- Clean API surface without implementation details
- Enhanced TypeScript inference and type safety
- Automatic context wrapping for traditional handlers
- Graceful error handling and fallbacks

### New Features
- `createEventBehavior()` for reusable event patterns
- `composeEventHandlers()` for behavior composition
- `delegate()` helper for event delegation
- Advanced options: queue control, capture delegation, complex timing
- AbortSignal support with double-cleanup guards

### Performance Improvements
- Efficient event queuing and delegation
- Memory leak prevention with automatic cleanup
- Optimized context management
- Reduced bundle size by eliminating duplicate modules

## Migration Guide

No code changes required - existing event handlers continue to work
unchanged while gaining access to all new advanced features.

Before:
```typescript
// Basic API
yield click((event, button) => { ... });

// Advanced API
yield clickHybrid(function* (event) { ... });
```

After:
```typescript
// Unified API supports both patterns
yield click((event, button) => { ... });
yield click(function* (event) {
  const button = self(); // context automatically available
  ...
});
```

Resolves: Enhanced event handling system
Fixes: Memory leaks, context issues, cleanup problems
Implements: RFC for unified event API
Amp-Thread: https://ampcode.com/threads/T-9337f592-3985-4d3b-b5bd-6419bf8dcdfd
Co-authored-by: Amp <amp@ampcode.com>

### Features

* unify event system with advanced generator-first API ([ec8052e](https://github.com/doeixd/watch/commit/ec8052ea7c63d4c14fcd37d5db2dc1785f97fcdb))


### Bug Fixes

* removed version ([6767524](https://github.com/doeixd/watch/commit/6767524bd6a0826fd84cacb3fb0218d259d3523f))

### [1.0.7](https://github.com/doeixd/watch/compare/v1.0.6...v1.0.7) (2025-07-11)

### [1.0.6](https://github.com/doeixd/watch/compare/v1.0.5...v1.0.6) (2025-07-11)

### [1.0.5](https://github.com/doeixd/watch/compare/v1.0.4...v1.0.5) (2025-07-11)

### [1.0.4](https://github.com/doeixd/watch/compare/v1.0.1...v1.0.4) (2025-07-11)

### [1.0.3](https://github.com/doeixd/watch/compare/v1.0.2...v1.0.3) (2025-07-11)

### [1.0.2](https://github.com/doeixd/watch/compare/v1.0.1...v1.0.2) (2025-07-11)

### 1.0.1 (2025-07-11)
