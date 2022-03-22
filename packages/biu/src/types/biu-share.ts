/** @format */

import { TBiuConfig } from '../config/types';
import { TMFOptions } from './module-federation';

export type TBiushareLibItem = {
  [module: string]:
    | {
        entry: string;
        global?: string;
        type?: 'js' | 'css';
      }
    | string
    | string[];
};
export type TBiuShare = TMFOptions & {
  /**
   * biu 基于库共享模块
   */
  shareLib?: TBiushareLibItem;
};
export type TBiuShareFunc = (
  config: TBiuConfig,
) => TBiuShare | Promise<TBiuShare>;
export type TBiuShareExport = TBiuShare | TBiuShareFunc;
