import { UserNode } from '@/types/users';

export type UserSearchQueryInput = {
  type: 'user_search';
  searchQuery: string;
  userId: string;
};

declare module '@/types/queries' {
  interface QueryMap {
    user_search: {
      input: UserSearchQueryInput;
      output: UserNode[];
    };
  }
}
