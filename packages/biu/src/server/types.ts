/** @format */

import { Options as ServeIndexOptions } from '@fe6/biu-deps/compiled/serve-index';
import { ServeStaticOptions } from '@fe6/biu-deps/compiled/serve-static';
import { WatchOptions } from '@fe6/biu-deps/compiled/chokidar';
import { Service as BonjourOptions } from '@fe6/biu-deps/compiled/bonjour-service';
import { Options as OpenOptions } from '@fe6/biu-deps/compiled/open';
import {
  Filter as HttpProxyMiddlewareFilter,
  Options as HttpProxyMiddlewareOptions,
} from '@fe6/biu-deps/compiled/http-proxy-middleware';
import { Matcher as AnymatchMatcher } from '@fe6/biu-deps/compiled/anymatch';
import { Options as ConnectHistoryApiFallbackOptions } from '@fe6/biu-deps/compiled/connect-history-api-fallback';
import { WebSocketServer, WebSocket } from '@fe6/biu-deps/compiled/ws';
import {
  ErrorRequestHandler as ExpressErrorRequestHandler,
  RequestHandler as ExpressRequestHandler,
} from '@fe6/biu-deps/compiled/express';

import { Options as WebpackDevMiddlewareOptions } from '@fe6/biu-deps/compiled/webpack-dev-middleware';

export type TServerPort = number | string | 'auto';
export type TServerHost = 'local-ip' | 'local-ipv4' | 'local-ipv6' | string;

export interface IDevServerOpenApp {
  name: string;
  arguments: string[];
}

export interface IOpen {
  target: string;
  options: OpenOptions;
}

export type TServerOpen = boolean | string | IOpen | Array<string | IOpen>;

export type TProxyConfigMap = {};

export interface IListeners {
  name: string | symbol;
  listener: (...args: any[]) => void;
}

export interface INormalizedStatic {
  directory?: string;
  publicPath?: string[];
  serveIndex?: false | ServeIndexOptions;
  staticOptions?: ServeStaticOptions;
  watch?: false | WatchOptions;
}

export type TBonjourCore = Record<string, never> | BonjourOptions;

export type TBonjour = boolean | TBonjourCore;

export type TClientLogging =
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'none'
  | 'verbose';
export type TClientOverlay = boolean | { warnings?: boolean; errors?: boolean };

export interface IClientWebSocketURL {
  hostname?: string;
  password?: string;
  pathname?: string;
  port?: number | string;
  protocol?: string;
  username?: string;
}

export interface IClientConfiguration {
  logging?: TClientLogging;
  overlay?: TClientOverlay;
  progress?: boolean;
  reconnect?: boolean | number;
  webSocketTransport?: 'ws' | 'sockjs' | string;
  webSocketURL?: string | IClientWebSocketURL;
}

export interface IProxyConfigArrayItem {
  path?: HttpProxyMiddlewareFilter | undefined;
  context?: HttpProxyMiddlewareFilter | undefined;
}

export interface IProxyByPass {
  req?: Request;
  res?: Response;
  proxyConfig?: TProxyConfigArrayItem;
}

export type TProxyConfigArrayItem = IProxyConfigArrayItem & {
  bypass?: (arg: IProxyByPass) => void;
} & HttpProxyMiddlewareOptions;

export type TProxyLog =
  | 'info'
  | 'warn'
  | 'error'
  | 'debug'
  | 'silent'
  | undefined
  | 'none'
  | 'log'
  | 'verbose';

export type TWatchOptions = WatchOptions & {
  aggregateTimeout?: number;
  ignored?: AnymatchMatcher | string[];
  poll?: number | boolean;
};

export interface IMiddleware {
  name?: string;
  path?: string;
  middleware: ExpressRequestHandler | ExpressErrorRequestHandler;
}

export type TMiddleware =
  | IMiddleware
  | ExpressRequestHandler
  | ExpressErrorRequestHandler;

export interface IStatic {
  directory: string;
  publicPath?: string | string[];
  serveIndex?: boolean | ServeIndexOptions;
  staticOptions?: ServeStaticOptions;
  watch: TWatchOptions;
}

export interface IWatchFiles {
  paths: string | string[];
  options: TWatchOptions;
}

export interface IDevMiddleware {
  index?: boolean;
  mimeTypes?: { phtml: string };
  publicPath?: string;
  serverSideRender?: boolean;
  writeToDisk?: boolean;
}

export type TDevHeaders =
  | Array<{ key: string; value: string }>
  | Record<string, string | string[]>;

export interface IDevServer {
  port?: TServerPort;
  host?: TServerHost;
  ipc?: boolean;
  hot?: boolean | 'only';
  liveReload?: boolean;
  open?: TServerOpen;
  allowedHosts?: 'auto' | 'all' | string | string[];
  bonjour?: TBonjour;
  client?: boolean | IClientConfiguration;
  headers?: TDevHeaders;
  // TODO 函数的支持
  proxy?: TProxyConfigArrayItem[];
  setupExitSignals?: boolean;
  static?:
    | boolean
    | string
    | IStatic
    | Array<string | IStatic>
    | INormalizedStatic[];
  historyApiFallback?: boolean | ConnectHistoryApiFallbackOptions;
  compress?: boolean;
  watchFiles?: IWatchFiles[];
  devMiddleware?: IDevMiddleware;
}

export type TWebSocketServer = WebSocketServer & WebSocketServer['close'];
export type TClientConnection = WebSocket & {
  send: WebSocket['send'];
  terminate: WebSocket['terminate'];
  ping: WebSocket['ping'];
} & {
  isAlive?: boolean;
  headers: {
    [key: string]: string;
  };
};

export interface IWebSocketServerImplementation {
  implementation: TWebSocketServer;
  clients: TClientConnection[];
}
