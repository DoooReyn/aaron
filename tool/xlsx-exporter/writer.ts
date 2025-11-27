import { Capitalize } from '../lib';
import { Ruler } from './ruler';
import { RSON } from './rson';
import { CFG } from './config';

/**
 * JSON序列化
 * @param data 数据
 * @param indent 缩进
 * @returns
 */
export function JSONWriter(data: Record<number | string, any>, indent: number = 0) {
  return JSON.stringify(data, null, indent);
}

/**
 * LZ4序列化
 * @param data 数据
 * @returns
 */
export function LZ4Writer(data: Record<number | string, any>) {
  return RSON.encodeAsLZ4(data);
}

/**
 * 二进制序列化
 * @param data 数据
 * @returns
 */
export function BINWriter(data: Record<number | string, any>) {
  return RSON.encodeAsU8(data);
}
export function LU8Writer(data: Record<number | string, any>) {
  return RSON.encodeAsLU8(data);
}

/**
 * Base64序列化
 * @param data 数据
 * @returns
 */
export function BASE64Writer(data: Record<number | string, any>) {
  const u8 = RSON.encodeAsU8(data);
  return [u8.toBase64(), u8.byteLength];
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

  // ITbl/RTbl/HTbl
  const i_tbl = [`/** ${ctable} 配置表条目映射形式 */`, `export interface ITbl${ctable} {`];
  const r_tbl = [`/** ${ctable} 配置表条目列表形式 */`, `export type RTbl${ctable} = [`];
  const h_tbl = [
    `/** ${ctable} 配置表注册信息 */`,
    `export const Table${ctable}: Table<RTbl${ctable}, ITbl${ctable}> = {`,
    `  token: 'Table${ctable}',`,
    '  header: [',
  ];
  for (let i = 0; i < passable.length; i++) {
    if (passable[i]) continue;
    const type = Ruler.transform(header3[i]!);
    i_tbl.push(`  ${header2[i]}: ${type};`);
    r_tbl.push(`  ${header2[i]}: ${type},`);
    h_tbl.push(`    '${header2[i]}',`);
  }
  i_tbl.push('}');
  r_tbl.push(']');
  h_tbl.push('  ]');
  h_tbl.push('};');

  // 组织
  const types = [i_tbl.join('\n'), r_tbl.join('\n')].join('\n');
  const content = [CFG.IMPORT, types, h_tbl.join('\n')].join('\n');
  return [content, types];
}
