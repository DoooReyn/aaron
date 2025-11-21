/** 字典类型 */
export type Dict = Record<string | symbol, any>;

/** 全局变量 */
export type Global = Dict & (typeof Window | typeof globalThis);
