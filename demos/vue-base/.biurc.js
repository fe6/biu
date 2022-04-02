/** @format */

const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    server: {
      port: 1900,
    },
    build: { target: 'es5' },
    biuShare: {
      name: 'vueBase',
      exposes: {
        '.': './src/exposes/index',
      },
    },
  };
});
