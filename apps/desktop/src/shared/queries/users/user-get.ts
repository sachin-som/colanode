import { User } from '@/shared/types/users';

export type UserGetQueryInput = {
  type: 'user_get';
  userId: string;
  accountId: string;
  workspaceId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    user_get: {
      input: UserGetQueryInput;
      output: User | null;
    };
  }
}
