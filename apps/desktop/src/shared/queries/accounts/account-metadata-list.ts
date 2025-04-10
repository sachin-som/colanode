import { AccountMetadata } from '@/shared/types/accounts';

export type AccountMetadataListQueryInput = {
  type: 'account_metadata_list';
  accountId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    account_metadata_list: {
      input: AccountMetadataListQueryInput;
      output: AccountMetadata[];
    };
  }
}
