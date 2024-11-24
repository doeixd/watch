import { BasicArgs } from "../watch2"



export function createWithGlobal<
  // SetupFnType extends (...supFnArgs: unknown[]) => unknown,
  SetupFnType extends (BasicArgs) => unknown,
  ArgsType extends Parameters<SetupFnType>[0], 
  GlobalPropertyType, 
> (name: string, assignFn: (lastValueForThisGlobal: GlobalPropertyType, args: Parameters<typeof setupFn>[0], setupFn: SetupFnType) => GlobalPropertyType, initialValue: GlobalPropertyType, globalNamespace = Symbol.for('watch:globals')) {

  globalThis[globalNamespace] ||= ({} as Record<string, unknown>)

  return function withGlobal(setupFn) {
    return function createdSetupFnWithGlobal(args: Parameters<typeof setupFn>[0]) {
      globalThis[globalNamespace][name] ||= initialValue
      globalThis[globalNamespace][name] = assignFn(globalThis[globalNamespace][name], args, setupFn)

      return setupFn(args as ArgsType)
    }
  }
}


