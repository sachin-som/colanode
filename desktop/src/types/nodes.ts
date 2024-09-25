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

export type NodeInsertInput = {
  id: string;
  attributes: LocalNodeAttributes;
};
