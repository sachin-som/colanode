import { Migration, sql } from 'kysely';

export const createMessagesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('messages')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('type', 'integer', (col) =>
        col
          .notNull()
          .generatedAlwaysAs(sql`json_extract(attributes, '$.type')`)
          .stored()
      )
      .addColumn('parent_id', 'text', (col) => col.notNull())
      .addColumn('entry_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('updated_by', 'text')
      .addColumn('deleted_at', 'text')
      .addColumn('version', 'integer')
      .execute();

    await db.schema
      .createIndex('messages_parent_id_index')
      .on('messages')
      .columns(['parent_id'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('messages').execute();
  },
};
