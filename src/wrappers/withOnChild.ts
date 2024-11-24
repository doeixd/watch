import { createWrapper } from "./createWrapper";
import { BasicArgs } from "../watch2";

type BaseOnFunction = (event: string, handler: EventListener, options?: AddEventListenerOptions) => () => void;


type CleanupFn = (...args: any[]) => any
interface ChildOn extends BaseOnFunction {
  child: <ElementType extends Element, EventName extends keyof ElementEventMap>(
    selector: 'string',
    ...args: Parameters<ElementType["addEventListener"]>
  ) => void;
}

interface CleanupOn extends BaseOnFunction {
  cleanup: (handler: () => void) => void;
}




export const withOnChild = createWrapper(<T extends BasicArgs & { on: CleanupOn }>(args: T) => {
  const originalOn = args.on
  const enhancedOn: T['on'] & ChildOn = Object.assign(
    originalOn,
    {
      child: createChildOn(args.el)
    }
  )

})


export const createChildOn = (el: Element) => {
  return function () {

  }
  el.querySelectorAll()
}