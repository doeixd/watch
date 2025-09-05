# Yield* Migration Implementation Status

## Overview
This document tracks the migration from `yield` to `yield*` patterns in the watch-selector library for improved type safety and developer experience.

## Current Implementation Status

### ✅ Already Implemented in Code

#### DOM API (`src/api/dom-new.ts`)
- **Status**: ✅ COMPLETE
- All DOM functions already return `Workflow<T>` types
- Functions properly return sync generators that work with `yield*`
- Type inference is fully functional
- Example functions verified:
  - `text()` - Returns `Workflow<void>` for setters, `Workflow<string>` for getters
  - `addClass()`, `removeClass()`, `toggleClass()`, `hasClass()`
  - `style()`, `attr()`, `prop()`, `data()`
  - `query()`, `queryAll()`, `parent()`, `children()`, `siblings()`
  - All other DOM manipulation functions

#### Type System (`src/types.ts`)
- **Status**: ✅ COMPLETE
- `Workflow<T>` type properly defined as sync generator
- `Operation<T>` type for yielded values
- Full type inference support

#### Generator Module Removal
- **Status**: ✅ COMPLETE
- `/generator` submodule successfully removed
- All functionality integrated into main API
- No traces of separate generator module remain

### ⚠️ Partially Implemented

#### Event API (`src/api/events.ts`)
- **Status**: ⚠️ NEEDS WORKFLOW OVERLOADS
- Event functions work but don't have `Workflow<T>` return type overloads
- Functions that need updating:
  - `on()` - Needs `Workflow<CleanupFunction>` overload
  - `click()` - Needs `Workflow<CleanupFunction>` overload
  - `input()` - Needs `Workflow<CleanupFunction>` overload
  - `change()` - Needs `Workflow<CleanupFunction>` overload
  - `submit()` - Needs `Workflow<CleanupFunction>` overload
  - `emit()` - Needs `Workflow<void>` overload
  - `delegate()` - Needs `Workflow<CleanupFunction>` overload

### ❌ Not Yet Implemented

#### Observer/Lifecycle Events
- **Status**: ❌ NOT IMPLEMENTED
- These functions don't exist yet but are documented:
  - `onMount()` - Element mount event
  - `onUnmount()` - Element unmount event
  - `onAttr()` - Attribute change observer
  - `onText()` - Text content observer
  - `onVisible()` - Intersection observer
  - `onResize()` - Resize observer

## Documentation Update Status

### 📝 Files That Need Updating

#### High Priority Documentation

1. **README.md** (3,546 lines)
   - [ ] Quick Start examples (lines 60-85)
   - [ ] Getting Started section (lines 179-220)
   - [ ] Generators & Yield section (lines 283-303)
   - [ ] All code examples throughout
   - [ ] Remove references to `/generator` module
   - [ ] Remove references to `$` wrapper as primary pattern
   - [ ] Update "Three API Styles" to "Two API Styles"

2. **CLAUDE.md** (Architecture documentation)
   - [x] Updated "Sophisticated Dual API Pattern" section
   - [x] Removed references to generator module
   - [x] Updated example patterns to use `yield*`
   - [ ] Review remaining examples

3. **src/api/events.ts** (JSDoc comments)
   - [ ] Update all example code in comments
   - [ ] Remove Pattern 4 ($ wrapper) and Pattern 5 (generator module)
   - [ ] Update to show `yield*` patterns

4. **src/api/dom-new.ts** (JSDoc comments)
   - [ ] Update example code to use `yield*`
   - [ ] Remove references to `$` wrapper

### 📁 Example Files to Update

All files in `examples/` directory:
- [x] `enhanced-events-demo.ts` - Updated to use `yield*`
- [ ] `api-comparison.ts`
- [ ] `direct-yield-example.ts`
- [ ] `enhanced-events-v2-demo.ts`
- [ ] `hybrid-events-demo.ts`
- [ ] `new-direct-yield-pattern.ts`
- [ ] `new-generator-api-example.ts`
- [ ] `scoped-integration-test.ts`
- [ ] `scoped-watch-example.ts`
- [ ] `sync-demo.ts`
- [ ] `sync-with-async-example.ts`
- [ ] `verify-new-pattern.ts`

## Implementation Tasks

### 🔧 Code Changes Required

#### 1. Add Workflow Overloads to Event Functions
**File**: `src/api/events.ts`

Each event function needs an additional overload:
```typescript
// Add this overload to each event function
export function click(
  handler: HybridEventHandler,
  options?: HybridEventOptions
): Workflow<CleanupFunction>;
```

Implementation pattern:
```typescript
export function click(...args: any[]): any {
  // Check if in generator context with handler as first arg
  if (getCurrentContext() && typeof args[0] === 'function') {
    return (function* (): Generator<Operation<CleanupFunction>, CleanupFunction, any> {
      const cleanup = yield ((context: WatchContext) => {
        // Attach event listener and return cleanup
        const handler = args[0];
        const options = args[1];
        // ... implementation
        return cleanup;
      }) as Operation<CleanupFunction>;
      return cleanup;
    })();
  }
  
  // ... existing implementation
}
```

#### 2. Implement Observer/Lifecycle Events
**File**: `src/api/events.ts` (add to end of file)

```typescript
export function onMount(
  handler: MountHandler
): Workflow<CleanupFunction>;
export function onMount(
  element: Element,
  handler: MountHandler
): CleanupFunction;
// ... implementation

export function onUnmount(
  handler: UnmountHandler
): Workflow<CleanupFunction>;
// ... implementation

export function onAttr(
  filter: string | ((name: string) => boolean),
  handler: AttributeChangeHandler
): Workflow<CleanupFunction>;
// ... implementation
```

### 📚 Documentation Update Strategy

#### Automated Updates
Use find & replace patterns:
1. Find: `yield ([a-zA-Z_$][\w$]*\()`
   Replace: `yield* $1`

2. Find: `yield\* \$\(`
   Replace: `yield* (`
   (Remove $ wrapper usage)

3. Find: `from 'watch-selector/generator'`
   Replace: `from 'watch-selector'`

#### Manual Review Required
1. Ensure consistency in all examples
2. Verify type annotations are correct
3. Update explanatory text about patterns
4. Remove sections about generator module

### 🧪 Testing Requirements

#### Type Safety Tests
Create tests to verify type inference:
```typescript
// Should compile and infer types correctly
watch('button', function* () {
  const text: string = yield* text();
  const hasClass: boolean = yield* hasClass('active');
  const element: HTMLButtonElement | null = yield* query<HTMLButtonElement>('.btn');
});
```

#### Runtime Tests
Verify both patterns work during transition:
```typescript
// Both should work
watch('button', function* () {
  yield text('Old pattern'); // Should still work
  yield* text('New pattern'); // Preferred
});
```

## Migration Timeline

### Phase 1: Documentation Updates (Current)
- Update all documentation to show `yield*` patterns
- Create migration guide
- Update examples

### Phase 2: Add Missing Overloads
- Add `Workflow<T>` overloads to event functions
- Implement observer/lifecycle events
- Ensure full type safety

### Phase 3: Deprecation Warnings
- Add console warnings for `yield` usage
- Provide migration hints
- Update error messages

### Phase 4: Remove Legacy Support
- Remove support for `yield` pattern
- Remove `ElementFn` return types
- Simplify implementation

## Benefits Achieved

### ✅ Type Safety
- Full type inference with `yield*`
- Return values properly typed
- Better IDE support

### ✅ Cleaner API
- No need for `$` wrapper
- Consistent pattern throughout
- Standard JavaScript syntax

### ✅ Simplified Mental Model
- One way to use generators
- Clear, predictable behavior
- Easier to learn and teach

## Quick Reference

### Before (Multiple Patterns)
```typescript
// Pattern 1: yield (no type inference)
yield text('Hello');

// Pattern 2: $ wrapper (verbose)
yield* $(text('Hello'));

// Pattern 3: Generator module (removed)
import { text } from 'watch-selector/generator';
yield* text('Hello');
```

### After (Single Pattern)
```typescript
// One consistent pattern with full type safety
yield* text('Hello');
```

## Next Steps

1. **Immediate**: Update remaining documentation files
2. **This Week**: Add Workflow overloads to event functions
3. **Next Week**: Implement observer/lifecycle events
4. **Future**: Add deprecation warnings for old patterns

## Tracking Progress

- [x] Identify current implementation status
- [x] Create migration guide
- [x] Update CLAUDE.md
- [ ] Update README.md
- [ ] Update all JSDoc comments
- [ ] Update all example files
- [ ] Add Workflow overloads to events
- [ ] Implement observer/lifecycle events
- [ ] Create comprehensive tests
- [ ] Add deprecation warnings
- [ ] Final cleanup and optimization

## Notes

- The core implementation already supports `yield*` correctly
- Main work is documentation and adding missing event overloads
- Both patterns work during transition for backward compatibility
- Focus on developer experience and clear migration path