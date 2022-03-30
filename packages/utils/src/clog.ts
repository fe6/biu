/** @format */

import { PKG_NAME, colors } from './constant';

const renderName = (name: string, type?: string) => [
  `%c[${PKG_NAME}] %c[${name.toLocaleUpperCase()}]`,
  `color: ${(colors as any).name}`,
  `color: ${(colors as any)[type || name]}`,
];

export default {
  log: (...message: any[]) => {
    console.log(...renderName('log'), ...message);
  },
  event: (...message: any[]) => {
    console.log(...renderName('event'), ...message);
  },
  eventHmr: (...message: any[]) => {
    console.log(...renderName('HMR', 'event'), ...message);
  },
  eventGroupHmr: (...message: any[]) => {
    console.groupCollapsed(...renderName('HMR', 'event'), ...message);
  },
  warn: (...message: any[]) => {
    console.log(...renderName('warn'), ...message);
  },
  warnHmr: (...message: any[]) => {
    console.log(...renderName('HMR', 'warn'), ...message);
  },
  info: (...message: any[]) => {
    console.log(...renderName('info'), ...message);
  },
  infoHmr: (...message: any[]) => {
    console.log(...renderName('HMR', 'info'), ...message);
  },
  debug: (...message: any[]) => {
    console.log(...renderName('debug'), ...message);
  },
  error: (...message: any[]) => {
    console.log(...renderName('error'), ...message);
  },
  errorHmr: (...message: any[]) => {
    console.log(...renderName('HMR', 'error'), ...message);
  },
  wait: (...message: any[]) => {
    console.log(...renderName('wait'), ...message);
  },
  waitHmr: (...message: any[]) => {
    console.log(...renderName('HMR', 'waitOld'), ...message);
  },
  ready: (...message: any[]) => {
    console.log(...renderName('ready'), ...message);
  },
};
