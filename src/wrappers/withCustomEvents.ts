import { BasicArgs } from '../watch2';
import { createWrapper } from './createWrapper';

// Type for the enhanced 'on' function with custom event support
interface EnhancedOnWithCustom extends Function {
  (event: string, handler: EventListener, options?: AddEventListenerOptions): () => void;
  custom: <T = any>(
    eventName: string,
    handler: (detail: T, event: CustomEvent<T>) => void,
    options?: AddEventListenerOptions
  ) => () => void;
}

// Type for args that include the enhanced 'on' function
interface ArgsWithCustomEvents {
  on: EnhancedOnWithCustom;
}

type BaseOnFunction = (event: string, handler: EventListener, options?: AddEventListenerOptions) => () => void;

interface CleanupOn extends BaseOnFunction {
  cleanup: (handler: () => void) => void;
}
/**
 * Creates a wrapper that adds custom event support to the 'on' function.
 */
export const withCustomEvents = createWrapper(<T extends { on: BaseOnFunction, el: Element } & BasicArgs>(args: T): T & ArgsWithCustomEvents => {
  const originalOn = args.on;

  const enhancedOn: EnhancedOnWithCustom = Object.assign(
    originalOn,
    {
      custom: createOnCustomEvent(args)
    }
  )

  return { ...args, on: enhancedOn }
})

export function createOnCustomEvent<ArgsType extends { on: BaseOnFunction, el: Element }>(args: ArgsType) {
  return function onCustomEvent<T = any>(
    eventName: string,
    handler: (detail: T, event: CustomEvent<T>) => void,
    options?: AddEventListenerOptions
  ) {
    const wrappedHandler = (event: Event) => {
      if (event instanceof CustomEvent) {
        handler(event.detail, event);
      }
    };

    args.el.addEventListener(eventName, wrappedHandler, options);

    return () => args.el.removeEventListener(eventName, wrappedHandler);
  }
}