import * as zipson from 'zipson';
import pako from 'pako';
import { Capitalize } from '../lib';
import { Ruler } from './ruler';
import { RSON } from './rson';

/**
 * JSON序列化
 * @param data 数据
 * @param indent 缩进
 * @returns
 */
export function JSONWriter(data: Record<number | string, any>, indent: number = 2) {
  return JSON.stringify(data, null, indent);
}

/**
 * 二进制序列化
 * @param data 数据
 * @returns
 */
export function BINWriter(data: Record<number | string, any>) {
  return RSON.encodeAsU8(data);
}

/**
 * 转换为TS代码
 * @param table 表名
 * @param headers 表头
 * @param data 数据
 * @returns
 */
export function TSWriter(table: string, headers: [string[], string[], boolean[]], data: Record<number | string, any>) {
  const ctable = Capitalize(table);
  const [header2, header3, passable] = headers;
  const interfaces = ['interface ITbl' + ctable + ' {'];
  for (let i = 0; i < passable.length; i++) {
    if (passable[i]) continue;
    const type = Ruler.transform(header3[i]!);
    interfaces.push(`    ${header2[i]}: ${type};`);
  }
  interfaces.push('}');
  const types = interfaces.join('\n');
  const tables =
    'export const Tbl' + ctable + ': Record<string, ITbl' + ctable + '> = ' + JSONWriter(data, 0) + ' as const;';
  const content = ['export ' + types, tables].join('\n\n');
  return [content, types];
}
