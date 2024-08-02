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
  marks?: NodeContentMarks[];
};

export type NodeContentMarks = {
  type: string;
  attrs: any;
}