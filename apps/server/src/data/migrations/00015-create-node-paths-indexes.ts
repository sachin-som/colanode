import { Migration } from 'kysely';

export const createNodePathsIndexes: Migration = {
  up: async (db) => {
    await db.schema
      .createIndex('node_paths_ancestor_id_idx')
      .on('node_paths')
      .column('ancestor_id')
      .execute();

    await db.schema
      .createIndex('node_paths_descendant_id_idx')
      .on('node_paths')
      .column('descendant_id')
      .execute();
  },
  down: async (db) => {
    await db.schema.dropIndex('node_paths_ancestor_id_idx').execute();
    await db.schema.dropIndex('node_paths_descendant_id_idx').execute();
  },
};
