/** @format */

import MiniCssExtractPlugin from '@fe6/biu-utils/compiled/mini-css-extract-plugin';
import CssMinimizerPlugin from '@fe6/biu-utils/compiled/css-minimizer-webpack-plugin';
import store from '../shared/cache';
import wpChain from '../shared/wp-chain';
//
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
const lessRegex = /\.less$/;
const lessModuleRegex = /\.module\.less$/;
//
class WPCss {
  splitCss = true;
  isDev = true;
  localIdentName = '';
  isModules = false;
  constructor() {}
  async setup() {
    this.isDev = store.config.mode === 'development';
    this.splitCss = store.config.splitCss;
    this.localIdentName = this.isDev
      ? '[path][name]-[local]-[hash:base64:5]'
      : '[local]-[hash:base64:5]';
    //
    this.setCssConfig();
    this.setCssMinify();
  }
  private setCssConfig() {
    //
    const config = {
      module: {
        rule: {
          css: {
            test: cssRegex,
            exclude: cssModuleRegex,
            use: this.loaders(),
          },
          cssModule: {
            test: cssModuleRegex,
            use: this.loaders(true),
          },
          sassModule: {
            test: sassModuleRegex,
            use: this.loaders(true, 'sass'),
          },
          sass: {
            test: sassRegex,
            exclude: sassModuleRegex,
            use: this.loaders(false, 'sass'),
          },
          less: {
            test: lessRegex,
            exclude: lessModuleRegex,
            use: this.loaders(false, 'less'),
          },
          lessModule: {
            test: lessModuleRegex,
            use: this.loaders(true, 'less'),
          },
        },
      },
    };
    wpChain.merge(config);
  }
  private setCssMinify() {
    //[css minify]
    if (this.isMiniCss) {
      if (store.config.build.minify === true) {
        wpChain.optimization
          .minimizer('CssMinimizerPlugin')
          .use(CssMinimizerPlugin, [
            {
              parallel: true,
              minimizerOptions: {
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true },
                  },
                ],
              },
              minify: [CssMinimizerPlugin.cleanCssMinify] as any,
            },
          ]);
      }

      const staticDir = store.config.build.staticDir
        ? `${store.config.build.staticDir}/`
        : '';

      wpChain.plugin('MiniCssExtractPlugin').use(MiniCssExtractPlugin, [
        {
          ignoreOrder: true,
          filename: `${staticDir}css/[name].[contenthash:8].css`,
          chunkFilename: `${staticDir}css/[name].[contenthash:8].chunk.css`,
          /**
            experimentalUseImportModule
            https://github.com/webpack-contrib/mini-css-extract-plugin#experimentalUseImportModule
            Use an experimental webpack API to execute modules instead of child compilers.
            This improves performance and memory usage a lot, but isn't as stable as the normal approach.
            When combined with experiments.layers, this adds a layer option to the loader options to specify the layer of the css execution.
            You need to have at least webpack 5.33.2.
           */
          // experimentalUseImportModule: true,
        },
      ]);
    }
  }
  get isStyleLoader() {
    const { splitCss, isDev } = this;
    if (!splitCss) return true;
    if (isDev) return true;
    return false;
  }
  get isMiniCss() {
    const { splitCss, isDev } = this;
    if (splitCss && !isDev) return true;
    return false;
  }
  get style() {
    const options = store.config.base ? { publicPath: store.config.base } : {}; //修复css 绝对路径的问题[改进项]
    return this.isStyleLoader
      ? {
          loader: require.resolve('@fe6/biu-utils/compiled/style-loader'),
          options: {},
        }
      : {
          loader: MiniCssExtractPlugin.loader,
          options,
        };
  }
  get css() {
    const { localIdentName, isModules } = this;
    return {
      loader: require.resolve('@fe6/biu-utils/compiled/css-loader'),
      options: {
        modules: isModules ? { localIdentName } : isModules,
      },
    };
  }
  get sass() {
    const { isDev } = this;
    return {
      loader: require.resolve('@fe6/biu-utils/compiled/sass-loader'),
      options: {
        implementation: require('@fe6/biu-utils/compiled/sass'),
        sourceMap: isDev,
      },
    };
  }
  get less() {
    const { isModules } = this;
    return isModules
      ? { loader: require.resolve('@fe6/biu-utils/compiled/less-loader') }
      : {
          loader: require.resolve('@fe6/biu-utils/compiled/less-loader'),
          options: {
            lessOptions: { javascriptEnabled: true },
          },
        };
  }
  get postcss() {
    return {
      loader: require.resolve('@fe6/biu-utils/compiled/postcss-loader'),
      options: {
        postcssOptions: {
          hideNothingWarning: true,
        },
      },
    };
  }
  loaders(isModules = false, parser?: 'sass' | 'less') {
    this.isModules = isModules;
    const { style, css, postcss, sass, less } = this;
    const opt: any = {
      style,
      css,
      postcss,
    };
    if (parser && parser === 'sass') {
      opt.sass = sass;
    } else if (parser && parser === 'less') {
      opt.less = less;
    }
    return opt;
  }
}
//
export default WPCss;
