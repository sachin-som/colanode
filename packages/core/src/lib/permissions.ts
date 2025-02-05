import { isEqual } from 'lodash-es';

import {
  extractNodeRole,
  Node,
  NodeAttributes,
  WorkspaceRole,
  NodeRole,
  NodeType,
} from '../index';

export type UserInput = {
  userId: string;
  role: WorkspaceRole;
};

export type CanCreateNodeInput = {
  user: UserInput;
  root: Node | null;
};

export const canCreateNode = (
  input: CanCreateNodeInput,
  type: NodeType
): boolean => {
  if (input.user.role === 'none') {
    return false;
  }

  if (type === 'chat') {
    return true;
  }

  if (type === 'space') {
    return hasWorkspaceRole(input.user.role, 'collaborator');
  }

  const root = input.root;
  if (!root) {
    return false;
  }

  const rootRole = extractNodeRole(root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  return hasNodeRole(rootRole, 'editor');
};

export type CanUpdateNodeInput = {
  user: UserInput;
  root: Node;
  node: Node;
};

export const canUpdateNode = (
  input: CanUpdateNodeInput,
  attributes: NodeAttributes
): boolean => {
  if (input.user.role === 'none') {
    return false;
  }

  if (attributes.type === 'chat') {
    return false;
  }

  const rootRole = extractNodeRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  if (attributes.type === 'space') {
    if (input.node.type !== 'space') {
      return false;
    }

    const afterCollaborators = attributes.collaborators;
    const beforeCollaborators = input.node.attributes.collaborators;

    if (!isEqual(afterCollaborators, beforeCollaborators)) {
      return hasNodeRole(rootRole, 'admin');
    }
  }

  return hasNodeRole(rootRole, 'editor');
};

export type CanDeleteNodeInput = {
  user: UserInput;
  root: Node;
  node: Node;
};

export const canDeleteNode = (input: CanDeleteNodeInput): boolean => {
  if (input.user.role === 'none') {
    return false;
  }

  const node = input.node;
  if (node.attributes.type === 'chat') {
    return false;
  }

  const rootRole = extractNodeRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  if (node.attributes.type === 'record') {
    return node.createdBy === input.user.userId;
  }

  if (node.attributes.type === 'space') {
    return hasNodeRole(rootRole, 'admin');
  }

  return hasNodeRole(rootRole, 'editor');
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

  if (targetRole === 'commenter') {
    return (
      currentRole === 'admin' ||
      currentRole === 'editor' ||
      currentRole === 'commenter'
    );
  }

  if (targetRole === 'viewer') {
    return (
      currentRole === 'admin' ||
      currentRole === 'editor' ||
      currentRole === 'commenter' ||
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
