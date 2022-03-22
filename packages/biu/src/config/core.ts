/** @format */

import { existsSync } from 'fs';
import { join } from 'path';
import { fsExtra } from '@fe6/biu-utils';
import { TCmdOptions, ENUM_ENV } from '../types';
import { DEFAULT_CONFIG_FILES, SHORT_ENV, LOCAL_EXT } from '../contant';
import { TBiuConfigExport } from './types';
import { mergeConfig } from './def-conf';

interface IOpts {
  cwd: string;
  mode: ENUM_ENV;
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

  static getMainConfigFile(opts: { cwd: string }): string {
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

  async setConfig(mode: ENUM_ENV, cmdOptions: TCmdOptions) {
    if (fsExtra.existsSync(this.mainConfigFile)) {
      const configExport: TBiuConfigExport = require(this.mainConfigFile);
      if (typeof configExport === 'function') {
        const conf = await configExport({ mode, ...cmdOptions });
        this.currentConfig = mergeConfig(conf);
      } else if (typeof configExport === 'object') {
        const conf: any = configExport;
        conf.env = mode;
        this.currentConfig = mergeConfig(conf);
      }
    } else {
      this.currentConfig = mergeConfig({ env: mode });
    }
  }
}
