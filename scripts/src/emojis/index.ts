import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { EmojiMartData } from '@emoji-mart/data';
import { monotonicFactory } from 'ulid';

const ulid = monotonicFactory();

type EmojiMartI18n = {
  categories: Record<string, string>;
};

const emojiMartDataPath = 'node_modules/@emoji-mart/data/sets/15/twitter.json';
const emojiMartData = JSON.parse(
  fs.readFileSync(emojiMartDataPath, 'utf-8')
) as EmojiMartData;

const i18nPath = 'node_modules/@emoji-mart/data/i18n/en.json';
const i18nData = JSON.parse(
  fs.readFileSync(i18nPath, 'utf-8')
) as EmojiMartI18n;

const EMOJIS_DIR_PATH = 'src/emojis/out';
const EMOJIS_METADATA_FILE_PATH = `${EMOJIS_DIR_PATH}/emojis.json`;
const ZIP_FILE_PATH = `src/emojis/emojis.zip`;

type EmojiMetadata = {
  categories: EmojiCategory[];
  emojis: Record<string, Emoji>;
};

type Emoji = {
  id: string;
  code: string;
  name: string;
  tags: string[];
  emoticons: string[] | undefined;
  skins: EmojiSkin[];
};

type EmojiCategory = {
  id: string;
  name: string;
  emojis: string[];
};

type EmojiSkin = {
  id: string;
  unified: string;
};

const generateEmojiId = () => {
  return ulid().toLowerCase() + 'em';
};

const getEmojiUrl = (unified: string) => {
  let file = unified;

  // Fix for "copyright" and "trademark" emojis
  if (file.substring(0, 2) == '00') {
    file = file.substring(2);

    // Fix for keycap emojis
    const regex = /-fe0f/i;
    file = file.replace(regex, '');
  }

  if (file.startsWith('1f441')) {
    const regex = /-fe0f/gi;
    file = file.replace(regex, '');
  }

  if (file.endsWith('-fe0f')) {
    const parts = file.split('-');
    if (parts.length === 2 && parts[0]) {
      file = parts[0];
    }
  }

  return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${file}.svg`;
};

const generateMetadata = () => {
  const existingEmojis: EmojiMetadata = fs.existsSync(EMOJIS_METADATA_FILE_PATH)
    ? (JSON.parse(
        fs.readFileSync(EMOJIS_METADATA_FILE_PATH, 'utf-8')
      ) as EmojiMetadata)
    : { emojis: {}, categories: [] };

  const result: EmojiMetadata = {
    categories: [],
    emojis: {},
  };

  const idMap: Record<string, string> = {};

  for (const emojiMartItem of Object.values(emojiMartData.emojis)) {
    const existingEmoji = Object.values(existingEmojis.emojis).find(
      (emoji) => emoji.code === emojiMartItem.id
    );

    const emojiId = existingEmoji ? existingEmoji.id : generateEmojiId();
    const emoji: Emoji = {
      id: emojiId,
      code: emojiMartItem.id,
      name: emojiMartItem.name,
      tags: emojiMartItem.keywords,
      emoticons: emojiMartItem.emoticons,
      skins: emojiMartItem.skins.map((skin) => ({
        id:
          existingEmoji?.skins.find((s) => s.unified === skin.unified)?.id ??
          generateEmojiId(),
        unified: skin.unified,
      })),
    };

    idMap[emoji.code] = emoji.id;
    result.emojis[emojiId] = emoji;
  }

  for (const emojiMartCategory of Object.values(emojiMartData.categories)) {
    const i18nCategory = i18nData.categories[emojiMartCategory.id];

    if (!i18nCategory) {
      throw new Error(
        `Category ${emojiMartCategory.id} not found in i18n data`
      );
    }

    const categoryEmojis: string[] = [];
    for (const emoji of emojiMartCategory.emojis) {
      if (!idMap[emoji]) {
        throw new Error(`Emoji ${emoji} not found in idMap`);
      }

      categoryEmojis.push(idMap[emoji]);
    }

    const category: EmojiCategory = {
      id: emojiMartCategory.id,
      name: i18nCategory,
      emojis: categoryEmojis,
    };

    result.categories.push(category);
  }

  fs.writeFileSync(EMOJIS_METADATA_FILE_PATH, JSON.stringify(result, null, 2));
};

const generateImages = async () => {
  if (!fs.existsSync(EMOJIS_DIR_PATH)) {
    fs.mkdirSync(EMOJIS_DIR_PATH);
  }

  const emojis = JSON.parse(
    fs.readFileSync(EMOJIS_METADATA_FILE_PATH, 'utf-8')
  ) as EmojiMetadata;

  for (const emoji of Object.values(emojis.emojis)) {
    for (const skin of emoji.skins) {
      const fileName = `${skin.id}.svg`;
      const filePath = path.join(EMOJIS_DIR_PATH, fileName);
      if (fs.existsSync(filePath)) {
        continue;
      }

      const url = getEmojiUrl(skin.unified);
      console.log(`Downloading ${url} to ${filePath}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download ${url}`);
      }

      const svg = await response.text();
      fs.writeFileSync(filePath, svg);

      // Rate limit
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
};

const zipEmojis = async () => {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(ZIP_FILE_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zipped ${archive.pointer()} total bytes`);
      resolve(void 0);
    });

    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(EMOJIS_DIR_PATH, false);
    archive.finalize();
  });
};

const generateEmojis = async () => {
  if (!fs.existsSync(EMOJIS_DIR_PATH)) {
    fs.mkdirSync(EMOJIS_DIR_PATH);
  }

  generateMetadata();
  await generateImages();
  await zipEmojis();
};

generateEmojis();
