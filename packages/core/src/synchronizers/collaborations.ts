import { EntryRole } from '../registry/core';

export type SyncCollaborationsInput = {
  type: 'collaborations';
};

export type SyncCollaborationData = {
  collaboratorId: string;
  entryId: string;
  workspaceId: string;
  role: EntryRole;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  version: string;
};

declare module '@colanode/core' {
  interface SynchronizerMap {
    collaborations: {
      input: SyncCollaborationsInput;
      data: SyncCollaborationData;
    };
  }
}
