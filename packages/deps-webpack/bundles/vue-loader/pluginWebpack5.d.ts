import type { Compiler, Plugin } from '@fe6/biu-deps-webpack/compiled/webpack';
declare class VueLoaderPlugin implements Plugin {
    static NS: string;
    apply(compiler: Compiler): void;
}
export default VueLoaderPlugin;
