/** @format */

import { TConfig } from '../config';
//
export type TExternalsItem = {
  /**
   * 模块名
   * @example react-dom
   */
  module?: string;
  /**
   * 全局变量
   * @example ReactDom
   */
  global?: string;
  /**
   * 入口地址
   * 不填则可以通过 emp-config 里的 html.files.js[url] 传入合并后的请求
   * 如 http://...?react&react-dom&react-router&mobx
   * @example http://
   */
  entry?: string;
  /**
   * 类型入口
   * @default js
   * @enum js | css
   * @example css
   */
  type?: string;
};
export type TExternalsFunc = (
  config: TConfig,
) => TExternalsItem[] | Promise<TExternalsItem[]>;
export type TExternals = TExternalsItem[] | TExternalsFunc;
