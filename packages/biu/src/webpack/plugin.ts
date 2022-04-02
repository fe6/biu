/** @format */

import path from 'path';
import webpack from '@fe6/biu-deps-webpack/compiled/webpack';
// import Dotenv from '@fe6/biu-deps/compiled/dotenv-webpack';
import fs from '@fe6/biu-deps/compiled/fs-extra';
import { logger } from '@fe6/biu-utils';
import wpChain from '../shared/wp-chain';
import store from '../shared/cache';
import { TMode } from '../types';
// 多线程 dts
import DTSPlugin from '../dts';

class WPPlugin {
  isDev = true;
  constructor() {}
  // private get dotenv() {
  //   const env = store.config.env || store.config.mode;
  //   const options = {
  //     path: store.resolve(`.env${env ? '.' + env : ''}`),
  //     // path: './some.other.env', // load this now instead of the ones in '.env'
  //     safe: true, // load '.env.example' to verify the '.env' variables are all set. Can also be a string to a different file.
  //     allowEmptyValues: true, // allow empty variables (e.g. `FOO=`) (treat it as empty string, rather than missing)
  //     systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
  //     silent: true, // hide any errors
  //     defaults: false, // load '.env.defaults' as the default values if empty.
  //   };
  //   return {
  //     plugin: Dotenv,
  //     args: [options],
  //   };
  // }
  private get define() {
    type optionsType = { [key: string]: string | number | boolean | TMode };
    // 合并 mode env 参数
    let dlist: optionsType = {
      mode: store.config.mode,
      env: store.config.env || '',
    };
    // 合并 store.config.define
    if (store.config.define) {
      dlist = { ...dlist, ...store.config.define };
    }
    //
    const options: optionsType = {};
    Object.keys(dlist).map((key) => {
      if (store.isESM && store.config.useImportMeta) {
        options[`import.meta.env.${key}`] = JSON.stringify(dlist[key]);
      } else {
        options[`process.env.${key}`] = JSON.stringify(dlist[key]);
      }
    });
    // return defines
    return {
      plugin: webpack.DefinePlugin,
      args: [options],
    };
  }
  //
  async setup() {
    const isDev = store.config.mode === 'development';
    this.isDev = isDev;
    const { define } = this; //, dotenv
    const config: any = {
      plugin: {
        define,
        // dotenv,
      },
    };
    if (Object.keys(store.biuShare.moduleFederation).length > 0) {
      config.plugin.mf = {
        plugin: webpack.container.ModuleFederationPlugin,
        args: [store.biuShare.moduleFederation],
      };
      config.plugin.mfStats = {
        plugin: require('@fe6/biu-deps-webpack/compiled/webpack-federated-stats-plugin'),
        args: [{ filename: 'biu.json' }],
      };
    }
    // progress
    if (store.config.debug.progress !== false) {
      const options: any = { name: `[${logger.pkgName}]` };
      if (store.config.debug.profile) {
        options.reporters = ['fancy', 'profile'];
        options.profile = true;
      }
      config.plugin.progress = {
        plugin: require('@fe6/biu-deps-webpack/compiled/webpackbar'),
        args: [options],
      };
    }
    //analyzer
    if (store.config.build.analyze) {
      config.plugin.analyzer = {
        plugin:
          require('@fe6/biu-deps-webpack/compiled/webpack-bundle-analyzer')
            .BundleAnalyzerPlugin,
        args: [
          {
            // analyzerMode: 'static',
            reportFilename: 'report.html',
            openAnalyzer: true,
          },
        ],
      };
    }
    //
    const tsconfigJsonPath = store.resolve('tsconfig.json');
    const isTS = fs.existsSync(tsconfigJsonPath);
    // dts
    if (isTS && store.config.build.createTs) {
      config.plugin.dts = {
        plugin: DTSPlugin,
        args: [
          { build: store.config.build, mf: store.config.moduleFederation },
        ],
      };
    }
    if (store.config.jsCheck) {
      // ts check
      if (isTS) {
        config.plugin.tsCheck = {
          plugin: require.resolve(
            '@fe6/biu-deps/compiled/fork-ts-checker-webpack-plugin',
          ),
          args: [
            {
              async: isDev, // true dev环境下部分错误验证通过
              eslint: {
                enabled: true,
                files: `${store.appSrc}/**/*.{ts,tsx,js,jsx}`,
              },
              typescript: {
                configFile: tsconfigJsonPath,
                profile: false,
                typescriptPath: 'typescript',
                // configOverwrite: {
                //   compilerOptions: {skipLibCheck: true},
                // },
              },
              // logger: {issues: 'console'},
            },
          ],
        };
      } else {
        config.plugin.eslint = {
          plugin: require.resolve(
            '@fe6/biu-deps/compiled/eslint-webpack-plugin',
          ),
          args: [
            {
              extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
              context: store.root,
              // overrideConfigFile: resolveApp('.eslintrc.js'),
              files: ['src/**/*.{ts,tsx,js,jsx}'],
              // eslintPath: require.resolve('eslint'),
              cache: true,
              cacheLocation: path.resolve(store.config.cacheDir, 'eslint'),
              fix: true,
              threads: true,
              lintDirtyModulesOnly: false,
            },
          ],
        };
      }
    }

    wpChain.merge(config);
  }
}
export default WPPlugin;
