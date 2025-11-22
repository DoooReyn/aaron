import { aaron } from '../core';

/** 解析 string -> object */
function decode<T extends Object>(data: string) {
  const [ret, err] = aaron.catcher.sync<T | null>(() => JSON.parse(data));
  if (err) {
    aaron.logger.e('JSON 解析失败', err);
  }
  return ret;
}

/** 压制 object -> string */
function encode(data: Object) {
  return JSON.stringify(data, null, 0);
}

export { encode, decode };
