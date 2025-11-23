const ctx: object = {};

/** 空转方法 */
function idle(...args: any[]) {}

/**
 * 防抖
 * - 当事件被触发后，要等待一段时间后才执行函数
 * - 如果在等待时间内再次触发事件，将重新计时
 * - 应用场景：
 *      - 实时监听输入事件
 *      - 防止用户多次点击按钮
 * @param fn 执行函数
 * @param context 执行上下文
 * @param delay 延迟时间
 */
function debounce(fn: Function, context: object = ctx, delay: number = 300) {
  let timer: number | null = null;
  return function (...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
      timer = null;
    }, delay);
  };
}

/**
 * 节流
 * - 当事件被触发后，等待一段时间后才执行函数
 * - 如果在等待时间内再次触发事件，将忽略本次触发
 * - 应用场景：
 *      - 监听鼠标移动事件
 *      - 监听滚动事件
 * @param fn 执行函数
 * @param context 执行上下文
 * @param delay 延迟时间
 */
function throttle(fn: Function, context: object = ctx, delay: number = 300) {
  let valid: boolean = true;
  let timer: number = 0;
  return function (...args: any[]) {
    if (!valid) return;
    if (timer) clearTimeout(timer);
    valid = false;
    timer = setTimeout(function () {
      fn.apply(context, args);
      timer = 0;
      valid = true;
    }, delay);
  };
}

export { debounce, throttle };
