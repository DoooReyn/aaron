import { Dict, Key } from '../types';

/** 冻结字典（防止修改） */
export function freeze(d: Dict) {
  return Object.freeze(d);
}

/** 深冻结字典（防止修改） */
export function deepFreeze<T extends Dict>(obj: T): T {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value: any = (obj as any)[prop];
    if (value && (typeof value === 'object' || typeof value === 'function') && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });
  return obj;
}

/** 获取字典键列表 */
export function keys(d: Dict) {
  return Object.keys(d);
}

/** 获取字典值列表 */
export function values(d: Dict) {
  return Object.values(d);
}

/** 遍历字典条目 */
export function entries(d: Dict) {
  return Object.entries(d);
}

/** 检查字典是否包含指定键 */
export function own(d: Dict, k: Key) {
  return d.hasOwnProperty(k);
}
/** 检查字典是否包含指定键 */
export function exists(d: Dict, k: Key) {
  return own(d, k) || d[k] !== undefined;
}

/** 设置字典值 */
export function set(d: Dict, k: Key, v: any) {
  if (own(d, k)) {
    d[k] = v;
  } else if (d[k] == undefined) {
    d[k] = v;
  }
}

/** 删除字典值 */
export function unset(d: Dict, k: Key) {
  if (own(d, k)) {
    delete d[k];
  }
}

/** 获取字典值 */
export function get(d: Dict, k: Key) {
  return own(d, k) ? d[k] : undefined;
}

/** 清空字典 */
export function clear(d: Dict) {
  for (const key in d) {
    if (d.hasOwnProperty(key)) {
      delete d[key];
    }
  }
}

/** 检查字典是否为空 */
export function empty(d: Dict) {
  return keys(d).length === 0;
}

/** 遍历字典 */
export function each(d: Dict, visit: (k: Key, v: any) => void) {
  keys(d).forEach((k) => d.hasOwnProperty(k) && visit(k, d[k]));
}

/** 映射字典值 */
export function map(d: Dict, mapping: (k: Key, v: any) => any) {
  return keys(d).reduce((acc, key) => {
    acc[key] = mapping(key, d[key]);
    return acc;
  }, {} as Dict);
}

/** 创建一个新的字典 */
export function create(d?: Dict) {
  return d ? { ...d } : Object.create(null);
}

/** 从字典中提取指定键值对 */
export function pick<K extends Key[]>(d: Dict, keys: K): Pick<Dict, K[number]> {
  return keys.reduce((acc, key) => {
    if (d[key] != undefined) acc[key] = d[key];
    return acc;
  }, {} as Pick<Dict, K[number]>);
}

/** 从字典中排除指定键值对 */
export function omit<K extends Key[]>(d: Dict, list: K, override: boolean = false): Omit<Dict, K[number]> {
  if (override) {
    list.forEach((key) => d.hasOwnProperty(key) && delete d[key]);
    return d as Omit<Dict, K[number]>;
  }
  return keys(d).reduce((acc, key) => {
    if (list.indexOf(key) === -1) {
      acc[key] = d[key];
    }
    return acc;
  }, {} as Omit<Dict, K[number]>);
}

/** 浅拷贝 */
export function shallowCopy(d: Dict) {
  return { ...d };
}

/** 深拷贝（递归复制嵌套对象，支持数组和对象，不支持循环引用） */
export function deepCopy(d: Dict) {
  if (typeof d !== 'object' || d == null || d == undefined) {
    return d;
  }
  return keys(d).reduce((acc, key) => {
    if (Array.isArray(d[key])) {
      acc[key] = d[key].map((item) => deepCopy(item));
    } else {
      acc[key] = deepCopy(d[key]);
    }
    return acc;
  }, {} as Dict);
}

/** 合并字典（覆盖目标字典中的相同键） */
export function merge(dst: Dict, src: Dict) {
  for (let key in src) {
    dst[key] = src[key];
  }
  return dst;
}

/** 覆盖字典（仅覆盖目标字典中不存在的键） */
export function override(dst: Dict, src: Dict) {
  for (let key in src) {
    if (dst[key] == undefined) {
      dst[key] = src[key];
    }
  }
  return dst;
}
