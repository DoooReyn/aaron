import { IDeepProxy, IProxyOptions } from '../interfaces';

/**
 * （内部）深层代理
 * @description 提供递归代理嵌套对象的功能
 */
export class DeepProxy<T extends object> implements IDeepProxy<T> {
  /** 代理缓存 */
  private readonly _proxyCache = new WeakMap();
  /** 属性路径缓存 */
  private readonly _pathCache = new WeakMap();
  /** 深层代理配置 */
  private readonly _options: Required<IProxyOptions>;

  /**
   * 深层代理构造
   * @param _target 被代理的对象
   * @param _handler 代理处理器
   * @param options 深层代理配置
   */
  constructor(private readonly _target: T, private _handler: ProxyHandler<any>, options: IProxyOptions = {}) {
    this._options = {
      proxyArrays: false,
      proxyFunctions: false,
      maxDepth: 10,
      filter: () => true,
      ...options,
    };
  }

  /**
   * 生成深层代理
   * @returns
   */
  public create(): T {
    return this.makeDeepProxy(this._target, []);
  }

  /**
   * 生成深层代理
   * @param obj 被代理的（属性）对象
   * @param path 属性路径
   * @returns
   */
  private makeDeepProxy(obj: any, path: string[]): any {
    // 检查深度限制
    if (path.length >= this._options.maxDepth) {
      return obj;
    }

    // 基础类型检查
    if (!this.shouldProxy(obj, path)) {
      return obj;
    }

    // 缓存检查
    if (this._proxyCache.has(obj)) {
      return this._proxyCache.get(obj);
    }

    const proxy = new Proxy(obj, {
      get: (target: any, prop: string | symbol, receiver: any) => {
        const value = Reflect.get(target, prop, receiver);
        const newPath = [...path, String(prop)];

        // 递归代理嵌套对象
        if (this.shouldProxy(value, newPath)) {
          const proxiedValue = this.makeDeepProxy(value, newPath);
          this._pathCache.set(proxiedValue, newPath);
          return proxiedValue;
        }

        // 调用用户处理器
        if (this._handler.get) {
          return this._handler.get(target, prop, receiver);
        }

        return value;
      },

      set: (target: any, prop: string | symbol, value: any, receiver: any) => {
        const newPath = [...path, String(prop)];

        // 代理新设置的对象
        if (this.shouldProxy(value, newPath) && !this.isProxied(value)) {
          const proxiedValue = this.makeDeepProxy(value, newPath);
          this._pathCache.set(proxiedValue, newPath);
        }

        // 调用用户处理器
        if (this._handler.set) {
          const result = this._handler.set(target, prop, value, receiver);
          if (result) {
            Reflect.set(target, prop, value, receiver);
          }
          return result;
        }

        return Reflect.set(target, prop, value, receiver);
      },

      deleteProperty: (target: any, prop: string | symbol) => {
        const value = target[prop];
        if (this._proxyCache.has(value)) {
          const proxiedValue = this._proxyCache.get(value)!;
          this._proxyCache.delete(value);
          this._pathCache.delete(proxiedValue);
        }

        if (this._handler.deleteProperty) {
          return this._handler.deleteProperty(target, prop);
        }

        return Reflect.deleteProperty(target, prop);
      },

      // 传递其他处理器
      ...this._handler,
    });

    // 缓存代理和路径
    this._proxyCache.set(obj, proxy);
    this._pathCache.set(proxy, path);

    return proxy;
  }

  /**
   * 检测对象是否需要代理
   * @param obj 对象（属性）
   * @param path 路径
   * @returns
   */
  private shouldProxy(obj: any, path: string[]): boolean {
    // 基础类型检查
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    // 数组检查
    if (Array.isArray(obj) && !this._options.proxyArrays) {
      return false;
    }

    // 函数检查
    if (typeof obj === 'function' && !this._options.proxyFunctions) {
      return false;
    }

    // 自定义过滤器
    if (!this._options.filter(obj, path)) {
      return false;
    }

    return true;
  }

  /** 获取对象在代理中的路径 */
  public getPath(obj: any): string[] | undefined {
    if (this._proxyCache.has(obj)) {
      return this._pathCache.get(this._proxyCache.get(obj));
    }
    return undefined;
  }

  /** 检查对象是否被此深度代理管理 */
  public isProxied(obj: any): boolean {
    return this._proxyCache.has(obj) || this._pathCache.has(obj);
  }
}
