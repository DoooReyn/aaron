import * as zipson from 'zipson';
import pako from 'pako';
import { compressToBase64, decompressFromBase64 } from 'lz-string';

/** JSON 自定义序列化、反序列化工具 */
export class RSON {
  /** 将对象序列化为字符串 */
  public static encode(input: any): string {
    return zipson.stringify(input);
  }
  /** 将对象序列化为字符串并处理为二进制 */
  public static encodeAsU8(input: any): Uint8Array {
    return pako.deflate(JSON.stringify(input, null, 0));
  }
  /** 将对象序列化为字符串并处理为Base64 */
  public static encodeAsBase64(input: any): string {
    return this.encodeAsU8(input).toBase64();
  }
  /** 将对象序列化为字符串并处理为LZ4 */
  public static encodeAsLZ4(input: any) {
    return compressToBase64(JSON.stringify(input, null, 0));
  }
  /** 将字符串反序列化为对象 */
  public static decode(input: string): any {
    return zipson.parse(input);
  }
  /** 从二进制还原字符串并反序列化为对象 */
  public static decodeFromU8(input: Uint8Array): any {
    return JSON.parse(pako.inflate(input, { to: 'string' }));
  }
  /** 从Base64还原字符串并反序列化为对象 */
  public static decodeFromBase64(input: string, byteLength: number) {
    const u8 = new Uint8Array(byteLength);
    u8.setFromBase64(input);
    return this.decodeFromU8(u8);
  }
  /** 从LZ4还原字符串并反序列化为对象 */
  public static decodeFromLZ4(input: string) {
    return JSON.parse(decompressFromBase64(input));
  }
}
