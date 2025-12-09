import { IService } from '../IService';

/**
 * WebSocket 消息类型
 */
export interface WSMessage {
  /** 消息ID，用于请求响应匹配 */
  id?: string;
  /** 消息类型 */
  type: string;
  /** 消息数据 */
  data: any;
  /** 时间戳 */
  timestamp?: number;
}

/**
 * WebSocket 请求配置
 */
export interface WSRequestConfig {
  /** 请求消息 */
  message: WSMessage;
  /** 超时时间（毫秒），默认 5000 */
  timeout?: number;
  /** 重试次数，默认 3 */
  retryCount?: number;
  /** 重试延迟（毫秒），默认 1000 */
  retryDelay?: number;
  /** 是否需要响应，默认 true */
  needResponse?: boolean;
  /** 自定义请求头或元数据 */
  meta?: Record<string, any>;
}

/**
 * WebSocket 响应
 */
export interface WSResponse<T = any> {
  /** 请求ID */
  requestId: string;
  /** 响应数据 */
  data: T;
  /** 是否成功 */
  success: boolean;
  /** 错误码 */
  code?: string;
  /** 错误消息 */
  message?: string;
  /** 响应时间戳 */
  timestamp: number;
}

/**
 * WebSocket 事件类型
 */
export interface WSEventMap {
  /** 连接成功 */
  open: Event;
  /** 连接关闭 */
  close: CloseEvent;
  /** 连接错误 */
  error: Event;
  /** 收到消息 */
  message: MessageEvent;
  /** 重连中 */
  reconnecting: { attempt: number; maxAttempts: number };
  /** 重连成功 */
  reconnected: { attempt: number };
  /** 心跳响应 */
  heartbeat: { latency: number };
}

/**
 * 请求拦截器
 */
export interface WSRequestInterceptor {
  (config: WSRequestConfig): WSRequestConfig | Promise<WSRequestConfig>;
}

/**
 * 响应拦截器
 */
export interface WSResponseInterceptor {
  (response: WSResponse): WSResponse | Promise<WSResponse>;
}

/**
 * 错误拦截器
 */
export interface WSErrorInterceptor {
  (error: WSError): WSError | Promise<WSError>;
}

/**
 * WebSocket 错误类型
 */
export class WSError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'WSError';
  }
}

/**
 * 常见错误代码
 */
export enum WSErrorCodes {
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 连接超时 */
  CONNECT_TIMEOUT = 'CONNECT_TIMEOUT',
  /** 请求超时 */
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  /** 连接被拒绝 */
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  /** 连接关闭 */
  CONNECTION_CLOSED = 'CONNECTION_CLOSED',
  /** 消息解析错误 */
  PARSE_ERROR = 'PARSE_ERROR',
  /** 请求被取消 */
  REQUEST_CANCELLED = 'REQUEST_CANCELLED',
  /** 并发限制超出 */
  CONCURRENCY_LIMIT_EXCEEDED = 'CONCURRENCY_LIMIT_EXCEEDED',
  /** 认证失败 */
  AUTH_FAILED = 'AUTH_FAILED',
  /** 服务器错误 */
  SERVER_ERROR = 'SERVER_ERROR',
  /** 未知错误 */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * WebSocket 连接状态
 */
export enum WSState {
  /** 未连接 */
  CLOSED = 0,
  /** 连接中 */
  CONNECTING = 1,
  /** 已连接 */
  OPEN = 2,
  /** 关闭中 */
  CLOSING = 3,
}

/**
 * WebSocket 配置选项
 */
export interface WSOptions {
  /** WebSocket 服务器地址 */
  url: string;
  /** 协议 */
  protocols?: string | string[];
  /** 最大并发请求数，默认 10 */
  maxConcurrency?: number;
  /** 自动重连，默认 true */
  autoReconnect?: boolean;
  /** 最大重连次数，默认 5 */
  maxReconnectAttempts?: number;
  /** 重连延迟（毫秒），默认 1000 */
  reconnectDelay?: number;
  /** 心跳间隔（毫秒），默认 30000 */
  heartbeatInterval?: number;
  /** 心跳超时（毫秒），默认 5000 */
  heartbeatTimeout?: number;
  /** 连接超时（毫秒），默认 10000 */
  connectTimeout?: number;
  /** 是否启用消息压缩 */
  enableCompression?: boolean;
  /** 连接断开后是否保留未发送的请求，默认 true */
  retainPendingRequests?: boolean;
  /** 连接恢复后是否自动重发保留的请求，默认 true */
  autoRetryPendingRequests?: boolean;
  /** 自定义消息解析器 */
  parser?: {
    /** 序列化消息 */
    stringify: (message: WSMessage) => string;
    /** 反序列化消息 */
    parse: (data: string) => WSMessage;
  };
}

/**
 * WebSocket 请求任务
 */
export interface WSRequestTask {
  /** 请求ID */
  id: string;
  /** 请求配置 */
  config: WSRequestConfig;
  /** 请求时间戳 */
  timestamp: number;
  /** 重试次数 */
  retryCount: number;
  /** 取消请求 */
  cancel: () => void;
  /** 是否已完成 */
  completed: boolean;
  /** 解决 Promise（内部使用） */
  resolve?: (value: any) => void;
  /** 拒绝 Promise（内部使用） */
  reject?: (reason: any) => void;
}

/**
 * WebSocket 服务接口
 */
export interface IWebsocket extends IService {
  /** 当前连接状态 */
  readonly state: WSState;
  /** 是否已连接 */
  readonly isConnected: boolean;
  /** 当前连接URL */
  readonly url?: string;

  /**
   * 连接到 WebSocket 服务器
   * @param url 服务器地址
   * @param options 配置选项
   */
  connect(url: string, options?: Partial<WSOptions>): Promise<void>;

  /**
   * 断开连接
   * @param code 关闭代码
   * @param reason 关闭原因
   */
  disconnect(code?: number, reason?: string): void;

  /**
   * 发送消息
   * @param config 请求配置
   * @returns 响应 Promise
   */
  send<T = any>(config: WSRequestConfig): Promise<WSResponse<T>>;

  /**
   * 发送消息（不需要响应）
   * @param message 消息
   */
  sendOneWay(message: WSMessage): void;

  /**
   * 批量发送消息
   * @param configs 请求配置数组
   * @returns 响应 Promise 数组
   */
  sendBatch<T = any>(configs: WSRequestConfig[]): Promise<WSResponse<T>[]>;

  /**
   * 添加请求拦截器
   * @param interceptor 拦截器函数
   * @returns 移除拦截器的函数
   */
  addRequestInterceptor(interceptor: WSRequestInterceptor): () => void;

  /**
   * 添加响应拦截器
   * @param interceptor 拦截器函数
   * @returns 移除拦截器的函数
   */
  addResponseInterceptor(interceptor: WSResponseInterceptor): () => void;

  /**
   * 添加错误拦截器
   * @param interceptor 拦截器函数
   * @returns 移除拦截器的函数
   */
  addErrorInterceptor(interceptor: WSErrorInterceptor): () => void;

  /**
   * 添加事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   * @returns 移除监听器的函数
   */
  on<K extends keyof WSEventMap>(event: K, listener: (event: WSEventMap[K]) => void): () => void;

  /**
   * 添加一次性事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   * @returns 移除监听器的函数
   */
  once<K extends keyof WSEventMap>(event: K, listener: (event: WSEventMap[K]) => void): () => void;

  /**
   * 移除事件监听器
   * @param event 事件类型
   * @param listener 监听器函数
   */
  off<K extends keyof WSEventMap>(event: K, listener: (event: WSEventMap[K]) => void): void;

  /**
   * 获取当前活跃的请求数量
   */
  getActiveRequestCount(): number;

  /**
   * 获取待处理的请求数量
   */
  getPendingRequestCount(): number;

  /**
   * 清理所有待处理的请求
   */
  clearPendingRequests(): void;

  /**
   * 手动检测连接状态
   * @returns Promise<boolean> 连接是否正常
   */
  checkConnection(): Promise<boolean>;

  /**
   * 获取连接统计信息
   */
  getConnectionStats(): {
    state: WSState;
    isConnected: boolean;
    url?: string;
    activeRequests: number;
    pendingRequests: number;
    reconnectAttempts: number;
    lastHeartbeat: number;
    lastConnectionCheck: number;
    isCheckingConnection: boolean;
    connectionStateBeforeBackground: boolean;
    options: {
      maxConcurrency?: number;
      autoReconnect?: boolean;
      maxReconnectAttempts?: number;
      heartbeatInterval?: number;
      enableCompression?: boolean;
    };
  };
}
