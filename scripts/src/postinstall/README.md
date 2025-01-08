# Colanode postinstall script

This directory contains the **postinstall script** that automatically extracts and updates emoji and icon assets within the **Colanode** desktop application after each dependency installation. By checking for changes in the existing metadata files, this script ensures that the latest emojis and icons are always present in the `apps/desktop/assets` folder without requiring manual intervention.

The primary purpose of this script is to maintain updated emojis and icons in the desktop application (and potentially other future apps) without committing thousands of individual files to version control. Given that there are roughly 3,500 emoji files and 4,800 icon files, storing them directly in the app’s repository would significantly bloat the codebase and produce large diffs whenever assets are updated or reorganized. Instead, these assets are packaged as ZIP files in the `scripts` directory and automatically extracted into the desktop app’s `assets` folder during dependency installation. This ensures that all necessary emojis and icons are available for both development and production builds, while also preventing the repository from becoming unwieldy. The `apps/desktop/assets/emojis` and `apps/desktop/assets/icons` directories are therefore ignored by Git.

For more information about how these emojis or icons are generated and zipped, check:

- [Emoji generation script](../emojis)
- [Icon generation script](../icons)

## How It Works

1. **Compare Metadata Files**  
   The script checks whether the current metadata files in `apps/desktop/assets/emojis/` and `apps/desktop/assets/icons/` match those in the `scripts/src/emojis` and `scripts/src/icons` directories. If no changes are detected, it does nothing—this saves time during routine installs.

2. **Copy & Extract Assets**  
   If there are updates:

   - **Emojis**: Copies the `emojis.json` file to the desktop app’s `assets/emojis/` folder and extracts all SVG files from `emojis.zip` into that same folder.
   - **Icons**: Copies the `icons.json` file to `assets/icons/` and extracts all SVG files from `icons.zip`.

3. **Automatic Execution**  
   This script typically runs right after every `npm install` within the monorepo, so you rarely need to run it manually. It serves as a final step in aligning local assets with the latest changes from the `scripts` directory.

## Usage

While it’s normally triggered by the monorepo’s `postinstall` hook, you can manually invoke it if you’d like:

```bash
node --no-warnings --loader ts-node/esm scripts/src/postinstall/index.ts
```
