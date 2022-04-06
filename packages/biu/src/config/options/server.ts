/** @format */

import { IDevServer } from '../../server/types';
import { DEFAULT_PORT } from '../../contant';

export type TServerConfig = {
  /**
   * 访问 host
   * @default '0.0.0.0'
   */
  host?: string;
  /**
   * 访问 端口
   * @default 8000
   */
  port?: number;
  // https?: WebpackServerConfiguration['https']
  // proxy?: WebpackServerConfiguration['proxy'] | boolean
  /**
   * 自动打开
   * @default false
   */
  open?: IDevServer['open'];
  /**
   * 热重载
   * @default true
   */
  hot?: IDevServer['hot'];
  /**
   * 设置请求 headers
   */
  headers?: IDevServer['headers'];
};
export type TServerOptions = IDevServer & TServerConfig;
export type TResolveServerConfig = IDevServer & Required<TServerConfig>;
export const defServerConfig = {
  host: '0.0.0.0',
  port: DEFAULT_PORT,
  // https: false,
  open: false,
  // proxy: false,
  hot: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers':
      'X-Requested-With, content-type, Authorization',
  },
};

export const initServer = (op?: TServerOptions): TResolveServerConfig => ({
  ...defServerConfig,
  ...op,
});
