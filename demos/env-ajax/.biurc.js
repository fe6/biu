/** @format */

const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    envDir: [
      (env) => {
        // 目前只支持 json 格式
        return `https://ecdn.evente.cn/biu/envs/${env}.json`;
      },
      './envs',
    ],
  };
});
