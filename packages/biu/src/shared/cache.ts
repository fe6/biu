/** @format */

import path from 'path';
import { cloneDeep } from '@fe6/biu-deps-webpack/compiled/lodash';
import { TCmdOptions, TPkg, TMode } from '../types';
import { TConfig, Config } from '../config';
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

  // 命令的参数集合
  public cmdOpts: TCmdOptions = {};
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
  public config: TConfig = {} as TConfig;

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
  public isReact = false;
  public isVue = false;
  // 是 vue 项目还是 react 项目
  public projectLibName = '';
  // 项目框架的版本号
  // vue: '^3.2.4' | '~3.2.4' => [3,2,4]
  // vue: '^3.2' | '~3.2' | '^3.2.x' | '~3.2.x' => [3,2,*]
  // vue: '^3' | '~3' | '^3.x' | '~3.x' => [3,*,*]
  public projectLibVersion: string[] = [];
  // 开发依赖
  public devDeps: any = {};
  // 运行依赖
  public runDeps: any = {};
  /**
   * 获取项目 根目录绝对路径
   * @param relativePath
   * @returns
   */
  public resolve = (relativePath: string): string =>
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

  setProjectVersion(libVersion: string) {
    const theVersion = libVersion.replace(/^\^|~/, '').replace(/\.x/, '');
    let theArrVersion = theVersion.split('.');

    if (theArrVersion.length === 1) {
      theArrVersion = [...theArrVersion, '*', '*'];
    }

    if (theArrVersion.length === 2) {
      theArrVersion = [...theArrVersion, '*'];
    }
    this.projectLibVersion = theArrVersion.fill('*', theArrVersion.length);
  }

  setProjectInfo() {
    const { runDeps, devDeps } = this;
    const theDepsKeys = runDeps ? Object.keys(runDeps) : [];
    const theDevDepsKeys = devDeps ? Object.keys(devDeps) : [];
    if (theDepsKeys.indexOf('vue') > -1) {
      this.isVue = true;
      this.projectLibName = 'vue';
      this.setProjectVersion(runDeps[this.projectLibName]);
    } else if (theDevDepsKeys.indexOf('vue') > -1) {
      this.isVue = true;
      this.projectLibName = 'vue';
      this.setProjectVersion(devDeps[this.projectLibName]);
    } else if (theDepsKeys.indexOf('react') > -1) {
      this.isReact = true;
      this.projectLibName = 'react';
      this.setProjectVersion(runDeps[this.projectLibName]);
    } else if (theDevDepsKeys.indexOf('react') > -1) {
      this.isReact = true;
      this.projectLibName = 'react';
      this.setProjectVersion(devDeps[this.projectLibName]);
    } else {
      this.projectLibName = '';
    }
  }

  async setup(mode: TMode, cmdOptions: TCmdOptions) {
    // 存储命令参数
    this.cmdOpts = cmdOptions;
    // 项目 package.json
    const pkg = require(this.getProjectResolve('package.json'));
    this.pkg = { ...this.pkg, ...pkg };
    this.runDeps = pkg.dependencies;
    this.devDeps = pkg.devDependencies;
    // 设置项目的框架属性 vue or react
    this.setProjectInfo();
    // 设置配置
    const configManager = await new Config({
      cwd: this.root,
      mode,
      cmdOptions,
    });
    this.config = cloneDeep(configManager.currentConfig);
    this.isESM = ['es3', 'es5'].indexOf(this.config.build.target) === -1;
    //设置绝对路径
    this.setAbsPaths();
    // 对 react 单独设置
    this.checkAndSetReactVersion();
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
  private checkAndSetReactVersion() {
    if (this.isReact) {
      this.config.reactRuntime = 'automatic';
    }
  }
}

export default new BiuCache();
