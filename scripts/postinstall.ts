/** @format */

// Fork https://github.com/umijs/umi-next/blob/master/scripts/postinstall.ts

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as logger from '@fe6/biu-utils/src/logger';

// FIX bundle deps error
// ref: https://github.com/isaacs/node-graceful-fs/commit/e61a20a052b838f420b98195c232a824a6ac04ee
const GRACEFUL_FS_TO_REPLACE = `if(j.uid<0)j.uid+=4294967296;if(j.gid<0)j.gid+=4294967296;`;
const replaces = [
  // j is undefined when accessing .uid property
  [
    '[node-graceful-fs]',
    GRACEFUL_FS_TO_REPLACE,
    `/*${GRACEFUL_FS_TO_REPLACE}*//*PATCHED*/`,
  ],
  // when bundle pure esm package e.g. chalk@5
  // ncc will set esm to true, which will cause the error
  [
    '[esm]',
    'esm=entry.endsWith(".mjs")||!entry.endsWith(".cjs")&&hasTypeModule(entry)',
    'esm=false/*PATCHED*/',
  ],
];

logger.wait('patch ncc');
const path = join(
  __dirname,
  '../node_modules/@vercel/ncc/dist/ncc/index.js.cache.js',
);
const content = readFileSync(path, 'utf-8');
let ret = content;
for (const replace of replaces) {
  if (ret.includes(replace[2])) {
    logger.ready(`${replace[0]} already patched`);
  } else {
    logger.wait(`${replace[0]} patching`);
    ret = ret.replace(replace[1], replace[2]);
  }
}

writeFileSync(path, ret, 'utf-8');
