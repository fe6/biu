<!-- @format -->

# 配置 Vite {#configuring-biu}

## 配置文件 {#config-file}

### 配置文件解析 {#config-file-resolving}

当以命令行方式运行 `biu` 时，Vite 会自动解析 [项目根目录](/guide/#index-html-and-project-root) 下名为 `.biurc.js` 的文件。

最基础的配置文件是这样的：

```js
// .biurc.js
export default {
  // 配置选项
};
```

你可以显式地通过 `--config` 命令行选项指定一个配置文件（相对于 `cwd` 路径进行解析）

```bash
biu --config my-config.js
```

### 智能提示 {#typescript-tip}

```js
/**
 * @type {import('@fe6/biu').TBiuConfigExport}
 */
module.exports = {};
```

### 函数式配置 {#function-config}

```js
// mode 为webpack mode变量 development production
// env 为 biu dev --env dev 的 dev
module.exports = defineConfig(({ mode, env }) => {
  return {};
});
```

## 全局配置 {#global-config}

### root

- 类型 `string`
- 默认 `process.cwd()`

项目根目录、自动获取

### appSrc

- 类型 `string`
- 默认 `src`

项目代码来源文件夹

### appEntry

- 类型 `string`
- 默认 ``

项目代码入口文件 如 `main.js`

### base

- 类型 `string`
- 默认 app 模式下为 `auto`,lib 模式下 为 `空` 屏蔽 import auto 模式

相关介绍

- 绝对 URL 路径名，例如 /
- 完整的 URL，例如 https://baidu.com/
- 替代 webpack `publicPath` 的设置，并做了统一化处理

### publicDir

- 类型 `string`
- 默认 `public`

静态文件路径

### cacheDir

- 类型 `string`
- 默认 `node_modules/.biu-cache`

缓存目录

### resolve.extends

- 类型 `boolean`
- 默认为 `true`

是否继承系统默认设置 默认继承
设置 `false` 后，会按需替换 不设置则还是按照系统配置

### resolve.alias

- 类型 `{[key:string]:string}`
- 默认为 `{src: config.appSrc}`

### resolve.modules

- 类型 `string[]`

### resolve.extensions

- 类型 `string[]`
- 默认为 `['.js','.jsx','.mjs','.ts','.tsx','.css','.less','.scss','.sass','.json','.wasm','.vue','.svg','.svga']`

### define

- 类型 `Record<string, string|number|boolean>`

全局环境替换

- 配置

```js
module.exports = {
  define: { biu: { name: 'biuName', value: ['a', 'b', 'c'] } },
};
```

- 使用

```js
console.log('process.env.biu', process.env.biu);
```

### plugins

- 类型 `ConfigPluginType[]`

### webpackChain

- 类型 `WebpackChainType`

暴露到 .biurc.js 可以自定义 webpack 配置
深入了解 Webpack Chain 使用，请看详细文档: https://github.com/neutrinojs/webpack-chain#getting-started
例如:

```js
const { defineConfig } = require('@fe6/biu');
const WebpackAssetsManifest = require('webpack-assets-manifest');
module.exports = defineConfig(({ mode, env }) => {
  return {
    webpackChain: (chain, config) => {
      // 创建 assets-manifest.json -> 所有资源文件路径
      chain.plugin('WebpackAssetsManifest').use(WebpackAssetsManifest);
    },
  };
});
```

### biushare

- 类型 `EMPShareExport`

  - biu share 配置
  - 实现 3 重共享模型
  - biushare 与 module federation 只能选择一个配置

- 使用方法 `.biurc.js`

```js
module.exports={
  // objects
  biushare:{}
  // or funciton
  biushare(o: EMPConfig){}
  // or async function
  async biushare(o: EMPConfig){}
}
```

- 配置用例如下

```js
module.exports = {
  biuShare: {
    name: 'microApp',
    remotes: {
      '@microHost': `microHost@http://localhost:8001/biu.js`,
    },
    exposes: {
      './App': './src/App',
    },
    shareLib: {
      react:
        'React@https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.development.js',
      'react-dom':
        'ReactDOM@https://cdn.jsdelivr.net/npm/react-dom@17.0.2/umd/react-dom.development.js',
    },
  },
};
```

## Typescript 配置 {#ts-config}

### ts.dts

- 类型 `boolean`
- 默认 `false`

是否生成 d.ts 文件

### ts.dtsPath

- 类型 `{[key: string]: string}`
- 默认 `<remoteHost>/biu-share-types/index.d.ts`
- 配置例子:

```js
   dtsPath: {
    //  '对应 remotes 里的项目名' : '.dts 文件的远程路径'
      '@microHost': 'http://127.0.0.1:8001/types/index.d.ts',
    },
```

### ts.typesBiuName

- 类型 `string`
- 默认 `index.d.ts` 生成 与 同步相同

生成 BIU 基站类型文件 默认为 `index.d.ts`

### ts.typesOutDir

- 类型 `string`
- 默认 `dist/biu-share-types`

当前项目声明文件输出目录

### ts.typingsPath

- 类型 `string`
- 默认 `src/biu-share-types`

`biu dts` 指令 同步基站 d.ts 目录

## Server 服务选项 {#server-config}

### server.port

- 类型 `number`
- 默认 2022

本地开发的端口号

## Html 配置 {#html-config}

### html.title

- 类型 `string`
- 默认 ''

Html 模板标题

### html.favicon

- 类型 `string`
- 默认 ''

Html 模板 favicon 配置

### html.files.js

- 类型 `string[]`
- 默认 ''

Html 模板注入的 js

### html.files.css

- 类型 `string[]`
- 默认 ''

Html 模板注入的 css

### html.template

- 类型 `string`
- 默认 ''

Html 模板路径，支持 https

### html.templateFormat

- 类型 `function`
- 默认 ''

Html 模板内容替换
