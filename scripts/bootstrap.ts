/** @format */

// Fork from https://github.com/umijs/umi-next/blob/master/scripts/utils.ts

// NOTE 所有功能（$、cd、fetch等）都可以直接使用，无需任何导入。
// NOTE 或者显式导入全局变量（以便在VS代码中更好地自动完成）。
import 'zx/globals';
import { logger } from '@fe6/biu-utils';
import { setExcludeFolder } from './utils';

(async () => {
  function getName(pkgName: string): string {
    return `@fe6/${pkgName}`;
  }

  async function renderPkg(opts: any): Promise<void> {
    const pkgDir = path.join(opts.pkgDir, opts.pkg);
    if (!opts.force && fs.existsSync(path.join(pkgDir, 'package.json'))) {
      logger.error(`${opts.pkg} exists`);
      logger.empty();
    } else {
      if (!fs.existsSync(pkgDir)) {
        await $`mkdir ${pkgDir}`;
      }

      const name = getName(opts.pkg);

      // package.json
      const pkgPkgJSONPath = path.join(pkgDir, 'package.json');
      const hasPkgJSON = fs.existsSync(pkgPkgJSONPath);
      const pkgPkgJSON = hasPkgJSON ? require(pkgPkgJSONPath) : {};
      fs.writeJSONSync(
        pkgPkgJSONPath,
        Object.assign(
          {
            name,
            version: '0.0.0',
            description: name,
            main: 'dist/index.js',
            types: 'dist/index.d.ts',
            files: ['dist'],
            scripts: {
              build: 'pnpm tsc',
              'build:deps': 'pnpm esno ../../scripts/bundle-deps.ts',
              start: 'pnpm build -- --watch',
            },
            repository: {
              type: 'git',
              url: 'git+https://github.com/fe6/biu.git',
              directory: `packages/${opts.pkg}`,
            },
            authors: ['tainyi <649076408@qq.com> (https://github.com/iq9891)'],
            license: 'MIT',
            bugs: 'https://github.com/fe6/biu/issues',
            publishConfig: {
              access: 'public',
            },
          },
          {
            ...(hasPkgJSON
              ? {
                  authors: pkgPkgJSON.authors,
                  bin: pkgPkgJSON.bin,
                  files: pkgPkgJSON.files,
                  scripts: pkgPkgJSON.scripts,
                  description: pkgPkgJSON.description,
                  dependencies: pkgPkgJSON.dependencies,
                  devDependencies: pkgPkgJSON.devDependencies,
                  compiledConfig: pkgPkgJSON.compiledConfig,
                }
              : {}),
          },
        ),
        { spaces: '  ' },
      );

      // README.md
      await fs.writeFile(
        path.join(pkgDir, 'README.md'),
        `# ${name}\n`,
        'utf-8',
      );

      // tsconfig.json
      await fs.writeFile(
        path.join(pkgDir, 'tsconfig.json'),
        `{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "dist"
  },
  "include": ["src"]
}\n`,
        'utf-8',
      );

      // src/index.ts
      const srcDir = path.join(pkgDir, 'src');
      if (!fs.existsSync(srcDir)) {
        await $`mkdir ${srcDir}`;
      }
      if (!fs.existsSync(path.join(pkgDir, 'src', 'index.ts'))) {
        await fs.writeFile(
          path.join(pkgDir, 'src', 'index.ts'),
          `
export default () => {
  return '${name}';
};\n`.trimStart(),
          'utf-8',
        );
      }

      // set excludeFolder for webstorm
      setExcludeFolder({ pkg: opts.pkg, cwd: root });
      logger.ready(`${opts.pkg} bootstrapped`);
      logger.empty();
    }
  }

  const root = path.join(__dirname, '..');
  const pkgDir = path.join(root, 'packages');
  const pkgs = await fs.readdir(pkgDir);

  const { _ } = argv;
  if (_.length > 0) {
    const [pkgName] = _;
    if (fs.existsSync(path.join(pkgDir, pkgName))) {
      logger.warn(`${pkgName} exists`);
      logger.empty();
    } else {
      await renderPkg({
        pkgDir,
        pkg: pkgName,
        force: argv.force,
      });
    }
  } else {
    for (const pkg of pkgs) {
      if (pkg.charAt(0) === '.') continue;
      if (!(await fs.stat(path.join(pkgDir, pkg))).isDirectory()) continue;
      await renderPkg({
        pkgDir,
        pkg,
        force: argv.force,
      });
    }
  }
})();
