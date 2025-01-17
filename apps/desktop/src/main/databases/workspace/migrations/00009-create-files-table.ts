import { Migration } from 'kysely';

export const createFilesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('files')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('parent_id', 'text', (col) => col.notNull())
      .addColumn('entry_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('original_name', 'text', (col) => col.notNull())
      .addColumn('mime_type', 'text', (col) => col.notNull())
      .addColumn('extension', 'text', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('updated_by', 'text')
      .addColumn('deleted_at', 'text')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('version', 'integer')
      .execute();

    await db.schema
      .createIndex('files_parent_id_index')
      .on('files')
      .columns(['parent_id'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('files').execute();
  },
};
