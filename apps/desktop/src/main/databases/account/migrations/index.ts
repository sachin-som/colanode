import { Migration } from 'kysely';

import { createWorkspacesTable } from './00001-create-workspaces-table';

export const accountDatabaseMigrations: Record<string, Migration> = {
  '00001-create-workspaces-table': createWorkspacesTable,
};
