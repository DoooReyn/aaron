import { misc, sys, Texture2D } from 'cc';

import { runSync } from './Might';

/** 内置上下文 */
const CTX: object = {};

/** 纹理过滤模式 */
const { LINEAR, NEAREST } = Texture2D.Filter;

/** 空转方法 */
function idle(...args: any[]) {}

/**
 * 防抖
 * - 当事件被触发后，要等待一段时间后才执行函数
 * - 如果在等待时间内再次触发事件，将重新计时
 * - 应用场景：
 *      - 实时监听输入事件
 *      - 防止用户多次点击按钮
 * @param handle 执行函数
 * @param context 执行上下文
 * @param delay 延迟时间
 */
function debounce(handle: Function, context: object = CTX, delay: number = 300) {
  let timer: number | null = null;
  return function (...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      handle.apply(context, args);
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
 * @param handle 执行函数
 * @param context 执行上下文
 * @param delay 延迟时间
 */
function throttle(handle: Function, context: object = CTX, delay: number = 300) {
  let valid: boolean = true;
  let timer: number = 0;
  return function (...args: any[]) {
    if (!valid) return;
    if (timer) clearTimeout(timer);
    valid = false;
    timer = setTimeout(function () {
      handle.apply(context, args);
      timer = 0;
      valid = true;
    }, delay);
  };
}

/** 禁止调试 */
function ban() {
  if (sys.isBrowser) {
    document.oncontextmenu = function () {
      return false;
    };
    document.onkeydown = document.onkeyup = function (e) {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        return false;
      }
    };
    (() => {
      const a = ['c', 'o', 'n', 's', 't', 'r', 'u', 'c', 't', 'o', 'r'].join('');
      const b = ['d', 'e', 'b', 'b', 'u', 'g', 'g', 'e', 'r'].join('');
      const c = ['c', 'a', 'l', 'l'].join('');
      const exec = () => setInterval(() => (<any>exec)[a](b)[c](), 50);
      exec();
    })();
  }
}

/**
 * 下一帧运行方法
 * @param exec 方法
 */
function nextTick(exec: () => void) {
  misc.callInNextTick(function () {
    runSync(exec);
  });
}

/**
 * 对贴图开启/关闭抗锯齿
 * @param tex 贴图
 * @param enabled 是否启用抗锯齿
 */
function setAntiAliasing(tex: Texture2D, enabled: boolean): void {
  let filter = enabled ? LINEAR : NEAREST;
  tex && tex.setFilters(filter, filter);
}

export { CTX, idle, debounce, throttle, ban, nextTick, setAntiAliasing };
