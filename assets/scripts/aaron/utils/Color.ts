import { Color } from 'cc';

/** 色值缓存 */
const cache: Record<string, Color> = Object.create(null);

/**
 * 色值通道合成
 * @param channels 色值通道数组
 * @returns 色值
 */
function composite(channels: number[]) {
  return (
    '#' +
    channels
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/**
 * 色值转换
 * @param r 色值(通道 R)
 * @param g 通道 G
 * @param b 通道 B
 * @param a 通道 A
 * @returns Cocos Creator 颜色
 */
function from(r: Color | string | number[] | number, g?: number, b?: number, a?: number): Color {
  if (typeof r === 'string') {
    let color = cache[r];
    if (!color) {
      const rr = parseInt(r.substring(1, 3), 16);
      const gg = parseInt(r.substring(3, 5), 16);
      const bb = parseInt(r.substring(5, 7), 16);
      const aa = r.length === 9 ? parseInt(r.substring(7, 9), 16) : 255;
      color = new Color(rr, gg, bb, aa);
      cache[r] = color;
    }
    return color;
  } else if (typeof r === 'number') {
    g ??= 255;
    b ??= 255;
    const channels = [r, g, b];
    if (a != undefined) channels[3] = a;
    return from(composite(channels));
  } else if (Array.isArray(r)) {
    let [rr, gg, bb, aa] = r;
    rr ??= 255;
    gg ??= 255;
    bb ??= 255;
    const channels = [rr, gg, bb];
    if (aa != undefined) channels[3] = aa;
    return from(composite(channels));
  } else {
    return r.clone();
  }
}

/**
 * 将通道值转换为十六进制
 * @param c 通道值
 * @returns 十六进制通道值
 */
function toChannelHEX(c: number) {
  return c.toString(16).padStart(2, '0');
}

/**
 * 将 CCColor 转换为3通道的十六进制色值
 * @param c 色值
 * @returns 3通道的十六进制色值
 */
function toHex3(c: Color): string {
  const r = toChannelHEX(c.r);
  const g = toChannelHEX(c.g);
  const b = toChannelHEX(c.b);
  return `#${r}${g}${b}`;
}

/**
 * 将 CCColor 转换为4通道的十六进制色值
 * @param c 色值
 * @returns 4通道的十六进制色值
 */
function toHEX4(c: Color) {
  const r = toChannelHEX(c.r);
  const g = toChannelHEX(c.g);
  const b = toChannelHEX(c.b);
  const a = toChannelHEX(c.a);
  return `#${r}${g}${b}${a}`;
}

export { composite, from, toHex3, toHEX4, toChannelHEX };
