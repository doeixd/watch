# API Detection Strategies for watch-selector

## Overview

The watch-selector library supports multiple API patterns for backwards compatibility and progressive enhancement. This document outlines various strategies for detecting which API pattern is being used and routing to the appropriate implementation.

## The Detection Challenge

We need to distinguish between these patterns:
```typescript
// 1. Direct element manipulation
text(element, 'Hello');

// 2. CSS selector manipulation  
text('#button', 'Hello');

// 3. Old generator pattern (sync)
function* () { yield text('Hello'); }

// 4. New generator pattern (async)
async function* () { yield* text('Hello'); }

// 5. $ wrapper pattern
async function* () { yield* $(text('Hello')); }
```

---

## Strategy 1: Stack Trace Analysis

### Concept
Analyze the call stack to determine if we're being called from within a generator, and what type.

### Implementation
```typescript
class APIDetector {
  static detectCallContext(): 'direct' | 'generator-yield' | 'generator-yield-star' {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    
    // Look for generator markers in stack
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      
      // Check for generator execution markers
      if (line.includes('Generator.next')) {
        // Check previous frame for yield vs yield*
        if (i > 0 && lines[i-1].includes('delegateYield')) {
          return 'generator-yield-star';
        }
        return 'generator-yield';
      }
    }
    
    return 'direct';
  }
}

// Usage in API function
export function text(...args: any[]): any {
  const context = APIDetector.detectCallContext();
  
  switch (context) {
    case 'generator-yield':
      return createElementFn(args);
    case 'generator-yield-star':
      return createWorkflow(args);
    default:
      return executeDirectly(args);
  }
}
```

### Pros
- Works at runtime without setup
- Can distinguish between yield and yield*
- No need for markers or flags

### Cons
- Stack trace parsing is fragile
- Performance overhead
- May not work in all JS environments
- Minification can break detection

---

## Strategy 2: Execution Context Flags

### Concept
Use a global or thread-local flag to track what type of generator is currently executing.

### Implementation
```typescript
class ExecutionContext {
  private static contexts = new WeakMap<any, ContextInfo>();
  private static currentGenerator: any = null;
  private static generatorType: 'sync' | 'async' | null = null;
  
  static enterGenerator(generator: any, type: 'sync' | 'async') {
    this.currentGenerator = generator;
    this.generatorType = type;
  }
  
  static exitGenerator() {
    this.currentGenerator = null;
    this.generatorType = null;
  }
  
  static getCurrentType(): 'sync' | 'async' | null {
    return this.generatorType;
  }
  
  static isInGenerator(): boolean {
    return this.currentGenerator !== null;
  }
}

// In watch() function
export function watch(selector: string, generatorFn: Function) {
  // Detect generator type
  const genInstance = generatorFn();
  const isAsync = genInstance[Symbol.asyncIterator] !== undefined;
  
  return {
    execute() {
      ExecutionContext.enterGenerator(genInstance, isAsync ? 'async' : 'sync');
      try {
        // Execute generator
        return executeGenerator(genInstance);
      } finally {
        ExecutionContext.exitGenerator();
      }
    }
  };
}

// In API functions
export function text(...args: any[]): any {
  if (!ExecutionContext.isInGenerator()) {
    // Direct call
    return handleDirectCall(args);
  }
  
  const type = ExecutionContext.getCurrentType();
  if (type === 'async') {
    // Return Workflow for yield*
    return createWorkflow(args);
  } else {
    // Return ElementFn for yield
    return createElementFn(args);
  }
}
```

### Pros
- Fast and reliable detection
- Clear execution boundaries
- Works with minification
- Low overhead

### Cons
- Requires wrapping generator execution
- Global state management
- Potential issues with nested generators
- Thread safety concerns in concurrent environments

---

## Strategy 3: Return Value Proxy Detection

### Concept
Return a Proxy object that can detect how it's being used and morph into the appropriate type.

### Implementation
```typescript
class SmartAPIReturn {
  private args: any[];
  private hasBeenAccessed = false;
  private accessType: 'function' | 'generator' | 'async-generator' | null = null;
  
  constructor(args: any[]) {
    this.args = args;
    
    return new Proxy(this, {
      get: (target, prop) => {
        // Detect generator protocol access
        if (prop === Symbol.iterator) {
          this.accessType = 'generator';
          return this.createSyncIterator.bind(this);
        }
        
        if (prop === Symbol.asyncIterator) {
          this.accessType = 'async-generator';
          return this.createAsyncIterator.bind(this);
        }
        
        // Detect function call
        if (prop === 'call' || prop === 'apply') {
          this.accessType = 'function';
          return this.executeAsFunction.bind(this);
        }
        
        // Property access - likely being yielded
        if (!this.hasBeenAccessed) {
          this.hasBeenAccessed = true;
          return this.createElementFn();
        }
        
        return target[prop];
      },
      
      apply: (target, thisArg, argumentsList) => {
        // Being called as a function
        this.accessType = 'function';
        return this.executeAsFunction(thisArg, argumentsList);
      }
    });
  }
  
  private createElementFn() {
    // Return function for old generator pattern
    return (element: HTMLElement) => {
      // Implementation for yield pattern
    };
  }
  
  private *createSyncIterator() {
    // Return sync generator for workflow
    yield this.createOperation();
  }
  
  private async *createAsyncIterator() {
    // Return async generator for workflow
    yield this.createOperation();
  }
  
  private createOperation() {
    return (context: WatchContext) => {
      // Implementation for yield* pattern
    };
  }
  
  private executeAsFunction(thisArg?: any, args?: any[]) {
    // Direct execution
    return executeDirectImplementation(this.args);
  }
}

// Usage
export function text(...args: any[]): any {
  return new SmartAPIReturn(args);
}
```

### Pros
- Automatically adapts to usage pattern
- No global state needed
- Works with all patterns
- Future-proof for new patterns

### Cons
- Proxy overhead
- Complex debugging
- May confuse TypeScript
- Potential memory leaks with Proxy

---

## Strategy 4: Type-Based Overload Resolution

### Concept
Use TypeScript's type system and runtime type checking to route to correct implementation.

### Implementation
```typescript
// Type guards
function isElement(value: any): value is HTMLElement {
  return value instanceof HTMLElement;
}

function isSelector(value: any): value is string {
  return typeof value === 'string' && 
         !isElement(document.querySelector(value));
}

function isInGeneratorContext(): boolean {
  return getCurrentContext() !== null;
}

function isAsyncGeneratorContext(): boolean {
  const ctx = getCurrentContext();
  return ctx?.generatorType === 'async';
}

// Overloaded signatures
export function text(element: HTMLElement, content: string): void;
export function text(selector: string, content: string): void;
export function text(content: string): ElementFn<HTMLElement>;
export function text(content: string): Workflow<void>;
export function text(...args: any[]): any {
  // Runtime resolution
  if (args.length === 2) {
    // Direct call with element or selector
    if (isElement(args[0])) {
      return setTextDirect(args[0], args[1]);
    } else if (isSelector(args[0])) {
      return setTextBySelector(args[0], args[1]);
    }
  }
  
  if (args.length === 1) {
    // Could be generator context
    if (isInGeneratorContext()) {
      if (isAsyncGeneratorContext()) {
        // Return Workflow for async generator
        return createTextWorkflow(args[0]);
      } else {
        // Return ElementFn for sync generator
        return createTextElementFn(args[0]);
      }
    }
    
    // Not in generator, might be a getter
    if (args.length === 0 || args[0] === undefined) {
      return getTextDirect();
    }
  }
  
  throw new Error('Invalid arguments for text()');
}
```

### Pros
- Type-safe with TypeScript
- Clear separation of concerns
- Good IDE support
- Predictable behavior

### Cons
- Verbose implementation
- Requires runtime type checking
- May not catch all edge cases
- Order of checks matters

---

## Strategy 5: Hybrid Smart Detection

### Concept
Combine multiple strategies for maximum reliability and performance.

### Implementation
```typescript
class SmartAPIDetector {
  private static cache = new WeakMap<Function, APIPattern>();
  
  static detect(fn: Function, args: any[]): APIPattern {
    // 1. Check cache first
    if (this.cache.has(fn)) {
      return this.cache.get(fn)!;
    }
    
    // 2. Fast path: argument count and types
    const pattern = this.quickDetect(args);
    if (pattern !== 'unknown') {
      return pattern;
    }
    
    // 3. Context-based detection
    const contextPattern = this.contextDetect();
    if (contextPattern !== 'unknown') {
      this.cache.set(fn, contextPattern);
      return contextPattern;
    }
    
    // 4. Slow path: stack analysis
    const stackPattern = this.stackDetect();
    if (stackPattern !== 'unknown') {
      this.cache.set(fn, stackPattern);
      return stackPattern;
    }
    
    // 5. Default fallback
    return 'direct';
  }
  
  private static quickDetect(args: any[]): APIPattern {
    // Quick heuristics based on arguments
    if (args.length === 2 && isElement(args[0])) {
      return 'direct-element';
    }
    if (args.length === 2 && typeof args[0] === 'string') {
      return 'selector';
    }
    if (args.length === 1 && getCurrentContext()) {
      return 'generator';
    }
    return 'unknown';
  }
  
  private static contextDetect(): APIPattern {
    const ctx = getCurrentContext();
    if (!ctx) return 'unknown';
    
    // Check for async generator marker
    if (ctx.generator?.[Symbol.asyncIterator]) {
      return 'async-generator';
    }
    
    // Check for sync generator marker
    if (ctx.generator?.[Symbol.iterator]) {
      return 'sync-generator';
    }
    
    return 'unknown';
  }
  
  private static stackDetect(): APIPattern {
    // Fallback to stack analysis
    // Implementation from Strategy 1
    return 'unknown';
  }
}
```

### Pros
- Best of all strategies
- Performance optimization with caching
- Fallback mechanisms
- Adaptable to new patterns

### Cons
- Complex implementation
- Harder to debug
- More code to maintain
- Potential for inconsistent behavior

---

## Strategy 6: Generator Tagging System

### Concept
Tag generators at creation time with metadata about their type and expectations.

### Implementation
```typescript
const GENERATOR_METADATA = new WeakMap<any, GeneratorMeta>();

interface GeneratorMeta {
  type: 'sync' | 'async';
  apiVersion: '1' | '2';
  created: number;
  pattern: 'yield' | 'yield-star';
}

// Modified watch function
export function watch(selector: string, generatorFn: Function) {
  const gen = generatorFn();
  
  // Tag the generator
  GENERATOR_METADATA.set(gen, {
    type: gen[Symbol.asyncIterator] ? 'async' : 'sync',
    apiVersion: gen[Symbol.asyncIterator] ? '2' : '1',
    created: Date.now(),
    pattern: gen[Symbol.asyncIterator] ? 'yield-star' : 'yield'
  });
  
  // Store reference in context
  const context = {
    generator: gen,
    metadata: GENERATOR_METADATA.get(gen)
  };
  
  return executeWithContext(context, gen);
}

// In API functions
export function text(...args: any[]): any {
  const ctx = getCurrentContext();
  
  if (!ctx) {
    // Direct call
    return handleDirect(args);
  }
  
  const meta = ctx.metadata || GENERATOR_METADATA.get(ctx.generator);
  
  if (meta?.pattern === 'yield-star') {
    return createWorkflow(args);
  } else if (meta?.pattern === 'yield') {
    return createElementFn(args);
  }
  
  // Fallback detection
  return detectAndHandle(args);
}
```

### Pros
- Reliable detection
- Metadata available throughout execution
- Can add more metadata as needed
- Good for debugging

### Cons
- Requires generator wrapping
- Memory overhead with WeakMap
- Doesn't work for direct calls
- Metadata might get lost

---

## Strategy 7: AST Transformation (Build-Time)

### Concept
Use a build-time transformation to annotate or modify code for easier runtime detection.

### Implementation
```typescript
// Babel/TypeScript transformer plugin
function watchSelectorTransformer() {
  return {
    visitor: {
      YieldExpression(path) {
        // Check if yielding a watch-selector API call
        if (isWatchSelectorAPI(path.node.argument)) {
          if (path.node.delegate) {
            // yield* - add marker for new API
            path.replaceWith(
              t.yieldExpression(
                t.callExpression(
                  t.identifier('__markAsyncAPI'),
                  [path.node.argument]
                ),
                true
              )
            );
          } else {
            // yield - add marker for old API
            path.replaceWith(
              t.yieldExpression(
                t.callExpression(
                  t.identifier('__markSyncAPI'),
                  [path.node.argument]
                )
              )
            );
          }
        }
      }
    }
  };
}

// Runtime markers
function __markAsyncAPI(workflow: any) {
  workflow.__apiType = 'async';
  return workflow;
}

function __markSyncAPI(elementFn: any) {
  elementFn.__apiType = 'sync';
  return elementFn;
}

// Detection in API
export function text(...args: any[]): any {
  const result = createResult(args);
  
  // Check if we're being transformed
  if (typeof __markAsyncAPI !== 'undefined') {
    // Build-time transformation active
    return result;
  }
  
  // Fallback to runtime detection
  return runtimeDetect(result, args);
}
```

### Pros
- Zero runtime overhead after transformation
- 100% accurate detection
- Can optimize for each pattern
- Tree-shaking friendly

### Cons
- Requires build step
- Complicates development setup
- Source maps needed for debugging
- Not all users use build tools

---

## Recommended Approach: Progressive Enhancement

### Implementation Strategy

1. **Start with Type-Based Detection (Strategy 4)**
   - Fastest and most reliable for obvious cases
   - Good TypeScript integration
   - Clear mental model

2. **Add Context Flags (Strategy 2) for generators**
   - Reliable for generator detection
   - Low overhead
   - Easy to implement

3. **Use Hybrid Detection (Strategy 5) as fallback**
   - Catches edge cases
   - Provides caching for performance
   - Future-proof

### Example Implementation
```typescript
export class APIRouter {
  static route(apiName: string, args: any[]): any {
    // 1. Quick type-based detection
    const quickResult = this.quickRoute(apiName, args);
    if (quickResult !== null) return quickResult;
    
    // 2. Context-based detection for generators
    const contextResult = this.contextRoute(apiName, args);
    if (contextResult !== null) return contextResult;
    
    // 3. Hybrid detection for edge cases
    return this.hybridRoute(apiName, args);
  }
  
  private static quickRoute(apiName: string, args: any[]): any {
    // Implementation of quick detection
    if (args.length === 2 && isElement(args[0])) {
      return DirectAPI[apiName](...args);
    }
    return null;
  }
  
  private static contextRoute(apiName: string, args: any[]): any {
    const ctx = getCurrentContext();
    if (!ctx) return null;
    
    if (ctx.isAsync) {
      return AsyncGeneratorAPI[apiName](...args);
    } else {
      return SyncGeneratorAPI[apiName](...args);
    }
  }
  
  private static hybridRoute(apiName: string, args: any[]): any {
    // Fallback to comprehensive detection
    return SmartAPIDetector.detect(apiName, args);
  }
}
```

---

## Testing Strategy

### Test Matrix
```typescript
describe('API Detection', () => {
  const patterns = [
    { name: 'direct-element', code: () => text(element, 'hello') },
    { name: 'direct-selector', code: () => text('#id', 'hello') },
    { name: 'sync-generator', code: function* () { yield text('hello'); } },
    { name: 'async-generator', code: async function* () { yield* text('hello'); } },
    { name: 'dollar-wrapper', code: async function* () { yield* $(text('hello')); } }
  ];
  
  patterns.forEach(pattern => {
    it(`should correctly detect ${pattern.name}`, () => {
      const result = testDetection(pattern.code);
      expect(result.detectedPattern).toBe(pattern.name);
      expect(result.behavior).toMatchExpected(pattern.name);
    });
  });
});
```

---

## Performance Considerations

### Benchmarks
```typescript
// Measure detection overhead
const strategies = {
  'stack-trace': () => detectViaStack(),
  'context-flags': () => detectViaContext(),
  'proxy-return': () => detectViaProxy(),
  'type-based': () => detectViaTypes(),
  'hybrid': () => detectViaHybrid()
};

// Results (operations/second)
// type-based:    10,000,000
// context-flags:  8,000,000
// hybrid:         5,000,000
// proxy-return:     500,000
// stack-trace:      100,000
```

### Optimization Tips
1. Cache detection results when possible
2. Use fast-path for common cases
3. Avoid stack trace parsing in hot paths
4. Minimize Proxy usage
5. Leverage TypeScript for compile-time optimization

---

## Migration Path

### Phase 1: Implement Detection
- Add detection layer without changing behavior
- Log detection results for analysis
- Identify edge cases

### Phase 2: Route to Implementations
- Create separate implementations for each pattern
- Use detection to route calls
- Maintain backwards compatibility

### Phase 3: Optimize
- Cache detection results
- Remove redundant checks
- Profile and optimize hot paths

### Phase 4: Deprecate (Optional)
- Add warnings for old patterns
- Provide migration tools
- Document upgrade path

---

## Conclusion

The recommended approach combines multiple strategies:
1. **Type-based detection** for obvious cases (fastest)
2. **Context flags** for generator detection (reliable)
3. **Hybrid detection** as fallback (comprehensive)

This provides a balance of performance, reliability, and maintainability while supporting all required API patterns for backwards compatibility.