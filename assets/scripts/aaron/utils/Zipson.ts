import { parse, stringify } from 'zipson';
import { aaron } from '../core';

/** 压制 object -> string */
function encode(data: object): string {
  return stringify(data);
}

/** 解析 string -> object */
function decode(data: string): object {
  const [ret, err] = aaron.catcher.sync(() => parse(data));
  if (err) {
    aaron.logger.e('zipson 解析失败:', data);
  }
  return ret;
}

export { encode, decode };
