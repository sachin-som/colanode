# Colanode emoji generator script

This directory contains a script that automatically downloads, processes, and packages emoji metadata and SVG files for **Colanode**. These emojis can then be used across the Colanode platform in two primary ways:

1. **Reactions to Messages** – Users can react to messages in chats or channels with these emojis.
2. **Icons** – Users can assign emojis as icons for their entries: channels, pages, databases, records, folders etc.

By consolidating emojis from [Emoji Mart](https://github.com/missive/emoji-mart) and [Twemoji](https://github.com/twitter/twemoji) (in our case, a forked [jdecked/twemoji](https://github.com/jdecked/twemoji)), we ensure broad coverage of Unicode emojis with consistent SVG assets for an optimal user experience.

## How It Works

1. **Download Required Repositories**

   - **Emoji Mart** (from GitHub tag `v5.6.0`): Provides emoji metadata (names, keywords, categories, etc.).
   - **Twemoji** (from GitHub tag `v15.1.0`): Provides SVG files for each emoji in the set.

2. **Extract & Organize Files**  
   The script:

   - Unzips the downloaded archives into a temporary working directory (`src/emojis/temp`).
   - Reads the **Emoji Mart** metadata (from `en.json` and `twitter.json`).
   - Reads the **Twemoji** SVG assets from the `assets/svg` directory.

3. **Process & Generate**

   - Creates or updates an `emojis.json` file containing all emojis with their respective metadata and unique IDs.
   - Merges any existing metadata from a previous run so as not to overwrite or lose previously assigned IDs. This way, emojis already in use retain consistent IDs in the Colanode app.
   - Renames and copies each Twemoji SVG file into `src/emojis/temp/emojis/` using the uniquely generated ID as the new filename (e.g., `01je8kh1h7zw2e14tqzkmwparcem.svg`).

4. **Zip the Results**
   - Combines all SVG files into a single `emojis.zip` for convenient distribution or reference in other parts of the monorepo.
   - Cleans up the temporary files/directories once everything is packaged.

## Usage

1. **Install Dependencies** (from the root of the monorepo):

   ```bash
   npm install
   ```

2. **Generate Emojis** (from the `scripts` directory):

   ```bash
   npm run generate:emojis
   ```

Once the script completes, you’ll have a fresh set of SVG emojis files and an updated `emojis.json` with all relevant metadata (IDs, categories, tags, etc.).

## Notes on Licensing

While **Colanode** is open source under its own [license terms](../../../LICENSE) (in the root of the monorepo), the emojis retrieved from **Emoji Mart** and **Twemoji** are subject to their respective licenses. Please review their repositories for details:

- [missive/emoji-mart](https://github.com/missive/emoji-mart)
- [jdecked/twemoji (originally Twitter’s Twemoji)](https://github.com/jdecked/twemoji)
