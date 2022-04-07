/** @format */

// ? deps
import yParser from '../compiled/yargs-parser';
import chalk from '../compiled/chalk';
import esbuild from '../compiled/esbuild';
import crossSpawn from '../compiled/cross-spawn';
import fsExtra from '../compiled/fs-extra';
import lodash from '../compiled/lodash';
export * from '../compiled/commander';
import { Options as WebpackHtmlPluginOption } from '../compiled/html-webpack-plugin';
import webpackChain from '../compiled/webpack-5-chain';
import reactRefreshWebpack from '@pmmmwh/react-refresh-webpack-plugin';
// ? deps

export {
  yParser,
  chalk,
  crossSpawn,
  esbuild,
  fsExtra,
  lodash,
  reactRefreshWebpack,
  WebpackHtmlPluginOption,
  webpackChain,
};
