/** @format */

// Fork from https://github.com/umijs/umi-next/blob/master/scripts/bundleDeps.ts
// @ts-ignore
import ncc from '@vercel/ncc';
import { Package } from 'dts-packer';
import resolve from 'resolve';
import 'zx/globals';
import * as logger from '@fe6/biu-utils/src/logger';

export async function buildDep(opts: any) {
  logger.info(`Build dep ${opts.pkgName || opts.file}`);

  const nodeModulesPath = path.join(opts.base, 'node_modules');
  const target = path.join(opts.base, opts.target);

  if (opts.clean) {
    fs.removeSync(target);
  }

  let entry;
  if (opts.pkgName) {
    let resolvePath = opts.pkgName;
    // mini-css-extract-plugin 用 dist/cjs 为入口会有问题
    if (opts.pkgName === 'mini-css-extract-plugin') {
      resolvePath = 'mini-css-extract-plugin/dist/index';
    }
    entry = require.resolve(resolvePath, {
      paths: [nodeModulesPath],
    });
  } else {
    entry = path.join(opts.base, opts.file);
  }

  if (!opts.dtsOnly) {
    if (opts.isDependency) {
      fs.ensureDirSync(target);
      fs.writeFileSync(
        path.join(target, 'index.js'),
        `
const exported = require("${opts.pkgName}");
Object.keys(exported).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === exported[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return exported[key];
    }
  });
});
      `.trim() + '\n',
        'utf-8',
      );
    } else {
      const filesToCopy: string[] = [];
      if (opts.file === './bundles/webpack/bundle') {
        delete opts.webpackExternals['webpack'];
      }
      let { code, assets } = await ncc(entry, {
        externals: opts.webpackExternals,
        minify: !!opts.minify,
        target: 'es5',
        assetBuilds: false,
        customEmit(filePath: string, { id }: any) {
          if (
            (opts.file === './bundles/webpack/bundle' &&
              filePath.endsWith('.runtime.js')) ||
            (opts.pkgName === 'terser-webpack-plugin' &&
              filePath.endsWith('./utils') &&
              id.endsWith('terser-webpack-plugin/dist/index.js')) ||
            (opts.pkgName === 'css-minimizer-webpack-plugin' &&
              filePath.endsWith('./utils') &&
              id.endsWith('css-minimizer-webpack-plugin/dist/index.js'))
          ) {
            filesToCopy.push(
              resolve.sync(filePath, {
                basedir: path.dirname(id),
              }),
            );
            return `'./${path.basename(filePath)}'`;
          }
        },
      });

      // assets
      for (const key of Object.keys(assets)) {
        const asset = assets[key];
        const data = asset.source;
        const filePath = path.join(target, key);
        fs.ensureDirSync(path.dirname(filePath));
        fs.writeFileSync(path.join(target, key), data);
      }

      // filesToCopy
      for (const fileToCopy of filesToCopy) {
        let content = fs.readFileSync(fileToCopy, 'utf-8');
        for (const key of Object.keys(opts.webpackExternals)) {
          content = content.replace(
            new RegExp(`require\\\(['"]${key}['"]\\\)`, 'gm'),
            `require('${opts.webpackExternals[key]}')`,
          );
          content = content.replace(
            new RegExp(`require\\\(['"]${key}/package(\.json)?['"]\\\)`, 'gm'),
            `require('${opts.webpackExternals[key]}/package.json')`,
          );
        }
        fs.writeFileSync(
          path.join(target, path.basename(fileToCopy)),
          content,
          'utf-8',
        );
      }

      // entry code
      fs.ensureDirSync(target);
      // node 14 support for chalk
      if (['chalk', 'pkg-up', 'execa', 'globby'].includes(opts.pkgName)) {
        code = code.replace(/require\("node:/g, 'require("');
      }
      fs.writeFileSync(path.join(target, 'index.js'), code, 'utf-8');

      // patch
      if (opts.pkgName === 'mini-css-extract-plugin') {
        fs.copySync(
          path.join(nodeModulesPath, opts.pkgName, 'dist', 'hmr'),
          path.join(target, 'hmr'),
        );
        fs.copyFileSync(
          path.join(nodeModulesPath, opts.pkgName, 'dist', 'utils.js'),
          path.join(target, 'utils.js'),
        );
        fs.copyFileSync(
          path.join(
            nodeModulesPath,
            opts.pkgName,
            'dist',
            'loader-options.json',
          ),
          path.join(target, 'loader-options.json'),
        );
      }
      if (opts.pkgName === 'fork-ts-checker-webpack-plugin') {
        fs.removeSync(path.join(target, 'typescript.js'));
      }
    }
  }

  // license & package.json
  if (opts.pkgName) {
    if (opts.isDependency) {
      fs.ensureDirSync(target);
      fs.writeFileSync(
        path.join(target, 'index.d.ts'),
        `export * from '${opts.pkgName}';\n`,
        'utf-8',
      );
    } else {
      fs.ensureDirSync(target);
      const pkgRoot = path.dirname(
        resolve.sync(`${opts.pkgName}/package.json`, {
          basedir: opts.base,
        }),
      );
      if (fs.existsSync(path.join(pkgRoot, 'LICENSE'))) {
        fs.writeFileSync(
          path.join(target, 'LICENSE'),
          fs.readFileSync(path.join(pkgRoot, 'LICENSE'), 'utf-8'),
          'utf-8',
        );
      }
      const { name, author, license, types, version, typing, typings } =
        JSON.parse(
          fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf-8'),
        );
      fs.writeJSONSync(path.join(target, 'package.json'), {
        ...{},
        ...{ name },
        ...(version ? { version } : undefined),
        ...(author ? { author } : undefined),
        ...(license ? { license } : undefined),
        ...(types ? { types } : undefined),
        ...(typing ? { typing } : undefined),
        ...(typings ? { typings } : undefined),
      });

      // dts
      if (opts.noDts) {
        logger.warn(`Do not build dts for ${opts.pkgName}`);
      } else {
        new Package({
          cwd: opts.base,
          name: opts.pkgName,
          typesRoot: target,
          externals: opts.dtsExternals,
        });

        if (opts.pkgName === 'lodash') {
          const filePath = path.join(
            nodeModulesPath,
            `@types/${opts.pkgName}`,
            'common',
          );
          fs.copySync(filePath, path.join(target, 'common'));
        }

        // if (opts.pkgName === 'webpack') {
        //   const filePath = path.join(nodeModulesPath, opts.pkgName, 'hot');
        //   fs.copySync(filePath, path.join(target, 'hot'));
        // }

        // patch
        if (opts.pkgName === 'webpack-5-chain') {
          const filePath = path.join(target, 'types/index.d.ts');
          fs.writeFileSync(
            filePath,
            fs
              .readFileSync(filePath, 'utf-8')
              .replace(
                `} from 'webpack';`,
                `} from '@fe6/biu-utils/compiled/webpack';`,
              ),
            'utf-8',
          );
          fs.writeFileSync(
            path.join(target, 'index.d.ts'),
            fs.readFileSync(filePath, 'utf-8'),
            'utf-8',
          );
          fs.removeSync(path.join(target, 'types'));
        }

        // for bundler-utils
        // if (opts.pkgName === 'less') {
        //   const dtsPath = path.join(opts.base, 'compiled/less/index.d.ts');

        //   fs.writeFileSync(
        //     dtsPath,
        //     fs
        //       .readFileSync(dtsPath, 'utf-8')
        //       .replace(
        //         'declare module "less"',
        //         'declare module "@umijs/bundler-utils/compiled/less"',
        //       ),
        //     'utf-8',
        //   );
        // }
      }
    }
  }

  // copy files in packages
  if (opts.file && !opts.dtsOnly) {
    const packagesDir = path.join(
      opts.base,
      path.dirname(opts.file),
      'packages',
    );
    if (fs.existsSync(packagesDir)) {
      const files = fs.readdirSync(packagesDir);
      files.forEach((file) => {
        if (file.charAt(0) === '.') return;
        if (!fs.statSync(path.join(packagesDir, file)).isFile()) return;
        fs.copyFileSync(path.join(packagesDir, file), path.join(target, file));
      });
    }
  }
}

(async () => {
  const base = process.cwd();
  const thePkgPath = path.join(base, 'package.json');
  const pkg = fs.readJSONSync(thePkgPath);
  const pkgDeps = pkg.dependencies || {};

  if (!pkg.compiledConfig) {
    logger.errorExit(
      `compiledConfig does not exist in ${thePkgPath}, Please configure compiledConfig in ${thePkgPath}`,
    );
  }

  const {
    deps,
    externals = {},
    noMinify = [],
    extraDtsDeps = [],
    extraDtsExternals = [],
    excludeDtsDeps = [],
  } = pkg.compiledConfig;

  const webpackExternals: Record<string, string> = {};
  const dtsExternals = [...extraDtsDeps, ...extraDtsExternals];
  Object.keys(externals).forEach((name) => {
    const val = externals[name];
    if (val === '$$LOCAL') {
      dtsExternals.push(name);
      webpackExternals[name] = `${pkg.name}/compiled/${name}`;
    } else {
      webpackExternals[name] = val;
    }
  });

  for (const dep of argv.dep
    ? [argv.dep]
    : argv['extra-dts-only']
    ? extraDtsDeps
    : deps.concat(extraDtsDeps)) {
    const isDep = dep.charAt(0) !== '.';
    logger.empty();

    const target = `compiled/${isDep ? dep : path.basename(path.dirname(dep))}`;

    if (dep === 'webpack-dev-server') {
      logger.info(`Build dep ${dep}`);
      fs.ensureDirSync(target);
      const nodeModulesPath = path.join(base, 'node_modules');
      const theTarget = path.join(base, target);
      const filePath = (fileName: string = '') =>
        path.join(nodeModulesPath, dep, fileName);
      fs.copySync(filePath('lib'), path.join(theTarget, 'lib'));
      fs.copySync(filePath('client'), path.join(theTarget, 'client'));
      fs.copySync(filePath('types/lib'), path.join(theTarget, 'lib'));
      const pkgRoot = path.dirname(
        resolve.sync(`${dep}/package.json`, {
          basedir: base,
        }),
      );
      if (fs.existsSync(path.join(pkgRoot, 'LICENSE'))) {
        fs.writeFileSync(
          path.join(target, 'LICENSE'),
          fs.readFileSync(path.join(pkgRoot, 'LICENSE'), 'utf-8'),
          'utf-8',
        );
      }
      if (fs.existsSync(path.join(pkgRoot, 'package.json'))) {
        fs.writeFileSync(
          path.join(target, 'package.json'),
          fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf-8'),
          'utf-8',
        );
      }

      // FIX require
      const racefulFsFilePath = path.join(target, 'lib/Server.js');
      fs.writeFileSync(
        racefulFsFilePath,
        fs
          .readFileSync(racefulFsFilePath, 'utf-8')
          .replace(`graceful-fs`, `@fe6/biu-utils/compiled/fs-extra`)
          .replace(`schema-utils`, `@fe6/biu-utils/compiled/schema-utils`)
          .replace(`"express`, `"@fe6/biu-utils/compiled/express`)
          .replace(`default-gateway`, `@fe6/biu-utils/compiled/default-gateway`)
          .replace(`ipaddr.js`, `@fe6/biu-utils/compiled/ipaddr.js`)
          .replace(
            `require("webpack-dev-middleware`,
            `require("@fe6/biu-utils/compiled/webpack-dev-middleware`,
          )
          .replace(
            `require("compression`,
            `require("@fe6/biu-utils/compiled/compression`,
          )
          .replace(
            `require("connect-history-api-fallback`,
            `require("@fe6/biu-utils/compiled/connect-history-api-fallback`,
          )
          .replace(
            `require("serve-index`,
            `require("@fe6/biu-utils/compiled/serve-index`,
          )
          .replace(`require("open`, `require("@fe6/biu-utils/compiled/open`)
          .replace(
            `require("bonjour`,
            `require("@fe6/biu-utils/compiled/bonjour`,
          )
          .replace(
            `require("colorette`,
            `require("@fe6/biu-utils/compiled/colorette`,
          )
          .replace(
            `require("chokidar`,
            `require("@fe6/biu-utils/compiled/chokidar`,
          )
          .replace(
            `require("colorette`,
            `require("@fe6/biu-utils/compiled/colorette`,
          )
          .replace(
            `require.resolve("webpack/hot/only-dev-server`,
            `require.resolve("@fe6/biu-utils/compiled/webpack/hot/only-dev-server`,
          )
          .replace(
            `require.resolve("webpack/hot/dev-server`,
            `require.resolve("@fe6/biu-utils/compiled/webpack/hot/dev-server`,
          )
          .replace(
            `require("webpack"`,
            `require("@fe6/biu-utils/compiled/webpack"`,
          ),
        'utf-8',
      );
    } else if (dep === 'webpack-federated-stats-plugin') {
      logger.info(`Build dep ${dep}`);
      fs.ensureDirSync(target);
      const pkgRoot = path.dirname(
        resolve.sync(`${dep}/package.json`, {
          basedir: base,
        }),
      );
      if (fs.existsSync(path.join(pkgRoot, 'index.js'))) {
        fs.writeFileSync(
          path.join(target, 'index.js'),
          fs.readFileSync(path.join(pkgRoot, 'index.js'), 'utf-8'),
          'utf-8',
        );
      }
      if (fs.existsSync(path.join(pkgRoot, 'package.json'))) {
        fs.writeFileSync(
          path.join(target, 'package.json'),
          fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf-8'),
          'utf-8',
        );
      }

      // FIX require
      const racefulFsFilePath = path.join(target, 'index.js');
      fs.writeFileSync(
        racefulFsFilePath,
        fs
          .readFileSync(racefulFsFilePath, 'utf-8')
          .replace(`"webpack`, `"@fe6/biu-utils/compiled/webpack`),
        'utf-8',
      );
    } else {
      await buildDep({
        ...(isDep ? { pkgName: dep } : { file: dep }),
        target,
        base,
        webpackExternals,
        dtsExternals,
        clean: argv.clean,
        minify: !noMinify.includes(dep),
        dtsOnly: extraDtsDeps.includes(dep),
        noDts: excludeDtsDeps.includes(dep),
        isDependency: dep in pkgDeps,
      });
    }
  }

  logger.empty();
  logger.success(`Dep builded`);
})();
