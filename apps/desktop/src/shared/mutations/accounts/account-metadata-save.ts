import {
  AccountMetadataKey,
  AccountMetadataMap,
} from '@/shared/types/accounts';

export type AccountMetadataSaveMutationInput = {
  type: 'account_metadata_save';
  accountId: string;
  key: AccountMetadataKey;
  value: AccountMetadataMap[AccountMetadataKey]['value'];
};

export type AccountMetadataSaveMutationOutput = {
  success: boolean;
};

declare module '@/shared/mutations' {
  interface MutationMap {
    account_metadata_save: {
      input: AccountMetadataSaveMutationInput;
      output: AccountMetadataSaveMutationOutput;
    };
  }
}
