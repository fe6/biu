/** @format */

import path from 'path';
import { cloneDeep } from '@fe6/biu-deps/compiled/lodash';
import { TCmdOptions, TPkg, ENUM_ENV } from '../types';
import { mergeConfig, TConfig, Config } from '../config';
import BiuShare from '../config/options/biu-share';

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
   * 源码地址 绝对路径
   */
  public appSrc = '';
  /**
   * 源码生成目录 绝对路径
   */
  public outDir = '';
  /**
   * 静态文件目录 绝对路径
   */
  public publicDir = '';
  /**
   * 缓存目录 绝对路径
   */
  public cacheDir = '';
  public biuShare = new BiuShare();
  /**
   * 获取项目 根目录绝对路径
   * @param relativePath
   * @returns
   */
  public resolve = (relativePath: string) =>
    path.resolve(this.root, relativePath);
  /**
   * 获取项目 emp内部根目录绝对路径
   * @param relativePath
   * @returns
   */
  public biuResolve = (relativePath: string) =>
    path.resolve(this.biuRoot, relativePath);
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
    this.config = cloneDeep(configManager.currentConfig);
    this.isESM = ['es3', 'es5'].indexOf(this.config.build.target) === -1;
    //设置绝对路径
    this.setAbsPaths();
    // TODO Lib
    // if (!this.config.build.lib) {
    //   // lib 模式下 忽略 biuShare 设置
    //   // biuShare 初始化
    //   await this.biuShare.setup()
    // }
    await this.biuShare.setup();
  }
  private setAbsPaths() {
    //
    this.appSrc = this.resolve(this.config.appSrc);
    this.outDir = this.resolve(this.config.build.outDir);
    this.publicDir = this.resolve(this.config.publicDir);
    this.cacheDir = this.resolve(this.config.cacheDir);
  }
}

export default new BiuCache();
