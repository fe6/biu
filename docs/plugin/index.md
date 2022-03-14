<!-- @format -->

# 插件

:::tip 主要项
EMP v2 plugin 结合 webpack chain 提供对 webpack 自定义配置，详细类型 [[点击了解]](https://github.com/efoxTeam/emp/blob/26c89aa3fc5494f274a714b6b09844b66b5e1237/packages/emp/src/config/plugins.ts#L9)
:::

## 官方插件

### [@efox/emp/plugin-vue-2](https://github.com/efoxTeam/emp/tree/next/packages/plugin-vue-2)

- 提供 vue 2 编译支持

```js
const { defineConfig } = require('@efox/emp');
const vue = require('@efox/plugin-vue-2');
module.exports = defineConfig({
  plugins: [vue],
});
```

### [@efox/emp/plugin-babel-react](https://github.com/efoxTeam/emp/tree/next/packages/plugin-babel-react)

- 提供 react babel 编译支持

```js
const { defineConfig } = require('@efox/emp');
const babelReact = require('@efox/plugin-babel-react');
module.exports = defineConfig({
  plugins: [babelReact],
});
```
