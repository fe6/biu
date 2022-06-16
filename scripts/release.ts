/**
 * modified from https://github.com/vuejs/vue-next/blob/master/scripts/release.js
 *
 * @format
 */

import { resolve } from 'path';
import execa from 'execa';
import semver from 'semver';
import fs from '@fe6/biu-deps/compiled/fs-extra';
import prompts from '@fe6/biu-deps/compiled/prompts';
import { logger } from '@fe6/biu-utils';

const args = require('minimist')(process.argv.slice(2));
const PACKAGE_TYPE: string[] = ['biu', 'deps', 'deps-webpack', 'utils'];

export const VERSION_INCREMENTS: semver.ReleaseType[] = [
  'patch',
  'minor',
  'major',
  'prepatch',
  'preminor',
  'premajor',
  'prerelease',
];

const testVersion = (tVersion: string) => {
  if (!semver.valid(tVersion)) {
    logger.errorExit(`无效的目标版本 -> ${tVersion}`);
  }
};

const run = (bin: string, args: string[], opts: object = {}) =>
  execa(bin, args, { stdio: 'inherit', ...opts });

const runIfNotDry = run;

function updateVersion(pkgFile: string, version: string) {
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
  pkg.version = version;
  fs.writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function publishPackage(pkgName: string, version: string) {
  const publicArgs = [
    'publish',
    '--new-version',
    version,
    '--no-git-tag-version',
    '--access',
    'public',
  ];
  try {
    await run('yarn', publicArgs, {
      stdio: 'pipe',
    });
    logger.success(`发布成功 ${pkgName}@${version}`);
  } catch (e: any) {
    if (e.stderr.match(/previously published/)) {
      logger.error(`跳过已发布的: ${pkgName}`);
    } else {
      throw e;
    }
  }
}

export async function goRelease(version: string) {
  let targetVersion = version;
  const pkgDir = process.cwd();
  const pkgPath = resolve(pkgDir, 'package.json');
  const pkg = require(pkgPath);
  const pkgName = pkg.name.replace(/^@fe6\//, '');

  if (!targetVersion) {
    const currentVersion = pkg.version;
    const inc = (i: semver.ReleaseType) =>
      semver.inc(currentVersion, i, 'beta');
    const { release } = await prompts({
      type: 'select',
      name: 'release',
      message: '选择发布版本',
      choices: VERSION_INCREMENTS.map(
        (i: semver.ReleaseType) => `${i}: (${inc(i)})`,
      )
        .concat(['custom'])
        .map((i: any) => ({ value: i, title: i })),
    });

    if (release === 'custom') {
      /**
       * @type {{ version: string }}
       */
      const res = await prompts({
        type: 'text',
        name: 'version',
        message: '输入发布版本',
        initial: currentVersion,
      });
      targetVersion = res.version;
    } else {
      targetVersion = release.match(/\((.*)\)/)[1];
    }
  }

  testVersion(targetVersion);

  const tag = `${pkgName}@${targetVersion}`;

  const { yes } = await prompts({
    type: 'confirm',
    name: 'yes',
    message: `TAG 是 ${tag} 吗?`,
  });

  if (!yes) {
    return;
  }

  logger.info('更新包的版本...');

  updateVersion(pkgPath, targetVersion);

  const confirmRunBeforeRelease = await prompts({
    type: 'confirm',
    name: 'yes',
    message: `运行 pnpm build:release 命令了吗?`,
  });

  if (!confirmRunBeforeRelease.yes) {
    return;
  }

  const confirmChangelog = await prompts({
    type: 'confirm',
    name: 'yes',
    message: `确定生成 CHANGELONG 吗?`,
  });

  if (!confirmChangelog.yes) {
    return;
  }

  logger.info('生成 CHANGELONG...');

  await run('pnpm', ['run', 'changelog']);

  const confirmGitPush = await prompts({
    type: 'confirm',
    name: 'yes',
    message: `确定将改变提交到 GitHub 吗?`,
  });

  if (!confirmGitPush.yes) {
    return;
  }

  const { stdout } = await run('git', ['diff'], { stdio: 'pipe' });
  if (stdout) {
    logger.info('提交 GIT ...');

    await runIfNotDry('git', ['add', '-A']);
    await runIfNotDry('git', ['commit', '-m', `release($bump): ${tag}`]);
  } else {
    logger.info('这个仓库没有改变');
  }

  const confirmRelease = await prompts({
    type: 'confirm',
    name: 'yes',
    message: `确定发布 ${pkgName} 的 ${targetVersion} 版本吗?`,
  });

  if (!confirmRelease.yes) {
    return;
  }

  logger.info(`${pkg.name} 发布中...`);

  await publishPackage(pkgName, targetVersion);

  logger.info('提交到 GitHub...');

  await runIfNotDry('git', ['tag', tag]);
  await runIfNotDry('git', ['push', 'origin', 'master', tag]);
}

(async () => {
  const argLength = args._.length;
  if (argLength) {
    const targetVersion = args._[1];
    const targetPackageName = args._[0];
    if (targetVersion) {
      testVersion(targetVersion);
    }
    if (PACKAGE_TYPE.includes(targetPackageName)) {
      await goRelease(targetVersion);
    }
  } else {
    logger.errorExit('请加上发布的包名~');
  }
})();
