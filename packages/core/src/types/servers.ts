export type ServerConfig = {
  name: string;
  avatar: string;
  version: string;
  attributes: ServerAttributes;
  ip: string | null | undefined;
};

export type ServerAttributes = Record<string, unknown>;
