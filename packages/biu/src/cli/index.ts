/** @format */

import fs from 'fs';
import path from 'path';
import { logger } from '@fe6/biu-utils';
import { Command } from '@fe6/biu-deps';
import { ENUM_ENV } from '../types';
import biuExec from './core';

export const run = () => {
  const pkg = fs.readFileSync(
    path.resolve(__filename, '../../../package.json'),
    'utf-8',
  );
  const biuVersion = JSON.parse(pkg).version;

  const program = new Command();

  // 版本 biu --version | biu -v
  const vContent = `${logger.prefixes.info('version')} ${biuVersion}\n`;
  program.version(vContent, '-v, --version').usage('<command> [options]');

  // TODO 初始化项目 biu init

  // TODO 开发 biu dev
  program
    .command('dev')
    .description('Dev 模式')
    .option('-e, --env <env>', '部署环境 dev、test、prod')
    // .argument('[seconds]', 'how long to delay', '1')
    .action(async (options) => {
      logger.ready(options);
      // await new Promise(resolve => setTimeout(resolve, parseInt(waitSeconds) * 1000));
      // logger.ready(1111, options.message);
      biuExec('dev', ENUM_ENV['development'], options);
    });

  // TODO 打包 biu build

  // TODO 环境测试 biu serve

  // TODO 拉取远程类型文件 ( d.ts ) biu dts

  // 执行命令
  program.parse(process.argv);

  if (!program.args.length) {
    program.help();
  }
};
