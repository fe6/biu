<!-- @format -->

# vue-base

带共享功能的基座项目，用于存储公共组件以及公共方法。

## 配置共享代码

```js
// .biurc.js
const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    biuShare: {
      name: 'vueBase',
      exposes: {
        '.': './src/exposes/index',
      },
    },
  };
});
```

## 配置生成共享代码的 .d.ts 文件

```js
// .biurc.js
const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    ts: {
      // 自动生成 biuShare 中 vueBase 的 index.d.ts 文件
      // 访问路径: http://localhost:1900/biu-share-types/index.d.ts
      dts: true,
    },
  };
});
```
