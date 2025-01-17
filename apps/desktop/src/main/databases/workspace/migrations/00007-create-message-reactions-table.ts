import { Migration } from 'kysely';

export const createMessageReactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('message_reactions')
      .addColumn('message_id', 'text', (col) => col.notNull())
      .addColumn('collaborator_id', 'text', (col) => col.notNull())
      .addColumn('reaction', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('deleted_at', 'text')
      .addColumn('version', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('message_reactions_pkey', [
        'message_id',
        'collaborator_id',
        'reaction',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('message_reactions').execute();
  },
};
