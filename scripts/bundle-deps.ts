/** @format */

// Fork from https://github.com/umijs/umi-next/blob/master/scripts/bundleDeps.ts
// @ts-ignore
import ncc from '@vercel/ncc';
import { Package } from 'dts-packer';
import resolve from 'resolve';
import 'zx/globals';
import { logger } from '@fe6/biu-utils';

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

      // bonjour-service 复制 dts
      if (opts.pkgName === 'bonjour-service') {
        fs.copySync(
          path.join(nodeModulesPath, opts.pkgName, 'dist', 'lib'),
          path.join(target, 'lib'),
        );
        fs.copyFileSync(
          path.join(nodeModulesPath, opts.pkgName, 'dist', 'index.d.ts'),
          path.join(target, 'index.d.ts'),
        );
      }

      // webpack-dev-middleware 复制 dts
      if (opts.pkgName === 'webpack-dev-middleware') {
        fs.copySync(
          path.join(nodeModulesPath, opts.pkgName, 'types'),
          path.join(target),
        );
      }

      // anymatch 复制 dts
      if (opts.pkgName === 'anymatch') {
        fs.copyFileSync(
          path.join(nodeModulesPath, opts.pkgName, 'index.d.ts'),
          path.join(target, 'index.d.ts'),
        );
      }

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
    // style-loader
    if (opts.pkgName === 'style-loader') {
      const filePath = path.join(
        nodeModulesPath,
        opts.pkgName,
        'dist',
        'runtime',
      );
      fs.copySync(filePath, path.join(target, 'runtime'));
    }
    // vue-loader
    if (opts.pkgName === 'vue-loader') {
      fs.copyFileSync(
        path.join(nodeModulesPath, opts.pkgName, 'dist', 'stylePostLoader.js'),
        path.join(target, 'stylePostLoader.js'),
      );
      fs.copyFileSync(
        path.join(
          nodeModulesPath,
          opts.pkgName,
          'dist',
          'styleInlineLoader.js',
        ),
        path.join(target, 'styleInlineLoader.js'),
      );
      fs.copyFileSync(
        path.join(nodeModulesPath, opts.pkgName, 'dist', 'exportHelper.js'),
        path.join(target, 'exportHelper.js'),
      );
      fs.copyFileSync(
        path.join(nodeModulesPath, opts.pkgName, 'dist', 'formatError.js'),
        path.join(target, 'formatError.js'),
      );
      fs.copyFileSync(
        path.join(nodeModulesPath, opts.pkgName, 'dist', 'descriptorCache.js'),
        path.join(target, 'descriptorCache.js'),
      );
      fs.copyFileSync(
        path.join(nodeModulesPath, opts.pkgName, 'dist', 'resolveScript.js'),
        path.join(target, 'resolveScript.js'),
      );
      fs.copyFileSync(
        path.join(nodeModulesPath, opts.pkgName, 'dist', 'util.js'),
        path.join(target, 'util.js'),
      );
      const vueLoaderFormatErrorFilePath = path.join(target, 'formatError.js');
      fs.writeFileSync(
        vueLoaderFormatErrorFilePath,
        fs
          .readFileSync(vueLoaderFormatErrorFilePath, 'utf-8')
          .replace(
            `require("chalk")`,
            `require("@fe6/biu-deps/compiled/chalk")`,
          ),
        'utf-8',
      );
      const vueLoaderExportHelperFilePath = path.join(
        target,
        'exportHelper.js',
      );
      fs.writeFileSync(
        vueLoaderExportHelperFilePath,
        fs
          .readFileSync(vueLoaderExportHelperFilePath, 'utf-8')
          .replace(`exports.default = (`, `export default (`),
        'utf-8',
      );
    }

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
        logger.empty();
        logger.warnOnly(`Do not build dts for ${opts.pkgName}`);
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

        if (opts.pkgName === 'webpack') {
          const filePath = path.join(nodeModulesPath, opts.pkgName, 'hot');
          fs.copySync(filePath, path.join(target, 'hot'));

          const webpackFilePath = path.join(target, 'types/index.d.ts');
          fs.writeFileSync(
            webpackFilePath,
            fs
              .readFileSync(webpackFilePath, 'utf-8')
              .replace(
                `path().resolve(__dirname,"./threadChild.js")`,
                `require("worker_threads")`,
              ),
            'utf-8',
          );
        }

        // patch
        if (opts.pkgName === 'webpack-5-chain') {
          const filePath = path.join(target, 'types/index.d.ts');
          fs.writeFileSync(
            filePath,
            fs
              .readFileSync(filePath, 'utf-8')
              .replace(
                `} from 'webpack';`,
                `} from '@fe6/biu-deps/compiled/webpack';`,
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

  logger.empty();
  logger.success(`Dep builded`);
})();
