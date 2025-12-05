import { js, Component, Node } from 'cc';

/**
 * 检查值是否为 undefined
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值为 undefined 则返回 true
 */
function isUndefined<T>(value: T | undefined): value is undefined {
  return value === undefined;
}

/**
 * 检查值是否不为 undefined
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值不为 undefined 则返回 true
 */
function notUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

/**
 * 检查值是否为 null
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值为 null 则返回 true
 */
function isNull<T>(value: T | null): value is null {
  return value === null;
}

/**
 * 检查值是否不为 null
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值不为 null 则返回 true
 */
function notNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * 检查值是否无效（undefined 或 null）
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值为 undefined 或 null 则返回 true
 * @deprecated 此函数名称可能令人困惑，实际上检查的是无效值
 */
function isValid<T>(value: T | undefined | null): value is undefined | null {
  return notUndefined(value) && notNull(value);
}

/**
 * 检查值是否有效（不为 undefined 且不为 null）
 * @template T - 值的类型
 * @param value - 要检查的值
 * @returns 如果值有效则返回 true
 */
function isInvalid<T>(value: T | undefined | null): value is T {
  return isUndefined(value) || isNull(value);
}

/**
 * 检查值是否为空值
 * 如果值为 null、undefined、0、false、空字符串或 'false' 则返回 true
 * @param value - 要检查的值
 * @returns 如果值为空值则返回 true
 */
function isEmpty(value: any): boolean {
  return value === null || value === undefined || value === 0 || value === false || value === '' || value === 'false';
}

/**
 * 检查值是否为可接受的真值
 * 如果值为 true、1 或 'true' 则返回 true
 * @param value - 要检查的值
 * @returns 如果值为可接受的真值则返回 true
 */
function isTenable(value: boolean | string | number): boolean {
  return value === true || value === 1 || value === 'true';
}

/**
 * 检查值是否为不可接受的假值
 * 如果值为 false、0 或 'false' 则返回 true
 * @param value - 要检查的值
 * @returns 如果值为不可接受的假值则返回 true
 */
function notTenable(value: boolean | string | number): boolean {
  return value === false || value === 0 || value === 'false';
}

/**
 * 检查值是否为真值（转换为布尔值后为 true）
 * @param value - 要检查的值
 * @returns 转换为布尔值后的结果
 */
function isTrue(value: any): boolean {
  return Boolean(value) === true;
}

/**
 * 检查值是否为假值（转换为布尔值后为 false）
 * @param value - 要检查的值
 * @returns 转换为布尔值后的结果
 */
function isFalse(value: any): boolean {
  return Boolean(value) === false;
}

/**
 * 检查值是否为真值（严格与 true 相等）
 * @param value - 要检查的值
 * @returns 如果值严格等于 true 则返回 true
 */
function isStrictlyTrue(value: any): boolean {
  return value === true;
}

/**
 * 检查值是否为假值（严格与 false 相等）
 * @param value - 要检查的值
 * @returns 如果值严格等于 false 则返回 true
 */
function isStrictlyFalse(value: any): boolean {
  return value === false;
}

/**
 * 获取值的精确类型名称
 * 使用 Object.prototype.toString.call 方法获取精确类型
 * @param value - 要检查的值
 * @returns 值的类型名称，如 'Object'、'Array'、'String' 等
 */
function getType(value: any): string {
  return Object.prototype.toString.call(value).slice(8, -1);
}

/**
 * 检查值是否为指定类型
 * @param value - 要检查的值
 * @param type - 类型名称
 * @returns 如果值是指定类型则返回 true
 */
function isTypeOf(value: any, type: string): boolean {
  return getType(value) === type;
}

/**
 * 检查数字是否为 NaN（Not a Number）
 * @param value - 要检查的数字
 * @returns 如果数字为 NaN 则返回 true
 */
function notNumber(value: number): boolean {
  return isNaN(value);
}

/**
 * 检查值是否为有效的数字（数字类型且不为 NaN）
 * @param value - 要检查的值
 * @returns 如果值为有效数字则返回 true
 */
function isNumber(value: any): boolean {
  return isTypeOf(value, 'Number') && !isNaN(value);
}

/**
 * 检查值是否为字符串
 * @param value - 要检查的值
 * @returns 如果值为字符串类型则返回 true
 */
function isString(value: any): boolean {
  return isTypeOf(value, 'String');
}

/**
 * 检查值是否为函数
 * @param value - 要检查的值
 * @returns 如果值为函数类型则返回 true
 */
function isFunction(value: any): boolean {
  return isTypeOf(value, 'Function');
}

/**
 * 检查值是否为 Symbol
 * @param value - 要检查的值
 * @returns 如果值为 Symbol 类型则返回 true
 */
function isSymbol(value: any): boolean {
  return isTypeOf(value, 'Symbol');
}

/**
 * 检查值是否为对象（非 null 的对象类型）
 * @param value - 要检查的值
 * @returns 如果值为非 null 的对象类型则返回 true
 */
function isObject(value: any): boolean {
  return notNull(value) && isTypeOf(value, 'Object');
}

/**
 * 检查值是否为纯对象（直接由 Object 构造函数创建或字面量创建）
 * @param value - 要检查的值
 * @returns 如果值为纯对象则返回 true
 */
function isPlainObject(value: any): boolean {
  if (!isObject(value)) return false;

  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * 检查值是否为数组
 * @param value - 要检查的值
 * @returns 如果值为数组类型则返回 true
 */
function isArray(value: any): boolean {
  return isTypeOf(value, 'Array') || Array.isArray(value);
}

/**
 * 检查值是否为正则表达式
 * @param value - 要检查的值
 * @returns 如果值为正则表达式类型则返回 true
 */
function isRegExp(value: any): boolean {
  return isTypeOf(value, 'RegExp');
}

/**
 * 检查值是否为 Map 对象
 * @param value - 要检查的值
 * @returns 如果值为 Map 类型则返回 true
 */
function isMap(value: any): boolean {
  return isTypeOf(value, 'Map');
}

/**
 * 检查值是否为 WeakMap 对象
 * @param value - 要检查的值
 * @returns 如果值为 WeakMap 类型则返回 true
 */
function isWeakMap(value: any): boolean {
  return isTypeOf(value, 'WeakMap');
}

/**
 * 检查值是否为 Set 对象
 * @param value - 要检查的值
 * @returns 如果值为 Set 类型则返回 true
 */
function isSet(value: any): boolean {
  return isTypeOf(value, 'Set');
}

/**
 * 检查值是否为 WeakSet 对象
 * @param value - 要检查的值
 * @returns 如果值为 WeakSet 类型则返回 true
 */
function isWeakSet(value: any): boolean {
  return isTypeOf(value, 'WeakSet');
}

/**
 * 检查值是否为日期对象
 * @param value - 要检查的值
 * @returns 如果值为日期类型则返回 true
 */
function isDate(value: any): boolean {
  return isTypeOf(value, 'Date');
}

/**
 * 检查值是否为指定构造函数的实例
 * @param value - 要检查的值
 * @param type - 构造函数或类
 * @returns 如果值是指定类型的实例则返回 true
 */
function isInstanceof(value: any, type: any): boolean {
  return value instanceof type;
}

/**
 * 检查值是否为 Cocos Creator 节点
 * @param value - 要检查的值
 * @returns 如果值是 CC 节点则返回 true
 */
function isCCNode(value: any): boolean {
  return isInstanceof(value, Node);
}

/**
 * 检查值是否为 Cocos Creator 组件
 * @param value - 要检查的值
 * @returns 如果值是 CC 组件则返回 true
 */
function isCCComponent(value: any): boolean {
  return isInstanceof(value, Component);
}

/**
 * 获取 Cocos Creator 对象的类名
 * @template T - 构造函数类型
 * @param value - Cocos Creator 对象实例
 * @returns 对象的类名
 */
function getCCClassOf<T extends new (...args: any) => any>(value: InstanceType<T>): string {
  return js.getClassName(value);
}

/**
 * 检查 Cocos Creator 对象是否为指定类名
 * @template T - 构造函数类型
 * @param value - Cocos Creator 对象实例
 * @param type - 要检查的类名
 * @returns 如果对象的类名匹配则返回 true
 */
function isCCClassOf<T extends new (...args: any) => any>(value: InstanceType<T>, type: string): boolean {
  return getCCClassOf(value) === type;
}

/**
 * 检查字符串是否为有效的 URL（包含 '://' 协议分隔符）
 * @param value - 要检查的字符串
 * @returns 如果字符串是有效 URL 则返回 true
 */
function isURL(value: string): boolean {
  return value.indexOf('://') > -1;
}

/**
 * 获取 URL 的协议部分（小写形式）
 * @param url - 要解析的 URL
 * @returns URL 的协议部分
 */
function getProtocol(url: string): string {
  return url.split('://')[0].trim().toLowerCase();
}

/**
 * 检查 URL 是否使用指定协议
 * @param url - 要检查的 URL
 * @param protocol - 协议名称
 * @returns 如果 URL 使用指定协议则返回 true
 */
function isProtocolOf(url: string, protocol: string): boolean {
  return getProtocol(url) === protocol;
}

/**
 * 检查 URL 是否使用 WebSocket 协议
 * @param url - 要检查的 URL
 * @returns 如果 URL 使用 ws 协议则返回 true
 */
function isProtocolWS(url: string): boolean {
  return isProtocolOf(url, 'ws');
}

/**
 * 检查 URL 是否使用 WebSocket Secure 协议
 * @param url - 要检查的 URL
 * @returns 如果 URL 使用 wss 协议则返回 true
 */
function isProtocolWSS(url: string): boolean {
  return isProtocolOf(url, 'wss');
}

/**
 * 检查 URL 是否使用 HTTP 协议
 * @param url - 要检查的 URL
 * @returns 如果 URL 使用 http 协议则返回 true
 */
function isProtocolHTTP(url: string): boolean {
  return isProtocolOf(url, 'http');
}

/**
 * 检查 URL 是否使用 HTTPS 协议
 * @param url - 要检查的 URL
 * @returns 如果 URL 使用 https 协议则返回 true
 */
function isProtocolHTTPS(url: string): boolean {
  return isProtocolOf(url, 'https');
}

export {
  getCCClassOf,
  getType,
  getProtocol,
  isArray,
  isCCClassOf,
  isCCComponent,
  isCCNode,
  isDate,
  isEmpty,
  isFalse,
  isFunction,
  isInstanceof,
  isInvalid,
  isMap,
  isNull,
  isNumber,
  isObject,
  isPlainObject,
  isProtocolHTTP,
  isProtocolHTTPS,
  isProtocolOf,
  isProtocolWS,
  isProtocolWSS,
  isRegExp,
  isSet,
  isString,
  isStrictlyFalse,
  isStrictlyTrue,
  isSymbol,
  isTenable,
  isTrue,
  isTypeOf,
  isURL,
  isUndefined,
  isValid,
  isWeakMap,
  isWeakSet,
  notNull,
  notNumber,
  notTenable,
  notUndefined,
};
