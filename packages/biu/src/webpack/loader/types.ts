/** @format */

import type { ImportSpecifier } from '@fe6/biu-deps/compiled/es-module-lexer';
import type { TransformOptions } from '@fe6/biu-deps/compiled/esbuild';

export enum Mode {
  development = 'development',
  production = 'production',
}

export interface IEsbuildLoaderHandlerParams {
  code: string;
  filePath: string;
  imports: readonly ImportSpecifier[];
  exports: readonly string[];
}

export interface IEsbuildLoaderOpts extends Partial<TransformOptions> {
  handler?: Array<(opts: IEsbuildLoaderHandlerParams) => string>;
  implementation?: typeof import('@fe6/biu-deps/compiled/esbuild');
}
