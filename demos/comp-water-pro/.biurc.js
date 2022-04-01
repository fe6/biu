/** @format */

const { defineConfig } = require('@fe6/biu');
const Components = require('unplugin-vue-components/webpack');
const { WaterProResolver } = require('@fe6/nvcr');

module.exports = defineConfig(() => {
  return {
    biuShare: () => {
      return new Promise((resolve) => {
        resolve({
          shareLib: {
            vue: 'Vue@https://cdn.jsdelivr.net/npm/vue@3.2.31/dist/vue.global.min.js',
            dayjs:
              'dayjs@https://cdn.jsdelivr.net/npm/dayjs@1.11.0/dayjs.min.js',
            '@fe6/water-pro':
              'water@https://cdn.jsdelivr.net/npm/@fe6/water-pro@4.7.0/dist/water.min.js',
          },
        });
      });
    },
    webpackChain(chain) {
      chain.plugin('components').use(
        Components({
          resolvers: [
            WaterProResolver({
              importStyle: 'less',
            }),
          ],
        }),
      );
    },
  };
});
