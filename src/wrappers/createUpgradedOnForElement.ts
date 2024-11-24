import { createOn, withOn } from "./withOn";
import { createOnAttr, withAttributeChange } from "./withAttributeChanged";
import { createOnCustomEvent, withCustomEvents } from "./withCustomEvents";
import { createOnTextChange, withTextChange } from "./withTextChanged";
import { createCleanupFnForEl, withCleanup } from "./withCleanup";
import { BasicArgs, watch } from "../watch2";
import { pipe } from "../utils/pipe";
import { createWrapper } from "./createWrapper";


const withReturnOn = createWrapper((args) => {
  // @ts-expect-error
  args.toReturn.value = args.on

  return args
})


export function createUpgradedOnForElement<ElementType extends Element>(element: ElementType) {

  const identity = (_: BasicArgs = {} as BasicArgs) => _

  const conditionFn = (foundFromQueryEl, match) => {
    if (Object.is(foundFromQueryEl, element)) match(element)
  }

  const initialQuery = () => [element]

  // const wrapper = [ withOn, withCleanup, withTextChange, withAttributeChange, withCustomEvents].reduce((acc, cur) => cur(acc), identity)
  const adHocSetupFn = pipe(identity, withOn, withCleanup, withTextChange, withAttributeChange, withCustomEvents, withReturnOn)
  const h = withOn(identity)({})
  
  
  const result = watch(conditionFn, adHocSetupFn, { initialQuery })

  withCleanup(() =>)
  const on = createOn(element)
  createOnAttr({el: element, on })


}