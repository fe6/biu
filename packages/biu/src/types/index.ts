/** @format */

import { ResolveOptions as WebpackResolveOptions } from '@fe6/biu-deps-webpack/compiled/webpack';
import { IHtmlOptions } from '../config/options/html';

export type TMode = 'development' | 'test' | 'production' | 'none' | undefined;

export enum ENUM_ENV {
  development = 'development',
  production = 'production',
  test = 'test',
}

export type TCmdOptions = { [key: string]: string | number | boolean } & {
  /**
   * 全局环境变量
   * dotenv 先根据env做判断、否则再按照 webpack mode 做判断
   */
  env?: ENUM_ENV;
  analyze?: boolean;
  // 配置文件
  config?: string;
  typingsPath?: string;
};

export type TOverride<What, With> = Omit<What, keyof With> & With;
export type TEntries = { [entryFilename: string]: IHtmlOptions };
export declare type TJscTarget =
  | 'es3'
  | 'es5'
  | 'es2015'
  | 'es2016'
  | 'es2017'
  | 'es2018'
  | 'es2019'
  | 'es2020'
  | 'es2021'
  | 'es2022';

export type TLoggerLevel = 'debug' | 'info' | 'warn' | 'error';

export type TConfigDebug = {
  clearLog: boolean;
  progress: boolean;
  profile: boolean;
  wplogger: boolean | string; // --wplogger [filename] 可以为 string
  /**
   * 日志级别
   */
  level: TLoggerLevel;
};

export type TConfigResolveAlias = { [index: string]: string };
export type TConfigResolve = {
  modules: WebpackResolveOptions['modules'];
  alias: TConfigResolveAlias;
  extensions: WebpackResolveOptions['extensions'];
  extends: boolean;
};
export type TPkg = {
  dependencies: any;
  devDependencies: any;
  version: string;
  name: string;
  [key: string]: any;
};

export type TExternalAssets = {
  js: string[];
  css: string[];
};
