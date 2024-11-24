import { addDefaultBehaviorsWrapper, watch, SetupFn } from '../src/watch2'
import { withOn, withState, withStyle } from '../src/wrappers'

// watch<HTMLInputElement>('input', ({on}) => {
//   on('booby', (e, detail) => {

//   })
// })

const button = watch('button')

button.on('click')

let o = withOn(a => {
	return a
})

watch('button', withOn(a => a)((a) => 
	
}))


watch<HTMLElement>('body', ({ on }) => {

	on('attr', 'hello', ({ el }) => {
		el()
	})
})


watch<HTMLButtonElement>('button', ({ el }) => {

	on.el(inside, 'click')

	el('.inside', ( { on }) => {

	})

	// This will only execute when the setup function runs.
	const inside = el('inside')
	inside.on('click', () => {})

	el.watched('.inside')



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
