import { InteractionEvent } from './interactions';
import {
  ServerCollaboration,
  ServerDeletedCollaboration,
  ServerInteraction,
  ServerTransaction,
  ServerUser,
  SyncConsumerType,
} from './sync';

export type TransactionsBatchMessage = {
  type: 'transactions_batch';
  userId: string;
  transactions: ServerTransaction[];
};

export type DeletedCollaborationsBatchMessage = {
  type: 'deleted_collaborations_batch';
  userId: string;
  deletedCollaborations: ServerDeletedCollaboration[];
};

export type CollaborationsBatchMessage = {
  type: 'collaborations_batch';
  userId: string;
  collaborations: ServerCollaboration[];
};

export type InteractionsBatchMessage = {
  type: 'interactions_batch';
  userId: string;
  interactions: ServerInteraction[];
};

export type UsersBatchMessage = {
  type: 'users_batch';
  userId: string;
  users: ServerUser[];
};

export type SyncInteractionsMessage = {
  type: 'sync_interactions';
  userId: string;
  nodeId: string;
  events: InteractionEvent[];
};

export type InitSyncConsumerMessage = {
  type: 'init_sync_consumer';
  userId: string;
  consumerType: SyncConsumerType;
  cursor: string;
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
  | TransactionsBatchMessage
  | CollaborationsBatchMessage
  | DeletedCollaborationsBatchMessage
  | InteractionsBatchMessage
  | UsersBatchMessage
  | SyncInteractionsMessage
  | InitSyncConsumerMessage
  | AccountUpdatedMessage
  | WorkspaceUpdatedMessage
  | WorkspaceDeletedMessage;
