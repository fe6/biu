<!-- @format -->

# Vue 项目使用 vue-base

在真正的业务场景项目中使用基座项目 ( vue-base ) 。

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
