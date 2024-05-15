import { watch } from "./watch";




watch<HTMLElement>('body', ({on}) => {

  on('attr', 'hello', ({el}) => {
    el
  })
})  

watch<HTMLAnchorElement>('body', ({on}) => {
  on('click', (e) => {
    
  })
})



// document.addEventListener(