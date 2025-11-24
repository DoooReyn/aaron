import { TIME_MS, TIME_SEC } from '../macro';
import { runSync } from './Might';

/**
 * 模拟耗时操作（毫秒）
 * @param ms 时间
 */
function lag(ms: number): void {
  const end = now() + ms;
  while (now() < end) {}
}

/**
 * 毫秒数转换为秒数
 * @param ms - 毫秒数
 * @returns 转换后的秒数
 */
function ms2sec(ms: number): number {
  return (ms / 1000) | 0;
}

/**
 * 秒数转换为毫秒数
 * @param sec - 秒数
 * @returns 转换后的毫秒数
 */
function sec2ms(sec: number): number {
  return (sec * 1000) | 0;
}

/**
 * 秒数转换为时分秒格式（例如：100秒 => 00:01:40）
 * @param seconds - 秒数
 * @returns 时分秒格式字符串
 */
function sec2hms(seconds: number): string {
  seconds = seconds | 0;
  const hour = (seconds / TIME_SEC.HOUR) | 0;
  const min = (seconds / TIME_SEC.MINUTE) | 0;
  const sec = seconds % TIME_SEC.MINUTE;
  return [hour, min, sec].map((v) => v.toString().padStart(2, '0')).join(':');
}

/**
 * 获取当前日期对象
 * @returns 当前日期
 */
function date(): Date {
  return new Date();
}

/**
 * 获取年份
 * @param d - 日期对象，不传则使用当前日期
 * @returns 年份
 */
function year(d?: Date): number {
  return (d ??= date()).getFullYear();
}

/**
 * 获取月份（0-11）
 * @param d - 日期对象，不传则使用当前日期
 * @returns 月份
 */
function month(d?: Date): number {
  return (d ??= date()).getMonth();
}

/**
 * 获取日期（月份中的第几天）
 * @param d - 日期对象，不传则使用当前日期
 * @returns 日期
 */
function day(d?: Date): number {
  return (d ??= date()).getDate();
}

/**
 * 获取小时（24小时制）
 * @param d - 日期对象，不传则使用当前日期
 * @returns 小时
 */
function hour(d?: Date): number {
  return (d ??= date()).getHours();
}

/**
 * 获取分钟
 * @param d - 日期对象，不传则使用当前日期
 * @returns 分钟
 */
function minute(d?: Date): number {
  return (d ??= date()).getMinutes();
}

/**
 * 获取秒数
 * @param d - 日期对象，不传则使用当前日期
 * @returns 秒数
 */
function second(d?: Date): number {
  return (d ??= date()).getSeconds();
}

/**
 * 获取毫秒数
 * @param d - 日期对象，不传则使用当前日期
 * @returns 毫秒数
 */
function millisecond(d?: Date): number {
  return (d ??= date()).getMilliseconds();
}

/**
 * 获取时间戳
 * @param d - 日期对象，不传则使用当前日期
 * @returns 时间戳（毫秒）
 */
function time(d?: Date): number {
  return (d ??= date()).getTime();
}

/**
 * 计算两个日期之间的时间差（绝对值）
 * @param d1 - 第一个日期
 * @param d2 - 第二个日期，不传则使用当前日期
 * @returns 时间差（毫秒）
 */
function diff(d1: Date, d2?: Date): number {
  return Math.abs((d2 ??= date()).getTime() - d1.getTime());
}

/**
 * 判断是否为闰年
 * @param y - 年份，不传则使用当前年份
 * @returns 是否为闰年
 */
function isLeapYear(y?: number): boolean {
  y ??= year();
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * 解析日期对象为详细时间信息
 * @param d - 日期对象，不传则使用当前日期
 * @returns 包含年月日时分秒毫秒和时间戳的对象
 */
function parse(d?: Date): {
  yy: number;
  mm: number;
  dd: number;
  h: number;
  m: number;
  s: number;
  ms: number;
  ts: number;
} {
  d ??= date();
  return {
    yy: year(d),
    mm: month(d),
    dd: day(d),
    h: hour(d),
    m: minute(d),
    s: second(d),
    ms: millisecond(d),
    ts: time(d),
  };
}

/**
 * 格式化日期为年-月-日格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 年-月-日格式字符串
 */
function ymd(d?: Date): string {
  const s = parse(d ?? date());
  return `${s.yy}-${s.mm + 1}-${s.dd}`;
}

/**
 * 格式化时间为时:分:秒格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 时:分:秒格式字符串
 */
function hms(d?: Date): string {
  const s = parse(d ?? date());
  return `${s.h}:${s.m}:${s.s}`;
}

/**
 * 格式化时间为时:分:秒.毫秒格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 时:分:秒.毫秒格式字符串
 */
function hmsm(d?: Date): string {
  const s = parse(d ?? date());
  return `${s.h}:${s.m}:${s.s}.${s.ms}`;
}

/**
 * 格式化日期时间为年-月-日 时:分:秒格式
 * @param d - 日期对象，不传则使用当前日期
 * @returns 年-月-日 时:分:秒格式字符串
 */
function ymdhms(d?: Date): string {
  const s = parse(d ?? date());
  return `${s.yy}-${s.mm + 1}-${s.dd} ${s.h}:${s.m}:${s.s}`;
}

/**
 * 格式化时间差为可读文本
 * @param stamp - 目标时间戳
 * @param unit - 时间单位配置对象
 * @returns 包含天数、小时数、分钟数、秒数和格式化文本的对象
 */
function fmt(
  stamp: number,
  unit: { day: string; hour: string; minute: string; second: string }
): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  text: string;
} {
  let days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    text = '';
  const now = time();
  const remaining = stamp - now;
  if (remaining > 0) {
    days = Math.floor(remaining / TIME_MS.DAY);
    hours = Math.floor((remaining % TIME_MS.DAY) / TIME_MS.HOUR);
    minutes = Math.floor((remaining % TIME_MS.HOUR) / TIME_MS.MINUTE);
    seconds = Math.floor((remaining % TIME_MS.MINUTE) / TIME_MS.SECOND);
    if (days > 0) {
      text = `${days} ${unit.day} ${hours}${unit.hour} ${minutes}${unit.minute} ${seconds}${unit.second}`;
    } else if (hours > 0) {
      text = `${hours}${unit.hour} ${minutes}${unit.minute} ${seconds}${unit.second}`;
    } else if (minutes > 0) {
      text = `${minutes}${unit.minute} ${seconds}${unit.second}`;
    } else {
      text = `${seconds}${unit.second}`;
    }
  }
  return { days, hours, minutes, seconds, text };
}

/**
 * 获取当前时间戳
 * @returns 当前时间戳
 */
function now() {
  return Date.now();
}

/**
 * 等待指定时间
 * @param ms 时间（毫秒）
 * @returns
 */
async function waitAsync<R = unknown>(handle: () => R, ms: number) {
  return new Promise<R>((resolve) => {
    setTimeout(function () {
      resolve(runSync(handle)[0]);
    }, ms);
  });
}

/**
 * 等待指定时间后执行方法
 * @param handle 方法
 * @param ms 时间（毫秒）
 */
function waitSync<R = unknown>(handle: () => R, ms: number) {
  setTimeout(function () {
    runSync(handle);
  }, ms);
}

export {
  date,
  day,
  diff,
  fmt,
  hms,
  hmsm,
  hour,
  isLeapYear,
  lag,
  millisecond,
  minute,
  month,
  ms2sec,
  now,
  parse,
  sec2hms,
  sec2ms,
  second,
  time,
  waitAsync,
  waitSync,
  year,
  ymd,
  ymdhms,
};
