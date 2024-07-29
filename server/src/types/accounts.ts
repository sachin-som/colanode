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
  token: string;
};

export enum AccountStatus {
  Pending = 1,
  Active = 2,
}

export type Account = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  password?: string | null;
  attrs?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date | null;
  status: AccountStatus;
};
