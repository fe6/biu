/** @format */

import { ResolveOptions } from '@fe6/biu-utils/compiled/webpack';
export type TModeType =
  | 'development'
  | 'test'
  | 'production'
  | 'none'
  | undefined;

export enum ENUM_ENV {
  development = 'development',
  production = 'production',
  test = 'test',
}

export type TCmdOptionsType = { [key: string]: string | number | boolean } & {
  /**
   * 全局环境变量
   * dotenv 先根据env做判断、否则再按照 webpack mode 做判断
   */
  env?: ENUM_ENV;
  analyze?: boolean;
  typingsPath?: string;
};

export type Override<What, With> = Omit<What, keyof With> & With;

export type ConfigResolveAliasType = { [index: string]: string };
export type ConfigResolveType = {
  modules: ResolveOptions['modules'];
  alias: ConfigResolveAliasType;
  extensions: ResolveOptions['extensions'];
  extends: boolean;
};
export type TPkgType = {
  dependencies: any;
  devDependencies: any;
  version: string;
  name: string;
  [key: string]: any;
};
