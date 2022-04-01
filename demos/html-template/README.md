<!-- @format -->

# HTML 定制

HTML 模板可设置 http(s) 的模板。

```js
// .biurc.js
const { defineConfig, biuStore } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    html: {
      // 通用标题设置
      title: 'THE HTML CONFIG APP',
      // NOTE 打开注释可自定义 index 的位置
      // template: biuStore.resolve('index.html'),
      favicon: 'https://objects.evente.cn/assets/brand/piaodada/logo-200.png',
      files: {
        // 注入 JavaScript
        js: ['https://ecdn.evente.cn/assets/js/captcha/captcha.js'],
        // 注入 CSS
        css: [
          'https://cdn.jsdelivr.net/npm/@fe6/water-pro@4.5.1/dist/water.min.css',
        ],
      },
    },
  };
});
```
