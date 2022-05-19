<!-- @format -->

# Typescript {#typescript}

## tsconfig.json 配置 {#typescript-config}

- `@fe6/biu` 集成了 `@fe6/biu-tsconfig` 与 `Css Module 提示`
- 集成了 emp 内置的资源 TS 类型
- 设置方式如下:

```json
{
  "extends": "@fe6/biu/biu-tsconfig.json",
  "include": ["src"],
  "exclude": ["node_modules"],
  "compilerOptions": {
    "types": ["@fe6/biu/app"],
    "baseUrl": "."
  }
}
```

## 类型生成 {#typescript-render}

在`biu build`下，如果是 ts 开发，会根据 `expose` <b>自动</b>生成相应的 `d.ts` 到 `dist/biu-share-types` 里面。

```js
biuShare: {
  name: 'vueBase',
  exposes: {
    './Content': './src/components/Content',
    '.': './src/exposes/index',
  },
},
```

## 类型同步 {#typescript-sync}

`biu dts` 会<b>自动</b>根据 `biuShare.remote` 配置生成相应文件到 `src/biu-share-types` 如:

```js
biuShare: {
  name: 'vueProject',
  remotes: {
    '@vueBase': 'vueBase@http://localhost:1900/biu.js',
  },
},
```
