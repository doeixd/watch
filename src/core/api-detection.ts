/**
 * API Detection Module for watch-selector
 *
 * This module provides intelligent detection of which API pattern is being used,
 * enabling the library to support multiple calling conventions for backwards compatibility.
 */

import type {
  ElementFn,
  Workflow,
  WatchContext,
  TypedGeneratorContext
} from '../types';

// ============================================================================
// Types
// ============================================================================

export type APIPattern =
  | 'direct-element'      // text(element, 'content')
  | 'direct-selector'     // text('#id', 'content')
  | 'sync-generator'      // function* () { yield text('content') }
  | 'async-generator'     // async function* () { yield* text('content') }
  | 'dollar-wrapper'      // async function* () { yield* $(text('content')) }
  | 'getter'              // text() - getting value
  | 'unknown';

export interface DetectionResult {
  pattern: APIPattern;
  confidence: number; // 0-1, how confident we are in the detection
  metadata?: {
    generatorType?: 'sync' | 'async';
    argumentCount?: number;
    hasContext?: boolean;
    stackDepth?: number;
  };
}

export interface APIImplementation<T = any> {
  directElement: (...args: any[]) => T;
  directSelector: (...args: any[]) => T;
  syncGenerator: (...args: any[]) => ElementFn<any, T>;
  asyncGenerator: (...args: any[]) => Workflow<T>;
  dollarWrapper: (...args: any[]) => any;
  getter: (...args: any[]) => T;
}

// ============================================================================
// Context Management
// ============================================================================

interface ExecutionContext {
  generator?: any;
  generatorType?: 'sync' | 'async';
  apiVersion?: '1' | '2';
  depth: number;
  timestamp: number;
}

class ContextManager {
  private static stack: ExecutionContext[] = [];
  private static current: ExecutionContext | null = null;

  static push(context: ExecutionContext): void {
    this.stack.push(context);
    this.current = context;
  }

  static pop(): ExecutionContext | undefined {
    const context = this.stack.pop();
    this.current = this.stack[this.stack.length - 1] || null;
    return context;
  }

  static getCurrent(): ExecutionContext | null {
    return this.current;
  }

  static getDepth(): number {
    return this.stack.length;
  }

  static isInGenerator(): boolean {
    return this.current?.generator !== undefined;
  }

  static getGeneratorType(): 'sync' | 'async' | null {
    return this.current?.generatorType || null;
  }
}

// ============================================================================
// Detection Cache
// ============================================================================

class DetectionCache {
  private static cache = new Map<string, DetectionResult>();
  private static maxSize = 1000;

  static generateKey(fnName: string, args: any[], contextDepth: number): string {
    const argTypes = args.map(arg => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        if (arg instanceof HTMLElement) return 'HTMLElement';
        if (Array.isArray(arg)) return 'Array';
        return 'object';
      }
      return typeof arg;
    }).join(',');

    return `${fnName}:${argTypes}:${contextDepth}`;
  }

  static get(key: string): DetectionResult | null {
    return this.cache.get(key) || null;
  }

  static set(key: string, result: DetectionResult): void {
    // Implement LRU eviction if cache gets too large
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, result);
  }

  static clear(): void {
    this.cache.clear();
  }
}

// ============================================================================
// Type Guards
// ============================================================================

export function isHTMLElement(value: any): value is HTMLElement {
  // More robust check than instanceof for cross-frame compatibility
  return value &&
         typeof value === 'object' &&
         'nodeType' in value &&
         value.nodeType === 1 &&
         'tagName' in value;
}

export function isCSSSelector(value: any): value is string {
  if (typeof value !== 'string') return false;

  // Quick checks for common selector patterns
  if (value.startsWith('#') ||
      value.startsWith('.') ||
      value.includes('[') ||
      value.includes(':')) {
    return true;
  }

  // Check if it's a valid tag name
  const validTags = ['div', 'span', 'button', 'input', 'form', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  return validTags.includes(value.toLowerCase());
}

export function isWorkflow(value: any): value is Workflow<any> {
  return value &&
         typeof value === 'object' &&
         typeof value[Symbol.asyncIterator] === 'function';
}

export function isElementFn(value: any): value is ElementFn<any> {
  return typeof value === 'function' &&
         value.length === 1 && // ElementFn takes one parameter (element)
         !isWorkflow(value);
}

// ============================================================================
// Stack Analysis
// ============================================================================

class StackAnalyzer {
  static analyze(): { inGenerator: boolean; generatorType?: 'sync' | 'async' } {
    try {
      const stack = new Error().stack || '';
      const lines = stack.split('\n').slice(0, 15); // Limit depth for performance

      let inGenerator = false;
      let generatorType: 'sync' | 'async' | undefined;

      for (const line of lines) {
        // Look for generator execution patterns
        if (line.includes('Generator.next') ||
            line.includes('AsyncGenerator.next')) {
          inGenerator = true;

          if (line.includes('AsyncGenerator')) {
            generatorType = 'async';
          } else if (line.includes('Generator')) {
            generatorType = 'sync';
          }

          // Check for yield* delegation
          if (line.includes('delegateYield') ||
              line.includes('yield*')) {
            generatorType = 'async'; // yield* typically used with async
          }

          break;
        }
      }

      return { inGenerator, generatorType };
    } catch {
      // Stack trace parsing failed, return safe defaults
      return { inGenerator: false };
    }
  }
}

// ============================================================================
// Main Detection Engine
// ============================================================================

export class APIDetector {
  /**
   * Detect which API pattern is being used based on arguments and context
   */
  static detect(fnName: string, args: any[]): DetectionResult {
    // Generate cache key
    const depth = ContextManager.getDepth();
    const cacheKey = DetectionCache.generateKey(fnName, args, depth);

    // Check cache
    const cached = DetectionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform detection
    const result = this.performDetection(fnName, args);

    // Cache result
    DetectionCache.set(cacheKey, result);

    return result;
  }

  private static performDetection(fnName: string, args: any[]): DetectionResult {
    // Phase 1: Quick argument-based detection
    const quickResult = this.quickDetect(args);
    if (quickResult.confidence >= 0.9) {
      return quickResult;
    }

    // Phase 2: Context-based detection
    const contextResult = this.contextDetect();
    if (contextResult.confidence >= 0.8) {
      return contextResult;
    }

    // Phase 3: Stack-based detection (slower)
    const stackResult = this.stackDetect();
    if (stackResult.confidence >= 0.7) {
      return stackResult;
    }

    // Phase 4: Combine results for best guess
    return this.combineResults(quickResult, contextResult, stackResult);
  }

  private static quickDetect(args: any[]): DetectionResult {
    // Two arguments - likely direct call
    if (args.length === 2) {
      if (isHTMLElement(args[0])) {
        return {
          pattern: 'direct-element',
          confidence: 0.95,
          metadata: { argumentCount: 2 }
        };
      }

      if (isCSSSelector(args[0])) {
        return {
          pattern: 'direct-selector',
          confidence: 0.9,
          metadata: { argumentCount: 2 }
        };
      }
    }

    // No arguments or undefined - likely getter
    if (args.length === 0 || (args.length === 1 && args[0] === undefined)) {
      return {
        pattern: 'getter',
        confidence: 0.85,
        metadata: { argumentCount: args.length }
      };
    }

    // One argument - could be generator context
    if (args.length === 1) {
      // Check if we have a generator context
      if (ContextManager.isInGenerator()) {
        const genType = ContextManager.getGeneratorType();
        return {
          pattern: genType === 'async' ? 'async-generator' : 'sync-generator',
          confidence: 0.5, // Low confidence, needs more verification
          metadata: {
            argumentCount: 1,
            generatorType: genType || undefined
          }
        };
      }
    }

    return {
      pattern: 'unknown',
      confidence: 0,
      metadata: { argumentCount: args.length }
    };
  }

  private static contextDetect(): DetectionResult {
    const context = ContextManager.getCurrent();

    if (!context) {
      return { pattern: 'unknown', confidence: 0 };
    }

    const hasContext = true;
    const genType = context.generatorType;

    if (genType === 'async') {
      return {
        pattern: 'async-generator',
        confidence: 0.9,
        metadata: {
          generatorType: 'async',
          hasContext,
          stackDepth: ContextManager.getDepth()
        }
      };
    }

    if (genType === 'sync') {
      return {
        pattern: 'sync-generator',
        confidence: 0.9,
        metadata: {
          generatorType: 'sync',
          hasContext,
          stackDepth: ContextManager.getDepth()
        }
      };
    }

    return {
      pattern: 'unknown',
      confidence: 0.3,
      metadata: { hasContext }
    };
  }

  private static stackDetect(): DetectionResult {
    const { inGenerator, generatorType } = StackAnalyzer.analyze();

    if (!inGenerator) {
      return { pattern: 'unknown', confidence: 0 };
    }

    if (generatorType === 'async') {
      return {
        pattern: 'async-generator',
        confidence: 0.75,
        metadata: { generatorType: 'async' }
      };
    }

    if (generatorType === 'sync') {
      return {
        pattern: 'sync-generator',
        confidence: 0.75,
        metadata: { generatorType: 'sync' }
      };
    }

    return {
      pattern: 'unknown',
      confidence: 0.4,
      metadata: { generatorType: undefined }
    };
  }

  private static combineResults(...results: DetectionResult[]): DetectionResult {
    // Weight and combine confidence scores
    const patterns = new Map<APIPattern, number>();

    for (const result of results) {
      if (result.pattern !== 'unknown') {
        const current = patterns.get(result.pattern) || 0;
        patterns.set(result.pattern, current + result.confidence);
      }
    }

    // Find pattern with highest combined confidence
    let bestPattern: APIPattern = 'unknown';
    let bestScore = 0;

    for (const [pattern, score] of patterns) {
      if (score > bestScore) {
        bestPattern = pattern;
        bestScore = score;
      }
    }

    // Calculate normalized confidence
    const confidence = Math.min(bestScore / results.length, 1);

    return {
      pattern: bestPattern,
      confidence,
      metadata: {
        // Merge metadata from all results
        ...results.reduce((acc, r) => ({ ...acc, ...r.metadata }), {})
      }
    };
  }
}

// ============================================================================
// API Router
// ============================================================================

export class APIRouter {
  /**
   * Route API calls to the appropriate implementation based on detected pattern
   */
  static route<T>(
    fnName: string,
    args: any[],
    implementations: APIImplementation<T>
  ): T | ElementFn<any, T> | Workflow<T> {
    const detection = APIDetector.detect(fnName, args);

    // Log detection in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[APIRouter] ${fnName} detected as ${detection.pattern} (confidence: ${detection.confidence})`);
    }

    // Route to appropriate implementation
    switch (detection.pattern) {
      case 'direct-element':
        return implementations.directElement(...args);

      case 'direct-selector':
        return implementations.directSelector(...args);

      case 'sync-generator':
        return implementations.syncGenerator(...args);

      case 'async-generator':
        return implementations.asyncGenerator(...args);

      case 'dollar-wrapper':
        return implementations.dollarWrapper(...args);

      case 'getter':
        return implementations.getter(...args);

      default:
        // Fallback: try to make an educated guess
        if (args.length === 2) {
          if (isHTMLElement(args[0])) {
            return implementations.directElement(...args);
          }
          return implementations.directSelector(...args);
        }

        // Default to async generator for forward compatibility
        return implementations.asyncGenerator(...args);
    }
  }
}

// ============================================================================
// Integration Helpers
// ============================================================================

/**
 * Wrap a generator function to track its execution context
 */
export function wrapGenerator<T>(
  generatorFn: () => Generator<any, T, any> | AsyncGenerator<any, T, any>
): () => Generator<any, T, any> | AsyncGenerator<any, T, any> {
  return function wrappedGenerator() {
    const generator = generatorFn();
    const isAsync = generator[Symbol.asyncIterator] !== undefined;

    // Push context
    ContextManager.push({
      generator,
      generatorType: isAsync ? 'async' : 'sync',
      apiVersion: isAsync ? '2' : '1',
      depth: ContextManager.getDepth() + 1,
      timestamp: Date.now()
    });

    // Wrap the generator to pop context on completion
    if (isAsync) {
      return wrapAsyncGenerator(generator as AsyncGenerator<any, T, any>);
    } else {
      return wrapSyncGenerator(generator as Generator<any, T, any>);
    }
  };
}

function* wrapSyncGenerator<T>(
  generator: Generator<any, T, any>
): Generator<any, T, any> {
  try {
    let result = generator.next();
    while (!result.done) {
      const value = yield result.value;
      result = generator.next(value);
    }
    return result.value;
  } finally {
    ContextManager.pop();
  }
}

async function* wrapAsyncGenerator<T>(
  generator: AsyncGenerator<any, T, any>
): AsyncGenerator<any, T, any> {
  try {
    let result = await generator.next();
    while (!result.done) {
      const value = yield result.value;
      result = await generator.next(value);
    }
    return result.value;
  } finally {
    ContextManager.pop();
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  ContextManager,
  DetectionCache,
  StackAnalyzer
};

// Export a singleton instance for convenience
export const detector = new APIDetector();
export const router = new APIRouter();
