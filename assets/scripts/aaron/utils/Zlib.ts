import { inflate, Data, deflate } from 'pako';

/** 压制 string -> string(zlib) */
function encode(data: Data) {
  return inflate(data, { to: 'string' });
}

/** 解析 string(zlib) -> string */
function decode(data: string) {
  return deflate(data);
}

export { encode, decode };
