import { createWithGlobal } from "./createWithGlobal";
import { BasicArgs } from "../watch2";

type ArgsWithState = {
  state: object
}

type RemoveOnFn = () => never
type OnFunction = (event: string) => RemoveOnFn
type OnFunctionWith<WithType> = OnFunction & WithType

type ArgsWithOnCleanup = {
  on: OnFunctionWith<{cleanup: Function}>
}

export const withState = createWithGlobal<{el: Element} & ArgsWithOnCleanup &  ArgsWithState , WeakMap<Element, object>>('states', (last, args, setupFn) => {
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

