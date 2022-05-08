/** @format */

import { RuleSetRule as WebpackRuleSetRule } from '@fe6/biu-deps-webpack/compiled/webpack';
import {
  ENUM_ENV,
  TOverride,
  TEntries,
  TConfigDebug,
  TConfigResolve,
} from '../types';
import { TBiuShareExport } from '../types/biu-share';
import { WPChain } from '../shared/wp-chain';
import { TExternals } from '../types/externals';
import { TMFExport } from '../types/module-federation';
import { TBuildOptions } from './options/build';
import { TServerOptions } from './options/server';
import { IHtmlOptions } from './options/html';
import { TWebpackChain } from './options/chain';

export interface IConfigEnv {
  mode: ENUM_ENV;
  env?: string;
  [key: string]: any;
}

export interface IModuleTransform {
  exclude?: WebpackRuleSetRule['exclude'][];
  include?: WebpackRuleSetRule['include'][];
}

export type TBiuConfig = {
  /**
   * 项目根目录绝对路径 提供给 plugin 使用 一般不需要设置
   * @default process.cwd()
   */
  root?: string;
  /**
   * 项目代码路径
   * @default 'src'
   */
  appSrc?: string;
  /**
   * 项目代码入口文件 如 `src/main.js`
   * (*)entries 设置后 该选项失效
   * @default 'main.js'
   */
  appEntry?: string;
  /**
   * publicPath 根路径 可参考webpack,库模式 默认为 '' 避免加入 auto判断,业务模式默认为 auto
   * html 部分 publicPath 默认为 undefined,可设置全量域名或子目录适配，也可以单独在html设置 Public
   *
   * @default undefined
   */
  base?: string;
  /**
   * 静态文件路径
   * @default 'public'
   */
  publicDir?: string;
  /**
   * 缓存目录
   * @default 'node_modules/.emp-cache'
   */
  cacheDir?: string;
  /**
   * 调试模式为 development
   * 测试模式为 test
   * 构建模式为 production
   * 正式环境为 none
   */
  mode?: ENUM_ENV;
  /**
   * 全局环境替换
   */
  define?: Record<string, any>;
  /**
   * resolve
   */
  resolve?: TConfigResolve;
  /**
   * biu plugins
   */
  plugins?: TConfigPlugin[];
  /**
   * dev server
   */
  server?: TServerOptions;
  /**
   * build options
   */
  build?: TBuildOptions;
  /**
   * library externals
   */
  externals?: TExternals;
  /**
   * debug 选项
   */
  debug?: TConfigDebug;
  /**
   * webpackChain 暴露到 biu-config
   */
  webpackChain?: TWebpackChain;

  /**
   * module federation 配置
   */
  moduleFederation?: TMFExport;
  /**
   * biu share 配置
   * 实现3重共享模型
   * biushare 与 module federation 只能选择一个配置
   */
  biuShare?: TBiuShareExport;
  /**
   * 启用 import.meta
   * 需要在 script type=module 才可以执行
   * @default false
   */
  useImportMeta?: boolean;
  // TODO  启用 ForkTsChecker or Eslint
  // jsCheck?: boolean;
  /**
   * 启动 mini-css-extract-plugin
   * 分离 js里的css
   * @default true
   */
  splitCss?: boolean;
  /**
   * html-webpack-plugin 相关操作
   * (*)entries 设置后 会继承这里的操作
   */
  html?: IHtmlOptions;
  /**
   * 多页面模式
   * entryFilename 为基于 src目录如 `info/index`
   */
  entries?: TEntries;
  /**
   * React Runtime 手动切换jsx模式
   * 当 external react时需要设置
   * 本地安装时会自动判断 不需要设置
   * @default undefined
   */
  reactRuntime?: 'automatic' | 'classic';
  /**
   * typingsPath
   * @default ./src/empShareType
   * emp dts 类型同步
   */
  typingsPath?: string;
  /**
   * 模块编译
   * 如 node_modules 模块 是否加入编译
   */
  moduleTransform?: IModuleTransform;
};

export type TConfig = TOverride<
  Required<TBiuConfig>,
  {
    build: Required<TBuildOptions>;
    server: Required<TServerOptions>;
    moduleFederation?: TMFExport;
    externals?: TExternals;
    biuShare?: TBiuShareExport;
    webpackChain?: TWebpackChain;
    reactRuntime?: 'automatic' | 'classic';
    base?: string;
    // 环境变量前缀，只有带前缀的才会返回来供项目使用
    envPrefix: string[];
    // 环境变量的文件夹
    envDir: string;
    html: IHtmlOptions;
    entries?: TEntries;
    debug: TConfigDebug;
    mode: ENUM_ENV;
    dtsPath: { [key: string]: string };
    moduleTransform: IModuleTransform;
    moduleTransformExclude: WebpackRuleSetRule['exclude'];
  }
>;

export type TBiuConfigFn = (
  configEnv: IConfigEnv,
) => TBiuConfig | Promise<TBiuConfig>;

export type TBiuConfigExport = TBiuConfig | TBiuConfigFn;

export type TConfigPluginOptions = {
  wpChain: WPChain;
  config: TConfig;
};
export type TConfigPlugin = (o: TConfigPluginOptions) => void | Promise<void>;
