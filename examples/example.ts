import { watch } from '../src/watch'

// watch<HTMLInputElement>('input', ({on}) => {
//   on('booby', (e, detail) => {

//   })
// })

watch<HTMLElement>('body', ({ on }) => {
	on('attr', 'hello', ({ el }) => {
		el
	})
})

watch<HTMLAnchorElement>('body', ({ on }) => {
	on('click', (e) => {})
})

const click = new Event('click')

watch<HTMLDivElement>('div', ({ on, el }) => {
	on(click, (e, detail) => {})

	page.on('click')

	on('boost', (e, detail) => {})
})

// document.addEventListener(

const new_user = Users.create('')

Users.delete(new_user)

Users.get('1').books
