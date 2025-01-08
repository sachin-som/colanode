# Colanode icon generator script

This directory contains a script that automatically downloads, processes, and packages various icon sets for **Colanode**. These icons are used across the Colanode platform where users assign them as icons for their entries: channels, pages, databases, records, folders etc.

By consolidating icons from [Remix Icon](https://github.com/Remix-Design/RemixIcon) and [Simple Icons](https://github.com/simple-icons/simple-icons), we provide a robust collection of icons—both general-purpose (Remix Icon) and brand-specific (Simple Icons)—for an optimal user experience.

## How It Works

1. **Download Required Repositories**

   - **Remix Icon** (from GitHub tag `v4.5.0`): Provides an extensive set of general-purpose icons, each organized into categories (e.g., “System,” “User Interface,” etc.).
   - **Simple Icons** (from GitHub tag `13.16.0`): Provides icons for popular brands, making it easy to visually represent external services or technologies.

2. **Extract & Organize Files**  
   The script:

   - Unzips the downloaded archives into a temporary working directory (`src/icons/temp`).
   - For **Remix Icon**, it reads a `tags.json` file (inside the unzipped folder) to identify additional icon tags and categories.
   - For **Simple Icons**, it reads a `_data/simple-icons.json` file to gather icon metadata (such as official title and slug).

3. **Generate or Update Metadata**

   - Creates or updates an `icons.json` file containing all icons with their respective metadata and unique IDs.
   - Merges any existing metadata from a previous run so as not to overwrite or lose previously assigned IDs. This way, icons already in use retain consistent IDs in the Colanode app.
   - Organizes icons into categories (for example, “System” categories from Remix Icon and a “Logos” category for all Simple Icons).
   - Renames and copies each SVG file (whether from **Remix Icon** or **Simple Icons**) into `src/icons/temp/icons` using the uniquely generated ID as the new filename (e.g., `01je8kh1h7zw2e14tqzkmwparcic.svg`).

4. **Zip the Results**
   - Packs all SVG files into a single `icons.zip` for convenient distribution or use elsewhere in the monorepo.
   - Cleans up temporary files and directories once everything is packaged.

## Usage

1. **Install Dependencies** (from the root of the monorepo):

   ```bash
   npm install
   ```

2. **Generate Icons** (from the `scripts` directory):

   ```bash
   npm run generate:icons
   ```

Once the script completes, you’ll have a fresh set of SVG icon files and an updated `icons.json` with all relevant metadata (IDs, categories, tags, etc.).

## Notes on Licensing

While **Colanode** is open source under its own [license terms](../../../LICENSE) in the root of the monorepo, the icons downloaded from **Remix Icon** and **Simple Icons** are subject to their respective licenses. Please review their repositories for details:

- [Remix Icon](https://github.com/Remix-Design/RemixIcon)
- [Simple Icons](https://github.com/simple-icons/simple-icons)
