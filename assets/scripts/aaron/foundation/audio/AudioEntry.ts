import { macro, tween, AudioClip, AudioSource, Node } from 'cc';

import { aaron } from '../../core';
import { IAudioEntry, ILoadOptions, IMusicOptions, ISoundOptions } from '../../interfaces';

/**
 * 音频资源条目
 */
export class AudioEntry extends Node implements IAudioEntry {
  token: string;
  createdAt: number;
  recycledAt: number;
  source: AudioSource;
  url: string;
  aid: number;
  repeats: number = 0;
  repeatsMax: number = 0;

  constructor() {
    super('audio-entry');
  }

  /** 暂停时间 */
  private _pauseAt: number = 0;

  onInitialize(): void {
    this.source = null;
    this.url = null;
    this._pauseAt = 0;
    this.repeats = 0;
    this.repeatsMax = 0;
    this.aid = -1;
    this.source = this.acquire(AudioSource);
  }

  onRecycled(): void {
    aaron.resCache.decRef(this.url);
    this.targetOff(this);
    this.url = null;
    this._pauseAt = 0;
    this.source = null;
    this.aid = -1;
    this.repeats = 0;
    this.repeatsMax = 0;
  }

  /** 自音量 */
  private _selfVolume: number = 1;
  get selfVolume() {
    return this._selfVolume;
  }
  set selfVolume(value: number) {
    this._selfVolume = value;
  }

  playMusic(arg: ILoadOptions, volume: number, options: IMusicOptions = { volume: 1 }): number {
    // 获取音频ID
    const self = this;
    const id = aaron.ascendingId.next('audio-entry');
    this.aid = id;

    // 加载音频剪辑
    aaron.resLoader.load(AudioClip, arg).then((clip) => {
      if (!clip) {
        self.stop();
        return;
      }

      // 增加资源引用计数
      aaron.resCache.addRef(arg.path);

      // 播放音乐
      const duration = clip.getDuration();
      options.fadeIn = Math.min(duration, options.fadeIn ?? 0);
      function play() {
        if (options.fadeIn > 0) {
          self.source.volume = 0;
          tween(self.source).to(options.fadeIn, { volume: volume }).start();
        }
        self.source.play();
      }

      // 一次循环完成
      function onEnd() {
        self.repeats++;
        options?.onRepeat?.(id, arg.path, self.repeats);
        play();
      }

      // 初始化重复次数（音乐默认无限循环，直到主动停止）
      self.repeats = 0;
      self.repeatsMax = macro.REPEAT_FOREVER;
      self.on(AudioSource.EventType.ENDED, onEnd, self);

      // 同步音频源，准备播放
      self.url = arg.path;
      self.source.clip = clip;
      self.source.volume = volume;
      self.source.loop = false;
      play();
      options?.onStart?.(id, arg.path);
    });

    return id;
  }

  playSound(arg: ILoadOptions, volume: number, options?: ISoundOptions): number {
    // 获取音频ID
    const self = this;
    const id = aaron.ascendingId.next('audio-entry');
    this.aid = id;

    // 播放音效
    aaron.resLoader.load(AudioClip, arg).then((clip) => {
      if (!clip) {
        self.aid = -1;
        self.stop();
        return;
      }

      // 增加资源引用计数
      aaron.resCache.addRef(arg.path);

      // 初始化音效选项
      const duration = clip.getDuration();
      options.fadeIn = Math.min(duration, options.fadeIn ?? 0);
      options.fadeOut = Math.min(duration, options.fadeOut ?? 0);

      // 播放音效
      function play() {
        if (options.fadeIn > 0) {
          self.source.volume = 0;
          tween(self.source).to(options.fadeIn, { volume: volume }).start();
        } else if (options.fadeOut > 0) {
          self.source.volume = volume;
          tween(self.source).to(options.fadeOut, { volume: 0 }).start();
        }
        self.source.play();
      }

      // 一次循环完成
      function onEnd() {
        self.repeats++;
        if (self.repeats <= self.repeatsMax) {
          options?.onRepeat?.(id, arg.path, self.repeats);
          play();
        } else {
          options?.onEnd?.(id, arg.path);
          self.stop();
        }
      }

      // 初始化重复次数（音乐默认无限循环，直到主动停止）
      this.repeats = 0;
      this.repeatsMax = options.repeats ?? 0;
      this.on(AudioSource.EventType.ENDED, onEnd, this);

      // 同步音频源，准备播放
      this.url = arg.path;
      this.source.clip = clip;
      this.source.volume = volume;
      this.source.loop = false;
      play();
      options?.onStart?.(id, arg.path);
    });

    return id;
  }
  setVolume(value: number): void {
    if (this.source) {
      this.source.volume = value;
    }
  }
  pause(): void {
    if (this.source && this.source.playing) {
      this._pauseAt = this.source.currentTime;
      this.source.pause();
    }
  }
  resume(): void {
    if (this.source && this._pauseAt > 0) {
      this.source.currentTime = this._pauseAt;
      this.source.play();
      this._pauseAt = 0;
    }
  }
  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source.clip = null;
      this.source = null;
    }
    aaron.nodePool.recycle(this);
  }
  isPlaying(): boolean {
    return this.source && this.source.playing;
  }
}
