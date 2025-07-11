import { addDefaultBehaviorsWrapper, watch, SetupFn } from '../src/watch2'
import { withOn, withState, withStyle } from '../src/wrappers'
import { use } from '../src/wrappers/createWrapper'

watch('input', <HTMLInputElement>({on}) => {
  on('click', (e, detail) => {

  })
})



const button = watch('button', withOn(a => {

}))

button.on('click')

let p = withState(a => {
	a
})


let i: SetupFn = a => a
let o = withOn(i)

watch('button', o(l => {
	console.log(l)
}))
const j = use(i, withOn)

// const use = <F extends Function>(fn: F) => {
// 	return ((arg: F) => {

// 	})
// }


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
