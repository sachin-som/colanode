import { NodeType } from '@colanode/core';

export type NodeCreatedEvent = {
  type: 'node_created';
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
};

export type NodeUpdatedEvent = {
  type: 'node_updated';
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
};

export type NodeDeletedEvent = {
  type: 'node_deleted';
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
};

export type CollaboratorAddedEvent = {
  type: 'collaborator_added';
  userId: string;
  nodeId: string;
};

export type CollaboratorRemovedEvent = {
  type: 'collaborator_removed';
  userId: string;
  nodeId: string;
};

export type InteractionUpdatedEvent = {
  type: 'interaction_updated';
  userId: string;
  nodeId: string;
  nodeType: NodeType;
  workspaceId: string;
};

export type WorkspaceUserCreatedEvent = {
  type: 'workspace_user_created';
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
  | CollaboratorAddedEvent
  | CollaboratorRemovedEvent
  | InteractionUpdatedEvent
  | WorkspaceUserCreatedEvent
  | AccountUpdatedEvent
  | WorkspaceCreatedEvent
  | WorkspaceUpdatedEvent
  | WorkspaceDeletedEvent
  | DeviceDeletedEvent;
