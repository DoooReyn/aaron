import { Service } from '../core';
import { ErrorReporter, ICatcher, IGlobalAdapter, ILogger } from '../interfaces';
import { SERVICES } from '../macro';

/**
 * 异常捕获服务
 */
export class Catcher extends Service implements ICatcher {
  /** 错误报告方法 */
  private _reporter: ErrorReporter;

  setErrorReporter(fn: ErrorReporter): void {
    this._reporter = fn;
  }

  constructor() {
    super();

    const globalAdapter = this.resolve<IGlobalAdapter>(SERVICES.GLOBAL_ADAPTER);
    const logger = this.resolve<ILogger>(SERVICES.LOGGER);
    const reporter = this._reporter;
    if (globalAdapter.has('addEventListener')) {
      const addEventListener = globalAdapter.get<Function>('addEventListener');
      addEventListener('unhandledrejection', function (event: PromiseRejectionEvent) {
        logger.e('❌ 异步错误:', event);
        if (reporter) {
          reporter({
            message: 'Unhandled Promise Rejection',
            reason: event.reason,
          });
        }
      });
      addEventListener('error', function (event: ErrorEvent) {
        logger.e('❌ 同步错误:', event);
        if (event.error && reporter) {
          reporter({
            message: event.error.message,
            stack: event.error.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        }
      });
    }
  }
}
