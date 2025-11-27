/**
 * 格式化
 * @param template 模板
 * @param args 参数列表
 * @returns
 */
export function fmt(template: string, ...args: any[]) {
  // 如果没有参数，则直接返回模板字符串
  if (args.length === 0) {
    return template;
  }
  // 如果只有一个参数且为对象，则使用命名参数格式化
  if (args.length === 1) {
    const params = args[0];
    if (typeof params === "object" && params !== null && !Array.isArray(params)) {
      return template.replace(/{([^{}]*)}/g, (match, key) => {
        const value = params[key];
        return value !== undefined ? String(value) : match;
      });
    }
  }
  // 否则使用位置参数进行格式化
  return template.replace(/{(\d+)}/g, (match, index) => {
    const value = args[parseInt(index)];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * 是否空字符串
 * @param str 输入字符串
 * @returns
 */
export function isBlank(str: string) {
  return isLiteral(str) && str.length === 0;
}

/**
 * 是否字符串
 * @param str 输入字符串
 * @returns
 */
export function isLiteral(str: string) {
  return typeof str === "string";
}

/**
 * 截断字符串
 * @param str 输入字符串
 * @param maxLength 截断长度
 * @param ellipsis 省略号（默认"..."）
 * @returns
 */
export function truncate(str: string, maxLength: number, ellipsis: string = "...") {
  return str.length <= maxLength ? str : str.substring(0, maxLength - ellipsis.length) + ellipsis;
}
