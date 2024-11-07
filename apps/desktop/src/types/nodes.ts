import { NodeAttributes } from '@colanode/core';

export type ServerNode = {
  id: string;
  parentId: string | null;
  type: string;
  index: string | null;
  attributes: NodeAttributes;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
};

export type NodeCollaboratorsWrapper = {
  direct: NodeCollaborator[];
  inherit: InheritNodeCollaboratorsGroup[];
};

export type InheritNodeCollaboratorsGroup = {
  id: string;
  name: string;
  avatar: string | null;
  collaborators: NodeCollaborator[];
};

export type NodeCollaborator = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
};
