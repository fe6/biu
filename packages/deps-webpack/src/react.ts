/** @format */

import WPChain from '../compiled/webpack-5-chain';
export const reactRefresh = (wpChain: WPChain) => {
  wpChain
    .plugin('reactRefresh')
    .use(require('@pmmmwh/react-refresh-webpack-plugin'), [
      {
        overlay: false,
      },
    ]);
};
