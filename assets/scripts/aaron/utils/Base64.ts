import { decode as b64dec, encode as b64enc } from 'js-base64';

/** 压制 string -> string(base64) */
function encode(data: string) {
  return b64enc(data);
}

/** 解析 string(base64) -> string */
function decode(data: string) {
  return b64dec(data);
}

export const b64 = { encode, decode };
