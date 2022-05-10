<!-- @format -->

# Vue 项目使用 vue-base

在真正的业务场景项目中使用基座项目 ( vue-base ) 。

## 配置

```js
// .biurc.js
const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    biuShare: {
      name: 'vueProject',
      remotes: {
        '@vueBase': 'vueBase@http://localhost:1900/biu.js',
      },
    },
  };
});
```

## 生成 demos/vue-project/src/biuShareTypes/@vueBase.d.ts

运行 **demos/vue-base** 中的 `npm start` ，然后运行 `pnpm dts` 即可。
