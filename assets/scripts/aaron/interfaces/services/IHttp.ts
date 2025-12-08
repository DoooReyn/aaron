import { IService } from '../IService';

/**
 * HTTP 错误类
 */
export class HttpError extends Error {
  readonly code: string;
  readonly status: number;
  readonly url: string;
  readonly method: HttpMethod;
  readonly headers?: any;
  readonly body?: any;
  readonly xhr?: XMLHttpRequest;
  readonly config: HttpRequestConfig;
  readonly isRetryable: boolean;

  constructor(
    message: string,
    code: string,
    status: number,
    url: string,
    method: HttpMethod,
    config: HttpRequestConfig,
    xhr?: XMLHttpRequest,
    body?: any
  ) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
    this.status = status;
    this.url = url;
    this.method = method;
    this.config = config;
    this.headers = xhr?.getAllResponseHeaders();
    this.body = body;
    this.xhr = xhr;

    // 判断是否可重试
    this.isRetryable = this._isRetryable(code, status);
  }

  private _isRetryable(code: string, status: number): boolean {
    switch (code) {
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return true;
      case 'SERVER_ERROR':
        return status >= 500 && status !== 501; // 501 Not Implemented 不应重试
      default:
        return false;
    }
  }
}

/** HTTP 请求方法 */
export enum HttpMethod {
  Get = 'GET',
  Post = 'POST',
  Put = 'PUT',
  Delete = 'DELETE',
  Patch = 'PATCH',
  Head = 'HEAD',
  Options = 'OPTIONS',
}

/** HTTP 请求、响应头 */
export interface HttpHeaders {
  [key: string]: string | number | boolean;
}

/** 查询字段原始值 */
export type QueryValue = string | number | boolean;

/** 请求体类型 */
export type HttpRequestBody = string | ArrayBuffer | Blob | FormData | URLSearchParams | Record<string, any> | null;

/** 响应数据类型 */
export type HttpResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';

/** 请求配置 */
export interface HttpRequestConfig {
  /** 请求 URL */
  url?: string;
  /** 请求路由 */
  route: string;
  /** 请求方法 */
  method?: HttpMethod;
  /** 请求头 */
  headers?: HttpHeaders;
  /** 请求体 */
  data?: HttpRequestBody;
  /** 查询参数 */
  params?: Record<string, QueryValue>;
  /** 响应类型 */
  responseType?: HttpResponseType;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 是否携带凭证 */
  withCredentials?: boolean;
  /** 重试次数 */
  retryCount?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 请求取消令牌 */
  cancelToken?: CancelToken;
  /** 请求标签（用于批量取消） */
  tag?: string;
  /** 上传进度回调 */
  onUploadProgress?: (progress: number) => void;
  /** 下载进度回调 */
  onDownloadProgress?: (progress: number) => void;
}

/** HTTP 响应 */
export interface HttpResponse<T = any> {
  /** 响应数据 */
  data: T;
  /** 响应状态码 */
  status: number;
  /** 响应状态文本 */
  statusText: string;
  /** 响应头 */
  headers: HttpHeaders;
  /** 请求配置 */
  config: HttpRequestConfig;
  /** 原始 XMLHttpRequest 对象 */
  xhr: XMLHttpRequest;
}

/** HTTP 错误代码 */
export enum HttpErrorCode {
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** 请求超时 */
  TIMEOUT = 'TIMEOUT',
  /** 请求被取消 */
  CANCELLED = 'CANCELLED',
  /** 服务器错误 */
  SERVER_ERROR = 'SERVER_ERROR',
  /** 客户端错误 */
  CLIENT_ERROR = 'CLIENT_ERROR',
  /** 解析错误 */
  PARSE_ERROR = 'PARSE_ERROR',
  /** 并发限制超出 */
  CONCURRENCY_LIMIT_EXCEEDED = 'CONCURRENCY_LIMIT_EXCEEDED',
}

/** 请求拦截器 */
export interface HttpRequestInterceptor {
  (config: HttpRequestConfig): HttpRequestConfig | Promise<HttpRequestConfig>;
}

/** 响应拦截器 */
export interface HttpResponseInterceptor<T = any> {
  (response: HttpResponse<T>): HttpResponse<T> | Promise<HttpResponse<T>>;
}

/** 响应错误拦截器 */
export interface HttpErrorInterceptor {
  (error: HttpError): HttpError | Promise<HttpError>;
}

/** 拦截器管理器 */
export interface HttpInterceptorManager {
  /** 添加请求拦截器 */
  request(interceptor: HttpRequestInterceptor): number;
  /** 移除请求拦截器 */
  ejectRequest(id: number): void;
  /** 添加响应拦截器 */
  response(interceptor: HttpResponseInterceptor): number;
  /** 移除响应拦截器 */
  ejectResponse(id: number): void;
  /** 添加响应错误拦截器 */
  responseError(interceptor: HttpErrorInterceptor): number;
  /** 移除响应错误拦截器 */
  ejectResponseError(id: number): void;
  /** 执行请求拦截器链 */
  requestChain(config: HttpRequestConfig): Promise<HttpRequestConfig>;
  /** 执行响应拦截器链 */
  responseChain<T>(response: HttpResponse<T>): Promise<HttpResponse<T>>;
  /** 执行错误拦截器链 */
  errorChain(error: any): Promise<any>;
}

/** 取消令牌 */
export interface CancelToken {
  /** 取消原因 */
  reason?: string;
  /** 是否已取消 */
  cancelled: boolean;
  /** 取消令牌 ID */
  readonly id: string;
  /** 取消请求 */
  cancel(reason?: string): void;
  /** 绑定 XMLHttpRequest */
  bind(xhr: XMLHttpRequest): void;
}

/** 并发控制配置 */
export interface HttpConcurrencyConfig {
  /** 最大并发数 */
  maxConcurrent: number;
  /** 队列大小限制 */
  queueLimit?: number;
}

/** HTTP 服务接口 */
export interface IHttpService extends IService {
  /** 拦截器管理器 */
  readonly interceptors: HttpInterceptorManager;
  /** 并发控制配置 */
  concurrency: HttpConcurrencyConfig;
  /** 默认配置 */
  defaults: HttpRequestConfig;

  /** 发送请求 */
  request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>>;

  /** GET 请求 */
  get<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;

  /** POST 请求 */
  post<T = any>(url: string, data?: HttpRequestBody, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;

  /** PUT 请求 */
  put<T = any>(url: string, data?: HttpRequestBody, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;

  /** DELETE 请求 */
  delete<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;

  /** PATCH 请求 */
  patch<T = any>(url: string, data?: HttpRequestBody, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>>;

  /** 创建取消令牌 */
  createCancelToken(): CancelToken;

  /** 根据标签取消请求 */
  cancelByTag(tag: string, reason?: string): void;

  /** 取消所有请求 */
  cancelAll(reason?: string): void;

  /** 获取当前活跃请求数量 */
  get activeRequestCount(): number;

  /** 获取当前队列中请求数量 */
  get queuedRequestCount(): number;
}
