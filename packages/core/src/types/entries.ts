import { EntryAttributes } from '../registry';

export type EntryOutput = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  type: string;
  attributes: EntryAttributes;
  state: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  transactionId: string;
};
