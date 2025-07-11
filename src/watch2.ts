import { setupGlobals } from "./utils/setupGlobals";
import { createObserver } from "./watch";
import {
  withCleanup,
  withOn,
  withState,
  withArrayInfo,
  withMutationRecord,
  withTextChange,
  withAttributeChange,
  withCustomEvents,
  withStyle,
  withDefaultReturn,
} from "./wrappers";
import { ArgsWithArrayInfo } from "./wrappers/withArrayInfo";
import { ArgsWithMutation } from "./wrappers/withMutationRecord";
import { withReturnArgs } from "./wrappers/withReturn";

class WatchError extends Error {}
class InvalidArgument extends WatchError {}

type ConditionFn = (
  el: Element,
  match: (...els: Element[]) => void,
  check: (...els: Element[]) => void,
) => void;

function getMatchingElementsFromConditionFn(
  conditionFn: ConditionFn,
  initialElements: Element[] = [],
) {
  const matches = [];
  const match = (...els) => matches.push(...[els].flat());

  const elementsToCheck = initialElements;
  const check = (...els) => elementsToCheck.push(...[els].flat());

  while (elementsToCheck.length) {
    let el = elementsToCheck.shift();

    conditionFn(el, match, check);
  }

  return matches;
}

function getMatchingElements<ElementType extends Element = HTMLElement>(
  selectorOrCondition: string | ConditionFn,
  elements: Node[] | NodeList = [],
  isCondition: boolean,
  isSelector: boolean,
  shouldTestAgainstSelector: boolean = false,
): ElementType[] {
  elements = Array.from(elements);

  elements = elements?.filter((el) => {
    const target = el as unknown;
    const isTargetElement = target instanceof Element;
    if (!isTargetElement) return false;
    return true;
  });

  if (isSelector && !shouldTestAgainstSelector)
    return elements as ElementType[];

  let conditionFn;
  if (isCondition && !isSelector) {
    conditionFn = selectorOrCondition;
    // matchingElements = getMatchingElementsFromConditionFn(conditionFn, getElements)
  }

  if (isSelector) {
    const selector = selectorOrCondition;
    conditionFn = (el, match) => {
      const isMatch = Boolean(el?.matches(selector));
      if (isMatch) match(el);
    };
  }

  const matchingElements = getMatchingElementsFromConditionFn(
    conditionFn,
    elements as Element[],
  );

  return matchingElements;
}

export function addDefaultBehaviorsWrapper(setupFn: SetupFn) {
  return function callSetupFnWithArgsThatHaveDefaultBehaviors(
    args: Parameters<typeof setupFn>[0],
  ) {
    let result = [
      withOn,
      withCleanup,
      withState,
      withTextChange,
      withAttributeChange,
      withCustomEvents,
      withStyle,
      withDefaultReturn,
      withReturnArgs,
    ].reduceRight(
      (acc, cur) => cur(acc),
      setupFn,
    )(args);

    return result;
  };
}

export function createSetupFnWithDefaultBehaviors() {}

export type WatchOptions<
  P extends Node = typeof document,
  I extends (...args) => Element[] = (...args) => Element[],
> = {
  parent?: P;
  initialQuery?: I;
};

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type BasicArgs<
  El extends Node = HTMLElement,
  ToReturnValue extends any = any,
> = Prettify<
  {
    type: "added" | "initial" | "removed";
    el: El;
    toReturn: { value: ToReturnValue | undefined };
  } & Partial<ArgsWithArrayInfo<unknown>> &
    Partial<ArgsWithMutation>
>;

export type SetupFn<
  ElementType extends Node = HTMLElement,
  ReturnType extends any = unknown,
  ArgsType extends BasicArgs<ElementType, ReturnType> = BasicArgs<
    ElementType,
    ReturnType
  >,
  ToReturnType extends unknown = ArgsType,
> = (arg: ArgsType) => ToReturnType;

export const defaultSetupFn = (args) => {
  // @ts-expect-error
  if (args?.toReturn) args?.toReturn.value = args;

  return args;
};

export function watch<W extends WatchOptions = WatchOptions>(
  selectorOrCondition: string | ConditionFn,
  setupFn: SetupFn = defaultSetupFn,
  options: W = {} as W,
) {
  const isCondition = typeof selectorOrCondition == "function";
  const isSelector = !isCondition && typeof selectorOrCondition == "string";
  if (!isCondition || !isSelector)
    throw new InvalidArgument(
      `[watch-selector]: Selector or Condition passed is invalid passed type ${typeof selectorOrCondition}` +
        JSON.stringify(selectorOrCondition, null, 2),
    );

  options.parent ||= document;
  options.initialQuery ||= () =>
    Array.from(
      (options?.parent || document).querySelectorAll(
        isCondition && !isSelector ? "*" : selectorOrCondition,
      ),
    );

  const toReturn = {
    value: undefined as Parameters<typeof setupFn>[0]["toReturn"]["value"],
  } as Parameters<typeof setupFn>[0]["toReturn"] | undefined;

  const getMatching = (
    elements: Node[] | NodeList = options.initialQuery(),
    shouldTestAgainstSelector = false,
  ) =>
    getMatchingElements<
      typeof setupFn extends SetupFn<infer ET> ? ET : Element
    >(
      selectorOrCondition,
      elements,
      isCondition,
      isSelector,
      shouldTestAgainstSelector,
    );
  const matchingElements = getMatching();

  for (let [idx, el] of matchingElements.entries()) {
    withArrayInfo(el, idx, matchingElements)(setupFn)({
      type: "initial",
      el,
      toReturn,
    });
  }

  createObserver(
    (mutations) => {
      for (let mutation of mutations) {
        const elements = [mutation.target, ...(mutation?.addedNodes || [])];
        const matchingElements = getMatching(elements, true);

        for (let [idx, el] of matchingElements.entries()) {
          withArrayInfo(
            el,
            idx,
            matchingElements,
          )(withMutationRecord(mutation)(setupFn))({
            type: "added",
            el,
            toReturn,
          });
        }

        const matchingRemoved = getMatching(mutation.removedNodes, true);
        for (let [idx, el] of matchingRemoved.entries()) {
          withArrayInfo(
            el,
            idx,
            matchingRemoved,
          )(withMutationRecord(mutation)(setupFn))({
            type: "removed",
            el,
            toReturn,
          });
        }
      }
    },
    {
      subtree: true,
      childList: true,
      attributes: true,
    },
    // @ts-ignore
  )(parent || document);

  return toReturn.value;
}

// Base interface, common to all calls
interface BaseCallArgs<El extends Element = Element> {
  el: El;
  type: 'initial' | 'added' | 'removed';
  idx: number;
  arr: ReadonlyArray<El>; // Use ReadonlyArray for safety
}

// Arguments for the initial setup calls
interface InitialCallArgs<El extends Element = Element> extends BaseCallArgs<El> {
  type: 'initial';
}

// Arguments for setup calls triggered by mutations
interface MutationCallArgs<El extends Element = Element> extends BaseCallArgs<El> {
  type: 'added' | 'removed';
  record: MutationRecord;
}

// Union type representing the arguments passed TO the runner function
type CallArgs<El extends Element = Element> = InitialCallArgs<El> | MutationCallArgs<El>;

// Updated FinalWatchArgs to extend BaseCallArgs instead of CallArgs
interface FinalWatchArgs<
  El extends Element = Element,
  StateType = Record<string, any> // Default state type
> extends BaseCallArgs<El> {
  state: StateType;
  on: ReturnType<typeof createOnFunction<El>>;
  style: ReturnType<typeof applyInlineStylesToElement>; // Might need check if El is HTMLElement
  cleanup: ReturnType<typeof createCleanupManager>;
  record?: MutationRecord; // Optional, as it's only present in MutationCallArgs
}

// Assuming these helper types/functions exist and are typed correctly:
// type OnFunction<El extends Element> = /* ... type for the 'on' helper ... */;
// type StyleFunction = /* ... type for the 'style' helper ... */;
// type CleanupFunction = (callback: () => void) => void;

// Example helpers (replace with your actual implementations/types)
declare function createOnFunction<El extends Element>(el: El): /* OnFunction<El> type */;
declare function applyInlineStylesToElement(el: HTMLElement): /* StyleFunction type */;
declare function createCleanupManager(el: Element): /* CleanupFunction type */;
declare function getStateManager<StateType = any>(el: Element): { state: StateType }; // Simplified state manager

type UserSetupFn<
  El extends Element = Element,
  StateType = Record<string, any>,
  ReturnType = unknown, // Allow users to return values if needed
> = (args: FinalWatchArgs<El, StateType>) => ReturnType;
// ArgsIn: The arguments this middleware receives
// ArgsOut: The arguments the *next* middleware/function expects (potentially augmented)
// ReturnType: The final return type of the user's setup function
type Middleware<
  ArgsIn extends CallArgs = CallArgs,
  ArgsOut extends CallArgs = CallArgs, // ArgsOut often extends ArgsIn
  ReturnType = unknown,
> = (
  next: (args: ArgsOut) => ReturnType, // The next function in the chain
) => (
  args: ArgsIn, // The arguments this middleware receives
) => ReturnType; // Returns the final result

// The function that watch() actually calls internally
type SetupFnRunner<El extends Element = Element, ReturnType = unknown> = (
  callArgs: CallArgs<El>,
) => ReturnType;

// Type for the options.wrapper function
type SetupWrapper<
  El extends Element = Element,
  StateType = Record<string, any>,
  ReturnType = unknown,
> = (
  // Takes the user's function expecting the final augmented args
  userSetupFn: UserSetupFn<El, StateType, ReturnType>,
) => SetupFnRunner<El, ReturnType>; // Returns the runner expecting initial CallArgs
function composeMiddleware<
  ArgsIn extends CallArgs,
  ArgsOut extends FinalWatchArgs,
  ReturnType,
>(
  middlewares: ReadonlyArray<Middleware<any, any, ReturnType>>, // Use 'any' for intermediate steps, rely on final function type
): (finalFn: (args: ArgsOut) => ReturnType) => (args: ArgsIn) => ReturnType {
  return (finalFn) => {
    if (middlewares.length === 0) {
      // If no middleware, the runner just calls the final function
      // We might need a slight adaptation if finalFn expects FinalWatchArgs
      // and the input is CallArgs. This might require a base adapter middleware.
      // For simplicity here, assume middleware handles the transformation.
      return finalFn as any; // Simplified for illustration
    }
    return middlewares.reduceRight(
      (nextMiddlewareOrFn, currentMiddleware) => {
        return currentMiddleware(nextMiddlewareOrFn);
      },
      finalFn, // Start with the user's function at the end of the chain
    ) as (args: ArgsIn) => ReturnType; // Cast the final composed function
  };
}
