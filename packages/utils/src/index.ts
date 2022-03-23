/** @format */

// ! types
export type { Compiler, Stats } from '../compiled/webpack';
import type webpack from '../compiled/webpack';
// ! types

// * utils
import * as logger from './logger';
export * as register from './register';
export * as utils from './utils';
// * utils

// ? deps
import yParser from '../compiled/yargs-parser';
import chalk from '../compiled/chalk';
import esbuild from '../compiled/esbuild';
import crossSpawn from '../compiled/cross-spawn';
import fsExtra from '../compiled/fs-extra';
import lodash from '../compiled/lodash';
// FIX cli 中找不到
// import { Configuration as WebpackConfiguration, ResolveOptions as WebpackResolveOptions, RuleSetRule as WebpackRuleSetRule, container as webpackContainer } from '../compiled/webpack'
import { Options as WebpackHtmlPluginOption } from '../compiled/html-webpack-plugin';
import webpackServer, {
  Configuration as WebpackServerConfiguration,
} from '../compiled/webpack-dev-server/lib/Server';
import webpackChain from '../compiled/webpack-5-chain';
import reactRefreshWebpack from '@pmmmwh/react-refresh-webpack-plugin';
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
  // FIX cli 中找不到
  // webpackContainer,
  // WebpackRuleSetRule,
  // WebpackConfiguration,
  // WebpackResolveOptions,
  reactRefreshWebpack,
  WebpackHtmlPluginOption,
  webpackServer,
  WebpackServerConfiguration,
  webpackChain,
};
