import { AudioSource, Node, macro, tween } from 'cc';
import { Service } from '../core';
import {
  IAppLauncher,
  IAscendingId,
  IAudioEntry,
  IAudioPlayer,
  IEventBus,
  ILogger,
  IMusicOptions,
  IMusicPlayer,
  INodePoolContainer,
  IResCache,
  IResLoader,
  ISoundOptions,
  ISoundPlayer,
} from '../interfaces';
import { EVENTS, PRESET, SERVICES } from '../macro';

class AudioEntry extends Node implements IAudioEntry {
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

  /** 播放器 */
  private _player: AudioPlayer;

  onInitialize(player: AudioPlayer): void {
    this.source = null;
    this.url = null;
    this._pauseAt = 0;
    this.repeats = 0;
    this.repeatsMax = 0;
    this._player = player;
    this.aid = -1;
    this.source = this.acquire(AudioSource);
  }

  onRecycled(): void {
    if (this.url) {
      const cache = this._player.resolve<IResCache>(SERVICES.RES_CACHE);
      cache.decRef(this.url);
    }
    this.targetOff(this);
    this.url = null;
    this._player = null;
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

  playMusic(url: string, volume: number, options?: IMusicOptions): number {
    // 获取音频ID
    const self = this;
    const ids = this._player.resolve<IAscendingId>(SERVICES.ASCENDING_ID);
    const id = ids.next('audio-entry');
    this.aid = id;

    // 加载音频剪辑
    const loader = this._player.resolve<IResLoader>(SERVICES.RES_LOADER);
    loader.loadAudio(url).then((clip) => {
      if (!clip) {
        self.stop();
        return;
      }

      // 增加资源引用计数
      const cache = self._player.resolve<IResCache>(SERVICES.RES_CACHE);
      cache.addRef(url);

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
        options?.onRepeat?.(id, url, self.repeats);
        play();
      }

      // 初始化重复次数（音乐默认无限循环，直到主动停止）
      self.repeats = 0;
      self.repeatsMax = macro.REPEAT_FOREVER;
      self.on(AudioSource.EventType.ENDED, onEnd, self);

      // 同步音频源，准备播放
      self.url = url;
      self.source.clip = clip;
      self.source.volume = volume;
      self.source.loop = false;
      play();
      options?.onStart?.(id, url);
    });

    return id;
  }

  playSound(url: string, volume: number, options?: ISoundOptions): number {
    // 获取音频ID
    const self = this;
    const ids = this._player.resolve<IAscendingId>(SERVICES.ASCENDING_ID);
    const id = ids.next('audio-entry');
    this.aid = id;

    // 播放音效
    const loader = this._player.resolve<IResLoader>(SERVICES.RES_LOADER);
    loader.loadAudio(url).then((clip) => {
      if (!clip) {
        self.aid = -1;
        self.stop();
        return;
      }

      // 增加资源引用计数
      const cache = self._player.resolve<IResCache>(SERVICES.RES_CACHE);
      cache.addRef(url);

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
          options?.onRepeat?.(id, url, self.repeats);
          play();
        } else {
          options?.onEnd?.(id, url);
          self.stop();
        }
      }

      // 初始化重复次数（音乐默认无限循环，直到主动停止）
      this.repeats = 0;
      this.repeatsMax = options.repeats ?? 0;
      this.on(AudioSource.EventType.ENDED, onEnd, this);

      // 同步音频源，准备播放
      this.url = url;
      this.source.clip = clip;
      this.source.volume = volume;
      this.source.loop = false;
      play();
      options?.onStart?.(id, url);
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
    this._player.resolve<INodePoolContainer>(SERVICES.NODE_POOL).recycle(this);
  }
  isPlaying(): boolean {
    return this.source && this.source.playing;
  }
}

class MusicPlayer extends Node implements IMusicPlayer {
  constructor(name: string, private readonly _player: AudioPlayer) {
    super(name);
  }
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
      this._player.resolve<ILogger>(SERVICES.LOGGER).if('🎵 音乐正在播放中 {0}', url);
      return this._current;
    }

    // 先停止上一个音乐
    this.stop();

    // 从节点池获取音频条目
    const nodePool = this._player.resolve<INodePoolContainer>(SERVICES.NODE_POOL);
    const entry = nodePool.acquire<IAudioEntry>(PRESET.MUSIC_ENTRY_OPTIONS.token, this._player);
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

class SoundPlayer extends Node implements ISoundPlayer {
  constructor(name: string, private readonly _player: AudioPlayer) {
    super(name);
  }

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

  play(url: string, options?: ISoundOptions): number {
    // 从节点池获取音频条目
    const nodePool = this._player.resolve<INodePoolContainer>(SERVICES.NODE_POOL);
    const entry = nodePool.acquire<IAudioEntry>(PRESET.SOUND_ENTRY_OPTIONS.token, this._player);
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

/**
 * 音频播放服务
 */
export class AudioPlayer extends Service implements IAudioPlayer {
  music: MusicPlayer;
  sound: SoundPlayer;

  initialize() {
    const root = this.resolve<IAppLauncher>(SERVICES.APP_LAUNCHER).root;
    const nodePool = this.resolve<INodePoolContainer>(SERVICES.NODE_POOL);
    nodePool.registerByConstructor(AudioEntry, PRESET.MUSIC_ENTRY_OPTIONS);
    nodePool.registerByConstructor(AudioEntry, PRESET.SOUND_ENTRY_OPTIONS);

    this.music = new MusicPlayer('music', this);
    this.sound = new SoundPlayer('sound', this);
    root.insertChild(this.music, 1);
    root.insertChild(this.sound, 2);

    const eventBus = this.resolve<IEventBus>(SERVICES.EVENT_BUS);
    eventBus.app.on(EVENTS.APP.ENTER_FOREGROUND, this.resume, this);
    eventBus.app.on(EVENTS.APP.ENTER_BACKGROUND, this.pause, this);
    eventBus.app.on(
      EVENTS.APP.EXIT,
      () => {
        this.music.stop();
        this.sound.stop();
        eventBus.app.off(undefined, this);
      },
      this
    );
  }

  pause(): void {
    this.music.pause();
    this.sound.pause();
  }

  resume(): void {
    this.music.resume();
    this.sound.resume();
  }

  stop(): void {
    this.music.stop();
    this.sound.stop();
  }
}
