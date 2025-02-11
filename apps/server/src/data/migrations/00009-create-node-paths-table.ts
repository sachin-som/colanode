import { Migration, sql } from 'kysely';

export const createNodePathsTable: Migration = {
  up: async (db) => {
    await db.schema
      .createTable('node_paths')
      .addColumn('ancestor_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('descendant_id', 'varchar(30)', (col) =>
        col.notNull().references('nodes.id').onDelete('cascade')
      )
      .addColumn('workspace_id', 'varchar(30)', (col) => col.notNull())
      .addColumn('level', 'integer', (col) => col.notNull())
      .addPrimaryKeyConstraint('node_paths_pkey', [
        'ancestor_id',
        'descendant_id',
      ])
      .execute();

    await sql`
      CREATE OR REPLACE FUNCTION fn_insert_node_path() RETURNS TRIGGER AS $$
      BEGIN
        -- Insert direct path from the new node to itself
        INSERT INTO node_paths (ancestor_id, descendant_id, workspace_id, level)
        VALUES (NEW.id, NEW.id, NEW.workspace_id, 0);

        -- Insert paths from ancestors to the new node
        INSERT INTO node_paths (ancestor_id, descendant_id, workspace_id, level)
        SELECT ancestor_id, NEW.id, NEW.workspace_id, level + 1
        FROM node_paths
        WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_insert_node_path
      AFTER INSERT ON nodes
      FOR EACH ROW
      EXECUTE FUNCTION fn_insert_node_path();

      CREATE OR REPLACE FUNCTION fn_update_node_path() RETURNS TRIGGER AS $$
      BEGIN
        IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
          -- Delete old paths involving the updated node
          DELETE FROM node_paths
          WHERE descendant_id = NEW.id AND ancestor_id <> NEW.id;

          INSERT INTO node_paths (ancestor_id, descendant_id, workspace_id, level)
          SELECT ancestor_id, NEW.id, NEW.workspace_id, level + 1
          FROM node_paths
          WHERE descendant_id = NEW.parent_id AND ancestor_id <> NEW.id;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_update_node_path
      AFTER UPDATE ON nodes
      EXECUTE FUNCTION fn_update_node_path();
    `.execute(db);
  },
  down: async (db) => {
    await sql`
      DROP TRIGGER IF EXISTS trg_insert_node_path ON nodes;
      DROP TRIGGER IF EXISTS trg_update_node_path ON nodes;
      DROP FUNCTION IF EXISTS fn_insert_node_path();
      DROP FUNCTION IF EXISTS fn_update_node_path();
    `.execute(db);

    await db.schema.dropTable('node_paths').execute();
  },
};
