/**
 * Enhanced Event Handling v2 Demo
 * Showcases the redesigned, generator-first event handling
 */

import { 
  watch, 
  createState, 
  setState, 
  getState, 
  addClass, 
  removeClass, 
  text, 
  style,
  delay,
  self,
  all,
  cleanup
} from '../src/index';

import { 
  on, 
  click, 
  input,
  composeEventHandlers,
  createEventBehavior,
  delegate
} from '../src/index';

/**
 * 1. Generator Event Handlers with Full Context Access
 */
watch('.interactive-button', function* () {
  yield click(function* (event) {
    // Full access to Watch context!
    const button = self();
    const allButtons = all('.interactive-button');
    
    // Can yield other Watch functions seamlessly
    yield addClass('clicked');
    yield style({ transform: 'scale(0.95)' });
    
    // Async operations with yield
    yield delay(150);
    
    // State management works naturally
    const clickCount = getState('clicks') || 0;
    setState('clicks', clickCount + 1);
    
    yield removeClass('clicked');
    yield style({ transform: 'scale(1)' });
    yield text(`Clicked ${clickCount + 1} times`);
    
    // Can register cleanup for this specific click
    cleanup(() => {
      console.log('Click handler cleaned up');
    });
  });
});

/**
 * 2. Async Operations Made Simple
 */
watch('.data-loader', function* () {
  yield click(async function* (event) {
    const button = self();
    
    yield addClass('loading');
    yield text('Loading...');
    
    try {
      // Async operation
      const response = await fetch('/api/data');
      const data = await response.json();
      
      yield removeClass('loading');
      yield addClass('success');
      yield text(`Loaded: ${data.name}`);
      
      // Auto-reset after delay
      yield delay(2000);
      yield removeClass('success');
      yield text('Load Data');
      
    } catch (error) {
      yield removeClass('loading');
      yield addClass('error');
      yield text('Failed to load');
      
      yield delay(2000);
      yield removeClass('error');
      yield text('Load Data');
    }
  });
});

/**
 * 3. Complex Interactive Components
 */
watch('.hover-card', function* () {
  // Mouse enter with nested event handling
  yield on('mouseenter', function* (event) {
    yield addClass('hovered');
    yield style({
      transform: 'translateY(-5px)',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    });
    
    // Set up temporary mouse leave handler
    yield on('mouseleave', function* () {
      yield removeClass('hovered');
      yield style({
        transform: 'translateY(0)',
        boxShadow: 'none'
      });
    }, { once: true });
  });
  
  // Click to toggle expanded state
  yield click(function* (event) {
    const isExpanded = getState('expanded') || false;
    setState('expanded', !isExpanded);
    
    if (!isExpanded) {
      yield addClass('expanded');
      yield style({ height: '200px' });
    } else {
      yield removeClass('expanded');
      yield style({ height: '100px' });
    }
  });
});

/**
 * 4. Form Handling with Validation
 */
watch('.smart-form', function* () {
  // Real-time validation with debouncing
  yield input(function* (event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    
    // Validation logic
    const isValid = value.length >= 3;
    const errorMsg = all('.error-message')[0];
    
    if (isValid) {
      yield removeClass('invalid');
      yield addClass('valid');
      if (errorMsg) yield text(errorMsg, '');
    } else {
      yield removeClass('valid');
      yield addClass('invalid');
      if (errorMsg) yield text(errorMsg, 'Minimum 3 characters required');
    }
    
    // Update form state
    setState('formValid', isValid);
  }, { 
    debounce: 300,
    delegate: 'input[required]'
  });
  
  // Submit handling
  yield on('submit', function* (event) {
    event.preventDefault();
    
    const isFormValid = getState('formValid');
    
    if (isFormValid) {
      yield addClass('submitting');
      yield text('.submit-btn', 'Submitting...');
      
      // Simulate API call
      yield delay(1000);
      
      yield removeClass('submitting');
      yield addClass('success');
      yield text('.submit-btn', 'Success!');
      
      yield delay(2000);
      yield removeClass('success');
      yield text('.submit-btn', 'Submit');
    } else {
      yield addClass('shake');
      yield delay(500);
      yield removeClass('shake');
    }
  });
});

/**
 * 5. Event Composition and Reusability
 */

// Create reusable behaviors
const clickRippleEffect = createEventBehavior('click', function* (event) {
  const clickX = (event as MouseEvent).clientX;
  const clickY = (event as MouseEvent).clientY;
  const rect = self().getBoundingClientRect();
  
  // Create ripple element
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.left = `${clickX - rect.left}px`;
  ripple.style.top = `${clickY - rect.top}px`;
  
  self().appendChild(ripple);
  
  yield delay(600);
  ripple.remove();
});

const hoverGlow = createEventBehavior('mouseenter', function* (event) {
  yield addClass('glow');
  
  yield on('mouseleave', function* () {
    yield removeClass('glow');
  }, { once: true });
});

// Compose multiple behaviors
const materialButton = composeEventHandlers(
  clickRippleEffect,
  hoverGlow,
  function* (event) {
    // Additional click behavior
    yield addClass('active');
    yield delay(100);
    yield removeClass('active');
  }
);

// Apply composed behavior
watch('.material-button', function* () {
  yield click(materialButton);
});

/**
 * 6. Advanced Delegation and Filtering
 */
watch('.todo-list', function* () {
  // Delete button clicks with delegation
  yield delegate('.delete-btn', 'click', function* (event) {
    const todoItem = self().closest('.todo-item');
    if (todoItem) {
      yield addClass(todoItem, 'removing');
      yield delay(300);
      todoItem.remove();
    }
  });
  
  // Toggle completion
  yield delegate('.todo-checkbox', 'change', function* (event) {
    const checkbox = event.target as HTMLInputElement;
    const todoItem = checkbox.closest('.todo-item');
    
    if (todoItem) {
      if (checkbox.checked) {
        yield addClass(todoItem, 'completed');
      } else {
        yield removeClass(todoItem, 'completed');
      }
    }
  });
  
  // Edit on double-click
  yield delegate('.todo-text', 'dblclick', function* (event) {
    const textElement = self();
    const currentText = textElement.textContent || '';
    
    // Create inline editor
    const input = document.createElement('input');
    input.value = currentText;
    input.className = 'inline-editor';
    
    textElement.replaceWith(input);
    input.focus();
    input.select();
    
    // Save on enter or blur
    const saveEdit = function* () {
      const newText = input.value.trim();
      if (newText) {
        textElement.textContent = newText;
      }
      input.replaceWith(textElement);
    };
    
    yield on('keydown', function* (event) {
      if ((event as KeyboardEvent).key === 'Enter') {
        yield* saveEdit();
      }
    }, { once: true });
    
    yield on('blur', saveEdit, { once: true });
  });
});

/**
 * 7. Real-time Features with WebSocket Integration
 */
watch('.chat-interface', function* () {
  // Set up WebSocket connection (simplified)
  const ws = new WebSocket('ws://localhost:8080/chat');
  
  cleanup(() => ws.close());
  
  // Send message on enter
  yield on('keydown', function* (event) {
    if ((event as KeyboardEvent).key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      const input = self() as HTMLInputElement;
      const message = input.value.trim();
      
      if (message) {
        // Send to server
        ws.send(JSON.stringify({ type: 'message', content: message }));
        
        // Clear input
        input.value = '';
        
        // Add to local chat
        const chatArea = all('.chat-messages')[0];
        if (chatArea) {
          const messageEl = document.createElement('div');
          messageEl.className = 'message sent';
          messageEl.textContent = message;
          chatArea.appendChild(messageEl);
          chatArea.scrollTop = chatArea.scrollHeight;
        }
      }
    }
  }, { delegate: '.message-input' });
  
  // Handle incoming messages
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
      const chatArea = all('.chat-messages')[0];
      if (chatArea) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message received';
        messageEl.textContent = data.content;
        chatArea.appendChild(messageEl);
        chatArea.scrollTop = chatArea.scrollHeight;
      }
    }
  };
});

/**
 * 8. Performance-Optimized Scroll Handling
 */
watch('.infinite-scroll', function* () {
  let loading = false;
  
  yield on('scroll', function* (event) {
    if (loading) return;
    
    const container = self();
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Load more when near bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loading = true;
      
      yield addClass('loading-more');
      yield text('.load-indicator', 'Loading more...');
      
      // Simulate API call
      yield delay(1000);
      
      // Add new content (simplified)
      for (let i = 0; i < 10; i++) {
        const item = document.createElement('div');
        item.className = 'scroll-item';
        item.textContent = `Item ${Date.now() + i}`;
        container.appendChild(item);
      }
      
      yield removeClass('loading-more');
      yield text('.load-indicator', '');
      
      loading = false;
    }
  }, { 
    throttle: 100 // Throttle scroll events
  });
});
