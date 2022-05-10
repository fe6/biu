/** @format */

import path from 'path';
import { RuleSetRule as WebpackRuleSetRule } from '@fe6/biu-deps-webpack/compiled/webpack';
import { TConfigDebug } from '../types';
import { initBuild } from './options/build';
import { initTs } from './options/ts';
import { initServer } from './options/server';
import { initHtml } from './options/html';

import { TConfig } from './types';

// 默认 BIU 配置
export const mergeConfig = (opts: any = {}): TConfig => {
  const build = initBuild(opts.build);
  delete opts.build;

  const server = initServer(opts.server);
  delete opts.server;

  const html = initHtml(opts.html);
  delete opts.html;

  const ts = initTs(opts.ts);
  delete opts.ts;

  const debug: TConfigDebug = {
    clearLog: true,
    profile: false,
    wplogger: false,
    progress: true,
    level: 'info',
    ...(opts.debug || {}),
  };
  delete opts.debug;

  const moduleTransformExclude: WebpackRuleSetRule['exclude'] = {
    and: [/(node_modules|bower_components)/],
  };
  opts.moduleTransform = opts.moduleTransform || {};
  if (opts.moduleTransform.exclude) {
    moduleTransformExclude.and = opts.moduleTransform.exclude;
  }
  if (opts.moduleTransform.include) {
    moduleTransformExclude.not = opts.moduleTransform.include;
  }

  return {
    ...{
      root: process.cwd(),
      env: undefined,
      appSrc: 'src',
      publicDir: 'public',
      cacheDir: 'node_modules/.biu-cache',
      build,
      envPrefix: ['BIU_'],
      envDir: ['./'],
      define: [],
      plugins: [],
      server,
      html,
      debug,
      useImportMeta: false,
      splitCss: true,
      appEntry: '',
      // TODO  启用 ForkTsChecker or Eslint
      // jsCheck: true,
      typingsPath: path.resolve('src', 'biu-share-types'),
      ts,
      moduleTransformExclude,
    },
    ...opts,
  };
};
