/** @format */

import net, { Socket } from 'net';
import http, { Server as HttpServer, IncomingMessage } from 'http';
import url from 'url';
import os from 'os';
import { join } from 'path';
import express, {
  Application,
  NextFunction,
} from '@fe6/biu-deps/compiled/express';
import open, { App as OpenApp } from '@fe6/biu-deps/compiled/open';
import fs from '@fe6/biu-deps/compiled/fs-extra';
import webpackDevMiddleware, {
  Callback as WebpackDevMiddlewareCallback,
} from '@fe6/biu-deps-webpack/compiled/webpack-dev-middleware';
import { Bonjour } from '@fe6/biu-deps/compiled/bonjour-service';
import {
  MultiCompiler,
  Compiler,
  Stats,
  MultiStats,
  StatsOptions,
  StatsCompilation,
} from '@fe6/biu-deps-webpack/compiled/webpack';
import { FSWatcher } from '@fe6/biu-deps/compiled/chokidar';
import { RequestHandler } from '@fe6/biu-deps-webpack/compiled/http-proxy-middleware';
import defaultGateway from '@fe6/biu-deps/compiled/default-gateway';
import connectHistoryApiFallback, {
  Options as ConnectHistoryApiFallbackOptions,
} from '@fe6/biu-deps-webpack/compiled/connect-history-api-fallback';
import { isString } from '@fe6/biu-deps-webpack/compiled/lodash';
// @ts-ignore
import ipaddr from '@fe6/biu-deps/compiled/ipaddr.js';
import { logger } from '@fe6/biu-utils';

import store from '../shared/cache';
import { DEFAULT_PORT } from '../contant';
import {
  IDevServer,
  IListeners,
  INormalizedStatic,
  IOpen,
  TProxyLog,
  IStatic,
  TWatchOptions,
  TServerPort,
  TServerHost,
  IClientConfiguration,
  IClientWebSocketURL,
  IWebSocketServerImplementation,
  TClientConnection,
  TBonjourCore,
  IDevMiddleware,
  IWatchFiles,
  TMiddleware,
  TProxyConfigArrayItem,
} from './types';
import WskServer from './servers/websocket-server';

class DevServer {
  compiler: MultiCompiler | Compiler;
  app: Application | undefined = undefined;
  logger: ReturnType<Compiler['getInfrastructureLogger']>;
  staticWatchers: FSWatcher[] = [];
  options: IDevServer;
  listeners: IListeners[] = [];
  webSocketProxies: RequestHandler[] = [];
  bonjour: Bonjour | undefined;
  sockets: net.Socket[] = [];
  currentHash: string | undefined = undefined;
  webSocketServer: IWebSocketServerImplementation | undefined | null = null;
  stats: Stats | MultiStats | null = null;
  middleware: any;
  server: HttpServer | undefined = undefined;

  constructor(compiler: Compiler) {
    this.compiler = compiler;
    this.logger = this.compiler.getInfrastructureLogger('webpack-dev-server');
    this.options = store.config.server || {};
  }

  static get DEFAULT_STATS(): StatsOptions {
    return {
      all: false,
      hash: true,
      warnings: true,
      errors: true,
      errorDetails: false,
    };
  }

  getCompilerOptions() {
    const theCompilers = (this.compiler as MultiCompiler).compilers;
    if (!!theCompilers) {
      if (theCompilers.length === 1) {
        return theCompilers[0].options;
      }

      // Configuration with the `devServer` options
      const compilerWithDevServer = theCompilers.find(
        (config) => config.options.devServer,
      );

      if (compilerWithDevServer) {
        return compilerWithDevServer.options;
      }

      // Configuration with `web` preset
      const compilerWithWebPreset = theCompilers.find(
        (config) =>
          (config.options.externalsPresets &&
            config.options.externalsPresets.web) ||
          [
            'web',
            'webworker',
            'electron-preload',
            'electron-renderer',
            'node-webkit',
            // eslint-disable-next-line no-undefined
            undefined,
            null,
          ].includes(String(config.options.target)),
      );

      if (compilerWithWebPreset) {
        return compilerWithWebPreset.options;
      }

      // Fallback
      return theCompilers[0].options;
    }

    return (this.compiler as Compiler).options;
  }

  async normalizeOptions(): Promise<void> {
    const { options } = this;
    const compilerOptions = this.getCompilerOptions();
    // TODO remove `{}` after drop webpack v4 support
    const compilerWatchOptions = compilerOptions.watchOptions || {};

    const getWatchOptions = (watchOptions: TWatchOptions = {}) => {
      const getPolling = () => {
        if (typeof watchOptions.usePolling !== 'undefined') {
          return watchOptions.usePolling;
        }

        if (typeof watchOptions.poll !== 'undefined') {
          return Boolean(watchOptions.poll);
        }

        if (typeof compilerWatchOptions.poll !== 'undefined') {
          return Boolean(compilerWatchOptions.poll);
        }

        return false;
      };
      const getInterval = () => {
        if (typeof watchOptions.interval !== 'undefined') {
          return watchOptions.interval;
        }

        if (typeof watchOptions.poll === 'number') {
          return watchOptions.poll;
        }

        if (typeof compilerWatchOptions.poll === 'number') {
          return compilerWatchOptions.poll;
        }
      };

      const usePolling = getPolling();
      const interval = getInterval();
      const { poll, ...rest } = watchOptions;

      return {
        ignoreInitial: true,
        persistent: true,
        followSymlinks: false,
        atomic: false,
        alwaysStat: true,
        ignorePermissionErrors: true,
        // Respect options from compiler watchOptions
        usePolling,
        interval,
        ignored: watchOptions.ignored,
        // TODO: we respect these options for all watch options and allow developers to pass them to chokidar, but chokidar doesn't have these options maybe we need revisit that in future
        ...rest,
      };
    };

    const getStaticItem = (optionsForStatic?: string | IStatic) => {
      const getDefaultStaticOptions = () => {
        return {
          directory: join(process.cwd(), 'public'),
          staticOptions: {},
          publicPath: ['/'],
          serveIndex: { icons: true },
          watch: getWatchOptions(),
        };
      };

      let item: INormalizedStatic;

      if (typeof optionsForStatic === 'undefined') {
        item = getDefaultStaticOptions();
      } else if (typeof optionsForStatic === 'string') {
        item = {
          ...getDefaultStaticOptions(),
          directory: optionsForStatic,
        };
      } else {
        const def = getDefaultStaticOptions();

        item = {
          directory:
            typeof optionsForStatic.directory !== 'undefined'
              ? optionsForStatic.directory
              : def.directory,
          // TODO: do merge in the next major release
          staticOptions:
            typeof optionsForStatic.staticOptions !== 'undefined'
              ? optionsForStatic.staticOptions
              : def.staticOptions,
          publicPath:
            // eslint-disable-next-line no-nested-ternary
            typeof optionsForStatic.publicPath !== 'undefined'
              ? Array.isArray(optionsForStatic.publicPath)
                ? optionsForStatic.publicPath
                : [optionsForStatic.publicPath]
              : def.publicPath,
          // TODO: do merge in the next major release
          serveIndex:
            // eslint-disable-next-line no-nested-ternary
            typeof optionsForStatic.serveIndex !== 'undefined'
              ? typeof optionsForStatic.serveIndex === 'boolean' &&
                optionsForStatic.serveIndex
                ? def.serveIndex
                : optionsForStatic.serveIndex
              : def.serveIndex,
          watch:
            // eslint-disable-next-line no-nested-ternary
            typeof optionsForStatic.watch !== 'undefined'
              ? // eslint-disable-next-line no-nested-ternary
                typeof optionsForStatic.watch === 'boolean'
                ? optionsForStatic.watch
                  ? def.watch
                  : false
                : getWatchOptions(optionsForStatic.watch)
              : def.watch,
        };
      }

      if (item.directory && DevServer.isAbsoluteURL(String(item.directory))) {
        throw new Error('Using a URL as static.directory is not supported');
      }

      return item;
    };

    if (typeof options.allowedHosts === 'undefined') {
      // AllowedHosts allows some default hosts picked from `options.host` or `webSocketURL.hostname` and `localhost`
      options.allowedHosts = 'auto';
    }
    // We store allowedHosts as array when supplied as string
    else if (
      typeof options.allowedHosts === 'string' &&
      options.allowedHosts !== 'auto' &&
      options.allowedHosts !== 'all'
    ) {
      options.allowedHosts = [options.allowedHosts];
    }
    // CLI pass options as array, we should normalize them
    else if (
      Array.isArray(options.allowedHosts) &&
      options.allowedHosts.includes('all')
    ) {
      options.allowedHosts = 'all';
    }

    if (typeof options.bonjour === 'undefined') {
      options.bonjour = false;
    } else if (typeof options.bonjour === 'boolean') {
      options.bonjour = options.bonjour ? {} : false;
    }

    if (
      typeof options.client === 'undefined' ||
      (typeof options.client === 'object' && options.client !== null)
    ) {
      if (!options.client) {
        options.client = {};
      }

      if (typeof options.client.webSocketURL === 'undefined') {
        options.client.webSocketURL = {};
      } else if (typeof options.client.webSocketURL === 'string') {
        const parsedURL = new URL(options.client.webSocketURL);

        options.client.webSocketURL = {
          protocol: parsedURL.protocol,
          hostname: parsedURL.hostname,
          port: parsedURL.port.length > 0 ? Number(parsedURL.port) : '',
          pathname: parsedURL.pathname,
          username: parsedURL.username,
          password: parsedURL.password,
        };
      } else if (typeof options.client.webSocketURL.port === 'string') {
        options.client.webSocketURL.port = Number(
          options.client.webSocketURL.port,
        );
      }

      // Enable client overlay by default
      if (typeof options.client.overlay === 'undefined') {
        options.client.overlay = true;
      } else if (typeof options.client.overlay !== 'boolean') {
        options.client.overlay = {
          errors: true,
          warnings: true,
          ...options.client.overlay,
        };
      }

      if (typeof options.client.reconnect === 'undefined') {
        options.client.reconnect = 10;
      } else if (options.client.reconnect === true) {
        options.client.reconnect = Infinity;
      } else if (options.client.reconnect === false) {
        options.client.reconnect = 0;
      }

      // Respect infrastructureLogging.level
      if (typeof options.client.logging === 'undefined') {
        options.client.logging = compilerOptions.infrastructureLogging
          ? compilerOptions.infrastructureLogging.level
          : 'info';
      }
    }

    // 启用 gzip compression：
    if (typeof options.compress === 'undefined') {
      options.compress = true;
    }

    if (typeof options.devMiddleware === 'undefined') {
      options.devMiddleware = {} as IDevMiddleware;
    }

    // No need to normalize `headers`
    if (typeof options.historyApiFallback === 'undefined') {
      options.historyApiFallback = false;
    } else if (
      typeof options.historyApiFallback === 'boolean' &&
      options.historyApiFallback
    ) {
      options.historyApiFallback = {};
    }

    // No need to normalize `host`
    options.hot =
      typeof options.hot === 'boolean' || options.hot === 'only'
        ? options.hot
        : true;

    options.liveReload =
      typeof options.liveReload !== 'undefined' ? options.liveReload : true;

    // TODO magicHtml 文件既是路由
    // options.magicHtml =
    //   typeof options.magicHtml !== "undefined" ? options.magicHtml : true;

    // https://github.com/webpack/webpack-dev-server/issues/1990
    const defaultOpenOptions = { wait: false };

    if (typeof options.open === 'undefined') {
      options.open = [];
    } else if (typeof options.open === 'boolean') {
      options.open = options.open
        ? ([
            {
              target: '<url>',
              options: defaultOpenOptions,
            },
          ] as IOpen[])
        : [];
    }

    if (typeof options.port === 'string' && options.port !== 'auto') {
      options.port = Number(options.port);
    }

    if (Array.isArray(options.proxy) && options.proxy.length > 0) {
      options.proxy = options.proxy.map((item) => {
        if (typeof item === 'function') {
          return item;
        }

        const getLogLevelForProxy = (level: TProxyLog) => {
          if (level === 'none') {
            return 'silent';
          }

          if (level === 'log') {
            return 'info';
          }

          if (level === 'verbose') {
            return 'debug';
          }

          return level;
        };

        if (typeof item.logLevel === 'undefined') {
          item.logLevel = getLogLevelForProxy(
            compilerOptions.infrastructureLogging
              ? compilerOptions.infrastructureLogging.level
              : 'info',
          );
        }

        if (typeof item.logProvider === 'undefined') {
          item.logProvider = () => this.logger;
        }

        return item;
      });
    }

    // 允许在 SIGINT 和 SIGTERM 信号时关闭开发服务器和退出进程。
    if (typeof options.setupExitSignals === 'undefined') {
      options.setupExitSignals = true;
    }

    if (typeof options.static === 'undefined') {
      options.static = [getStaticItem()];
    } else if (typeof options.static === 'boolean') {
      options.static = options.static ? [getStaticItem()] : false;
    } else if (typeof options.static === 'string') {
      options.static = [getStaticItem(options.static)];
    } else if (Array.isArray(options.static)) {
      options.static = options.static.map((item) =>
        getStaticItem(item as IStatic),
      );
    } else {
      options.static = [getStaticItem(options.static)];
    }

    // dts 暴露 d.ts
    options.static = (options.static as any).concat([
      {
        ...getStaticItem(store.outDir),
        staticOptions: {
          setHeaders: function (res: any, path: any) {
            if (path.toString().endsWith('.d.ts'))
              res?.set('Content-Type', 'application/javascript; charset=utf-8');
          },
        },
      },
    ]);

    if (typeof options.watchFiles === 'string') {
      options.watchFiles = [
        { paths: options.watchFiles, options: getWatchOptions() },
      ];
    } else if (
      typeof options.watchFiles === 'object' &&
      options.watchFiles !== null &&
      !Array.isArray(options.watchFiles)
    ) {
      options.watchFiles = [
        {
          paths: (options.watchFiles as IWatchFiles).paths,
          options: getWatchOptions(
            (options.watchFiles as IWatchFiles).options || {},
          ),
        },
      ];
    } else if (Array.isArray(options.watchFiles)) {
      options.watchFiles = options.watchFiles.map((item) => {
        if (typeof item === 'string') {
          return { paths: item, options: getWatchOptions() };
        }

        return {
          paths: item.paths,
          options: getWatchOptions(item.options || {}),
        };
      });
    } else {
      options.watchFiles = [];
    }
  }

  static isAbsoluteURL(sUrl: string) {
    // Don't match Windows paths `c:\`
    if (/^[a-zA-Z]:\\/.test(sUrl)) {
      return false;
    }

    // Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
    // Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
    return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(sUrl);
  }

  static findIp(gateway: string): string | undefined {
    const gatewayIp = ipaddr.parse(gateway);

    // Look for the matching interface in all local interfaces.
    for (const addresses of Object.values(os.networkInterfaces())) {
      if (addresses) {
        for (const { cidr } of addresses) {
          const net = ipaddr.parseCIDR(cidr);

          if (
            net[0] &&
            net[0].kind() === gatewayIp.kind() &&
            gatewayIp.match(net)
          ) {
            return net[0].toString();
          }
        }
      }
    }
  }

  static async internalIP(family: 'v4' | 'v6'): Promise<string | undefined> {
    try {
      const { gateway } = await defaultGateway[family]();
      return DevServer.findIp(gateway);
    } catch {
      // ignore
    }
  }

  static internalIPSync(family: 'v4' | 'v6'): string | undefined {
    try {
      const { gateway } = defaultGateway[family].sync();
      return DevServer.findIp(gateway);
    } catch {
      // ignore
    }
  }

  static async getHostname(hostname: TServerHost): Promise<string> {
    if (hostname === 'local-ip') {
      return (
        (await DevServer.internalIP('v4')) ||
        (await DevServer.internalIP('v6')) ||
        '0.0.0.0'
      );
    } else if (hostname === 'local-ipv4') {
      return (await DevServer.internalIP('v4')) || '0.0.0.0';
    } else if (hostname === 'local-ipv6') {
      return (await DevServer.internalIP('v6')) || '::';
    }

    return hostname;
  }

  static async getFreePort(port: TServerPort): Promise<number | string> {
    if (typeof port !== 'undefined' && port !== null && port !== 'auto') {
      return port;
    }

    const pRetry = require('@fe6/biu-deps/compiled/p-retry').default;
    const portfinder = require('@fe6/biu-deps/compiled/portfinder');

    portfinder.basePort =
      typeof process.env.WEBPACK_DEV_SERVER_BASE_PORT !== 'undefined'
        ? parseInt(process.env.WEBPACK_DEV_SERVER_BASE_PORT, 10)
        : DEFAULT_PORT;

    // Try to find unused port and listen on it for 3 times,
    // if port is not specified in options.
    const defaultPortRetry =
      typeof process.env.WEBPACK_DEV_SERVER_PORT_RETRY !== 'undefined'
        ? parseInt(process.env.WEBPACK_DEV_SERVER_PORT_RETRY, 10)
        : 3;

    return pRetry(() => portfinder.getPortPromise(), {
      retries: defaultPortRetry,
    });
  }

  setHeaders(req: Request, res: any, next: NextFunction) {
    let { headers } = this.options;

    if (headers) {
      const allHeaders: { key: string; value: string }[] = [];

      if (!Array.isArray(headers)) {
        for (const name in headers) {
          // @ts-ignore
          allHeaders.push({ key: name, value: headers[name] });
        }

        headers = allHeaders;
      }

      headers.forEach((header: { key: string; value: any }) => {
        res.setHeader(header.key, header.value);
      });
    }

    next();
  }

  checkHeader(
    headers: { [key: string]: string | undefined },
    headerToCheck: string,
  ): boolean {
    // allow user to opt out of this security check, at their own risk
    // by explicitly enabling allowedHosts
    if (this.options.allowedHosts === 'all') {
      return true;
    }

    // get the Host header and extract hostname
    // we don't care about port not matching
    const hostHeader = headers[headerToCheck];

    if (!hostHeader) {
      return false;
    }

    if (/^(file|.+-extension):/i.test(hostHeader)) {
      return true;
    }

    // use the node url-parser to retrieve the hostname from the host-header.
    const hostname = url.parse(
      // if hostHeader doesn't have scheme, add // for parsing.
      /^(.+:)?\/\//.test(hostHeader) ? hostHeader : `//${hostHeader}`,
      false,
      true,
    ).hostname;

    // always allow requests with explicit IPv4 or IPv6-address.
    // A note on IPv6 addresses:
    // hostHeader will always contain the brackets denoting
    // an IPv6-address in URLs,
    // these are removed from the hostname in url.parse(),
    // so we have the pure IPv6-address in hostname.
    // always allow localhost host, for convenience (hostname === 'localhost')
    // allow hostname of listening address  (hostname === this.options.host)
    const isValidHostname =
      (hostname !== null && ipaddr.IPv4.isValid(hostname)) ||
      (hostname !== null && ipaddr.IPv6.isValid(hostname)) ||
      hostname === 'localhost' ||
      hostname === this.options.host;

    if (isValidHostname) {
      return true;
    }

    const { allowedHosts } = this.options;

    // always allow localhost host, for convenience
    // allow if hostname is in allowedHosts
    if (Array.isArray(allowedHosts) && allowedHosts.length > 0) {
      for (let hostIdx = 0; hostIdx < allowedHosts.length; hostIdx++) {
        const allowedHost = allowedHosts[hostIdx];

        if (allowedHost === hostname) {
          return true;
        }

        // support "." as a subdomain wildcard
        // e.g. ".example.com" will allow "example.com", "www.example.com", "subdomain.example.com", etc
        if (allowedHost[0] === '.') {
          // "example.com"  (hostname === allowedHost.substring(1))
          // "*.example.com"  (hostname.endsWith(allowedHost))
          if (
            hostname === allowedHost.substring(1) ||
            String(hostname).endsWith(allowedHost)
          ) {
            return true;
          }
        }
      }
    }

    // Also allow if `client.webSocketURL.hostname` provided
    const webSocketURL = (this.options.client as IClientConfiguration)
      .webSocketURL as IClientWebSocketURL;
    if (this.options.client && typeof webSocketURL !== 'undefined') {
      return webSocketURL === hostname;
    }

    // disallow
    return false;
  }

  sendMessage(
    clients: TClientConnection[],
    type: string,
    data?: any,
    params?: any,
  ) {
    for (const client of clients) {
      // `sockjs` uses `1` to indicate client is ready to accept data
      // `ws` uses `WebSocket.OPEN`, but it is mean `1` too
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type, data, params }));
      }
    }
  }

  addAdditionalEntries(compiler: Compiler) {
    const additionalEntries: string[] = [];

    const isWebTarget = compiler.options.externalsPresets
      ? compiler.options.externalsPresets.web
      : [
          'web',
          'webworker',
          'electron-preload',
          'electron-renderer',
          'node-webkit',
          // eslint-disable-next-line no-undefined
          undefined,
          null,
        ].includes(String(compiler.options.target));

    // TODO maybe empty empty client
    if (this.options.client && isWebTarget) {
      let webSocketURLStr = '';

      const webSocketURL = (this.options.client as IClientConfiguration)
        .webSocketURL as IClientWebSocketURL;
      const searchParams = new URLSearchParams();

      let protocol: string;

      // We are proxying dev server and need to specify custom `hostname`
      if (typeof webSocketURL.protocol !== 'undefined') {
        protocol = webSocketURL.protocol;
      } else {
        protocol = 'ws:';
      }

      searchParams.set('protocol', protocol);

      if (typeof webSocketURL.username !== 'undefined') {
        searchParams.set('username', webSocketURL.username);
      }

      if (typeof webSocketURL.password !== 'undefined') {
        searchParams.set('password', webSocketURL.password);
      }

      let hostname;

      // SockJS is not supported server mode, so `hostname` and `port` can't specified, let's ignore them
      // TODO show warning about this
      // const isSockJSType = webSocketServer.type === "sockjs";

      // We are proxying dev server and need to specify custom `hostname`
      if (typeof webSocketURL.hostname !== 'undefined') {
        hostname = webSocketURL.hostname;
      }
      // Web socket server works on custom `hostname`, only for `ws` because `sock-js` is not support custom `hostname`
      else if (typeof this.options.host !== 'undefined') {
        hostname = this.options.host;
      }
      // The `port` option is not specified
      else {
        hostname = '0.0.0.0';
      }

      searchParams.set('hostname', hostname);

      let port: number | string;

      // We are proxying dev server and need to specify custom `port`
      if (typeof webSocketURL.port !== 'undefined') {
        port = webSocketURL.port;
      }
      // Web socket server works on custom `port`, only for `ws` because `sock-js` is not support custom `port`
      else if (typeof this.options.port === 'number') {
        port = this.options.port;
      }
      // The `port` option is specified using `string`
      else if (
        typeof this.options.port === 'string' &&
        this.options.port !== 'auto'
      ) {
        port = Number(this.options.port);
      }
      // The `port` option is not specified or set to `auto`
      else {
        port = '0';
      }

      searchParams.set('port', String(port));

      let pathname: string = '';

      // We are proxying dev server and need to specify custom `pathname`
      if (typeof webSocketURL.pathname !== 'undefined') {
        pathname = webSocketURL.pathname;
      }

      searchParams.set('pathname', pathname);

      const client = this.options.client as IClientConfiguration;

      if (typeof client.logging !== 'undefined') {
        searchParams.set('logging', client.logging);
      }

      if (typeof client.reconnect !== 'undefined') {
        searchParams.set(
          'reconnect',
          typeof client.reconnect === 'number'
            ? String(client.reconnect)
            : '10',
        );
      }

      webSocketURLStr = searchParams.toString();

      // WS 热更新
      additionalEntries.push(
        `${require.resolve('../../client/index.js')}?${webSocketURLStr}`,
      );
    }

    // WS 热更新
    if (this.options.hot === 'only') {
      additionalEntries.push(require.resolve('../../hot/only-dev-server'));
    } else if (this.options.hot) {
      additionalEntries.push(require.resolve('../../hot/dev-server'));
    }

    const webpack =
      compiler.webpack || require('@fe6-deps-webpack/compiled/webpack');

    // use a hook to add entries if available
    if (typeof webpack.EntryPlugin !== 'undefined') {
      for (const additionalEntry of additionalEntries) {
        new webpack.EntryPlugin(compiler.context, additionalEntry, {
          name: undefined,
        }).apply(compiler);
      }
    }
  }

  // 进度条
  setupProgressPlugin() {
    const { ProgressPlugin } = (this.compiler as MultiCompiler).compilers
      ? (this.compiler as MultiCompiler).compilers[0].webpack
      : (this.compiler as Compiler).webpack;

    new ProgressPlugin(
      (percent: number, msg: string, addInfo: string, pluginName: string) => {
        percent = Math.floor(percent * 100);

        if (percent === 100) {
          msg = 'Compilation completed';
        }

        if (addInfo) {
          msg = `${msg} (${addInfo})`;
        }

        if (this.webSocketServer) {
          this.sendMessage(this.webSocketServer.clients, 'progress-update', {
            percent,
            msg,
            pluginName,
          });
        }

        if (this.server) {
          this.server.emit('progress-update', { percent, msg, pluginName });
        }
      },
    ).apply(this.compiler);
  }

  // Send stats to a socket or multiple sockets
  sendStats(
    clients: TClientConnection[],
    stats: StatsCompilation,
    force?: boolean,
  ) {
    const shouldEmit =
      !force &&
      stats &&
      (!stats.errors || stats.errors.length === 0) &&
      (!stats.warnings || stats.warnings.length === 0) &&
      this.currentHash === stats.hash;

    if (shouldEmit) {
      this.sendMessage(clients, 'still-ok');

      return;
    }

    this.currentHash = stats.hash;
    this.sendMessage(clients, 'hash', stats.hash);

    if (
      (stats.errors &&
        (stats.errors as NonNullable<StatsCompilation['errors']>).length > 0) ||
      (stats.warnings &&
        (stats.warnings as NonNullable<StatsCompilation['warnings']>).length >
          0)
    ) {
      const hasErrors =
        (stats.errors as NonNullable<StatsCompilation['errors']>).length > 0;

      if (
        (stats.warnings as NonNullable<StatsCompilation['warnings']>).length > 0
      ) {
        let params;

        if (hasErrors) {
          params = { preventReloading: true };
        }

        this.sendMessage(clients, 'warnings', stats.warnings, params);
      }

      if (
        stats.errors &&
        (stats.errors as NonNullable<StatsCompilation['errors']>).length > 0
      ) {
        this.sendMessage(clients, 'errors', stats.errors);
      }
    } else {
      this.sendMessage(clients, 'ok');
    }
  }

  invalidate(callback: WebpackDevMiddlewareCallback = () => {}) {
    if (this.middleware) {
      this.middleware.invalidate(callback);
    }
  }

  getStats(statsObj: Stats | MultiStats): StatsCompilation {
    const stats = DevServer.DEFAULT_STATS;
    const compilerOptions = this.getCompilerOptions();

    // @ts-ignore
    if (compilerOptions.stats && compilerOptions.stats.warningsFilter) {
      // @ts-ignore
      stats.warningsFilter = compilerOptions.stats.warningsFilter;
    }

    return statsObj.toJson(stats);
  }

  setupHooks(): void {
    this.compiler.hooks.invalid.tap('webpack-dev-server', () => {
      if (this.webSocketServer) {
        this.sendMessage(this.webSocketServer.clients, 'invalid');
      }
    });
    this.compiler.hooks.done.tap('webpack-dev-server', (stats) => {
      if (this.webSocketServer) {
        // @ts-ignore
        this.sendStats(this.webSocketServer.clients, this.getStats(stats));
      }

      // @ts-ignore
      this.stats = stats;
    });
  }

  setupApp(): void {
    this.app = express();
  }

  setupHostHeaderCheck(): void {
    if (this.app) {
      this.app.all('*', (req: any, res: any, next: NextFunction): void => {
        if (this.checkHeader(req.headers, 'host')) {
          return next();
        }

        res.send('Invalid Host header');
      });
    }
  }

  setupDevMiddleware(): void {
    this.middleware = webpackDevMiddleware(
      this.compiler,
      this.options.devMiddleware,
    );
  }

  setupBuiltInRoutes(): void {
    const { app, middleware } = this;

    if (app) {
      // app.get(
      //   "/__webpack_dev_server__/sockjs.bundle.js",
      //   (_, res) => {
      //     res.setHeader("Content-Type", "application/javascript");

      //     const { createReadStream } = fs;
      //     const clientPath = join(__dirname, "..", "client");

      //     createReadStream(
      //       join(clientPath, "modules/sockjs-client/index.js")
      //     ).pipe(res);
      //   }
      // );

      app.get('/webpack-dev-server/invalidate', (_, res) => {
        this.invalidate();
        res.end();
      });

      app.get('/webpack-dev-server', (_, res: any): void => {
        middleware.waitUntilValid((stats: Stats | MultiStats) => {
          res.setHeader('Content-Type', 'text/html');
          res.write(
            '<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>',
          );

          const statsForPrint: StatsCompilation[] | undefined =
            typeof (stats as MultiStats).stats !== 'undefined'
              ? stats.toJson().children
              : [stats.toJson()];

          res.write(`<h1>Assets Report:</h1>`);

          if (statsForPrint) {
            statsForPrint.forEach((item: any, index: number) => {
              res.write('<div>');

              const name =
                // eslint-disable-next-line no-nested-ternary
                typeof item.name !== 'undefined'
                  ? item.name
                  : (stats as MultiStats).stats
                  ? `unnamed[${index}]`
                  : 'unnamed';

              res.write(`<h2>Compilation: ${name}</h2>`);
              res.write('<ul>');

              const publicPath =
                item.publicPath === 'auto' ? '' : item.publicPath;

              for (const asset of item.assets) {
                const assetName = asset.name;
                const assetURL = `${publicPath}${assetName}`;

                res.write(
                  `<li>
                  <strong><a href="${assetURL}" target="_blank">${assetName}</a></strong>
                </li>`,
                );
              }

              res.write('</ul>');
              res.write('</div>');
            });
          }

          res.end('</body></html>');
        });
      });
    }
  }

  watchFiles(watchPath: string | string[], watchOptions: TWatchOptions) {
    const chokidar = require('@fe6/biu-deps/compiled/chokidar');
    const watcher = chokidar.watch(watchPath, watchOptions);

    // disabling refreshing on changing the content
    if (this.options.liveReload) {
      watcher.on('change', (item: any) => {
        if (this.webSocketServer) {
          this.sendMessage(
            this.webSocketServer.clients,
            'static-changed',
            item,
          );
        }
      });
    }

    this.staticWatchers.push(watcher);
  }

  setupWatchFiles(): void {
    const { watchFiles } = this.options;

    if (watchFiles && (watchFiles as IWatchFiles[]).length > 0) {
      watchFiles.forEach((item) => {
        this.watchFiles(item.paths, item.options);
      });
    }
  }

  setupWatchStaticFiles(): void {
    if (this.options.static && (this.options.static as IStatic[]).length > 0) {
      (this.options.static as IStatic[]).forEach((staticOption) => {
        if (staticOption.watch && staticOption?.directory) {
          this.watchFiles(staticOption.directory, staticOption.watch);
        }
      });
    }
  }

  setupMiddlewares(): void {
    let middlewares: TMiddleware[] = [];

    // compress is placed last and uses unshift so that it will be the first middleware used
    if (this.options.compress) {
      const compression = require('@fe6/biu-deps-webpack/compiled/compression');
      middlewares.push({ name: 'compression', middleware: compression() });
    }

    // TODO 中间件的 hook
    // if (typeof this.options.onBeforeSetupMiddleware === "function") {
    //   this.options.onBeforeSetupMiddleware(this);
    // }

    if (typeof this.options.headers !== 'undefined') {
      middlewares.push({
        name: 'set-headers',
        path: '*',
        middleware: this.setHeaders.bind(this),
      } as any);
    }

    middlewares.push({
      name: 'webpack-dev-middleware',
      middleware: this.middleware,
    });

    if (this.options.proxy) {
      const {
        createProxyMiddleware,
      } = require('@fe6/biu-deps-webpack/compiled/http-proxy-middleware');

      const getProxyMiddleware = (
        proxyConfig: TProxyConfigArrayItem,
      ): RequestHandler | undefined => {
        // It is possible to use the `bypass` method without a `target` or `router`.
        // However, the proxy middleware has no use in this case, and will fail to instantiate.
        if (proxyConfig.target) {
          const context = proxyConfig.context || proxyConfig.path;

          return createProxyMiddleware(context, proxyConfig);
        }

        if (proxyConfig.router) {
          return createProxyMiddleware(proxyConfig);
        }
      };

      /**
       * Assume a proxy configuration specified as:
       * proxy: [
       *   {
       *     context: "value",
       *     ...options,
       *   },
       *   // or:
       *   function() {
       *     return {
       *       context: "context",
       *       ...options,
       *     };
       *   }
       * ]
       */
      this.options.proxy.forEach((proxyConfigOrCallback) => {
        let proxyMiddleware: RequestHandler | undefined;

        let proxyConfig = proxyConfigOrCallback;

        proxyMiddleware = getProxyMiddleware(proxyConfig);

        if (proxyConfig.ws && proxyMiddleware) {
          this.webSocketProxies.push(proxyMiddleware);
        }

        const handler = async (req: any, res: any, next: NextFunction) => {
          // - Check if we have a bypass function defined
          // - In case the bypass function is defined we'll retrieve the
          // bypassUrl from it otherwise bypassUrl would be null
          // TODO remove in the next major in favor `context` and `router` options
          const isByPassFuncDefined = typeof proxyConfig.bypass === 'function';
          const bypassUrl = isByPassFuncDefined
            ? await (proxyConfig.bypass as Function)(req, res, proxyConfig)
            : null;

          if (typeof bypassUrl === 'boolean') {
            // skip the proxy
            // @ts-ignore
            req.url = null;
            next();
          } else if (typeof bypassUrl === 'string') {
            // byPass to that url
            // @ts-ignore
            req.url = bypassUrl;
            next();
          } else if (proxyMiddleware) {
            return proxyMiddleware(req, res, next);
          } else {
            next();
          }
        };

        middlewares.push({
          name: 'http-proxy-middleware',
          middleware: handler,
        });
        // Also forward error requests to the proxy so it can handle them.
        middlewares.push({
          name: 'http-proxy-middleware-error-handler',
          middleware: (_, req, res, next) => handler(req, res, next),
        });
      });

      middlewares.push({
        name: 'webpack-dev-middleware',
        middleware: this.middleware,
      });
    }

    if (
      Array.isArray(this.options.static) &&
      (this.options.static as IStatic[]).length > 0
    ) {
      (this.options.static as IStatic[]).forEach((staticOption) => {
        let publicPath: string[] = [];
        if (isString(staticOption.publicPath)) {
          publicPath = [staticOption.publicPath];
        }
        if (Array.isArray(staticOption.publicPath)) {
          publicPath = staticOption.publicPath;
        }
        publicPath.forEach((publicPath) => {
          middlewares.push({
            name: 'express-static',
            path: publicPath,
            middleware: express.static(
              staticOption.directory,
              staticOption.staticOptions,
            ),
          });
        });
      });
    }

    if (this.options.historyApiFallback) {
      const { historyApiFallback } = this.options;

      if (
        typeof (historyApiFallback as ConnectHistoryApiFallbackOptions)
          .logger === 'undefined' &&
        !(historyApiFallback as ConnectHistoryApiFallbackOptions).verbose
      ) {
        // @ts-ignore
        historyApiFallback.logger = logger.warn.bind(
          logger,
          '[connect-history-api-fallback]',
        );
      }

      // Fall back to /index.html if nothing else matches.
      middlewares.push({
        name: 'connect-history-api-fallback',
        middleware: connectHistoryApiFallback(
          historyApiFallback as ConnectHistoryApiFallbackOptions,
        ),
      });

      // include our middleware to ensure
      // it is able to handle '/index.html' request after redirect
      middlewares.push({
        name: 'webpack-dev-middleware',
        middleware: this.middleware,
      });

      if (
        Array.isArray(this.options.static) &&
        (this.options.static as IStatic[]).length > 0
      ) {
        (this.options.static as IStatic[]).forEach((staticOption) => {
          let publicPath: string[] = [];
          if (isString(staticOption.publicPath)) {
            publicPath = [staticOption.publicPath];
          }
          if (Array.isArray(staticOption.publicPath)) {
            publicPath = staticOption.publicPath;
          }
          publicPath.forEach((publicPath) => {
            middlewares.push({
              name: 'express-static',
              path: publicPath,
              middleware: express.static(
                staticOption.directory,
                staticOption.staticOptions,
              ),
            });
          });
        });
      }
    }

    if (
      Array.isArray(this.options.static) &&
      (this.options.static as IStatic[]).length > 0
    ) {
      const serveIndex = require('@fe6/biu-deps/compiled/serve-index');

      (this.options.static as IStatic[]).forEach((staticOption) => {
        let publicPath: string[] = [];
        if (isString(staticOption.publicPath)) {
          publicPath = [staticOption.publicPath];
        }
        if (Array.isArray(staticOption.publicPath)) {
          publicPath = staticOption.publicPath;
        }
        publicPath.forEach((publicPath) => {
          if (staticOption.serveIndex) {
            middlewares.push({
              name: 'serve-index',
              path: publicPath,
              middleware: (req: any, res: any, next: NextFunction): void => {
                // serve-index doesn't fallthrough non-get/head request to next middleware
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                  return next();
                }

                serveIndex(staticOption.directory, staticOption.serveIndex)(
                  req,
                  res,
                  next,
                );
              },
            });
          }
        });
      });
    }

    // TODO magicHtml 文件既是路由
    // if (this.options.magicHtml) {
    //   middlewares.push({
    //     name: "serve-magic-html",
    //     middleware: this.serveMagicHtml.bind(this),
    //   });
    // }

    // TODO 中间件的 hook
    // if (typeof this.options.setupMiddlewares === "function") {
    //   middlewares = this.options.setupMiddlewares(middlewares, this);
    // }

    if (this.app) {
      middlewares.forEach((middleware) => {
        if (typeof middleware === 'function') {
          (this.app as Application).use(middleware);
        } else if (typeof middleware.path !== 'undefined') {
          (this.app as Application).use(middleware.path, middleware.middleware);
        } else {
          if (middleware.middleware) {
            (this.app as Application).use(middleware.middleware);
          }
        }
      });
    }

    // TODO 中间件的 hook
    // if (typeof this.options.onAfterSetupMiddleware === "function") {
    //   this.options.onAfterSetupMiddleware(this);
    // }
  }

  createServer(): void {
    this.server = http.createServer(this.app);

    this.server.on('connection', (socket: Socket) => {
      // Add socket to list
      this.sockets.push(socket);

      socket.once('close', () => {
        // Remove socket from list
        this.sockets.splice(this.sockets.indexOf(socket), 1);
      });
    });

    this.server.on('error', (error: Error) => {
      logger.errorExit(error);
    });
  }

  async initialize(): Promise<void> {
    const compilers = (this.compiler as MultiCompiler).compilers || [
      this.compiler,
    ];

    compilers.forEach((compiler) => {
      this.addAdditionalEntries(compiler);

      const webpack =
        compiler.webpack || require('@fe6-deps-webpack/compiled/webpack');

      // WS 热更新
      new webpack.ProvidePlugin({
        __webpack_dev_server_client__: join(
          __dirname,
          '../../client/clients/WebSocketClient',
        ),
      }).apply(compiler);

      if (this.options.hot) {
        const HMRPluginExists = compiler.options.plugins.find(
          (p) => p.constructor === webpack.HotModuleReplacementPlugin,
        );

        if (HMRPluginExists) {
          logger.warn(
            `"hot: true" automatically applies HMR plugin, you don't have to add it manually to your webpack configuration.`,
          );
        } else {
          // Apply the HMR plugin
          const plugin = new webpack.HotModuleReplacementPlugin();

          plugin.apply(compiler);
        }
      }
    });

    if (
      this.options.client &&
      (this.options.client as IClientConfiguration).progress
    ) {
      this.setupProgressPlugin();
    }

    this.setupHooks();
    this.setupApp();
    this.setupHostHeaderCheck();
    this.setupDevMiddleware();
    // Should be after `webpack-dev-middleware`, otherwise other middlewares might rewrite response
    this.setupBuiltInRoutes();
    this.setupWatchFiles();
    this.setupWatchStaticFiles();
    this.setupMiddlewares();
    this.createServer();

    if (this.options.setupExitSignals) {
      const signals = ['SIGINT', 'SIGTERM'];

      let needForceShutdown = false;

      signals.forEach((signal) => {
        const listener = () => {
          if (needForceShutdown) {
            process.exit();
          }

          logger.info(
            'Gracefully shutting down. To force exit, press ^C again. Please wait...',
          );

          needForceShutdown = true;

          this.stopCallback(() => {
            if (typeof this.compiler.close === 'function') {
              this.compiler.close(() => {
                process.exit();
              });
            } else {
              process.exit();
            }
          });
        };

        this.listeners.push({ name: signal, listener });

        process.on(signal, listener);
      });
    }

    // Proxy WebSocket without the initial http request
    // https://github.com/chimurai/http-proxy-middleware#external-websocket-upgrade
    if (this.server) {
      this.webSocketProxies.forEach((webSocketProxy) => {
        (this.server as HttpServer).on(
          'upgrade',
          (webSocketProxy as any)?.upgrade,
        );
      }, this);
    }
  }

  async handleIpc() {
    if (this.options.ipc) {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();

        socket.on('error', (error: Error & { code?: string }) => {
          if (error.code === 'ECONNREFUSED') {
            // No other server listening on this socket so it can be safely removed
            fs.unlinkSync(String(this.options.ipc));

            resolve('ECONNREFUSED');

            return;
          } else if (error.code === 'ENOENT') {
            resolve('ENOENT');

            return;
          }

          reject(error);
        });

        socket.connect({ path: String(this.options.ipc) }, () => {
          logger.errorExit(`IPC "${this.options.ipc}" is already used`);
        });
      });
    } else {
      this.options.host = await DevServer.getHostname(
        this.options.host as TServerHost,
      );
      this.options.port = await DevServer.getFreePort(
        this.options.port as TServerPort,
      );
    }
  }

  async listenIpc() {
    const listenOptions = this.options.ipc
      ? { path: this.options.ipc }
      : { host: this.options.host, port: this.options.port };

    await new Promise((resolve): void => {
      if (this.server) {
        this.server.listen(listenOptions, () => {
          resolve(1);
        });
      }
    });
  }

  async setChmod() {
    if (this.options.ipc) {
      // chmod 666 (rw rw rw)
      const READ_WRITE = 438;

      await fs.promises.chmod(String(this.options.ipc), READ_WRITE);
    }
  }

  createWebSocketServer(): void {
    this.webSocketServer = new WskServer(this);
    if (this.webSocketServer) {
      (
        this.webSocketServer as IWebSocketServerImplementation
      ).implementation.on(
        'connection',
        (client: TClientConnection, request: IncomingMessage) => {
          const headers: any =
            typeof request !== 'undefined'
              ? request.headers
              : typeof client.headers !== 'undefined'
              ? client.headers
              : undefined;

          if (!headers) {
            logger.warn(
              'webSocketServer implementation must pass headers for the "connection" event',
            );
          }

          if (
            !headers ||
            !this.checkHeader(headers, 'host') ||
            !this.checkHeader(headers, 'origin')
          ) {
            this.sendMessage([client], 'error', 'Invalid Host/Origin header');

            // With https enabled, the sendMessage above is encrypted asynchronously so not yet sent
            // Terminate would prevent it sending, so use close to allow it to be sent
            client.close();

            return;
          }

          if (this.options.hot === true || this.options.hot === 'only') {
            this.sendMessage([client], 'hot');
          }

          if (this.options.liveReload) {
            this.sendMessage([client], 'liveReload');
          }

          if (
            this.options.client &&
            (this.options.client as IClientConfiguration)?.progress
          ) {
            this.sendMessage(
              [client],
              'progress',
              (this.options.client as IClientConfiguration).progress,
            );
          }

          if (
            this.options.client &&
            (this.options.client as IClientConfiguration).reconnect
          ) {
            this.sendMessage(
              [client],
              'reconnect',
              (this.options.client as IClientConfiguration).reconnect,
            );
          }

          if (
            this.options.client &&
            (this.options.client as IClientConfiguration).overlay
          ) {
            this.sendMessage(
              [client],
              'overlay',
              (this.options.client as IClientConfiguration).overlay,
            );
          }

          if (!this.stats) {
            return;
          }

          this.sendStats([client], this.getStats(this.stats), true);
        },
      );
    }
  }

  runBonjour() {
    this.bonjour = new Bonjour();
    this.bonjour.publish({
      // @ts-expect-error
      name: `Webpack Dev Server ${os.hostname()}:${Number(this.options.port)}`,
      // @ts-expect-error
      port: Number(this.options.port),
      // @ts-expect-error
      type: 'http',
      subtypes: ['webpack'],
      ...(this.options.bonjour as TBonjourCore),
    });
  }

  openBrowser(defaultOpenTarget: string): void {
    Promise.all(
      (this.options.open as IOpen[]).map((item) => {
        let openTarget: string;

        if (item.target === '<url>') {
          openTarget = defaultOpenTarget;
        } else {
          openTarget = DevServer.isAbsoluteURL(item.target)
            ? item.target
            : new URL(item.target, defaultOpenTarget).toString();
        }

        return open(openTarget, item.options).catch(() => {
          logger.warn(
            `Unable to open "${openTarget}" page${
              item.options.app
                ? ` in "${(item.options.app as OpenApp).name}" app${
                    (item.options.app as OpenApp).arguments
                      ? ` with "${(
                          (item.options.app as OpenApp).arguments as string[]
                        ).join(' ')}" arguments`
                      : ''
                  }`
                : ''
            }. If you are running in a headless environment, please do not use the "open" option or related flags like "--open", "--open-target", and "--open-app".`,
          );
        });
      }),
    );
  }

  logStatus(): void {
    const {
      isColorSupported,
      cyan,
      red,
    } = require('@fe6/biu-deps/compiled/colorette');

    const getColorsOption = (compilerOptions: Compiler['options']): boolean => {
      let colorsEnabled: boolean;

      if (
        compilerOptions.stats &&
        typeof (compilerOptions.stats as StatsOptions).colors !== 'undefined'
      ) {
        colorsEnabled = !!(compilerOptions.stats as StatsOptions).colors;
      } else {
        colorsEnabled = isColorSupported;
      }

      return colorsEnabled;
    };

    const colors = {
      info(useColor: boolean, msg: string): string {
        if (useColor) {
          return cyan(msg);
        }

        return msg;
      },
      error(useColor: boolean, msg: string): string {
        if (useColor) {
          return red(msg);
        }

        return msg;
      },
    };
    const useColor = getColorsOption(this.getCompilerOptions());

    if (this.options.ipc && this.server) {
      logger.info(`Project is running at: "${this.server.address()}"`);
    } else {
      const protocol = 'http';
      const theAddress = (this.server as HttpServer).address();
      const { address, port } = (theAddress as any) || {
        address: '',
        host: '',
      };

      const prettyPrintURL = (newHostname: string): string =>
        url.format({ protocol, hostname: newHostname, port, pathname: '/' });

      let server;
      let localhost;
      let loopbackIPv4;
      let loopbackIPv6;
      let networkUrlIPv4;
      let networkUrlIPv6;

      if (this.options.host) {
        if (this.options.host === 'localhost') {
          localhost = prettyPrintURL('localhost');
        } else {
          let isIP;

          try {
            isIP = ipaddr.parse(this.options.host);
          } catch (error) {
            // Ignore
          }

          if (!isIP) {
            server = prettyPrintURL(this.options.host);
          }
        }
      }

      const parsedIP = ipaddr.parse(address);

      if (parsedIP.range() === 'unspecified') {
        localhost = prettyPrintURL('localhost');

        const networkIPv4 = DevServer.internalIPSync('v4');

        if (networkIPv4) {
          networkUrlIPv4 = prettyPrintURL(networkIPv4);
        }

        const networkIPv6 = DevServer.internalIPSync('v6');

        if (networkIPv6) {
          networkUrlIPv6 = prettyPrintURL(networkIPv6);
        }
      } else if (parsedIP.range() === 'loopback') {
        if (parsedIP.kind() === 'ipv4') {
          loopbackIPv4 = prettyPrintURL(parsedIP.toString());
        } else if (parsedIP.kind() === 'ipv6') {
          loopbackIPv6 = prettyPrintURL(parsedIP.toString());
        }
      } else {
        networkUrlIPv4 =
          parsedIP.kind() === 'ipv6' && parsedIP.isIPv4MappedAddress()
            ? prettyPrintURL(parsedIP.toIPv4Address().toString())
            : prettyPrintURL(address);

        if (parsedIP.kind() === 'ipv6') {
          networkUrlIPv6 = prettyPrintURL(address);
        }
      }

      logger.empty();
      logger.successOnly('Project is running at:');

      if (server) {
        logger.successOnly(`Server: ${colors.info(useColor, server)}`);
      }

      if (localhost || loopbackIPv4 || loopbackIPv6) {
        const loopbacks = [];

        if (localhost) {
          loopbacks.push([colors.info(useColor, localhost)]);
        }

        if (loopbackIPv4) {
          loopbacks.push([colors.info(useColor, loopbackIPv4)]);
        }

        if (loopbackIPv6) {
          loopbacks.push([colors.info(useColor, loopbackIPv6)]);
        }

        logger.successOnly(`Loopback: ${loopbacks.join(', ')}`);
      }

      if (networkUrlIPv4) {
        logger.successOnly(
          `On Your Network (IPv4): ${colors.info(useColor, networkUrlIPv4)}`,
        );
      }

      if (networkUrlIPv6) {
        logger.successOnly(
          `On Your Network (IPv6): ${colors.info(useColor, networkUrlIPv6)}`,
        );
      }

      if ((this.options.open as IOpen[]).length > 0) {
        const openTarget = prettyPrintURL(this.options.host || 'localhost');
        this.openBrowser(openTarget);
      }
    }

    if ((this.options.static as INormalizedStatic[]).length > 0) {
      logger.successOnly(
        `Content not from webpack is served from '${colors.info(
          useColor,
          (this.options.static as INormalizedStatic[])
            .map((staticOption) => staticOption.directory)
            .join(', '),
        )}' directory`,
      );
    }

    if (this.options.historyApiFallback) {
      logger.info(
        `404s will fallback to '${colors.info(
          useColor,
          (this.options.historyApiFallback as ConnectHistoryApiFallbackOptions)
            .index || '/index.html',
        )}'`,
      );
    }

    if (this.options.bonjour) {
      const bonjourProtocol = 'http';
      logger.info(
        `Broadcasting "${bonjourProtocol}" with subtype of "webpack" via ZeroConf DNS (Bonjour)`,
      );
    }
  }

  async start() {
    await this.normalizeOptions();
    await this.handleIpc();

    await this.initialize();
    await this.listenIpc();

    await this.setChmod();

    this.createWebSocketServer();

    if (this.options.bonjour) {
      this.runBonjour();
    }

    this.logStatus();
  }

  async stop() {}

  stopCallback(callback: (err?: Error) => void = () => {}) {
    this.stop()
      .then(() => callback(), callback)
      .catch(callback);
  }
}

export default DevServer;
