import webpack = require('@fe6/biu-deps-webpack/compiled/webpack');
declare class VueLoaderPlugin implements webpack.Plugin {
    static NS: string;
    apply(compiler: webpack.Compiler): void;
}
declare let Plugin: typeof VueLoaderPlugin;
export default Plugin;
