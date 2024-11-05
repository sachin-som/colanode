import { WorkspaceOutput } from '@/types/workspaces';

export type GoogleLoginInput = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type EmailRegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type EmailLoginInput = {
  email: string;
  password: string;
};

export type GoogleUserInfo = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

export type LoginOutput = {
  account: AccountOutput;
  workspaces: WorkspaceOutput[];
};

export type AccountOutput = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  token: string;
  deviceId: string;
};

export enum AccountStatus {
  Pending = 1,
  Active = 2,
}

export type AccountUpdateInput = {
  name: string;
  avatar?: string | null;
};

export type AccountUpdateOutput = {
  id: string;
  name: string;
  avatar?: string | null;
};
