/**
 * @fileoverview Comprehensive Example: New Generator API with $ Helper
 *
 * This example demonstrates the new type-safe generator API pattern using the $ helper
 * and pure operations from the 'watch-selector/generator' submodule. It showcases
 * how the new API provides perfect type safety while maintaining the elegant
 * composition patterns of the original library.
 *
 * Key Features Demonstrated:
 * - Type-safe operations with the $ helper
 * - Perfect type inference for return values
 * - State management with pure operations
 * - Event handling with pure operations
 * - Backward compatibility with classic API
 * - Advanced composition patterns
 */

import { watch, $ } from '../src/index';
import {
  // DOM Operations
  addClass,
  removeClass,
  text,
  style,
  attr,
  self,
  query,

  // State Operations
  getState,
  setState,
  updateState,
  incrementState,
  toggleState,

  // Event Operations
  click,
  input,
  submit,
  onMount,

  // Utility Operations
  delay,
  log
} from '../src/generator/index';

// ============================================================================
// EXAMPLE 1: Basic DOM Manipulation with Type Safety
// ============================================================================

console.log('🎯 Example 1: Basic DOM Manipulation');

// Create test elements
document.body.innerHTML += `
  <div class="example-1">
    <h2>Type-Safe DOM Manipulation</h2>
    <button id="magic-button">Click to see magic!</button>
    <div id="output-1" class="output"></div>
  </div>
`;

watch('#magic-button', async function*() {
  // Perfect type safety with the $ helper
  yield* $(addClass('interactive', 'ready'));
  yield* $(text('✨ Ready for Magic!'));
  yield* $(style({
    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    cursor: 'pointer'
  }));

  // Get the element with perfect typing
  const button = yield* $(self<HTMLButtonElement>());
  console.log('Button element:', button.tagName); // TypeScript knows this is HTMLButtonElement

  yield* $(click(async (event, element) => {
    console.log('Magic button clicked!', { event, element });

    // Find the output div and update it
    const output = yield* $(query<HTMLDivElement>('#output-1'));
    if (output) {
      output.innerHTML = `
        <p>✨ Magic happened at ${new Date().toLocaleTimeString()}!</p>
        <p>Button type: ${element.type || 'button'}</p>
        <p>Event type: ${event.type}</p>
      `;
    }
  }));
});

// ============================================================================
// EXAMPLE 2: Advanced State Management
// ============================================================================

console.log('🏪 Example 2: Advanced State Management');

document.body.innerHTML += `
  <div class="example-2">
    <h2>Advanced State Management</h2>
    <div id="counter-app">
      <button id="increment">+</button>
      <span id="counter-display">0</span>
      <button id="decrement">-</button>
      <button id="reset">Reset</button>
      <div id="counter-stats"></div>
    </div>
  </div>
`;

// Counter component with advanced state management
watch('#counter-app', async function*() {
  // Initialize state with perfect type safety
  yield* $(setState('count', 0));
  yield* $(setState('totalClicks', 0));
  yield* $(setState('history', [] as number[]));

  // Update display function
  const updateDisplay = async function*() {
    const count = yield* $(getState<number>('count', 0));
    const totalClicks = yield* $(getState<number>('totalClicks', 0));
    const history = yield* $(getState<number[]>('history', []));

    const display = yield* $(query('#counter-display'));
    const stats = yield* $(query('#counter-stats'));

    if (display) {
      display.textContent = count.toString();
      yield* $(style.call(display, {
        fontSize: `${Math.max(16, 16 + Math.abs(count) * 2)}px`,
        color: count > 0 ? 'green' : count < 0 ? 'red' : 'black',
        fontWeight: 'bold'
      }));
    }

    if (stats) {
      stats.innerHTML = `
        <p>Total clicks: ${totalClicks}</p>
        <p>History: [${history.slice(-5).join(', ')}]</p>
        <p>Average: ${history.length ? (history.reduce((a, b) => a + b, 0) / history.length).toFixed(1) : 0}</p>
      `;
    }
  };

  // Increment button
  yield* $(click.call(yield* $(query('#increment')), async () => {
    yield* $(incrementState('count', 1));
    yield* $(incrementState('totalClicks', 1));

    const newCount = yield* $(getState<number>('count'));
    yield* $(updateState('history', (hist: number[]) => [...hist, newCount]));

    yield* updateDisplay();
    yield* $(log('Incremented counter'));
  }));

  // Decrement button
  yield* $(click.call(yield* $(query('#decrement')), async () => {
    yield* $(updateState('count', (current: number) => current - 1));
    yield* $(incrementState('totalClicks', 1));

    const newCount = yield* $(getState<number>('count'));
    yield* $(updateState('history', (hist: number[]) => [...hist, newCount]));

    yield* updateDisplay();
  }));

  // Reset button
  yield* $(click.call(yield* $(query('#reset')), async () => {
    yield* $(setState('count', 0));
    yield* $(setState('history', []));
    yield* updateDisplay();
  }));

  // Initial display update
  yield* updateDisplay();
});

// ============================================================================
// EXAMPLE 3: Form Handling with Validation
// ============================================================================

console.log('📝 Example 3: Form Handling with Validation');

document.body.innerHTML += `
  <div class="example-3">
    <h2>Smart Form with Validation</h2>
    <form id="user-form">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
        <span class="error" id="username-error"></span>
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
        <span class="error" id="email-error"></span>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
        <span class="error" id="password-error"></span>
      </div>
      <button type="submit" id="submit-btn">Submit</button>
      <div id="form-status"></div>
    </form>
  </div>
`;

watch('#user-form', async function*() {
  // Initialize form state
  yield* $(setState('isValid', false));
  yield* $(setState('errors', {} as Record<string, string>));
  yield* $(setState('touched', {} as Record<string, boolean>));

  // Validation rules
  const validateField = async function*(fieldName: string, value: string) {
    const errors = yield* $(getState<Record<string, string>>('errors', {}));

    switch (fieldName) {
      case 'username':
        if (value.length < 3) {
          errors[fieldName] = 'Username must be at least 3 characters';
        } else {
          delete errors[fieldName];
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[fieldName] = 'Please enter a valid email';
        } else {
          delete errors[fieldName];
        }
        break;
      case 'password':
        if (value.length < 6) {
          errors[fieldName] = 'Password must be at least 6 characters';
        } else {
          delete errors[fieldName];
        }
        break;
    }

    yield* $(setState('errors', errors));

    // Update UI
    const errorElement = yield* $(query(`#${fieldName}-error`));
    if (errorElement) {
      errorElement.textContent = errors[fieldName] || '';
      errorElement.style.color = 'red';
    }

    // Update form validity
    const isValid = Object.keys(errors).length === 0;
    yield* $(setState('isValid', isValid));

    const submitBtn = yield* $(query<HTMLButtonElement>('#submit-btn'));
    if (submitBtn) {
      submitBtn.disabled = !isValid;
      yield* $(style.call(submitBtn, {
        opacity: isValid ? '1' : '0.5',
        cursor: isValid ? 'pointer' : 'not-allowed'
      }));
    }
  };

  // Add input validation for each field
  const fields = ['username', 'email', 'password'];
  for (const fieldName of fields) {
    yield* $(input.call(yield* $(query(`#${fieldName}`)), async (event) => {
      const target = event.target as HTMLInputElement;
      yield* $(setState('touched', {
        ...yield* $(getState('touched', {})),
        [fieldName]: true
      }));

      yield* validateField(fieldName, target.value);
    }));
  }

  // Handle form submission
  yield* $(submit(async (event) => {
    event.preventDefault();

    const isValid = yield* $(getState<boolean>('isValid', false));
    const status = yield* $(query('#form-status'));

    if (!isValid) {
      if (status) {
        status.innerHTML = '<p style="color: red;">Please fix the errors above.</p>';
      }
      return;
    }

    // Show loading state
    if (status) {
      status.innerHTML = '<p style="color: blue;">Submitting...</p>';
    }

    // Simulate API call
    yield* $(delay(1000));

    // Show success
    if (status) {
      status.innerHTML = '<p style="color: green;">✅ Form submitted successfully!</p>';
    }

    // Reset form
    yield* $(setState('errors', {}));
    yield* $(setState('touched', {}));

    const form = yield* $(self<HTMLFormElement>());
    form.reset();
  }));
});

// ============================================================================
// EXAMPLE 4: Complex Interactive Component
// ============================================================================

console.log('🎨 Example 4: Complex Interactive Component');

document.body.innerHTML += `
  <div class="example-4">
    <h2>Interactive Todo App Component</h2>
    <div id="todo-app">
      <div class="todo-input">
        <input type="text" id="new-todo" placeholder="Add a new todo...">
        <button id="add-todo">Add</button>
      </div>
      <div class="todo-filters">
        <button class="filter" data-filter="all">All</button>
        <button class="filter" data-filter="active">Active</button>
        <button class="filter" data-filter="completed">Completed</button>
      </div>
      <ul id="todo-list"></ul>
      <div id="todo-stats"></div>
    </div>
  </div>
`;

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

watch('#todo-app', async function*() {
  // Initialize state
  yield* $(setState('todos', [] as Todo[]));
  yield* $(setState('filter', 'all'));
  yield* $(setState('nextId', 1));

  const renderTodos = async function*() {
    const todos = yield* $(getState<Todo[]>('todos', []));
    const filter = yield* $(getState<string>('filter', 'all'));

    const filteredTodos = todos.filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    });

    const todoList = yield* $(query('#todo-list'));
    if (!todoList) return;

    todoList.innerHTML = filteredTodos.map(todo => `
      <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
        <input type="checkbox" class="todo-toggle" ${todo.completed ? 'checked' : ''}>
        <span class="todo-text">${todo.text}</span>
        <button class="todo-delete">×</button>
      </li>
    `).join('');

    // Update stats
    const stats = yield* $(query('#todo-stats'));
    if (stats) {
      const activeCount = todos.filter(t => !t.completed).length;
      const completedCount = todos.filter(t => t.completed).length;
      stats.innerHTML = `
        <p>Total: ${todos.length} | Active: ${activeCount} | Completed: ${completedCount}</p>
      `;
    }
  };

  // Add new todo
  yield* $(click.call(yield* $(query('#add-todo')), async () => {
    const input = yield* $(query<HTMLInputElement>('#new-todo'));
    if (!input || !input.value.trim()) return;

    const todos = yield* $(getState<Todo[]>('todos', []));
    const nextId = yield* $(getState<number>('nextId', 1));

    const newTodo: Todo = {
      id: nextId,
      text: input.value.trim(),
      completed: false,
      createdAt: new Date()
    };

    yield* $(setState('todos', [...todos, newTodo]));
    yield* $(setState('nextId', nextId + 1));

    input.value = '';
    yield* renderTodos();
  }));

  // Handle filter changes
  yield* $(click.call(yield* $(query('.todo-filters')), async (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('filter')) {
      const filter = target.dataset.filter || 'all';
      yield* $(setState('filter', filter));

      // Update active filter button
      const filters = yield* $(queryAll('.filter'));
      filters.forEach(btn => btn.classList.remove('active'));
      target.classList.add('active');

      yield* renderTodos();
    }
  }));

  // Handle todo interactions (toggle and delete)
  yield* $(click.call(yield* $(query('#todo-list')), async (event) => {
    const target = event.target as HTMLElement;
    const todoItem = target.closest('.todo-item') as HTMLElement;
    if (!todoItem) return;

    const todoId = parseInt(todoItem.dataset.id || '0');
    const todos = yield* $(getState<Todo[]>('todos', []));

    if (target.classList.contains('todo-toggle')) {
      // Toggle completion
      const updatedTodos = todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      );
      yield* $(setState('todos', updatedTodos));
      yield* renderTodos();
    } else if (target.classList.contains('todo-delete')) {
      // Delete todo
      const updatedTodos = todos.filter(todo => todo.id !== todoId);
      yield* $(setState('todos', updatedTodos));
      yield* renderTodos();
    }
  }));

  // Initial render
  yield* renderTodos();
});

// ============================================================================
// EXAMPLE 5: Backward Compatibility Demo
// ============================================================================

console.log('🔄 Example 5: Backward Compatibility');

document.body.innerHTML += `
  <div class="example-5">
    <h2>Backward Compatibility</h2>
    <p>This example shows both APIs working together:</p>
    <button id="classic-api-btn">Classic API Button</button>
    <button id="new-api-btn">New API Button</button>
    <div id="compatibility-output"></div>
  </div>
`;

// Classic API (still works!)
watch('#classic-api-btn', function*() {
  // Note: Not using $ here - this is the classic API
  yield addClass('classic-style');
  yield text('Classic API Ready');

  yield click(() => {
    const output = document.querySelector('#compatibility-output');
    if (output) {
      output.innerHTML += '<p>✅ Classic API button clicked!</p>';
    }
  });
});

// New API with $ helper
watch('#new-api-btn', async function*() {
  yield* $(addClass('new-style'));
  yield* $(text('New API Ready'));

  yield* $(click(async () => {
    const output = yield* $(query('#compatibility-output'));
    if (output) {
      output.innerHTML += '<p>🚀 New API button clicked!</p>';
    }

    // Show off the type safety
    const button = yield* $(self<HTMLButtonElement>());
    console.log('Button from new API:', button.textContent);
  }));
});

// ============================================================================
// STYLING AND SETUP
// ============================================================================

// Add some basic styling to make the examples look nice
const style = document.createElement('style');
style.textContent = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    line-height: 1.6;
  }

  .example-1, .example-2, .example-3, .example-4, .example-5 {
    margin: 30px 0;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #f9f9f9;
  }

  h2 {
    color: #333;
    border-bottom: 2px solid #667eea;
    padding-bottom: 10px;
  }

  button {
    background: #667eea;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin: 4px;
    transition: all 0.2s;
  }

  button:hover {
    background: #5a6fd8;
    transform: translateY(-1px);
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
  }

  input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 4px;
  }

  .error {
    color: red;
    font-size: 0.9em;
    margin-left: 8px;
  }

  .todo-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #eee;
  }

  .todo-item.completed .todo-text {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .todo-toggle {
    margin-right: 8px;
  }

  .todo-text {
    flex: 1;
  }

  .todo-delete {
    background: #e74c3c;
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .filter.active {
    background: #27ae60;
  }

  #counter-display {
    display: inline-block;
    min-width: 60px;
    text-align: center;
    margin: 0 10px;
    padding: 8px;
    background: white;
    border: 2px solid #667eea;
    border-radius: 4px;
  }

  .classic-style {
    border: 2px dashed #e74c3c !important;
  }

  .new-style {
    border: 2px solid #27ae60 !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;
document.head.appendChild(style);

console.log('🎉 All examples loaded! Check the page to see the new generator API in action.');
console.log('💡 The new API provides:');
console.log('   - Perfect type safety with the $ helper');
console.log('   - Pure operations for better testing and composition');
console.log('   - Backward compatibility with the classic API');
console.log('   - Enhanced developer experience with TypeScript');
