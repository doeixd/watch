// Simple test to debug sync generator behavior

// Test 1: Basic sync generator
console.log("=== Test 1: Basic Sync Generator ===");
const basicGen = function* () {
  console.log("Generator started");
  yield "first";
  yield "second";
  return "done";
};

const gen1 = basicGen();
console.log("Step 1:", gen1.next());
console.log("Step 2:", gen1.next());
console.log("Step 3:", gen1.next());

// Test 2: Sync generator with yield*
console.log("\n=== Test 2: Sync Generator with yield* ===");
const innerWorkflow = function* () {
  yield "inner-1";
  yield "inner-2";
  return "inner-done";
};

const outerGen = function* () {
  console.log("Before yield*");
  const result = yield* innerWorkflow();
  console.log("After yield*, got:", result);
  yield "outer-final";
  return result;
};

const gen2 = outerGen();
console.log("Step 1:", gen2.next());
console.log("Step 2:", gen2.next());
console.log("Step 3:", gen2.next());
console.log("Step 4:", gen2.next());

// Test 3: Sync generator yielding functions
console.log("\n=== Test 3: Sync Generator Yielding Functions ===");
const workflowWithFunctions = function* () {
  yield (context) => {
    console.log("Function 1 called with:", context);
    context.element.textContent = "Hello";
    return "result1";
  };
  yield (context) => {
    console.log("Function 2 called with:", context);
    context.element.textContent += " World";
    return "result2";
  };
  return "workflow-done";
};

const gen3 = workflowWithFunctions();
const mockContext = { element: { textContent: "" } };

const step1 = gen3.next();
console.log("Step 1 yielded:", typeof step1.value);
if (typeof step1.value === "function") {
  const result = step1.value(mockContext);
  console.log("Function 1 returned:", result);
  console.log("Element text:", mockContext.element.textContent);
}

const step2 = gen3.next();
console.log("Step 2 yielded:", typeof step2.value);
if (typeof step2.value === "function") {
  const result = step2.value(mockContext);
  console.log("Function 2 returned:", result);
  console.log("Element text:", mockContext.element.textContent);
}

const step3 = gen3.next();
console.log("Step 3:", step3);

// Test 4: Mimicking the text() function
console.log("\n=== Test 4: Mimicking text() Function ===");
function text(content) {
  return (function* () {
    yield ((context) => {
      context.element.textContent = content;
    });
  })();
}

const textWorkflow = text("Test Content");
console.log("textWorkflow type:", typeof textWorkflow);
console.log("Has Symbol.iterator?", Symbol.iterator in textWorkflow);

const textGen = textWorkflow[Symbol.iterator] ? textWorkflow : textWorkflow[Symbol.iterator]();
const mockElement = { element: { textContent: "" } };

const textStep1 = textGen.next();
console.log("Text step 1:", { value: typeof textStep1.value, done: textStep1.done });

if (typeof textStep1.value === "function") {
  textStep1.value(mockElement);
  console.log("Element text after:", mockElement.element.textContent);
}

const textStep2 = textGen.next();
console.log("Text step 2:", textStep2);

// Test 5: Using yield* with text()
console.log("\n=== Test 5: Using yield* with text() ===");
const mainWorkflow = function* () {
  console.log("Before yield* text()");
  yield* text("Hello from yield*");
  console.log("After yield* text()");
};

const gen5 = mainWorkflow();
const mockEl5 = { element: { textContent: "" } };

const step5_1 = gen5.next();
console.log("Main step 1:", { value: typeof step5_1.value, done: step5_1.done });

if (typeof step5_1.value === "function") {
  step5_1.value(mockEl5);
  console.log("Element text:", mockEl5.element.textContent);
}

const step5_2 = gen5.next();
console.log("Main step 2:", step5_2);
