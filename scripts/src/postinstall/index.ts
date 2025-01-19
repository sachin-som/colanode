import path from 'path';
import fs from 'fs';

const copyEmojisDb = () => {
  const sourcePath = path.resolve('scripts', 'src', 'emojis', 'emojis.db');
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  const targetDir = path.resolve('apps', 'desktop', 'assets');
  if (!fs.existsSync(targetDir)) {
    return;
  }

  const targetPath = path.resolve(targetDir, 'emojis.db');
  fs.copyFileSync(sourcePath, targetPath);
};

const copyIconsDb = () => {
  const sourcePath = path.resolve('scripts', 'src', 'icons', 'icons.db');
  if (!fs.existsSync(sourcePath)) {
    return;
  }

  const targetDir = path.resolve('apps', 'desktop', 'assets');
  if (!fs.existsSync(targetDir)) {
    return;
  }

  const targetPath = path.resolve(targetDir, 'icons.db');
  fs.copyFileSync(sourcePath, targetPath);
};

const execute = () => {
  copyEmojisDb();
  copyIconsDb();
};

execute();
