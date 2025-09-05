import { watch } from "../../src/watch";
import { text } from "../../src/api/dom-new";

// Test 1: Simple element with sync generator
const element = document.createElement("div");

// This should match the overload:
// watch<El extends HTMLElement>(
//   element: El,
//   generator: (ctx: TypedGeneratorContext<El>) => Generator<ElementFn<El>, void, unknown>
// ): WatchController<El>

watch(element, function* () {
  yield* text("Hello World");
});

// Test 2: CSS selector with async generator
watch("button", async function* () {
  yield* text("Button Text");
});

// Test 3: Direct element manipulation
text(element, "Direct text");

// Test 4: CSS selector manipulation
text("button", "Button selector text");

// console.log("All overloads compiled successfully");
