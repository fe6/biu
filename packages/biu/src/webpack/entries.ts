/** @format */

import path from 'path';
import glob from '@fe6/biu-utils/compiled/fast-glob';
import HtmlWebpackPlugin from '@fe6/biu-utils/compiled/html-webpack-plugin';
import { logger } from '@fe6/biu-utils';
import wpChain from '../shared/wp-chain';
import store from '../shared/cache';
import { TEntries } from '../types';
import { IHtmlOptions } from '../config/options/html';

/**
 * multi entry
 * 多入口设置
 */
class WPEntries {
  wpConfig: any = { entry: {}, plugin: {} };
  constructor() {}
  async setup() {
    // 不允许 template 放到 public
    this.checkTemplateInPublic();
    //
    if (store.config.entries) {
      await this.multiEntry(store.config.entries);
    } else {
      await this.singleEntry();
    }
  }
  async multiEntry(entries: TEntries = {}) {
    for (const [filename, htmlOptions] of Object.entries(entries)) {
      const entry = store.resolve(`${store.config.appSrc}/${filename}`);
      const chunk = filename.replace(path.extname(entry), '');
      this.wpConfig.entry[chunk] = [store.resolve(entry)];
      //处理路径问题
      if (htmlOptions.template) {
        htmlOptions.template = store.resolve(htmlOptions.template);
      }
      // 屏蔽子页面的favicon 防止重复操作导致报错
      // TODO 检测是否影响 favicon 图标设置
      if (htmlOptions.favicon) {
        // htmlOptions.favicon = store.resolve(htmlOptions.favicon)
        logger.warn('favicon只支持在 [html] 设置');
        delete htmlOptions.favicon;
      }
      //
      this.setHtmlWebpackPlugin([chunk], htmlOptions);
    }
    wpChain.merge(this.wpConfig);
  }
  async singleEntry() {
    await this.setIndexEntry();
    for (const chunk in this.wpConfig.entry) {
      this.setHtmlWebpackPlugin([chunk], {}, 'index.html');
    }
    wpChain.merge(this.wpConfig);
  }
  async setIndexEntry() {
    let entry = '';
    if (!store.config.appEntry) {
      const elist = await glob([
        `${store.config.appSrc}/index.{ts,tsx,jsx,js}`,
      ]);
      if (!elist[0]) {
        throw new Error('找不到入口文件!');
      }
      entry = elist[0];
    } else {
      entry = `${store.config.appSrc}/${store.config.appEntry}`;
    }
    //基于 src 为根目录 获取文件
    const extname = path.extname(entry);
    const chunk: string = entry
      .replace(extname, '')
      .replace(`${store.config.appSrc}/`, '');
    this.wpConfig.entry[chunk] = [store.resolve(entry)];
  }
  private checkTemplateInPublic() {
    const { favicon, template } = store.config.html;
    const faviconAbs = path.dirname(favicon || '');
    const templateAbs = path.dirname(template || '');
    if (
      faviconAbs.includes(store.publicDir) ||
      templateAbs.includes(store.publicDir)
    ) {
      throw new Error(
        'Template 与 favicon 不能放到./public,推荐放到 ./src or ./template',
      );
    }
  }
  private setHtmlWebpackPlugin(
    chunks: string[] = ['index'],
    htmlOptions: IHtmlOptions = {},
    filename?: string,
  ) {
    const htmlConfig = store.config.html;
    // 单页面时 需要把 filename 设置成 index.html
    filename = filename ? filename : `${chunks[0]}.html`;
    htmlConfig.files.css = [];
    htmlConfig.files.js = [];
    htmlConfig.files.css = store.config.html.files.css.concat(
      store.biuShare.externalAssets.css,
    );
    if (!store.isESM)
      htmlConfig.files.js = store.config.html.files.js.concat(
        store.biuShare.externalAssets.js,
      );
    //
    if (htmlOptions.files) {
      if (htmlOptions.files.css) {
        htmlConfig.files.css = htmlConfig.files.css.concat(
          htmlOptions.files.css,
        );
      }
      if (htmlOptions.files.js && !store.isESM) {
        htmlConfig.files.js = htmlConfig.files.js.concat(htmlOptions.files.js);
      }
    }
    const options: HtmlWebpackPlugin.Options = {
      // title: 'EMP',
      // template,
      chunks,
      // favicon,
      // inject: false, //避免插入两个同样 js ::TODO 延展增加 node_modules
      filename,
      // isESM: store.isESM,
      scriptLoading: !store.isESM ? 'defer' : 'module',
      minify: store.config.mode === 'production' && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
      ...htmlConfig,
      ...htmlOptions,
    };
    if (store.config.base && !options.publicPath) {
      options.publicPath = store.config.base;
    }
    // wpChain.plugin(`html_plugin_${chunks}`).use(HtmlWebpackPlugin, [options])
    this.wpConfig.plugin[`html_plugin_${chunks}`] = {
      plugin: HtmlWebpackPlugin,
      args: [options],
    };
  }
}

export default WPEntries;
