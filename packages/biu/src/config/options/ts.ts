/** @format */

import { TOverride } from '../../types';
import { TYPES_OUT_DIR, TYPES_BIU_NAME } from '../../contant';

export type TTsOptions = {
  // 是否生成 d.ts 文件
  dts?: boolean;
  // '对应 remotes 里的项目名' : '.dts 文件的远程路径'
  dtsPath?: { [key: string]: string };
  typesOutDir?: string;
  typesBiuName?: string;
};
export type TRquireTsOptions = TOverride<
  Required<TTsOptions>,
  {
    // 是否生成 d.ts 文件
    dts?: boolean;
    // '对应 remotes 里的项目名' : '.dts 文件的远程路径'
    dtsPath?: { [key: string]: string };
    typesOutDir?: string;
    typesBiuName?: string;
  }
>;
export const initTs = (op?: TTsOptions): TRquireTsOptions => {
  return {
    ...{
      dts: false,
      dtsPath: {},
      typesOutDir: TYPES_OUT_DIR,
      typesBiuName: TYPES_BIU_NAME,
    },
    ...op,
  };
};
