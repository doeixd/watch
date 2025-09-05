# Watch Selector Quick Reference

A concise guide to the most commonly used functions in watch-selector.

## Core Functions

### `watch(selector, handler)`
Watch elements matching a CSS selector
```typescript
watch('button', function* () {
  yield addClass('interactive');
  yield click(() => console.log('Clicked!'));
});
```

## DOM Manipulation

### Text & HTML
```typescript
// Set/get text content
text(element, 'Hello');           // Direct
text('#button', 'Hello');         // Selector
yield text('Hello');              // Generator
const content = yield text();     // Get text

// Set/get HTML content
html(element, '<b>Bold</b>');
yield html('<p>Content</p>');
```

### Classes
```typescript
// Add classes
addClass(element, 'active', 'highlighted');
yield addClass('ready');

// Remove classes
removeClass(element, 'loading');
yield removeClass('error');

// Toggle class
toggleClass(element, 'active');
const hasActive = yield toggleClass('active');

// Check class
if (hasClass(element, 'active')) { }
const hasIt = yield hasClass('active');
```

### Styles
```typescript
// Set multiple styles
style(element, { color: 'red', fontSize: '16px' });
yield style({ display: 'block' });

// Set single style
style(element, 'color', 'blue');
yield style('backgroundColor', 'white');

// Get style
const color = style(element, 'color');
```

### Attributes
```typescript
// Set attribute
attr(element, 'data-id', '123');
yield attr('disabled', 'true');

// Get attribute
const id = attr(element, 'data-id');
const value = yield attr('href');

// Remove attribute
removeAttr(element, 'disabled');
yield removeAttr('readonly');

// Check attribute
if (hasAttr(element, 'disabled')) { }
```

### Properties
```typescript
// Set property (type-safe)
prop(input, 'value', 'Hello');
yield prop('disabled', false);

// Get property
const val = prop(input, 'value');
const isDisabled = yield prop('disabled');
```

### Form Elements
```typescript
// Get/set input value
value(input, 'Default text');
const text = value(input);
yield value('Hello');

// Get/set checked state
checked(checkbox, true);
const isChecked = checked(checkbox);
yield checked(false);

// Focus management
focus(input);
blur(input);
yield focus();
```

### Visibility
```typescript
// Show/hide elements
show(element);
hide(element);
yield show();
yield hide();
```

### DOM Traversal
```typescript
// Query child elements
const button = query(container, 'button');
const items = queryAll(container, '.item');
yield query('.child');
yield queryAll('.items');

// Get related elements
const parent = parent(element);
const children = children(element);
const siblings = siblings(element);
```

## Event Handling

### Basic Events
```typescript
// Click handler
click(button, () => console.log('Clicked'));
yield click(function* () {
  yield addClass('clicked');
});

// Input handler
input(field, (e) => console.log(e.target.value));
yield input((e) => {
  setState('value', e.target.value);
});

// Change handler
change(select, (e) => console.log('Changed'));
yield change(() => updateSelection());

// Submit handler
submit(form, (e) => {
  e.preventDefault();
  handleSubmit();
});
```

### Generic Event Handler
```typescript
// Any event
on(element, 'mouseover', handler);
yield on('keydown', (e) => {
  if (e.key === 'Enter') submit();
});
```

### Advanced Event Options
```typescript
// Debouncing
yield input(handler, { debounce: 300 });

// Throttling
yield on('scroll', handler, { throttle: 100 });

// Delegation
yield click(handler, { 
  delegate: '.child-button' 
});

// One-time event
yield click(handler, { once: true });

// Event filtering
yield click(handler, {
  filter: (event, element) => !element.disabled
});
```

### Custom Events
```typescript
// Emit custom event
emit(element, 'user-action', { data: 'value' });
yield emit('custom-event', payload);

// Create custom event
const event = createCustomEvent('action', data);
element.dispatchEvent(event);
```

### Observer Events
```typescript
// Watch attribute changes
onAttr(element, (change) => {
  console.log(`${change.name}: ${change.value}`);
});

// Watch text changes
yield onText((change) => {
  console.log(`Text: ${change.value}`);
});

// Watch visibility
yield onVisible((change) => {
  if (change.isVisible) loadContent();
});

// Watch resize
yield onResize((change) => {
  console.log(`Size: ${change.width}x${change.height}`);
});
```

### Lifecycle Events
```typescript
// On mount
yield onMount(() => {
  console.log('Element added to DOM');
  initialize();
});

// On unmount
yield onUnmount(() => {
  console.log('Element removed from DOM');
  cleanup();
});
```

## State Management

### Basic State
```typescript
// Get state
const count = getState('count', 0); // with default
const user = getState('user');

// Set state
setState('count', 42);
setState('user', { name: 'John' });

// Update state
updateState('count', (current = 0) => current + 1);

// Check state
if (hasState('initialized')) { }

// Delete state
deleteState('count');
```

### Typed State
```typescript
// Create typed state
const counter = createState('count', 0);
counter.set(counter.get() + 1);

// Typed state wrapper
const userState = createTypedState<User>('user');
userState.set({ name: 'John', age: 30 });
```

### Reactive State
```typescript
// Watch state changes
const unwatch = watchState('count', (newVal, oldVal) => {
  console.log(`Changed from ${oldVal} to ${newVal}`);
});

// Computed state
const total = createComputed(
  'total',
  ['price', 'qty'],
  (price, qty) => price * qty
);

// Batch updates
batchStateUpdates(() => {
  setState('a', 1);
  setState('b', 2);
  setState('c', 3);
});
```

### Persisted State
```typescript
// LocalStorage persistence
const theme = createPersistedState('theme', 'light');
theme.set('dark'); // Saves to localStorage
```

## Context Functions

Available inside generator functions:

```typescript
watch('button', function* () {
  // Get current element
  const button = self();
  
  // Query children
  const icon = el('.icon');
  const items = all('.item');
  
  // Register cleanup
  cleanup(() => {
    console.log('Cleaning up');
  });
  
  // Get context
  const context = ctx();
  const parent = getParentContext();
});
```

## Execution Helpers

### Timing
```typescript
// Delay execution
yield delay(1000); // Wait 1 second

// Execute once
yield once(() => expensiveOperation());

// Throttle function
const throttled = throttle(handler, 100);

// Debounce function
const debounced = debounce(handler, 300);
```

### Conditional Execution
```typescript
// Wait for condition
yield when(
  () => hasState('ready'),
  () => initialize(),
  { timeout: 5000 }
);

// Retry on failure
const data = yield retry(
  () => fetchData(),
  { attempts: 3, delay: 1000 }
);
```

## Generator Submodule

Use pure workflow functions with `yield*`:

```typescript
import { watch } from 'watch-selector';
import { text, addClass, click, getState, setState } from 'watch-selector/generator';

watch('.button', async function* () {
  // Direct yield* - no wrapper needed
  yield* addClass('ready');
  yield* text('Click me!');
  
  yield* click(async function* () {
    const count = yield* getState('count', 0);
    yield* setState('count', count + 1);
    yield* text(`Clicked ${count + 1} times`);
  });
});
```

## $ Helper Pattern

Use `$` wrapper for type-safe `yield*` with main API:

```typescript
import { watch, $, text, addClass, getState } from 'watch-selector';

watch('.button', async function* () {
  // Type-safe yield* with $
  yield* $(addClass('ready'));
  yield* $(text('Ready'));
  
  const count = yield* $(getState('count', 0));
  yield* $(text(`Count: ${count}`));
});
```

## Scoped Watching

Watch elements within a specific parent:

```typescript
// Basic scoped watch
const container = document.querySelector('#container');
const watcher = scopedWatch(container, '.item', function* () {
  yield addClass('found');
});

// Stop watching
watcher.disconnect();

// With timeout (auto-disconnect)
const temp = document.querySelector('#temp');
scopedWatchTimeout(temp, '.item', handler, 5000);

// Process limited elements
const stream = document.querySelector('#stream');
scopedWatchOnce(stream, '.message', handler, 3);

// Batch multiple selectors
scopedWatchBatch('#form', [
  { selector: 'input', handler: inputHandler },
  { selector: 'button', handler: buttonHandler }
]);
```

## Common Patterns

### Component Pattern
```typescript
function createCounter(initial = 0) {
  return function* () {
    const count = createState('count', initial);
    
    yield text(`Count: ${count.get()}`);
    yield click(() => {
      count.set(count.get() + 1);
      text(self(), `Count: ${count.get()}`);
    });
  };
}

watch('.counter', createCounter(10));
```

### Event Composition
```typescript
const ripple = createEventBehavior('click', function* () {
  yield addClass('ripple');
  yield delay(600);
  yield removeClass('ripple');
});

const track = createEventBehavior('click', (e) => {
  analytics.track('click', e.target);
});

watch('.button', function* () {
  yield ripple;
  yield track;
});
```

### Animation
```typescript
watch('.animated', function* () {
  yield addClass('fade-in');
  yield delay(300);
  yield addClass('slide-up');
  yield delay(300);
  yield removeClass('fade-in', 'slide-up');
});
```

### Form Handling
```typescript
watch('form', function* () {
  yield submit(async function* (e) {
    e.preventDefault();
    
    yield addClass('submitting');
    const formData = new FormData(e.target);
    
    try {
      await submitAPI(formData);
      yield addClass('success');
    } catch (error) {
      yield addClass('error');
    } finally {
      yield removeClass('submitting');
    }
  });
});
```

## Type Safety Tips

### Selector Type Inference
```typescript
// Button is automatically typed as HTMLButtonElement
watch('button', function* () {
  const button = self(); // HTMLButtonElement
  button.disabled = false; // Type-safe!
});

// Specific element types
watch('input[type="text"]', function* () {
  const input = self() as HTMLInputElement;
  input.value = 'Typed correctly';
});
```

### State Types
```typescript
interface AppState {
  user: { name: string; email: string };
  settings: { theme: string; lang: string };
}

watch('.app', function* () {
  const user = getState<AppState['user']>('user');
  const settings = createTypedState<AppState['settings']>('settings');
});
```

## Performance Tips

### Batch Operations
```typescript
yield batchAll(
  addClass('ready'),
  text('Loading...'),
  style({ opacity: '0.5' })
);
```

### Debounce Expensive Operations
```typescript
yield input(async (e) => {
  await searchAPI(e.target.value);
}, { debounce: 300 });
```

### Use Delegation for Dynamic Content
```typescript
watch('.list', function* () {
  yield click((e) => {
    const item = e.target.closest('.item');
    toggleClass(item, 'selected');
  }, { delegate: '.item' });
});
```

### Clean Up Resources
```typescript
watch('.component', function* () {
  const interval = setInterval(update, 1000);
  
  cleanup(() => clearInterval(interval));
  
  yield onUnmount(() => {
    saveState();
  });
});
```
