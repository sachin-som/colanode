import { WorkspaceOutput } from './workspaces';

export type GoogleLoginInput = {
  access_token: string;
  token_type: string;
  expires_in: number;
  platform: string;
  version: string;
};

export type EmailRegisterInput = {
  name: string;
  email: string;
  password: string;
  platform: string;
  version: string;
};

export type EmailLoginInput = {
  email: string;
  password: string;
  platform: string;
  version: string;
};

export type GoogleUserInfo = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

export type LoginOutput = LoginSuccessOutput | LoginVerifyOutput;

export type LoginSuccessOutput = {
  type: 'success';
  account: AccountOutput;
  workspaces: WorkspaceOutput[];
  deviceId: string;
  token: string;
};

export type LoginVerifyOutput = {
  type: 'verify';
  id: string;
  expiresAt: Date;
};

export type AccountOutput = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
};

export enum AccountStatus {
  Pending = 0,
  Active = 1,
  Unverified = 2,
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

export type AccountSyncInput = {
  platform: string;
  version: string;
};

export type AccountSyncOutput = {
  account: AccountOutput;
  workspaces: WorkspaceOutput[];
  token?: string;
};

export type EmailVerifyInput = {
  id: string;
  otp: string;
  platform: string;
  version: string;
};
