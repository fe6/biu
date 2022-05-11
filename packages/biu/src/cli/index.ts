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
    .option('-c, --config <config>', '设置配置文件')
    // .argument('[seconds]', 'how long to delay', '1')
    .action(async (options) => {
      logger.ready(options);
      // await new Promise(resolve => setTimeout(resolve, parseInt(waitSeconds) * 1000));
      // logger.ready(1111, options.message);
      biuExec('dev', ENUM_ENV['development'], options);
    });

  // TODO 打包 biu build
  program
    .command('build')
    .description('Build 模式')
    .option('-e, --env <env>', '部署环境 dev、test、prod')
    .option('-a, --analyze', '生成分析报告 默认为 false')
    .option('-t, --ts', '生成类型文件 默认为 false')
    .option('-ps, --progress <progress>', '显示进度 默认为 true')
    .option('-pr, --profile', '统计模块消耗')
    .option('-cl, --clearLog <clearLog>', '清空日志 默认为 true')
    .option(
      '-wl, --wplogger [filename]',
      '打印webpack配置 默认为 false,filename 为 输出webpack配置文件',
    )
    .action((options) => {
      biuExec('build', ENUM_ENV['production'], options);
    });

  // TODO 环境测试 biu serve

  // TODO 拉取远程类型文件 ( d.ts ) biu dts
  program
    .command('dts')
    .description('拉取 remote 项目的 d.ts')
    .option('-p, --typingsPath <typingsPath>', '下载目录')
    .option('-e, --env <env>', '部署环境 dev、test、prod')
    .action((options) => {
      biuExec('dts', 'none', options);
    });

  // 执行命令
  program.parse(process.argv);

  if (!program.args.length) {
    program.help();
  }
};
