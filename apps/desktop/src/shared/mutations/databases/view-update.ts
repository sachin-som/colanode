import { DatabaseViewAttributes } from '@colanode/core';

export type ViewUpdateMutationInput = {
  type: 'view_update';
  accountId: string;
  workspaceId: string;
  viewId: string;
  view: DatabaseViewAttributes;
};

export type ViewUpdateMutationOutput = {
  id: string;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    view_update: {
      input: ViewUpdateMutationInput;
      output: ViewUpdateMutationOutput;
    };
  }
}
