/** @format */

import wpChain from '../shared/wp-chain';
import store from '../shared/cache';

class WPFile {
  constructor() {}
  async setup() {
    const config = {
      module: {
        rule: {
          svg: {
            test: /\.svg$/,
            type: 'asset/resource',
          },
          image: {
            test: /\.(png|jpe?g|gif|webp|ico)$/i,
            type: 'asset/resource',
          },
          fonts: {
            test: /\.(|otf|ttf|eot|woff|woff2)$/i,
            type: 'asset/resource',
          },
          inline: {
            resourceQuery: /inline/,
            type: 'asset/inline',
          },
          //解决 svga 解析失败问题
          svga: {
            test: /\.(svga)$/i,
            type: 'asset/resource',
          },
        },
      },
    };
    wpChain.merge(config);
  }
}
export default WPFile;
