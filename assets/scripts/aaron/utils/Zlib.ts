import { deflate, inflate, Data } from 'pako';

/** 压制 string -> string(zlib) */
function encode(data: string) {
  return deflate(data);
}

/** 解析 string(zlib) -> string */
function decode(data: Data) {
  return inflate(data, { to: 'string' });
}

export const zlib = { encode, decode };
