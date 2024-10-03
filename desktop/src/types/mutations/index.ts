import { AppDatabaseSchema } from '@/main/data/app/schema';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';

export interface MutationMap {}

export type MutationInput = MutationMap[keyof MutationMap]['input'];

export interface MutationHandler<T extends MutationInput> {
  handleMutation: (input: T) => Promise<MutationResult<T>>;
}

export type MutationResult<T extends MutationInput> = {
  output: MutationMap[T['type']]['output'];
  changedTables?: MutationChange[];
};

export type MutationChange = AppMutationChange | WorkspaceMutationChange;

export type AppMutationChange = {
  type: 'app';
  table: keyof AppDatabaseSchema;
};

export type WorkspaceMutationChange = {
  type: 'workspace';
  table: keyof WorkspaceDatabaseSchema;
  userId: string;
};

export type ServerMutation = {
  id: string;
  table: string;
  action: string;
  workspaceId: string;
  before: any | null;
  after: any | null;
};

export type ServerExecuteMutationsResponse = {
  results: ServerExecuteMutationResult[];
};

export type ServerExecuteMutationResult = {
  id: number;
  status: ServerExecuteMutationStatus;
};

export type ServerExecuteMutationStatus = 'success' | 'error';
