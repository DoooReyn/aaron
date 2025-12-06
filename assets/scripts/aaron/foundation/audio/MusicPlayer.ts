import { Node } from 'cc';

import { aaron } from '../../core';
import { IAudioEntry, ILoadOptions, IMusicOptions, IMusicPlayer } from '../../interfaces';
import { MESSAGES, PRESET } from '../../macro';

/**
 * 音乐播放服务
 *
 * 提供背景音乐的播放、暂停、恢复和停止功能
 * 支持音量控制和静音功能
 */
export class MusicPlayer extends Node implements IMusicPlayer {
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
    if (this._entry) {
      this._entry.setVolume(this._masterVolume * this._volume);
    }
  }

  /** 当前播放的音乐音量 */
  private _volume: number = 1;

  /**
   * 获取当前播放的音乐音量
   * @returns 音量值（0-1）
   */
  get volume(): number {
    return this._volume;
  }

  /**
   * 设置当前播放的音乐音量
   * @param value 音量值（0-1）
   */
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

  /**
   * 获取当前播放的音乐ID
   * @returns 音乐ID，-1表示没有正在播放的音乐
   */
  get current(): number {
    return this._current;
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
    this.muted ? this._entry?.stop() : this._entry?.resume();
  }

  /**
   * 播放音乐
   * @param arg 音乐加载选项
   * @param options 播放选项
   * @returns 音乐ID，-1表示播放失败
   */
  play(arg: ILoadOptions, options?: IMusicOptions): number {
    // 静音不播放
    if (this._muted) return -1;

    // 音乐同时只能有一份实例，因此如果正在播放相同的音乐，直接返回当前ID
    if (this._entry && this._entry.url === arg.path) {
      aaron.audioPlayer.logger.if(MESSAGES.AUDIO_PLAYER.MUSIC_PLAYING, arg.path);
      return this._current;
    }

    // 先停止上一个音乐
    this.stop();

    // 从节点池获取音频条目
    const entry = aaron.nodePool.acquire<IAudioEntry>(PRESET.MUSIC_ENTRY_OPTIONS.token);
    this.addChild(entry);

    // 播放音乐
    const id = entry.playMusic(arg, this._masterVolume * this._volume, options);
    if (id === -1) {
      entry.stop();
    } else {
      this._entry = entry;
      this._current = id;
    }

    return id;
  }

  /**
   * 暂停当前播放的音乐
   */
  pause(): void {
    if (this.current > -1) {
      this._entry?.pause();
    }
  }

  /**
   * 恢复播放暂停的音乐
   */
  resume(): void {
    if (this.current > -1) {
      this._entry?.resume();
    }
  }

  /**
   * 停止播放音乐并清理资源
   */
  stop(): void {
    if (this.current > -1) {
      this._entry?.stop();
      this._entry = null;
      this._current = -1;
    }
  }
}
