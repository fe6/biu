/** @format */

import { Options as WebpackHtmlPluginOption } from '@fe6/biu-deps/compiled/html-webpack-plugin';
import { fsExtra } from '@fe6/biu-deps';

import store from '../../shared/cache';
import { TOverride } from '../../types';

export interface IHtmlOptions extends WebpackHtmlPluginOption {
  /**
   * 基于项目的根目录 index.html url
   * @default src/index.html
   */
  template?: string;
  /**
   * 基于项目的根目录 favicon url
   * 如果 shared/cache 中 projectLibName 的 favicon
   * 如 vue 项目，默认是 favicon-vue.ico
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
  let urlFavicon = '';
  const isUrlFavicon = /^https?:\/\//.test(favicon);

  if (store) {
    template = store.getProjectResolve(template);
    console.log(template, 'TODO URL template');
    if (!fsExtra.existsSync(template)) {
      template = store.biuResolve('template/index.html');
    }

    if (isUrlFavicon) {
      urlFavicon = favicon;
    } else {
      favicon = store.getProjectResolve(favicon);
      if (!fsExtra.existsSync(favicon)) {
        favicon = store.biuResolve(
          `template/favicon${
            store.projectLibName !== '' ? `-${store.projectLibName}` : ''
          }.ico`,
        );
      }
    }
  }
  const title = 'BIU';
  return {
    title,
    files: { css: [], js: [] },
    ...o,
    template,
    favicon: isUrlFavicon ? '' : favicon,
    urlFavicon,
  };
};
