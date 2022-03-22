export type MinimizedResult = import('./index').MinimizedResult;
export type RawSourceMap = import('../source-map').RawSourceMap;
export type InternalResult = import('./index').InternalResult;
/** @typedef {import('./index').MinimizedResult} MinimizedResult */
/** @typedef {import('../source-map').RawSourceMap} RawSourceMap */
/** @typedef {import('./index').InternalResult} InternalResult */
/**
 * @template T
 * @param {import('./index').InternalOptions<T>} options
 * @returns {Promise<InternalResult>}
 */
export function minify<T>(
  options: import('./index').InternalOptions<T>
): Promise<InternalResult>;
/**
 * @param {string} options
 * @returns {Promise<InternalResult>}
 */
export function transform(options: string): Promise<InternalResult>;
