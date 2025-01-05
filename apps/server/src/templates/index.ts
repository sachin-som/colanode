import handlebars from 'handlebars';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, './');

export const emailVerifyTemplate = handlebars.compile(
  fs.readFileSync(path.join(templatesDir, 'email-verify.html'), 'utf8')
);
