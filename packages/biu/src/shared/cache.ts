/** @format */

import path from 'path';
import { lodash } from '@fe6/biu-utils';
import { TCmdOptions, TPkg, ENUM_ENV } from '../types';
import { mergeConfig, TConfig, Config } from '../config';

class BiuCache {
  constructor() {}
  /**
   * 项目pkg信息
   */
  public pkg: TPkg = {
    dependencies: {},
    devDependencies: {},
    version: '0.0.0',
    name: '',
  };
  /**
   * biu 内部根路径
   * @default path.resolve(__dirname, '../../')
   */
  public biuRoot = path.resolve(__dirname, '../../');
  /**
   * 是否 ESM 模块
   */
  public isESM = false;
  /**
   * 项目根目录绝对路径
   * @default process.cwd()
   */
  public root = process.cwd();
  /**
   * biu 执行代码路径
   */
  public biuSource = path.resolve(this.biuRoot, 'dist');
  /**
   * 项目配置
   */
  public config: TConfig = mergeConfig();
  /**
   * 获取项目 根目录绝对路径
   * @param relativePath
   * @returns
   */
  public getProjectResolve = (relativePath: string) =>
    path.resolve(this.root, relativePath);

  async setup(mode: ENUM_ENV, cmdOptions: TCmdOptions) {
    // 项目 package.json
    const pkg = require(this.getProjectResolve('package.json'));
    this.pkg = { ...this.pkg, ...pkg };
    // 设置配置
    const configManager = new Config({
      cwd: this.root,
      mode,
      cmdOptions,
    });
    this.config = lodash.cloneDeep(configManager.currentConfig);
    this.isESM = ['es3', 'es5'].indexOf(this.config.build.target) === -1;
  }
}

export default new BiuCache();
