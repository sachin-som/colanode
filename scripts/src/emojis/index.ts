import AdmZip from 'adm-zip';
import fetch from 'node-fetch';
import SQLite from 'better-sqlite3';
import { generateId, IdType } from '@colanode/core';

import fs from 'fs';
import path from 'path';

type EmojiMartI18n = {
  categories: Record<string, string>;
};

type EmojiMartEmoji = {
  id: string;
  name: string;
  keywords: string[];
  skins: EmojiMartSkin[];
  version: number;
  emoticons?: string[];
};

type EmojiMartSkin = {
  unified: string;
  native: string;
};

type EmojiMartCategory = {
  id: string;
  emojis: string[];
};

type EmojiMartData = {
  emojis: Record<string, EmojiMartEmoji>;
  categories: Record<string, EmojiMartCategory>;
};

type EmojiSkin = {
  id: string;
  unified: string;
};

type Emoji = {
  id: string;
  code: string;
  name: string;
  tags: string[];
  emoticons: string[] | undefined;
  skins: EmojiSkin[];
};

type EmojiRow = {
  id: string;
  code: string;
  name: string;
  tags: string;
  emoticons: string;
  skins: string;
};

type EmojiCategory = {
  id: string;
  name: string;
  count: number;
  display_order: number;
};

const GITHUB_DOMAIN = 'https://github.com';

const WORK_DIR_PATH = 'src/emojis/temp';
const DATABASE_PATH = 'src/emojis/emojis.db';

const EMOJI_MART_REPO = 'missive/emoji-mart';
const EMOJI_MART_TAG = '5.6.0';
const EMOJI_MART_DIR_PATH = path.join(
  WORK_DIR_PATH,
  `emoji-mart-${EMOJI_MART_TAG}`
);
const EMOJI_MART_DATA_DIR_PATH = path.join(
  EMOJI_MART_DIR_PATH,
  'packages',
  'emoji-mart-data'
);
const EMOJI_MART_I18N_FILE_PATH = path.join(
  EMOJI_MART_DATA_DIR_PATH,
  'i18n',
  'en.json'
);
const EMOJI_MART_DATA_FILE_PATH = path.join(
  EMOJI_MART_DATA_DIR_PATH,
  'sets',
  '15',
  'twitter.json'
);

const TWEEMOJI_REPO = 'jdecked/twemoji';
const TWEEMOJI_TAG = '15.1.0';
const TWEEMOJI_DIR_PATH = path.join(WORK_DIR_PATH, `twemoji-${TWEEMOJI_TAG}`);
const TWEEMOJI_SVG_DIR_PATH = path.join(TWEEMOJI_DIR_PATH, 'assets', 'svg');

const downloadZipAndExtract = async (url: string, dir: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}`);

  const buffer = await response.arrayBuffer();
  const zip = new AdmZip(Buffer.from(buffer));
  zip.extractAllTo(dir, true);
};

const downloadEmojiMartRepo = async () => {
  console.log(`Downloading emoji-mart repo...`);
  const url = `${GITHUB_DOMAIN}/${EMOJI_MART_REPO}/archive/refs/tags/v${EMOJI_MART_TAG}.zip`;

  await downloadZipAndExtract(url, WORK_DIR_PATH);
  console.log(`Downloaded emoji-mart repo.`);
};

const downloadTweemojiRepo = async () => {
  console.log(`Downloading twemoji repo...`);
  const url = `${GITHUB_DOMAIN}/${TWEEMOJI_REPO}/archive/refs/tags/v${TWEEMOJI_TAG}.zip`;

  await downloadZipAndExtract(url, WORK_DIR_PATH);
  console.log(`Downloaded twemoji repo.`);
};

const getEmojiSkinFileName = (unified: string): string => {
  let file = unified;

  if (file.substring(0, 2) === '00') {
    file = file.substring(2);
    // fix for keycap emojis
    file = file.replace(/-fe0f/i, '');
  }

  if (file.startsWith('1f441')) {
    file = file.replace(/-fe0f/gi, '');
  }

  if (file.endsWith('-fe0f')) {
    const parts = file.split('-');
    if (parts.length === 2 && parts[0]) {
      file = parts[0];
    }
  }

  return `${file}.svg`;
};

const initDatabase = () => {
  const database = new SQLite(DATABASE_PATH);

  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      count INTEGER NOT NULL,
      display_order INTEGER NOT NULL
    );
  
    CREATE TABLE IF NOT EXISTS emojis (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      tags TEXT,
      emoticons TEXT,
      skins TEXT,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_emojis_category_id ON emojis(category_id);

    CREATE TABLE IF NOT EXISTS emoji_svgs (
      skin_id TEXT PRIMARY KEY,
      emoji_id TEXT NOT NULL,
      svg BLOB NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS emoji_search
    USING fts5(
      id UNINDEXED,
      text
    );
  `);

  return database;
};

const readExistingMetadata = (database: SQLite.Database) => {
  const emojiRows = database
    .prepare<unknown[], EmojiRow>(`SELECT * FROM emojis`)
    .all();

  const emojis: Record<string, Emoji> = {};

  for (const row of emojiRows) {
    emojis[row.id] = {
      id: row.id,
      code: row.code,
      name: row.name,
      tags: row.tags ? JSON.parse(row.tags) : [],
      emoticons: row.emoticons ? JSON.parse(row.emoticons) : [],
      skins: row.skins ? JSON.parse(row.skins) : [],
    };
  }

  const categoryRows = database
    .prepare<unknown[], EmojiCategory>(`SELECT * FROM categories`)
    .all();

  const categories: EmojiCategory[] = categoryRows.map((c) => ({
    id: c.id,
    name: c.name,
    count: c.count,
    display_order: c.display_order,
  }));

  return { emojis, categories };
};

const processEmojisIntoDb = (database: SQLite.Database) => {
  console.log(`Processing emojis into database...`);

  const insertOrUpdateCategory = database.prepare(`
    INSERT INTO categories (id, name, count, display_order)
    VALUES (@id, @name, @count, @display_order)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      count=excluded.count,
      display_order=excluded.display_order
  `);

  const insertOrUpdateEmoji = database.prepare(`
    INSERT INTO emojis (id, category_id, code, name, tags, emoticons, skins)
    VALUES (@id, @category_id, @code, @name, @tags, @emoticons, @skins)
    ON CONFLICT(id) DO UPDATE SET
      category_id=excluded.category_id,
      code=excluded.code,
      name=excluded.name,
      tags=excluded.tags,
      emoticons=excluded.emoticons,
      skins=excluded.skins
  `);

  const deleteSearch = database.prepare(`
    DELETE FROM emoji_search WHERE id = @id
  `);

  const insertSearch = database.prepare(`
    INSERT INTO emoji_search (id, text)
    VALUES (
      @id,
      @text
    )
  `);

  const insertOrReplaceSVG = database.prepare(`
    INSERT OR REPLACE INTO emoji_svgs (skin_id, emoji_id, svg)
    VALUES (@skin_id, @emoji_id, @svg)
  `);

  const existingMetadata = readExistingMetadata(database);

  const emojiMartData = JSON.parse(
    fs.readFileSync(EMOJI_MART_DATA_FILE_PATH, 'utf-8')
  ) as EmojiMartData;

  const i18nData = JSON.parse(
    fs.readFileSync(EMOJI_MART_I18N_FILE_PATH, 'utf-8')
  ) as EmojiMartI18n;

  const codeToEmojiId: Record<string, string> = {};
  let maxDisplayOrder = 0;

  console.log(`Processing categories and their emojis...`);
  for (const category of Object.values(emojiMartData.categories)) {
    const i18nCategory = i18nData.categories[category.id];
    if (!i18nCategory) {
      throw new Error(`Category ${category.id} not found in i18n data`);
    }

    console.log(
      `Processing category: ${i18nCategory} (${category.emojis.length} emojis)`
    );

    const existingCategory = existingMetadata.categories.find(
      (c) => c.id === category.id
    );
    const displayOrder = existingCategory
      ? existingCategory.display_order
      : maxDisplayOrder + 1;

    insertOrUpdateCategory.run({
      id: category.id,
      name: i18nCategory,
      count: category.emojis.length,
      display_order: displayOrder,
    });

    if (displayOrder > maxDisplayOrder) {
      maxDisplayOrder = displayOrder;
    }

    for (const emojiCode of category.emojis) {
      const emojiMartItem = emojiMartData.emojis[emojiCode];
      if (!emojiMartItem) {
        console.warn(`Emoji ${emojiCode} not found in emoji data`);
        continue;
      }

      const existingEmoji = Object.values(existingMetadata.emojis).find(
        (e) => e.code === emojiMartItem.id
      );

      const finalEmojiId = existingEmoji
        ? existingEmoji.id
        : generateId(IdType.Emoji);

      const newEmoji: Emoji = {
        id: finalEmojiId,
        code: emojiMartItem.id,
        name: emojiMartItem.name,
        tags: emojiMartItem.keywords,
        emoticons: emojiMartItem.emoticons,
        skins: [],
      };

      if (existingEmoji) {
        for (const skin of emojiMartItem.skins) {
          const existingSkin = existingEmoji.skins.find(
            (s) => s.unified === skin.unified
          );

          const skinId = existingSkin?.id ?? generateId(IdType.EmojiSkin);
          newEmoji.skins.push({ id: skinId, unified: skin.unified });
        }
      } else {
        for (const skin of emojiMartItem.skins) {
          newEmoji.skins.push({
            id: generateId(IdType.EmojiSkin),
            unified: skin.unified,
          });
        }
      }

      insertOrUpdateEmoji.run({
        id: newEmoji.id,
        category_id: category.id,
        code: newEmoji.code,
        name: newEmoji.name,
        tags: JSON.stringify(newEmoji.tags),
        emoticons: JSON.stringify(newEmoji.emoticons || []),
        skins: JSON.stringify(newEmoji.skins),
      });

      const text = [
        newEmoji.name,
        ...newEmoji.tags,
        ...(newEmoji.emoticons || []),
      ].join(' ');

      deleteSearch.run({ id: newEmoji.id });

      insertSearch.run({
        id: newEmoji.id,
        text,
      });

      for (const skin of newEmoji.skins) {
        const fileName = getEmojiSkinFileName(skin.unified);
        const sourceFilePath = path.join(TWEEMOJI_SVG_DIR_PATH, fileName);

        if (!fs.existsSync(sourceFilePath)) {
          console.warn(`Missing SVG for ${skin.unified} at ${fileName}`);
          continue;
        }

        const svgBuffer = fs.readFileSync(sourceFilePath);
        insertOrReplaceSVG.run({
          skin_id: skin.id,
          emoji_id: newEmoji.id,
          svg: svgBuffer,
        });
      }

      codeToEmojiId[emojiMartItem.id] = finalEmojiId;
    }
  }

  console.log(`Done processing emojis into database.`);
};

const generateEmojis = async () => {
  if (!fs.existsSync(WORK_DIR_PATH)) {
    fs.mkdirSync(WORK_DIR_PATH);
  }

  await downloadEmojiMartRepo();
  await downloadTweemojiRepo();

  const db = initDatabase();
  processEmojisIntoDb(db);

  console.log(`Cleaning up...`);

  fs.rmSync(WORK_DIR_PATH, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 1000,
  });

  console.log(`All done. The 'emojis.db' file now contains everything!`);
};

generateEmojis().catch((err) => {
  console.error(err);
  process.exit(1);
});
