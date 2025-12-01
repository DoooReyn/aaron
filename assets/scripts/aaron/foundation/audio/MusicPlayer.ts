import { Node } from 'cc';
import { IMusicPlayer, IAudioEntry, IMusicOptions } from '../../interfaces';
import { PRESET } from '../../macro';
import { aaron } from '../../core';

/**
 * 音乐播放服务
 */
export class MusicPlayer extends Node implements IMusicPlayer {
  /** 主音量 */
  private _masterVolume: number = 1;
  get masterVolume() {
    return this._masterVolume;
  }
  set masterVolume(value: number) {
    this._masterVolume = value;
    if (this._entry) {
      this._entry.setVolume(this._masterVolume * this._volume);
    }
  }

  /** 当前播放的音乐音量 */
  private _volume: number = 1;
  get volume() {
    return this._volume;
  }
  set volume(value: number) {
    this._volume = value;
    if (this._entry) {
      this._entry.setVolume(this._masterVolume * this._volume);
    }
  }

  /** 音频条目 */
  private _entry: IAudioEntry;

  /** 当前播放的音乐ID */
  private _current: number = -1;
  get current() {
    return this._current;
  }

  /** 是否静音 */
  private _muted: boolean = false;
  get muted() {
    return this._muted;
  }
  set muted(value: boolean) {
    this._muted = value;
    this.muted ? this._entry?.pause() : this._entry?.resume();
  }

  play(url: string, options?: IMusicOptions): number {
    // 音乐同时只能有一份实例，因此如果正在播放相同的音乐，直接返回当前ID
    if (this._entry && this._entry.url === url) {
      aaron.logger.if('🎵 音乐正在播放中 {0}', url);
      return this._current;
    }

    // 先停止上一个音乐
    this.stop();

    // 从节点池获取音频条目
    const entry = aaron.nodePool.acquire<IAudioEntry>(PRESET.MUSIC_ENTRY_OPTIONS.token);
    this.addChild(entry);

    // 播放音乐
    const id = entry.playMusic(url, this._masterVolume * this._volume, options);
    if (id === -1) {
      entry.stop();
    } else {
      this._entry = entry;
      this._current = id;
    }

    return id;
  }

  pause(): void {
    if (this.current > -1) {
      this._entry?.pause();
    }
  }

  resume(): void {
    if (this.current > -1) {
      this._entry?.resume();
    }
  }

  stop(): void {
    if (this.current > -1) {
      this._entry?.stop();
      this._entry = null;
      this._current = -1;
    }
  }
}
