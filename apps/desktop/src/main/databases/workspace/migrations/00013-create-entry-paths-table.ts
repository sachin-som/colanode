import { Migration, sql } from 'kysely';

export const createEntryPathsTable: Migration = {
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
