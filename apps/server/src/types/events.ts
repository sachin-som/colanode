import { NodeType } from '@colanode/core';

export type NodeCreatedEvent = {
  type: 'node_created';
  nodeId: string;
  nodeType: NodeType;
  rootId: string;
  workspaceId: string;
};

export type NodeUpdatedEvent = {
  type: 'node_updated';
  nodeId: string;
  nodeType: NodeType;
  rootId: string;
  workspaceId: string;
};

export type NodeDeletedEvent = {
  type: 'node_deleted';
  nodeId: string;
  nodeType: NodeType;
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
  nodeId: string;
  workspaceId: string;
};

export type CollaborationUpdatedEvent = {
  type: 'collaboration_updated';
  collaboratorId: string;
  nodeId: string;
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
  nodeId: string;
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
  | NodeCreatedEvent
  | NodeUpdatedEvent
  | NodeDeletedEvent
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
