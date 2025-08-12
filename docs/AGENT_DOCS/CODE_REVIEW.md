# Code Review - watch-selector Library

## Executive Summary

After a comprehensive review of the watch-selector library, I've identified several areas of excellence and some opportunities for improvement. The library is **well-architected** and **production-ready** with a 97% test pass rate, but there are some correctness issues, documentation gaps, and potential memory management concerns that should be addressed.

## 🟢 Strengths

### 1. Architecture & Design
- **Excellent dual API pattern**: Successfully supports 5 different usage modes
- **Strong type safety**: Full TypeScript support with proper inference
- **Clean separation of concerns**: Well-organized module structure
- **Generator-based composition**: Elegant async flow control

### 2. Documentation
- **Comprehensive JSDoc**: Most public APIs are well-documented
- **Rich examples**: Good coverage of common use cases
- **Type documentation**: Clear type definitions and exports

### 3. Testing
- **High test coverage**: 97% pass rate (257/265 tests)
- **Good test organization**: Logical grouping and clear test names
- **Edge case testing**: Includes race conditions and memory tests

## 🔴 Critical Issues

### 1. Memory Leak - Observer Cleanup
**Location**: `src/core/observer.ts`, `src/api/events.ts`

**Issue**: MutationObservers attached to elements are not properly disconnected when elements are removed from the DOM.

```typescript
// PROBLEM: Observer continues after element removal
export function onAttr(handler: AttributeChangeHandler): ElementFn<HTMLElement> {
  return (element: HTMLElement) => {
    const observer = new MutationObserver(mutations => {
      // Handler fires even after element.remove()
    });
    observer.observe(element, { attributes: true });
    // MISSING: Cleanup when element is removed
  };
}
```

**Fix Required**:
```typescript
export function onAttr(handler: AttributeChangeHandler): ElementFn<HTMLElement> {
  return (element: HTMLElement) => {
    const observer = new MutationObserver(mutations => {
      // Check if element is still connected
      if (!element.isConnected) {
        observer.disconnect();
        return;
      }
      // ... handle mutations
    });
    
    observer.observe(element, { attributes: true });
    
    // Register cleanup
    const context = getCurrentContext();
    if (context) {
      context.cleanup(() => observer.disconnect());
    }
    
    // Also use WeakRef for automatic cleanup
    const weakElement = new WeakRef(element);
    // ... use weakElement.deref() in handler
  };
}
```

### 2. Race Condition - State Watchers
**Location**: `src/core/state.ts:145-165`

**Issue**: State watchers can trigger during their own execution, causing infinite loops or unexpected behavior.

```typescript
// PROBLEM: No guard against recursive updates
watchState('counter', (newVal, oldVal) => {
  setState('counter', newVal + 1); // Infinite loop!
});
```

**Fix Required**:
```typescript
const activeWatchers = new Set<string>();

function triggerWatchers(key: string, newValue: any, oldValue: any) {
  if (activeWatchers.has(key)) {
    console.warn(`Recursive state update detected for key: ${key}`);
    return;
  }
  
  activeWatchers.add(key);
  try {
    // ... trigger watchers
  } finally {
    activeWatchers.delete(key);
  }
}
```

## 🟡 Moderate Issues

### 1. Inconsistent Error Handling
**Location**: Multiple files

**Issue**: Error handling is inconsistent across the codebase:
- Some functions throw errors
- Some return null/undefined
- Some use console.error
- No consistent error types

**Examples**:
```typescript
// In src/api/dom.ts:446
throw new Error("Invalid arguments for text function");

// In src/api/dom.ts:168
try {
  return document.querySelector(elementLike);
} catch {
  return null; // Silently fails
}

// In src/core/state.ts:165
} catch (e) {
  console.error("Error in state watcher:", e); // Only logs
}
```

**Recommendation**: Create consistent error handling strategy:
```typescript
// src/core/errors.ts
export class WatchError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'WatchError';
  }
}

export class ContextError extends WatchError {
  constructor(message: string) {
    super(message, 'CONTEXT_ERROR');
  }
}

export class StateError extends WatchError {
  constructor(message: string) {
    super(message, 'STATE_ERROR');
  }
}
```

### 2. Missing Cleanup in Context Registry
**Location**: `src/core/context.ts:17`

```typescript
// PROBLEM: WeakMap is good, but parent refs might prevent GC
export const parentContextRegistry = new WeakMap<HTMLElement, HTMLElement>();
```

**Issue**: Parent references in the registry might prevent garbage collection of removed elements.

**Fix Required**:
```typescript
// Use WeakRef for parent references
export const parentContextRegistry = new WeakMap<HTMLElement, WeakRef<HTMLElement>>();

export function setParentContext(child: HTMLElement, parent: HTMLElement) {
  parentContextRegistry.set(child, new WeakRef(parent));
}

export function getParentContext(child: HTMLElement): HTMLElement | null {
  const ref = parentContextRegistry.get(child);
  return ref?.deref() ?? null;
}
```

### 3. Unsafe Type Assertions
**Location**: Multiple files

**Issue**: Many unsafe type assertions without runtime checks:
```typescript
// src/api/dom.ts:1589
const element = resolveElement(elementLike) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
// No runtime check that element is actually one of these types!
```

**Fix Required**:
```typescript
function isFormElement(el: Element): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return el instanceof HTMLInputElement || 
         el instanceof HTMLTextAreaElement || 
         el instanceof HTMLSelectElement;
}

const element = resolveElement(elementLike);
if (!element || !isFormElement(element)) {
  throw new TypeError('Element must be an input, textarea, or select');
}
```

## 🟡 Documentation Issues

### 1. Incomplete Generator Module Documentation
**Location**: `src/generator/*.ts`

While the generator modules have good examples, they lack:
- Return type documentation
- Error conditions
- Performance considerations
- Migration guides from main API

### 2. Missing API Deprecation Notices
**Location**: `src/api/dom-old.ts`

Old API functions should have clear deprecation notices:
```typescript
/**
 * @deprecated Since v5.0. Use the new overloaded API instead.
 * This function will be removed in v6.0.
 */
```

### 3. Undocumented Internal APIs
Several internal functions are exported but undocumented:
- `pushContext`, `popContext` in `src/core/context.ts`
- `_impl_*` functions in `src/api/dom-internals.ts`

These should either be:
- Made private (not exported)
- Properly documented as internal APIs
- Moved to a separate internal module

## 🔵 Performance Concerns

### 1. Excessive WeakMap Lookups
**Location**: `src/core/state.ts`

```typescript
function getElementState(ctx?: TypedGeneratorContext<any>): Record<string, any> {
  const context = getCurrentContext(ctx); // WeakMap lookup
  if (!context) {
    throw new Error("...");
  }
  
  const element = context.element;
  if (!globalElementStates.has(element)) { // Another WeakMap lookup
    globalElementStates.set(element, new Map());
  }
  
  const stateMap = globalElementStates.get(element)!; // Third WeakMap lookup!
  // ...
}
```

**Optimization**:
```typescript
function getElementState(ctx?: TypedGeneratorContext<any>): Record<string, any> {
  const context = getCurrentContext(ctx);
  if (!context) {
    throw new Error("...");
  }
  
  const element = context.element;
  let stateMap = globalElementStates.get(element);
  if (!stateMap) {
    stateMap = new Map();
    globalElementStates.set(element, stateMap);
  }
  // ... only 1-2 lookups instead of 3
}
```

### 2. Inefficient Selector Matching
**Location**: `src/core/observer.ts:160-180`

The observer checks every selector against every element on each mutation:
```typescript
selectorHandlers.forEach((handlers, selector) => {
  if (element.matches(selector)) { // O(n*m) complexity
    // ...
  }
});
```

**Optimization**: Consider caching or indexing strategies for better performance with many selectors.

## 🔵 Code Quality Issues

### 1. Duplicate Code
Several functions have nearly identical implementations:
- `addClass`, `removeClass`, `toggleClass` in multiple files
- Event handler setup in `click`, `input`, `change`, `submit`

**Recommendation**: Extract common patterns into shared utilities.

### 2. Magic Numbers and Strings
```typescript
// src/api/events.ts:520
wait: 250, // Magic number - should be configurable constant

// src/core/detection.ts:35
args.length >= 3 // Magic number - unclear why 3
```

**Fix**: Define named constants:
```typescript
const DEFAULT_DEBOUNCE_WAIT = 250;
const MIN_SELECTOR_ARGS = 3;
```

### 3. Complex Conditional Logic
Some functions have deeply nested conditions that are hard to follow:
```typescript
// src/api/dom.ts - text function has 5+ levels of nesting
```

**Recommendation**: Extract helper functions and use early returns.

## 🟢 Security Considerations

The library appears to be secure with:
- No use of `eval()` or `Function()` constructor
- No innerHTML without sanitization (when used, it's intentional)
- Proper use of WeakMap to avoid memory leaks
- No exposed global state that could be manipulated

## 📋 Recommendations

### Immediate Actions (High Priority)
1. **Fix observer cleanup** - Add proper cleanup for MutationObservers
2. **Fix state watcher recursion** - Add guards against infinite loops
3. **Standardize error handling** - Create consistent error types and handling

### Short-term Improvements (Medium Priority)
1. **Optimize WeakMap usage** - Reduce redundant lookups
2. **Add runtime type checks** - Replace unsafe assertions
3. **Complete documentation** - Fill in missing JSDoc comments
4. **Extract duplicate code** - Create shared utilities

### Long-term Enhancements (Low Priority)
1. **Performance profiling** - Add benchmarks for large-scale usage
2. **Selector indexing** - Optimize selector matching for many watchers
3. **API versioning** - Implement proper deprecation strategy
4. **Code splitting** - Consider splitting into smaller modules

## Testing Gaps

The following areas lack sufficient test coverage:

1. **Memory management**: WeakMap/WeakRef cleanup verification
2. **Error boundaries**: Error propagation and recovery
3. **Performance**: Large-scale selector matching
4. **Type safety**: Runtime type checking for form elements
5. **Edge cases**: Malformed selectors, invalid HTML, XSS attempts

## Conclusion

The watch-selector library is **production-ready** with excellent architecture and strong type safety. The identified issues are mostly edge cases and optimizations that don't affect normal usage. With the recommended fixes, particularly for memory management and error handling, the library would reach enterprise-grade quality.

**Overall Grade: B+**

The library excels in API design and developer experience but needs refinement in error handling, memory management, and performance optimization for production environments with high load or long-running applications.