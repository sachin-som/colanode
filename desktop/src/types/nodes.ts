export type Node = {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  type: string;
  index?: string | null;
  attrs?: Record<string, any> | null;
  content?: NodeBlock[] | null;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  versionId: string;
  serverCreatedAt?: Date | null;
  serverUpdatedAt?: Date | null;
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

export type NodeWithChildren = Node & {
  children: NodeWithChildren[];
};
