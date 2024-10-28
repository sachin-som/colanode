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
  content?: Record<string, NodeBlock> | null;
  [key: string]: any;
};

export type NodeBlock = {
  id: string;
  type: string;
  index: string;
  parentId: string;
  content: NodeBlockContent[] | null;
  attrs: Record<string, any> | null;
};

export type NodeBlockContent = {
  type: string;
  text?: string | null;
  marks?: NodeBlocContentkMark[];
};

export type NodeBlocContentkMark = {
  type: string;
  attrs: Record<string, any>;
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
  content?: NodeBlockContent[] | null;
  [key: string]: any;
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
