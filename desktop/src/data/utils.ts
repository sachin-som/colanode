import SQLite from 'better-sqlite3';
import { Parser, AST, Select } from 'node-sql-parser';
import { NeuronId } from '@/lib/id';
import { QueryResult } from 'kysely';

const parser = new Parser();
const parseOptions = { database: 'Sqlite' };

export const buildSqlite = (filename: string) => {
  const database = new SQLite(filename);
  database.pragma('journal_mode = WAL');
  database.function('transaction_id', () =>
    NeuronId.generate(NeuronId.Type.Transaction),
  );

  return database;
};

export const extractTablesFromSql = (sql: string): string[] => {
  const tables: string[] = [];
  const ast = parser.astify(sql, parseOptions);
  if (Array.isArray(ast)) {
    ast.forEach((astItem) => {
      tables.push(...extractTablesFromAst(astItem));
    });
  } else {
    tables.push(...extractTablesFromAst(ast));
  }

  return tables;
};

const extractTablesFromAst = (ast: AST): string[] => {
  const tables: string[] = [];
  if (ast.type === 'select') {
    const selectAst = ast as Select;
    selectAst.from.forEach((from) => {
      const astFrom = from as any;
      if (astFrom.table) {
        tables.push(astFrom.table);
      }
    });

    if (selectAst.with && selectAst.with.length > 0) {
      selectAst.with.forEach((withItem) => {
        const fromArray = withItem?.stmt?.ast?.from;
        fromArray?.forEach((from) => {
          const astFrom = from as any;
          if (astFrom.table) {
            tables.push(astFrom.table);
          }
        });
      });
    }
  }
  if (ast.type === 'insert') {
    tables.push(ast.table[0].table);
  } else if (ast.type === 'update' && ast.table) {
    ast.table.forEach((from) => {
      const astFrom = from as any;
      if (astFrom.table) {
        tables.push(astFrom.table);
      }
    });
  } else if (ast.type === 'delete') {
    tables.push(ast.table.table);
  }

  return tables;
};

export const resultHasChanged = <R>(
  oldResult: QueryResult<R>,
  newResult: QueryResult<R>,
): boolean => {
  if (oldResult.rows.length !== newResult.rows.length) {
    return true;
  }

  for (let i = 0; i < oldResult.rows.length; i++) {
    const oldRow = oldResult.rows[i];
    const newRow = newResult.rows[i];

    if (Object.keys(oldRow).length !== Object.keys(newRow).length) {
      return true;
    }

    for (const key in oldRow) {
      if (oldRow[key] !== newRow[key]) {
        return true;
      }
    }
  }

  return false;
};
