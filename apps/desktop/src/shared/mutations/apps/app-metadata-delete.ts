export type AppMetadataDeleteMutationInput = {
  type: 'app_metadata_delete';
  key: string;
};

export type AppMetadataDeleteMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    app_metadata_delete: {
      input: AppMetadataDeleteMutationInput;
      output: AppMetadataDeleteMutationOutput;
    };
  }
}
