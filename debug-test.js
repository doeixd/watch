import { watch } from './src/watch.js';
import { self, cleanup } from './src/core/context.js';

// Create a button
const button = document.createElement('button');
button.id = 'test-button';
document.body.appendChild(button);

console.log('Button created and added to DOM');

// Set up watch
const controller = watch(button, function* (ctx) {
  console.log('Generator started for button', button);
  console.log('self() returns:', self());
  console.log('ctx.element is:', ctx.element);
  
  cleanup(() => {
    console.log('Cleanup function called!');
  });
  
  console.log('Generator finished');
});

console.log('Watch set up, controller:', controller);

// Wait a bit then remove the button
setTimeout(() => {
  console.log('Removing button...');
  button.remove();
  
  setTimeout(() => {
    console.log('Done waiting after remove');
  }, 100);
}, 100);
