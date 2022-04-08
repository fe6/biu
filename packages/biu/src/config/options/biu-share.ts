/** @format */

import { Configuration } from '@fe6/biu-deps-webpack/compiled/webpack';
import store from '../../shared/cache';
import { TExternalAssets } from '../../types';
import { TMFOptions } from '../../types/module-federation';
import { TBiuShare } from '../../types/biu-share';
import { TExternalsItem } from '../../types/externals';
//
const exp = /^([0-9a-zA-Z_\s]+)@(.*)/; // 匹配库内容如 React@http://
//
class BiuShare {
  moduleFederation: TMFOptions = {};
  externals: Configuration['externals'] | any = {};
  externalAssets: TExternalAssets = { js: [], css: [] };
  biuShare: TBiuShare = {};
  constructor() {}
  async setup() {
    if (store.config.biuShare) {
      if (!store.isESM) await this.setBiuShare();
      /**
       * 需要重写 非 esm 下的 模块管理
       */ else await this.setESMBiushare();
    } else {
      await Promise.all([this.setExternals(), this.setModuleFederation()]);
    }
  }
  private async setESMBiushare() {
    let mf: TBiuShare = {};
    if (typeof store.config.biuShare === 'function') {
      mf = await store.config.biuShare(store.config);
    } else if (store.config.biuShare) {
      mf = store.config.biuShare;
    }
    for (const [k, v] of Object.entries(mf.shareLib || {})) {
      this.externals[k] = v;
    }
    delete mf.shareLib;
    await this.setModuleFederation(mf);
  }
  private async setBiuShare() {
    let mf: TBiuShare = {};
    if (typeof store.config.biuShare === 'function') {
      mf = await store.config.biuShare(store.config);
    } else if (store.config.biuShare) {
      mf = store.config.biuShare;
    }
    const externals: TExternalsItem[] = [];
    if (typeof mf.shareLib === 'object') {
      for (const [k, v] of Object.entries(mf.shareLib)) {
        let externalsItem: TExternalsItem = {};
        externalsItem.module = k;
        //增加下划线 支持lodash 等特殊符号的问题 如 _@http

        if (typeof v === 'string') {
          const cb: any = v.match(exp) || [];
          if (cb.length > 0) {
            externalsItem.global = cb[1];
            externalsItem.entry = cb[2];
            externalsItem.type = 'js';
            externals.push(externalsItem);
            externalsItem = {};
          } else {
            externalsItem.global = '';
            externalsItem.entry = v;
            externalsItem.type = 'js';
            externals.push(externalsItem);
            externalsItem = {};
          }
        } else if (Array.isArray(v)) {
          v.map((vo) => {
            if (!vo) return;
            const isCSS = vo.split('?')[0].endsWith('.css');
            if (isCSS) {
              externalsItem.entry = vo;
              externalsItem.type = 'css';
            } else {
              const cb: any = vo.match(exp) || [];
              if (cb.length > 0) {
                externalsItem.global = cb[1];
                externalsItem.entry = cb[2];
                externalsItem.type = 'js';
              } else {
                externalsItem.global = '';
                externalsItem.entry = vo;
                externalsItem.type = 'js';
              }
            }
            externals.push(externalsItem);
            externalsItem = {};
          });
        } else if (typeof v === 'object' && v.entry) {
          externalsItem.entry = v.entry;
          externalsItem.global = v.global;
          externalsItem.type = v.type;
          externals.push(externalsItem);
          externalsItem = {};
        }
      }
      delete mf.shareLib;
    }

    // FIX remote 的时候无法更新数据
    // FIX [runtime-core.esm-bundler.js:4353] Feature flags __VUE_OPTIONS_API__, __VUE_PROD_DEVTOOLS__ are not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.
    if (mf && externals.length < 1) {
      externals.push({
        module: 'vue',
        global: 'Vue',
        entry: 'https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.min.js',
        type: 'js',
      });
    }

    await Promise.all([
      this.setExternals(externals),
      this.setModuleFederation(mf),
    ]);
  }
  /**
   * setExternals
   * concat biuShare's externals
   * @param externals
   */
  private async setExternals(externals: TExternalsItem[] = []): Promise<void> {
    const externalsOpt = store.config.externals || [];
    if (externalsOpt || externals.length > 0) {
      let list: TExternalsItem[] = [];
      if (typeof externalsOpt === 'function') {
        list = await externalsOpt(store.config);
      } else if (externalsOpt.length > 0) {
        list = externalsOpt;
      }
      list = list.concat(externals);
      list.map((v) => {
        v.type = v.type || 'js';
        if (v.type === 'js' && v.module) {
          if (v.global) {
            this.externals[v.module] = v.global;
          } else if (store.isESM) {
            this.externals[v.module] = v.entry;
          }
          // 可以不传入 entry 利用传统的 merge request 进行合并请求
          if (v.entry) this.externalAssets.js.push(v.entry);
        } else if (v.type === 'css' && v.entry) {
          this.externalAssets.css.push(v.entry);
        }
      });
    }
  }
  /**
   * setModuleFederation
   * biushare Replace module federation options
   * @param moduleFederation
   */
  private async setModuleFederation(moduleFederation?: TMFOptions) {
    let moduleFederationOpt = moduleFederation || store.config.moduleFederation;
    if (moduleFederationOpt) {
      if (typeof moduleFederationOpt === 'function') {
        moduleFederationOpt = await moduleFederationOpt(store.config);
      }
      if (moduleFederationOpt.name) {
        moduleFederationOpt.filename = moduleFederationOpt.filename || 'biu.js';
        if (!moduleFederationOpt.library && store.isESM) {
          // 实验 MF 的 ESM 模式是否正常运行
          moduleFederationOpt.library = { type: 'module' };
          // moduleFederationOpt.library = {type: 'window', name: moduleFederationOpt.name}
          // === 去除@ esm 不需要 named
          const remotes: any = moduleFederationOpt.remotes || {};

          for (const [k, v] of Object.entries(remotes)) {
            if (typeof v === 'string') {
              // TODO logger
              console.log('v.match(exp)', v.match(exp), v);
              const cb: any = v.match(exp) || [];
              if (cb.length > 0) {
                remotes[k] = cb[2];
              }
            }
          }
          moduleFederationOpt.remotes = remotes;
        }
        this.moduleFederation = moduleFederationOpt;
      }
      // 同步回config 让 store.config 使用
      store.config.moduleFederation = this.moduleFederation;
    }
  }
}
export default BiuShare;
