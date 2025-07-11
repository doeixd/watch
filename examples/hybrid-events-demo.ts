/**
 * Hybrid Event Handling Demo
 * Shows how the new design works seamlessly in all contexts
 */

import { watch, self, getState, setState, addClass, removeClass, text, delay } from '../src/index';
import { on, click, input, createCustomEvent, delegate, composeEventHandlers } from '../src/api/events-hybrid';

/**
 * 1. Standalone Usage (No Generators) - Current Ergonomics Preserved
 */

// Direct DOM element usage - works exactly like before
const button = document.querySelector('#standalone-button') as HTMLButtonElement;

// ✅ Regular function with element parameter (backward compatible)
const cleanup1 = on(button, 'click', (event, element) => {
  console.log('Clicked!', element.textContent);
  element.classList.toggle('clicked');
});

// ✅ Enhanced options work in standalone mode
const cleanup2 = on(button, 'input', (event, element) => {
  console.log('Input changed:', (event.target as HTMLInputElement).value);
}, {
  debounce: 300,
  filter: (event, element) => (event.target as HTMLInputElement).value.length > 2
});

// ✅ CustomEvent in standalone mode
const userEvent = createCustomEvent('user:action', { userId: 123, action: 'click' });
const cleanup3 = on(button, userEvent, (event, element) => {
  console.log(`User ${event.detail.userId} performed ${event.detail.action}`);
  // TypeScript knows event.detail has userId and action!
});

// ✅ Delegation in standalone mode
const cleanup4 = on(document.body, 'click', (event, delegatedElement) => {
  console.log('Button clicked via delegation:', delegatedElement.textContent);
}, {
  delegate: '.delegated-button'
});

/**
 * 2. Generator Usage with Regular Functions - Enhanced Context
 */
watch('.context-enhanced-button', function* () {
  // ✅ Regular function but with automatic context enhancement
  yield on('click', (event) => {
    // No element parameter needed - context is automatically available!
    const button = self();
    const clickCount = getState('clicks') || 0;
    
    setState('clicks', clickCount + 1);
    button.textContent = `Clicked ${clickCount + 1} times`;
    
    console.log('Enhanced context click!', { clickCount: clickCount + 1 });
  });
  
  // ✅ Enhanced options work the same way
  yield input((event) => {
    const input = self() as HTMLInputElement;
    const query = input.value;
    
    // Can access state, other elements, etc.
    setState('searchQuery', query);
    console.log('Search query:', query);
  }, {
    debounce: 300,
    filter: (event) => (event.target as HTMLInputElement).value.length > 0
  });
});

/**
 * 3. Generator Usage with Generator Functions - Full Power
 */
watch('.generator-button', function* () {
  // ✅ Generator function with full Watch capabilities
  yield click(function* (event) {
    const button = self();
    const count = getState('clicks') || 0;
    
    // Can yield Watch functions!
    yield addClass('clicking');
    yield text(`Clicking... ${count + 1}`);
    
    // Async operations with yield
    yield delay(200);
    
    yield removeClass('clicking');
    yield addClass('clicked');
    yield text(`Clicked ${count + 1} times!`);
    
    setState('clicks', count + 1);
    
    // Auto-reset after delay
    yield delay(1000);
    yield removeClass('clicked');
    yield text('Click me again!');
  });
  
  // ✅ Async generator with error handling
  yield on('dblclick', async function* (event) {
    yield addClass('loading');
    yield text('Loading...');
    
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      
      yield removeClass('loading');
      yield addClass('success');
      yield text(`Loaded: ${data.message}`);
    } catch (error) {
      yield removeClass('loading');
      yield addClass('error');
      yield text('Failed to load!');
    }
    
    yield delay(2000);
    yield removeClass('success', 'error');
    yield text('Double-click to load');
  });
});

/**
 * 4. Mixed Usage - All Patterns Together
 */
watch('.mixed-form', function* () {
  // Regular function with context (simple validation)
  yield input((event) => {
    const input = self() as HTMLInputElement;
    const isValid = input.value.length >= 3;
    
    setState('isValid', isValid);
    input.classList.toggle('invalid', !isValid);
  }, { 
    delegate: 'input[required]',
    debounce: 200 
  });
  
  // Generator function for complex submit handling
  yield on('submit', function* (event) {
    event.preventDefault();
    
    const form = self() as HTMLFormElement;
    const isValid = getState('isValid');
    
    if (!isValid) {
      yield addClass('shake');
      yield delay(500);
      yield removeClass('shake');
      return;
    }
    
    yield addClass('submitting');
    
    const submitBtn = form.querySelector('.submit-btn');
    if (submitBtn) {
      yield text(submitBtn, 'Submitting...');
    }
    
    try {
      const formData = new FormData(form);
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        yield removeClass('submitting');
        yield addClass('success');
        if (submitBtn) yield text(submitBtn, 'Success!');
        
        yield delay(2000);
        form.reset();
        setState('isValid', false);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      yield removeClass('submitting');
      yield addClass('error');
      if (submitBtn) yield text(submitBtn, 'Error! Try again');
      
      yield delay(2000);
    }
    
    yield removeClass('success', 'error');
    if (submitBtn) yield text(submitBtn, 'Submit');
  });
});

/**
 * 5. CustomEvent Integration - All Modes
 */

// Type-safe custom events
interface NotificationEvent {
  message: string;
  type: 'info' | 'warning' | 'error';
  duration?: number;
}

const notificationEvent = createCustomEvent<NotificationEvent>('app:notification', {
  message: 'Hello from custom event!',
  type: 'info',
  duration: 3000
});

// Standalone listener
const notificationCleanup = on(document, notificationEvent, (event, element) => {
  // TypeScript knows the exact type of event.detail
  console.log(`${event.detail.type.toUpperCase()}: ${event.detail.message}`);
  
  // Create notification UI
  const notification = document.createElement('div');
  notification.className = `notification ${event.detail.type}`;
  notification.textContent = event.detail.message;
  document.body.appendChild(notification);
  
  // Auto-remove after duration
  setTimeout(() => {
    notification.remove();
  }, event.detail.duration || 3000);
});

// Generator listener with full context
watch('.notification-trigger', function* () {
  yield click(function* (event) {
    // Dispatch the typed custom event
    const customEvent = createCustomEvent<NotificationEvent>('app:notification', {
      message: `Button "${self().textContent}" was clicked!`,
      type: 'info',
      duration: 2000
    });
    
    document.dispatchEvent(customEvent);
    
    yield addClass('triggered');
    yield delay(100);
    yield removeClass('triggered');
  });
});

/**
 * 6. Event Composition - Reusable Behaviors
 */

// Create reusable behaviors that work in all modes
const rippleEffect = function* (event: MouseEvent) {
  const button = self();
  const rect = button.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  
  button.appendChild(ripple);
  
  yield delay(600);
  ripple.remove();
};

const clickAnalytics = function* (event: MouseEvent) {
  const button = self();
  console.log('Analytics: Button clicked', {
    id: button.id,
    text: button.textContent,
    timestamp: Date.now()
  });
};

const hoverEffect = function* (event: MouseEvent) {
  yield addClass('hovered');
  
  // Set up temporary mouse leave handler
  yield on('mouseleave', function* () {
    yield removeClass('hovered');
  }, { once: true });
};

// Compose behaviors
const materialButton = composeEventHandlers(rippleEffect, clickAnalytics);

// Apply to buttons
watch('.material-button', function* () {
  yield click(materialButton);
  yield on('mouseenter', hoverEffect);
});

// Can also be used standalone
const standaloneButton = document.querySelector('.standalone-material') as HTMLButtonElement;
if (standaloneButton) {
  // Even composed behaviors work standalone!
  on(standaloneButton, 'click', materialButton);
}

/**
 * 7. Delegation Helper - All Modes
 */

// Standalone delegation
const delegatedCleanup = delegate('.item', 'click', (event, item) => {
  console.log('Item clicked:', item.textContent);
  item.classList.toggle('selected');
});

// Apply to container
const container = document.querySelector('.item-container');
if (container) {
  delegatedCleanup(container);
}

// Generator delegation
watch('.todo-list', function* () {
  // Delete buttons
  yield delegate('.delete-btn', 'click', function* (event) {
    const deleteBtn = self();
    const todoItem = deleteBtn.closest('.todo-item');
    
    if (todoItem) {
      yield addClass(todoItem, 'removing');
      yield delay(300);
      todoItem.remove();
    }
  });
  
  // Toggle completion
  yield delegate('.todo-checkbox', 'change', function* (event) {
    const checkbox = self() as HTMLInputElement;
    const todoItem = checkbox.closest('.todo-item');
    
    if (todoItem) {
      if (checkbox.checked) {
        yield addClass(todoItem, 'completed');
      } else {
        yield removeClass(todoItem, 'completed');
      }
    }
  });
});

/**
 * 8. AbortSignal Integration - All Modes
 */

// Standalone with AbortSignal
const abortController = new AbortController();

on(document.querySelector('.temporary-btn'), 'click', (event, btn) => {
  console.log('Temporary button clicked');
}, {
  signal: abortController.signal
});

// Generator with AbortSignal
watch('.temporary-generator', function* () {
  yield click((event) => {
    console.log('Temporary generator click');
  }, {
    signal: abortController.signal
  });
});

// Auto-cleanup after 5 seconds
setTimeout(() => {
  abortController.abort();
  console.log('All temporary listeners removed');
}, 5000);

/**
 * 9. Performance Features - All Modes
 */

// Standalone with performance features
on(window, 'scroll', (event) => {
  console.log('Throttled scroll:', window.scrollY);
}, {
  throttle: 16 // 60fps
});

on(document.querySelector('.search-input'), 'input', (event, input) => {
  console.log('Debounced search:', (input as HTMLInputElement).value);
}, {
  debounce: 300
});

// Generator with performance features
watch('.infinite-scroll', function* () {
  yield on('scroll', function* (event) {
    const container = self();
    const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
    
    if (isNearBottom) {
      yield addClass('loading-more');
      // Load more content...
      yield delay(1000);
      yield removeClass('loading-more');
    }
  }, {
    throttle: 100
  });
});

// Export cleanup functions for demo purposes
export {
  cleanup1,
  cleanup2,
  cleanup3,
  cleanup4,
  notificationEvent,
  abortController
};
