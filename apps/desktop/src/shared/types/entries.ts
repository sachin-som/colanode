import { EntryRole } from '@colanode/core';

export type EntryCollaborator = {
  entryId: string;
  collaboratorId: string;
  role: EntryRole;
};

export type EntryInteraction = {
  entryId: string;
  collaboratorId: string;
  rootId: string;
  lastSeenAt: string | null;
  firstSeenAt: string | null;
  lastOpenedAt: string | null;
  firstOpenedAt: string | null;
  version: bigint;
};
