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
      this.logger.wf(MESSAGES.TWEENER.REGISTER_REPLACE, entry.lib);
    } else {
      this.logger.df(MESSAGES.TWEENER.REGISTER_NEW, entry.lib);
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
      const entries = this._runtime.get(node.uuid)!;
      if (entries.has(lib)) {
        return !!entries.get(lib)![0]?.running;
      }
    }
    return false;
  }

  async play(node: Node, lib: string, args?: ITweenArgs): Promise<void> {
    const [_, err] = await might.runAsync(this.internalPlay(node, lib, args));
    if (err) {
      this.logger.ef(MESSAGES.TWEENER.EXECUTE_BAD, lib, err);
    }
  }

  pause(node: Node, lib: string): void {
    if (this._runtime.has(node.uuid)) {
      const entries = this._runtime.get(node.uuid)!;
      if (entries.has(lib)) {
        const [twn, a] = entries.get(lib)!;
        twn?.pause();
        const [, e] = might.runSync(() => a.onPause?.call(a.context, node));
        if (e) this.logger.ef(MESSAGES.TWEENER.ON_PAUSE_BAD, lib, e);
      }
    }
  }

  resume(node: Node, lib: string): void {
    if (this._runtime.has(node.uuid)) {
      const entries = this._runtime.get(node.uuid)!;
      if (entries.has(lib)) {
        const [twn, a] = entries.get(lib)!;
        twn?.resume();
        const [, e] = might.runSync(() => a.onResume?.call(a.context, node));
        if (e) this.logger.ef(MESSAGES.TWEENER.ON_RESUME_BAD, lib, e);
      }
    }
  }

  stop(node: Node, lib: string): void {
    if (this._runtime.has(node.uuid)) {
      const entries = this._runtime.get(node.uuid)!;
      if (entries.has(lib)) {
        const [twn, a] = entries.get(lib)!;
        twn?.stop();
        entries.delete(lib);
        const [, e] = might.runSync(() => a.onStop?.call(a.context, node));
        if (e) this.logger.ef(MESSAGES.TWEENER.ON_STOP_BAD, lib, e);
      }
    }
  }

  pauseAll(node?: Node): void {
    const logger = this.logger;
    if (node) {
      if (this._runtime.has(node.uuid)) {
        const entries = this._runtime.get(node.uuid)!;
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.pause();
          const [, e] = might.runSync(() => args.onPause?.call(args.context, node));
          if (e) logger.ef(MESSAGES.TWEENER.ON_PAUSE_BAD, lib, e);
        });
      }
    } else {
      this._runtime.forEach((entries) => {
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.pause();
          const [, e] = might.runSync(() => args.onPause?.call(args.context, node));
          if (e) logger.ef(MESSAGES.TWEENER.ON_PAUSE_BAD, lib, e);
        });
      });
    }
  }

  resumeAll(node?: Node): void {
    const logger = this.logger;
    if (node) {
      if (this._runtime.has(node.uuid)) {
        const entries = this._runtime.get(node.uuid)!;
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.resume();
          const [, e] = might.runSync(() => args.onResume?.call(args.context, node));
          if (e) logger.ef(MESSAGES.TWEENER.ON_RESUME_BAD, lib, e);
        });
      }
    } else {
      this._runtime.forEach((entries) => {
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.resume();
          const [, e] = might.runSync(() => args.onResume?.call(args.context, node));
          if (e) logger.ef(MESSAGES.TWEENER.ON_RESUME_BAD, lib, e);
        });
      });
    }
  }

  stopAll(node?: Node): void {
    const logger = this.logger;
    if (node) {
      if (this._runtime.has(node.uuid)) {
        const entries = this._runtime.get(node.uuid)!;
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.stop();
          entries.delete(lib);
          const [, e] = might.runSync(() => args.onStop?.call(args.context, node));
          if (e) logger.ef(MESSAGES.TWEENER.ON_STOP_BAD, lib, e);
        });
        entries.clear();
      }
    } else {
      this._runtime.forEach((entries) => {
        entries.forEach((entry, lib) => {
          const [twn, args] = entry;
          twn.stop();
          entries.delete(lib);
          const [, e] = might.runSync(() => args.onStop?.call(args.context, node));
          if (e) logger.ef(MESSAGES.TWEENER.ON_STOP_BAD, lib, e);
        });
        entries.clear();
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
        this.logger.ef(MESSAGES.TWEENER.NOT_REGISTERED, lib);
        return resolve();
      }

      if (args) {
        args = { ...entry.args, ...args };
      } else {
        args = { ...entry.args };
      }
      args.existencePolicy ??= 'override';

      if (this._runtime.has(node.uuid)) {
        const entries = this._runtime.get(node.uuid)!;
        if (entries.has(lib)) {
          if (args.existencePolicy === 'skip') {
            this.logger.if(MESSAGES.TWEENER.IS_PLAYING_SKIP, lib);
            return resolve();
          } else {
            this.logger.if(MESSAGES.TWEENER.IS_PLAYING_REPLACE, lib);
            entries.get(lib)![0]?.stop();
            entries.delete(lib);
            const [, e] = might.runSync(() => args.onStop?.call(args.context, node));
            if (e) this.logger.ef(MESSAGES.TWEENER.ON_STOP_BAD, lib, e);
          }
        }
      } else {
        this._runtime.set(node.uuid, new Map());
      }

      const t1 = tween(node).call(() => {
        const [, e] = might.runSync(() => args.onStart?.call(args.context, node));
        if (e) this.logger.ef(MESSAGES.TWEENER.ON_START_BAD, lib, e);
        // ioc.logcat.tweener.i(`缓动动画: ${lib} 第一阶段播放结束`);
      });
      const [t2, createErr] = might.runSync(() => entry.create(node, args));
      if (createErr || !t2) {
        this.logger.ef(MESSAGES.TWEENER.BUILD_BAD, lib, createErr);
        return resolve();
      }
      // t2.call(() => {
      //   ioc.logcat.tweener.i(`缓动动画: ${lib} 第二阶段播放结束`);
      // });
      const t3 = tween(node).call(() => {
        const map = this._runtime.get(node.uuid);
        map?.delete(lib);
        const [, e] = might.runSync(() => args.onEnd?.call(args.context, node));
        if (e) this.logger.ef(MESSAGES.TWEENER.ON_END_BAD, lib, e);
        // ioc.logcat.tweener.i(`缓动动画: ${lib} 第三阶段播放结束`);
        resolve();
      });
      const twn = tween().sequence(t1, t2, t3).target(node).bindNodeState(true);
      this._runtime.get(node.uuid)!.set(lib, [twn, args]);
      twn.start();
    });
  }
}
