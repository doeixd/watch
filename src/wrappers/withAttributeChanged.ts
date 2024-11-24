import { BasicArgs } from "../watch2";
import { createWrapper } from "./createWrapper";

type BaseOnFunction = (event: string, handler: EventListener, options?: AddEventListenerOptions) => () => void;


interface AttributeChangeOn extends BaseOnFunction {
  attr: (
    attributeOrPredicate: string | RegExp | ((name: string, value: string | null) => boolean),
    handler: (name: string, value: string | null) => void
  ) => () => void;
}

interface CleanupOn extends BaseOnFunction {
  cleanup: (handler: () => void) => void;
}

export const withAttributeChange = createWrapper(<T extends BasicArgs & { on: CleanupOn }>(args: T) => {
  const originalOn = args.on;
  const enhancedOn: T['on'] & AttributeChangeOn = Object.assign(
    originalOn,
    {
      attr: createOnAttr(args)
    }
  )
  return { ...args, on: enhancedOn }
})



export function createOnAttr<ArgsType extends BasicArgs & { on: CleanupOn }>(
  args: ArgsType
) {
  return function onAttr(
    attributeOrPredicate: string | RegExp | ((name: string, value: string | null) => boolean),
    handler: (name: string, value: string | null, record: MutationRecord) => void,
  ) {
    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.type === 'attributes') {
          const name = mutation.attributeName || '';
          const value = args.el.getAttribute(name);
          if (typeof attributeOrPredicate === 'string' && name === attributeOrPredicate) {
            handler(name, value, mutation);
          } else if (attributeOrPredicate instanceof RegExp && attributeOrPredicate.test(name)) {
            handler(name, value, mutation);
          } else if (typeof attributeOrPredicate === 'function' && attributeOrPredicate(name, value)) {
            handler(name, value, mutation);
          }
        }
      }
    })

    observer.observe(args.el, { attributes: true, attributeOldValue: true });
    let remove = () => observer.disconnect()
    args.on.cleanup(remove)
    return remove
  }
}