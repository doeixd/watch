import { createWrapper } from './createWrapper';

// Define the type for args that include the mutation record
export interface ArgsWithMutation {
  mutation: MutationRecord;
}

/**
 * Creates a wrapper that adds MutationRecord information to the args.
 * 
 * @param mutation - The MutationRecord to be added to the args
 * @returns A wrapper function that adds the mutation to the args
 */
export function withMutationRecord(mutation: MutationRecord) {
  return createWrapper(<Args extends object>(args: Args): Args & ArgsWithMutation => {
    return {
      ...args,
      mutation,
    }
  })
}