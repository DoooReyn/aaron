import { Service } from '../core';
import { ErrorReporter, ICatcher, IGlobalAdapter } from '../interfaces';
import { MESSAGES, SERVICES } from '../macro';

/**
 * 异常捕获服务
 */
export class Catcher extends Service implements ICatcher {
  public token: string = MESSAGES.CATCHER.CATEGORY;
  /** 错误报告方法 */
  private _reporter: ErrorReporter;

  setErrorReporter(handle: ErrorReporter): void {
    this._reporter = handle;
  }

  constructor() {
    super();

    const self = this;
    const globalAdapter = this.resolve<IGlobalAdapter>(SERVICES.GLOBAL_ADAPTER);
    if (globalAdapter.has('addEventListener')) {
      const addEventListener = globalAdapter.get<Function>('addEventListener');
      addEventListener('unhandledrejection', function (event: PromiseRejectionEvent) {
        self.logger.e(MESSAGES.CATCHER.ASYNC_ERROR, event);
        if (self._reporter) {
          self._reporter({
            message: 'Unhandled Promise Rejection',
            reason: event.reason,
          });
        }
      });
      addEventListener('error', function (event: ErrorEvent) {
        self.logger.e(MESSAGES.CATCHER.SYNC_ERROR, event);
        if (self._reporter && event && event.error) {
          self._reporter({
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
