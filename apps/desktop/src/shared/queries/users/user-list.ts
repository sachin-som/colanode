import { User } from '@/shared/types/users';

export type UserListQueryInput = {
  type: 'user_list';
  userId: string;
  page: number;
  count: number;
};

declare module '@/shared/queries' {
  interface QueryMap {
    user_list: {
      input: UserListQueryInput;
      output: User[];
    };
  }
}
