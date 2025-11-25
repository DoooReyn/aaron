/** 深层代理配置 */
export interface IProxyOptions {
  /** 是否代理数组 */
  proxyArrays?: boolean;
  /** 是否代理函数 */
  proxyFunctions?: boolean;
  /** 最大代理深度 */
  maxDepth?: number;
  /** 自定义过滤器，返回 false 的对象不会被代理 */
  filter?: (obj: any, path: string[]) => boolean;
}

/**
 * （内部）深层代理接口
 * @description 提供生成代理、获取属性路径和检查代理状态的方法
 */
export interface IDeepProxy<T extends object> {
  /**
   * 生成深层代理
   * @returns
   */
  create(): T;
  /**
   * 获取对象的属性路径
   * @param obj 目标对象
   * @returns 属性路径数组，或 undefined 如果对象未被代理
   */
  getPath(obj: T): string[] | undefined;
  /**
   * 检查对象是否被代理
   * @param obj 目标对象
   * @returns 如果对象被代理则返回 true，否则返回 false
   */
  isProxied(obj: T): boolean;
}
