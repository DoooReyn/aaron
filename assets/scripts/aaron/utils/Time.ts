/**
 * 获取当前时间戳
 * @returns 当前时间戳
 */
export function now() {
  return Date.now();
}

/**
 * 等待指定时间
 * @param ms 时间（毫秒）
 * @returns
 */
export async function waitAsync<R = unknown>(handle: () => R, ms: number) {
  return new Promise<R>((resolve) => {
    setTimeout(function () {
      resolve(handle());
    }, ms);
  });
}

/**
 * 等待指定时间后执行方法
 * @param handle 方法
 * @param ms 时间（毫秒）
 */
export function waitSync(handle: Function, ms: number) {
  setTimeout(handle, ms);
}
