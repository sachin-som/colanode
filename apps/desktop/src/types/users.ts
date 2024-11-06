export type UserNode = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

export type UserAttributes = {
  type: 'user';
  name: string;
  email: string;
  avatar: string | null;
};
