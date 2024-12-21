import { InteractionEvent } from './interactions';
import {
  ServerCollaboration,
  ServerInteraction,
  ServerTransaction,
  ServerUser,
} from './sync';

export type TransactionsBatchMessage = {
  type: 'transactions_batch';
  userId: string;
  rootId: string;
  transactions: ServerTransaction[];
};

export type CollaborationsBatchMessage = {
  type: 'collaborations_batch';
  userId: string;
  collaborations: ServerCollaboration[];
};

export type InteractionsBatchMessage = {
  type: 'interactions_batch';
  userId: string;
  rootId: string;
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
  rootId: string;
  events: InteractionEvent[];
};

export type ConsumeUsersMessage = {
  type: 'consume_users';
  userId: string;
  cursor: string;
};

export type ConsumeCollaborationsMessage = {
  type: 'consume_collaborations';
  userId: string;
  cursor: string;
};

export type ConsumeInteractionsMessage = {
  type: 'consume_interactions';
  userId: string;
  rootId: string;
  cursor: string;
};

export type ConsumeTransactionsMessage = {
  type: 'consume_transactions';
  userId: string;
  rootId: string;
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
  | InteractionsBatchMessage
  | UsersBatchMessage
  | SyncInteractionsMessage
  | ConsumeUsersMessage
  | ConsumeCollaborationsMessage
  | ConsumeInteractionsMessage
  | ConsumeTransactionsMessage
  | AccountUpdatedMessage
  | WorkspaceUpdatedMessage
  | WorkspaceDeletedMessage;
