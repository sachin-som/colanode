import { EntryType } from '@colanode/core';

export type EntryCreatedEvent = {
  type: 'entry_created';
  entryId: string;
  entryType: EntryType;
  rootId: string;
  workspaceId: string;
};

export type EntryUpdatedEvent = {
  type: 'entry_updated';
  entryId: string;
  entryType: EntryType;
  rootId: string;
  workspaceId: string;
};

export type EntryDeletedEvent = {
  type: 'entry_deleted';
  entryId: string;
  entryType: EntryType;
  rootId: string;
  workspaceId: string;
};

export type MessageCreatedEvent = {
  type: 'message_created';
  messageId: string;
  rootId: string;
  workspaceId: string;
};

export type MessageUpdatedEvent = {
  type: 'message_updated';
  messageId: string;
  rootId: string;
  workspaceId: string;
};

export type MessageDeletedEvent = {
  type: 'message_deleted';
  messageId: string;
  rootId: string;
  workspaceId: string;
};

export type MessageReactionCreatedEvent = {
  type: 'message_reaction_created';
  messageId: string;
  collaboratorId: string;
  rootId: string;
  workspaceId: string;
};

export type MessageReactionDeletedEvent = {
  type: 'message_reaction_deleted';
  messageId: string;
  collaboratorId: string;
  rootId: string;
  workspaceId: string;
};

export type CollaborationCreatedEvent = {
  type: 'collaboration_created';
  collaboratorId: string;
  entryId: string;
  workspaceId: string;
};

export type CollaborationUpdatedEvent = {
  type: 'collaboration_updated';
  collaboratorId: string;
  entryId: string;
  workspaceId: string;
};

export type FileCreatedEvent = {
  type: 'file_created';
  fileId: string;
  rootId: string;
  workspaceId: string;
};

export type FileUpdatedEvent = {
  type: 'file_updated';
  fileId: string;
  rootId: string;
  workspaceId: string;
};

export type FileDeletedEvent = {
  type: 'file_deleted';
  fileId: string;
  rootId: string;
  workspaceId: string;
};

export type InteractionUpdatedEvent = {
  type: 'interaction_updated';
  userId: string;
  entryId: string;
  rootId: string;
  workspaceId: string;
};

export type UserCreatedEvent = {
  type: 'user_created';
  userId: string;
  workspaceId: string;
  accountId: string;
};

export type UserUpdatedEvent = {
  type: 'user_updated';
  userId: string;
  workspaceId: string;
  accountId: string;
};

export type AccountUpdatedEvent = {
  type: 'account_updated';
  accountId: string;
};

export type WorkspaceCreatedEvent = {
  type: 'workspace_created';
  workspaceId: string;
};

export type WorkspaceUpdatedEvent = {
  type: 'workspace_updated';
  workspaceId: string;
};

export type WorkspaceDeletedEvent = {
  type: 'workspace_deleted';
  workspaceId: string;
};

export type DeviceDeletedEvent = {
  type: 'device_deleted';
  accountId: string;
  deviceId: string;
};

export type Event =
  | EntryCreatedEvent
  | EntryUpdatedEvent
  | EntryDeletedEvent
  | CollaborationCreatedEvent
  | CollaborationUpdatedEvent
  | InteractionUpdatedEvent
  | UserCreatedEvent
  | UserUpdatedEvent
  | AccountUpdatedEvent
  | WorkspaceCreatedEvent
  | WorkspaceUpdatedEvent
  | WorkspaceDeletedEvent
  | DeviceDeletedEvent
  | FileCreatedEvent
  | FileUpdatedEvent
  | FileDeletedEvent
  | MessageCreatedEvent
  | MessageUpdatedEvent
  | MessageDeletedEvent
  | MessageReactionCreatedEvent
  | MessageReactionDeletedEvent;
