/** @format */

import chalk from 'chalk';

import {
  PKG_NAME,
  BIU_COLOR,
  WAIT_COLOR,
  ERROR_COLOR,
  WARN_COLOR,
  READY_COLOR,
  EVENT_COLOR,
  DEBUG_COLOR,
  INFO_COLOR,
} from './constant';

const nameChalk = chalk.hex(BIU_COLOR);
export const pkgName = `${nameChalk(`[${PKG_NAME}]`)} `;

const waitChalk = chalk.hex(WAIT_COLOR);
const errorChalk = chalk.hex(ERROR_COLOR);
const warnChalk = chalk.hex(WARN_COLOR);
const readyChalk = chalk.hex(READY_COLOR);
const eventChalk = chalk.hex(EVENT_COLOR);
const debugChalk = chalk.hex(DEBUG_COLOR);
const infoChalk = chalk.hex(INFO_COLOR);

export const prefixes = {
  wait: (type: string = 'wait') => `${pkgName}${waitChalk(`[${type}]`)} -`,
  error: `${pkgName}${errorChalk('[error]')} -`,
  warn: `${pkgName}${warnChalk('[warn]')} -`,
  ready: (type: string = 'ready') =>
    `${pkgName}${type ? readyChalk(`[${type}]`) : ''} -`,
  event: `${pkgName}${eventChalk('[event]')} -`,
  debug: `${pkgName}${debugChalk('[debug]')} -`,
  info: (type: string = 'info') =>
    `${pkgName}${type ? infoChalk(`[${type}]`) : ''} -`,
};

export function empty() {
  console.log();
}

export function wait(...message: any[]) {
  console.log(prefixes.wait(), ...message);
  empty();
}

export function error(...message: any[]) {
  console.error(prefixes.error, ...message);
  empty();
}

export function errorOnly(...message: any[]) {
  console.error(prefixes.error, ...message);
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

export function warnOnly(...message: any[]) {
  console.warn(prefixes.warn, ...message);
}

export function ready(...message: any[]) {
  console.log(prefixes.ready(), ...message);
  empty();
}

export function success(...message: any[]) {
  console.log(prefixes.ready('success'), ...message);
  empty();
}

export function successOnly(...message: any[]) {
  console.log(prefixes.ready('success'), ...message);
}

export function info(...message: any[]) {
  console.log(prefixes.info(), ...message);
  empty();
}

export function infoOnly(...message: any[]) {
  console.log(prefixes.info(), ...message);
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

export function assert(condition: boolean, ...message: string[]) {
  if (condition) {
    console.log(prefixes.warn, ...message);
    empty();
  }
}
