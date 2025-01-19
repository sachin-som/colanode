import path from 'path';
import fs from 'fs';

const copyEmojisDb = () => {
  const sourceEmojisDbPath = path.resolve(
    'scripts',
    'src',
    'emojis',
    'emojis.db'
  );

  if (!fs.existsSync(sourceEmojisDbPath)) {
    return;
  }

  const targetEmojisDbPath = path.resolve(
    'apps',
    'desktop',
    'assets',
    'emojis.db'
  );

  fs.copyFileSync(sourceEmojisDbPath, targetEmojisDbPath);
};

const copyIconsDb = () => {
  const sourceIconsDbPath = path.resolve('scripts', 'src', 'icons', 'icons.db');
  if (!fs.existsSync(sourceIconsDbPath)) {
    return;
  }

  const targetIconsDbPath = path.resolve(
    'apps',
    'desktop',
    'assets',
    'icons.db'
  );

  fs.copyFileSync(sourceIconsDbPath, targetIconsDbPath);
};

const execute = () => {
  copyEmojisDb();
  copyIconsDb();
};

execute();
