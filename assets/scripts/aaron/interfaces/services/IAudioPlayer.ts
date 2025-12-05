import { AudioSource } from 'cc';

import { IService } from '../IService';
import { ILoadOptions } from './IResLoader';
import { IRecyclableNode } from './pool';

/**
 * 音频播放服务接口
 */
export interface IAudioPlayer extends IService {
  /** 音乐播放服务 */
  music: IMusicPlayer;
  /** 音效播放服务 */
  sound: ISoundPlayer;
  /** 初始化 */
  initialize(): void;
  /** 暂停所有音频 */
  pause(): void;
  /** 恢复所有音频 */
  resume(): void;
  /** 停止所有音频 */
  stop(): void;
}

/**
 * 音乐参数接口
 */
export interface IMusicOptions {
  /** 音量，默认1 */
  volume?: number;
  /** 淡入时间，默认0 */
  fadeIn?: number;
  /** 开始播放回调，参数为音乐ID和音乐资源路径 */
  onStart?: (id: number, url: string) => void;
  /** 循环播放回调，参数为音乐ID、音乐资源路径和循环次数 */
  onRepeat?: (id: number, url: string, round: number) => void;
}

/**
 * 音效参数接口
 */
export interface ISoundOptions {
  /** 音量，默认1 */
  volume?: number;
  /** 重复次数，默认0 */
  repeats?: number;
  /** 淡入时间，默认0 */
  fadeIn?: number;
  /** 淡出时间，默认0 */
  fadeOut?: number;
  /** 开始播放回调，参数为音效ID和音效资源路径 */
  onStart?: (id: number, url: string) => void;
  /** 结束播放回调，参数为音效ID和音效资源路径 */
  onEnd?: (id: number, url: string) => void;
  /** 循环播放回调，参数为音效ID、音效资源路径和循环次数 */
  onRepeat?: (id: number, url: string, round: number) => void;
}

/**
 * 音频资源条目接口
 */
export interface IAudioEntry extends IRecyclableNode {
  /** 音频ID */
  aid: number;
  /** 重复次数 */
  repeats: number;
  /** 重复次数最大值 */
  repeatsMax: number;
  /** 自音量 */
  selfVolume: number;
  /** 音频源 */
  source: AudioSource;
  /** 音频资源路径 */
  url: string;

  /**
   * 播放音乐
   * @param arg 音乐资源加载选项
   * @param volume 音量
   * @param options 音乐参数
   * @returns 音乐ID
   */
  playMusic(arg: ILoadOptions, volume: number, options?: IMusicOptions): number;
  /**
   * 播放音效
   * @param arg 音效资源加载选项
   * @param volume 音量
   * @param options 音效参数
   * @returns 音效ID
   */
  playSound(arg: ILoadOptions, volume: number, options?: ISoundOptions): number;
  /**
   * 设置音量
   * @param value 音量值
   */
  setVolume(value: number): void;
  /** 暂停播放 */
  pause(): void;
  /** 恢复播放 */
  resume(): void;
  /** 停止播放 */
  stop(): void;
  /**
   * 是否正在播放
   * @returns 是否正在播放
   */
  isPlaying(): boolean;
}

/**
 * 音乐播放服务接口
 */
export interface IMusicPlayer {
  /** 主音量 */
  masterVolume: number;
  /** 当前播放的音乐音量 */
  volume: number;
  /** 当前播放的音乐ID */
  current: number;
  /** 是否静音 */
  muted: boolean;
  /**
   * 播放音乐
   * @param arg 音乐资源路径
   * @param options 音乐参数
   * @returns 音乐ID
   */
  play(arg: ILoadOptions, options?: IMusicOptions): number;
  /** 暂停当前播放的音乐 */
  pause(): void;
  /** 恢复当前暂停的音乐 */
  resume(): void;
  /** 停止当前播放的音乐 */
  stop(): void;
}

/**
 * 音效播放服务接口
 */
export interface ISoundPlayer {
  /** 主音量 */
  masterVolume: number;
  /** 是否静音 */
  muted: boolean;
  /**
   * 播放音效
   * @param arg 音效资源加载选项
   * @param options 音效参数
   * @returns 音效ID
   */
  play(arg: ILoadOptions, options?: ISoundOptions): number;
  /**
   * 暂停音效
   * @param id 音效ID，不传则暂停所有音效
   */
  pause(id?: number): void;
  /**
   * 恢复音效
   * @param id 音效ID，不传则恢复所有暂停的音效
   */
  resume(id?: number): void;
  /**
   * 停止音效
   * @param id 音效ID，不传则停止所有音效
   */
  stop(id?: number): void;
}
