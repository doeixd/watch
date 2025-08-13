// Test to understand how generators are being executed

async function testGeneratorExecution() {
  console.log('\n=== Testing Generator Execution ===\n');

  // Simulate what the generator module does
  function createWorkflow(value) {
    return (async function* () {
      console.log('Workflow: About to yield operation');
      yield ((context) => {
        console.log('Operation: Executing with context:', context);
        context.element.textContent = value;
      });
      console.log('Workflow: After yield');
    })();
  }

  // Simulate what happens when we use yield*
  async function* userGenerator() {
    console.log('User: Before yield*');
    const workflow = createWorkflow('Hello World');
    console.log('User: Created workflow:', workflow);
    console.log('User: Has asyncIterator?', Symbol.asyncIterator in workflow);
    console.log('User: Has next?', 'next' in workflow);

    // This is what yield* does
    const result = yield* workflow;
    console.log('User: After yield*, result:', result);
    return 'done';
  }

  // Simulate what the context handler does
  async function executeGenerator(gen) {
    console.log('\nContext: Starting execution');
    let result = await gen.next();

    while (!result.done) {
      console.log('Context: Got yielded value:', typeof result.value, result.value);

      const yielded = result.value;

      // Check if it's a function (Operation)
      if (typeof yielded === 'function') {
        console.log('Context: Executing as function');
        const mockContext = {
          element: { textContent: '' }
        };
        yielded(mockContext);
        console.log('Context: After execution, element text:', mockContext.element.textContent);
        result = await gen.next();
      }
      // Check if it's an async generator (from yield*)
      else if (yielded && typeof yielded[Symbol.asyncIterator] === 'function' && typeof yielded.next === 'function') {
        console.log('Context: Got async generator, delegating...');
        const delegateResult = await executeGenerator(yielded);
        result = await gen.next(delegateResult);
      }
      else {
        console.log('Context: Unknown yielded type');
        result = await gen.next();
      }
    }

    console.log('Context: Generator done, return value:', result.value);
    return result.value;
  }

  // Test execution
  console.log('\n--- Test 1: Direct execution of workflow ---');
  const workflow1 = createWorkflow('Test 1');
  await executeGenerator(workflow1);

  console.log('\n--- Test 2: Execution through user generator with yield* ---');
  const userGen = userGenerator();
  await executeGenerator(userGen);

  // Test what actually gets yielded with yield*
  console.log('\n--- Test 3: Manual yield* inspection ---');
  async function* testYieldStar() {
    const workflow = createWorkflow('Test 3');

    // Manually iterate the workflow
    console.log('Manual: Starting workflow iteration');
    let step = await workflow.next();
    while (!step.done) {
      console.log('Manual: Workflow yielded:', typeof step.value);
      // yield* would yield this value directly
      yield step.value;
      step = await workflow.next();
    }
    return step.value;
  }

  const manualGen = testYieldStar();
  await executeGenerator(manualGen);
}

testGeneratorExecution().catch(console.error);
