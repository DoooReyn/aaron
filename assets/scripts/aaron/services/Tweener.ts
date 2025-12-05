import { tween, Node, Tween } from 'cc';

import { Service } from '../core';
import {
  BlurInTw,
  BlurOutTw,
  DrawerInTw,
  DrawerOutTw,
  EarthquakeTw,
  ExplosionTw,
  JellyTw,
  PopupInTw,
  PopupOutTw,
  ScrollNumberTw,
  ShakeTw,
  VibrationTw,
  WaveTw
} from '../foundation';
import { ITweener, ITweenArgs, ITweenEntry } from '../interfaces';
import { MESSAGES } from '../macro';
import { might } from '../utils';

/**
 * Tweener 依赖实现
 */
export class Tweener extends Service implements ITweener {
  readonly token: string = MESSAGES.TWEENER.CATEGORY;
  /** 已注册的缓动库容器：lib -> entry */
  private _container: Map<string, ITweenEntry> = new Map();
  /** 运行时缓动表：node.uuid -> Map<lib, [Tween<Node>, ITweenArgs]> */
  private _runtime: Map<string, Map<string, [Tween<Node>, ITweenArgs]>> = new Map();

  initialize() {
    this.register(BlurInTw);
    this.register(BlurOutTw);
    this.register(DrawerInTw);
    this.register(DrawerOutTw);
    this.register(PopupInTw);
    this.register(PopupOutTw);
    this.register(ScrollNumberTw);
    this.register(ShakeTw);
    this.register(WaveTw);
    this.register(VibrationTw);
    this.register(ExplosionTw);
    this.register(EarthquakeTw);
    this.register(JellyTw);
  }

  destroy() {
    this.stopAll();
    this._runtime.clear();
  }

  has(lib: string): boolean {
    return this._container.has(lib);
  }

  register(entry: ITweenEntry): void {
    if (this._container.has(entry.lib)) {
      this.logger.wf('✅ 注册缓动: {0} 重复注册，使用最新版本', entry.lib);
    } else {
      this.logger.df('✅ 注册缓动: {0}', entry.lib);
    }
    this._container.set(entry.lib, entry);
  }

  unregister(entry: ITweenEntry | string): void {
    if (typeof entry === 'string') {
      this._container.delete(entry);
    } else {
      this._container.delete(entry.lib);
    }
  }

  clear(): void {
    this._container.clear();
  }

  isPlaying(node: Node, lib: string): boolean {
    if (this._runtime.has(node.uuid)) {
      const tweens = this._runtime.get(node.uuid)!;
      if (tweens.has(lib)) {
        return !!tweens.get(lib)![0]?.running;
      }
    }
    return false;
  }

  async play(node: Node, lib: string, args?: ITweenArgs): Promise<void> {
    const [_, err] = await might.runAsync(this.internalPlay(node, lib, args));
    if (err) {
      this.logger.e(`❌ 缓动执行异常: ${lib}`, err);
    }
  }

  pause(node: Node, lib: string): void {
    if (this._runtime.has(node.uuid)) {
      const tweens = this._runtime.get(node.uuid)!;
      if (tweens.has(lib)) {
        const [twn, a] = tweens.get(lib)!;
        twn?.pause();
        const [, e] = might.runSync(() => a.onPause?.call(a.context, node));
        if (e) this.logger.e(`❌ 缓动 onPause 回调异常: ${lib}`, e);
      }
    }
  }

  resume(node: Node, lib: string): void {
    if (this._runtime.has(node.uuid)) {
      const tweens = this._runtime.get(node.uuid)!;
      if (tweens.has(lib)) {
        const [twn, a] = tweens.get(lib)!;
        twn?.resume();
        const [, e] = might.runSync(() => a.onResume?.call(a.context, node));
        if (e) this.logger.e(`❌ 缓动 onResume 回调异常: ${lib}`, e);
      }
    }
  }

  stop(node: Node, lib: string): void {
    if (this._runtime.has(node.uuid)) {
      const tweens = this._runtime.get(node.uuid)!;
      if (tweens.has(lib)) {
        const [twn, a] = tweens.get(lib)!;
        twn?.stop();
        tweens.delete(lib);
        const [, e] = might.runSync(() => a.onStop?.call(a.context, node));
        if (e) this.logger.e(`❌ 缓动 onStop 回调异常: ${lib}`, e);
      }
    }
  }

  pauseAll(node?: Node): void {
    const logger = this.logger;
    if (node) {
      if (this._runtime.has(node.uuid)) {
        const tweens = this._runtime.get(node.uuid)!;
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.pause();
          const [, e] = might.runSync(() => args.onPause?.call(args.context, node));
          if (e) logger.e(`❌ 缓动 onPause 回调异常: ${lib}`, e);
        });
      }
    } else {
      this._runtime.forEach((tweens) => {
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.pause();
          const [, e] = might.runSync(() => args.onPause?.call(args.context, node));
          if (e) logger.e(`❌ 缓动 onPause 回调异常: ${lib}`, e);
        });
      });
    }
  }

  resumeAll(node?: Node): void {
    const logger = this.logger;
    if (node) {
      if (this._runtime.has(node.uuid)) {
        const tweens = this._runtime.get(node.uuid)!;
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.resume();
          const [, e] = might.runSync(() => args.onResume?.call(args.context, node));
          if (e) logger.e(`❌ 缓动 onResume 回调异常: ${lib}`, e);
        });
      }
    } else {
      this._runtime.forEach((tweens) => {
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.resume();
          const [, e] = might.runSync(() => args.onResume?.call(args.context, node));
          if (e) logger.e(`❌ 缓动 onResume 回调异常: ${lib}`, e);
        });
      });
    }
  }

  stopAll(node?: Node): void {
    const logger = this.logger;
    if (node) {
      if (this._runtime.has(node.uuid)) {
        const tweens = this._runtime.get(node.uuid)!;
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.stop();
          tweens.delete(lib);
          const [, e] = might.runSync(() => args.onStop?.call(args.context, node));
          if (e) logger.e(`❌ 缓动 onStop 回调异常: ${lib}`, e);
        });
        tweens.clear();
      }
    } else {
      this._runtime.forEach((tweens) => {
        tweens.forEach((tween, lib) => {
          const [twn, args] = tween;
          twn.stop();
          tweens.delete(lib);
          const [, e] = might.runSync(() => args.onStop?.call(args.context, node));
          if (e) logger.e(`❌ 缓动 onStop 回调异常: ${lib}`, e);
        });
        tweens.clear();
      });
      this._runtime.clear();
    }
  }

  /**
   * 内部播放流程
   * @param node 目标节点
   * @param lib 缓动库名
   * @param args 播放参数（与注册默认参数浅合并后生效）
   * @returns 异步完成 Promise
   */
  private async internalPlay(node: Node, lib: string, args?: ITweenArgs) {
    return new Promise<void>((resolve) => {
      const entry = this._container.get(lib);
      if (!entry) {
        this.logger.ef(`❌ 缓动未注册: {0}`, lib);
        return resolve();
      }

      if (args) {
        args = { ...entry.args, ...args };
      } else {
        args = { ...entry.args };
      }
      args.existencePolicy ??= 'override';

      if (this._runtime.has(node.uuid)) {
        const tweens = this._runtime.get(node.uuid)!;
        if (tweens.has(lib)) {
          if (args.existencePolicy === 'skip') {
            this.logger.if(`🚀 缓动正在播放中，应用跳过策略: {0}`, lib);
            return resolve();
          } else {
            this.logger.if(`🚀 缓动正在播放中，应用替换策略: {0}`, lib);
            tweens.get(lib)![0]?.stop();
            tweens.delete(lib);
            const [, e] = might.runSync(() => args.onStop?.call(args.context, node));
            if (e) this.logger.e(`❌ 缓动: ${lib} onStop 回调异常`, e);
          }
        }
      } else {
        this._runtime.set(node.uuid, new Map());
      }

      const t1 = tween(node).call(() => {
        const [, e] = might.runSync(() => args.onStart?.call(args.context, node));
        if (e) this.logger.e(`❌ 缓动 onStart 回调异常: ${lib}`, e);
        // ioc.logcat.tweener.i(`缓动动画: ${lib} 第一阶段播放结束`);
      });
      const [t2, createErr] = might.runSync(() => entry.create(node, args));
      if (createErr || !t2) {
        this.logger.e(`❌ 缓动构建失败: ${lib}`, createErr);
        return resolve();
      }
      // t2.call(() => {
      //   ioc.logcat.tweener.i(`缓动动画: ${lib} 第二阶段播放结束`);
      // });
      const t3 = tween(node).call(() => {
        const map = this._runtime.get(node.uuid);
        map?.delete(lib);
        const [, e] = might.runSync(() => args.onEnd?.call(args.context, node));
        if (e) this.logger.e(`❌ 缓动 onEnd 回调异常: ${lib}`, e);
        // ioc.logcat.tweener.i(`缓动动画: ${lib} 第三阶段播放结束`);
        resolve();
      });
      const twn = tween().sequence(t1, t2, t3).target(node).bindNodeState(true);
      this._runtime.get(node.uuid)!.set(lib, [twn, args]);
      twn.start();
    });
  }
}
