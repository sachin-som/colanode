import { LocalTransaction, LoginOutput } from '@colanode/core';

export type FakerAccount = {
  name: string;
  email: string;
  password: string;
  avatar: string;
};

export type User = {
  login: LoginOutput;
  userId: string;
  transactions: LocalTransaction[];
};
