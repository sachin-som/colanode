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

const createWorkspaceUsersTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('workspace_users')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('account_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('role', 'varchar(30)', (col) => col.notNull())
      .addColumn('attrs', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('status', 'integer', (col) => col.notNull())
      .addColumn('version_id', 'varchar(30)', (col) => col.notNull())
      .addUniqueConstraint('unique_workspace_account_combination', [
        'workspace_id',
        'account_id',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('workspace_users').execute();
  },
};

const createNodesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('nodes')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('type', 'varchar(30)', (col) =>
        col.generatedAlwaysAs(sql`(attributes->>'type')::VARCHAR(30)`).stored(),
      )
      .addColumn('parent_id', 'varchar(30)', (col) =>
        col
          .generatedAlwaysAs(sql`(attributes->>'parentId')::VARCHAR(30)`)
          .stored()
          .references('nodes.id')
          .onDelete('cascade'),
      )
      .addColumn('index', 'varchar(30)', (col) =>
        col
          .generatedAlwaysAs(sql`(attributes->>'index')::VARCHAR(30)`)
          .stored(),
      )
      .addColumn('attributes', 'jsonb', (col) => col.notNull())
      .addColumn('state', 'text', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('version_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('server_created_at', 'timestamptz')
      .addColumn('server_updated_at', 'timestamptz')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('nodes').execute();
  },
};

const createNodeCollaboratorsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_collaborators')
      .addColumn('node_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('collaborator_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('role', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('updated_at', 'timestamptz')
      .addColumn('created_by', 'varchar(30)', (col) => col.notNull())
      .addColumn('updated_by', 'varchar(30)')
      .addColumn('version_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('server_created_at', 'timestamptz')
      .addColumn('server_updated_at', 'timestamptz')
      .addPrimaryKeyConstraint('node_collaborators_pkey', [
        'node_id',
        'collaborator_id',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_collaborators').execute();
  },
};

const createNodeReactionsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_reactions')
      .addColumn('node_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('actor_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade'),
      )
      .addColumn('reaction', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('server_created_at', 'timestamptz', (col) => col.notNull())
      .addPrimaryKeyConstraint('node_reactions_pkey', [
        'node_id',
        'actor_id',
        'reaction',
      ])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('node_reactions').execute();
  },
};

const createAccountDevicesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('account_devices')
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
    await db.schema.dropTable('account_devices').execute();
  },
};

const createChangesTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('changes')
      .addColumn('id', 'varchar(30)', (col) => col.notNull().primaryKey())
      .addColumn('device_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('data', 'jsonb')
      .addColumn('created_at', 'timestamptz', (col) => col.notNull())
      .addColumn('retry_count', 'integer', (col) => col.notNull().defaultTo(0))
      .execute();

    await db.schema
      .createIndex('changes_device_id_index')
      .on('changes')
      .column('device_id')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropTable('changes').execute();
  },
};

export const databaseMigrations: Record<string, Migration> = {
  '00001_create_accounts_table': createAccountsTable,
  '00002_create_workspaces_table': createWorkspacesTable,
  '00003_create_workspace_users_table': createWorkspaceUsersTable,
  '00004_create_nodes_table': createNodesTable,
  '00005_create_node_collaborators_table': createNodeCollaboratorsTable,
  '00006_create_node_reactions_table': createNodeReactionsTable,
  '00007_create_account_devices_table': createAccountDevicesTable,
  '00008_create_changes_table': createChangesTable,
};
