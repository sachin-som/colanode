import { InteractionEvent } from './interactions';

import { SynchronizerInput, SynchronizerMap } from '../synchronizers';

export type SynchronizerInputMessage = {
  type: 'synchronizer_input';
  userId: string;
  id: string;
  input: SynchronizerInput;
  cursor: string;
};

export type SynchronizerOutputMessage<TInput extends SynchronizerInput> = {
  type: 'synchronizer_output';
  userId: string;
  id: string;
  items: {
    cursor: string;
    data: SynchronizerMap[TInput['type']]['data'];
  }[];
};

export type SyncInteractionsMessage = {
  type: 'sync_interactions';
  userId: string;
  nodeId: string;
  rootId: string;
  events: InteractionEvent[];
};

export type AccountUpdatedMessage = {
  type: 'account_updated';
  accountId: string;
};

export type WorkspaceUpdatedMessage = {
  type: 'workspace_updated';
  workspaceId: string;
};

export type WorkspaceDeletedMessage = {
  type: 'workspace_deleted';
  accountId: string;
};

export type Message =
  | SyncInteractionsMessage
  | AccountUpdatedMessage
  | WorkspaceUpdatedMessage
  | WorkspaceDeletedMessage
  | SynchronizerInputMessage
  | SynchronizerOutputMessage<SynchronizerInput>;
