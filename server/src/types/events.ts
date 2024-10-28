import { ServerNodeAttributes } from '@/types/nodes';

export type NodeEvent = NodeCreatedEvent | NodeUpdatedEvent | NodeDeletedEvent;

export type NodeCreatedEvent = {
  type: 'node_created';
  id: string;
  workspaceId: string;
  attributes: ServerNodeAttributes;
  createdBy: string;
  createdAt: string;
  serverCreatedAt: string;
  versionId: string;
};

export type NodeUpdatedEvent = {
  type: 'node_updated';
  id: string;
  workspaceId: string;
  beforeAttributes: ServerNodeAttributes;
  afterAttributes: ServerNodeAttributes;
  updatedBy: string;
  updatedAt: string;
  serverUpdatedAt: string;
  versionId: string;
};

export type NodeDeletedEvent = {
  type: 'node_deleted';
  id: string;
  workspaceId: string;
  attributes: ServerNodeAttributes;
  deletedAt: string;
};

export type SynapseNodeChangeMessage = {
  workspaceId: string;
  nodeId: string;
  type: 'node_create' | 'node_update' | 'node_delete';
};

export type SynapseNodeUserStateChangeMessage = {
  workspaceId: string;
  nodeId: string;
  userId: string;
  type: 'node_user_state_update';
};

export type SynapseMessage =
  | SynapseNodeChangeMessage
  | SynapseNodeUserStateChangeMessage;
