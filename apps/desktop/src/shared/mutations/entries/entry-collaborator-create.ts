export type EntryCollaboratorCreateMutationInput = {
  type: 'entry_collaborator_create';
  userId: string;
  entryId: string;
  collaboratorIds: string[];
  role: string;
};

export type EntryCollaboratorCreateMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    entry_collaborator_create: {
      input: EntryCollaboratorCreateMutationInput;
      output: EntryCollaboratorCreateMutationOutput;
    };
  }
}
