export type EntryCollaboratorUpdateMutationInput = {
  type: 'entry_collaborator_update';
  accountId: string;
  workspaceId: string;
  entryId: string;
  collaboratorId: string;
  role: string;
};

export type EntryCollaboratorUpdateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    entry_collaborator_update: {
      input: EntryCollaboratorUpdateMutationInput;
      output: EntryCollaboratorUpdateMutationOutput;
    };
  }
}
