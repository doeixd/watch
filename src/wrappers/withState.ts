import { createWithGlobal } from "./createWithGlobal";

type ArgsWithState = {
  state: object
}

type RemoveOnFn = () => never
type OnFunction = (event: string) => RemoveOnFn
type OnFunctionWith<WithType> = OnFunction & WithType

type ArgsWithOnCleanup = {
  on: OnFunctionWith<{cleanup: Function}>
}

export const withState = createWithGlobal<(args: {el: Element} & ArgsWithOnCleanup ) => unknown, {el: Element} & ArgsWithOnCleanup, WeakMap<Element, object>>('states', (last, args, setupFn) => {
  const states = last

  let state = states.get(args.el)
  
  if (!state) {
    states.set(args.el, {}) 
  }

  (args as Parameters<typeof setupFn>[0] & ArgsWithState).state = state

  args.on.cleanup(() => {
    states.delete(args.el)
  })

  return states
},  new WeakMap<Element, object>())