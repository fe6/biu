/** @format */

import { ENUM_ENV, TCmdOptionsType } from '../types';
import biuCache from '../shared/cache';

const biuExec = async (
  name: string,
  mode: ENUM_ENV,
  cmdOptions: TCmdOptionsType,
): Promise<void> => {
  // 全局变量实例化 cache & config
  biuCache.setup(mode, cmdOptions);
};

export default biuExec;
