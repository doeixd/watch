// Example demonstrating scoped watch API

import { scopedWatch, scopedWatchBatch, scopedWatchOnce, text, addClass } from '../src/index';

// Example 1: Basic scoped watch
// Only watches for buttons within a specific container
const container = document.querySelector('#my-container') as HTMLElement;

const watcher = scopedWatch(container, 'button', function* () {
  yield addClass('scoped-button');
  yield text('I was found by scoped watch!');
});

// Example 2: Scoped watch with custom options
// Watch attributes and character data within a form
const form = document.querySelector('form') as HTMLElement;

const formWatcher = scopedWatch(form, 'input', function* () {
  yield addClass('monitored-input');
}, {
  attributes: true,
  attributeFilter: ['value', 'disabled'],
  characterData: true
});

// Example 3: Batch scoped watching
// Watch multiple selectors within the same parent
const dashboard = document.querySelector('#dashboard') as HTMLElement;

const dashboardWatchers = scopedWatchBatch(dashboard, [
  {
    selector: '.chart',
    generator: function* () {
      yield addClass('chart-initialized');
      console.log('Chart element found in dashboard');
    }
  },
  {
    selector: '.widget',
    generator: function* () {
      yield addClass('widget-ready');
      console.log('Widget element found in dashboard');
    },
    options: {
      attributes: true,
      attributeFilter: ['data-widget-type']
    }
  }
]);

// Example 4: One-time scoped watch
// Only process the first 3 matching elements
const sidebar = document.querySelector('#sidebar') as HTMLElement;

const sidebarWatcher = scopedWatchOnce(sidebar, '.menu-item', function* () {
  yield addClass('first-three-items');
  yield text(content => `${content} (processed)`);
}, 3);

// Example 5: Cleanup
// Disconnect watchers when done
function cleanup() {
  watcher.disconnect();
  formWatcher.disconnect();
  dashboardWatchers.forEach(w => w.disconnect());
  sidebarWatcher.disconnect();
}

// Example 6: Check watcher status
console.log('Form watcher active:', formWatcher.isActive());
console.log('Watching parent:', formWatcher.getParent());
console.log('Watching selector:', formWatcher.getSelector());

// Cleanup after 30 seconds
setTimeout(cleanup, 30000);
