import { Workspace } from '@/types/workspaces';

export type LoginOutput = {
  account: Account;
  workspaces: Workspace[];
};

export type Account = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  token: string;
};
