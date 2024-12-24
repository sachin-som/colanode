import { z, ZodSchema } from 'zod';

import {
  extractEntryRole,
  hasAdminAccess,
  hasCollaboratorAccess,
  hasEditorAccess,
  hasViewerAccess,
} from '../lib/entries';
import { WorkspaceRole } from '../types/workspaces';

import { Entry, EntryAttributes } from './';

export type EntryRole = 'admin' | 'editor' | 'collaborator' | 'viewer';
export const entryRoleEnum = z.enum([
  'admin',
  'editor',
  'collaborator',
  'viewer',
]);

export class EntryMutationContext {
  public accountId: string;
  public workspaceId: string;
  public userId: string;
  public ancestors: Entry[];
  public entryRole: EntryRole | null;
  public workspaceRole: WorkspaceRole | null;

  constructor(
    accountId: string,
    workspaceId: string,
    userId: string,
    workspaceRole: WorkspaceRole | null,
    ancestors: Entry[]
  ) {
    this.accountId = accountId;
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.workspaceRole = workspaceRole;
    this.ancestors = ancestors;
    this.entryRole = extractEntryRole(ancestors, userId);
  }

  public hasAdminAccess = () => {
    return hasAdminAccess(this.entryRole);
  };

  public hasEditorAccess = () => {
    return hasEditorAccess(this.entryRole);
  };

  public hasCollaboratorAccess = () => {
    return hasCollaboratorAccess(this.entryRole);
  };

  public hasViewerAccess = () => {
    return hasViewerAccess(this.entryRole);
  };
}

export interface EntryModel {
  type: string;
  schema: ZodSchema;
  canCreate: (
    context: EntryMutationContext,
    attributes: EntryAttributes
  ) => Promise<boolean>;
  canUpdate: (
    context: EntryMutationContext,
    entry: Entry,
    attributes: EntryAttributes
  ) => Promise<boolean>;
  canDelete: (context: EntryMutationContext, entry: Entry) => Promise<boolean>;
  getName: (
    id: string,
    attributes: EntryAttributes
  ) => string | null | undefined;
  getText: (
    id: string,
    attributes: EntryAttributes
  ) => string | null | undefined;
}
