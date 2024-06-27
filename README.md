# watch
Watch is a bare-bones web component alternative. It runs a function, and adds event listeners to elements that match a given selector. That's basically it. 

Since each match of a given selector is given it's own state, it enables light-weight components for small bits of interactivity. A common use-case in server-driven websites, think Astro, e-commerce templates, blogs, htmx sites, etc...

The module also has few helpers that I find to be the bare essentials when creating any website, if you don't use them they should be tree-shaken by your bundler.

## Example 

```js
import { watch } from 'https://esm.sh/watch-selector?exports=watch'

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



## Performance
Because `watch` has to check every single element to see if it matches the selector provided, this causes a performance bottle-neck when adding lots of elements to the DOM. This can partially be mitigated by passing a different `parent` to `watch` that is closer to the element in question.

### Examples

#### Parent
In this example, even though millions of elements are being added to the DOM `watch` will not cause any performace issues because it will only check added elements that are children of the provided parent element. 
```js
watch('todo-item', ({on, el}) => {
  on('click', () => {
    document.querySelector('lag-container').innerHTML += `<button>Lag</button>`.repeat(100000000)
  })
}, {
  parent: document.querySelector('todo-list')
})

```



v2 may add lazy hydration instead of eagerly adding listeners whenever there is a change.
