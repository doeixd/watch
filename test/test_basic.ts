// Basic tests that can run in Deno without DOM

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Test type inference
console.log("🧪 Testing Watch v5 Type System");

// Import types
import type { ElementFromSelector } from './src/types.ts';

// Test type inference (compile-time check)
type InputElement = ElementFromSelector<'input[type="text"]'>;
type ButtonElement = ElementFromSelector<'button'>;
type DivElement = ElementFromSelector<'div'>;
type GenericElement = ElementFromSelector<'unknown-element'>;

// These should compile correctly
const testInputType: InputElement = {} as HTMLInputElement;
const testButtonType: ButtonElement = {} as HTMLButtonElement;
const testDivType: DivElement = {} as HTMLDivElement;
const testGenericType: GenericElement = {} as HTMLElement;

console.log("✅ Type inference working correctly");

// Test observer status functions
import { getObserverStatus } from './src/core/observer.ts';

const status = getObserverStatus();
console.log("Observer status:", status);

assertEquals(status.isInitialized, false, "Observer should not be initialized yet");
assertEquals(status.isObserving, false, "Observer should not be observing yet");
assertEquals(status.selectorCount, 0, "Should have no selectors registered");

console.log("✅ Observer system tests passed");

// Test context functions (should fail gracefully without DOM)
import { getCurrentContext, getCurrentElement } from './src/core/context.ts';

const context = getCurrentContext();
const element = getCurrentElement();

assertEquals(context, null, "Should return null when no context");
assertEquals(element, null, "Should return null when no element");

console.log("✅ Context system tests passed");

console.log("\n🎉 All basic tests passed!");
console.log("💡 To test DOM functionality, open v5/index.html in a browser");
