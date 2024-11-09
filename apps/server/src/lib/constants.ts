import { NodeRoles } from '@colanode/core';

export const hasAdminAccess = (role: string): boolean => {
  return role === NodeRoles.Admin;
};

export const hasEditorAccess = (role: string): boolean => {
  return role === NodeRoles.Admin || role === NodeRoles.Editor;
};

export const hasCollaboratorAccess = (role: string): boolean => {
  return (
    role === NodeRoles.Admin ||
    role === NodeRoles.Editor ||
    role === NodeRoles.Collaborator
  );
};

export const hasViewerAccess = (role: string): boolean => {
  return (
    role === NodeRoles.Admin ||
    role === NodeRoles.Editor ||
    role === NodeRoles.Collaborator ||
    role === NodeRoles.Viewer
  );
};
