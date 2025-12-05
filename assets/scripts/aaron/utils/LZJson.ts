import { json } from './Json';
import { lz4 } from './LZstring';
import { zlib } from './Zlib';

/** 压制 json -> string(lzstring) */
function encode<T = object>(data: T): string {
  return lz4.encode(json.encode(data));
}

/** 解析 string(lzstring) -> json */
function decode<T = object>(data: string) {
  return json.decode(lz4.decode(data)) as T;
}

/** 压制 json -> uint8array(zlib) */
function encodeU8<T = object>(data: T): Uint8Array {
  return zlib.encode(lz4.encode(json.encode(data)));
}

/** 解析 uint8array(zlib) -> json */
function decodeU8<T = object>(data: Uint8Array) {
  return json.decode(lz4.decode(zlib.decode(data))) as T;
}

export const lzj = {
  encode,
  decode,
  encodeU8,
  decodeU8
};
