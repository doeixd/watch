import { BasicArgs } from "../watch2"



export function createWithGlobal<
  // SetupFnType extends (...supFnArgs: unknown[]) => unknown,
  ExtendedArgsType extends object,
  GlobalPropertyType, 
  SetupFnType extends (args: ExtendedArgsType & BasicArgs) => ExtendedArgsType & BasicArgs = (args: ExtendedArgsType & BasicArgs) => ExtendedArgsType & BasicArgs,
  ArgsType extends Parameters<SetupFnType>[0] = Parameters<SetupFnType>[0], 
> (name: string, assignFn: (lastValueForThisGlobal: GlobalPropertyType, args: Parameters<typeof setupFn>[0], setupFn: SetupFnType) => GlobalPropertyType, initialValue: GlobalPropertyType, globalNamespace = Symbol.for('watch:globals')) {

  globalThis[globalNamespace] ||= ({} as Record<string, unknown>)

  return function withGlobal(setupFn) {
    return function createdSetupFnWithGlobal(args: Parameters<typeof setupFn>[0]) {
      globalThis[globalNamespace][name] ||= initialValue
      globalThis[globalNamespace][name] = assignFn(globalThis[globalNamespace][name], args as ArgsType, setupFn)

      return setupFn(args as ArgsType)
    }
  }
}


