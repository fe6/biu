/** @format */

import path from 'path';
import esbuild from 'esbuild';
import { vueLoader, reactRefresh } from '@fe6/biu-deps-webpack';
import wpChain from '../shared/wp-chain';
import store from '../shared/cache';

type TReactRuntime = 'automatic' | 'classic';

class WPModule {
  reactRuntime?: TReactRuntime;
  constructor() {}
  async setup() {
    this.setConfig();
    this.setWebworker();
    // TODO react 的判断支持
    this.setVue();
    this.setReact();
  }
  private setConfig() {
    const theParser: any = {};
    if (store.isVue) {
      theParser.scripts = {
        test: /\.(js|ts)$/,
        exclude: /(packages)/,
        use: {
          swc: {
            loader: store.biuResolve(
              path.resolve(store.biuSource, 'webpack/loader/swc'),
            ),
            options: store.config.build,
          },
        },
      };
      theParser.sx = {
        test: /\.(jsx|tsx)$/,
        exclude: /(packages)/,
        use: {
          esbuild: {
            loader: store.biuResolve(
              path.resolve(store.biuSource, 'webpack/loader/esbuild'),
            ),
            options: {
              target: 'esnext',
              implementation: esbuild,
            },
          },
        },
      };
    } else {
      theParser.scripts = {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: store.config.moduleTransformExclude,
        use: {
          swc: {
            loader: store.biuResolve(
              path.resolve(store.biuSource, 'webpack/loader/swc'),
            ),
            options: store.config.build,
          },
        },
      };
    }
    const config = {
      module: {
        rule: {
          // 解决 mjs 加载失败问题
          mjs: {
            test: /\.m?js/,
            resolve: {
              fullySpecified: false,
            },
          },
          //
          ...theParser,
        },
      },
    };
    wpChain.merge(config);
  }
  private setVue() {
    if (store.isVue) {
      vueLoader(wpChain);
    }
  }
  private setReact() {
    if (store.isReact) {
      const isDev = store.config.mode === 'development';
      // 增加插件支持
      if (isDev && store.config.server.hot && !!store.config.reactRuntime) {
        reactRefresh(wpChain);
      }
    }
  }
  private setWebworker() {
    wpChain.module
      .rule('webworker')
      .oneOf('workerInline')
      .resourceQuery(/worker/)
      .use('workerLoader')
      .loader(require.resolve('@fe6/biu-deps-webpack/compiled/worker-loader'))
      .options({
        inline: 'no-fallback',
        filename: '[name].[contenthash].worker.js',
      })
      .end()
      // 解决ts 不能正常构建的问题
      .use('swc')
      .loader(
        store.biuResolve(path.resolve(store.biuSource, 'webpack/loader/swc')),
      )
      .options(store.config.build)
      .end();
  }
}
export default WPModule;
