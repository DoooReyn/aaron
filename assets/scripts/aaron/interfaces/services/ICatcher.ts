import { IService } from '../../core';

/** 异常捕获返回值类型 */
export type ReturnType<T> = Readonly<[T | undefined, Error?]>;

/** 错误报告方法 */
export type ErrorReporter = (info: Object) => void;

/**
 * 异常捕获服务接口
 */
export interface ICatcher extends IService {
  /**
   * 执行异步方法并捕获异常
   * @param asyncFn 异步方法
   */
  async<T = any>(asyncFn: Promise<T>): Promise<ReturnType<T>>;
  /**
   * 执行同步方法并捕获异常
   * @param syncFn 同步方法
   */
  sync<T = any>(syncFn: (...args: any[]) => T, context?: any, ...args: any[]): ReturnType<T>;

  /**
   * 设置错误报告方法
   * @param fn 报告方法
   */
  setErrorReporter(fn: ErrorReporter): void;
}
