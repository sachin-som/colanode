import { Entry, EntryAttributes } from '@colanode/core';

import { SelectEntry, SelectEntryTransaction } from '@/data/schema';

export type EntryCollaborator = {
  entryId: string;
  collaboratorId: string;
  role: string;
};

export type CreateEntryInput = {
  entryId: string;
  rootId: string;
  attributes: EntryAttributes;
  userId: string;
  workspaceId: string;
  ancestors: Entry[];
};

export type CreateEntryOutput = {
  entry: SelectEntry;
  transaction: SelectEntryTransaction;
};

export type UpdateEntryInput = {
  entryId: string;
  userId: string;
  workspaceId: string;
  updater: (attributes: EntryAttributes) => EntryAttributes | null;
};

export type UpdateEntryOutput = {
  entry: SelectEntry;
  transaction: SelectEntryTransaction;
};

export type ApplyCreateTransactionInput = {
  id: string;
  entryId: string;
  rootId: string;
  data: string | Uint8Array;
  createdAt: Date;
};

export type ApplyCreateTransactionOutput = {
  entry: SelectEntry;
  transaction: SelectEntryTransaction;
};

export type ApplyUpdateTransactionInput = {
  id: string;
  entryId: string;
  rootId: string;
  userId: string;
  data: string | Uint8Array;
  createdAt: Date;
};

export type ApplyUpdateTransactionOutput = {
  entry: SelectEntry;
  transaction: SelectEntryTransaction;
};

export type ApplyDeleteTransactionInput = {
  id: string;
  entryId: string;
  rootId: string;
  createdAt: Date;
};

export type ApplyDeleteTransactionOutput = {
  entry: SelectEntry;
  transaction: SelectEntryTransaction;
};
