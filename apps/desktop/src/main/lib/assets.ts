import { Kysely, SqliteDialect } from 'kysely';
import SQLite from 'better-sqlite3';

import path from 'path';

import { EmojiDatabaseSchema } from '@/main/databases/emojis';
import { IconDatabaseSchema } from '@/main/databases/icons';
import { getAssetsSourcePath } from '@/main/lib/utils';

export const emojiDatabase = new Kysely<EmojiDatabaseSchema>({
  dialect: new SqliteDialect({
    database: new SQLite(path.join(getAssetsSourcePath(), 'emojis.db')),
  }),
});

export const iconDatabase = new Kysely<IconDatabaseSchema>({
  dialect: new SqliteDialect({
    database: new SQLite(path.join(getAssetsSourcePath(), 'icons.db')),
  }),
});
