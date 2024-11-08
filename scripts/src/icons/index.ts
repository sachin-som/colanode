import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { monotonicFactory } from 'ulid';
import { getIconsData, getIconSlug } from 'simple-icons/sdk';

const ulid = monotonicFactory();

const CDN_URL = 'https://cdn.jsdelivr.net/gh';

const REMIX_ICONS_DIR_PATH = 'node_modules/remixicon/icons';
const REMIX_ICON_TAGS = `${CDN_URL}/Remix-Design/RemixIcon/tags.json`;

const SIMPLE_ICONS_DIR_PATH = 'node_modules/simple-icons/icons';

const ICONS_DIR_PATH = 'src/icons/out';
const ICONS_METADATA_FILE_PATH = `${ICONS_DIR_PATH}/icons.json`;
const ZIP_FILE_PATH = 'src/icons/icons.zip';

type IconMetadata = {
  categories: IconCategory[];
  icons: Record<string, Icon>;
};

type Icon = {
  id: string;
  name: string;
  code: string;
  tags: string[];
};

type IconCategory = {
  id: string;
  name: string;
  icons: string[];
};

const generateIconId = () => {
  return ulid().toLowerCase() + 'ic';
};

const fetchRemixIconTags = async (): Promise<
  Record<string, Record<string, string>>
> => {
  const response = await fetch(REMIX_ICON_TAGS);
  if (!response.ok) {
    throw new Error('Failed to fetch remix icon tags');
  }

  const json = await response.json();
  return json as Record<string, Record<string, string>>;
};

const readMetadata = (): IconMetadata => {
  if (!fs.existsSync(ICONS_METADATA_FILE_PATH)) {
    return { categories: [], icons: {} };
  }

  return JSON.parse(
    fs.readFileSync(ICONS_METADATA_FILE_PATH, 'utf-8')
  ) as IconMetadata;
};

const generateMetadata = async () => {
  const existingMetadata = readMetadata();
  const result: IconMetadata = {
    categories: [],
    icons: {},
  };

  const remixIconTags = await fetchRemixIconTags();

  const categoryDirs = fs.readdirSync(REMIX_ICONS_DIR_PATH);
  for (const categoryDir of categoryDirs) {
    const categoryId = categoryDir.toLowerCase().replace(/\s+/g, '-');
    const category: IconCategory = {
      id: categoryId,
      name: categoryDir,
      icons: [],
    };

    const categoryTags = remixIconTags[categoryDir] ?? {};

    const iconFiles = fs.readdirSync(`${REMIX_ICONS_DIR_PATH}/${categoryDir}`);
    for (const iconFile of iconFiles) {
      const fileName = iconFile.replace('.svg', '');
      if (fileName.endsWith('-fill')) {
        continue;
      }

      const iconName = fileName.replace('-line', '');
      const iconCode = `ri-${iconName}`;

      const existingIcon = Object.values(existingMetadata.icons).find(
        (icon) => icon.code === iconCode
      );

      const iconTags = new Set<string>(iconName.split('-'));
      if (categoryTags[iconName]) {
        const extraTags = categoryTags[iconName].split(',');
        for (const extraTag of extraTags) {
          // Only accept tags that contain English letters (a-z, A-Z)
          const isEnglish = /^[a-zA-Z]+$/.test(extraTag.trim());
          if (isEnglish) {
            iconTags.add(extraTag);
          }
        }
      }

      const iconId = existingIcon ? existingIcon.id : generateIconId();
      const icon: Icon = {
        id: iconId,
        name: iconName,
        code: iconCode,
        tags: Array.from(iconTags),
      };

      result.icons[iconId] = icon;
      category.icons.push(iconId);

      const sourceFilePath = `${REMIX_ICONS_DIR_PATH}/${categoryDir}/${iconFile}`;
      const targetFilePath = `${ICONS_DIR_PATH}/${iconId}.svg`;
      if (!fs.existsSync(targetFilePath)) {
        fs.copyFileSync(sourceFilePath, targetFilePath);
      }
    }

    result.categories.push(category);
  }

  const logosCategory: IconCategory = {
    id: 'logos',
    name: 'Logos',
    icons: [],
  };

  const simpleIconsData = await getIconsData();
  for (const simpleIcon of simpleIconsData) {
    const simpleIconTitle = simpleIcon.title;
    const simpleIconSlug = getIconSlug(simpleIcon);

    const iconCode = `si-${simpleIconSlug}`;

    const existingIcon = Object.values(existingMetadata.icons).find(
      (icon) => icon.code === iconCode
    );

    const iconTags = new Set<string>([
      simpleIconTitle.toLowerCase(),
      simpleIconSlug,
    ]);

    const iconId = existingIcon ? existingIcon.id : generateIconId();
    const icon: Icon = {
      id: iconId,
      name: simpleIconTitle,
      code: iconCode,
      tags: Array.from(iconTags),
    };

    result.icons[iconId] = icon;
    logosCategory.icons.push(iconId);

    const sourceFilePath = `${SIMPLE_ICONS_DIR_PATH}/${simpleIconSlug}.svg`;
    const targetFilePath = `${ICONS_DIR_PATH}/${iconId}.svg`;
    if (!fs.existsSync(targetFilePath)) {
      fs.copyFileSync(sourceFilePath, targetFilePath);
    }
  }

  result.categories.push(logosCategory);

  fs.writeFileSync(ICONS_METADATA_FILE_PATH, JSON.stringify(result, null, 2));
};

const zipIcons = async () => {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(ZIP_FILE_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Zipped ${archive.pointer()} total bytes`);
      resolve(void 0);
    });

    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(ICONS_DIR_PATH, false);
    archive.finalize();
  });
};

const generateIcons = async () => {
  if (!fs.existsSync(ICONS_DIR_PATH)) {
    fs.mkdirSync(ICONS_DIR_PATH);
  }

  generateMetadata();
  await zipIcons();
};

generateIcons();
