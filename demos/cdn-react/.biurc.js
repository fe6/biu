/** @format */

const { defineConfig } = require('@fe6/biu');

module.exports = defineConfig(({ runDeps, mode }) => {
  return {
    biuShare: () => {
      return new Promise((resolve) => {
        const theType = mode === 'development' ? mode : `${mode}.min`;
        resolve({
          shareLib: {
            react: `React@https://cdn.jsdelivr.net/npm/react@${runDeps.react}/umd/react.${theType}.js`,
            'react-dom': `ReactDOM@https://cdn.jsdelivr.net/npm/react-dom@${runDeps.react}/umd/react-dom.${theType}.js`,
          },
        });
      });
    },
  };
});
