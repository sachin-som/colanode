export type LocalNode = {
  id: string;
  parentId: string | null;
  type: string;
  index: string | null;
  content: NodeBlock[] | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
  serverVersionId: string | null;
};

export type LocalNodeAttribute = {
  nodeId: string;
  type: string;
  key: string;
  textValue: string | null;
  numberValue: number | null;
  foreignNodeId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
  serverVersionId: string | null;
};

export type LocalNodeWithAttributes = LocalNode & {
  attributes: LocalNodeAttribute[];
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

export type LocalNodeWithAttributesAndChildren = LocalNodeWithAttributes & {
  children: LocalNodeWithAttributesAndChildren[];
};

export type ServerNode = {
  id: string;
  parentId: string | null;
  type: string;
  index: string | null;
  content: NodeBlock[] | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
};

export type ServerNodeAttribute = {
  id: string;
  nodeId: string;
  type: string;
  key: string;
  textValue: string | null;
  numberValue: number | null;
  foreignNodeId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  versionId: string;
  serverCreatedAt: string | null;
  serverUpdatedAt: string | null;
};
