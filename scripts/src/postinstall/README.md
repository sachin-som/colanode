# Colanode postinstall script

This directory contains the **postinstall script** that automatically copies and updates emoji and icon SQLite databases within the **Colanode** desktop application after each dependency installation. It ensures that the latest emojis and icons are always present in the `apps/desktop/assets` folder without requiring manual intervention.

The primary purpose of this script is to maintain updated emojis and icons in the desktop application (and potentially other future apps) without committing thousands of individual files to version control. Given that there are roughly 3,500 emoji files and 4,800 icon files, storing them directly in the app’s repository would significantly bloat the codebase and produce large diffs whenever assets are updated or reorganized. Instead, these assets are stored in respective SQLite database files in the `scripts` directory and automatically extracted into the desktop app’s `assets` folder during dependency installation. This ensures that all necessary emojis and icons are available for both development and production builds, while also preventing the repository from becoming unwieldy. The `apps/desktop/assets/emojis.db` and `apps/desktop/assets/icons.db` directories are therefore ignored by Git.

For more information about how these emojis or icons are generated and zipped, check:

- [Emoji generation script](../emojis)
- [Icon generation script](../icons)

## Usage

While it’s normally triggered by the monorepo’s `postinstall` hook, you can manually invoke it if you’d like:

```bash
node --no-warnings --loader ts-node/esm scripts/src/postinstall/index.ts
```
