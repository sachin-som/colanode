export type ServerNode = {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  type: string;
  index: string | null;
  attributes: ServerNodeAttributes | null;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  versionId: string;
  serverCreatedAt: string;
  serverUpdatedAt?: string | null;
};

export type ServerNodeAttributes = {
  type: string;
  parentId?: string | null;
  index?: string | null;
  content?: NodeBlock[] | null;
  [key: string]: any;
};

export type ServerNodeReaction = {
  nodeId: string;
  reactorId: string;
  reaction: string;
  workspaceId: string;
  createdAt: string;
  serverCreatedAt: string;
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
