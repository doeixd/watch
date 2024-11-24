import { BasicArgs } from "../watch2";
import { createWithGlobal } from "./createWithGlobal";

// { el: Element, on: Function, type?: 'added' | 'removed'  }
// This function needs to use the createWithGlobal 

// type CleanupFnType<ArgsType> = ((args: ArgsType) => never) => {}

type CleanupFn<ArgsType extends unknown = { type: 'removed' }> = (args: ArgsType) => never

type RemoveOnFn = () => never
type OnFunction = (event: string) => RemoveOnFn
type OnFunctionWith<WithType> = OnFunction & WithType

export const withCleanup = createWithGlobal<
  (args: { el: Element, on: OnFunction, type?: 'added' | 'removed' | 'initial' }) => unknown,
  {
    on: OnFunctionWith<{ cleanup: CleanupFn }>
  } & BasicArgs,
  WeakMap<Element, Set<Function>>
>('cleanups', (last, args, setupFn) => {

  const cleanups = last

  const cleanup = () => {
    if (cleanups.has(args.el)) {
      let fns = cleanups.get(args.el)
      if (fns) fns.forEach((fn) => fn?.(args))
    }
    cleanups.delete(args.el);
  }

  if (args?.type && args?.type == 'removed') {
    cleanup()
  }

  Object.defineProperty(args.on, 'cleanup', {
    value: createCleanupFnForEl(args.el, cleanups)
  })

  return cleanups
}, new WeakMap<Element, Set<Function>>())


export function createCleanupFnForEl(el, cleanups: WeakMap<Element, Set<Function>>) {
  function addCleanupFn(fn) {
    if (!cleanups.has(el)) {
      cleanups.set(el, new Set<Function>())
    }

    const cleanupFnsForThisEl = cleanups.get(el)

    cleanupFnsForThisEl.add(fn)
    return () => {
      cleanupFnsForThisEl.delete(fn)
    }
  }

  Object.defineProperty(addCleanupFn, 'defined', {
    value: cleanups
  })

  return addCleanupFn as typeof addCleanupFn & {
    defined: typeof cleanups
  }
}