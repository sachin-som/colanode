import { NodeRole } from '@colanode/core';

export type NodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: NodeRole;
};
