import { Service } from '../core';
import {
  CancelToken,
  HttpConcurrencyConfig,
  HttpError,
  HttpErrorCode,
  HttpErrorInterceptor,
  HttpHeaders,
  HttpInterceptorManager,
  HttpMethod,
  HttpRequestConfig,
  HttpRequestInterceptor,
  HttpResponse,
  HttpResponseInterceptor,
  IHttpService,
  QueryValue
} from '../interfaces';
import { MESSAGES } from '../macro';

/**
 * 将对象转换为查询字符串
 * @param dict 字典（不允许嵌套）
 * @returns
 */
export function toQueryString(dict: Record<string, QueryValue>): string {
  const parts: string[] = [];

  for (let k in dict) {
    const v = dict[k];
    if (v === undefined || v === null) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }

  return parts.join('&');
}

/**
 * 将查询字符串转换为对象
 * @param query 查询字符串（不允许嵌套）
 * @returns
 */
export function fromQueryString(query: string): Record<string, string> {
  const dict: Record<string, string> = {};
  const parts = query.replace(/^[?&]/, '').split('&');

  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k) {
      dict[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }

  return dict;
}

/**
 * HTTP 请求服务实现
 */
export class HttpClient extends Service implements IHttpService {
  public readonly token: string = MESSAGES.HTTP.CATEGORY;

  /** 默认配置 */
  public defaults: HttpRequestConfig = {
    url: '', // 默认空字符串，实际请求时必须提供
    route: '', // 默认空字符串，实际请求时必须提供
    method: HttpMethod.Get,
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000,
    responseType: 'json',
    withCredentials: false,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  /** 并发控制配置 */
  public concurrency: HttpConcurrencyConfig = {
    maxConcurrent: 6,
    queueLimit: 100,
  };

  /** 拦截器管理器 */
  public readonly interceptors: HttpInterceptorManager = new HttpInterceptorManagerImpl();

  /** 活跃请求集合 */
  private readonly _activeRequests: Set<HttpRequestContext> = new Set();

  /** 等待队列 */
  private readonly _requestQueue: HttpRequestContext[] = [];

  /** 取消令牌映射 */
  private readonly _cancelTokens: Map<string, CancelTokenImpl> = new Map();

  /** 标签到请求的映射 */
  private readonly _taggedRequests: Map<string, Set<HttpRequestContext>> = new Map();

  /**
   * 获取当前活跃请求数量
   */
  get activeRequestCount(): number {
    return this._activeRequests.size;
  }

  /**
   * 获取当前队列中请求数量
   */
  get queuedRequestCount(): number {
    return this._requestQueue.length;
  }

  /**
   * 发送请求
   */
  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    try {
      // 合并默认配置
      const finalConfig = this.mergeConfig(config);

      // 创建请求上下文
      const context = new HttpRequestContext(finalConfig);

      // 应用请求拦截器
      const interceptedConfig = await this.interceptors.requestChain(finalConfig);
      context.config = interceptedConfig;

      // 检查是否已取消
      if (context.cancelled) {
        throw new HttpError(
          MESSAGES.HTTP.CANCELLED,
          HttpErrorCode.CANCELLED,
          0,
          context.config.url + context.config.route,
          context.config.method!,
          context.config
        );
      }

      // 添加到队列或立即执行
      if (this._activeRequests.size >= this.concurrency.maxConcurrent) {
        if (this._requestQueue.length >= (this.concurrency.queueLimit ?? 100)) {
          throw new HttpError(
            MESSAGES.HTTP.CONCURRENCY_LIMIT_EXCEEDED,
            HttpErrorCode.CONCURRENCY_LIMIT_EXCEEDED,
            0,
            context.config.url + context.config.route,
            context.config.method!,
            context.config
          );
        }
        this._requestQueue.push(context);
        this.logger.wf(MESSAGES.HTTP.QUEUED, context.config.url + context.config.route);
      } else {
        this.executeRequest(context);
      }

      // 等待请求完成
      return await context.promise;
    } catch (error) {
      // 记录错误
      this.logger.e(MESSAGES.HTTP.NETWORK_ERROR, error);
      throw error;
    }
  }

  /**
   * GET 请求
   */
  get<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, route: url, method: HttpMethod.Get });
  }

  /**
   * POST 请求
   */
  post<T = any>(url: string, data?: any, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, route: url, method: HttpMethod.Post, data });
  }

  /**
   * PUT 请求
   */
  put<T = any>(url: string, data?: any, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, route: url, method: HttpMethod.Put, data });
  }

  /**
   * DELETE 请求
   */
  delete<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, route: url, method: HttpMethod.Delete });
  }

  /**
   * PATCH 请求
   */
  patch<T = any>(url: string, data?: any, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ ...config, route: url, method: HttpMethod.Patch, data });
  }

  /**
   * 创建取消令牌
   */
  createCancelToken(): CancelToken {
    const token = new CancelTokenImpl();
    this._cancelTokens.set(token.id, token);
    return token;
  }

  /**
   * 根据标签取消请求
   */
  cancelByTag(tag: string, reason?: string): void {
    const requests = this._taggedRequests.get(tag);
    if (requests) {
      for (const request of requests) {
        request.cancel(reason);
      }
      this._taggedRequests.delete(tag);
    }
  }

  /**
   * 取消所有请求
   */
  cancelAll(reason?: string): void {
    // 取消活跃请求
    for (const request of this._activeRequests) {
      request.cancel(reason);
    }

    // 取消队列中的请求
    for (const request of this._requestQueue) {
      request.cancel(reason);
    }

    this._requestQueue.length = 0;
    this._taggedRequests.clear();
  }

  /**
   * 执行请求
   */
  private async executeRequest(context: HttpRequestContext): Promise<void> {
    this._activeRequests.add(context);

    // 处理标签
    if (context.config.tag) {
      const tagged = this._taggedRequests.get(context.config.tag) ?? new Set();
      tagged.add(context);
      this._taggedRequests.set(context.config.tag, tagged);
    }

    try {
      const response = await this.performRequestWithRetry(context);
      context.resolve(response);
    } catch (error) {
      context.reject(error);
    } finally {
      this.finishRequest(context);
    }
  }

  /**
   * 带重试的请求执行
   */
  private async performRequestWithRetry(context: HttpRequestContext): Promise<HttpResponse> {
    let lastError: any;
    const retryCount = context.config.retryCount ?? this.defaults.retryCount!;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        // 执行实际请求
        const response = await this.performRequest(context);

        // 应用响应拦截器
        return await this.interceptors.responseChain(response);
      } catch (error) {
        lastError = error;

        // 如果是最后一次尝试或错误不可重试，直接抛出
        if (attempt === retryCount || !this.isRetryableError(error)) {
          // 应用错误拦截器
          throw await this.interceptors.errorChain(error);
        }

        // 等待重试延迟
        const delay = context.config.retryDelay ?? this.defaults.retryDelay!;
        await this.delay(delay * (attempt + 1)); // 指数退避
        this.logger.wf(MESSAGES.HTTP.RETRYING, attempt + 1, retryCount, context.config.url + context.config.route);
      }
    }

    throw lastError;
  }

  /**
   * 执行实际的网络请求
   */
  private async performRequest(context: HttpRequestContext): Promise<HttpResponse> {
    const { config } = context;
    const xhr = new XMLHttpRequest();
    context.xhr = xhr;

    // 绑定取消令牌
    if (config.cancelToken) {
      config.cancelToken.bind(xhr);
    }

    return new Promise((resolve, reject) => {
      // 设置超时
      if (config.timeout && config.timeout > 0) {
        xhr.timeout = config.timeout;
      }

      // 处理进度回调
      if (config.onUploadProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = event.loaded / event.total;
            config.onUploadProgress!(progress);
          }
        });
      }

      if (config.onDownloadProgress) {
        xhr.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = event.loaded / event.total;
            config.onDownloadProgress!(progress);
          }
        });
      }

      // 处理响应
      xhr.onreadystatechange = () => {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          // 检查响应状态
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              // 解析响应数据
              const data = this.parseResponse(xhr, config.responseType);

              // 构建响应对象
              const response: HttpResponse = {
                data,
                status: xhr.status,
                statusText: xhr.statusText,
                headers: this.parseHeaders(xhr),
                config,
                xhr,
              };

              resolve(response);
            } catch (parseError) {
              reject(
                new HttpError(
                  MESSAGES.HTTP.PARSE_ERROR,
                  HttpErrorCode.PARSE_ERROR,
                  xhr.status,
                  config.url + config.route,
                  config.method!,
                  config,
                  xhr
                )
              );
            }
          } else {
            // HTTP 错误
            const errorCode = this.getErrorCodeByStatus(xhr.status);
            reject(
              new HttpError(
                `HTTP ${xhr.status}: ${xhr.statusText}`,
                errorCode,
                xhr.status,
                config.url + config.route,
                config.method!,
                config,
                xhr
              )
            );
          }
        }
      };

      // 处理错误
      xhr.onerror = () => {
        reject(
          new HttpError(
            MESSAGES.HTTP.NETWORK_ERROR,
            HttpErrorCode.NETWORK_ERROR,
            0,
            config.url + config.route,
            config.method!,
            config,
            xhr
          )
        );
      };

      xhr.ontimeout = () => {
        reject(
          new HttpError(
            MESSAGES.HTTP.TIMEOUT,
            HttpErrorCode.TIMEOUT,
            0,
            config.url + config.route,
            config.method!,
            config,
            xhr
          )
        );
      };

      xhr.onabort = () => {
        const reason = config.cancelToken?.reason || MESSAGES.HTTP.CANCELLED;
        reject(
          new HttpError(reason, HttpErrorCode.CANCELLED, 0, config.url + config.route, config.method!, config, xhr)
        );
      };

      // 发送请求
      try {
        xhr.open(config.method!, config.url + config.route, true);

        // 设置请求头
        if (config.headers) {
          for (const [key, value] of Object.entries(config.headers)) {
            xhr.setRequestHeader(key, String(value));
          }
        }

        // 设置凭证
        if (config.withCredentials) {
          xhr.withCredentials = true;
        }

        // 设置响应类型
        if (config.responseType && config.responseType !== 'json') {
          xhr.responseType = config.responseType as XMLHttpRequestResponseType;
        }

        const body = this.buildRequestBody(config.data, config.headers);
        xhr.send(body);
      } catch (error) {
        reject(
          new HttpError(
            MESSAGES.HTTP.SEND_ERROR,
            HttpErrorCode.NETWORK_ERROR,
            0,
            config.url + config.route,
            config.method!,
            config,
            xhr
          )
        );
      }
    });
  }

  /**
   * 完成请求处理
   */
  private finishRequest(context: HttpRequestContext): void {
    this._activeRequests.delete(context);

    // 处理标签
    if (context.config.tag) {
      const tagged = this._taggedRequests.get(context.config.tag);
      if (tagged) {
        tagged.delete(context);
        if (tagged.size === 0) {
          this._taggedRequests.delete(context.config.tag);
        }
      }
    }

    // 处理队列中的下一个请求
    if (this._requestQueue.length > 0) {
      const nextContext = this._requestQueue.shift()!;
      this.executeRequest(nextContext);
    }
  }

  /**
   * 合并配置
   */
  private mergeConfig(config: HttpRequestConfig): HttpRequestConfig {
    return {
      ...this.defaults,
      ...config,
      headers: {
        ...this.defaults.headers,
        ...config.headers,
      },
    };
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryableError(error: any): boolean {
    return error instanceof HttpError && error.isRetryable;
  }

  /**
   * 根据状态码获取错误代码
   */
  private getErrorCodeByStatus(status: number): HttpErrorCode {
    if (status >= 400 && status < 500) {
      return HttpErrorCode.CLIENT_ERROR;
    } else if (status >= 500) {
      return HttpErrorCode.SERVER_ERROR;
    }
    return HttpErrorCode.NETWORK_ERROR;
  }

  /**
   * 构建请求体
   */
  private buildRequestBody(data?: any, headers?: HttpHeaders): any {
    if (data === null || data === undefined) {
      return null;
    }

    if (
      typeof data === 'string' ||
      data instanceof ArrayBuffer ||
      data instanceof Blob ||
      data instanceof FormData ||
      data instanceof URLSearchParams
    ) {
      return data;
    }

    // 处理对象类型
    if (typeof data === 'object') {
      const contentType = headers?.['Content-Type'];

      if (contentType === 'application/x-www-form-urlencoded') {
        return toQueryString(data as Record<string, QueryValue>);
      }

      if (contentType === 'multipart/form-data') {
        const formData = new FormData();
        for (const [key, value] of Object.entries(data)) {
          formData.append(key, String(value));
        }
        return formData;
      }

      // 默认使用 JSON
      return JSON.stringify(data);
    }

    return String(data);
  }

  /**
   * 解析响应数据
   */
  private parseResponse(xhr: XMLHttpRequest, responseType?: string): any {
    switch (responseType) {
      case 'json':
        return JSON.parse(xhr.responseText);
      case 'text':
        return xhr.responseText;
      case 'blob':
        return xhr.response;
      case 'arrayBuffer':
        return xhr.response;
      case 'formData':
        return xhr.response;
      default:
        // 尝试自动解析
        const contentType = xhr.getResponseHeader('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          try {
            return JSON.parse(xhr.responseText);
          } catch {
            // 如果解析失败，返回原始文本
          }
        }
        return xhr.responseText;
    }
  }

  /**
   * 解析响应头
   */
  private parseHeaders(xhr: XMLHttpRequest): HttpHeaders {
    const headersString = xhr.getAllResponseHeaders();
    const headers: HttpHeaders = {};

    if (!headersString) {
      return headers;
    }

    const headerLines = headersString.split('\r\n');
    for (const line of headerLines) {
      const [key, ...valueParts] = line.split(':');
      if (key) {
        const value = valueParts.join(':').trim();
        headers[key.trim()] = value;
      }
    }

    return headers;
  }
}

/**
 * 请求上下文
 */
class HttpRequestContext {
  public promise: Promise<HttpResponse>;
  private _resolve!: (value: HttpResponse) => void;
  private _reject!: (reason: any) => void;
  private _cancelled = false;
  public xhr?: XMLHttpRequest;

  constructor(public config: HttpRequestConfig) {
    this.promise = new Promise<HttpResponse>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  get cancelled(): boolean {
    return this._cancelled;
  }

  resolve(value: HttpResponse): void {
    this._resolve(value);
  }

  reject(reason: any): void {
    this._reject(reason);
  }

  cancel(reason?: string): void {
    if (!this._cancelled) {
      this._cancelled = true;
      if (this.xhr) {
        this.xhr.abort();
      }
      this._reject(
        new HttpError(
          reason || MESSAGES.HTTP.CANCELLED,
          HttpErrorCode.CANCELLED,
          0,
          this.config.url + this.config.route,
          this.config.method!,
          this.config,
          this.xhr
        )
      );
    }
  }
}

/**
 * 取消令牌实现
 */
class CancelTokenImpl implements CancelToken {
  public readonly id = `cancel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  public cancelled = false;
  public reason?: string;
  private _xhr?: XMLHttpRequest;

  cancel(reason?: string): void {
    if (!this.cancelled) {
      this.cancelled = true;
      this.reason = reason;
      if (this._xhr) {
        this._xhr.abort();
      }
    }
  }

  bind(xhr: XMLHttpRequest): void {
    this._xhr = xhr;
    if (this.cancelled) {
      xhr.abort();
    }
  }
}

/**
 * 拦截器管理器实现
 */
class HttpInterceptorManagerImpl implements HttpInterceptorManager {
  private readonly _requestInterceptors: Array<{ id: number; interceptor: HttpRequestInterceptor }> = [];
  private readonly _responseInterceptors: Array<{ id: number; interceptor: HttpResponseInterceptor }> = [];
  private readonly _errorInterceptors: Array<{ id: number; interceptor: HttpErrorInterceptor }> = [];
  private _nextId = 0;

  request(interceptor: HttpRequestInterceptor): number {
    const id = this._nextId++;
    this._requestInterceptors.push({ id, interceptor });
    return id;
  }

  ejectRequest(id: number): void {
    const index = this._requestInterceptors.findIndex((item) => item.id === id);
    if (index !== -1) {
      this._requestInterceptors.splice(index, 1);
    }
  }

  response(interceptor: HttpResponseInterceptor): number {
    const id = this._nextId++;
    this._responseInterceptors.push({ id, interceptor });
    return id;
  }

  ejectResponse(id: number): void {
    const index = this._responseInterceptors.findIndex((item) => item.id === id);
    if (index !== -1) {
      this._responseInterceptors.splice(index, 1);
    }
  }

  responseError(interceptor: HttpErrorInterceptor): number {
    const id = this._nextId++;
    this._errorInterceptors.push({ id, interceptor });
    return id;
  }

  ejectResponseError(id: number): void {
    const index = this._errorInterceptors.findIndex((item) => item.id === id);
    if (index !== -1) {
      this._errorInterceptors.splice(index, 1);
    }
  }

  async requestChain(config: HttpRequestConfig): Promise<HttpRequestConfig> {
    let processedConfig = config;

    for (const { interceptor } of this._requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }

    return processedConfig;
  }

  async responseChain<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let processedResponse = response;

    for (const { interceptor } of this._responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }

    return processedResponse;
  }

  async errorChain(error: any): Promise<any> {
    let processedError = error;

    for (const { interceptor } of this._errorInterceptors) {
      try {
        processedError = await interceptor(processedError);
      } catch (interceptorError) {
        // 拦截器本身出错，返回原始错误
        break;
      }
    }

    return processedError;
  }
}
