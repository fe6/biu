/** @format */

const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    server: {
      port: 1901,
    },
    build: { target: 'es5' },
    biuShare: {
      name: 'vueProject',
      remotes: {
        '@vueBase': 'vueBase@http://localhost:1900/biu.js',
      },
    },
  };
});
