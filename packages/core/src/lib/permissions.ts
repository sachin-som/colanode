import { isEqual } from 'lodash-es';

import { extractEntryRole } from './entries';

import { Entry, EntryAttributes } from '../registry';
import { WorkspaceRole } from '../types/workspaces';

import { EntryRole } from '~/registry/core';

export type UserInput = {
  userId: string;
  role: WorkspaceRole;
};

export type CanCreateEntryInput = {
  user: UserInput;
  root: Entry | null;
};

export const canCreateEntry = (
  input: CanCreateEntryInput,
  attributes: EntryAttributes
): boolean => {
  if (input.user.role === 'none') {
    return false;
  }

  if (attributes.type === 'chat') {
    return true;
  }

  if (attributes.type === 'space') {
    return hasWorkspaceRole(input.user.role, 'collaborator');
  }

  const root = input.root;
  if (!root) {
    return false;
  }

  const rootRole = extractEntryRole(root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  return hasEntryRole(rootRole, 'editor');
};

export type CanUpdateEntryInput = {
  user: UserInput;
  root: Entry;
  entry: Entry;
};

export const canUpdateEntry = (
  input: CanUpdateEntryInput,
  attributes: EntryAttributes
): boolean => {
  if (input.user.role === 'none') {
    return false;
  }

  if (attributes.type === 'chat') {
    return false;
  }

  const rootRole = extractEntryRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  if (attributes.type === 'space') {
    if (input.entry.type !== 'space') {
      return false;
    }

    const afterCollaborators = attributes.collaborators;
    const beforeCollaborators = input.entry.attributes.collaborators;

    if (!isEqual(afterCollaborators, beforeCollaborators)) {
      return hasEntryRole(rootRole, 'admin');
    }
  }

  return hasEntryRole(rootRole, 'editor');
};

export type CanDeleteEntryInput = {
  user: UserInput;
  root: Entry;
  entry: Entry;
};

export const canDeleteEntry = (input: CanDeleteEntryInput): boolean => {
  if (input.user.role === 'none') {
    return false;
  }

  const entry = input.entry;
  if (entry.attributes.type === 'chat') {
    return false;
  }

  const rootRole = extractEntryRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  if (entry.attributes.type === 'record') {
    return input.entry.createdBy === input.user.userId;
  }

  if (entry.attributes.type === 'space') {
    return hasEntryRole(rootRole, 'admin');
  }

  return hasEntryRole(rootRole, 'editor');
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

export const hasEntryRole = (currentRole: EntryRole, targetRole: EntryRole) => {
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

export type CreateMessageInput = {
  user: UserInput;
  root: Entry;
  entry: Entry;
};

export const canCreateMessage = (input: CreateMessageInput): boolean => {
  const rootRole = extractEntryRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  return hasEntryRole(rootRole, 'commenter');
};

export type DeleteMessageInput = {
  user: UserInput;
  root: Entry;
  entry: Entry;
  message: {
    id: string;
    createdBy: string;
  };
};

export const canDeleteMessage = (input: DeleteMessageInput): boolean => {
  const rootRole = extractEntryRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  if (input.message.createdBy === input.user.userId) {
    return true;
  }

  return hasEntryRole(rootRole, 'admin');
};

export type CanCreateMessageReactionInput = {
  user: UserInput;
  root: Entry;
  message: {
    id: string;
    createdBy: string;
  };
};

export const canCreateMessageReaction = (
  input: CanCreateMessageReactionInput
): boolean => {
  const rootRole = extractEntryRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  return hasEntryRole(rootRole, 'viewer');
};

export type CreateFileInput = {
  user: UserInput;
  root: Entry;
  entry: Entry;
  file: {
    id: string;
    parentId: string;
  };
};

export const canCreateFile = (input: CreateFileInput): boolean => {
  const rootRole = extractEntryRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  if (input.file.parentId === input.entry.id) {
    return hasEntryRole(rootRole, 'editor');
  }

  return hasEntryRole(rootRole, 'commenter');
};

export type DeleteFileInput = {
  user: UserInput;
  root: Entry;
  entry: Entry;
  file: {
    id: string;
    parentId: string;
    createdBy: string;
  };
};

export const canDeleteFile = (input: DeleteFileInput): boolean => {
  const rootRole = extractEntryRole(input.root, input.user.userId);
  if (!rootRole) {
    return false;
  }

  if (input.file.createdBy === input.user.userId) {
    return true;
  }

  return hasEntryRole(rootRole, 'admin');
};
