import { Migration, sql } from 'kysely';

export const createEntriesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('entries')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('type', 'text', (col) =>
        col
          .notNull()
          .generatedAlwaysAs(sql`json_extract(attributes, '$.type')`)
          .stored()
      )
      .addColumn('parent_id', 'text', (col) =>
        col
          .generatedAlwaysAs(sql`json_extract(attributes, '$.parentId')`)
          .stored()
      )
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('attributes', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_by', 'text')
      .addColumn('transaction_id', 'text', (col) => col.notNull())
      .execute();

    await db.schema
      .createIndex('entries_parent_id_type_index')
      .on('entries')
      .columns(['parent_id', 'type'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('entries').execute();
  },
};
