/** @format */

const { defineConfig, biuStore } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    entries: {
      'index.ts': {
        title: '首页',
        template: 'src/index.html',
      },
      'one/index.ts': {
        title: '作品',
        template: 'src/one/one.html',
      },
      'two/index.ts': {
        title: '介绍',
        template: 'src/two/two.html',
      },
    },
  };
});
