/** @format */

import fetch from '@fe6/biu-deps/compiled/node-fetch';

import webpack from '@fe6/biu-deps-webpack/compiled/webpack';
import dotenv from '@fe6/biu-deps-webpack/compiled/dotenv';
import { expand as dotenvExpand } from '@fe6/biu-deps-webpack/compiled/dotenv-expand';
import fs from '@fe6/biu-deps/compiled/fs-extra';
import { logger } from '@fe6/biu-utils';
import wpChain from '../shared/wp-chain';
import store from '../shared/cache';
// 多线程 dts
import DTSPlugin from '../dts';

class WPPlugin {
  isDev = true;
  constructor() {}
  getDefines() {
    return new Promise(async (resolve) => {
      const env = store.cmdOpts.env || store.config.mode || '';

      const envFiles = [
        /** mode local file */ `.env.${env}.local`,
        /** mode file */ `.env.${env}`,
        /** local file */ `.env.local`,
        /** default file */ `.env`,
      ];

      const theEnvDirLen = store.config.envDir.length;
      let idx = 0;

      const theGetEnvValues = async () => {
        const envOneDir = store.config.envDir[idx];
        if (typeof envOneDir === 'function') {
          const theUrl = envOneDir(env);
          const theUrlList = theUrl.split('.');

          if (theUrlList[theUrlList.length - 1] === 'json') {
            let body = '';
            try {
              const response = await fetch(theUrl);
              body = await response.text();

              if (body.length > 0) {
                const parsed = JSON.parse(body);
                dotenvExpand({
                  parsed,
                  ignoreProcessEnv: true,
                } as any);

                for (const [key, value] of Object.entries(parsed)) {
                  if (
                    store.config.envPrefix.some((prefix: string) =>
                      key.startsWith(prefix),
                    ) &&
                    theNowEnv[key] === undefined
                  ) {
                    theNowEnv[key] = value;
                  }
                }
              }
            } catch (error) {
              logger.errorExit(error);
            }
          }
        }
        if (typeof envOneDir === 'string') {
          for (const file of envFiles) {
            const theEnvFile = store.resolve(`${envOneDir}/${file}`);
            const hasEnv = fs.existsSync(theEnvFile);
            if (hasEnv) {
              const parsed = dotenv.parse(fs.readFileSync(theEnvFile, 'utf-8'));
              dotenvExpand({
                parsed,
                ignoreProcessEnv: true,
              } as any);

              for (const [key, value] of Object.entries(parsed)) {
                if (
                  store.config.envPrefix.some((prefix: string) =>
                    key.startsWith(prefix),
                  ) &&
                  theNowEnv[key] === undefined
                ) {
                  theNowEnv[key] = value;
                }
              }
            }
          }
        }

        if (store.config.define) {
          theNowEnv = { ...theNowEnv, ...store.config.define };
        }

        if (idx < theEnvDirLen - 1) {
          idx++;
          await theGetEnvValues();
        } else {
          resolve(theNowEnv);
        }
      };

      let theNowEnv: any = {};
      await theGetEnvValues();
    });
  }
  //
  async setup() {
    const isDev = store.config.mode === 'development';
    this.isDev = isDev;
    const theEnvDefine = await this.getDefines();

    const config: any = {
      plugin: {
        define: {
          plugin: webpack.DefinePlugin,
          args: [
            {
              'process.env': JSON.stringify(theEnvDefine),
            },
          ],
        },
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
      const options: any = { name: logger.pkgName };
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
    if (isTS && store.config?.ts?.dts) {
      config.plugin.dts = {
        plugin: DTSPlugin,
        args: [
          { build: store.config.build, mf: store.config.moduleFederation },
        ],
      };
    }

    wpChain.merge(config);
  }
}
export default WPPlugin;
