export type Node = {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  type: string;
  index?: string | null;
  attrs: any;
  content?: NodeBlock[] | null;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  versionId: string;
  state?: string | null;
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

export type CreateNodeInput = {
  id: string;
  type: string;
  parentId?: string | null;
  index?: string | null;
  attrs: any;
  content?: NodeBlock[] | null;
};

export type UpdateNodeInput = {
  id: string;
  parentId?: string | null;
  index?: string | null;
  attrs?: any | null;
  content?: NodeBlock[] | null;
};
