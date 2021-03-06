/** @format */

import webpack from '@fe6/biu-deps-webpack/compiled/webpack';
import { TRquireBuildOptions } from '../../config/options/build';
import {
  TransformConfig,
  Options,
  JscConfig,
  transformSync,
  transform,
} from '@swc/core';
import store from '../../shared/cache';
const isDev = store.config.mode === 'development';

class SWCOpt {
  isTypescript = false;
  isReact = false;
  resetType(isTypescript: boolean, isReact: boolean) {
    this.isReact = isReact;
    this.isTypescript = isTypescript;
  }
  get parser(): JscConfig['parser'] {
    if (this.isTypescript) {
      return {
        syntax: 'typescript',
        tsx: store.config.build.jsToJsx || this.isReact,
        decorators: true,
        dynamicImport: true, //
      };
    }
    return {
      syntax: 'ecmascript',
      jsx: store.config.build.jsToJsx || this.isReact,
      decorators: true,
      decoratorsBeforeExport: false,
    };
  }
  get react(): TransformConfig['react'] {
    return this.isReact
      ? {
          runtime: store.config.reactRuntime || 'classic',
          refresh: isDev,
          development: isDev,
          useBuiltins: false,
        }
      : undefined;
  }
}
const swcOpt = new SWCOpt();
/**
 * SWCLoader
 * @param this
 * @param source
 */
async function SWCLoader(
  this: webpack.LoaderContext<TRquireBuildOptions>,
  source: string,
  // inputSourceMap: true,
) {
  const done = this.async();
  const options = this.getOptions();
  const build = options;
  //
  const isESM = !['es3', 'es5'].includes(build.target);
  //
  let isTypescript = ['.ts', '.tsx'].some((p) => this.resourcePath.endsWith(p));
  let isReact = ['.jsx', '.tsx', '.svg'].some((p) =>
    this.resourcePath.endsWith(p),
  );
  const isVue = this.resourcePath.endsWith('.vue');
  if (isVue) {
    isTypescript = true;
    isReact = false;
  }
  swcOpt.resetType(isTypescript, isReact);
  const { parser, react } = swcOpt;
  const swcOptions: Options = {
    sourceFileName: this.resourcePath,
    sourceMaps: this.sourceMap,
    jsc: {
      target: build.target,
      externalHelpers: false,
      loose: true,
      parser,
      transform: {
        legacyDecorator: true,
        decoratorMetadata: isTypescript,
        react,
      },
    },
  };

  if (!isESM) {
    /**
     * regenerator
     */
    if (swcOptions.jsc) {
      const jscTransform: any = {
        regenerator: {
          importPath: require.resolve(
            '@fe6/biu-deps/compiled/regenerator-runtime',
          ),
        },
      };
      swcOptions.jsc.transform = {
        ...swcOptions.jsc.transform,
        ...jscTransform,
      };
    }
    /**
     * wait update
     * https://github.com/swc-project/swc/issues/2209
     */
    // swcOptions.env = {
    //   mode: 'usage',
    //   coreJs: '3',
    //   debug: true,
    //   dynamicImport: true,
    //   targets: {
    //     chrome: '58',
    //     ie: '11',
    //   },
    // }
  }
  //
  try {
    const { code, map } = build.sync
      ? transformSync(source, swcOptions)
      : await transform(source, swcOptions);
    done(null, code, map && JSON.parse(map));
  } catch (e) {
    done(e as Error);
  }
}
export default SWCLoader;
