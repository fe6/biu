/** @format */

import path from 'path';
import { reactRefreshWebpack } from '@fe6/biu-deps';
import { vueLoader } from '@fe6/biu-deps-webpack';
// TODO esbuild
// import esbuild from 'esbuild';
import wpChain from '../shared/wp-chain';
import store from '../shared/cache';

type TReactRuntime = 'automatic' | 'classic';

class WPModule {
  reactRuntime?: TReactRuntime;
  constructor() {}
  async setup() {
    this.setConfig();
    this.setScriptReactLoader();
    this.setWebworker();
    // TODO react 的判断支持
    this.setVue();
  }
  private setConfig() {
    const config = {
      module: {
        // mini-css-extract-plugin 编译不过！
        /* generator: {
          asset: {
            publicPath: store.config.base,//:TODO 验证 publicPath auto 需要设置 '/' or ''
          },
        }, */
        rule: {
          // 解决 mjs 加载失败问题
          mjs: {
            test: /\.m?js/,
            resolve: {
              fullySpecified: false,
            },
          },
          //
          scripts: {
            test: /\.(js|jsx|ts|tsx)$/,
            exclude: /(packages\/biu|packages\/deps)/, //不能加 exclude 否则会专程 arrow
            // exclude: store.config.moduleTransformExclude,
            use: {
              // TODO esbuild
              // vue: {
              //   loader: require.resolve('@fe6/biu-deps-webpack/compiled/vue-loader'),
              // },
              swc: {
                loader: store.biuResolve(
                  path.resolve(store.biuSource, 'webpack/loader/swc'),
                ),
                options: store.config.build,
              },
              // TODO esbuild
              // esbuild: {
              //   loader: store.biuResolve(
              //     path.resolve(store.biuSource, 'webpack/loader/esbuild'),
              //   ),
              //   // options: store.config.build,
              //   options: {
              //     handler: [
              //     ],
              //     target: 'esnext',
              //     implementation: esbuild
              //   }
              // },
            },
          },
          // webworker: this.webworker,
        },
      },
    };
    wpChain.merge(config);
  }
  private setVue() {
    vueLoader(wpChain);
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
  private setScriptReactLoader() {
    const isDev = store.config.mode === 'development';
    // 增加插件支持
    if (isDev && store.config.server.hot && !!store.config.reactRuntime)
      wpChain.plugin('reactRefresh').use(reactRefreshWebpack, [
        {
          overlay: false, // 切换到默认overlay
        },
      ]);
  }
}
export default WPModule;
