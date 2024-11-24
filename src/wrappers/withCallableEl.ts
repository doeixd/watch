import { BasicArgs } from "../watch2";
import { createWrapper } from "./createWrapper";





export const withCallableEl = createWrapper(<T extends {el: HTMLElement} & BasicArgs>(args: T): T & { el: typeof callableEl } => {

  return args
})


function defaultCallFn  <TargetType extends Element, ThisType extends object = object>(target: TargetType, thisArg: ThisType, argumentsList: Parameters<TargetType['querySelectorAll']>) {
  
  // @ts-expect-error
  const matchingElements = Array.from(target.querySelectorAll(...argumentsList))

  const proxiedMatchingElemetns = []
  for (let matchingElement of matchingElements) {
    matchingElement


  }

  console.log("Function called with arguments:", argumentsList);
  return "Callable object result";
}

// : ElementType & typeof element.querySelectorAll 
function createCallableEl<ElementType extends Element, WhenCalledFn extends ProxyHandler<ElementType>['apply'] = typeof defaultCallFn<ElementType>>(element: ElementType, whenCalled?: WhenCalledFn) {
  const handler = typeof whenCalled == 'undefined' ? defaultCallFn<ElementType> : whenCalled

  const callableEl = new Proxy(element, {
    apply: handler
  })

  return callableEl
}

