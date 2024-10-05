import { Account } from '@/types/accounts';

export type AccountListQueryInput = {
  type: 'account_list';
};

declare module '@/operations/queries' {
  interface QueryMap {
    account_list: {
      input: AccountListQueryInput;
      output: Account[];
    };
  }
}
