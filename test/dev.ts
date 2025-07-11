// Development and testing file

import { 
  watch, 
  text, 
  addClass, 
  removeClass, 
  on, 
  click, 
  self, 
  el, 
  all,
  cleanup,
  ctx,
  createGenerator,
  gen,
  watchGenerator,
  context,
  button,
  input,
  div,
  withData,
  withDebounce,
  withThrottle,
  once,
  createState,
  createComputed,
  setState,
  getState,
  safely,
  when,
  delay,
  batchAll
} from './mod.ts';

// Basic test to verify functionality
console.log('🚀 Watch v5 Development Mode');

// Test 1: Basic watch with generator
console.log('Test 1: Basic watch functionality');

// Create a test button
const testButton = document.createElement('button');
testButton.textContent = 'Test Button';
testButton.id = 'test-button';
document.body.appendChild(testButton);

// Test watch with generator - now with type safety!
const cleanup1 = watch('button#test-button', function* () {
  console.log('✅ Button found and setup running');
  
  // Test self() - now properly typed as HTMLButtonElement
  const buttonEl = self<HTMLButtonElement>();
  console.log('Self element (typed):', buttonEl.tagName);
  
  // Test text manipulation
  yield text('Click me!');
  
  // Test class manipulation
  yield addClass('test-class');
  
  // Test event handling
  yield click((e, el) => {
    console.log('Button clicked!', el);
    
    // Test self() function within event handler
    const currentElement = self();
    console.log('Self element:', currentElement);
    
    // Test el() function - type-safe query
    const foundEl = el<HTMLButtonElement>('#test-button');
    console.log('Found element:', foundEl);
  });
  
  // Test cleanup
  cleanup(() => {
    console.log('Cleanup function called');
  });
});

// Test 2: Dynamic element creation
console.log('Test 2: Dynamic element creation');

setTimeout(() => {
  const dynamicButton = document.createElement('button');
  dynamicButton.textContent = 'Dynamic Button';
  dynamicButton.className = 'dynamic-btn';
  document.body.appendChild(dynamicButton);
  
  console.log('Dynamic button added');
}, 1000);

// Watch for dynamic buttons - with typed context helper
const cleanup2 = watch('.dynamic-btn', createGenerator<HTMLButtonElement>((ctx) => function* () {
  console.log('✅ Dynamic button found');
  console.log('Typed context element:', ctx.element.tagName);
  console.log('Context info:', ctx.selector, ctx.index);
  
  yield text('I am dynamic!');
  yield addClass('dynamic-active');
  
  yield click((e, el) => {
    console.log('Dynamic button clicked!');
    // Note: yield can't be used inside event handlers
    // Use direct function calls instead
    removeClass(el, 'dynamic-active');
    addClass(el, 'clicked');
  });
}));

// Test 3: Type inference
console.log('Test 3: Type inference test');

// Create input element
const testInput = document.createElement('input');
testInput.type = 'text';
testInput.placeholder = 'Type here...';
testInput.id = 'test-input';
document.body.appendChild(testInput);

// Test type inference - should infer HTMLInputElement
const cleanup3 = watch('input[type="text"]', function* () {
  console.log('✅ Input element found');
  
  // self() should return HTMLInputElement due to selector inference
  const inputEl = self(); // TypeScript infers this as HTMLInputElement
  console.log('Input element type:', inputEl.constructor.name);
  console.log('Input placeholder:', inputEl.placeholder);
  console.log('Input value property available:', 'value' in inputEl);
  
  yield on('input', (e, el) => {
    console.log('Input value changed:', el.value);
    // el should be HTMLInputElement here due to type inference
  });
});

// Test 4: Element proxy test
console.log('Test 4: Element proxy test');

const testContainer = document.createElement('div');
testContainer.id = 'test-container';
testContainer.innerHTML = `
  <h1>Container Title</h1>
  <p>Container content</p>
  <span>Nested span</span>
`;
document.body.appendChild(testContainer);

const cleanup4 = watch('#test-container', function* () {
  console.log('✅ Container found');
  
  // Test el and all functions - now type-safe
  const title = el<HTMLHeadingElement>('h1');
  const content = el<HTMLParagraphElement>('p');
  const allElements = all<HTMLElement>('*');
  
  console.log('Found title:', title?.textContent);
  console.log('Found content:', content?.textContent);
  console.log('All child elements:', allElements.length);
  
  // Test self function - properly typed as HTMLDivElement
  const container = self<HTMLDivElement>();
  console.log('Self container:', container.id);
  
  // Test ctx() function for full context access
  const context = ctx();
  console.log('Full context:', {
    selector: context.selector,
    index: context.index,
    arrayLength: context.array.length
  });
});

// Test 5: watchGenerator helper for ultimate type safety
console.log('Test 5: watchGenerator helper');

const testSpan = document.createElement('span');
testSpan.textContent = 'Test Span';
testSpan.className = 'test-span';
document.body.appendChild(testSpan);

const cleanup5 = watch('span.test-span', watchGenerator('span.test-span', (ctx) => function* () {
  console.log('✅ Span found with watchGenerator');
  
  // ctx is fully typed as TypedGeneratorContext<HTMLSpanElement>
  console.log('Span element:', ctx.element.tagName);
  console.log('Context selector:', ctx.selector);
  
  // All methods are properly typed
  const spanSelf = ctx.self(); // HTMLSpanElement
  const nestedElements = ctx.all('*'); // HTMLElement[]
  
  console.log('Span self:', spanSelf.textContent);
  console.log('Nested elements:', nestedElements.length);
  
  yield addClass('typed-span');
  
  yield click((e, el) => {
    console.log('Typed span clicked!', el.tagName);
  });
  
  ctx.cleanup(() => {
    console.log('Span cleanup called');
  });
}));

// Test 6: Context-based API with enhanced type safety
console.log('Test 6: Context-based API');

// Create context objects with type safety
const incrementButtonCtx = button('button.increment', {
  data: { counter: 0 }
});

const debounceInputCtx = withDebounce(
  input('input.search'),
  300
);

const onceButtonCtx = once(
  withData(
    button('button.one-time'),
    { message: 'I only work once!' }
  )
);

// Create elements
const incButton = document.createElement('button');
incButton.textContent = '0';
incButton.className = 'increment';
document.body.appendChild(incButton);

const searchInput = document.createElement('input');
searchInput.type = 'text';
searchInput.className = 'search';
searchInput.placeholder = 'Type to search (debounced)...';
document.body.appendChild(searchInput);

const oneTimeButton = document.createElement('button');
oneTimeButton.textContent = 'Click me once';
oneTimeButton.className = 'one-time';
document.body.appendChild(oneTimeButton);

// Watch with context objects - fully typed!
const cleanup6a = watch(incrementButtonCtx, function* () {
  console.log('✅ Increment button found with context');
  
  // self() is typed as HTMLButtonElement
  const btn = self();
  let counter = 0;
  
  yield click((e, el) => {
    counter++;
    el.textContent = counter.toString();
    console.log('Counter:', counter);
    
    // Access context data
    const contextData = ctx();
    console.log('Context data available');
  });
});

const cleanup6b = watch(debounceInputCtx, function* () {
  console.log('✅ Search input with debounce context');
  
  // self() is typed as HTMLInputElement
  const input = self();
  console.log('Input placeholder:', input.placeholder);
  
  yield on('input', (e, el) => {
    console.log('Debounced search:', el.value);
  });
});

const cleanup6c = watch(onceButtonCtx, function* () {
  console.log('✅ One-time button with context');
  
  yield click((e, el) => {
    console.log('This will only run once!');
    el.textContent = 'Already clicked!';
    el.disabled = true;
  });
});

// Test 7: Enhanced features showcase
console.log('Test 7: Enhanced state management and execution helpers');

const enhancedButton = document.createElement('button');
enhancedButton.textContent = 'Enhanced Features Test';
enhancedButton.className = 'enhanced-test';
document.body.appendChild(enhancedButton);

const cleanup7 = watch('.enhanced-test', function* () {
  console.log('✅ Enhanced features test');
  
  // Enhanced state management
  const counter = createState('counter', 0);
  const doubled = createComputed(() => counter.get() * 2, ['counter']);
  
  // Safe execution with error handling
  yield safely((el) => {
    console.log('Safe operation executed');
    text(el, `Counter: ${counter.get()}`);
  });
  
  // Conditional execution
  yield when(
    (el) => counter.get() > 3,
    (el) => addClass(el, 'many-clicks'),
    (el) => removeClass(el, 'many-clicks')
  );
  
  // Enhanced click handler
  yield click((e, el) => {
    // Update state
    counter.update(c => c + 1);
    
    console.log('Enhanced click:', {
      count: counter.get(),
      doubled: doubled()
    });
    
    // Use enhanced text function
    text(el, `Clicked ${counter.get()} times (doubled: ${doubled()})`);
    
    // Delayed action
    delay(1000, (delayedEl) => {
      console.log('Delayed action executed');
      addClass(delayedEl, 'delayed-action');
    })(el);
  });
});

// Test batch operations
const testElements = [
  '.enhanced-test',
  '.increment',
  '.search'
];

console.log('Testing batch operations...');
batchAll(testElements, 
  addClass('batch-processed'),
  attr('data-enhanced', 'true')
);

// Clean up all tests after 5 seconds
setTimeout(() => {
  console.log('🧹 Cleaning up tests...');
  cleanup1();
  cleanup2();
  cleanup3();
  cleanup4();
  cleanup5();
  cleanup6a();
  cleanup6b();
  cleanup6c();
  cleanup7();
  
  // Remove test elements
  document.getElementById('test-button')?.remove();
  document.querySelector('.dynamic-btn')?.remove();
  document.getElementById('test-input')?.remove();
  document.getElementById('test-container')?.remove();
  document.querySelector('.test-span')?.remove();
  document.querySelector('.increment')?.remove();
  document.querySelector('.search')?.remove();
  document.querySelector('.one-time')?.remove();
  document.querySelector('.enhanced-test')?.remove();
  
  console.log('✅ All tests completed and cleaned up');
}, 5000);

// Log current observer status
setTimeout(() => {
  import('./src/core/observer.ts').then(({ getObserverStatus }) => {
    console.log('Observer status:', getObserverStatus());
  });
}, 100);
