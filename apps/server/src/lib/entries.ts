import {
  extractEntryCollaborators,
  extractEntryRole,
  Entry,
  EntryOutput,
  EntryRole,
  EntryType,
} from '@colanode/core';

import { database } from '@/data/database';
import { SelectEntry } from '@/data/schema';
import { EntryCollaborator } from '@/types/entries';

export const mapEntryOutput = (entry: SelectEntry): EntryOutput => {
  return {
    id: entry.id,
    parentId: entry.parent_id,
    workspaceId: entry.workspace_id,
    type: entry.type,
    attributes: entry.attributes,
    state: '',
    createdAt: entry.created_at.toISOString(),
    createdBy: entry.created_by,
    transactionId: entry.transaction_id,
    updatedAt: entry.updated_at?.toISOString() ?? null,
    updatedBy: entry.updated_by ?? null,
  };
};

export const mapEntry = (entry: SelectEntry): Entry => {
  return {
    id: entry.id,
    parentId: entry.parent_id,
    rootId: entry.root_id,
    type: entry.type as EntryType,
    attributes: entry.attributes,
    createdAt: entry.created_at.toISOString(),
    createdBy: entry.created_by,
    updatedAt: entry.updated_at?.toISOString() ?? null,
    updatedBy: entry.updated_by ?? null,
    transactionId: entry.transaction_id,
  } as Entry;
};

export const fetchEntry = async (
  entryId: string
): Promise<SelectEntry | null> => {
  const result = await database
    .selectFrom('entries')
    .selectAll()
    .where('id', '=', entryId)
    .executeTakeFirst();

  return result ?? null;
};

export const fetchEntryAncestors = async (
  entryId: string
): Promise<SelectEntry[]> => {
  const result = await database
    .selectFrom('entries')
    .selectAll()
    .innerJoin('entry_paths', 'entries.id', 'entry_paths.ancestor_id')
    .where('entry_paths.descendant_id', '=', entryId)
    .orderBy('entry_paths.level', 'desc')
    .execute();

  return result;
};

export const fetchEntryDescendants = async (
  entryId: string
): Promise<string[]> => {
  const result = await database
    .selectFrom('entry_paths')
    .select('descendant_id')
    .where('ancestor_id', '=', entryId)
    .orderBy('level', 'asc')
    .execute();

  return result.map((row) => row.descendant_id);
};

export const fetchEntryCollaborators = async (
  entryId: string
): Promise<EntryCollaborator[]> => {
  const ancestors = await fetchEntryAncestors(entryId);
  const collaboratorsMap = new Map<string, string>();

  for (const ancestor of ancestors) {
    const collaborators = extractEntryCollaborators(ancestor.attributes);
    for (const [collaboratorId, role] of Object.entries(collaborators)) {
      collaboratorsMap.set(collaboratorId, role);
    }
  }

  return Array.from(collaboratorsMap.entries()).map(
    ([collaboratorId, role]) => ({
      entryId: entryId,
      collaboratorId: collaboratorId,
      role: role,
    })
  );
};

export const fetchEntryRole = async (
  entryId: string,
  collaboratorId: string
): Promise<EntryRole | null> => {
  const ancestors = await fetchEntryAncestors(entryId);
  if (ancestors.length === 0) {
    return null;
  }

  return extractEntryRole(ancestors.map(mapEntry), collaboratorId);
};
