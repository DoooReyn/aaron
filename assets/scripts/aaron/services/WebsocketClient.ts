import { BinaryReader, BinaryWriter } from '@bufbuild/protobuf/wire';

import { Service } from '../core';
import {
  IAppLauncher,
  IEventBus,
  IWebsocket,
  WSError,
  WSErrorCodes,
  WSErrorInterceptor,
  WSEventMap,
  WSMessage,
  WSOptions,
  WSRequestConfig,
  WSRequestInterceptor,
  WSRequestTask,
  WSResponse,
  WSResponseInterceptor,
  WSState
} from '../interfaces';
import { EVENTS, MESSAGES, SERVICES } from '../macro';
import { literal } from '../utils';

/** 消息调制解调器 */
interface MessageFns<T> {
  encode(message: T, writer?: BinaryWriter): BinaryWriter;
  decode(input: BinaryReader | Uint8Array, length?: number): T;
}

/** 消息号（至少包含这几个消息） */
enum MsgId {
  /** 未识别 */
  UNRECOGNIZED = -1,
  /** 心跳 */
  HEART_BEAT = 0,
  /** Ping */
  PING = 1,
  /** Pong */
  PONG = 2,
}

/**
 * ProtocolBuffers 协议解析助手
 */
export class PBParser {
  private static readonly headLength: number = 6;

  /** 协议映射，存储命令和对应的请求和响应处理函数 */
  private static readonly protocols: Map<number, [MessageFns<unknown>, MessageFns<unknown> | undefined]> = new Map();

  /**
   * 注册协议
   * - 将命令和对应的请求和响应处理函数存储到协议映射中
   * - 用于后续编码和解码消息
   * @template T 消息类型
   * @param cmd 命令
   * @param req 请求处理函数
   * @param resp 响应处理函数
   */
  public static register<Req, Resp>(cmd: number, req: MessageFns<Req>, resp?: MessageFns<Resp>) {
    if (!this.protocols.has(cmd)) {
      this.protocols.set(cmd, [req, resp]);
    }
  }

  /**
   * 编码
   * @param data 数据
   * @returns
   */
  public static encode(data: WSMessage): Uint8Array<ArrayBuffer> {
    const cmd = data.cmd;
    if (!this.protocols.has(cmd)) {
      throw new Error(literal.fmt(MESSAGES.WEBSOCKET.PROTOCOL_NOT_FOUND, cmd));
    }

    const rid = data.id;
    const req: MessageFns<unknown> = this.protocols.get(cmd)[0];
    let length = this.headLength;
    const abHead = new ArrayBuffer(length);
    const dvHead = new DataView(abHead);
    const bytes = req.encode(data.data).finish();
    dvHead.setUint16(0, cmd, true);
    dvHead.setUint16(2, rid, true);
    dvHead.setUint16(4, bytes.length, true);
    length += bytes.length;
    const u8head = new Uint8Array(abHead);
    const buffer = new Uint8Array(length);
    buffer.set(u8head, 0);
    buffer.set(bytes, this.headLength);
    return buffer;
  }

  /**
   * 解码
   * @param msg 数据
   * @returns
   */
  public static decode(msg: ArrayBuffer): WSMessage {
    const dv = new DataView(msg);
    const cmd = dv.getInt16(0, true);
    if (!this.protocols.has(cmd)) {
      throw new Error(literal.fmt(MESSAGES.WEBSOCKET.PROTOCOL_NOT_FOUND, cmd));
    }

    const resp: MessageFns<unknown> = this.protocols.get(cmd)[1];
    if (resp == undefined) {
      throw new Error(literal.fmt(MESSAGES.WEBSOCKET.PROTOCOL_RESP_UNEXPECTED, cmd));
    }

    const rid = dv.getInt16(2, true);
    const bytes = new Uint8Array(msg, this.headLength, msg.byteLength - this.headLength);
    const data = resp.decode(bytes, bytes.byteLength);
    return {
      cmd: cmd,
      id: rid,
      data: data,
      timestamp: Date.now(),
    };
  }
}

/**
 * WebSocket 客户端实现
 */
export class WebsocketClient extends Service implements IWebsocket {
  readonly token: string = MESSAGES.WEBSOCKET.CATEGORY;

  /** WebSocket 实例 */
  private _ws: WebSocket | null = null;

  /** 连接状态 */
  private _state: WSState = WSState.CLOSED;

  /** 当前连接URL */
  private _url?: string;

  /** 配置选项 */
  private _options?: WSOptions;

  /** 事件监听器映射 */
  private _eventListeners: Map<keyof WSEventMap, Set<Function>> = new Map();

  /** 待处理的请求映射 */
  private _pendingRequests: Map<number, WSRequestTask> = new Map();

  /** 请求队列（用于并发限制） */
  private _requestQueue: WSRequestTask[] = [];

  /** 当前活跃的请求数量 */
  private _activeRequests: number = 0;

  /** 请求拦截器列表 */
  private _requestInterceptors: WSRequestInterceptor[] = [];

  /** 响应拦截器列表 */
  private _responseInterceptors: WSResponseInterceptor[] = [];

  /** 错误拦截器列表 */
  private _errorInterceptors: WSErrorInterceptor[] = [];

  /** 重连计时器 */
  private _reconnectTimer?: number | NodeJS.Timeout;

  /** 心跳计时器 */
  private _heartbeatTimer?: number | NodeJS.Timeout;

  /** 心跳超时计时器 */
  private _heartbeatTimeoutTimer?: number | NodeJS.Timeout;

  /** 当前重连次数 */
  private _reconnectAttempts: number = 0;

  /** 最后一次心跳时间戳 */
  private _lastHeartbeatTimestamp: number = 0;

  /** 最后一次连接检测时间戳 */
  private _lastConnectionCheckTimestamp: number = 0;

  /** 是否正在检测连接 */
  private _isCheckingConnection: boolean = false;

  /** 进入后台前的连接状态 */
  private _connectionStateBeforeBackground: boolean = false;

  /** 请求 id */
  private _reqId: number = 0;

  /** 获取当前连接状态 */
  get state(): WSState {
    return this._state;
  }

  /** 是否已连接 */
  get isConnected(): boolean {
    return this._state === WSState.OPEN && this._ws?.readyState === WebSocket.OPEN;
  }

  /** 获取当前连接URL */
  get url(): string | undefined {
    return this._url;
  }

  /**
   * 连接到 WebSocket 服务器
   */
  async connect(url: string, options?: Partial<WSOptions>): Promise<void> {
    if (this._state === WSState.CONNECTING) {
      throw new WSError(WSErrorCodes.CONNECTION_REFUSED, MESSAGES.WEBSOCKET.ERROR_CODE_1);
    }

    if (this._state === WSState.OPEN) {
      this.logger.wf(MESSAGES.WEBSOCKET.CONNECTED, url);
      return;
    }

    this._url = url;
    this._options = {
      maxConcurrency: 10,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      heartbeatTimeout: 5000,
      timeToPing: 5000,
      timeToPong: 3000,
      connectTimeout: 10000,
      autoReconnect: true,
      retainPendingRequests: true,
      autoRetryPendingRequests: true,
      enableCompression: false,
      ...options,
      url,
    };

    await this.internalConnect();
  }

  /**
   * 断开连接
   */
  disconnect(code: number = 1000, reason: string = 'Normal closure'): void {
    this.clearReconnectTimer();
    this.clearHeartbeatTimer();
    this.clearHeartbeatTimeoutTimer();

    // 主动断开连接时，清除所有请求
    if (code === 1000) {
      // 清空所有待处理的请求
      for (const task of this._pendingRequests.values()) {
        if (task.reject) {
          task.reject(new WSError(WSErrorCodes.REQUEST_CANCELLED, '连接已主动断开'));
        }
      }
      this._pendingRequests.clear();

      // 清空队列中的请求
      this.rejectQueuedRequests(new WSError(WSErrorCodes.REQUEST_CANCELLED, '连接已主动断开'));
    }

    if (this._ws) {
      this._ws.close(code, reason);
      this._ws = null;
    }

    this._state = WSState.CLOSED;
    this._reconnectAttempts = 0;
    this.logger.i(MESSAGES.WEBSOCKET.DISCONNECTED);
  }

  /**
   * 发送消息
   */
  async send<T = any>(config: WSRequestConfig): Promise<WSResponse<T>> {
    const task = this.createRequestTask(config);

    // 添加请求拦截器
    let processedConfig = config;
    for (const interceptor of this._requestInterceptors) {
      try {
        processedConfig = await interceptor(processedConfig);
      } catch (error) {
        throw new WSError(WSErrorCodes.PARSE_ERROR, MESSAGES.WEBSOCKET.ERROR_CODE_2, error);
      }
    }

    // 检查并发限制
    if (this._activeRequests >= (this._options?.maxConcurrency || 16)) {
      this._requestQueue.push(task);
      this.logger.wf(MESSAGES.WEBSOCKET.CONCURRENCY_LIMIT, this._activeRequests, this._options?.maxConcurrency);
      return new Promise((_, reject) => {
        task.config = processedConfig;
        task.cancel = () => {
          const index = this._requestQueue.indexOf(task);
          if (index > -1) {
            this._requestQueue.splice(index, 1);
          }
          task.completed = true;
          reject(new WSError(WSErrorCodes.REQUEST_CANCELLED, MESSAGES.WEBSOCKET.ERROR_CODE_3));
        };
      });
    }

    return this.executeRequest<T>(task, processedConfig);
  }

  /**
   * 发送单向消息
   */
  sendOneWay(message: WSMessage): void {
    if (!this.isConnected) {
      throw new WSError(WSErrorCodes.CONNECTION_CLOSED, MESSAGES.WEBSOCKET.ERROR_CODE_4);
    }

    try {
      message.id = this.nextReqId();
      const data = this._options?.parser?.encode(message);
      this._ws!.send(data);
      if (message.cmd !== MsgId.HEART_BEAT) {
        this.logger.df(MESSAGES.WEBSOCKET.SEND_ONE_WAY, message.cmd);
      }
    } catch (error) {
      throw new WSError(WSErrorCodes.NETWORK_ERROR, MESSAGES.WEBSOCKET.ERROR_CODE_5, error);
    }
  }

  /**
   * 批量发送消息
   */
  async sendBatch<T = any>(configs: WSRequestConfig[]): Promise<WSResponse<T>[]> {
    this.logger.df(MESSAGES.WEBSOCKET.SEND_BATCH, configs.length);
    return Promise.all(configs.map((config) => this.send<T>(config)));
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: WSRequestInterceptor): () => void {
    this._requestInterceptors.push(interceptor);
    return () => {
      const index = this._requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this._requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: WSResponseInterceptor): () => void {
    this._responseInterceptors.push(interceptor);
    return () => {
      const index = this._responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this._responseInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * 添加错误拦截器
   */
  addErrorInterceptor(interceptor: WSErrorInterceptor): () => void {
    this._errorInterceptors.push(interceptor);
    return () => {
      const index = this._errorInterceptors.indexOf(interceptor);
      if (index > -1) {
        this._errorInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * 添加事件监听器
   */
  on<K extends keyof WSEventMap>(event: K, listener: (event: WSEventMap[K]) => void): () => void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, new Set());
    }
    this._eventListeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  /**
   * 添加一次性事件监听器
   */
  once<K extends keyof WSEventMap>(event: K, listener: (event: WSEventMap[K]) => void): () => void {
    const onceListener = (e: WSEventMap[K]) => {
      listener(e);
      this.off(event, onceListener);
    };
    return this.on(event, onceListener);
  }

  /**
   * 移除事件监听器
   */
  off<K extends keyof WSEventMap>(event: K, listener: (event: WSEventMap[K]) => void): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this._eventListeners.delete(event);
      }
    }
  }

  /**
   * 获取当前活跃的请求数量
   */
  getActiveRequestCount(): number {
    return this._activeRequests;
  }

  /**
   * 获取待处理的请求数量
   */
  getPendingRequestCount(): number {
    return this._pendingRequests.size + this._requestQueue.length;
  }

  /**
   * 清理所有待处理的请求
   */
  clearPendingRequests(): void {
    const count = this._pendingRequests.size + this._requestQueue.length;

    // 取消所有待处理的请求
    for (const task of this._pendingRequests.values()) {
      task.cancel();
    }
    this._pendingRequests.clear();

    // 清空请求队列
    this._requestQueue.length = 0;

    this.logger.i(MESSAGES.WEBSOCKET.CLEAR_REQUESTS, count);
  }

  /**
   * 请求编号自增长
   * @returns 当前请求编号
   */
  private nextReqId() {
    this._reqId = (this._reqId < 5000 ? this._reqId : 0) + 1;
    return this._reqId;
  }

  /**
   * 创建请求任务
   */
  private createRequestTask(config: WSRequestConfig): WSRequestTask {
    const id = this.nextReqId();
    const task: WSRequestTask = {
      id,
      config,
      timestamp: Date.now(),
      retryCount: 0,
      cancel: () => {},
      completed: false,
    };
    return task;
  }

  /**
   * 执行请求
   */
  private async executeRequest<T>(task: WSRequestTask, config: WSRequestConfig): Promise<WSResponse<T>> {
    this._activeRequests++;

    try {
      if (!this.isConnected) {
        throw new WSError(WSErrorCodes.CONNECTION_CLOSED, MESSAGES.WEBSOCKET.ERROR_CODE_6);
      }

      // 添加消息ID
      const message = { ...config.message, id: task.id, timestamp: Date.now() };

      // 发送消息
      const data = this._options?.parser?.encode(message);
      this._ws!.send(data);

      this.logger.df(MESSAGES.WEBSOCKET.SEND_MESSAGE, task.id);

      if (config.needResponse !== false) {
        // 等待响应
        return await this.waitForResponse<T>(task, config);
      }

      // 返回一个空响应
      return {
        requestId: task.id,
        data: undefined as T,
        success: true,
        timestamp: Date.now(),
      };
    } catch (error) {
      const wsError = this.wrapError(error);

      // 应用错误拦截器
      let finalError = wsError;
      for (const interceptor of this._errorInterceptors) {
        try {
          finalError = await interceptor(finalError);
        } catch (e) {
          this.logger.ef(MESSAGES.WEBSOCKET.INTERCEPTOR_ERROR, e);
        }
      }

      // 检查是否需要重试
      if (task.retryCount < (config.retryCount || 3)) {
        return this.retryRequest<T>(task, config);
      }

      throw finalError;
    } finally {
      this._activeRequests--;
      this.processQueue();
    }
  }

  /**
   * 等待响应
   */
  private async waitForResponse<T>(task: WSRequestTask, config: WSRequestConfig): Promise<WSResponse<T>> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this._pendingRequests.delete(task.id);
        reject(new WSError(WSErrorCodes.REQUEST_TIMEOUT, MESSAGES.WEBSOCKET.ERROR_CODE_7));
      }, config.timeout);

      // 保存取消函数
      task.cancel = () => {
        clearTimeout(timeout);
        this._pendingRequests.delete(task.id);
        reject(new WSError(WSErrorCodes.REQUEST_CANCELLED, MESSAGES.WEBSOCKET.ERROR_CODE_3));
      };

      this._pendingRequests.set(task.id, {
        ...task,
        config,
        resolve: (response: WSResponse<T>) => {
          clearTimeout(timeout);
          this._pendingRequests.delete(task.id);
          resolve(response);
        },
        reject: (error: any) => {
          clearTimeout(timeout);
          this._pendingRequests.delete(task.id);
          reject(error);
        },
      });
    });
  }

  /**
   * 重试请求
   */
  private async retryRequest<T>(task: WSRequestTask, config: WSRequestConfig): Promise<WSResponse<T>> {
    task.retryCount++;
    this.logger.wf(MESSAGES.HTTP.RETRYING, task.retryCount, config.retryCount || 3, task.id);

    // 等待重试延迟
    await new Promise((resolve) => setTimeout(resolve, config.retryDelay || 1000));

    return this.executeRequest<T>(task, config);
  }

  /**
   * 建立连接
   */
  private async internalConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._state = WSState.CONNECTING;
      this.logger.df(MESSAGES.WEBSOCKET.CONNECTING, this._url);

      try {
        // 构建协议列表
        let protocols: string[] = [];

        // 添加自定义协议
        if (this._options?.protocols) {
          if (typeof this._options.protocols === 'string') {
            protocols.push(this._options.protocols);
          } else {
            protocols.push(...this._options.protocols);
          }
        }

        // 如果没有协议，传入 undefined
        const finalProtocols = protocols.length > 0 ? protocols : undefined;

        this._ws = new WebSocket(this._url!, finalProtocols);
        this._ws.binaryType = 'arraybuffer';

        const connectTimeout = setTimeout(() => {
          this._state = WSState.CLOSED;
          this._ws = null;
          reject(new WSError(WSErrorCodes.CONNECT_TIMEOUT, MESSAGES.WEBSOCKET.ERROR_CODE_8));
        }, this._options?.connectTimeout || 10000);

        this._ws.onopen = (event) => {
          clearTimeout(connectTimeout);
          this._state = WSState.OPEN;
          this._reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('open', event);
          this.logger.i(MESSAGES.WEBSOCKET.CONNECTED, this._url);

          // 重发保留的请求
          this.retryQueuedRequests();

          resolve();
        };

        this._ws.onclose = (event) => {
          clearTimeout(connectTimeout);
          this.handleClose(event);
          this.emit('close', event);
        };

        this._ws.onerror = (event) => {
          clearTimeout(connectTimeout);
          const error = new WSError(WSErrorCodes.NETWORK_ERROR, MESSAGES.WEBSOCKET.ERROR_CODE_9);
          this.emit('error', event);

          if (this._state === WSState.CONNECTING) {
            reject(error);
          }
        };

        this._ws.onmessage = (event) => {
          this.handleMessage(event);
        };
      } catch (error) {
        reject(this.wrapError(error));
      }
    });
  }

  /**
   * 处理连接关闭
   */
  private handleClose(event: CloseEvent): void {
    this._state = WSState.CLOSED;
    this.clearHeartbeatTimer();
    this.clearHeartbeatTimeoutTimer();

    // 取消所有待处理的请求（已发送但未收到响应的）
    for (const task of this._pendingRequests.values()) {
      if (task.reject) {
        task.reject(new WSError(WSErrorCodes.CONNECTION_CLOSED, MESSAGES.WEBSOCKET.ERROR_CODE_6));
      }
    }
    this._pendingRequests.clear();

    // 处理请求队列中的请求（因并发限制未发送的）
    if (!this._options?.retainPendingRequests) {
      // 如果不保留未发送的请求，清空队列并拒绝所有请求
      this.rejectQueuedRequests(new WSError(WSErrorCodes.CONNECTION_CLOSED, MESSAGES.WEBSOCKET.ERROR_CODE_15));
    } else {
      this.logger.df(MESSAGES.WEBSOCKET.RETAIN_PENDING_REQUESTS, this._requestQueue.length);
    }

    // 检查是否需要自动重连
    if (
      this._options?.autoReconnect &&
      event.code !== 1000 &&
      this._reconnectAttempts < (this._options.maxReconnectAttempts || 5)
    ) {
      this.scheduleReconnect();
    }
  }

  /**
   * 拒绝队列中的所有请求
   */
  private rejectQueuedRequests(error: WSError): void {
    const queuedTasks = this._requestQueue.splice(0);
    for (const task of queuedTasks) {
      task.cancel();
      if (task.config.needResponse !== false && task.reject) {
        task.reject(error);
      }
    }
  }

  /**
   * 重发队列中的请求
   */
  private retryQueuedRequests(): void {
    if (!this._options?.autoRetryPendingRequests || this._requestQueue.length === 0) {
      return;
    }

    const pendingTasks = this._requestQueue.splice(0);
    this.logger.i(`重发 ${pendingTasks.length} 个保留的请求`);

    // 异步执行重发，避免阻塞连接流程
    setTimeout(() => {
      for (const task of pendingTasks) {
        this.executeRequest(task, task.config).catch((error) => {
          this.logger.ef(`重发请求 ${task.id} 失败:`, error);
        });
      }
    }, 100); // 延迟 100ms 执行，确保连接稳定
  }

  /**
   * 处理接收到的消息
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      // 解析消息
      const message: WSMessage = this._options.parser.decode(event.data);

      // 处理心跳响应
      if (message.cmd === 0) {
        this.handleHeartbeatResponse(message);
        return;
      }

      // 处理普通消息响应
      this.logger.df(MESSAGES.WEBSOCKET.RECEIVE_MESSAGE, message.cmd);
      if (message.id) {
        const task = this._pendingRequests.get(message.id);
        if (task && task.resolve) {
          const response: WSResponse = {
            requestId: message.id,
            data: message.data,
            success: true,
            timestamp: message.timestamp || Date.now(),
          };

          // 应用响应拦截器
          let finalResponse = response;
          for (const interceptor of this._responseInterceptors) {
            try {
              finalResponse = await interceptor(finalResponse);
            } catch (error) {
              this.logger.ef(MESSAGES.WEBSOCKET.INTERCEPTOR_ERROR, error);
            }
          }

          task.resolve(finalResponse);
          return;
        }
      }

      // 触发消息事件
      this.emit('message', event);
    } catch (error) {
      this.logger.ef(MESSAGES.WEBSOCKET.PARSE_ERROR, error);
      this.emit('error', event);
    }
  }

  /**
   * 处理心跳响应
   */
  private handleHeartbeatResponse(_message: WSMessage): void {
    this.clearHeartbeatTimeoutTimer();

    const latency = Date.now() - this._lastHeartbeatTimestamp;
    this.emit('heartbeat', { latency });
    this.logger.df(MESSAGES.WEBSOCKET.HEARTBEAT_RECEIVED, latency);
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.clearHeartbeatTimer();

    this._heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this._lastHeartbeatTimestamp = Date.now();
        const heartbeatMessage: WSMessage = {
          cmd: 0,
          data: { timestamp: this._lastHeartbeatTimestamp },
        };

        try {
          this.sendOneWay(heartbeatMessage);
          this.logger.d(MESSAGES.WEBSOCKET.HEARTBEAT_SENT);

          // 设置心跳超时，如果超时则关闭连接
          this._heartbeatTimeoutTimer = setTimeout(() => {
            this.logger.e(MESSAGES.WEBSOCKET.HEARTBEAT_TIMEOUT);
            this._ws?.close(1000, MESSAGES.WEBSOCKET.ERROR_CODE_10);
          }, this._options.heartbeatTimeout);
        } catch (error) {
          this.logger.e(MESSAGES.WEBSOCKET.ERROR_CODE_11, error);
        }
      }
    }, this._options.heartbeatInterval);
  }

  /**
   * 清理心跳计时器
   */
  private clearHeartbeatTimer(): void {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = undefined;
    }
  }

  /**
   * 清理心跳超时计时器
   */
  private clearHeartbeatTimeoutTimer(): void {
    if (this._heartbeatTimeoutTimer) {
      clearTimeout(this._heartbeatTimeoutTimer);
      this._heartbeatTimeoutTimer = undefined;
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    this._reconnectAttempts++;
    this.logger.wf(
      MESSAGES.WEBSOCKET.RECONNECTING,
      this._reconnectAttempts,
      this._options?.maxReconnectAttempts || 5,
      this._url
    );

    this.emit('reconnecting', {
      attempt: this._reconnectAttempts,
      maxAttempts: this._options?.maxReconnectAttempts || 5,
    });

    this._reconnectTimer = setTimeout(async () => {
      try {
        await this.internalConnect();
        this.logger.if(MESSAGES.WEBSOCKET.RECONNECTED, this._reconnectAttempts);
        this.emit('reconnected', { attempt: this._reconnectAttempts });
      } catch (error) {
        this.logger.ef(MESSAGES.WEBSOCKET.CONNECTION_FAILED, error);
        if (this._reconnectAttempts >= (this._options?.maxReconnectAttempts || 5)) {
          this.logger.ef(MESSAGES.WEBSOCKET.RECONNECT_FAILED, this._options?.maxReconnectAttempts || 5);
        }
      }
    }, this._options?.reconnectDelay);
  }

  /**
   * 清理重连计时器
   */
  private clearReconnectTimer(): void {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = undefined;
    }
  }

  /**
   * 处理请求队列
   */
  private processQueue(): void {
    if (this._requestQueue.length > 0 && this._activeRequests < (this._options?.maxConcurrency || 10)) {
      const task = this._requestQueue.shift()!;
      this.executeRequest(task, task.config).catch(() => {
        // 错误已在 _executeRequest 中处理
      });
    }
  }

  /**
   * 触发事件
   */
  private emit<K extends keyof WSEventMap>(event: K, data: WSEventMap[K]): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          this.logger.e(literal.fmt(MESSAGES.WEBSOCKET.ERROR_CODE_12, event), error);
        }
      });
    }
  }

  /**
   * 包装错误
   */
  private wrapError(error: any): WSError {
    if (error instanceof WSError) {
      return error;
    }

    if (error instanceof Error) {
      return new WSError(WSErrorCodes.UNKNOWN_ERROR, error.message, error);
    }

    return new WSError(WSErrorCodes.UNKNOWN_ERROR, String(error), error);
  }

  /**
   * 初始化服务
   */
  initialize(): void {
    // 监听应用生命周期事件
    this.setupLifecycleListeners();
  }

  /**
   * 设置生命周期监听器
   */
  private setupLifecycleListeners(): void {
    const eventBus = this.resolve<IEventBus>(SERVICES.EVENT_BUS);
    if (eventBus && eventBus.app) {
      // 监听进入后台事件
      eventBus.app.on(EVENTS.APP.ENTER_BACKGROUND, this.onEnterBackground, this);
      // 监听返回前台事件
      eventBus.app.on(EVENTS.APP.ENTER_FOREGROUND, this.onEnterForeground, this);
    }
  }

  /**
   * 进入后台时的处理
   */
  private onEnterBackground(): void {
    // 记录进入后台前的连接状态
    this._connectionStateBeforeBackground = this.isConnected;

    // 清理心跳计时器（节省资源）
    this.clearHeartbeatTimer();
    this.clearHeartbeatTimeoutTimer();
  }

  /**
   * 返回前台时的处理
   */
  private onEnterForeground(): void {
    const diff = this.resolve<IAppLauncher>(SERVICES.APP_LAUNCHER).elapsed;
    // 如果之前是连接状态，且驻留后台时长超过指定时间，则检测连接是否仍然有效
    if (diff >= this._options.timeToPing && this._connectionStateBeforeBackground) {
      this.checkConnectionOnForeground();
    }
  }

  /**
   * 在返回前台时检测连接状态
   */
  private async checkConnectionOnForeground(): Promise<void> {
    if (this._isCheckingConnection) {
      return;
    }

    this._isCheckingConnection = true;
    this._lastConnectionCheckTimestamp = Date.now();

    try {
      // 如果 WebSocket 已经关闭或不存在，尝试重连
      if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
        this.logger.w(MESSAGES.WEBSOCKET.ERROR_CODE_16);
        await this.reconnectIfNeeded();
        return;
      }
      // 如果连接仍然打开，发送一个轻量级的心跳来验证连接活性
      await this.pingConnection();
    } catch (error) {
      this.logger.e(MESSAGES.WEBSOCKET.ERROR_CODE_17, error);
      // 检测失败，尝试重连
      await this.reconnectIfNeeded();
    } finally {
      this._isCheckingConnection = false;
    }
  }

  /**
   * Ping 连接以检测活性
   */
  private async pingConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
        reject(new WSError(WSErrorCodes.CONNECTION_CLOSED, MESSAGES.WEBSOCKET.ERROR_CODE_13));
        return;
      }

      // 如果 3 秒内没有收到 pong，认为连接无效
      const pingTimeout = setTimeout(() => {
        reject(new WSError(WSErrorCodes.REQUEST_TIMEOUT, MESSAGES.WEBSOCKET.ERROR_CODE_14));
      }, this._options.timeToPong);

      // 创建一个特殊的 ping 消息
      const pingMessage: WSMessage = {
        id: this.nextReqId(),
        cmd: MsgId.PING,
        data: {
          timestamp: Date.now(),
        },
      };

      const data = this._options?.parser?.encode?.(pingMessage);
      this._ws.send(data);

      // 监听 pong 响应
      const onMessage = (event: MessageEvent) => {
        try {
          const message: WSMessage = this._options.parser.decode(event.data);

          if (message.cmd === MsgId.PONG) {
            clearTimeout(pingTimeout);
            this._ws?.removeEventListener('message', onMessage);
            if (message.data.timestamp === pingMessage.data.timestamp) {
              this.logger.i(MESSAGES.WEBSOCKET.PING_CONNECTION_SUCCESS);
              resolve();
            }
          }
        } catch (error) {
          // 忽略解析错误，继续等待
        }
      };

      this._ws.addEventListener('message', onMessage);
    });
  }

  /**
   * 如果需要，重新连接
   */
  private async reconnectIfNeeded(): Promise<void> {
    if (!this._url) {
      this.logger.e(MESSAGES.WEBSOCKET.ERROR_CODE_18);
      return;
    }

    // 如果当前正在连接或已连接，不需要重连
    if (this._state === WSState.CONNECTING || this._state === WSState.OPEN) {
      return;
    }

    try {
      this.logger.d(MESSAGES.WEBSOCKET.ERROR_CODE_19);
      await this.internalConnect();
      // 重连成功，恢复心跳
      this.startHeartbeat();
      this.logger.d(MESSAGES.WEBSOCKET.ERROR_CODE_20);
    } catch (error) {
      this.logger.e(MESSAGES.WEBSOCKET.ERROR_CODE_21, error);
      // 如果重连失败，启动自动重连机制
      if (this._options?.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * 手动检测连接状态
   * @returns Promise<boolean> 连接是否正常
   */
  async checkConnection(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      await this.pingConnection();
      return true;
    } catch (error) {
      this.logger.w(MESSAGES.WEBSOCKET.ERROR_CODE_22, error);
      return false;
    }
  }

  /**
   * 获取连接统计信息
   */
  getConnectionStats() {
    return {
      state: this._state,
      isConnected: this.isConnected,
      url: this._url,
      activeRequests: this._activeRequests,
      pendingRequests: this._pendingRequests.size,
      queuedRequests: this._requestQueue.length,
      reconnectAttempts: this._reconnectAttempts,
      lastHeartbeat: this._lastHeartbeatTimestamp,
      lastConnectionCheck: this._lastConnectionCheckTimestamp,
      isCheckingConnection: this._isCheckingConnection,
      connectionStateBeforeBackground: this._connectionStateBeforeBackground,
      options: {
        maxConcurrency: this._options?.maxConcurrency,
        autoReconnect: this._options?.autoReconnect,
        maxReconnectAttempts: this._options?.maxReconnectAttempts,
        heartbeatInterval: this._options?.heartbeatInterval,
        enableCompression: this._options?.enableCompression,
        retainPendingRequests: this._options?.retainPendingRequests,
        autoRetryPendingRequests: this._options?.autoRetryPendingRequests,
      },
    };
  }
}
