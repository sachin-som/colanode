export type Document = {
  id: string;
  revision: bigint;
  state: Uint8Array;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
};
