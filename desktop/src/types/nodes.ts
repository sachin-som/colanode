export type Node = {
  id: string;
  workspaceId: string;
  parentId?: string;
  type: string;
  attrs: any;
  content?: NodeContent[] | null;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  versionId: string;
};

export type NodeContent = {
  type: string;
  id?: string | null;
  text?: string | null;
  marks?: NodeContentMark[];
};

export type NodeContentMark = {
  type: string;
  attrs: any;
};

export type NodeTree = {
  id: string;
  workspaceId: string;
  parentId?: string;
  type: string;
  attrs: any;
  content: NodeContentTree[] | null;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  versionId: string;
};

export type NodeContentTree = {
  type: string;
  text?: string | null;
  marks?: NodeContentMark[];
  node?: NodeTree;
};
