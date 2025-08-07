/**
 * Smart Detection Module for API Context Awareness
 *
 * This module provides intelligent detection of calling contexts to enable
 * the dual API pattern, supporting both legacy sync generators and new async generators.
 */

import type { ElementHandler, ElementFn, Workflow } from "../types";
import { getCurrentContext } from "./context";

/**
 * Enum representing different API calling contexts
 */
export enum ApiContext {
  /** Direct element manipulation: text(element, 'Hello') */
  DIRECT = "direct",
  /** CSS selector manipulation: text('#button', 'Hello') */
  SELECTOR = "selector",
  /** Old sync generator: function* () { yield text('Hello') } */
  SYNC_GENERATOR = "sync_generator",
  /** New async generator: async function* () { yield* text('Hello') } */
  ASYNC_GENERATOR = "async_generator",
  /** Unknown or ambiguous context */
  UNKNOWN = "unknown",
}

/**
 * Detection result with context and confidence level
 */
export interface DetectionResult {
  context: ApiContext;
  confidence: number; // 0-1 confidence score
  isGenerator: boolean;
  isAsync: boolean;
  isYieldStar: boolean;
}

/**
 * Cache entry for detection results
 */
interface CacheEntry {
  result: DetectionResult;
  timestamp: number;
  hits: number;
}

/**
 * Global execution context flags
 */
class ExecutionContext {
  private static stack: ApiContext[] = [];
  private static asyncDepth = 0;
  private static syncDepth = 0;

  static push(context: ApiContext): void {
    this.stack.push(context);
    if (context === ApiContext.ASYNC_GENERATOR) this.asyncDepth++;
    if (context === ApiContext.SYNC_GENERATOR) this.syncDepth++;
  }

  static pop(): void {
    const context = this.stack.pop();
    if (context === ApiContext.ASYNC_GENERATOR) this.asyncDepth--;
    if (context === ApiContext.SYNC_GENERATOR) this.syncDepth--;
  }

  static getCurrent(): ApiContext | undefined {
    return this.stack[this.stack.length - 1];
  }

  static isInAsyncGenerator(): boolean {
    return this.asyncDepth > 0;
  }

  static isInSyncGenerator(): boolean {
    return this.syncDepth > 0;
  }

  static isInGenerator(): boolean {
    return this.isInAsyncGenerator() || this.isInSyncGenerator();
  }

  static reset(): void {
    this.stack = [];
    this.asyncDepth = 0;
    this.syncDepth = 0;
  }
}

/**
 * Detection cache for performance optimization
 */
class DetectionCache {
  private static cache = new Map<string, CacheEntry>();
  private static maxSize = 1000;
  private static ttl = 60000; // 1 minute TTL

  static generateKey(args: IArguments | any[], caller?: Function): string {
    const argsStr = Array.from(args)
      .map((arg) =>
        typeof arg === "function"
          ? "fn"
          : typeof arg === "object"
            ? "obj"
            : String(arg),
      )
      .join("|");

    const callerStr = caller ? caller.name || "anonymous" : "unknown";
    return `${callerStr}:${argsStr}`;
  }

  static get(key: string): DetectionResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.result;
  }

  static set(key: string, result: DetectionResult): void {
    if (this.cache.size >= this.maxSize) {
      // Evict least recently used entries
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp,
      );

      for (let i = 0; i < this.maxSize / 4; i++) {
        this.cache.delete(sortedEntries[i][0]);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  static clear(): void {
    this.cache.clear();
  }
}

/**
 * Stack trace analysis for generator detection
 */
class StackAnalyzer {
  private static readonly GENERATOR_PATTERNS = [
    /GeneratorFunctionPrototype\.next/,
    /Generator\.next/,
    /generator\.next/,
    /\.next\s*\(/,
    /yield\s+/,
    /yield\*/,
  ];

  private static readonly ASYNC_PATTERNS = [
    /AsyncGeneratorFunctionPrototype/,
    /AsyncGenerator/,
    /async\s+function\*/,
    /yield\*/,
  ];

  static analyze(): DetectionResult {
    const stack = new Error().stack || "";
    const lines = stack.split("\n").slice(2, 10); // Skip first 2 lines (Error + analyze)

    let isGenerator = false;
    let isAsync = false;
    let isYieldStar = false;
    let confidence = 0;

    for (const line of lines) {
      // Check for generator patterns
      for (const pattern of this.GENERATOR_PATTERNS) {
        if (pattern.test(line)) {
          isGenerator = true;
          confidence += 0.2;
          break;
        }
      }

      // Check for async patterns
      for (const pattern of this.ASYNC_PATTERNS) {
        if (pattern.test(line)) {
          isAsync = true;
          confidence += 0.1;
          break;
        }
      }

      // Specific check for yield*
      if (/yield\*/.test(line)) {
        isYieldStar = true;
        confidence += 0.3;
      }
    }

    // Normalize confidence
    confidence = Math.min(confidence, 1);

    // Determine context based on findings
    let context = ApiContext.UNKNOWN;
    if (isGenerator) {
      context = isAsync
        ? ApiContext.ASYNC_GENERATOR
        : ApiContext.SYNC_GENERATOR;
    }

    return {
      context,
      confidence,
      isGenerator,
      isAsync,
      isYieldStar,
    };
  }
}

/**
 * Type-based detection using runtime checks
 */
class TypeDetector {
  static isElement(obj: any): boolean {
    return (
      obj &&
      typeof obj === "object" &&
      (obj.nodeType === 1 || obj.nodeType === 9)
    );
  }

  static isCssSelector(str: any): boolean {
    if (typeof str !== "string") return false;

    // Common CSS selector patterns
    const selectorPatterns = [
      /^[#.]/, // Starts with # or .
      /^\[/, // Attribute selector
      /[>+~]/, // Combinators (excluding space to avoid false positives)
      /:[a-z-]+/, // Pseudo-classes
      /^[a-z]+[#.\[:]/, // Tag name followed by selector syntax
    ];

    // Check for selector patterns
    if (selectorPatterns.some((pattern) => pattern.test(str))) {
      return true;
    }

    // Check for known HTML tag names (common ones)
    const htmlTags = [
      "div",
      "span",
      "p",
      "a",
      "button",
      "input",
      "form",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "table",
      "tr",
      "td",
      "th",
      "tbody",
      "thead",
      "section",
      "article",
      "nav",
      "header",
      "footer",
      "main",
      "aside",
      "label",
      "select",
      "option",
      "textarea",
      "iframe",
      "video",
      "audio",
      "canvas",
    ];

    // Only consider it a selector if it's exactly a known HTML tag
    return htmlTags.includes(str.toLowerCase());
  }

  static isGeneratorFunction(fn: any): boolean {
    if (typeof fn !== "function") return false;

    const constructor = fn.constructor;
    if (!constructor) return false;

    const name = constructor.name || constructor.toString();
    return /GeneratorFunction|AsyncGeneratorFunction/.test(name);
  }

  static detectFromArguments(
    args: IArguments | any[],
  ): Partial<DetectionResult> {
    const argsArray = Array.from(args);

    // Check if we're in a generator context using the core context
    const currentContext = getCurrentContext();
    if (currentContext) {
      // We're definitely in a generator context
      return {
        context: ApiContext.SYNC_GENERATOR,
        confidence: 0.95,
        isGenerator: true,
        isAsync: false,
        isYieldStar: false,
      };
    }

    // Empty args often means getter pattern in generator
    if (argsArray.length === 0) {
      return {
        isGenerator: ExecutionContext.isInGenerator(),
        isAsync: ExecutionContext.isInAsyncGenerator(),
      };
    }

    // Check first argument
    const firstArg = argsArray[0];

    if (this.isElement(firstArg)) {
      return {
        context: ApiContext.DIRECT,
        confidence: 0.9,
        isGenerator: false,
        isAsync: false,
        isYieldStar: false,
      };
    }

    if (typeof firstArg === "string" && this.isCssSelector(firstArg)) {
      return {
        context: ApiContext.SELECTOR,
        confidence: 0.8,
        isGenerator: false,
        isAsync: false,
        isYieldStar: false,
      };
    }

    // Check if arguments contain generator functions
    const hasGeneratorArg = argsArray.some((arg) =>
      this.isGeneratorFunction(arg),
    );
    if (hasGeneratorArg) {
      return {
        isGenerator: true,
        confidence: 0.7,
      };
    }

    return {};
  }
}

/**
 * Main smart detection function with hybrid approach
 */
export function detectContext(
  args: IArguments | any[],
  caller?: Function,
): DetectionResult {
  // 1. Check cache first
  const cacheKey = DetectionCache.generateKey(args, caller);
  const cached = DetectionCache.get(cacheKey);
  if (cached) return cached;

  // 2. Check if we're in a generator context using core context (most reliable)
  const coreContext = getCurrentContext();
  if (coreContext) {
    // We're definitely in a generator context
    const result: DetectionResult = {
      context: ApiContext.SYNC_GENERATOR,
      confidence: 0.99,
      isGenerator: true,
      isAsync: false,
      isYieldStar: false,
    };
    DetectionCache.set(cacheKey, result);
    return result;
  }

  // 3. Check execution context flags (fastest after core context)
  const currentContext = ExecutionContext.getCurrent();
  if (currentContext && currentContext !== ApiContext.UNKNOWN) {
    const result: DetectionResult = {
      context: currentContext,
      confidence: 0.95,
      isGenerator:
        currentContext === ApiContext.SYNC_GENERATOR ||
        currentContext === ApiContext.ASYNC_GENERATOR,
      isAsync: currentContext === ApiContext.ASYNC_GENERATOR,
      isYieldStar: currentContext === ApiContext.ASYNC_GENERATOR,
    };
    DetectionCache.set(cacheKey, result);
    return result;
  }

  // 4. Type-based detection (fast)
  const typeResult = TypeDetector.detectFromArguments(args);
  if (
    typeResult.context &&
    typeResult.confidence &&
    typeResult.confidence > 0.7
  ) {
    const result: DetectionResult = {
      context: typeResult.context!,
      confidence: typeResult.confidence,
      isGenerator: typeResult.isGenerator || false,
      isAsync: typeResult.isAsync || false,
      isYieldStar: typeResult.isYieldStar || false,
    };
    DetectionCache.set(cacheKey, result);
    return result;
  }

  // 5. Stack trace analysis (slower but more accurate)
  const stackResult = StackAnalyzer.analyze();

  // 6. Combine results for final decision
  const finalResult: DetectionResult = {
    context:
      stackResult.context !== ApiContext.UNKNOWN
        ? stackResult.context
        : typeResult.context || ApiContext.UNKNOWN,
    confidence: Math.max(stackResult.confidence, typeResult.confidence || 0),
    isGenerator: stackResult.isGenerator || typeResult.isGenerator || false,
    isAsync: stackResult.isAsync || typeResult.isAsync || false,
    isYieldStar: stackResult.isYieldStar || typeResult.isYieldStar || false,
  };

  // Cache the result
  DetectionCache.set(cacheKey, finalResult);
  return finalResult;
}

/**
 * Wrapper function for execution context tracking
 */
export function withContext<T>(context: ApiContext, fn: () => T): T {
  ExecutionContext.push(context);
  try {
    return fn();
  } finally {
    ExecutionContext.pop();
  }
}

/**
 * Mark a function as being called from a sync generator
 */
export function markSyncGenerator<T>(fn: () => T): T {
  return withContext(ApiContext.SYNC_GENERATOR, fn);
}

/**
 * Mark a function as being called from an async generator
 */
export function markAsyncGenerator<T>(fn: () => T): T {
  return withContext(ApiContext.ASYNC_GENERATOR, fn);
}

/**
 * Smart wrapper for dual API functions
 * Automatically detects context and adapts behavior
 */
export function smartApiWrapper<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options?: {
    generatorReturn?: (...args: TArgs) => ElementFn<any> | Workflow<any>;
    directReturn?: (...args: TArgs) => any;
  },
): (...args: TArgs) => any {
  return function smartWrapped(...args: TArgs): any {
    const detection = detectContext(args, fn);

    // If in generator context and generator handler provided
    if (detection.isGenerator && options?.generatorReturn) {
      return options.generatorReturn(...args);
    }

    // If direct/selector context and direct handler provided
    if (!detection.isGenerator && options?.directReturn) {
      return options.directReturn(...args);
    }

    // Default to original function
    return fn(...args);
  };
}

/**
 * Reset detection system (useful for testing)
 */
export function resetDetection(): void {
  ExecutionContext.reset();
  DetectionCache.clear();
}

/**
 * Get current detection statistics (for debugging)
 */
export function getDetectionStats(): {
  contextStack: ApiContext[];
  cacheSize: number;
  isInGenerator: boolean;
  isInAsyncGenerator: boolean;
  isInSyncGenerator: boolean;
} {
  return {
    contextStack: (ExecutionContext as any).stack || [],
    cacheSize: (DetectionCache as any).cache?.size || 0,
    isInGenerator: ExecutionContext.isInGenerator(),
    isInAsyncGenerator: ExecutionContext.isInAsyncGenerator(),
    isInSyncGenerator: ExecutionContext.isInSyncGenerator(),
  };
}

export { ExecutionContext, DetectionCache, StackAnalyzer, TypeDetector };
