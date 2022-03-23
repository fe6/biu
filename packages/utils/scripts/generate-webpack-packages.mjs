/** @format */

import { join } from 'path';
import { logger } from '@fe6/biu-utils';

const base = join(__dirname, '../bundles/webpack/');
const files = require(join(base, 'packages/deepImports.json'));

files.forEach((file) => {
  const name = file.split('/').slice(-1)[0];
  logger.success(`write packages/${name}.js`);

  fs.writeFileSync(
    join(base, 'packages', `${name}.js`),
    `module.exports = require('./').${name};\n`,
    'utf-8',
  );
});
