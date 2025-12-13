import { aaron, might, HttpClient, LoggerAppender, LoggerContext, LoggerFlags, MESSAGES } from '../../aaron';

interface LogRequest {
  /** 日志级别，默认 info */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** 日志消息，必需 */
  message: string;
  /** 附加元数据 */
  metadata?: any;
}

export class HttpAppender extends LoggerAppender {
  private readonly _server: HttpClient = new HttpClient();

  constructor() {
    super();
    this._server.defaults.url = 'http://192.168.1.4:3012';
    this._server.defaults.retryCount = 0;
    this._server.defaults.retryDelay = 10_000;
    this._server.defaults.headers = { 'Content-Type': 'application/json' };
  }

  output(context: LoggerContext): void {
    // 禁止再开发环境使用
    if (aaron.argParser.isProd) return;

    const { level, token, content, stack } = context;
    // 过滤 HTTP 日志，避免循环发送
    if (token === MESSAGES.HTTP.CATEGORY) return;

    // 发送日志到服务器
    const data: LogRequest = {
      level: level.toLowerCase() as LogRequest['level'],
      message:
        `${LoggerFlags[level]} ${token} ${content
          .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
          .join('  ')}` + (stack ?? ''),
    };
    might.runAsync(this._server.post('/api/log', data));
  }
}
