/** @format */

import path from 'path';
import ts from 'typescript';
import { logger } from '@fe6/biu-utils';
import fs from '@fe6/biu-deps/compiled/fs-extra';
import { TRquireBuildOptions } from '../config/options/build';
import { TMFOptions } from '../types/module-federation';
import store from '../shared/cache';
import { TConfigResolveAlias } from '../types';
import { getTSConfig } from './get-ts-config';
import { getTSService } from './get-ts-service';
import {
  transformExposesPath,
  transformImportExposesPath,
  transformLibName,
  transformPathImport,
} from './transform';
import { TYPES_OUT_DIR, TYPES_BIU_NAME } from '../contant';
//
export type DTSTLoadertype = {
  mf?: TMFOptions;
  needClear?: boolean;
};
type CodeObjType = {
  code: string;
  key: string[];
};
class DTSEmitFile {
  build?: TRquireBuildOptions;
  mf?: TMFOptions;
  outDir: string;
  languageService: ts.LanguageService;
  lib: CodeObjType = { code: '', key: [] };
  tsconfig: ts.CompilerOptions;
  biuFilename = '';
  typesOutDir = '';
  typesBiuName = '';
  // TODO Lib
  // libFilename = '';
  constructor() {
    this.tsconfig = getTSConfig(store.root) || {};
    this.typesOutDir = store.config?.ts?.typesOutDir || TYPES_OUT_DIR;
    this.typesBiuName = store.config?.ts?.typesBiuName || TYPES_BIU_NAME;
    this.outDir = path.resolve(store.root, this.typesOutDir);
    this.tsconfig = {
      ...this.tsconfig,
      declaration: true,
      emitDeclarationOnly: true,
      //
      outDir: this.outDir,
      rootDir: store.root,
      // baseUrl: store.config.appSrc,
    };
    this.languageService = getTSService(this.tsconfig, store.root);
  }
  setup({ mf, needClear }: DTSTLoadertype) {
    this.mf = mf;
    const outDir = path.resolve(store.root, this.typesOutDir);
    if (outDir != this.outDir) {
      this.outDir = outDir;
      this.tsconfig.outDir = outDir;
      this.languageService = getTSService(this.tsconfig, store.root);
    }
    needClear && fs.removeSync(this.outDir);
  }
  emit(filename: string, alias: TConfigResolveAlias, typesOutDir: string) {
    const output = this.languageService.getEmitOutput(filename);
    try {
      if (!output.emitSkipped) {
        output.outputFiles.forEach((o) => {
          if (o.name.endsWith('.d.ts')) {
            this.genCode(o, alias, typesOutDir);
          }
        });
      }
    } catch (e) {
      logger.warn(filename, e);
    }
  }
  createFile(appSrc: string) {
    fs.ensureDirSync(this.outDir);

    // TODO Lib
    // if (this.build.lib) {
    //   const libModName = this.build.lib.name || store.pkg.name
    //   let libCode = this.lib.code
    //   libCode = transformLibName(libModName, libCode)
    //   this.libFilename = path.resolve(this.outDir, this.build.typesLibName)
    //   fs.writeFileSync(this.libFilename, libCode, 'utf8')
    // }
    if (this.mf?.exposes) {
      const biuModName = this.mf.name || '';
      let biuCode = this.lib.code;
      biuCode = transformLibName(appSrc, biuModName, biuCode);
      const theExposes = new RegExp(`${biuModName}/exposes`, 'g');
      biuCode = biuCode.replace(theExposes, biuModName);
      this.biuFilename = path.resolve(this.outDir, this.typesBiuName);
      fs.writeFileSync(this.biuFilename, biuCode, 'utf8');
    }
    this.destroy();
  }

  genCode(o: ts.OutputFile, alias: TConfigResolveAlias, typesOutDir: string) {
    if (!this.lib.key.includes(o.name)) {
      let mod = o.name.split(`/${this.typesOutDir}/`)[1].replace('.d.ts', '');
      if (mod.endsWith('/index')) {
        mod = mod.replace('/index', '');
      }
      o.text = transformPathImport(o, alias, typesOutDir);
      const warpDeclareModuleResult = this.warpDeclareModule(mod, o.text);
      this.lib.code = this.lib.code + warpDeclareModuleResult.code;
      this.lib.code = transformImportExposesPath(
        this.lib.code,
        mod,
        warpDeclareModuleResult.exposeName,
      );
      this.lib.key.push(o.name);
    }
  }
  warpDeclareModule(module: string, code: string) {
    code = code.replace(/declare/g, '');
    const { newModule, isExpose } = transformExposesPath(module, this.mf);
    return {
      code: `declare module '${newModule}' {\r\n${code}}\r\n`,
      exposeName: isExpose ? newModule : '',
    };
  }
  destroy() {
    this.lib = { code: '', key: [] };
  }
}
export default DTSEmitFile;
