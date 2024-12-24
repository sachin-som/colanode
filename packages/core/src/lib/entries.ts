import { generateKeyBetween } from 'fractional-indexing-jittered';

import { Entry, EntryAttributes, EntryRole } from '../index';

export const extractEntryCollaborators = (
  attributes: EntryAttributes | EntryAttributes[]
): Record<string, EntryRole> => {
  const items = Array.isArray(attributes) ? attributes : [attributes];
  const collaborators: Record<string, EntryRole> = {};

  for (const item of items) {
    if ('collaborators' in item && item.collaborators) {
      for (const [collaboratorId, role] of Object.entries(item.collaborators)) {
        collaborators[collaboratorId] = role as EntryRole;
      }
    }
  }

  return collaborators;
};

export const extractEntryName = (
  attributes: EntryAttributes
): string | null => {
  if ('name' in attributes && attributes.name) {
    return attributes.name as string;
  }

  return null;
};

export const extractEntryRole = (
  tree: Entry | Entry[],
  collaboratorId: string
): EntryRole | null => {
  const entries = Array.isArray(tree) ? tree : [tree];
  let role: EntryRole | null = null;
  for (const entry of entries) {
    const collaborators = extractEntryCollaborators(entry.attributes);
    const collaboratorRole = collaborators[collaboratorId];
    if (collaboratorRole) {
      role = collaboratorRole;
    }
  }

  return role;
};

export const hasAdminAccess = (role: EntryRole | null): boolean => {
  return role === 'admin';
};

export const hasEditorAccess = (role: EntryRole | null): boolean => {
  return role === 'admin' || role === 'editor';
};

export const hasCollaboratorAccess = (role: EntryRole | null): boolean => {
  return role === 'admin' || role === 'editor' || role === 'collaborator';
};

export const hasViewerAccess = (role: EntryRole | null): boolean => {
  return (
    role === 'admin' ||
    role === 'editor' ||
    role === 'collaborator' ||
    role === 'viewer'
  );
};

export const generateNodeIndex = (
  previous?: string | null,
  next?: string | null
) => {
  const lower = previous === undefined ? null : previous;
  const upper = next === undefined ? null : next;

  return generateKeyBetween(lower, upper);
};
