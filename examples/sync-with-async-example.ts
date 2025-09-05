/**
 * Example demonstrating sync generators with async operations
 *
 * This shows how to use sync generators by default for better performance,
 * while still being able to use async operations when needed via the async wrapper.
 */

import { watch } from '../src/watch';
import { text, addClass, removeClass, setState, getState } from '../src/generator';
import { async, delay, fetchData, parallel } from '../src/core/async-wrapper';

// Example 1: Simple sync generator - no async needed
watch('.button', function*() {
  // All sync operations - best performance
  yield* text('Click me!');
  yield* addClass('interactive');

  yield* click(function*() {
    yield* addClass('clicked');
    yield* text('Clicked!');

    const count = yield* getState<number>('clicks', 0);
    yield* setState('clicks', count + 1);
    yield* text(`Clicked ${count + 1} times`);
  });
});

// Example 2: Sync generator with occasional async operation
watch('.notification', function*() {
  // Start with sync operations
  yield* text('New message!');
  yield* addClass('visible slide-in');

  // Use async wrapper for delay
  yield* async(delay(3000));

  // Back to sync operations
  yield* addClass('slide-out');
  yield* removeClass('slide-in');

  yield* async(delay(300)); // Wait for animation

  yield* removeClass('visible slide-out');
  yield* text('');
});

// Example 3: Sync generator with data fetching
watch('.user-profile', function*() {
  // Show loading state (sync)
  yield* text('Loading profile...');
  yield* addClass('loading');

  // Fetch data (async wrapped)
  const userData = yield* async(async () => {
    const response = await fetch('/api/user');
    if (!response.ok) throw new Error('Failed to load user');
    return response.json();
  });

  // Update UI with data (sync)
  yield* removeClass('loading');
  yield* text(userData.name);
  yield* attr('data-user-id', userData.id);
  yield* addClass('loaded');
});

// Example 4: Parallel async operations in sync generator
watch('.dashboard', function*() {
  yield* text('Loading dashboard...');
  yield* addClass('skeleton');

  // Fetch multiple resources in parallel
  const [user, posts, stats] = yield* async(
    parallel([
      fetch('/api/user').then(r => r.json()),
      fetch('/api/posts').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ])
  );

  // Update UI with all data (sync)
  yield* removeClass('skeleton');

  yield* query('.user-name')?.text(user.name);
  yield* query('.post-count')?.text(`${posts.length} posts`);
  yield* query('.stats')?.text(`Views: ${stats.views}`);

  yield* addClass('loaded');
});

// Example 5: Complex animation sequence
watch('.animated-card', function*() {
  yield* click(function*() {
    // Phase 1: Prepare
    yield* addClass('animating');
    yield* removeClass('idle');

    // Phase 2: Animate in
    yield* addClass('scale-up rotate');
    yield* async(delay(300));

    // Phase 3: Hold
    yield* addClass('glow');
    yield* async(delay(500));

    // Phase 4: Animate out
    yield* removeClass('scale-up rotate glow');
    yield* addClass('scale-down fade-out');
    yield* async(delay(300));

    // Phase 5: Reset
    yield* removeClass('animating scale-down fade-out');
    yield* addClass('idle');
  });
});

// Example 6: Form with validation
watch('.email-form', function*() {
  yield* submit(function*(event) {
    event.preventDefault();

    // Get form data (sync)
    const email = yield* query<HTMLInputElement>('input[type="email"]')?.getValue();
    if (!email) return;

    // Show submitting state (sync)
    yield* addClass('submitting');
    yield* query('.submit-btn')?.text('Sending...');
    yield* query('.submit-btn')?.attr('disabled', 'true');

    // Submit to API (async)
    try {
      const result = yield* async(async () => {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (!response.ok) {
          throw new Error('Subscription failed');
        }

        return response.json();
      });

      // Success state (sync)
      yield* removeClass('submitting');
      yield* addClass('success');
      yield* query('.message')?.text('Successfully subscribed!');

    } catch (error) {
      // Error state (sync)
      yield* removeClass('submitting');
      yield* addClass('error');
      yield* query('.message')?.text('Failed to subscribe. Please try again.');

      // Reset after delay
      yield* async(delay(3000));
      yield* removeClass('error');
      yield* query('.message')?.text('');
    }

    // Re-enable button (sync)
    yield* query('.submit-btn')?.text('Subscribe');
    yield* query('.submit-btn')?.removeAttr('disabled');
  });
});

// Example 7: Polling with sync generator
watch('.live-stats', function*() {
  // Initial state
  yield* setState('polling', true);
  yield* text('Connecting...');

  // Start polling loop
  while (yield* getState<boolean>('polling', true)) {
    // Fetch latest data (async)
    try {
      const stats = yield* async(
        fetch('/api/live-stats').then(r => r.json())
      );

      // Update display (sync)
      yield* text(`Users online: ${stats.online}`);
      yield* attr('data-timestamp', stats.timestamp);
      yield* removeClass('error');
      yield* addClass('connected');

    } catch (error) {
      // Show error (sync)
      yield* text('Connection lost');
      yield* addClass('error');
      yield* removeClass('connected');
    }

    // Wait before next poll (async)
    yield* async(delay(5000));
  }

  // Cleanup when polling stops
  yield* text('Disconnected');
  yield* removeClass('connected error');
});

// Example 8: Autocomplete search
watch('.search-input', function*() {
  yield* input(function*(event) {
    const query = (event.target as HTMLInputElement).value;

    // Don't search for empty or short queries (sync check)
    if (query.length < 3) {
      yield* query('.results')?.html('');
      yield* removeClass('searching');
      return;
    }

    // Show searching state (sync)
    yield* addClass('searching');

    // Debounced search (async)
    const results = yield* async(async () => {
      // Wait a bit to debounce
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if query hasn't changed
      const currentQuery = (event.target as HTMLInputElement).value;
      if (currentQuery !== query) return null;

      // Perform search
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      return response.json();
    });

    // Update results (sync)
    if (results) {
      yield* removeClass('searching');

      const resultsHtml = results
        .map(r => `<div class="result">${r.title}</div>`)
        .join('');

      yield* query('.results')?.html(resultsHtml);
    }
  });
});

/**
 * Key Benefits of This Approach:
 *
 * 1. Performance: Sync generators have less overhead than async
 * 2. Clarity: Async operations are explicitly wrapped
 * 3. Flexibility: Use async only when needed
 * 4. Simplicity: Most DOM operations remain simple and sync
 * 5. Power: Can still do complex async workflows when needed
 *
 * The async wrapper acts as a bridge, allowing you to:
 * - Keep generators sync by default
 * - Yield async operations when needed
 * - Maintain type safety throughout
 * - Avoid unnecessary async overhead
 */
