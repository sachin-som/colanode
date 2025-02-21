export interface BaseMetadata {
  id: string;
  name?: string | null;
  createdAt: Date | null;
  createdBy: string;
  updatedAt?: Date | null;
  updatedBy?: string | null;
  author?: { id: string; name: string };
  lastAuthor?: { id: string; name: string };
  workspace?: { id: string; name: string };
  parentContext?: {
    id: string;
    type: string;
    name?: string | null;
    path: string;
  };
  collaborators?: Array<{ id: string; name: string }>;
  databaseInfo?: {
    id: string;
    name: string;
    fields: Record<string, { type: string; name: string }>;
  };
}

export type NodeMetadata = BaseMetadata & {
  type: 'node';
  nodeType: string;
  fieldInfo?: Record<string, { type: string; name: string }>;
};

export type DocumentMetadata = BaseMetadata & {
  type: 'document';
};
