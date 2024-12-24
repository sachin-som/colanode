import { EntryRole } from '@colanode/core';

export type EntryCollaborator = {
  entryId: string;
  collaboratorId: string;
  role: EntryRole;
};
