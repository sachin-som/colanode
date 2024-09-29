export type Server = {
  domain: string;
  name: string;
  avatar: string;
  attributes: ServerAttributes;
  version: string;
  createdAt: Date;
  lastSyncedAt: Date | null;
};

export type ServerAttributes = {
  insecure?: string;
};

export type ServerConfig = {
  name: string;
  avatar: string;
  version: string;
  attributes: ServerAttributes;
};
