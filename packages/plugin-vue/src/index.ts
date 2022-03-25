/** @format */

// fork from https://github.com/efoxTeam/emp/blob/next/packages/plugin-babel-vue-3/src/index.ts
import type { TConfigPluginOptions } from '@fe6/biu';
import { vueLoader } from '@fe6/biu-deps';
import { babelLoader } from '@fe6/biu-deps-babel';
import { ProvidePlugin } from '@fe6/biu-deps/compiled/webpack';

const babelOptions = {
  exclude: [/compiled[\\/]/],
  presets: [
    [
      require.resolve('@fe6/biu-deps-babel/compiled/babel/preset-env'),
      {
        useBuiltIns: 'entry',
        debug: false,
        corejs: 3,
        loose: true,
      },
    ],
    [
      require.resolve('@fe6/biu-deps-babel/compiled/babel/preset-typescript'),
      {
        isTSX: true, // allExtensions依赖isTSX  https://babeljs.io/docs/en/babel-preset-typescript#allextensions
        allExtensions: true, // 支持所有文件扩展名
      },
    ],
  ],
  plugins: [
    [
      require.resolve(
        '@fe6/biu-deps-babel/compiled/babel/plugin-transform-runtime',
      ),
      {
        corejs: false,
        helpers: true,
        version: '7.17.2',
        regenerator: true,
        useESModules: false,
        // absoluteRuntime: true,
      },
    ],
    [
      require.resolve('@fe6/biu-deps-babel/compiled/@vue/babel-plugin-jsx'),
      { optimize: true },
    ],
    // vue-loader can not auto import `Vue`
    new ProvidePlugin({
      Vue: 'vue',
    }),
  ],
  overrides: [],
};

const pluginVue = ({ wpChain }: TConfigPluginOptions): void => {
  wpChain.resolve.alias.set('vue', '@vue/runtime-dom');
  wpChain.resolve.alias.set('vue$', 'vue/dist/vue.esm-bundler.js');
  wpChain.module.rule('scripts').uses.clear();

  // wpChain.module
  //   .rule('scripts')
  //   .use('babel-loader')
  //   .loader(require.resolve('@fe6/biu-deps-babel/compiled/babel-loader'))
  //   .options(babelOptions);
  babelLoader(wpChain, babelOptions);
  vueLoader(wpChain);

  // wpChain.module
  //   .rule('vue-loader')
  //   .test(/\.vue$/)
  //   .use('vue-loader')
  //   .loader(require.resolve('@fe6/biu-deps/compiled/vue-loader'))
  //   .options({
  //     compilerOptions: {
  //       isCustomElement: (tag: string) => tag.startsWith('iconpark-'),
  //     },
  //   });

  // wpChain
  //   .plugin('vue-loader-plugin')
  //   .use(require('@fe6/biu-deps/compiled/vue-loader').VueLoaderPlugin, []);

  // const svgRule = wpChain.module.rule('svg');
  // svgRule.uses.clear();
  // svgRule
  //   .oneOf('component')
  //   .resourceQuery(/component/)
  //   .use('vue-loader')
  //   .loader(require.resolve('@fe6/biu-deps/compiled/vue-loader'))
  //   .end()
  //   .end()
  //   .oneOf('external')
  //   .set('type', 'asset/resource');
};

export default pluginVue;
module.exports = pluginVue;
