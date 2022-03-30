/** @format */

import { IServer } from '../../server/types';

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
  open?: IServer['open'];
  /**
   * 热重载
   * @default true
   */
  hot?: IServer['hot'];
};
export type TServerOptions = IServer & TServerConfig;
export type TResolveServerConfig = IServer & Required<TServerConfig>;
export const initServer = (op?: TServerOptions): TResolveServerConfig => ({
  ...{
    host: '0.0.0.0',
    port: 8000,
    // https: false,
    open: false,
    // proxy: false,
    hot: true,
    ...op,
  },
});
