/**
 * Sync Generator Demo
 *
 * This file demonstrates the use of sync generators with the yield* pattern
 * in the watch-selector library.
 */

import { watch } from '../src/watch';
import {
  text,
  html,
  addClass,
  removeClass,
  toggleClass,
  style,
  attr,
  click,
  input,
  setState,
  getState,
  updateState,
} from '../src/api';

// Example 1: Basic sync generator with yield*
watch('button.counter', function* () {
  // Initialize state
  yield* setState('count', 0);

  // Set initial text
  yield* text('Click me: 0');

  // Add click handler with sync generator
  yield* click(function* () {
    // Update count
    yield* updateState<number>('count', (c = 0) => c + 1);

    // Get the new count
    const count = yield* getState<number>('count', 0);

    // Update text
    yield* text(`Click me: ${count}`);

    // Add visual feedback
    yield* addClass('clicked');

    // Remove class after animation
    setTimeout(() => {
      // This would need to be in a generator context
      // Just for demo purposes
    }, 200);
  });
});

// Example 2: Form handling with sync generators
watch('form.signup', function* () {
  // Style the form
  yield* style({
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px'
  });

  // Handle form submission
  yield* submit(function* (event) {
    event.preventDefault();

    // Show loading state
    yield* addClass('loading');
    yield* attr('aria-busy', 'true');

    // Get form values (would need form element access)
    // const email = yield* value('#email');
    // const password = yield* value('#password');

    // Simulate API call
    setTimeout(() => {
      // In real app, this would be async
      console.log('Form submitted');
    }, 1000);
  });
});

// Example 3: Interactive list with state management
watch('.todo-item', function* () {
  // Initialize item state
  yield* setState('completed', false);

  // Style based on state
  const isCompleted = yield* getState<boolean>('completed', false);
  if (isCompleted) {
    yield* addClass('completed');
    yield* style('textDecoration', 'line-through');
  }

  // Toggle on click
  yield* click(function* () {
    // Toggle completed state
    const wasCompleted = yield* getState<boolean>('completed', false);
    yield* setState('completed', !wasCompleted);

    // Update appearance
    if (!wasCompleted) {
      yield* addClass('completed');
      yield* style('textDecoration', 'line-through');
    } else {
      yield* removeClass('completed');
      yield* style('textDecoration', 'none');
    }
  });
});

// Example 4: Dynamic content with observers
watch('.lazy-image', function* () {
  // Set placeholder
  yield* attr('src', 'placeholder.jpg');
  yield* addClass('loading');

  // Load real image when visible
  yield* onVisible(function* () {
    const realSrc = yield* attr('data-src');
    if (realSrc) {
      yield* attr('src', realSrc);
      yield* removeClass('loading');
      yield* addClass('loaded');
    }
  });
});

// Example 5: Complex interaction with multiple states
watch('.accordion-item', function* () {
  // Initialize states
  yield* setState('expanded', false);
  yield* setState('animating', false);

  // Find child elements
  const header = yield* query('.accordion-header');
  const content = yield* query('.accordion-content');

  if (!header || !content) return;

  // Initial state
  yield* style(content, 'display', 'none');

  // Handle header clicks
  yield* click(header, function* () {
    // Check if animating
    const isAnimating = yield* getState<boolean>('animating', false);
    if (isAnimating) return;

    // Set animating state
    yield* setState('animating', true);

    // Toggle expanded state
    const wasExpanded = yield* getState<boolean>('expanded', false);
    const nowExpanded = !wasExpanded;
    yield* setState('expanded', nowExpanded);

    // Update UI
    if (nowExpanded) {
      yield* addClass(header, 'expanded');
      yield* style(content, 'display', 'block');
      yield* addClass(content, 'slide-down');
    } else {
      yield* removeClass(header, 'expanded');
      yield* addClass(content, 'slide-up');

      // Hide after animation
      setTimeout(() => {
        // Would need generator context
        // style(content, 'display', 'none');
      }, 300);
    }

    // Clear animating state
    setTimeout(() => {
      // setState('animating', false);
    }, 300);
  });
});

// Example 6: Using branded types for better type safety
import { selector, className } from '../src/utils/selector-types';

// Create branded types
const buttonSelector = selector('button.primary');
const activeClass = className('active');

// Use with DOM functions
watch(buttonSelector, function* () {
  yield* addClass(activeClass);

  yield* click(function* () {
    yield* toggleClass(activeClass);
  });
});

// Example 7: Computed state and watchers
watch('.calculator', function* () {
  // Set up initial values
  yield* setState('a', 0);
  yield* setState('b', 0);

  // Watch for changes to inputs
  yield* input('#input-a', function* (event) {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    yield* setState('a', value);
  });

  yield* input('#input-b', function* (event) {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    yield* setState('b', value);
  });

  // Compute and display sum whenever inputs change
  yield* watchState<number>('a', function* (newA) {
    const b = yield* getState<number>('b', 0);
    const sum = (newA || 0) + b;
    yield* text('#result', `Sum: ${sum}`);
  });

  yield* watchState<number>('b', function* (newB) {
    const a = yield* getState<number>('a', 0);
    const sum = a + (newB || 0);
    yield* text('#result', `Sum: ${sum}`);
  });
});

// Example 8: Event handling with options
watch('.debounced-input', function* () {
  // Input with debounce
  yield* input(function* (event) {
    const value = (event.target as HTMLInputElement).value;
    yield* text('.output', `Searching for: ${value}`);
  }, { debounce: 500 });

  // Click with once option
  yield* click(function* () {
    yield* text('.message', 'This only happens once!');
  }, { once: true });

  // Prevent default and stop propagation
  yield* click(function* () {
    yield* text('.status', 'Link clicked but not followed');
  }, { preventDefault: true, stopPropagation: true });
});

// Example 9: Lifecycle events
watch('.lifecycle-demo', function* () {
  // On mount
  yield* onMount(function* () {
    yield* addClass('mounted');
    yield* text('Component mounted!');
  });

  // On unmount (cleanup)
  const cleanup = yield* onUnmount(function* () {
    console.log('Component unmounting...');
    // Cleanup code here
  });

  // Resize observer
  yield* onResize(function* (event) {
    const { contentRect } = event.detail;
    yield* text(`.size`, `Size: ${contentRect.width}x${contentRect.height}`);
  }, { debounce: 100 });
});

// Example 10: Custom events
watch('.custom-event-demo', function* () {
  // Listen for custom events
  yield* on('user-action', function* (event: CustomEvent) {
    const { action, data } = event.detail;
    yield* text('.action-log', `Action: ${action}, Data: ${JSON.stringify(data)}`);
  });

  // Emit custom events
  yield* click('.trigger', function* () {
    yield* emit('user-action', {
      action: 'button-click',
      data: { timestamp: Date.now() }
    });
  });
});

// Example 11: Persisted state
watch('.settings-panel', function* () {
  // Restore state from localStorage
  const theme = yield* restoreState<string>('theme', 'theme-preference', 'light');

  // Apply theme
  yield* addClass(`theme-${theme}`);

  // Handle theme toggle
  yield* click('.theme-toggle', function* () {
    const currentTheme = yield* getState<string>('theme', 'light');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    // Update state
    yield* setState('theme', newTheme);

    // Persist to localStorage
    yield* persistState('theme', 'theme-preference');

    // Update UI
    yield* removeClass(`theme-${currentTheme}`);
    yield* addClass(`theme-${newTheme}`);
  });
});

// Export for testing
export default {
  message: 'Sync generator demo loaded'
};
