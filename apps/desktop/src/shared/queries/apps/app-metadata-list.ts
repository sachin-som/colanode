import { AppMetadata } from '@/shared/types/apps';

export type AppMetadataListQueryInput = {
  type: 'app_metadata_list';
};

declare module '@/shared/queries' {
  interface QueryMap {
    app_metadata_list: {
      input: AppMetadataListQueryInput;
      output: AppMetadata[];
    };
  }
}
