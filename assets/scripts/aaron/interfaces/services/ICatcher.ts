import { IService } from '../../core';

/** 错误报告方法 */
export type ErrorReporter = (info: Object) => void;

/**
 * 异常捕获服务接口
 */
export interface ICatcher extends IService {
  /**
   * 设置错误报告方法
   * @param fn 报告方法
   */
  setErrorReporter(fn: ErrorReporter): void;
}
