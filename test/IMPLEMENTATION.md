# Watch v5: Implementation Plan

## Overview
Complete rewrite implementing the v5 vision: an elegant kernel with dual APIs, generator composition, and single global observer architecture.

## Phase 1: Core Kernel (Foundation)
- [ ] **1.1 Global Observer System**
  - [ ] Single MutationObserver for entire application
  - [ ] Efficient mutation processing with batching
  - [ ] Element collection and deduplication
  - [ ] Selector registry (Map<selector, Set<handler>>)

- [ ] **1.2 Core Types**
  - [ ] ElementHandler<El> type
  - [ ] ElementFn<El, T> type  
  - [ ] Selector type inference system
  - [ ] ElementFromSelector type mapping

- [ ] **1.3 Registration System**
  - [ ] register() function for selector -> handler mapping
  - [ ] Automatic application to existing elements
  - [ ] Unregister functionality
  - [ ] Type-safe handler registration

## Phase 2: Element Type Inference
- [ ] **2.1 Selector Type Mapping**
  - [ ] Input selectors -> HTMLInputElement
  - [ ] Button selectors -> HTMLButtonElement  
  - [ ] Form selectors -> HTMLFormElement
  - [ ] Anchor selectors -> HTMLAnchorElement
  - [ ] Image selectors -> HTMLImageElement
  - [ ] Select selectors -> HTMLSelectElement
  - [ ] Textarea selectors -> HTMLTextAreaElement
  - [ ] Generic HTMLElement fallback

- [ ] **2.2 Advanced Selector Patterns**
  - [ ] Complex selector parsing
  - [ ] Multiple element type unions
  - [ ] Attribute-based type inference

## Phase 3: Dual API Functions (Core DOM Manipulation)
- [ ] **3.1 Text Manipulation**
  - [ ] text() - direct and generator versions
  - [ ] Type-safe element parameter handling
  - [ ] Generator function return types

- [ ] **3.2 Class Manipulation**
  - [ ] addClass() - dual API
  - [ ] removeClass() - dual API  
  - [ ] toggleClass() - dual API with force parameter
  - [ ] hasClass() - dual API query function

- [ ] **3.3 Style Manipulation**
  - [ ] style() - dual API for CSS properties
  - [ ] Type-safe CSS property names
  - [ ] CSS value validation

- [ ] **3.4 Attribute Manipulation**
  - [ ] attr() - dual API for attributes
  - [ ] removeAttr() - dual API
  - [ ] hasAttr() - dual API query function
  - [ ] Type-safe attribute handling

## Phase 4: Event System
- [ ] **4.1 Standard DOM Events**
  - [ ] on() - dual API with full event map support
  - [ ] Type-safe event handler parameters
  - [ ] Event listener cleanup/removal
  - [ ] Element parameter in event handlers (no 'this' binding)

- [ ] **4.2 Event Delegation**
  - [ ] Parent + child selector delegation
  - [ ] Multiple event type support
  - [ ] Cleanup for delegated events
  - [ ] Existing element application

## Phase 5: Advanced Observer Events
- [ ] **5.1 Attribute Observation**
  - [ ] onAttr() - dual API
  - [ ] String and RegExp attribute filters
  - [ ] Old/new value tracking
  - [ ] Efficient MutationObserver usage

- [ ] **5.2 Text Content Observation**  
  - [ ] onText() - dual API
  - [ ] Text change detection
  - [ ] Old/new text value tracking
  - [ ] Character data and child list observation

- [ ] **5.3 Visibility Observation**
  - [ ] onVisible() - dual API
  - [ ] IntersectionObserver integration
  - [ ] Intersection ratio and bounding rect data
  - [ ] Configurable intersection options

- [ ] **5.4 Resize Observation**
  - [ ] onResize() - dual API
  - [ ] ResizeObserver integration
  - [ ] Content/border/device pixel box sizes
  - [ ] Efficient resize handling

## Phase 6: Lifecycle Events
- [ ] **6.1 Mount/Unmount System**
  - [ ] onMount() - dual API
  - [ ] onUnmount() - dual API  
  - [ ] Global unmount handler storage
  - [ ] Automatic unmount triggering on element removal

- [ ] **6.2 Cleanup Management**
  - [ ] Automatic observer cleanup
  - [ ] Manual cleanup functions
  - [ ] Memory leak prevention

## Phase 7: Form Handling
- [ ] **7.1 Form Value Management**
  - [ ] value() - dual API for inputs/selects/textareas
  - [ ] checked() - dual API for checkboxes/radios
  - [ ] Type-safe form element handling

- [ ] **7.2 Form Validation**
  - [ ] Custom validation helpers
  - [ ] Error display utilities
  - [ ] Form submission handling

## Phase 8: Advanced Features
- [ ] **8.1 Property Manipulation**
  - [ ] prop() - dual API for element properties
  - [ ] Type-safe property access
  - [ ] Property type inference

- [ ] **8.2 HTML Content**
  - [ ] html() - dual API for innerHTML
  - [ ] Getter/setter overloads
  - [ ] XSS safety considerations

- [ ] **8.3 Data Attributes**
  - [ ] data() - dual API for dataset
  - [ ] Type-safe dataset manipulation
  - [ ] Getter/setter overloads

- [ ] **8.4 DOM Traversal**
  - [ ] el() - query within element
  - [ ] all() - query all within element  
  - [ ] parent() - parent element access
  - [ ] children() - child element access

## Phase 9: Generator System
- [ ] **9.1 Core Generator Support**
  - [ ] Generator execution engine
  - [ ] Type-safe generator composition
  - [ ] Error handling in generators

- [ ] **9.2 Watch Function Overloads**
  - [ ] String selector watch
  - [ ] Single element watch
  - [ ] Matcher function watch
  - [ ] Array/NodeList watch
  - [ ] Event delegation watch

- [ ] **9.3 Generator Utilities**
  - [ ] Generator helper functions
  - [ ] Composition utilities
  - [ ] Debug/logging support

## Phase 10: Advanced Watch Features
- [ ] **10.1 Multiple Target Types**
  - [ ] Element array handling
  - [ ] NodeList processing
  - [ ] Matcher function evaluation
  - [ ] Removal observation for all types

- [ ] **10.2 Performance Optimizations**
  - [ ] Efficient element processing
  - [ ] Observer reuse strategies
  - [ ] Memory usage optimization

## Phase 11: Testing & Validation
- [ ] **11.1 Unit Tests**
  - [ ] Core kernel tests
  - [ ] Dual API function tests
  - [ ] Type inference tests
  - [ ] Generator system tests

- [ ] **11.2 Integration Tests**
  - [ ] Real DOM manipulation tests
  - [ ] Observer event tests
  - [ ] Performance benchmarks
  - [ ] Memory leak tests

- [ ] **11.3 Browser Compatibility**
  - [ ] Modern browser support verification
  - [ ] Polyfill requirements
  - [ ] Performance across browsers

## Phase 12: Documentation & Examples
- [ ] **12.1 API Documentation**
  - [ ] Complete function reference
  - [ ] Type documentation
  - [ ] Generator pattern guides

- [ ] **12.2 Examples**
  - [ ] Basic usage examples
  - [ ] Complex composition examples
  - [ ] Performance comparison with v4
  - [ ] Migration guide from v4

## Phase 13: Build & Distribution
- [ ] **13.1 Build System**
  - [ ] TypeScript compilation
  - [ ] Bundle optimization
  - [ ] Tree-shaking support

- [ ] **13.2 Package Management**
  - [ ] NPM package setup
  - [ ] JSR package setup
  - [ ] CDN distribution

## Implementation Notes

### Key Design Principles
1. **Single Global Observer**: One MutationObserver for the entire application
2. **Dual API Pattern**: Every function works both directly and in generators
3. **Type Safety First**: Complete TypeScript integration with element inference
4. **Zero Magic**: Explicit, predictable behavior
5. **Performance**: Minimal overhead, efficient observation
6. **Composability**: Generator-based composition everywhere

### Critical Success Factors
- Maintain backward compatibility where possible
- Ensure type safety doesn't compromise usability
- Keep bundle size minimal
- Optimize for real-world performance
- Provide clear migration path from v4

### Testing Strategy
- Test-driven development for core kernel
- Browser testing across major platforms
- Performance benchmarking vs v4
- Memory leak detection
- Type safety validation

## Progress Tracking
This document serves as our master checklist. Each item should be checked off as completed, with links to implementation files and test coverage noted.
