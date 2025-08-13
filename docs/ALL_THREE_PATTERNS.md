# All Three Patterns: The Complete Picture

## The Reality: dom-new.ts Already Does Everything!

The `dom-new.ts` functions are **heavily overloaded** and support ALL patterns:

## Pattern 1: Direct DOM Manipulation (No Generators)
```typescript
import { text, addClass } from 'watch-selector';

// Direct element manipulation - returns void
const button = document.querySelector('button');
text(button, 'Click me');
addClass(button, 'active');

// CSS selector manipulation - returns void
text('#my-button', 'Click me');
addClass('.buttons', 'active');
```

## Pattern 2: Generator Pattern with dom-new.ts
```typescript
import { watch, text, addClass } from 'watch-selector';

watch('button', function* () {
  // SAME functions from dom-new.ts, but now return Workflow<T>
  yield* text('Click me');
  yield* addClass('active');
  
  // Can also get values
  const content = yield* text();
  console.log(content);
});
```

## Pattern 3: Enhanced Context (Same dom-new.ts Under the Hood)
```typescript
import { watch } from 'watch-selector';

watch('button', function* (ctx) {
  // ctx.text() just calls dom-new.text() internally!
  yield* ctx.text('Click me');
  yield* ctx.addClass('active');
  
  const content = yield* ctx.text();
});
```

## Pattern 4: Generator Module (Separate Implementation)
```typescript
import { watch } from 'watch-selector';
import { text, addClass } from 'watch-selector/generator';

watch('button', function* () {
  // Different implementation, but same result
  yield* text('Click me');
  yield* addClass('active');
});
```

## The Key Insight: dom-new.ts is Smart!

The `dom-new.ts` functions use **TypeScript overloads** and **runtime detection**:

```typescript
export function text(...args: any[]): any {
  // 2 args with element? Direct manipulation
  if (args.length === 2 && isHTMLElement(args[0])) {
    const [element, content] = args;
    element.textContent = String(content);
    return;  // Returns void
  }

  // 2 args with selector? Query and manipulate
  if (args.length === 2 && typeof args[0] === 'string') {
    const [selector, content] = args;
    const elements = resolveElements(selector);
    elements.forEach(el => el.textContent = String(content));
    return;  // Returns void
  }

  // 1 arg? Generator setter pattern
  if (args.length === 1) {
    return (function* () {
      yield ((context) => {
        context.element.textContent = String(args[0]);
      });
    })();  // Returns Workflow<void>
  }

  // 0 args? Generator getter pattern
  if (args.length === 0) {
    return (function* () {
      const result = yield ((context) => {
        return context.element.textContent || '';
      });
      return result;
    })();  // Returns Workflow<string>
  }
}
```

## So What's the Generator Module For?

The generator module (`src/generator/*`) is **redundant**:

| Feature | dom-new.ts | Generator Module | Enhanced Context |
|---------|------------|------------------|------------------|
| Direct DOM | ✅ Yes | ❌ No | ❌ No |
| CSS Selectors | ✅ Yes | ❌ No | ❌ No |
| Generator Pattern | ✅ Yes | ✅ Yes | ✅ Yes (via dom-new) |
| Events | ❌ No* | ✅ Yes | ❌ No |
| Lifecycle | ❌ No* | ✅ Yes | ❌ No |

*Events aren't in dom-new.ts, they're in api/events.ts (but those probably don't have generator overloads)

## The Real Architecture

```
dom-new.ts (Core Implementation)
    ├── Direct usage: text(element, 'hello')
    ├── Selector usage: text('#btn', 'hello')
    └── Generator usage: yield* text('hello')
            ├── Used directly in watch()
            └── Used by enhanced context: ctx.text() → dom-new.text()

generator/* (Separate Implementation)
    └── Generator-only usage: yield* text('hello')
```

## Why This is Confusing

1. **dom-new.ts already supports generators!** The generator module reimplements the same functionality.

2. **Enhanced context just wraps dom-new.ts** - it doesn't add new functionality, just reorganizes it.

3. **Three ways to do the same thing in generators:**
   ```typescript
   // All three do the exact same thing:
   yield* text('hello');        // dom-new.ts in generator mode
   yield* ctx.text('hello');    // enhanced context → dom-new.ts
   yield* genText('hello');     // generator module (if imported as genText)
   ```

## The Only Real Gap

The generator module has **events and lifecycle** that dom-new doesn't:
- `click`, `input`, `change`, `submit`
- `onMount`, `onUnmount`
- `onAttr`, `onText`, `onVisible`, `onResize`

These could be:
1. Added to `api/events.ts` with generator overloads (like dom-new.ts)
2. Added to enhanced context
3. Both

## Conclusion

The library has evolved organically and now has redundancy:
- **dom-new.ts** is incredibly powerful and handles all patterns
- **Generator module** reimplements what dom-new already does (except events)
- **Enhanced context** is just a nice wrapper around dom-new

The cleanest architecture would be:
1. Add generator overloads to `api/events.ts` (like dom-new has)
2. Enhanced context continues to wrap everything
3. Deprecate the generator module

This would give us:
- **One implementation** (api/dom-new.ts + api/events.ts)
- **Multiple usage patterns** (direct, selector, generator, context)
- **No redundancy**