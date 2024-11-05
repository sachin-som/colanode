export type ServerNode = {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  type: string;
  index: string | null;
  attributes: ServerNodeAttributes;
  state: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  versionId: string;
  serverCreatedAt: Date;
  serverUpdatedAt?: Date | null;
};

export type ServerNodeAttributes = {
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

export type NodeCollaborator = {
  nodeId: string;
  collaboratorId: string;
  role: string;
};
