/** @format */

import chalk from '../compiled/chalk';

const nameChalk = chalk.hex('#ff85c0');
export const pkgName = `${nameChalk('[BIU]')} `;

const waitChalk = chalk.hex('#fffb8f');
const errorChalk = chalk.hex('#f5222d');
const warnChalk = chalk.hex('#faad14');

export const prefixes = {
  wait: `${pkgName}${waitChalk('[wait]')}  -`,
  error: `${pkgName}${errorChalk('[error]')} -`,
  warn: `${pkgName}${warnChalk('[warn]')}  -`,
  ready: `${pkgName}${chalk.green('[ready]')} -`,
  info: `${pkgName}${chalk.blue('[info]')}  -`,
  event: `${pkgName}${chalk.magenta('[event]')} -`,
  debug: `${pkgName}${chalk.gray('[debug]')} -`,
};

export function empty() {
  console.log();
}

export function wait(...message: any[]) {
  console.log(prefixes.wait, ...message);
  empty();
}

export function error(...message: any[]) {
  console.error(prefixes.error, ...message);
  empty();
}

export function errorExit(...message: any[]) {
  console.error(prefixes.error, ...message);
  empty();
  process.exit(1);
}

export function warn(...message: any[]) {
  console.warn(prefixes.warn, ...message);
  empty();
}

export function ready(...message: any[]) {
  console.log(prefixes.ready, ...message);
  empty();
}

export function info(...message: any[]) {
  console.log(prefixes.info, ...message);
  empty();
}

export function event(...message: any[]) {
  console.log(prefixes.event, ...message);
  empty();
}

export function debug(...message: any[]) {
  if (process.env.DEBUG) {
    console.log(prefixes.debug, ...message);
    empty();
  }
}