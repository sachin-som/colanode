export type LocalNode = {
  id: string;
  parentId: string | null;
  type: string;
  index: string | null;
  attributes: LocalNodeAttributes;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
  serverVersionId: string | null;
};

export type LocalNodeAttributes = {
  type: string;
  parentId?: string | null;
  index?: string | null;
  content?: NodeBlock[] | null;
  [key: string]: any;
};

export type NodeBlock = {
  type: string;
  text?: string | null;
  marks?: NodeBlockMark[];
};

export type NodeBlockMark = {
  type: string;
  attrs: any;
};

export type LocalNodeWithChildren = LocalNode & {
  children: LocalNodeWithChildren[];
};

export type ServerNode = {
  id: string;
  parentId: string | null;
  type: string;
  index: string | null;
  attributes: ServerNodeAttributes;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
};

export type ServerNodeAttributes = {
  type: string;
  parentId?: string | null;
  index?: string | null;
  content?: NodeBlock[] | null;
  [key: string]: any;
};

export type ServerNodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: string;
  workspaceId: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  versionId: string;
  serverCreatedAt: string;
  serverUpdatedAt?: string | null;
};

export type ServerNodeReaction = {
  nodeId: string;
  reactorId: string;
  reaction: string;
  workspaceId: string;
  createdAt: string;
  serverCreatedAt: string;
};

export type NodeInsertInput = {
  id: string;
  attributes: LocalNodeAttributes;
};

export type NodeCollaboratorsWrapper = {
  direct: NodeCollaboratorNode[];
  inherit: InheritNodeCollaboratorsGroup[];
};

export type InheritNodeCollaboratorsGroup = {
  id: string;
  name: string;
  avatar: string | null;
  collaborators: NodeCollaboratorNode[];
};

export type NodeCollaboratorNode = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
};
