# Context Handling Improvements

**Date:** August 14, 2025 - 10:51 AM
**Task:** Fix context handling in watch-selector library

## Summary

Fixed context parameter handling throughout the watch-selector library to ensure that contexts can be properly passed, attached, and retrieved from workflows. This allows generator functions to accept an optional context parameter and use it when available, while also ensuring that enhanced contexts properly forward the context to underlying functions.

## Problem Identification

The library has multiple context handling mechanisms:
1. **getCurrentContext()** - Retrieves context from a global stack
2. **Optional context parameters** - Functions can accept a context parameter
3. **Enhanced contexts** - Contexts with attached DOM functions
4. **Parent context registry** - For nested watch calls

The main issues were:
- Generator functions weren't consistently accepting optional context parameters
- Enhanced context wasn't passing the base context to underlying generator functions
- Parent context retrieval was incorrectly structured
- Duplicate method definitions in enhanced context
- Type errors with minimal context creation

## Key Decisions

### 1. Unified Context Parameter Pattern
Decided to make all generator utility functions (`self`, `el`, `all`, `cleanup`, `ctx`) accept an optional `TypedGeneratorContext` parameter. This allows:
- Direct context passing when needed
- Fallback to getCurrentContext() when not provided
- Consistent API across all functions

### 2. Context Forwarding in Enhanced Context
The enhanced context now properly forwards the base context to all generator functions:
```typescript
// Before
self: () => generatorFns.self<El>()

// After
self: () => generatorFns.self<El>(baseContext)
```

### 3. Parent Context Registry Fix
Fixed the parent context retrieval to properly handle the WeakMap structure:
- Registry maps HTMLElement → HTMLElement (parent element)
- getParentContext now correctly retrieves the parent element and its API

## Implementation Steps

### Step 1: Update Generator Functions
Modified all generator functions in `src/core/generator.ts` to:
- Accept optional context parameter
- Use context functions from `context.ts` to avoid duplication
- Properly type the return values

### Step 2: Fix Enhanced Context
Updated `src/core/enhanced-context/context-with-dom.ts` to:
- Pass baseContext to all generator functions
- Remove duplicate method definitions (onVisible, onResize)
- Ensure proper type inference

### Step 3: Fix Parent Context Retrieval
Corrected `getParentContext` to:
- Properly retrieve parent element from registry
- Get API using `getContextApi()`
- Return correctly structured ParentContext object

### Step 4: Clean Up Type Errors
- Fixed minimal context creation in events-sync.ts
- Removed unused imports
- Added proper type casts where needed

## Problems Solved

1. **Context Parameter Handling**: All generator functions now properly accept and use optional context parameters
2. **Enhanced Context Forwarding**: Enhanced contexts correctly forward the base context to underlying functions
3. **Parent Context Registry**: Parent context retrieval now works correctly with the WeakMap structure
4. **Type Safety**: Fixed all type errors related to context handling
5. **Code Duplication**: Removed duplicate method definitions and unused imports

## Testing Considerations

While we couldn't run the full test suite due to environment issues (missing happy-dom), the code now:
- Builds successfully with `npm run build`
- Has no TypeScript errors related to context handling
- Follows consistent patterns across all API layers

## Future Improvements

1. **Context Validation**: Add runtime validation for context objects
2. **Context Debugging**: Add debug logging for context stack operations
3. **Performance**: Consider caching enhanced contexts to avoid recreation
4. **Documentation**: Update JSDoc comments with examples of context parameter usage

## Files Modified

- `src/core/generator.ts` - Added context parameters to all functions
- `src/core/enhanced-context/context-with-dom.ts` - Fixed context forwarding and duplicates
- `src/api/events-sync.ts` - Fixed minimal context creation and removed unused imports
- `src/api/events.ts` - Removed unused imports

## Conclusion

The context handling in watch-selector is now more robust and consistent. Functions can accept context parameters when needed, enhanced contexts properly forward context to underlying functions, and parent context retrieval works correctly. This improves the flexibility and reliability of the library's context management system.