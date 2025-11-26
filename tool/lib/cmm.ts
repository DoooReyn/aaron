/**
 * 字符串首字母大写
 * @param str 字符串
 * @returns
 */
export function Capitalize(str: string) {
  return str.replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * 退出
 * @param code 退出码
 * @param msg 提示内容
 */
export function Exit(code: number, msg?: string) {
  if (code != 0 && msg) {
    console.error(msg);
  }
  process.exit(code);
}

/**
 * 补齐宽度
 * @param str 字符串
 * @param len 预定宽度
 * @returns
 */
export function ExtraSpace(str: string, len: number = 20) {
  len = Math.max(0, len - str.length);
  return len == 0 ? str : str + ' '.repeat(len);
}

/**
 * 使用正则表达式确保字符串只包含有效的数字字符（包括前置负号和小数点）
 * @param input 输入字符串
 * @returns
 */
export function ConvertStringToNumber(input: string): number {
  if (typeof input == 'number') return input;
  const ret = Number(input.replace(/[^\d.-]/g, ''));
  return isNaN(ret) ? 0 : ret;
}
