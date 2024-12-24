import { EntryRoles } from '@colanode/core';

export const hasAdminAccess = (role: string): boolean => {
  return role === EntryRoles.Admin;
};

export const hasEditorAccess = (role: string): boolean => {
  return role === EntryRoles.Admin || role === EntryRoles.Editor;
};

export const hasCollaboratorAccess = (role: string): boolean => {
  return (
    role === EntryRoles.Admin ||
    role === EntryRoles.Editor ||
    role === EntryRoles.Collaborator
  );
};

export const hasViewerAccess = (role: string): boolean => {
  return (
    role === EntryRoles.Admin ||
    role === EntryRoles.Editor ||
    role === EntryRoles.Collaborator ||
    role === EntryRoles.Viewer
  );
};
