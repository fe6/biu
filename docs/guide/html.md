<!-- @format -->

# HTML 配置 {#html-config}

## 简单配置 HTML 文件 {#html-simple-config}

只需要把待使用的 `index.html` 文件放到 `<root>/src/` 中即可。[DEMO](https://github.com/fe6/biu/blob/master/demos/html/src/index.html)

## 配置模板路径 {#html-template-config}

正常业务情况，有可能模板需要单独配置，进行一些特殊处理。`html.template` 即可支持绝对路径配置，也支持相对路径配置。

```js
const { defineConfig, biuStore } = require('@fe6/biu');
module.exports = defineConfig(() => {
  return {
    html: {
      // 这个就是读取的是 /index.html
      template: biuStore.resolve('index.html'),
    },
  };
});
```
