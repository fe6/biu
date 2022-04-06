/** @format */

// import { Configuration } from '@fe6/biu-deps-webpack/compiled/webpack';
import store from '../shared/cache';
import { IDevServer } from '../server/types';
// import { TConfig } from '../config';
// import { ENUM_ENV } from '../types';

class WPDevelopment {
  constructor() {}
  async setup() {}
  /**
   * dev server
   */
  // TODO 没有用到-删除 ↓
  get server(): IDevServer {
    const overlayLoggerLv =
      store.config.debug && store.config.debug.level === 'error'
        ? { errors: true, warnings: false }
        : { errors: true, warnings: true };
    return {
      host: '0.0.0.0',
      allowedHosts: ['all'],
      historyApiFallback: true,
      // compress: true,
      static: [
        {
          directory: store.outDir,
          publicPath: [store.publicDir],
        },
        // 暴露 d.ts 文件
        {
          directory: store.outDir,
          publicPath: ['/'],
          // staticOptions: {
          //   setHeaders: function (res: any, path) {
          //     if (path.toString().endsWith('.d.ts'))
          //       res?.set(
          //         'Content-Type',
          //         'application/javascript; charset=utf-8',
          //       );
          //   },
          // },
        },
      ],
      // headers: {
      //   'Access-Control-Allow-Origin': '*',
      //   'Access-Control-Allow-Methods':
      //     'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      //   'Access-Control-Allow-Headers':
      //     'X-Requested-With, content-type, Authorization',
      // },
      client: {
        overlay: {
          ...overlayLoggerLv,
        },
      },
      ...(store.config.server as IDevServer),
    };
  }
}
export default WPDevelopment;
