/** @format */

import { Options as WebpackHtmlPluginOption } from '@fe6/biu-deps-webpack/compiled/html-webpack-plugin';
import { fsExtra } from '@fe6/biu-deps';

import store from '../../shared/cache';

export interface IHtmlOptions extends WebpackHtmlPluginOption {
  /**
   * 基于项目的根目录 index.html url
   * @default src/index.html
   */
  template?: string;
  // 模板的地址
  urlTemplate?: string;
  /**
   * 基于项目的根目录 favicon url
   * 如果 shared/cache 中 projectLibName 的 favicon
   * 如 vue 项目，默认是 favicon-vue.ico
   * @default src/favicon.ico
   */
  favicon?: string | false;
  // favicon 地址
  urlFavicon?: string;
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
  // 可以修改远程 template 的内容
  templateFormat?: (code: string, webpackConfig: any) => string;
}

// TODO 模板
export const initHtml = (o: WebpackHtmlPluginOption = {}): IHtmlOptions => {
  let template = o.template || 'src/index.html';
  let favicon = o.favicon || 'src/favicon.ico';
  let urlFavicon = '';
  let urlTemplate = '';
  const isUrlFavicon = /^https?:\/\//.test(favicon);
  const isUrlTemplate = /^https?:\/\//.test(template);

  if (store) {
    if (isUrlTemplate) {
      urlTemplate = template;
    } else {
      template = store.getProjectResolve(template);
      if (!fsExtra.existsSync(template)) {
        template = store.biuResolve('template/index.html');
      }
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
    urlTemplate,
  };
};
