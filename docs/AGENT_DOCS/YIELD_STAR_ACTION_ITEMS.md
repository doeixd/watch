# Yield* Migration Action Items

## Executive Summary
The watch-selector library is migrating from `yield` to `yield*` patterns for improved type safety. The core implementation already supports `yield*`, but documentation and some API functions need updates.

## Immediate Actions Required

### 1. Documentation Updates (High Priority)

#### README.md Updates
- [ ] Replace all `yield ` with `yield* ` in code examples
- [ ] Remove references to `/generator` module
- [ ] Remove references to `$` wrapper as primary pattern
- [ ] Update "Three API Styles" section to "Two API Styles"
- [ ] Update Quick Start examples (lines 60-85)
- [ ] Update Getting Started section (lines 179-220)
- [ ] Update Generators & Yield section (lines 283-303)

**Find & Replace Pattern:**
```regex
Find: yield ([a-zA-Z_$][\w$]*\()
Replace: yield* $1
```

#### Remove Outdated Patterns
- [ ] Remove Pattern 4: "Unified yield* pattern with $ wrapper"
- [ ] Remove Pattern 5: "Pure generator submodule"
- [ ] Update to show only 4 patterns instead of 5

### 2. Code Updates (Medium Priority)

#### Add Workflow Overloads to src/api/events.ts
Each event function needs a generator overload:

```typescript
// Template for each event function
export function eventName(
  handler: HybridEventHandler,
  options?: HybridEventOptions
): Workflow<CleanupFunction>;
```

Functions to update:
- [ ] `on()` - Add Workflow<CleanupFunction> overload
- [ ] `click()` - Add Workflow<CleanupFunction> overload
- [ ] `input()` - Add Workflow<CleanupFunction> overload
- [ ] `change()` - Add Workflow<CleanupFunction> overload
- [ ] `submit()` - Add Workflow<CleanupFunction> overload
- [ ] `emit()` - Add Workflow<void> overload
- [ ] `delegate()` - Add Workflow<CleanupFunction> overload

#### Implementation Template
```typescript
export function click(...args: any[]): any {
  // Add this check at the beginning
  if (getCurrentContext() && typeof args[0] === 'function') {
    const [handler, options] = args;
    return (function* (): Generator<Operation<CleanupFunction>, CleanupFunction, any> {
      const cleanup = yield ((context: WatchContext) => {
        // Attach event listener logic
        const cleanup = attachClickListener(context.element, handler, options);
        return cleanup;
      }) as Operation<CleanupFunction>;
      return cleanup;
    })();
  }
  
  // ... existing implementation
}
```

### 3. Implement Missing Observer/Lifecycle Events (Low Priority)

These functions are documented but not implemented:

#### src/api/events.ts - Add New Functions
- [ ] `onMount(handler)` - Fire when element added to DOM
- [ ] `onUnmount(handler)` - Fire when element removed from DOM
- [ ] `onAttr(filter, handler)` - Watch attribute changes
- [ ] `onText(handler)` - Watch text content changes
- [ ] `onVisible(handler, options)` - IntersectionObserver wrapper
- [ ] `onResize(handler)` - ResizeObserver wrapper

### 4. Update Example Files

All files in `examples/` directory:
- [x] `enhanced-events-demo.ts` - ✅ Updated
- [x] `api-comparison.ts` - ✅ Updated
- [x] `direct-yield-example.ts` - ✅ Updated
- [ ] `enhanced-events-v2-demo.ts`
- [ ] `hybrid-events-demo.ts`
- [ ] `new-direct-yield-pattern.ts`
- [ ] `new-generator-api-example.ts`
- [ ] `scoped-integration-test.ts`
- [ ] `scoped-watch-example.ts`
- [ ] `sync-demo.ts`
- [ ] `sync-with-async-example.ts`
- [ ] `verify-new-pattern.ts`

### 5. Update JSDoc Comments

Update all @example sections in source files:
- [ ] src/api/dom-new.ts - Update all examples to use `yield*`
- [ ] src/api/events.ts - Update all examples to use `yield*`
- [ ] src/watch-enhanced.ts - Update all examples to use `yield*`
- [ ] src/scoped-watch.ts - Update all examples to use `yield*`

## Verification Checklist

### Type Safety Tests
Create a test file to verify type inference:
```typescript
// Should compile with correct types
watch('button', function* () {
  const text: string = yield* text();
  const hasClass: boolean = yield* hasClass('active');
  const element: HTMLButtonElement | null = yield* query<HTMLButtonElement>('.btn');
});
```

### Both Patterns Work (During Transition)
```typescript
watch('button', function* () {
  yield text('Old pattern'); // Should still work (no type inference)
  yield* text('New pattern'); // Preferred (with type safety)
});
```

## Migration Script

For bulk updates, use this PowerShell script:
```powershell
# Update all .ts and .md files
Get-ChildItem -Path . -Include *.ts,*.md -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updated = $content -replace 'yield ([a-zA-Z_$][\w$]*\()', 'yield* $1'
    $updated = $updated -replace 'yield\* \$\(', 'yield* ('
    $updated = $updated -replace "from 'watch-selector/generator'", "from 'watch-selector'"
    Set-Content $_.FullName $updated
}
```

## Benefits After Completion

1. **Type Safety**: Full TypeScript inference for all yielded values
2. **Cleaner API**: No need for `$` wrapper or generator module imports
3. **Better DX**: Improved IntelliSense and autocomplete
4. **Simpler Mental Model**: One consistent pattern throughout
5. **Standard JavaScript**: Uses native `yield*` delegation

## Timeline

- **Week 1**: Complete all documentation updates
- **Week 2**: Add Workflow overloads to event functions
- **Week 3**: Implement observer/lifecycle events
- **Week 4**: Add deprecation warnings for old patterns
- **Future**: Remove support for `yield` pattern in next major version

## Success Criteria

- [ ] All documentation shows `yield*` as the primary pattern
- [ ] All example files use `yield*` consistently
- [ ] Event functions return proper Workflow types
- [ ] Type inference works correctly in all contexts
- [ ] Migration guide is complete and accessible
- [ ] Both patterns work during transition period

## Notes

- The DOM API (`dom-new.ts`) already fully supports `yield*`
- The type system is already set up correctly
- Main work is updating documentation and adding event overloads
- Backward compatibility is maintained during transition