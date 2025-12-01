import { Node } from 'cc';
import { ISoundPlayer, IAudioEntry, ISoundOptions } from '../../interfaces';
import { PRESET } from '../../macro';
import { aaron } from '../../core';
import { digit } from '../../utils';

/**
 * 音效播放服务
 */
export class SoundPlayer extends Node implements ISoundPlayer {
  /** 音频条目 */
  private _entries: IAudioEntry[] = [];

  /** 主音量 */
  private _masterVolume: number = 1;
  get masterVolume() {
    return this._masterVolume;
  }
  set masterVolume(value: number) {
    this._masterVolume = value;
    for (const entry of this._entries) {
      entry.setVolume(this._masterVolume * entry.selfVolume);
    }
  }

  /** 是否静音 */
  private _muted: boolean = false;
  get muted() {
    return this._muted;
  }
  set muted(value: boolean) {
    this._muted = value;
    for (const entry of this._entries) {
      this.muted ? entry.pause() : entry.resume();
    }
  }

  play(url: string, options: ISoundOptions = { volume: 1 }): number {
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
      onEnd?.(id, url);
    };

    // 播放音效
    const id = entry.playSound(url, this._masterVolume * entry.selfVolume, options);
    if (id === -1) {
      entry.stop();
    } else {
      this._entries.push(entry);
    }

    return id;
  }

  pause(id?: number): void {
    if (id != undefined) {
      this._entries.find((v) => v.aid === id)?.pause();
    } else {
      for (const entry of this._entries) {
        entry.pause();
      }
    }
  }

  resume(id?: number): void {
    if (id != undefined) {
      this._entries.find((v) => v.aid === id)?.resume();
    } else {
      for (const entry of this._entries) {
        entry.resume();
      }
    }
  }

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
