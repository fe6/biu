/** @format */

const { defineConfig, biuStore } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    html: {
      title: 'THE HTML URL APP',
      template: 'https://unpkg.com/@efox/emp@2.1.3/template/index.html',
    },
  };
});
