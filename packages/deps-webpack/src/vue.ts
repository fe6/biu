/** @format */

import WPChain from '../compiled/webpack-5-chain';

export const vueLoader = (wpChain: WPChain) => {
  wpChain.module
    .rule('vue-loader')
    .test(/\.vue$/)
    .use('vue-loader')
    .loader(require.resolve('../compiled/vue-loader'))
    .options({
      compilerOptions: {
        isCustomElement: (tag: string) => tag.startsWith('iconpark-'),
      },
    });

  wpChain
    .plugin('vue-loader-plugin')
    .use(require('../compiled/vue-loader').VueLoaderPlugin, []);

  const svgRule = wpChain.module.rule('svg');
  svgRule.uses.clear();
  svgRule
    .oneOf('component')
    .resourceQuery(/component/)
    .use('vue-loader')
    .loader(require.resolve('../compiled/vue-loader'))
    .end()
    .end()
    .oneOf('external')
    .set('type', 'asset/resource');
};
