import { WorkspaceReadState } from '@/shared/types/radars';

export type ReadStatesGetQueryInput = {
  type: 'read_states_get';
};

declare module '@/shared/queries' {
  interface QueryMap {
    read_states_get: {
      input: ReadStatesGetQueryInput;
      output: Record<string, WorkspaceReadState>;
    };
  }
}
