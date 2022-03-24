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
//
export type DTSTLoadertype = {
  build: TRquireBuildOptions;
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
  empFilename = '';
  libFilename = '';
  constructor() {
    this.tsconfig = getTSConfig(store.root) || {};
    this.outDir = path.resolve(store.root, 'dist/empShareTypes');
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
  setup({ build, mf, needClear }: DTSTLoadertype) {
    this.build = build;
    this.mf = mf;
    const outDir = path.resolve(store.root, build.typesOutDir);
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
  createFile() {
    if (!this.build) return;
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
      const empModName = this.mf.name || '';
      let empCode = this.lib.code;
      empCode = transformLibName(empModName, empCode);
      this.empFilename = path.resolve(this.outDir, this.build.typesBiuName);
      fs.writeFileSync(this.empFilename, empCode, 'utf8');
    }
    this.destroy();
  }

  genCode(o: ts.OutputFile, alias: TConfigResolveAlias, typesOutDir: string) {
    if (!this.build) return;
    if (!this.lib.key.includes(o.name)) {
      let mod = o.name
        .split(`/${this.build.typesOutDir}/`)[1]
        .replace('.d.ts', '');
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
