<!-- @format -->

# Biu dts plugin

Fork from https://github.com/efoxTeam/emp/blob/next/packages/emp/src/dts/index.ts

## 功能

- 实现 相对路径转换
- 实现 映射路径转换 `src` or `@` 等

## 配置

### 库模式

> 暂缓支持

```js
const { defineConfig } = require('@efox/emp');
const path = require('path');
module.exports = defineConfig({
  build: {
    lib: {
      name: 'emp-lib',
      entry: './src/index.ts',
      formats: ['umd', 'esm'],
    },
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'), //根据 映射进行匹配转换成 build.lib.name or pkg.name
    },
  },
});
```
