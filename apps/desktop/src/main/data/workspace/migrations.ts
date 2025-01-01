import { Migration, sql } from 'kysely';

const createUsersTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('users')
      .addColumn('id', 'text', (col) => col.primaryKey().notNull())
      .addColumn('email', 'text', (col) => col.notNull())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('avatar', 'text')
      .addColumn('custom_name', 'text')
      .addColumn('custom_avatar', 'text')
      .addColumn('role', 'text', (col) => col.notNull())
      .addColumn('status', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('version', 'integer')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('users').execute();
  },
};

const createEntriesTable: Migration = {
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

const createEntryTransactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('entry_transactions')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('entry_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('operation', 'text', (col) => col.notNull())
      .addColumn('data', 'blob')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('created_by', 'text', (col) => col.notNull())
      .addColumn('server_created_at', 'text')
      .addColumn('version', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('entry_transactions').execute();
  },
};

const createEntryInteractionsTable: Migration = {
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

const createCollaborationsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('collaborations')
      .addColumn('entry_id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('role', 'text')
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .addColumn('deleted_at', 'text')
      .addColumn('version', 'integer')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('collaborations').execute();
  },
};

const createMessagesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('messages')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('parent_id', 'text', (col) => col.notNull())
      .addColumn('entry_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('content', 'text', (col) => col.notNull())
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

const createMessageReactionsTable: Migration = {
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

const createMessageInteractionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('message_interactions')
      .addColumn('message_id', 'text', (col) => col.notNull())
      .addColumn('collaborator_id', 'text', (col) => col.notNull())
      .addColumn('root_id', 'text', (col) => col.notNull())
      .addColumn('seen_at', 'text')
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

const createFilesTable: Migration = {
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

const createFileStatesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('file_states')
      .addColumn('file_id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('download_status', 'text', (col) => col.notNull())
      .addColumn('download_progress', 'integer', (col) => col.notNull())
      .addColumn('download_retries', 'integer', (col) => col.notNull())
      .addColumn('upload_status', 'text', (col) => col.notNull())
      .addColumn('upload_progress', 'integer', (col) => col.notNull())
      .addColumn('upload_retries', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('file_states').execute();
  },
};

const createFileInteractionsTable: Migration = {
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

const createMutationsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('mutations')
      .addColumn('id', 'text', (col) => col.notNull().primaryKey())
      .addColumn('type', 'text', (col) => col.notNull())
      .addColumn('node_id', 'text', (col) => col.notNull())
      .addColumn('data', 'text', (col) => col.notNull())
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('retries', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('mutations').execute();
  },
};

const createEntryPathsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('entry_paths')
      .addColumn('ancestor_id', 'varchar(30)', (col) =>
        col.notNull().references('entries.id').onDelete('cascade')
      )
      .addColumn('descendant_id', 'varchar(30)', (col) =>
        col.notNull().references('entries.id').onDelete('cascade')
      )
      .addColumn('level', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('entry_paths_pkey', [
        'ancestor_id',
        'descendant_id',
      ])
      .execute();

    await sql`
      CREATE TRIGGER trg_insert_entry_path
      AFTER INSERT ON entries
      FOR EACH ROW
      BEGIN
        -- Insert direct path from the new entry to itself
        INSERT INTO entry_paths (ancestor_id, descendant_id, level)
        VALUES (NEW.id, NEW.id, 0);

        -- Insert paths from ancestors to the new entry
        INSERT INTO entry_paths (ancestor_id, descendant_id, level)
        SELECT ancestor_id, NEW.id, level + 1
        FROM entry_paths
        WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;
      END;
    `.execute(db);

    await sql`
      CREATE TRIGGER trg_update_entry_path
      AFTER UPDATE ON entries
      FOR EACH ROW
      WHEN OLD.parent_id <> NEW.parent_id
      BEGIN
        -- Delete old paths involving the updated entry
        DELETE FROM entry_paths
        WHERE descendant_id = NEW.id AND ancestor_id <> NEW.id;

        -- Insert new paths from ancestors to the updated entry
        INSERT INTO entry_paths (ancestor_id, descendant_id, level)
        SELECT ancestor_id, NEW.id, level + 1
        FROM entry_paths
        WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;
      END;
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_insert_entry_path;
      DROP TRIGGER IF EXISTS trg_update_entry_path;
    `.execute(db);

    await db.schema.dropTable('entry_paths').execute();
  },
};

const createTextsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE VIRTUAL TABLE texts USING fts5(id UNINDEXED, name, text);
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TABLE IF EXISTS texts;
    `.execute(db);
  },
};

const createCursorsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('cursors')
      .addColumn('key', 'text', (col) => col.notNull().primaryKey())
      .addColumn('value', 'integer', (col) => col.notNull().defaultTo(0))
      .addColumn('created_at', 'text', (col) => col.notNull())
      .addColumn('updated_at', 'text')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('cursors').execute();
  },
};

export const workspaceDatabaseMigrations: Record<string, Migration> = {
  '00001_create_users_table': createUsersTable,
  '00002_create_entries_table': createEntriesTable,
  '00003_create_entry_interactions_table': createEntryInteractionsTable,
  '00004_create_entry_transactions_table': createEntryTransactionsTable,
  '00005_create_collaborations_table': createCollaborationsTable,
  '00006_create_messages_table': createMessagesTable,
  '00007_create_message_reactions_table': createMessageReactionsTable,
  '00008_create_message_interactions_table': createMessageInteractionsTable,
  '00009_create_files_table': createFilesTable,
  '00010_create_file_states_table': createFileStatesTable,
  '00011_create_file_interactions_table': createFileInteractionsTable,
  '00012_create_mutations_table': createMutationsTable,
  '00013_create_entry_paths_table': createEntryPathsTable,
  '00014_create_texts_table': createTextsTable,
  '00015_create_cursors_table': createCursorsTable,
};
