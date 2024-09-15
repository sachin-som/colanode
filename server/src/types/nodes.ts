export type ServerNode = {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  type: string;
  index: string | null;
  content?: NodeBlock[] | null;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  versionId: string;
  serverCreatedAt: string;
  serverUpdatedAt?: string | null;
};

export type ServerNodeAttribute = {
  nodeId: string;
  type: string;
  key: string;
  workspaceId: string;
  textValue: string | null;
  numberValue: number | null;
  foreignNodeId: string | null;
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

export type NodeBlock = {
  type: string;
  text?: string | null;
  marks?: NodeBlockMark[];
};

export type NodeBlockMark = {
  type: string;
  attrs: any;
};
