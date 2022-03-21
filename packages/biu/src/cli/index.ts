/** @format */

import fs from 'fs';
import path from 'path';
import { logger } from '@fe6/biu-utils';
import { Command } from '../../compiled/commander';

export const run = () => {
  const pkg = fs.readFileSync(
    path.resolve(__filename, '../../../package.json'),
    'utf-8',
  );

  const program = new Command();

  // 版本 biu --version | biu -v
  const vContent = `${logger.prefixes.info('version')} ${
    JSON.parse(pkg).version
  }\n`;
  program.version(vContent, '-v, --version').usage('<command> [options]');

  // TODO 初始化项目 biu init

  // TODO 开发 biu dev

  // TODO 打包 biu build

  // TODO 环境测试 biu serve

  // TODO 拉取远程类型文件 ( d.ts ) biu dts

  // 执行命令
  program.parse(process.argv);

  if (!program.args.length) {
    program.help();
  }
};
