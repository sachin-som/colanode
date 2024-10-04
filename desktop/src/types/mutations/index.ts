import { AppDatabaseSchema } from '@/main/data/app/schema';
import { WorkspaceDatabaseSchema } from '@/main/data/workspace/schema';

export interface MutationMap {}

export type MutationInput = MutationMap[keyof MutationMap]['input'];

export interface MutationHandler<T extends MutationInput> {
  handleMutation: (input: T) => Promise<MutationResult<T>>;
}

export type MutationResult<T extends MutationInput> = {
  output: MutationMap[T['type']]['output'];
  changes?: MutationChange[];
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
