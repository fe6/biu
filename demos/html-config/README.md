<!-- @format -->

# HTML 定制

HTML 模板默认 `src/index.html` 路径基于当前项目根目录，如果未找到，会默认读取 `@fe6/biu/template/index.html` 。

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
