# Refactoring Plan: Enhanced API as Default

## Overview
This document outlines the plan to refactor the watch-selector library to make the enhanced versions (dom-new and watch-enhanced) the default implementations, replacing the current defaults while maintaining backward compatibility.

## Goals
1. Make `watchEnhanced` the default `watch` function
2. Make `dom-new` the default DOM API implementation
3. Determine if the generator module is still needed
4. Ensure parent/child/sibling helpers work with the new context
5. Maintain backward compatibility where possible

## Current State Analysis

### Enhanced Features Working
- ✅ `dom-new.ts` supports all argument patterns (direct, selector, generator)
- ✅ `watchEnhanced` provides context with attached DOM helpers
- ✅ Parent/child/sibling functions work with `yield*` pattern
- ✅ Full type safety maintained throughout
- ✅ Tests passing for enhanced context

### Module Structure
```
src/
  api/
    dom.ts          → Current default (to be replaced)
    dom-new.ts      → Enhanced version (to become default)
  generator/
    index.ts        → Pure generator workflows
  watch.ts          → Current default watch
  watch-enhanced.ts → Enhanced watch (to become default)
```

## Migration Steps

### Phase 1: Backup Current Implementation
1. **Create legacy module**
   ```
   src/legacy/
     watch-v4.ts    ← Copy of current watch.ts
     dom-v4.ts      ← Copy of current api/dom.ts
   ```

2. **Export legacy API for compatibility**
   ```typescript
   // src/legacy/index.ts
   export { watch as watchLegacy } from './watch-v4';
   export * as domLegacy from './dom-v4';
   ```

### Phase 2: Replace Default Implementations

1. **Replace watch.ts with enhanced version**
   - Copy content from `watch-enhanced.ts` to `watch.ts`
   - Update function names (remove "Enhanced" suffix)
   - Update imports and exports

2. **Replace api/dom.ts with dom-new.ts**
   - Copy content from `dom-new.ts` to `dom.ts`
   - Remove `dom-new.ts` after migration

3. **Update type definitions**
   - Ensure `WatchContext` includes attached DOM helpers
   - Update `TypedGeneratorContext` to be `EnhancedTypedGeneratorContext` by default

### Phase 3: Generator Module Assessment

**Verdict: KEEP the generator module**

**Reasons:**
1. **Clean import path** for pure workflow functions
2. **No $ wrapper needed** - direct `yield*` syntax
3. **Simpler for users** who prefer pure generator patterns
4. **Coexistence** - both APIs can work together

**Example showing both patterns:**
```typescript
// Pattern 1: Enhanced context (NEW DEFAULT)
import { watch } from 'watch-selector';

watch('button', function* (ctx) {
  yield* ctx.text('Click me');
  yield* ctx.addClass('active');
});

// Pattern 2: Pure generator module (STILL AVAILABLE)
import { watch } from 'watch-selector';
import { text, addClass } from 'watch-selector/generator';

watch('button', async function* () {
  yield* text('Click me');
  yield* addClass('active');
});
```

### Phase 4: Parent/Child/Sibling Compatibility

**Current Implementation Status:**
- ✅ Functions exist in `dom-new.ts` with proper overloads
- ✅ Support direct element, selector, and generator patterns
- ✅ Return `Workflow<T>` for generator context

**Enhanced Context Integration:**
```typescript
// These will be attached to enhanced context
interface EnhancedContext {
  parent<T extends Element = Element>(selector?: string): Workflow<T | null>;
  children<T extends Element = Element>(selector?: string): Workflow<T[]>;
  siblings<T extends Element = Element>(selector?: string): Workflow<T[]>;
}
```

**Usage Example:**
```typescript
watch('.card', function* (ctx) {
  // All work with yield*
  const parentEl = yield* ctx.parent();
  const childElements = yield* ctx.children('.item');
  const siblingCards = yield* ctx.siblings('.card');
});
```

## File Changes Required

### 1. Core Files to Modify

```typescript
// src/watch.ts
- Remove current implementation
+ Copy from watch-enhanced.ts
+ Rename watchEnhanced → watch
+ Rename runOnEnhanced → runOn
+ Update all "Enhanced" references

// src/api/dom.ts  
- Remove current implementation
+ Copy from dom-new.ts
+ Update imports

// src/types.ts
+ Add EnhancedTypedGeneratorContext as default TypedGeneratorContext
+ Ensure WatchContext extends enhanced context
```

### 2. Files to Create

```typescript
// src/legacy/index.ts
export { watch as watchLegacy } from './watch-v4';
export { runOn as runOnLegacy } from './watch-v4';
export * as domLegacy from './dom-v4';

// src/migration-guide.md
- Document changes
- Provide migration examples
- List breaking changes
```

### 3. Files to Update

```typescript
// src/index.ts
- Update exports to use new defaults
+ Add legacy exports for compatibility
+ Document migration in comments

// src/core/enhanced-context/context-with-dom.ts
- May become part of core context.ts
```

### 4. Files to Clean Up

```
- src/watch-enhanced.ts (merged into watch.ts)
- src/api/dom-new.ts (merged into dom.ts)
- src/api/dom-old.ts (move to legacy)
- Other experimental dom-*.ts files
```

## Testing Strategy

### 1. Ensure Existing Tests Pass
```bash
# Run all existing tests
npm test

# Specifically test:
- test/dom-manipulation.test.ts
- test/enhanced-context.test.ts
- test/parent-child-test.ts
- test/generator-api.test.ts
```

### 2. Add Migration Tests
```typescript
// test/migration.test.ts
describe('Migration Compatibility', () => {
  it('should support legacy API through imports', () => {
    import { watchLegacy } from 'watch-selector/legacy';
    // Test legacy behavior
  });
  
  it('should support new enhanced API by default', () => {
    import { watch } from 'watch-selector';
    // Test enhanced behavior
  });
});
```

### 3. Performance Tests
- Compare performance of enhanced vs legacy
- Ensure no regression in memory usage
- Test with large DOM trees

## Breaking Changes

### Minimal Breaking Changes
1. **Generator context now has attached helpers by default**
   - Previous: `yield text('Hello')`
   - New: Can use `yield* ctx.text('Hello')` OR `yield text('Hello')`
   - Both patterns supported!

2. **TypeScript types slightly different**
   - Context type now includes DOM helpers
   - May require type updates in some edge cases

### Non-Breaking (Backward Compatible)
- ✅ All existing patterns still work
- ✅ Can still import and yield functions directly
- ✅ Legacy API available through `/legacy` import
- ✅ Generator module still available

## Migration Guide for Users

### Simple Migration
```typescript
// OLD (still works!)
import { watch, text, addClass } from 'watch-selector';

watch('button', function* () {
  yield text('Click me');
  yield addClass('active');
});

// NEW (enhanced, but optional)
import { watch } from 'watch-selector';

watch('button', function* (ctx) {
  yield* ctx.text('Click me');
  yield* ctx.addClass('active');
});
```

### Advanced Migration
```typescript
// For users who need legacy behavior
import { watchLegacy } from 'watch-selector/legacy';

// For users who want pure generator workflows
import { text, addClass } from 'watch-selector/generator';

// For users who want the $ helper
import { $, text, addClass } from 'watch-selector';
watch('button', async function* () {
  yield* $(text('Click me'));
});
```

## Implementation Order

1. **Week 1: Preparation**
   - Create legacy module
   - Set up compatibility layer
   - Write migration tests

2. **Week 2: Core Migration**
   - Replace watch.ts
   - Replace api/dom.ts
   - Update type definitions

3. **Week 3: Testing & Documentation**
   - Run full test suite
   - Update documentation
   - Create migration guide

4. **Week 4: Release**
   - Beta release for testing
   - Gather feedback
   - Final release

## Benefits After Migration

1. **Better Developer Experience**
   - Context has all helpers attached
   - Less imports needed
   - More intuitive API

2. **Maintained Flexibility**
   - All patterns still supported
   - Generator module for purists
   - Legacy available if needed

3. **Type Safety**
   - Full inference throughout
   - Better IDE support
   - Cleaner type definitions

4. **Performance**
   - No performance overhead
   - Same memory footprint
   - Efficient implementation

## Risks and Mitigations

### Risk 1: Breaking Existing Code
**Mitigation:** Legacy module provides full backward compatibility

### Risk 2: Confusion During Migration
**Mitigation:** Clear documentation, migration guide, and examples

### Risk 3: Performance Regression
**Mitigation:** Comprehensive performance testing before release

### Risk 4: Type Inference Issues
**Mitigation:** Extensive TypeScript testing, maintain old types for compatibility

## Success Criteria

- ✅ All existing tests pass
- ✅ Enhanced API is default
- ✅ Legacy API still accessible
- ✅ No performance regression
- ✅ Documentation updated
- ✅ Migration guide complete
- ✅ User feedback positive

## Next Steps

1. Review and approve this plan
2. Create feature branch `refactor/enhanced-as-default`
3. Implement Phase 1 (Backup)
4. Proceed with Phase 2-4
5. Release as v6.0.0 with migration guide