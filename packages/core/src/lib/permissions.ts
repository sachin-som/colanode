import { extractNodeRole, Node, WorkspaceRole, NodeRole } from '../index';

export type UserInput = {
  userId: string;
  role: WorkspaceRole;
};

export const hasWorkspaceRole = (
  currentRole: WorkspaceRole,
  targetRole: WorkspaceRole
) => {
  if (targetRole === 'owner') {
    return currentRole === 'owner';
  }

  if (targetRole === 'admin') {
    return currentRole === 'admin' || currentRole === 'owner';
  }

  if (targetRole === 'collaborator') {
    return (
      currentRole === 'admin' ||
      currentRole === 'collaborator' ||
      currentRole === 'owner'
    );
  }

  if (targetRole === 'guest') {
    return (
      currentRole === 'admin' ||
      currentRole === 'owner' ||
      currentRole === 'collaborator' ||
      currentRole === 'guest'
    );
  }

  return false;
};

export const hasNodeRole = (currentRole: NodeRole, targetRole: NodeRole) => {
  if (targetRole === 'admin') {
    return currentRole === 'admin';
  }

  if (targetRole === 'editor') {
    return currentRole === 'admin' || currentRole === 'editor';
  }

  if (targetRole === 'collaborator') {
    return (
      currentRole === 'admin' ||
      currentRole === 'editor' ||
      currentRole === 'collaborator'
    );
  }

  if (targetRole === 'viewer') {
    return (
      currentRole === 'admin' ||
      currentRole === 'editor' ||
      currentRole === 'collaborator' ||
      currentRole === 'viewer'
    );
  }

  return false;
};

export type CanCreateNodeReactionInput = {
  user: UserInput;
  root: Node;
  node: Node;
};

export const canCreateNodeReaction = (
  input: CanCreateNodeReactionInput
): boolean => {
  const rootRole = extractNodeRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  return hasNodeRole(rootRole, 'viewer');
};

export type CanDeleteNodeReactionInput = {
  user: UserInput;
  root: Node;
  node: Node;
};

export const canDeleteNodeReaction = (
  input: CanDeleteNodeReactionInput
): boolean => {
  const rootRole = extractNodeRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  return hasNodeRole(rootRole, 'viewer');
};
