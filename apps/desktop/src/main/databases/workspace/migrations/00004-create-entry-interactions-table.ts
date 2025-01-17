import { Migration } from 'kysely';

export const createEntryInteractionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('entry_interactions')
      .addColumn('entry_id', 'text', (col) => col.notNull())
      .addColumn('collaborator_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('first_seen_at', 'text')
      .addColumn('last_seen_at', 'text')
      .addColumn('first_opened_at', 'text')
      .addColumn('last_opened_at', 'text')
      .addColumn('version', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('entry_interactions_pkey', [
        'entry_id',
        'collaborator_id',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('entry_interactions').execute();
  },
};
