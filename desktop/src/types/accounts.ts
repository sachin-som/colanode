import { WorkspaceOutput } from '@/types/workspaces';

export type LoginOutput = {
  account: Account;
  workspaces: WorkspaceOutput[];
};

export type Account = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  token: string;
  deviceId: string;
  status: string;
  server: string;
};

export type AccountUpdateOutput = {
  id: string;
  name: string;
  avatar?: string | null;
};
