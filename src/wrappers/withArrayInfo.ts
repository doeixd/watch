import { createWrapper } from './createWrapper';

// Define the structure of the pos object
interface ArrayPosition<T> {
  item: T;
  index: number;
  array: T[];
}

// Define the type for args that include the pos object
export interface ArgsWithArrayInfo<T> {
  pos: ArrayPosition<T>;
}

// Create the withArrayInfo wrapper
export function withArrayInfo<T>(item?: T, index?: number, array?: T[]) {
  return createWrapper(<Args extends {el: Element}>(args: Args): Args & ArgsWithArrayInfo<T> => {
    const pos = { item, index, array }
    pos.item ??= args.el as unknown as T
    pos.index ??= 0
    pos.array ??= [args.el as unknown as T]

    return {
      ...args,
      pos,
    };
  });
}


