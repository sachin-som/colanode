import { Migration } from 'kysely';

export const createMessageInteractionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('message_interactions')
      .addColumn('message_id', 'text', (col) => col.notNull())
      .addColumn('collaborator_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('first_seen_at', 'text')
      .addColumn('last_seen_at', 'text')
      .addColumn('first_opened_at', 'text')
      .addColumn('last_opened_at', 'text')
      .addColumn('version', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('message_interactions_pkey', [
        'message_id',
        'collaborator_id',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('message_interactions').execute();
  },
};
