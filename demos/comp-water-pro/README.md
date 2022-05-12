<!-- @format -->

# Water Pro 组件库

```js
// .biurc.js
const { defineConfig } = require('@fe6/biu');
// @fe6/nvcr 需要自行安装
const Components = require('unplugin-vue-components/webpack');
// @fe6/nvcr 需要自行安装
const { WaterProResolver } = require('@fe6/nvcr');

module.exports = defineConfig(() => {
  return {
    biuShare: () => {
      return new Promise((resolve) => {
        resolve({
          shareLib: {
            vue: 'Vue@https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.min.js',
            dayjs:
              'dayjs@https://cdn.jsdelivr.net/npm/dayjs@1.11.0/dayjs.min.js',
            '@fe6/water-pro':
              'water@https://cdn.jsdelivr.net/npm/@fe6/water-pro@4.7.0/dist/water.min.js',
          },
        });
      });
    },
    webpackChain(chain) {
      // 配置按需加载，可不用全局引入，每个文件按需引入
      // 若直接使用 Modal.confirm 等函数，需要引入对应的 less 样式文件，如 @import '@fe6/water-pro/lib/modal/style/index.less';
      chain.plugin('components').use(
        Components({
          resolvers: [
            WaterProResolver({
              importStyle: 'less',
            }),
          ],
        }),
      );
    },
  };
});
```

## 引入组件库样式

```js
html: {
  files: {
    css: ['https://unpkg.com/@fe6/water-pro@4.11.2/dist/water.min.css'],
  }
},
```
