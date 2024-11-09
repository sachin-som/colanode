import SQLite from 'better-sqlite3';
import { QueryResult } from 'kysely';
import { isEqual } from 'lodash-es';

export const buildSqlite = (filename: string): SQLite.Database => {
  const database = new SQLite(filename);
  database.pragma('journal_mode = WAL');
  return database;
};

export const extractTablesFromSql = (sql: string): string[] => {
  // A regex to match table names from SELECT, JOIN, UPDATE, INSERT, DELETE
  const regex = /\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+["]?([a-zA-Z0-9_]+)["]?/gi;
  const matches = [...sql.matchAll(regex)].map((match) => match[1]);
  return matches;
};

export const resultHasChanged = <R>(
  oldResult: QueryResult<R>,
  newResult: QueryResult<R>
): boolean => {
  if (oldResult.rows.length !== newResult.rows.length) {
    return true;
  }

  for (let i = 0; i < oldResult.rows.length; i++) {
    const oldRow = oldResult.rows[i];
    const newRow = newResult.rows[i];

    if (!isEqual(oldRow, newRow)) {
      return true;
    }
  }

  return false;
};
