import { runSync } from './Might';

/** 解析 string -> object */
function decode<T extends Object>(data: string) {
  return runSync<T | null>(() => JSON.parse(data))[0];
}

/** 压制 object -> string */
function encode(data: Object) {
  return JSON.stringify(data, null, 0);
}

export const json = { encode, decode };
