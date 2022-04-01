/** @format */

const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(() => {
  return {
    biuShare: () => {
      return new Promise((resolve) => {
        resolve({
          shareLib: {
            vue: 'Vue@https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.min.js',
          },
        });
      });
    },
  };
});
