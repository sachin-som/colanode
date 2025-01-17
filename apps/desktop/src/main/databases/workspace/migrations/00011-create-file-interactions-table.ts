import { Migration } from 'kysely';

export const createFileInteractionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('file_interactions')
      .addColumn('file_id', 'text', (col) => col.notNull())
      .addColumn('collaborator_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('seen_at', 'text')
      .addColumn('first_opened_at', 'text')
      .addColumn('last_opened_at', 'text')
      .addColumn('version', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('file_interactions_pkey', [
        'file_id',
        'collaborator_id',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('file_interactions').execute();
  },
};
