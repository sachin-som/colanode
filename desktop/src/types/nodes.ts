export type Node = {
  id: string;
  workspaceId: string;
  parentId?: string;
  type: string;
  attrs: any;
  content?: any;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  versionId: string;
};