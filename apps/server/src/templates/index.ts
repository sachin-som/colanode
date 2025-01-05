import handlebars from 'handlebars';

import fs from 'fs';

export const emailVerifyTemplate = handlebars.compile(
  fs.readFileSync('./src/templates/email-verify.html', 'utf8')
);
