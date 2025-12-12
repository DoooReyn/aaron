import { Logger } from '../core';

/** 异常捕获返回值类型 */
type ReturnType<T> = Readonly<[T?, Error?]>;

/**
 * 执行异步方法并捕获异常
 * @param asyncFn 异步方法
 * @returns
 */
async function runAsync<T = any>(asyncFn: Promise<T>): Promise<ReturnType<T>> {
  return Promise.resolve(asyncFn)
    .then((result): Readonly<[T]> => [result])
    .catch((err): Readonly<[undefined, Error]> => {
      if (typeof err === 'undefined') {
        err = new Error('Rejection with empty value');
      }
      return [undefined, err];
    });
}

/**
 * 执行同步方法并捕获异常
 * @param syncFn 同步方法
 * @param context 上下文
 * @param args 入参
 */
function runSync<T = any>(syncFn: (...args: any[]) => T, context?: any, ...args: any[]): ReturnType<T> {
  try {
    if (context !== undefined) {
      const result = syncFn.apply(context, args);
      return [result, undefined];
    } else {
      const result = syncFn(...args);
      return [result, undefined];
    }
  } catch (err) {
    return [undefined, err];
  }
}

/**
 * 执行异步方法并捕获异常（输出日志）
 * @param asyncFn 异步方法
 * @param logger 日志定向
 * @returns
 */
async function logAsync<T = any>(asyncFn: Promise<T>, logger?: Logger): Promise<T> {
  const result = await runAsync(asyncFn);
  if (result[1]) {
    logger ? logger.e(result[1]) : console.error(result[1]);
  }
  return result[0];
}

/**
 * 执行同步方法并捕获异常
 * @param syncFn 同步方法
 * @param logger 日志定向
 * @param context 上下文
 * @param args 入参
 * @returns
 */
function logSync<T = any>(syncFn: (...args: any[]) => T, logger?: Logger, context?: any, ...args: any[]): T {
  const result = runSync(syncFn, context, ...args);
  if (result[1]) {
    logger ? logger.e(result[1]) : console.error(result[1]);
  }
  return result[0];
}

export { runAsync, runSync, logAsync, logSync, type ReturnType };
