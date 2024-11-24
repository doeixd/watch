import { SetupFn } from "../watch2";
import { createWithGlobal } from "./createWithGlobal";
import { createWrapper } from "./createWrapper";


type ReturnedCacheKeys = {
  currentCount: number,
  elToArgsMap: WeakMap<Element, object>
}

export const withReturnCacheGlobal = createWithGlobal('returnedCacheKeys', (lastValueForThisGlobal: ReturnedCacheKeys, args, setupFn) => {
  const result = setupFn(args)
  const isResultAnObject = typeof result === 'object'

  const doesResultElementExist = isResultAnObject && 'el' in result && result.el instanceof Element

  if (doesResultElementExist) {
    lastValueForThisGlobal.elToArgsMap.set(args.el as Element, { args, setupFn })
  }

  const doesCleanupFnExist = typeof args == 'object' && args?.on !== 'undefined' && typeof args?.on?.cleanup == 'function'
  if (doesCleanupFnExist) {
    args.on.cleanup()
  }

  const first = lastValueForThisGlobal.currentCount == 0
  if (first) args.toReturn.value ||= result
  lastValueForThisGlobal.currentCount += 1

  return result
}, { currentCount: 0, elToArgsMap: new WeakMap<object, Element>() })



export const withDefaultReturn = createWrapper((args) => {
  args.toReturn.value = args
  return args
})

export const withReturnArgs = (setupFn: SetupFn): (args: Parameters<SetupFn>["0"]) => ReturnType<typeof setupFn> extends object ? ReturnType<typeof setupFn> : Parameters<typeof setupFn>["0"] => (args) => {
  const result = setupFn(args) 
  if (typeof result == 'object') {
    return result
  } else {
    return args
  }
}