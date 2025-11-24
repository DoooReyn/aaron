import { DEV } from 'cc/env';
import { Key } from '../types';

/**
 * 向类注入原型成员
 * @param key 键
 * @param val 值
 */
export function InjectMember(key: Key, val: any) {
  return function (target: any) {
    target.prototype[key] = val;
    return target;
  };
}

/**
 * 获取类的原型成员
 * @param target 类实例
 * @param key 键
 * @returns 原型成员
 */
export function MemberOf<V>(target: any, key: Key) {
  return target.prototype[key] as V;
}

/** 
 * 记录方法执行耗时
 * @param tag 标识
 */
export function TimeConsuming(tag: string) {
  // 返回实际的方法装饰器
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (DEV) {
      const originalMethod = descriptor.value;
      descriptor.value = function (...args: any[]) {
        const start = performance.now();
        try {
          const result = originalMethod.apply(this, args);
          if (result instanceof Promise) {
            return result.then((data) => {
              const end = performance.now();
              console.log(`[${tag}] 异步耗时: ${(end - start).toFixed(3)}ms`);
              return data;
            });
          } else {
            const end = performance.now();
            console.log(`[${tag}] 同步耗时: ${(end - start).toFixed(3)}ms`);
            return result;
          }
        } catch (error) {
          console.error(`[${tag}] 发现错误:`, error);
          throw error;
        }
      };
    }
    return descriptor;
  };
}
