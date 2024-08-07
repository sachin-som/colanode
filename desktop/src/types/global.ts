import { Account } from '@/types/accounts';
import { Workspace } from '@/types/workspaces';

export type GlobalDatabaseData = {
  accounts: Account[];
  workspaces: Workspace[];
};
