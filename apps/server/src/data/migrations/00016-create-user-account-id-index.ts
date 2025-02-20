import { Migration } from 'kysely';

export const createUserAccountIdIndex: Migration = {
  up: async (db) => {
    await db.schema
      .createIndex('users_account_id_idx')
      .on('users')
      .columns(['account_id'])
      .execute();
  },
  down: async (db) => {
    await db.schema.dropIndex('users_account_id_idx').execute();
  },
};
