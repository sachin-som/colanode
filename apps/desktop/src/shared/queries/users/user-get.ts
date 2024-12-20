import { User } from '@/shared/types/users';

export type UserGetQueryInput = {
  type: 'user_get';
  id: string;
  userId: string;
};

declare module '@/shared/queries' {
  interface QueryMap {
    user_get: {
      input: UserGetQueryInput;
      output: User | null;
    };
  }
}
