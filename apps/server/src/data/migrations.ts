import { Migration, sql } from 'kysely';

const createAccountsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('accounts')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('name', 'varchar(256)', (col) => col.notNull())
      .addColumn('email', 'varchar(256)', (col) => col.notNull().unique())
      .addColumn('avatar', 'varchar(256)')
      .addColumn('password', 'varchar(256)')
      .addColumn('attrs', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('status', 'integer', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('accounts').execute();
  },
};

const createDevicesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('devices')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('account_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('token_hash', 'varchar(100)', (col) => col.notNull())
      .addColumn('token_salt', 'varchar(100)', (col) => col.notNull())
      .addColumn('token_generated_at', 'timestamptz', (col) => col.notNull())
      .addColumn('previous_token_hash', 'varchar(100)')
      .addColumn('previous_token_salt', 'varchar(100)')
      .addColumn('type', 'integer', (col) => col.notNull())
      .addColumn('version', 'varchar(30)', (col) => col.notNull())
      .addColumn('platform', 'varchar(30)')
      .addColumn('cpu', 'varchar(30)')
      .addColumn('hostname', 'varchar(30)')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('last_online_at', 'timestamptz')
      .addColumn('last_active_at', 'timestamptz')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('devices').execute();
  },
};

const createWorkspacesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('workspaces')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('name', 'varchar(256)', (col) => col.notNull())
      .addColumn('description', 'varchar(256)')
      .addColumn('avatar', 'varchar(256)')
      .addColumn('attrs', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('version_id', 'varchar(30)', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('workspaces').execute();
  },
};

const createUsersTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS users_version_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('users')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('account_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('email', 'varchar(256)', (col) => col.notNull())
      .addColumn('name', 'varchar(256)', (col) => col.notNull())
      .addColumn('avatar', 'varchar(256)')
      .addColumn('custom_name', 'varchar(256)')
      .addColumn('custom_avatar', 'varchar(256)')
      .addColumn('role', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('version', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('users_version_sequence')`)
      )
      .addUniqueConstraint('unique_workspace_account_combination', [
        'workspace_id',
        'account_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_user_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('users_version_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_user_version
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_user_version();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_user_version ON users;
      DROP FUNCTION IF EXISTS update_user_version();
    `.execute(db);

    await db.schema.dropTable('users').execute();
    await sql`DROP SEQUENCE IF EXISTS users_version_sequence`.execute(db);
  },
};

const createEntriesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('entries')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('type', 'varchar(30)', (col) =>
        col.generatedAlwaysAs(sql`(attributes->>'type')::VARCHAR(30)`).stored()
      )
      .addColumn('parent_id', 'varchar(30)', (col) =>
        col
          .generatedAlwaysAs(sql`(attributes->>'parentId')::VARCHAR(30)`)
          .stored()
          .notNull()
      )
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('attributes', 'jsonb', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('transaction_id', 'varchar(30)', (col) => col.notNull())
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('entries').execute();
  },
};

const createTransactionsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS transactions_version_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('transactions')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('entry_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('operation', 'varchar(30)', (col) => col.notNull())
      .addColumn('data', 'bytea')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('server_created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('version', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('transactions_version_sequence')`)
      )
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('transactions').execute();
    await sql`DROP SEQUENCE IF EXISTS transactions_version_sequence`.execute(
      db
    );
  },
};

const createCollaborationsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS collaborations_version_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('collaborations')
      .addColumn('entry_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('collaborator_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('role', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('deleted_at', 'timestamptz')
      .addColumn('deleted_by', 'varchar(30)')
      .addColumn('version', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('collaborations_version_sequence')`)
      )
      .addPrimaryKeyConstraint('collaborations_pkey', [
        'entry_id',
        'collaborator_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_collaboration_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('collaborations_version_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_collaboration_version
      BEFORE UPDATE ON collaborations
      FOR EACH ROW
      EXECUTE FUNCTION update_collaboration_version();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_collaboration_version ON collaborations;
      DROP FUNCTION IF EXISTS update_collaboration_version();
    `.execute(db);

    await db.schema.dropTable('collaborations').execute();
    await sql`DROP SEQUENCE IF EXISTS collaborations_version_sequence`.execute(
      db
    );
  },
};

const createEntryInteractionsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS entry_interactions_version_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('entry_interactions')
      .addColumn('entry_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('collaborator_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('first_seen_at', 'timestamptz')
      .addColumn('last_seen_at', 'timestamptz')
      .addColumn('first_opened_at', 'timestamptz')
      .addColumn('last_opened_at', 'timestamptz')
      .addColumn('version', 'bigint', (col) =>
        col
          .notNull()
          .defaultTo(sql`nextval('entry_interactions_version_sequence')`)
      )
      .addPrimaryKeyConstraint('entry_interactions_pkey', [
        'entry_id',
        'collaborator_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_entry_interaction_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('entry_interactions_version_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_entry_interaction_version
      BEFORE UPDATE ON entry_interactions
      FOR EACH ROW
      EXECUTE FUNCTION update_entry_interaction_version();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_entry_interaction_version ON entry_interactions;
      DROP FUNCTION IF EXISTS update_entry_interaction_version();
    `.execute(db);

    await db.schema.dropTable('entry_interactions').execute();
    await sql`DROP SEQUENCE IF EXISTS entry_interactions_version_sequence`.execute(
      db
    );
  },
};

const createMessagesTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS messages_version_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('messages')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('type', 'varchar(30)', (col) => col.notNull())
      .addColumn('parent_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('entry_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('content', 'text', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('deleted_at', 'timestamptz')
      .addColumn('deleted_by', 'varchar(30)')
      .addColumn('version', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('messages_version_sequence')`)
      )
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_message_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('messages_version_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_message_version
      BEFORE UPDATE ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_message_version();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_message_version ON messages;
      DROP FUNCTION IF EXISTS update_message_version();
    `.execute(db);

    await db.schema.dropTable('messages').execute();
    await sql`DROP SEQUENCE IF EXISTS messages_version_sequence`.execute(db);
  },
};

const createMessageReactionsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS message_reactions_version_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('message_reactions')
      .addColumn('message_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('collaborator_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('reaction', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('deleted_at', 'timestamptz')
      .addColumn('version', 'bigint', (col) =>
        col
          .notNull()
          .defaultTo(sql`nextval('message_reactions_version_sequence')`)
      )
      .addPrimaryKeyConstraint('message_reactions_pkey', [
        'message_id',
        'collaborator_id',
        'reaction',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_message_reaction_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('message_reactions_version_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_message_reaction_version ON message_reactions;
      DROP FUNCTION IF EXISTS update_message_reaction_version();
    `.execute(db);

    await db.schema.dropTable('message_reactions').execute();
    await sql`DROP SEQUENCE IF EXISTS message_reactions_version_sequence`.execute(
      db
    );
  },
};

const createMessageInteractionsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS message_interactions_version_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('message_interactions')
      .addColumn('message_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('collaborator_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('seen_at', 'timestamptz')
      .addColumn('first_opened_at', 'timestamptz')
      .addColumn('last_opened_at', 'timestamptz')
      .addColumn('version', 'bigint', (col) =>
        col
          .notNull()
          .defaultTo(sql`nextval('message_interactions_version_sequence')`)
      )
      .addPrimaryKeyConstraint('message_interactions_pkey', [
        'message_id',
        'collaborator_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_message_interaction_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('message_interactions_version_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_message_interaction_version
      BEFORE UPDATE ON message_interactions
      FOR EACH ROW
      EXECUTE FUNCTION update_message_interaction_version();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_message_interaction_version ON message_interactions;
      DROP FUNCTION IF EXISTS update_message_interaction_version();
    `.execute(db);

    await db.schema.dropTable('message_interactions').execute();
    await sql`DROP SEQUENCE IF EXISTS message_interactions_version_sequence`.execute(
      db
    );
  },
};

const createFilesTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS files_version_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('files')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('type', 'varchar(30)', (col) => col.notNull())
      .addColumn('parent_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('entry_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('name', 'varchar(256)', (col) => col.notNull())
      .addColumn('original_name', 'varchar(256)', (col) => col.notNull())
      .addColumn('mime_type', 'varchar(256)', (col) => col.notNull())
      .addColumn('extension', 'varchar(256)', (col) => col.notNull())
      .addColumn('size', 'integer', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('deleted_at', 'timestamptz')
      .addColumn('deleted_by', 'varchar(30)')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('version', 'bigint', (col) =>
        col.notNull().defaultTo(sql`nextval('files_version_sequence')`)
      )
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_file_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('files_version_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_file_version
      BEFORE UPDATE ON files
      FOR EACH ROW
      EXECUTE FUNCTION update_file_version();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_file_version ON files;
      DROP FUNCTION IF EXISTS update_file_version();
    `.execute(db);

    await db.schema.dropTable('files').execute();
    await sql`DROP SEQUENCE IF EXISTS files_version_sequence`.execute(db);
  },
};

const createFileInteractionsTable: Migration = {
  up: async (db) => {
    await sql`
      CREATE SEQUENCE IF NOT EXISTS file_interactions_version_sequence
      START WITH 1000000000
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      CACHE 1;
    `.execute(db);

    await db.schema
      .createTable('file_interactions')
      .addColumn('file_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('collaborator_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('root_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('first_seen_at', 'timestamptz')
      .addColumn('last_seen_at', 'timestamptz')
      .addColumn('first_opened_at', 'timestamptz')
      .addColumn('last_opened_at', 'timestamptz')
      .addColumn('version', 'bigint', (col) =>
        col
          .notNull()
          .defaultTo(sql`nextval('file_interactions_version_sequence')`)
      )
      .addPrimaryKeyConstraint('file_interactions_pkey', [
        'file_id',
        'collaborator_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION update_file_interaction_version() RETURNS TRIGGER AS $$
      BEGIN
        NEW.version = nextval('file_interactions_version_sequence');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_file_interaction_version
      BEFORE UPDATE ON file_interactions
      FOR EACH ROW
      EXECUTE FUNCTION update_file_interaction_version();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_update_file_interaction_version ON file_interactions;
      DROP FUNCTION IF EXISTS update_file_interaction_version();
    `.execute(db);

    await db.schema.dropTable('file_interactions').execute();
    await sql`DROP SEQUENCE IF EXISTS file_interactions_version_sequence`.execute(
      db
    );
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
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('level', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('entry_paths_pkey', [
        'ancestor_id',
        'descendant_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION fn_insert_entry_path() RETURNS TRIGGER AS $$
      BEGIN
        -- Insert direct path from the new entry to itself
        INSERT INTO entry_paths (ancestor_id, descendant_id, workspace_id, level)
        VALUES (NEW.id, NEW.id, NEW.workspace_id, 0);

        -- Insert paths from ancestors to the new entry
        INSERT INTO entry_paths (ancestor_id, descendant_id, workspace_id, level)
        SELECT ancestor_id, NEW.id, NEW.workspace_id, level + 1
        FROM entry_paths
        WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_insert_entry_path
      AFTER INSERT ON entries
      FOR EACH ROW
      EXECUTE FUNCTION fn_insert_entry_path();

      CREATE OR REPLACE FUNCTION fn_update_entry_path() RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
          -- Delete old paths involving the updated entry
          DELETE FROM entry_paths
          WHERE descendant_id = NEW.id AND ancestor_id <> NEW.id;

          INSERT INTO entry_paths (ancestor_id, descendant_id, workspace_id, level)
          SELECT ancestor_id, NEW.id, NEW.workspace_id, level + 1
          FROM entry_paths
          WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_entry_path
      AFTER UPDATE ON entries
      EXECUTE FUNCTION fn_update_entry_path();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_insert_entry_path ON entries;
      DROP TRIGGER IF EXISTS trg_update_entry_path ON entries;
      DROP FUNCTION IF EXISTS fn_insert_entry_path();
      DROP FUNCTION IF EXISTS fn_update_entry_path();
    `.execute(db);

    await db.schema.dropTable('entry_paths').execute();
  },
};

const createAIEmbeddingsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('ai_embeddings')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('entity_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('entity_type', 'varchar(30)', (col) => col.notNull())
      .addColumn('content', 'text', (col) => col.notNull())
      .addColumn('embedding', sql`vector(2000)`, (col) => col.notNull())
      .addColumn('fts', sql`tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED`)
      .addColumn('metadata', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .execute();

    await sql`
      CREATE INDEX ai_embeddings_embedding_idx
        ON ai_embeddings
        USING hnsw(embedding vector_cosine_ops)
        WITH (
          m = 16,            
          ef_construction = 64  
        );
    `.execute(db);

    await sql`
      CREATE INDEX ai_embeddings_fts_idx
        ON ai_embeddings
        USING GIN (fts);
    `.execute(db);
  },
  down: async (db) => {
    await db.schema.dropTable('ai_embeddings').execute();
  },
};

export const databaseMigrations: Record<string, Migration> = {
  '00001_create_accounts_table': createAccountsTable,
  '00002_create_devices_table': createDevicesTable,
  '00003_create_workspaces_table': createWorkspacesTable,
  '00004_create_users_table': createUsersTable,
  '00005_create_entries_table': createEntriesTable,
  '00006_create_transactions_table': createTransactionsTable,
  '00007_create_entry_interactions_table': createEntryInteractionsTable,
  '00008_create_messages_table': createMessagesTable,
  '00009_create_message_reactions_table': createMessageReactionsTable,
  '00010_create_message_interactions_table': createMessageInteractionsTable,
  '00011_create_files_table': createFilesTable,
  '00012_create_file_interactions_table': createFileInteractionsTable,
  '00013_create_collaborations_table': createCollaborationsTable,
  '00014_create_entry_paths_table': createEntryPathsTable,
  '00015_create_ai_embeddings_table': createAIEmbeddingsTable,
};
