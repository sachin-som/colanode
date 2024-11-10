import { NodeAttributes } from '@colanode/core';

export type NodeEvent = NodeCreatedEvent | NodeUpdatedEvent | NodeDeletedEvent;

export type NodeCreatedEvent = {
  type: 'node_created';
  id: string;
  workspaceId: string;
  attributes: NodeAttributes;
  createdBy: string;
  createdAt: string;
  serverCreatedAt: string;
  versionId: string;
};

export type NodeUpdatedEvent = {
  type: 'node_updated';
  id: string;
  workspaceId: string;
  beforeAttributes: NodeAttributes;
  afterAttributes: NodeAttributes;
  updatedBy: string;
  updatedAt: string;
  serverUpdatedAt: string;
  versionId: string;
};

export type NodeDeletedEvent = {
  type: 'node_deleted';
  id: string;
  workspaceId: string;
  attributes: NodeAttributes;
  deletedAt: string;
};
