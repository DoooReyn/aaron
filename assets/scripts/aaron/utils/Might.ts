/** 异常捕获返回值类型 */
export type ReturnType<T> = Readonly<[T?, Error?]>;

/**
 * 执行异步方法并捕获异常
 * @param asyncFn 异步方法
 * @returns
 */
export async function runAsync<T = any>(asyncFn: Promise<T>): Promise<ReturnType<T>> {
  return Promise.resolve(asyncFn)
    .then((result): Readonly<[T]> => [result])
    .catch((err): Readonly<[undefined, Error]> => {
      if (typeof err === 'undefined') {
        err = new Error('Rejection with empty value');
      }
      console.error(err);
      return [undefined, err];
    });
}

/**
 * 执行同步方法并捕获异常
 * @param syncFn 同步方法
 */
export function runSync<T = any>(syncFn: (...args: any[]) => T, context?: any, ...args: any[]): ReturnType<T> {
  try {
    if (context !== undefined) {
      const result = syncFn.apply(context, args);
      return [result, undefined];
    } else {
      const result = syncFn(...args);
      return [result, undefined];
    }
  } catch (err) {
    console.error(err);
    return [undefined, err];
  }
}
