/** @format */

import { container as webpackContainer } from '@fe6/biu-deps/compiled/webpack';
import { TConfig } from '../config';
export type TMFOptions = ConstructorParameters<
  typeof webpackContainer.ModuleFederationPlugin
>[0];
type TMFFunction = (o: TConfig) => TMFOptions | Promise<TMFOptions>;
export type TMFExport = TMFOptions | TMFFunction;
