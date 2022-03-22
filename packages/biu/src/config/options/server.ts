/** @format */

import { Configuration as WebpackServerConfiguration } from '@fe6/biu-utils/compiled/webpack-dev-server/lib/Server';

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
  /**
   * 自动切换端口
   * @default true
   */
  strictPort?: boolean;
  // https?: WebpackServerConfiguration['https']
  // proxy?: WebpackServerConfiguration['proxy'] | boolean
  /**
   * 自动打开
   * @default false
   */
  open?: WebpackServerConfiguration['open'];
  /**
   * 热重载
   * @default true
   */
  hot?: WebpackServerConfiguration['hot'];
};
export type TServerOptions = WebpackServerConfiguration & TServerConfig;
export type TResolveServerConfig = WebpackServerConfiguration &
  Required<TServerConfig>;
export const initServer = (op?: TServerOptions): TResolveServerConfig => ({
  ...{
    host: '0.0.0.0',
    port: 8000,
    strictPort: true,
    // https: false,
    open: false,
    // proxy: false,
    hot: true,
    ...op,
  },
});
