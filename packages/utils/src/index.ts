/** @format */

// ! types
export type { Compiler, Stats } from '../compiled/webpack';
import type webpack from '../compiled/webpack';
// ! types

// * utils
import * as logger from './logger';
export * as register from './register';
// * utils

// ? deps
import yParser from '../compiled/yargs-parser';
import chalk from '../compiled/chalk';
import esbuild from '../compiled/esbuild';
import crossSpawn from '../compiled/cross-spawn';
import fsExtra from '../compiled/fs-extra';
import lodash from '../compiled/lodash';
// ? deps

export {
  logger,
  yParser,
  chalk,
  crossSpawn,
  esbuild,
  fsExtra,
  lodash,
  webpack,
};
