
import { SetupFn } from '../watch2';
import { createWrapper } from "./createWrapper";


export const withOn = createWrapper((args) => {
  return {
    ...args,
    on: createOn(args.el),
  }
})


export function createOn (el: Element) {
  return function on(...args: Parameters<typeof el.addEventListener>) {
    el.addEventListener(...args)
    return () => {
      el.removeEventListener(args[0], args[1])
      return on
    }
  }
}

