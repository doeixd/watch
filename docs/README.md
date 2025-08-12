# Watch Selector Documentation

Welcome to the watch-selector documentation! This directory contains comprehensive guides, API references, and specifications for the library.

## 📚 Documentation Structure

### Core Documentation

- **[API Reference](./API.md)** - Complete documentation of all exported functions, types, and patterns with extensive examples
- **[Quick Reference](./QUICK-REFERENCE.md)** - Concise guide to commonly used functions for quick lookup
- **[Type Definitions](./TYPES.md)** - Full TypeScript type reference with detailed explanations
- **[Explicit API Specification](./EXPLICIT-API-SPEC.md)** - Specification for non-overloaded, explicit function names
- **[TODO](./TODO.md)** - Roadmap and planned features

### Development Documentation

The [AGENT_DOCS](./AGENT_DOCS/) folder contains development history, implementation notes, and architectural decisions:

- Implementation strategies and patterns
- Code review summaries
- Architecture decisions
- Future planning documents

## 🎯 Quick Links

### For Users

1. **New to watch-selector?** Start with the [Quick Reference](./QUICK-REFERENCE.md)
2. **Need detailed information?** Check the [API Reference](./API.md)
3. **Working with TypeScript?** See [Type Definitions](./TYPES.md)
4. **Prefer explicit function names?** Read the [Explicit API Spec](./EXPLICIT-API-SPEC.md)

### For Contributors

1. **Understanding the architecture?** Browse [AGENT_DOCS](./AGENT_DOCS/)
2. **Want to contribute?** Check [TODO](./TODO.md) for planned features
3. **Implementation details?** See the test directory's IMPLEMENTATION.md

## 📖 API Styles

Watch Selector offers three distinct API styles:

### 1. Overloaded API (Default)
The flexible, context-aware API with intelligent overloading:
```typescript
import { text, addClass } from 'watch-selector';

text(element, 'Hello');    // Direct element
text('#button', 'Hello');  // Selector
yield text('Hello');       // Generator
```

### 2. Explicit API
Clear, unambiguous function names:
```typescript
import * as explicit from 'watch-selector/explicit';

explicit.setTextElement(element, 'Hello');
explicit.setTextFirst('#button', 'Hello');
explicit.setTextAll('.items', 'Updated');
```

### 3. Fluent API
jQuery-like chainable interface:
```typescript
import { selector, $ } from 'watch-selector/fluent';

selector('#button')
  .text('Click me!')
  .addClass('primary')
  .click(() => console.log('Clicked!'));
```

## 🔍 Finding What You Need

### By Task

- **DOM Manipulation**: See "DOM Manipulation" section in [API.md](./API.md#dom-manipulation)
- **Event Handling**: See "Event Handling" section in [API.md](./API.md#event-handling)
- **State Management**: See "State Management" section in [API.md](./API.md#state-management)
- **Type Safety**: Review [TYPES.md](./TYPES.md)

### By Experience Level

- **Beginners**: Start with [Quick Reference](./QUICK-REFERENCE.md) and use the Explicit API
- **Intermediate**: Use the default Overloaded API with [API Reference](./API.md)
- **Advanced**: Explore all three APIs and check [Type Definitions](./TYPES.md)

## 📝 Documentation Conventions

### Code Examples

All code examples in the documentation follow these conventions:
- **TypeScript** is the default language
- **ES6+ syntax** is used throughout
- **Type annotations** are included where helpful
- **Comments** explain non-obvious behavior

### API Notation

- `Element` refers to DOM Element type
- `HTMLElement` refers to HTML-specific elements
- `El` is a generic type parameter for elements
- `S` is a generic type parameter for selector strings
- `T` is a generic type parameter for values

## 🔗 External Resources

- [GitHub Repository](https://github.com/patrickg/watch-selector)
- [NPM Package](https://www.npmjs.com/package/watch-selector)
- [Examples Directory](../examples/)

## 📄 License

Watch Selector is MIT licensed. See the [LICENSE](../LICENSE) file for details.