// Integration test for scoped watch with all library primitives

import { 
  scopedWatch, 
  scopedWatchBatch, 
  scopedWatchOnce,
  // Context primitives
  self, el, all, ctx, cleanup,
  // DOM functions
  text, addClass, removeClass, style, attr,
  // Event functions
  onClick, onInput, onFocus,
  // State functions
  createState, setState, getState,
  // Execution helpers
  delay, debounce, throttle, once,
  // Generator utilities
  gen, watchGenerator
} from '../src/index';

// Test 1: Basic integration with context primitives
function testContextIntegration() {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  
  const watcher = scopedWatch(container, 'button', function* () {
    // Context primitives should work
    const element = yield* self();
    const allButtons = yield* all('button');
    const parentContext = yield* ctx();
    
    // DOM functions should work
    yield addClass('scoped-button');
    yield text('Scoped Button');
    yield style({ color: 'red' });
    yield attr('data-scoped', 'true');
    
    // Event functions should work  
    yield onClick(function* () {
      yield text('Clicked!');
    });
    
    // State should work
    const buttonState = yield* createState('clicked', false);
    yield onClick(function* () {
      yield* setState('clicked', true);
      const isClicked = yield* getState('clicked');
      yield text(isClicked ? 'Clicked!' : 'Not clicked');
    });
    
    // Execution helpers should work
    yield onClick(debounce(function* () {
      yield text('Debounced click');
    }, 300));
    
    // Generator utilities should work
    yield* gen(function* () {
      yield addClass('nested-generator');
    });
  });
  
  // Add test button
  const button = document.createElement('button');
  button.textContent = 'Test Button';
  container.appendChild(button);
  
  return watcher;
}

// Test 2: Complex integration with async generators
function testAsyncIntegration() {
  const container = document.createElement('div');
  container.id = 'async-container';
  document.body.appendChild(container);
  
  const watcher = scopedWatch(container, '.async-item', async function* () {
    // Async operations should work
    yield* delay(100);
    
    const element = yield* self();
    yield addClass('processing');
    
    // Simulate async data loading
    yield* delay(200);
    
    // Mock API call
    const mockData = await new Promise(resolve => 
      setTimeout(() => resolve({ id: 1, name: 'Test' }), 100)
    );
    
    yield text(`Loaded: ${(mockData as any).name}`);
    yield removeClass('processing');
    yield addClass('loaded');
    
    // Event handling in async context
    yield onClick(async function* () {
      yield addClass('async-clicked');
      yield* delay(500);
      yield removeClass('async-clicked');
    });
  });
  
  return watcher;
}

// Test 3: Batch watching with different configurations
function testBatchIntegration() {
  const dashboard = document.createElement('div');
  dashboard.id = 'dashboard';
  document.body.appendChild(dashboard);
  
  const watchers = scopedWatchBatch(dashboard, [
    {
      selector: '.chart',
      generator: function* () {
        yield addClass('chart-initialized');
        yield* createState('chartData', []);
        
        yield onClick(function* () {
          const data = yield* getState('chartData');
          yield* setState('chartData', [...data, Date.now()]);
        });
      }
    },
    {
      selector: '.widget',
      generator: function* () {
        yield addClass('widget-ready');
        
        // Setup widget-specific state
        yield* createState('widgetConfig', { theme: 'dark' });
        
        yield onFocus(function* () {
          yield addClass('widget-focused');
        });
      },
      options: {
        attributes: true,
        attributeFilter: ['data-widget-type']
      }
    },
    {
      selector: 'input[type="text"]',
      generator: function* () {
        yield addClass('text-input-enhanced');
        
        yield onInput(debounce(function* () {
          const element = yield* self();
          const value = (element as HTMLInputElement).value;
          yield attr('data-last-value', value);
        }, 300));
      }
    }
  ]);
  
  return watchers;
}

// Test 4: Matcher function integration
function testMatcherIntegration() {
  const container = document.createElement('div');
  container.id = 'matcher-container';
  document.body.appendChild(container);
  
  // Custom matcher for submit buttons
  const submitButtonMatcher = (el: HTMLElement): el is HTMLButtonElement => {
    return el.tagName === 'BUTTON' && 
           el.getAttribute('type') === 'submit' && 
           el.dataset.important === 'true';
  };
  
  const watcher = scopedWatch(container, submitButtonMatcher, function* () {
    yield addClass('important-submit');
    yield style({ 
      backgroundColor: 'red', 
      color: 'white',
      fontWeight: 'bold' 
    });
    
    yield onClick(function* () {
      yield text('Important submit clicked!');
      
      // Validation logic
      const form = yield* el('form');
      if (form) {
        yield addClass('submitting');
        yield* delay(1000);
        yield removeClass('submitting');
      }
    });
  });
  
  return watcher;
}

// Test 5: Cleanup and lifecycle integration
function testCleanupIntegration() {
  const container = document.createElement('div');
  container.id = 'cleanup-container';
  document.body.appendChild(container);
  
  const watcher = scopedWatch(container, '.cleanup-item', function* () {
    yield addClass('initialized');
    
    // Register cleanup
    yield cleanup(() => {
      console.log('Cleaning up scoped element');
    });
    
    // Setup interval that needs cleanup
    const intervalId = setInterval(() => {
      console.log('Interval tick');
    }, 1000);
    
    yield cleanup(() => {
      clearInterval(intervalId);
    });
    
    // Event listeners that need cleanup
    yield onClick(function* () {
      yield text('Will be cleaned up');
    });
  });
  
  return watcher;
}

// Run all tests
export function runIntegrationTests() {
  console.log('Running scoped watch integration tests...');
  
  const tests = [
    testContextIntegration,
    testAsyncIntegration,
    testBatchIntegration,
    testMatcherIntegration,
    testCleanupIntegration
  ];
  
  const watchers = tests.map(test => test());
  
  // Cleanup all watchers after 10 seconds
  setTimeout(() => {
    watchers.flat().forEach(watcher => {
      if (watcher && typeof watcher.disconnect === 'function') {
        watcher.disconnect();
      }
    });
    console.log('All integration tests completed and cleaned up');
  }, 10000);
  
  return watchers;
}
