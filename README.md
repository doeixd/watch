# watch
Watch is a bare-bones web component alternative. It runs a function, and adds event listeners to elements that match a given selector. That's basically it. 

Since each match of a given selector is given it's own state, it enables light-weight components for small bits of interactivity. A common use-case in server-driven websites, think Astro, e-commerce templates, blogs, htmx sites, etc...

The module also has few helpers that I find to be the bare essentials when creating any website, if you don't use them they should be tree-shaken by your bundler.

## Example 

```js
import { watch } from 'jsr:@doeixd/watch'

watch('.say-hello', ({on, state}) => {
  state.count = 0

  on('click', () => {
    alert(`Hello World${'!'.repeat(++state.count)}`)
  })
})

watch('.turn-blue', ({on, style}) => {

  on('click', () => {
    style({
      color: 'blue'
    }).apply()
  })

})

```

v2 may add lazy hydration instead of eagerly adding listeners whenever there is a change.