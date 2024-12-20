import { NodeRole } from '@colanode/core';

export type NodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: NodeRole;
};

export type Download = {
  nodeId: string;
  uploadId: string;
  createdAt: string;
  updatedAt: string | null;
  progress: number;
  retryCount: number;
};

export type Upload = {
  nodeId: string;
  createdAt: string;
  updatedAt: string | null;
  progress: number;
  retryCount: number;
};
