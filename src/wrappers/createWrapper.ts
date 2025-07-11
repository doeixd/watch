import { BasicArgs, defaultSetupFn, SetupFn } from "../watch2";
import { ArgsWithArrayInfo, withArrayInfo } from "./withArrayInfo";
import { ArgsWithMutation, withMutationRecord } from "./withMutationRecord";
import { withReturnArgs } from "./withReturn";

type Merge<A, B> = {
  [K in keyof A | keyof B]:
  K extends keyof A & keyof B
  ? A[K] | B[K]
  : K extends keyof B
  ? B[K]
  : K extends keyof A
  ? A[K]
  : never;
};

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};


/**
 * Creates a wrapper function that enhances the arguments of a setup function and provides hooks for execution control.
 * This allows for the creation of composable wrappers that can add functionality and control flow
 * to setup functions while maintaining type safety.
 * 
 * @template EnhancerFn - The type of the enhancer function
 * @template Enhanced - The type of the enhanced arguments returned by the enhancer function
 * @param {EnhancerFn} enhancer - A function that takes the original arguments and returns enhanced arguments
 * @param {Object} hooks - Optional hooks for controlling execution
 * @param {Function} hooks.before - Called before setup, can cancel execution by returning false
 * @param {Function} hooks.after - Called after setup, can transform the result
 * @returns {Function} A wrapper function that can be used to enhance setup functions
 * 
 * @example
 * // Define an enhancer with validation
 * const withValidation = createWrapper(
 *   (args) => ({ ...args }),
 *   {
 *     before: (args, enhanced) => {
 *       if (!args.el) {
 *         console.error('Element required');
 *         return false; // Prevents execution
 *       }
 *     }
 *   }
 * );
 * 
 * // Define an enhancer with logging and result transformation
 * const withLogging = createWrapper(
 *   (args) => ({
 *     ...args,
 *     log: (msg: string) => console.log(`[${args.selector}] ${msg}`)
 *   }),
 *   {
 *     before: (args, enhanced) => {
 *       enhanced.log('Starting setup');
 *     },
 *     after: (args, enhanced, result) => {
 *       enhanced.log('Setup complete');
 *       return { ...result, timestamp: Date.now() };
 *     }
 *   }
 * );
 * 
 * // Original setup function
 * const setup = (args: { el: Element, log: (msg: string) => void }) => {
 *   args.log('Setting up click handler');
 *   args.el.addEventListener('click', () => args.log('Clicked!'));
 *   return { success: true };
 * };
 * 
 * // Chain multiple enhanced setups
 * const enhancedSetup = withLogging(withValidation(setup));
 * 
 * // Use the enhanced setup function
 * enhancedSetup({ el: document.body, selector: '.my-element' });
 */
export function createWrapper<
  TEnhancerFn extends (a: BasicArgs) => any,
  Enhanced extends ReturnType<TEnhancerFn>
>(enhancer: TEnhancerFn, hooks?: {
  before?: (args: BasicArgs, enhancedArgs: Enhanced) => void | false,
  after?: (args: BasicArgs, enhancedArgs: Enhanced, result: any) => any
}) {
  return function wrapper<
    WrappedFn extends SetupFn,
    Args extends Parameters<WrappedFn>[0]
  >(setupFn: WrappedFn) {
    return function enhancedSetupFn(
      args: Prettify<Omit<Args, keyof Enhanced> & Partial<Enhanced>>
    ) {
      const enhancedArgs = enhancer(args as Args);
      
      // Allow cancellation if before hook returns false
      if (hooks?.before?.(args as Args, enhancedArgs) === false) {
        return;
      }

      const result = setupFn(enhancedArgs as Args & Enhanced);
      
      // Allow result transformation
      return hooks?.after?.(args as Args, enhancedArgs, result) ?? result as Prettify<Enhanced>;
    };
  };
}
// Create wrapper takes a enhancer function, and returns a wrapper function. The wrapper function will take a setup fn, and return a 
// new setupfn thatll call the enhancer fnction on the args


type Wrapper = (...args: any[]) => (...args: any[]) => any
type After<T extends Wrapper> = Parameters<ReturnType<T>>[0]


export const use = <S extends SetupFn, W extends Wrapper>(initialSetupFn: S, wrapper: W) => {
  let w = wrapper(initialSetupFn)
  
  return ((args) => {
    return w(args)
  }) as typeof w
}

// const use = (initialSetupFn: SetupFn, ...wrappers: Wrapper[]): 
//   typeof wrappers[0] extends Wrapper 
//     ? 

// =>  {

	
// }



type InferWrappedReturn<T> = T extends (...args: any[]) => infer R ? R : never;
