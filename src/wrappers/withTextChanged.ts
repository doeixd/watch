import { BasicArgs } from '../watch2';
import { createWrapper } from './createWrapper';

// Base types
type BaseOnFunction = (event: string, handler: EventListener, options?: AddEventListenerOptions) => () => void;

interface BaseArgs extends BasicArgs{
  el: Element;
}

// Enhanced types for text change
interface TextChangeOn extends BaseOnFunction {
  text: (handler: (text: string) => void) => () => void;
}

interface CleanupOn extends BaseOnFunction {
  cleanup: (handler: () => void) => void;
}

interface ArgsWithTextChange extends BaseArgs {
  on: TextChangeOn;
}

// Enhanced types for attribute change
interface AttributeChangeOn extends BaseOnFunction {
  attr: (
    attributeOrPredicate: string | RegExp | ((name: string, value: string | null) => boolean),
    handler: (name: string, value: string | null) => void
  ) => () => void;
}

interface ArgsWithAttributeChange extends BaseArgs {
  on: AttributeChangeOn;
}

export const withTextChange = createWrapper(<T extends BaseArgs & { on: CleanupOn }>(args: T) => {
  const originalOn = args.on;
  const enhancedOn: T['on'] & TextChangeOn = Object.assign(
    originalOn,
    {
      text: createOnTextChange(args) 
    }
  )
  return { ...args, on: enhancedOn }
})


export function createOnTextChange<ArgsType extends BaseArgs & { on: CleanupOn }>(args: ArgsType) {
  return (handler: (text: string, mutation: MutationRecord) => void) => {
    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          handler(args.el.textContent || '', mutation);
        }
      }
    });
    observer.observe(args.el, { characterData: true, childList: true, subtree: true, characterDataOldValue: true, });
    let remove = () => observer.disconnect();

    args.on.cleanup(remove)

    return remove
  }
}