/**
 * Enhanced Event Handling Demo
 * Demonstrates all the new event handling features in action
 */

import { 
  watch, 
  on, 
  createCustomEvent, 
  click,
  type CustomEventHandler,
  type WatchEventListenerOptions 
} from '../src/index';

// 1. Type-safe CustomEvent creation and handling
interface UserLoginEvent {
  userId: number;
  username: string;
  timestamp: Date;
}

const userLoginEvent = createCustomEvent<UserLoginEvent>('user:login', {
  userId: 123,
  username: 'john_doe',
  timestamp: new Date()
});

// 2. Dashboard with CustomEvent handling
watch('.dashboard', function* () {
  // TypeScript automatically infers the detail type
  yield on(userLoginEvent, (event, dashboard) => {
    // ✅ Full type safety - TypeScript knows about userId, username, timestamp
    console.log(`User ${event.detail.username} logged in at ${event.detail.timestamp}`);
    console.log(`User ID: ${event.detail.userId}`); // Type-safe access
    
    dashboard.querySelector('.welcome-message')!.textContent = 
      `Welcome, ${event.detail.username}!`;
  });
  
  // Handle string-based custom events with typed detail
  yield on('notification:show', (event: CustomEvent<{ message: string; type: 'info' | 'error' }>, dashboard) => {
    const { message, type } = event.detail;
    console.log(`${type.toUpperCase()}: ${message}`);
  });
});

// 3. Advanced list with delegation, debouncing, and filtering
watch('.advanced-list', function* () {
  // Event delegation with filtering
  yield on('click', (event, listItem) => {
    // listItem is the matched .list-item, not .advanced-list
    console.log('Item clicked:', listItem.textContent);
    listItem.classList.toggle('selected');
  }, {
    delegate: '.list-item',
    filter: (event, element) => {
      // Only handle clicks if not disabled
      return !element.classList.contains('disabled');
    }
  } as WatchEventListenerOptions);
  
  // Debounced search
  yield on('input', (event, searchInput) => {
    const query = (event.target as HTMLInputElement).value;
    performSearch(query);
  }, {
    delegate: '.search-input',
    debounce: 300
  });
  
  // Throttled scroll handling
  yield on('scroll', (event, list) => {
    updateScrollIndicator(list.scrollTop, list.scrollHeight);
  }, {
    throttle: 16 // 60fps
  });
});

// 4. AbortSignal integration
const abortController = new AbortController();

watch('.temporary-element', function* () {
  yield on('click', (event, element) => {
    console.log('Temporary element clicked');
  }, {
    signal: abortController.signal
  });
  
  yield on('mouseenter', (event, element) => {
    element.style.backgroundColor = 'lightblue';
  }, {
    signal: abortController.signal
  });
});

// Simulate cleanup after 5 seconds
setTimeout(() => {
  abortController.abort(); // All listeners are automatically removed
  console.log('Temporary listeners removed');
}, 5000);

// 5. Form with comprehensive validation and event options
watch('form.enhanced-form', function* () {
  // Immediate validation with debouncing
  yield on('input', (event, input) => {
    validateField(input);
  }, {
    delegate: 'input, textarea',
    debounce: 200,
    filter: (event, element) => {
      // Only validate if the field has been touched
      return element.dataset.touched === 'true';
    }
  });
  
  // Mark fields as touched on blur
  yield on('blur', (event, field) => {
    field.dataset.touched = 'true';
    validateField(field);
  }, {
    delegate: 'input, textarea'
  });
  
  // Enhanced submit handling
  yield on('submit', (event, form) => {
    event.preventDefault();
    
    if (isFormValid(form)) {
      submitForm(form);
    } else {
      showValidationErrors(form);
    }
  }, {
    filter: (event) => !event.defaultPrevented
  });
});

// 6. Real-time chat with custom events
interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
}

watch('.chat-container', function* () {
  // Listen for typed chat messages
  yield on('chat:message', (event: CustomEvent<ChatMessage>, container) => {
    const { user, message, timestamp } = event.detail;
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
      <span class="user">${user}:</span>
      <span class="message">${message}</span>
      <span class="timestamp">${timestamp.toLocaleTimeString()}</span>
    `;
    container.appendChild(messageElement);
    container.scrollTop = container.scrollHeight;
  });
  
  // Typing indicators with throttling
  yield on('input', (event, input) => {
    // Emit typing event
    const typingEvent = createCustomEvent('chat:typing', {
      user: getCurrentUser(),
      typing: true
    });
    document.dispatchEvent(typingEvent);
  }, {
    delegate: '.chat-input',
    throttle: 500
  });
});

// 7. Advanced button with all options combined
watch('.super-button', function* () {
  yield click((event, button) => {
    console.log('Super button clicked with advanced options!');
    button.classList.add('clicked');
    
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
  }, {
    debounce: 100,        // Prevent rapid clicking
    filter: (event) => {   // Only handle left clicks
      return event.button === 0;
    },
    once: false,          // Allow multiple clicks
    passive: false,       // Allow preventDefault
    capture: false        // Use bubbling phase
  });
});

// Helper functions
function performSearch(query: string): void {
  console.log(`Searching for: ${query}`);
  // Implement search logic
}

function updateScrollIndicator(scrollTop: number, scrollHeight: number): void {
  const percentage = (scrollTop / (scrollHeight - window.innerHeight)) * 100;
  console.log(`Scroll: ${percentage.toFixed(1)}%`);
}

function validateField(field: HTMLInputElement | HTMLTextAreaElement): boolean {
  // Implement validation logic
  const isValid = field.value.length > 0;
  field.classList.toggle('invalid', !isValid);
  return isValid;
}

function isFormValid(form: HTMLFormElement): boolean {
  return Array.from(form.querySelectorAll('input, textarea'))
    .every(field => validateField(field as HTMLInputElement));
}

function submitForm(form: HTMLFormElement): void {
  console.log('Submitting form...', new FormData(form));
}

function showValidationErrors(form: HTMLFormElement): void {
  console.log('Form has validation errors');
}

function getCurrentUser(): string {
  return 'current_user';
}

// 8. Export event for external use
export { userLoginEvent };
