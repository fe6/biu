/** @format */

const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    html: {
      title: 'HTML LINK APP',
      // 远程的 HTML template 的配置
      template: 'https://ecdn.evente.cn/biu/temp/biu-html-template.html',
      // 可以修改 template 返回内容
      templateFormat: (code, webpackConfig) => {
        return code.replace(
          '{{title}}',
          webpackConfig.htmlWebpackPlugin.options.title,
        );
      },
    },
  };
});
