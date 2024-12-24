import { extractEntryCollaborators, Entry, EntryType } from '@colanode/core';

import { EntryCollaborator } from '@/shared/types/entries';

export const getDefaultEntryIcon = (type: EntryType) => {
  switch (type) {
    case 'channel':
      return 'discuss-line';
    case 'page':
      return 'book-line';
    case 'database':
      return 'database-2-line';
    case 'record':
      return 'article-line';
    case 'folder':
      return 'folder-open-line';
    case 'space':
      return 'team-line';
    default:
      return 'file-unknown-line';
  }
};

export const buildEntryCollaborators = (
  entries: Entry[]
): EntryCollaborator[] => {
  const collaborators: Record<string, EntryCollaborator> = {};

  for (const entry of entries) {
    const entryCollaborators = extractEntryCollaborators(entry.attributes);

    for (const [collaboratorId, role] of Object.entries(entryCollaborators)) {
      collaborators[collaboratorId] = {
        entryId: entry.id,
        collaboratorId,
        role,
      };
    }
  }

  return Object.values(collaborators);
};
