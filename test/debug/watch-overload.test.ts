import { watch } from "../../src/watch";
import { text } from "../../src/generator/dom";

// Test 1: Simple element with sync generator
const element = document.createElement("div");

// This should match the overload:
// watch<El extends HTMLElement>(
//   element: El,
//   generator: (ctx: TypedGeneratorContext<El>) => Generator<ElementFn<El>, void, unknown>
// ): WatchController<El>

watch(element, function* (ctx) {
  yield* text("Hello");
});

// Test 2: With explicit type
const button = document.createElement("button");

watch(button, function* (ctx) {
  yield* text("Click me");
});

// Test 3: Cast to HTMLElement
const div = document.createElement("div");

watch(div as HTMLElement, function* (ctx) {
  yield* text("Content");
});
