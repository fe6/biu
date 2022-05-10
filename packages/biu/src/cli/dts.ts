/** @format */

import fetch from 'node-fetch';
import path from 'path';
import fs from '@fe6/biu-deps/compiled/fs-extra';
import { logger } from '@fe6/biu-utils';
import store from '../shared/cache';
import { TYPES_OUT_DIR, TYPES_BIU_NAME } from '../contant';
// import {createSpinner} from 'nanospinner'

// const spinner = createSpinner().start()
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
      // logger.info(`[download ${fileName}]:${uri}`)
      // spinner.start({text: `[download ${fileName}]:${uri}\n`})
      const res = await fetch(uri);
      originData = await res.text();

      if (originData.indexOf('declare') === -1) {
        // spinner.error({text: `[download ${fileName}]:${uri} not found`})
        return;
      }

      let newData = '';
      // 替换 remote 别名
      console.log(baseName, alias, 'baseName');
      const regSingleQuote = new RegExp(`'${baseName}`, 'g');
      const regDoubleQuote = new RegExp(`"${baseName}`, 'g');
      newData = originData.replace(regSingleQuote, `'${alias}`);
      newData = newData.replace(regDoubleQuote, `"${alias}`);
      await fs.ensureDir(filePath);
      const fullPath = path.resolve(filePath, fileName);
      this.mkdir(fullPath);
      fs.writeFileSync(fullPath, newData, 'utf8');
      // spinner.success({text: `[download ${fileName}]:${uri} finish`})
      // process.exit()
    } catch (error) {
      // logger.error(error)
      // spinner.error({text: `[download ${fileName}]:${uri} not found`})
      // logger.error(`${uri} --> network error`)
      // process.exit()
    }
  }
  /**
   * 下载 remote 的 d.ts
   */
  async downloadDts() {
    const remotes = store.biuShare.moduleFederation.remotes;
    const dtsPath = store.config.ts.dtsPath;
    console.log(remotes, 'remotes');
    if (remotes) {
      for (const [key, value] of Object.entries(remotes)) {
        if (key && value) {
          const splitIndex = value.indexOf('@');
          if (splitIndex === -1)
            throw Error(`[emp dts] invaild remotes url: ${value}`);
          const baseName = value.substr(0, splitIndex);
          let baseUrl = value.substr(splitIndex + 1);
          baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf('/'));
          const { outDir } = store.config.build;
          const { typesOutDir, typesBiuName } = store.config.ts;
          const defaultDtsUrl = `${baseUrl}/${(
            typesOutDir || TYPES_OUT_DIR
          ).replace(`${outDir}/`, '')}/${typesBiuName || TYPES_BIU_NAME}`;
          //可以独立设置 dtsPath，默认路径是 typesOutDir
          const dtsUrl = dtsPath?.[key] ? dtsPath[key] : defaultDtsUrl;
          await this.downloadFileAsync(
            dtsUrl,
            store.config.typingsPath,
            `${key}.d.ts`,
            key,
            baseName,
          );
        }
      }
    } else {
      logger.error('未找到 remotes 参数配置');
    }
  }

  async setup() {
    await this.downloadDts();
  }
}
export default new Dts();
