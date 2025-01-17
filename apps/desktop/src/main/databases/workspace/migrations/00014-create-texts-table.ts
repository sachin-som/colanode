import { Migration, sql } from 'kysely';

export const createTextsTable: Migration = {
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
