# Yield* Patterns in Watch-Selector v5

## Overview

Watch-selector v5 introduces comprehensive `yield*` support for all functions, providing perfect type safety and eliminating the need for wrapper patterns. This document covers all the new patterns and migration strategies.

## Key Benefits

- **Perfect Type Safety**: All `yield*` calls return properly typed values
- **No Wrappers Needed**: Direct `yield*` delegation without `$()` wrapper
- **Consistent API**: Every function supports the same patterns
- **Enhanced Context**: All functions available on context object
- **Better Performance**: Native generator delegation

## Core Patterns

### 1. Basic yield* Pattern

```typescript
import { watch, text, addClass, getState, setState } from 'watch-selector';

// OLD (yield with type loss)
watch('button', function* () {
  yield text('Hello');           // No type inference
  yield addClass('active');      // Returns void
  const state = getState('data'); // Manual call
});

// NEW (yield* with type safety)
watch('button', function* () {
  yield* text('Hello');          // Returns Workflow<void>
  yield* addClass('active');     // Returns Workflow<void>
  const state = yield* getState<UserData>('data'); // Returns UserData | undefined
});
```

### 2. Enhanced Context Pattern

```typescript
import { watchEnhanced } from 'watch-selector';

watchEnhanced('.component', function* (ctx) {
  // All functions available on context with yield*
  const element = yield* ctx.self();
  const children = yield* ctx.all<HTMLElement>('.child');
  
  yield* ctx.text('Enhanced Context');
  yield* ctx.addClass('processed');
  
  yield* ctx.click(function* () {
    const isActive = yield* ctx.toggleClass('active');
    yield* ctx.setState('active', isActive);
  });
  
  // State management through context
  const userData = yield* ctx.getState<UserData>('user');
  yield* ctx.setState('lastInteraction', Date.now());
  
  // Event handling through context
  yield* ctx.onVisible(function* (change) {
    if (change.isVisible) {
      yield* ctx.addClass('visible');
    }
  });
});
```

## Function Categories

### Core Generator Functions

All core generator functions support `yield*` with proper return types:

```typescript
watch('.container', function* () {
  // Element access
  const element = yield* self<HTMLDivElement>();
  const button = yield* el<HTMLButtonElement>('.btn');
  const items = yield* all<HTMLLIElement>('.item');
  
  // Context access
  const context = yield* ctx();
  const parent = yield* getParentContext<HTMLElement>();
  
  // Cleanup registration
  yield* cleanup(() => console.log('Cleaned up'));
});
```

### DOM Manipulation Functions

```typescript
watch('.element', function* () {
  // Text and HTML
  yield* text('New content');
  const current = yield* text(); // Returns string
  yield* html('<strong>Bold</strong>');
  
  // Classes
  yield* addClass('new-class');
  yield* removeClass('old-class');
  const hasClass = yield* toggleClass('toggle'); // Returns boolean
  const exists = yield* hasClass('check'); // Returns boolean
  
  // Attributes and properties
  yield* attr('data-id', '123');
  const id = yield* attr('data-id'); // Returns string | null
  yield* prop('disabled', true);
  const disabled = yield* prop('disabled'); // Returns boolean
  
  // Styles
  yield* style('color', 'red');
  const color = yield* style('color'); // Returns string
  yield* style({ background: 'blue', padding: '10px' });
  
  // Visibility
  yield* show();
  yield* hide();
  
  // Form elements
  yield* value('input value');
  const inputValue = yield* value(); // Returns string
  yield* checked(true);
  const isChecked = yield* checked(); // Returns boolean
});
```

### Event Functions

```typescript
watch('.interactive', function* () {
  // Basic event handling
  const clickCleanup = yield* click(function* (event) {
    yield* addClass('clicked');
    yield* text(`Clicked at ${event.clientX}, ${event.clientY}`);
  });
  
  // Input with debouncing
  yield* input(function* (event) {
    const target = event.target as HTMLInputElement;
    yield* setState('inputValue', target.value);
  }, { debounce: 300 });
  
  // Form submission
  yield* submit(function* (event) {
    event.preventDefault();
    yield* addClass('submitting');
    // Handle submission
    yield* removeClass('submitting');
  });
  
  // Custom events
  yield* on('custom:event', function* (event) {
    const detail = (event as CustomEvent).detail;
    yield* setState('customData', detail);
  });
  
  // Generic event handling
  yield* on('mouseenter', function* () {
    yield* addClass('hovered');
  });
});
```

### Observer Events

```typescript
watch('.observed', function* () {
  // Attribute changes
  yield* onAttr(function* (change) {
    console.log(`${change.attributeName}: ${change.oldValue} → ${change.newValue}`);
    yield* addClass(`attr-${change.attributeName}-changed`);
  });
  
  // Text content changes
  yield* onText(function* (change) {
    yield* setState('lastTextChange', {
      old: change.oldValue,
      new: change.newValue,
      timestamp: Date.now()
    });
  });
  
  // Visibility tracking
  yield* onVisible(function* (change) {
    yield* setState('isVisible', change.isVisible);
    if (change.isVisible) {
      yield* addClass('in-viewport');
    } else {
      yield* removeClass('in-viewport');
    }
  }, { threshold: 0.5 });
  
  // Resize tracking
  yield* onResize(function* (change) {
    const { width, height } = change.contentRect;
    yield* setState('dimensions', { width, height });
    yield* attr('data-size', `${Math.round(width)}x${Math.round(height)}`);
  });
});
```

### Lifecycle Events

```typescript
watch('.component', function* () {
  // Mount handler
  yield* onMount(function* () {
    yield* addClass('mounted');
    yield* setState('mountedAt', Date.now());
    yield* text('Component initialized');
  });
  
  // Unmount handler
  yield* onUnmount(function* () {
    // Save state before unmount
    const state = yield* getState('componentState');
    if (state) {
      localStorage.setItem('saved-state', JSON.stringify(state));
    }
  });
});
```

### State Management

```typescript
watch('.stateful', function* () {
  // Setting state
  yield* setState<UserData>('user', { id: 1, name: 'John' });
  yield* setState('counter', 0);
  
  // Getting state with defaults
  const user = yield* getState<UserData>('user');
  const counter = yield* getState<number>('counter', 0);
  
  // Updating state
  const newCounter = yield* updateState<number>('counter', (c) => c + 1);
  
  // State existence checks
  const hasUser = yield* hasState('user');
  if (hasUser) {
    const userData = yield* getState<UserData>('user');
    yield* text(`Hello, ${userData?.name}`);
  }
  
  // Watching state changes
  yield* watchState<number>('counter', function* (newValue, oldValue) {
    yield* text(`Counter: ${oldValue} → ${newValue}`);
    if (newValue > 10) {
      yield* addClass('high-count');
    }
  });
  
  // Deleting state
  yield* deleteState('temporary');
});
```

## Migration Guide

### From yield to yield*

```typescript
// OLD: yield pattern (no type safety)
watch('button', function* () {
  yield text('Hello');
  yield addClass('active');
  const element = self();
  const state = getState('data');
});

// NEW: yield* pattern (full type safety)
watch('button', function* () {
  yield* text('Hello');          // Workflow<void>
  yield* addClass('active');     // Workflow<void>
  const element = yield* self(); // HTMLButtonElement
  const state = yield* getState<DataType>('data'); // DataType | undefined
});
```

### From $ wrapper to direct yield*

```typescript
// OLD: $ wrapper pattern
import { $, text, addClass } from 'watch-selector/generator';

watch('button', function* () {
  yield* $(text('Hello'));
  yield* $(addClass('active'));
  const element = yield* $(self());
});

// NEW: direct yield* ($ wrapper no longer needed)
import { text, addClass, self } from 'watch-selector';

watch('button', function* () {
  yield* text('Hello');
  yield* addClass('active');
  const element = yield* self();
});
```

### From generator module to main exports

```typescript
// OLD: separate generator module
import { watch } from 'watch-selector';
import { text, addClass, getState } from 'watch-selector/generator';

watch('button', function* () {
  yield* $(text('Hello'));
  yield* $(getState('data'));
});

// NEW: unified exports
import { watch, text, addClass, getState } from 'watch-selector';

watch('button', function* () {
  yield* text('Hello');
  const data = yield* getState<DataType>('data');
});
```

## Advanced Patterns

### Complex State Management

```typescript
interface ComponentState {
  status: 'loading' | 'ready' | 'error';
  data: any[];
  selectedId: string | null;
  lastUpdate: number;
}

watch('.data-widget', function* () {
  // Initialize complex state
  yield* setState<ComponentState>('widget', {
    status: 'loading',
    data: [],
    selectedId: null,
    lastUpdate: 0
  });
  
  // Mount: load data
  yield* onMount(function* () {
    yield* addClass('loading');
    
    try {
      // Simulate async data loading
      const response = await fetch('/api/data');
      const data = await response.json();
      
      yield* updateState<ComponentState>('widget', (state) => ({
        ...state,
        status: 'ready',
        data,
        lastUpdate: Date.now()
      }));
      
      yield* removeClass('loading');
      yield* addClass('ready');
      yield* text(`Loaded ${data.length} items`);
    } catch (error) {
      yield* updateState<ComponentState>('widget', (state) => ({
        ...state,
        status: 'error'
      }));
      
      yield* removeClass('loading');
      yield* addClass('error');
      yield* text('Failed to load data');
    }
  });
  
  // Handle item selection
  yield* on('click', function* (event) {
    const item = (event.target as Element).closest('.item');
    if (item) {
      const itemId = item.getAttribute('data-id');
      if (itemId) {
        yield* updateState<ComponentState>('widget', (state) => ({
          ...state,
          selectedId: itemId
        }));
        
        // Update UI
        const allItems = yield* queryAll('.item');
        allItems.forEach(i => removeClass(i, 'selected'));
        yield* addClass(item, 'selected');
      }
    }
  });
  
  // Watch state changes
  yield* watchState<ComponentState>('widget', function* (newState, oldState) {
    if (newState.status !== oldState?.status) {
      yield* removeClass(`status-${oldState?.status}`);
      yield* addClass(`status-${newState.status}`);
    }
    
    if (newState.selectedId !== oldState?.selectedId) {
      yield* attr('data-selected', newState.selectedId || '');
    }
  });
});
```

### Event Composition

```typescript
watch('.interactive-card', function* () {
  // Hover effects
  yield* on('mouseenter', function* () {
    yield* addClass('hovered');
    yield* style('transform', 'scale(1.02)');
  });
  
  yield* on('mouseleave', function* () {
    yield* removeClass('hovered');
    yield* style('transform', '');
  });
  
  // Click handling with state
  yield* click(function* (event) {
    const isExpanded = yield* hasClass('expanded');
    yield* toggleClass('expanded');
    
    if (!isExpanded) {
      // Expanding
      yield* setState('expandedAt', Date.now());
      yield* style('height', 'auto');
      
      const content = yield* el('.card-content');
      if (content) {
        yield* style(content, 'display', 'block');
      }
    } else {
      // Collapsing
      yield* deleteState('expandedAt');
      yield* style('height', '');
      
      const content = yield* el('.card-content');
      if (content) {
        yield* style(content, 'display', 'none');
      }
    }
  });
  
  // Keyboard accessibility
  yield* on('keydown', function* (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Trigger same logic as click
      const clickEvent = new MouseEvent('click', { bubbles: true });
      (yield* self()).dispatchEvent(clickEvent);
    }
  });
});
```

### Parent-Child Communication

```typescript
// Parent component
watch('.parent-container', function* () {
  yield* setState('parentData', {
    theme: 'dark',
    language: 'en',
    permissions: ['read', 'write']
  });
  
  // Handle theme changes
  yield* on('theme:change', function* (event) {
    const newTheme = (event as CustomEvent).detail.theme;
    yield* updateState<any>('parentData', (data) => ({
      ...data,
      theme: newTheme
    }));
    
    yield* removeClass('theme-light', 'theme-dark');
    yield* addClass(`theme-${newTheme}`);
  });
});

// Child component
watch('.child-component', function* () {
  // Access parent context
  const parentContext = yield* getParentContext<HTMLElement>();
  if (parentContext) {
    // Get parent data through context
    const parentElement = parentContext.element;
    // Access parent state somehow or use custom communication
  }
  
  // Child-specific logic
  yield* setState('childData', { initialized: true });
  
  yield* click(function* () {
    // Communicate with parent
    const themeChangeEvent = new CustomEvent('theme:change', {
      detail: { theme: 'light' },
      bubbles: true
    });
    (yield* self()).dispatchEvent(themeChangeEvent);
  });
});
```

## Performance Considerations

### Efficient State Updates

```typescript
watch('.performance-demo', function* () {
  // Batch state updates
  yield* setState('batch', {
    counter: 0,
    items: [],
    metadata: {}
  });
  
  // Efficient bulk updates
  yield* updateState<any>('batch', (state) => ({
    ...state,
    counter: state.counter + 1,
    items: [...state.items, newItem],
    metadata: { ...state.metadata, lastUpdate: Date.now() }
  }));
  
  // Avoid frequent individual updates in loops
  const updates = [];
  for (let i = 0; i < 100; i++) {
    updates.push(computeItem(i));
  }
  
  // Single batch update instead of 100 individual ones
  yield* updateState<any>('batch', (state) => ({
    ...state,
    items: [...state.items, ...updates]
  }));
});
```

### Cleanup Best Practices

```typescript
watch('.cleanup-demo', function* () {
  // Register all cleanup functions
  const interval = setInterval(() => {
    console.log('Periodic task');
  }, 1000);
  
  const timeout = setTimeout(() => {
    console.log('Delayed task');
  }, 5000);
  
  // Register cleanup
  yield* cleanup(() => {
    clearInterval(interval);
    clearTimeout(timeout);
  });
  
  // Event listeners are automatically cleaned up
  yield* click(function* () {
    yield* text('Click handled');
  });
  
  // Observer cleanup is automatic
  yield* onResize(function* (change) {
    yield* setState('size', change.contentRect);
  });
});
```

## Best Practices

### 1. Always Use yield* for Type Safety

```typescript
// ✅ Good: Type-safe with yield*
const element: HTMLButtonElement = yield* self();
const hasClass: boolean = yield* hasClass('active');
const state: UserData | undefined = yield* getState<UserData>('user');

// ❌ Avoid: No type safety with yield
yield text('Hello'); // Returns void, no type inference
const element = self(); // Direct call, not in proper context
```

### 2. Prefer Enhanced Context for Complex Components

```typescript
// ✅ Good: Enhanced context for complex logic
watchEnhanced('.complex-component', function* (ctx) {
  const element = yield* ctx.self();
  yield* ctx.setState('initialized', true);
  
  yield* ctx.click(function* () {
    yield* ctx.toggleClass('active');
  });
});

// ✅ Also good: Regular watch for simple cases
watch('.simple-button', function* () {
  yield* click(function* () {
    yield* addClass('clicked');
  });
});
```

### 3. Use Proper TypeScript Generics

```typescript
// ✅ Good: Explicit typing
const button = yield* el<HTMLButtonElement>('.action-btn');
const inputs = yield* all<HTMLInputElement>('input[type="text"]');
const userData = yield* getState<UserData>('user');

// ✅ Good: Interface for complex state
interface ComponentState {
  status: 'loading' | 'ready' | 'error';
  data: any[];
}
yield* setState<ComponentState>('component', initialState);
```

### 4. Handle Async Operations Properly

```typescript
watch('.async-component', function* () {
  yield* onMount(function* () {
    yield* setState('loading', true);
    
    try {
      // Use async operations outside of generator
      const data = await fetchData();
      
      // Update state after async operation
      yield* setState('data', data);
      yield* setState('loading', false);
    } catch (error) {
      yield* setState('error', error.message);
      yield* setState('loading', false);
    }
  });
});
```

## Troubleshooting

### Common Issues

1. **Type Errors with yield***
   ```typescript
   // Problem: Generic not specified
   const element = yield* el('.button'); // Type is HTMLElement | null
   
   // Solution: Use proper generic
   const element = yield* el<HTMLButtonElement>('.button'); // Type is HTMLButtonElement | null
   ```

2. **Missing Context**
   ```typescript
   // Problem: Using generator functions outside watch
   const element = yield* self(); // Error: no generator context
   
   // Solution: Use within watch
   watch('.element', function* () {
     const element = yield* self(); // Works correctly
   });
   ```

3. **Async/Sync Confusion**
   ```typescript
   // Problem: Mixing async in sync generator
   watch('.element', function* () {
     const data = yield* await fetchData(); // Error
   });
   
   // Solution: Handle async properly
   watch('.element', function* () {
     yield* onMount(function* () {
       const data = await fetchData(); // Async operation
       yield* setState('data', data);  // Then update state
     });
   });
   ```

## Migration Checklist

- [ ] Replace all `yield` with `yield*` for Watch functions
- [ ] Remove `$()` wrapper imports and usage
- [ ] Remove imports from `'watch-selector/generator'`
- [ ] Add proper TypeScript generics to `getState<T>()` calls
- [ ] Update event handlers to use yield* pattern
- [ ] Convert to `watchEnhanced` for complex components
- [ ] Test type safety and runtime behavior
- [ ] Update documentation and examples

## Conclusion

The yield* patterns in watch-selector v5 provide a powerful, type-safe, and consistent API for reactive DOM programming. By adopting these patterns, you get:

- Perfect TypeScript integration
- Consistent API across all functions
- Better performance through native delegation
- Cleaner, more readable code
- Enhanced context for complex components

The migration from older patterns is straightforward and provides immediate benefits in terms of type safety and developer experience.