import { Node } from 'cc';
import { aaron } from '../../core';
import { digit } from '../../utils';
import { IAudioEntry, ILoadOptions, ISoundOptions, ISoundPlayer } from '../../interfaces';
import { PRESET } from '../../macro';

/**
 * 音效播放服务
 *
 * 提供音效的播放、暂停、恢复和停止功能
 * 支持多个音效同时播放和独立的音量控制
 */
export class SoundPlayer extends Node implements ISoundPlayer {
  /** 音频条目列表 */
  private _entries: IAudioEntry[] = [];

  /** 主音量 */
  private _masterVolume: number = 1;

  /**
   * 获取主音量
   * @returns 主音量值（0-1）
   */
  get masterVolume(): number {
    return this._masterVolume;
  }

  /**
   * 设置主音量
   * @param value 音量值（0-1）
   */
  set masterVolume(value: number) {
    this._masterVolume = value;
    for (const entry of this._entries) {
      entry.setVolume(this._masterVolume * entry.selfVolume);
    }
  }

  /** 是否静音 */
  private _muted: boolean = false;

  /**
   * 获取静音状态
   * @returns 是否静音
   */
  get muted(): boolean {
    return this._muted;
  }

  /**
   * 设置静音状态
   * @param value 是否静音
   */
  set muted(value: boolean) {
    this._muted = value;
    for (const entry of this._entries) {
      value ? entry.stop() : entry.resume();
    }
  }

  /**
   * 播放音效
   * @param arg 音频加载选项
   * @param options 播放选项
   * @returns 音频ID，-1表示播放失败
   */
  play(arg: ILoadOptions, options: ISoundOptions = { volume: 1 }): number {
    // 静音不播放
    if (this._muted) return -1;

    // 补充基础音效参数
    options.volume = digit.clamp01(options.volume);

    // 从节点池获取音频条目
    const entry = aaron.nodePool.acquire<IAudioEntry>(PRESET.SOUND_ENTRY_OPTIONS.token);
    this.addChild(entry);

    // 处理音效播放结束事件
    const self = this;
    const onEnd = options?.onEnd;
    options.onEnd = function () {
      const index = self._entries.findIndex((v) => v.aid === id);
      if (index > -1) {
        self._entries.splice(index, 1);
      }
      onEnd?.(id, arg.path);
    };

    // 播放音效
    const id = entry.playSound(arg, this._masterVolume * entry.selfVolume, options);
    if (id === -1) {
      entry.stop();
    } else {
      this._entries.push(entry);
    }

    return id;
  }

  /**
   * 暂停音效播放
   * @param id 指定的音频ID，不传则暂停所有音效
   */
  pause(id?: number): void {
    if (id != undefined) {
      this._entries.find((v) => v.aid === id)?.pause();
    } else {
      for (const entry of this._entries) {
        entry.pause();
      }
    }
  }

  /**
   * 恢复音效播放
   * @param id 指定的音频ID，不传则恢复所有音效
   */
  resume(id?: number): void {
    if (id != undefined) {
      this._entries.find((v) => v.aid === id)?.resume();
    } else {
      for (const entry of this._entries) {
        entry.resume();
      }
    }
  }

  /**
   * 停止音效播放并清理资源
   * @param id 指定的音频ID，不传则停止所有音效
   */
  stop(id?: number): void {
    if (id != undefined) {
      const index = this._entries.findIndex((v) => v.aid === id);
      if (index > -1) {
        this._entries[index].stop();
        this._entries.splice(index, 1);
      }
    } else {
      for (const entry of this._entries) {
        entry.stop();
      }
      this._entries.length = 0;
    }
  }
}
