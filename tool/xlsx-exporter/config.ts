/**
 * 配置
 */
export const CFG = {
  /** 输入：表格目录 */
  TABLE: 'table',
  /** 输出类型：.json 所在目录 */
  JSON: 'json',
  /** 输出类型：.ts 所在目录 */
  TS: 'ts',
  /** 输出类型：.bin 所在目录 */
  BIN: 'bin',
  /** 输出类型: .txt 所在目录 */
  LZ4: 'txt',
  /** 输出目标（用,分隔） */
  TARGETS: 'TS,JSON,BIN,LZ4',
  /** 合并目录 */
  MINIFIED: 'minified',
  /** 合并名称 */
  MERGE_AS: 'table',
  /** 自定义 Table 导入 */
  IMPORT: "import { Table } from '../../aaron';",
} as const;
