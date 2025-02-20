import { Migration } from 'kysely';

export const createUploadsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('uploads')
      .addColumn('file_id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('upload_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('mime_type', 'varchar(255)', (col) => col.notNull())
      .addColumn('size', 'bigint', (col) => col.notNull())
      .addColumn('path', 'varchar(255)', (col) => col.notNull())
      .addColumn('version_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('uploaded_at', 'timestamptz')
      .execute();

    await db.schema
      .createIndex('uploads_created_by_idx')
      .on('uploads')
      .columns(['created_by'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('uploads').execute();
  },
};
