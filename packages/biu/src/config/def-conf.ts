/** @format */

import path from 'path';

// 默认 BIU 配置
export const mergeConfig = (opts: any = {}) => {
  return {
    ...{
      root: process.cwd(),
      env: undefined,
      appSrc: 'src',
      publicDir: 'public',
      cacheDir: 'node_modules/.biu-cache',
      // build,
      define: [],
      plugins: [],
      // server,
      // html,
      // debug,
      useImportMeta: false,
      splitCss: true,
      appEntry: '',
      jsCheck: false,
      typingsPath: path.resolve('src', 'biuShareTypes'),
      // dtsPath,
      // moduleTransformExclude,
      // initTemplates,
    },
    ...opts,
  };
};
