/** @format */

import path from 'path';
import fetch from '@fe6/biu-deps/compiled/node-fetch';
import fs from '@fe6/biu-deps/compiled/fs-extra';
import ora from '@fe6/biu-deps/compiled/ora';
import chalk from '@fe6/biu-deps/compiled/chalk';
import { logger } from '@fe6/biu-utils';

import store from '../shared/cache';
import { TYPES_OUT_DIR, TYPES_BIU_NAME } from '../contant';

const spinner = ora();

class Dts {
  /**
   * 创建目录
   * @param {*} filePath
   */
  dirCache: any = {};
  mkdir(filePath: string) {
    const arr = filePath.split(path.sep);
    let dir = arr[0];
    for (let i = 1; i < arr.length; i++) {
      if (!this.dirCache[dir] && !fs.existsSync(dir) && dir !== '') {
        this.dirCache[dir] = true;
        fs.mkdirSync(dir);
      }
      dir = dir + '/' + arr[i];
    }
    fs.writeFileSync(filePath, '');
  }

  async downloadFileAsync(
    uri: string,
    filePath: string,
    fileName: string,
    alias: string,
    baseName: string,
  ) {
    try {
      let originData = '';

      spinner.text = `${fileName}\n`;

      const res = await fetch(uri);
      originData = await res.text();

      if (originData.indexOf('declare') === -1) {
        spinner.stop();
        logger.error(`${fileName} 未找到`);
      }

      let newCode = '';
      // 替换 remote 别名
      const regSingleQuote = new RegExp(`'${baseName}`, 'g');
      const regDoubleQuote = new RegExp(`"${baseName}`, 'g');
      newCode = originData.replace(regSingleQuote, `'${alias}`);
      newCode = newCode.replace(regDoubleQuote, `"${alias}`);
      await fs.ensureDir(filePath);
      const fullPath = path.resolve(filePath, fileName);
      this.mkdir(fullPath);
      fs.writeFileSync(fullPath, newCode, 'utf8');
      spinner.succeed(
        `${logger.prefixes.ready('success')} ${fileName} 已完成\n`,
      );
    } catch (error) {
      spinner.stop();
      logger.error(`${fileName} 未找到。`);
      logger.warn(`请检查 ${chalk.blue(uri)} 是否能访问！`);
    }
  }
  /**
   * 下载 remote 的 d.ts
   */
  async downloadDts() {
    const remotes = store.biuShare.moduleFederation.remotes;
    if (remotes) {
      for (const [key, value] of Object.entries(remotes)) {
        if (key && value) {
          const splitIndex = value.indexOf('@');
          if (splitIndex === -1) {
            spinner.stop();
            logger.error(`无效 remotes 地址: ${value}`);
          }
          const baseName = value.substr(0, splitIndex);
          let baseUrl = value.substr(splitIndex + 1);
          baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf('/'));
          const { outDir } = store.config.build;
          const { typesOutDir, typesBiuName } = store.config.ts;
          const defaultDtsUrl = `${baseUrl}/${(
            typesOutDir || TYPES_OUT_DIR
          ).replace(`${outDir}/`, '')}/${typesBiuName || TYPES_BIU_NAME}`;
          //可以独立设置 dtsPath，默认路径是 typesOutDir
          const dtsPath = store.config.ts.dtsPath;
          const dtsUrl = dtsPath?.[key] ? dtsPath[key] : defaultDtsUrl;
          await this.downloadFileAsync(
            dtsUrl,
            store.config.ts.typingsPath ||
              path.resolve('src', 'biu-share-types'),
            `${key}.d.ts`,
            key,
            baseName,
          );
        }
      }
    } else {
      spinner.stop();
      logger.error('未找到 remotes 参数配置');
    }
  }

  async setup() {
    spinner.start(`${logger.prefixes.ready()} 开始生成~`);
    await this.downloadDts();
  }
}

export default new Dts();
