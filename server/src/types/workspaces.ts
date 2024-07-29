export enum WorkspaceStatus {
  Active = 1,
  Inactive = 2
}

export type Workspace = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  status: WorkspaceStatus;
};

export type WorkspaceInput = {
  name: string;
  description?: string | null;
};

export type WorkspaceOutput = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
};