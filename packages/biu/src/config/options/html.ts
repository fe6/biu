/** @format */

import { Options as WebpackHtmlPluginOption } from '@fe6/biu-deps/compiled/html-webpack-plugin';
import store from '../../shared/cache';
// import fs from 'fs'
import { TOverride } from '../../types';

export interface IHtmlOptions extends WebpackHtmlPluginOption {
  /**
   * 基于项目的根目录 index.html url
   * @default src/index.html
   */
  template?: string;
  /**
   * 基于项目的根目录 favicon url
   * @default src/favicon.ico
   */
  favicon?: string | false;
  /**
   * externals 文件插入到html
   */
  files?: {
    /**
     * 插入 css
     */
    css?: string[];
    /**
     * 插入 js
     */
    js?: string[];
  };
}
export type TInitHtml = TOverride<
  WebpackHtmlPluginOption,
  {
    files: {
      css: string[];
      js: string[];
    };
  }
>;

// TODO 模板
export const initHtml = (o: WebpackHtmlPluginOption = {}): TInitHtml => {
  let template = o.template || 'src/index.html';
  let favicon = o.favicon || 'src/favicon.ico';
  if (store) {
    // template = store.getProjectResolve(template)
    console.log(template, 'TODO template');
    // if (!fs.existsSync(template)) {
    //   template = store.biuResolve('template/index.html')
    // }
    // favicon = store.getProjectResolve(favicon)
    // if (!fs.existsSync(favicon)) {
    //   favicon = store.biuResolve('template/favicon.ico')
    // }
  }
  const title = 'EMP';
  return { title, files: { css: [], js: [] }, ...o, template, favicon };
};
