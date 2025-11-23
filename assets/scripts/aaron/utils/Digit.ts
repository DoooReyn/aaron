/** 校验数字是否有效 */
function valid(d: number): boolean {
  return !isNaN(d);
}

/** 校验数字是否为有限大 */
function finite(d: number): boolean {
  return isFinite(d);
}

/** 校验数字是否为无限大 */
function infinite(d: number): boolean {
  return !isFinite(d);
}

/** 校验数字是否为负数 */
function negative(d: number): boolean {
  return d < 0;
}

/** 校验数字是否为非负数 */
function positive(d: number): boolean {
  return d >= 0;
}

/** 四舍五入取整 */
function round(d: number): number {
  return Math.round(d);
}

/** 向下取整 */
function floor(d: number): number {
  return Math.floor(d);
}

/** 向上取整 */
function ceil(d: number): number {
  return Math.ceil(d);
}

/** 取绝对值 */
function abs(d: number): number {
  return Math.abs(d);
}

/** 校验数字是否为整数 */
function integer(d: number): boolean {
  return Number.isInteger(d);
}

/** 获取数字的小数部分 */
function decimal(d: number): number {
  return d - Math.floor(d);
}

/** 计算数字的乘方 */
function pow(d: number, p: number): number {
  return Math.pow(d, p);
}

/** 计算数字的平方根 */
function sqrt(d: number): number {
  return Math.sqrt(d);
}

/** 限制数字在指定范围内 */
function clamp(d: number, min: number, max: number): number {
  return Math.min(Math.max(d, min), max);
}

/** 限制数字在0~1范围内 */
function clamp01(d: number): number {
  return this.clamp(d, 0, 1);
}

/** 校验数字是否近似等于另一个数字 */
function equals(d: number, e: number, tolerance?: number): boolean {
  return d === e || Math.abs(d - e) <= tolerance;
}

/** 获取数字的符号 */
function sign(d: number): number {
  return d === 0 ? 0 : d < 0 ? -1 : 1;
}

/** 计算数字的和 */
function sum(...arr: number[]): number {
  return arr.reduce((acc, cur) => acc + cur, 0);
}

/** 计算数字的平均值 */
function average(...arr: number[]): number {
  return this.sum(...arr) / arr.length;
}

/** 计算数字的乘积 */
function product(...arr: number[]): number {
  return arr.reduce((acc, cur) => acc * cur, 1);
}

/** 保留数字的指定小数位数 */
function keepBits(d: number, bits: number): number {
  return Number(d.toFixed(bits));
}

/** 计算两点之间的距离 */
function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/** 角度转换为弧度 */
function angle2rad(angle: number): number {
  return (angle * Math.PI) / 180;
}

/** 弧度转换为角度 */
function rad2angle(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 计算两点之间的角度 */
function angle(x1: number, y1: number, x2: number, y2: number): number {
  return rad2angle(Math.atan2(y2 - y1, x2 - x1));
}

/** 校验两个圆是否相交 */
function circleCross(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
  return distance(x1, y1, x2, y2) <= r1 + r2;
}

/** 计算二次贝塞尔曲线在指定参数值下的点 */
function quadraticBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  t: number
): [number, number] {
  const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
  const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
  return [x, y];
}

/** 计算三次贝塞尔曲线在指定参数值下的点 */
function cubicBezier(
  t: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number
): [number, number] {
  const x = (1 - t) ** 3 * x1 + 3 * (1 - t) ** 2 * t * cx1 + 3 * (1 - t) * t ** 2 * cx2 + t ** 3 * x2;
  const y = (1 - t) ** 3 * y1 + 3 * (1 - t) ** 2 * t * cy1 + 3 * (1 - t) * t ** 2 * cy2 + t ** 3 * y2;
  return [x, y];
}

export {
  valid,
  finite,
  infinite,
  negative,
  positive,
  round,
  floor,
  ceil,
  abs,
  integer,
  decimal,
  pow,
  sqrt,
  clamp,
  clamp01,
  equals,
  sign,
  sum,
  average,
  product,
  keepBits,
  distance,
  angle2rad,
  rad2angle,
  angle,
  circleCross,
  quadraticBezier,
  cubicBezier,
};
