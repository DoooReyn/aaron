import { parse, stringify } from 'zipson';
import { runSync } from './Might';

/** 压制 object -> string */
function encode(data: object): string {
  return stringify(data);
}

/** 解析 string -> object */
function decode(data: string): object | undefined {
  return runSync<object>(parse, undefined, data)[0];
}

export { encode, decode };
