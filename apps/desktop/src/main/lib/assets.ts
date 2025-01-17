import fs from 'fs';
import path from 'path';

import { getAssetsSourcePath } from '@/main/utils';
import { EmojiData } from '@/shared/types/emojis';
import { IconData } from '@/shared/types/icons';

export const getEmojiData = (): EmojiData => {
  const emojisMetadataPath = path.join(
    getAssetsSourcePath(),
    'emojis',
    'emojis.json'
  );
  return JSON.parse(fs.readFileSync(emojisMetadataPath, 'utf8'));
};

export const getIconData = (): IconData => {
  const iconsMetadataPath = path.join(
    getAssetsSourcePath(),
    'icons',
    'icons.json'
  );
  return JSON.parse(fs.readFileSync(iconsMetadataPath, 'utf8'));
};
