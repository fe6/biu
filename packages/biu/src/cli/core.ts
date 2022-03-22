/** @format */

import { ENUM_ENV, TCmdOptions } from '../types';
import biuCache from '../shared/cache';

const biuExec = async (
  name: string,
  mode: ENUM_ENV,
  cmdOptions: TCmdOptions,
): Promise<void> => {
  // 全局变量实例化 cache & config
  biuCache.setup(mode, cmdOptions);
};

export default biuExec;
