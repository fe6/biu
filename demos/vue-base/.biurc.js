/** @format */

const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    server: {
      port: 1900,
    },
    build: { target: 'es5' },
    ts: {
      // 自动生成 biuShare 中 vueBase 的 index.d.ts 文件
      // 访问路径: http://localhost:1900/biu-share-types/index.d.ts
      dts: true,
    },
    biuShare: {
      name: 'vueBase',
      exposes: {
        '.': './src/exposes/index',
      },
    },
  };
});
