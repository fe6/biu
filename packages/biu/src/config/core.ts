/** @format */

import { existsSync } from '@fe6/biu-deps/compiled/fs-extra';
import { join } from 'path';
import { fsExtra } from '@fe6/biu-deps';
import { TCmdOptions, TMode } from '../types';
import { DEFAULT_CONFIG_FILES } from '../contant';
import { TBiuConfigExport } from './types';
import { mergeConfig } from './def-conf';
import store from '../shared/cache';

interface IOpts {
  cwd: string;
  mode: TMode;
  cmdOptions: TCmdOptions;
  // specifiedEnv?: string;
}

export class Config {
  public opts: IOpts;
  public mainConfigFile: string;
  public prevConfig: any;
  public currentConfig: any;
  public files: string[] = [];
  constructor(opts: IOpts) {
    this.opts = opts;
    this.mainConfigFile = Config.getMainConfigFile(this.opts);
    this.prevConfig = null;
    this.setConfig(opts.mode, opts.cmdOptions);
  }

  static getMainConfigFile(opts: IOpts): string {
    if (opts.cmdOptions.config) {
      return join(opts.cwd, opts.cmdOptions.config);
    }
    let mainConfigFile = '';
    for (const configFile of DEFAULT_CONFIG_FILES) {
      const absConfigFile = join(opts.cwd, configFile);
      if (existsSync(absConfigFile)) {
        mainConfigFile = absConfigFile;
        break;
      }
    }
    return mainConfigFile;
  }

  async setConfig(mode: TMode, cmdOptions: TCmdOptions) {
    if (fsExtra.existsSync(this.mainConfigFile)) {
      const configExport: TBiuConfigExport = require(this.mainConfigFile);
      if (typeof configExport === 'function') {
        const conf = await configExport({
          mode,
          libName: store.projectLibName,
          libVersion: store.projectLibVersion,
          devDeps: store.devDeps,
          runDeps: store.runDeps,
          ...cmdOptions,
        });
        this.currentConfig = mergeConfig(conf);
      } else if (typeof configExport === 'object') {
        const conf: any = configExport;
        conf.env = mode;
        this.currentConfig = mergeConfig(conf);
      }
    } else {
      this.currentConfig = mergeConfig({ env: mode });
    }
    //初始化 构建 模式 环境变量
    this.currentConfig.mode = mode;
    this.currentConfig.env = cmdOptions.env;
  }
}
