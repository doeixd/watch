/**
 * Comprehensive yield* Demo - Watch Selector v5
 *
 * This example demonstrates the complete yield* API with all new features:
 * - Core generator functions (self, el, all, cleanup, ctx, getParentContext)
 * - Event functions (on, click, input, change, submit)
 * - Observer events (onAttr, onText, onVisible, onResize)
 * - Lifecycle events (onMount, onUnmount)
 * - DOM manipulation with yield*
 * - State management with yield*
 * - Enhanced context with attached methods
 * - Type safety throughout
 */

import {
  watch,
  watch as watchEnhanced,
  // Core generator functions
  self,
  el,
  all,
  cleanup,
  ctx,
  getParentContext,
  // Event functions
  on,
  click,
  input,
  change,
  submit,
  // Observer events
  onAttr,
  onText,
  onVisible,
  onResize,
  // Lifecycle events
  onMount,
  onUnmount,
  // DOM functions
  text,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  style,
  attr,
  query,
  queryAll,
  // State management
  getState,
  setState,
  updateState,
  hasState,
  deleteState,
  watchState,
} from 'watch-selector';

// ==================== CORE GENERATOR FUNCTIONS WITH YIELD* ====================

/**
 * Demo 1: Core generator functions with yield* support
 */
watch('.demo-core', function* () {
  // Get current element with yield* - perfect type inference
  const element = yield* self<HTMLDivElement>();
  console.log('Current element:', element.tagName);

  // Query child elements with yield*
  const button = yield* el<HTMLButtonElement>('.action-btn');
  const inputs = yield* all<HTMLInputElement>('input');

  console.log('Found button:', button?.textContent);
  console.log('Found inputs:', inputs.length);

  // Register cleanup with yield*
  const interval = setInterval(() => console.log('Tick'), 1000);
  yield* cleanup(() => clearInterval(interval));

  // Get context with yield*
  const context = yield* ctx();
  console.log(`Processing ${context.selector} at index ${context.index}`);
});

/**
 * Demo 2: Parent context access with yield*
 */
watch('.parent-container', function* () {
  yield* setState('parentData', { id: 'parent-123', name: 'Parent Container' });

  watch('.child-item', function* () {
    // Access parent context with yield*
    const parent = yield* getParentContext();
    if (parent) {
      console.log('Parent element:', parent.element);
      console.log('Parent API:', parent.api);
    }

    // Get own context
    const childCtx = yield* ctx();
    console.log(`Child ${childCtx.index} in parent`);
  });
});

// ==================== EVENT FUNCTIONS WITH YIELD* ====================

/**
 * Demo 3: Event handling with yield* for type safety
 */
watch('.interactive-button', function* () {
  yield* text('Click me!');
  yield* addClass('ready');

  // Click handler with yield* - returns CleanupFunction
  const clickCleanup = yield* click(function* (event) {
    console.log('Button clicked at:', event.clientX, event.clientY);

    // DOM manipulation within event handler
    yield* addClass('clicked');
    yield* text('Clicked!');

    // State update
    const count = yield* getState<number>('clicks', 0);
    yield* setState('clicks', count + 1);

    // Remove click animation after delay
    setTimeout(() => {
      // Note: Outside generator context, use direct calls
      removeClass(yield* self(), 'clicked');
    }, 300);
  });

  // Input handler with debounce
  const inputCleanup = yield* input(function* (event) {
    const target = event.target as HTMLInputElement;
    yield* text(`Typing: ${target.value}`);
    yield* setState('inputValue', target.value);
  }, { debounce: 300 });

  // Form submission
  yield* submit(function* (event) {
    event.preventDefault();
    yield* addClass('submitting');

    // Simulate async operation
    yield* text('Submitting...');

    setTimeout(async function* () {
      yield* removeClass('submitting');
      yield* text('Submitted!');
    }, 2000);
  });
});

/**
 * Demo 4: Advanced event patterns with yield*
 */
watch('.advanced-events', function* () {
  // Multiple event types with yield*
  const mouseenterCleanup = yield* on('mouseenter', function* () {
    yield* addClass('hovered');
    yield* style('background', '#f0f0f0');
  });

  const mouseleaveCleanup = yield* on('mouseleave', function* () {
    yield* removeClass('hovered');
    yield* style('background', '');
  });

  // Custom event handling
  yield* on('custom:update', function* (event) {
    const detail = (event as CustomEvent).detail;
    yield* text(`Updated: ${detail.message}`);
    yield* setState('lastUpdate', detail);
  });

  // Event delegation within current element
  yield* on('click', function* (event) {
    const target = event.target as HTMLElement;
    if (target.matches('.delegated-btn')) {
      yield* addClass(target, 'delegate-clicked');
      yield* text(target, 'Delegated click!');
    }
  });
});

// ==================== OBSERVER EVENTS WITH YIELD* ====================

/**
 * Demo 5: Observer events with yield*
 */
watch('.observed-element', function* () {
  // Watch attribute changes
  yield* onAttr(function* (change) {
    console.log(`Attribute ${change.attributeName} changed:`,
                change.oldValue, '→', change.newValue);

    if (change.attributeName === 'data-status') {
      yield* addClass(`status-${change.newValue}`);
      if (change.oldValue) {
        yield* removeClass(`status-${change.oldValue}`);
      }
    }
  });

  // Watch text content changes
  yield* onText(function* (change) {
    console.log('Text changed:', change.oldValue, '→', change.newValue);
    yield* setState('lastTextChange', Date.now());
  });

  // Watch visibility changes
  yield* onVisible(function* (change) {
    if (change.isVisible) {
      yield* addClass('visible');
      yield* setState('becameVisible', Date.now());
    } else {
      yield* removeClass('visible');
    }
  }, { threshold: 0.5 });

  // Watch resize changes
  yield* onResize(function* (change) {
    const { width, height } = change.contentRect;
    yield* text(`Size: ${Math.round(width)}×${Math.round(height)}`);
    yield* setState('currentSize', { width, height });
  });
});

// ==================== LIFECYCLE EVENTS WITH YIELD* ====================

/**
 * Demo 6: Lifecycle events with yield*
 */
watch('.lifecycle-demo', function* () {
  // Mount handler with yield*
  yield* onMount(function* () {
    console.log('Element mounted');
    yield* addClass('mounted');
    yield* setState('mountedAt', Date.now());

    // Initialize component
    yield* text('Initialized');
    yield* style('opacity', '1');
  });

  // Unmount handler with yield*
  yield* onUnmount(function* () {
    console.log('Element will unmount');
    // Cleanup any remaining state or resources
    const data = yield* getState('componentData');
    if (data) {
      console.log('Saving component data before unmount:', data);
    }
  });
});

// ==================== STATE MANAGEMENT WITH YIELD* ====================

/**
 * Demo 7: Advanced state management with yield*
 */
watch('.state-demo', function* () {
  // Initialize state with yield*
  yield* setState('counter', 0);
  yield* setState('history', [] as number[]);

  yield* click(function* () {
    // Update counter with yield*
    const newCount = yield* updateState<number>('counter', (count) => count + 1);

    // Update history with yield*
    yield* updateState<number[]>('history', (history) => [...history, newCount]);

    // Update UI with new count
    yield* text(`Count: ${newCount}`);

    // Check if we have state
    const hasHistory = yield* hasState('history');
    if (hasHistory) {
      const history = yield* getState<number[]>('history', []);
      yield* attr('data-history-length', history.length.toString());
    }
  });

  // Watch state changes with yield*
  yield* watchState<number>('counter', function* (newValue, oldValue) {
    console.log(`Counter changed: ${oldValue} → ${newValue}`);

    if (newValue > 10) {
      yield* addClass('high-count');
      yield* style('color', 'red');
    }
  });
});

// ==================== ENHANCED CONTEXT WITH YIELD* ====================

/**
 * Demo 8: Enhanced context with all functions attached
 */
watchEnhanced('.enhanced-demo', function* (ctx) {
  // All core functions available on context with yield*
  const element = yield* ctx.self();
  const children = yield* ctx.all<HTMLElement>('.child');

  // DOM manipulation through context
  yield* ctx.text('Enhanced Context Demo');
  yield* ctx.addClass('enhanced');

  // Event handling through context
  yield* ctx.click(function* () {
    yield* ctx.toggleClass('active');

    const isActive = yield* ctx.hasClass('active');
    yield* ctx.text(isActive ? 'Active' : 'Inactive');

    // State management through context
    yield* ctx.setState('isActive', isActive);
  });

  // Observer events through context
  yield* ctx.onVisible(function* (change) {
    if (change.isVisible) {
      yield* ctx.style('transform', 'scale(1)');
    }
  });

  // Lifecycle through context
  yield* ctx.onMount(function* () {
    yield* ctx.text('Enhanced component mounted');
    yield* ctx.setState('enhancedMountTime', Date.now());
  });

  // Cleanup through context
  const timer = setInterval(() => {
    const now = Date.now();
    // Direct call since we're outside generator
    ctx.setState('lastTick', now);
  }, 1000);

  yield* ctx.cleanup(() => clearInterval(timer));
});

// ==================== COMPLEX COMPOSITION WITH YIELD* ====================

/**
 * Demo 9: Complex composition showing the power of yield*
 */
watch('.complex-widget', function* () {
  // Initialize complex widget state
  yield* setState('widgetData', {
    initialized: false,
    status: 'loading',
    items: [] as any[],
    selectedId: null as string | null
  });

  // Mount handler for initialization
  yield* onMount(function* () {
    yield* addClass('initializing');
    yield* text('Initializing widget...');

    // Simulate async initialization
    setTimeout(async () => {
      // Update state after async operation
      await import('./some-data').then(data => {
        setState(yield* self(), 'widgetData', {
          initialized: true,
          status: 'ready',
          items: data.items,
          selectedId: null
        });
      });

      // Update UI after initialization
      removeClass(yield* self(), 'initializing');
      addClass(yield* self(), 'ready');
      text(yield* self(), 'Widget ready');
    }, 1000);
  });

  // Handle item selection
  yield* on('click', function* (event) {
    const target = event.target as HTMLElement;
    const item = target.closest('.widget-item');

    if (item) {
      const itemId = item.getAttribute('data-id');
      if (itemId) {
        // Update selection state
        yield* updateState<any>('widgetData', (data) => ({
          ...data,
          selectedId: itemId
        }));

        // Update UI
        const allItems = yield* queryAll('.widget-item');
        for (const otherItem of allItems) {
          removeClass(otherItem, 'selected');
        }
        yield* addClass(item, 'selected');

        // Emit custom event
        const customEvent = new CustomEvent('widget:item-selected', {
          detail: { itemId }
        });
        (yield* self()).dispatchEvent(customEvent);
      }
    }
  });

  // Handle custom events
  yield* on('widget:item-selected', function* (event) {
    const { itemId } = (event as CustomEvent).detail;
    yield* text(`Selected item: ${itemId}`);

    // Analytics or other side effects
    console.log('Widget item selected:', itemId);
    yield* setState('lastSelectedTime', Date.now());
  });

  // Watch for state changes
  yield* watchState<any>('widgetData', function* (newData, oldData) {
    console.log('Widget data changed:', oldData, '→', newData);

    if (newData.status !== oldData?.status) {
      yield* removeClass(`status-${oldData?.status}`);
      yield* addClass(`status-${newData.status}`);
    }
  });

  // Visibility optimization
  yield* onVisible(function* (change) {
    if (change.isVisible) {
      // Start any heavy operations when visible
      yield* addClass('active');
      yield* setState('visibleSince', Date.now());
    } else {
      // Pause operations when not visible
      yield* removeClass('active');
      yield* deleteState('visibleSince');
    }
  }, { threshold: 0.1 });

  // Cleanup on unmount
  yield* onUnmount(function* () {
    // Save widget state before unmount
    const widgetData = yield* getState('widgetData');
    if (widgetData?.selectedId) {
      localStorage.setItem('last-selected-widget-item', widgetData.selectedId);
    }

    console.log('Complex widget unmounted');
  });
});

// ==================== TYPE SAFETY DEMONSTRATION ====================

/**
 * Demo 10: Type safety with yield* - all values are properly typed
 */
watch('button.typed-demo', function* () {
  // self() returns HTMLButtonElement (inferred from selector)
  const button: HTMLButtonElement = yield* self();
  button.disabled = false; // TypeScript knows this is valid

  // el() with generic returns proper type
  const input: HTMLInputElement | null = yield* el<HTMLInputElement>('input');
  if (input) {
    input.value = 'Type safe!'; // TypeScript validates this
  }

  // State with proper typing
  yield* setState<{ count: number; lastClick: Date }>('typedState', {
    count: 0,
    lastClick: new Date()
  });

  const typedState = yield* getState<{ count: number; lastClick: Date }>('typedState');
  if (typedState) {
    console.log(`Count: ${typedState.count}, Last: ${typedState.lastClick}`);
  }

  // Event with proper event typing
  yield* click(function* (event: MouseEvent) {
    // event is properly typed as MouseEvent
    console.log('Click at:', event.clientX, event.clientY);

    // Update typed state
    yield* updateState<{ count: number; lastClick: Date }>('typedState', (state) => ({
      count: state.count + 1,
      lastClick: new Date()
    }));
  });
});

console.log('Comprehensive yield* demo loaded! All functions support yield* with full type safety.');
