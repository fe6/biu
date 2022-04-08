<!-- @format -->

# vue-base

带共享功能的基座项目，用于存储公共组件以及公共方法。

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
