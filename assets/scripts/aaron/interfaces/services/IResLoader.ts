import {
  sp,
  AnimationClip,
  Asset,
  AssetManager,
  AudioClip,
  BitmapFont,
  BufferAsset,
  Font,
  ImageAsset,
  JsonAsset,
  ParticleAsset,
  Prefab,
  Rect,
  SpriteAtlas,
  SpriteFrame,
  Texture2D,
  TextAsset,
  TiledMapAsset,
  TTFFont,
  VideoClip,
} from 'cc';
import { Constructor, IMemoryImageSource } from '../../types';
import { IService } from '../IService';

/**
 * 预加载资源项(仅本地资源)
 * - [资源类型, 资源路径]
 *
 * 资源路径形式
 * 1. 本地 l:[bundle@]<path>
 * 2. 远程 r:<url>
 *
 * @example
 * [SpriteFrame, "l:img-hero"]  // 使用默认 bundle (shared)
 * [SpriteFrame, "l:shared@img-hero"]
 */
export type PreloadItem = [Constructor<Asset>, string];

/**
 * 加载资源项
 * - [资源类型, 资源加载选项]
 *
 * 资源路径形式
 * 1. 本地 l:[bundle@]<path>
 * 2. 远程 r:<url>
 *
 * @example
 * [SpriteFrame, { path: "l:img-hero" }] // 使用默认 bundle (shared)
 * [SpriteFrame, { path: "l:resources@img-hero" }] // 指定 bundle
 * [SpriteFrame, { path: "r:img-hero.png" }] // 使用远程资源
 */
export type LoadItem = [Constructor<Asset>, ILoadOptions];

/**
 * 资源加载选项
 */
export interface ILoadOptions {
  /** 资源路径 */
  path: string;
  /** 缓存过期时间（毫秒），0 表示永不过期 */
  cacheExpires?: number;
}

/**
 * 资源类型枚举
 */
export enum AssetType {
  /** 图片 */
  Image = 'image',
  /** 精灵帧 */
  SpriteFrame = 'spriteFrame',
  /** 图集 */
  Atlas = 'atlas',
  /** 纹理 */
  Texture = 'texture',
  /** 预制体 */
  Prefab = 'prefab',
  /** 文本 */
  Text = 'text',
  /** JSON */
  Json = 'json',
  /** 骨骼动画 */
  Spine = 'spine',
  /** 字体 */
  Font = 'font',
  /** 音频 */
  Audio = 'audio',
  /** 粒子 */
  Particle = 'particle',
  /** 瓦片地图 */
  Tmx = 'tmx',
  /** 二进制 */
  Binary = 'binary',
  /** 视频 */
  Video = 'video',
  /** 动画 */
  Animation = 'animation',
}

/**
 * 本地资源容器接口
 */
export interface ILocalContainer {
  /**
   * 解析资源本地路径
   * @param path 资源本地路径
   * @returns
   */
  parsePath(path: string): [string, string];

  /**
   * 项目内是否包含指定包（不论是否已加载）
   * @param ab 包名称
   * @returns
   */
  hasAB(ab: string): boolean;

  /**
   * 根据 uuid 获取资源路径
   * @param uuid 资源 uuid
   * @returns
   */
  pathOf(uuid: string): string;

  /**
   * 根据路径获取资源 uuid
   * @param path 资源路径
   * @returns
   */
  uuidOf(path: string): string;

  /**
   * 加载项目内部包
   * @param ab 包名称
   * @returns
   */
  loadAB(ab: string): Promise<AssetManager.Bundle | null>;

  /**
   * 卸载项目内部包
   * @param ab 包名称
   * @param releaseAll 是否卸载包内资源
   */
  unloadAB(ab: string, releaseAll?: boolean): void;

  /**
   * 包内是否包含指定资源
   * @param path 资源路径
   * @returns
   */
  has(path: string): Promise<boolean>;

  /**
   * 预加载包内指定资源
   * @param path 资源路径
   * @param type 资源类型
   * @returns
   */
  preload<T extends Asset>(type: Constructor<T>, path: string): Promise<boolean>;

  /**
   * 加载包内指定资源
   * @param path 资源路径
   * @param type 资源类型
   * @returns
   */
  load<T extends Asset>(type: Constructor<T>, path: string): Promise<T | null>;

  /**
   * 加载原始图片
   * @param path 资源路径
   * @returns
   */
  loadImage(path: string): Promise<ImageAsset | null>;

  /**
   * 加载精灵
   * @param path 资源路径
   * @returns
   */
  loadSpriteFrame(path: string): Promise<SpriteFrame | null>;

  /**
   * 加载图集
   * @param path 资源路径
   * @returns
   */
  loadAtlas(path: string): Promise<SpriteAtlas | null>;

  /**
   * 加载纹理
   * @param path 资源路径
   * @returns
   */
  loadTexture(path: string): Promise<Texture2D | null>;

  /**
   * 加载预制体
   * @param path 资源路径
   * @returns
   */
  loadPrefab(path: string): Promise<Prefab | null>;

  /**
   * 加载文本
   * @param path 资源路径
   * @returns
   */
  loadText(path: string): Promise<TextAsset | null>;

  /**
   * 加载 JSON
   * @param path 资源路径
   * @returns
   */
  loadJson(path: string): Promise<JsonAsset | null>;

  /**
   * 加载骨骼动画
   * @param path 资源路径
   * @returns
   */
  loadSpine(path: string): Promise<sp.SkeletonData | null>;

  /**
   * 加载字体
   * @param path 资源路径
   * @returns
   */
  loadFont(path: string): Promise<Font | null>;

  /**
   * 加载位图字体
   * @param path 资源路径
   * @returns
   */
  loadBitmapFont(path: string): Promise<BitmapFont | null>;

  /**
   * 加载音频切片
   * @param path 资源路径
   * @returns
   */
  loadAudio(path: string): Promise<AudioClip | null>;

  /**
   * 加载粒子
   * @param path 资源路径
   * @returns
   */
  loadParticle(path: string): Promise<ParticleAsset>;

  /**
   * 加载瓦片地图
   * @param path 资源路径
   * @returns
   */
  loadTmx(path: string): Promise<TiledMapAsset | null>;

  /**
   * 加载二进制文件
   * @param path 资源路径
   * @returns
   */
  loadBinary(path: string): Promise<BufferAsset | null>;

  /**
   * 加载视频切片
   * @param path 资源路径
   * @returns
   */
  loadVideo(path: string): Promise<VideoClip | null>;

  /**
   * 加载动画切片
   * @param path 资源路径
   * @returns
   */
  loadAnimation(path: string): Promise<AnimationClip | null>;
}

/**
 * 远程资源容器接口
 */
export interface IRemoteContainer {
  /** 资源服务器地址 */
  server: string;
  /** 清空容器 */
  clear(): void;
  /**
   * 创建图像资源
   * @param img 原始图像
   * @returns
   */
  createImageAsset(img: IMemoryImageSource): ImageAsset;

  /** 获取图集名称 */
  getAtlasName(atlas: string): string;

  /** 解析矩形信息 TexturePacker */
  parseRect(rect: string): Rect;

  /**
   * 添加参数
   * @param key 键
   * @param val 值
   */
  appendParam(key: string, val: string): void;

  /**
   * 设置参数
   * @param params 参数
   */
  setParams(params: Record<string, string>): void;

  /** 清空参数 */
  clearParams(): void;

  /**
   * 组织网址
   * @param raw 资源地址
   * @param timestamp 是否添加时间戳
   * @returns
   */
  makeUrl(raw: string, timestamp: boolean): string;

  /** 原始网址 */
  nativeUrlOf(url: string): string;
  /**
   * 加载音频切片
   * @param url 资源路径
   * @returns
   */
  loadAudio(url: string): Promise<AudioClip | null>;

  /**
   * 加载二进制文件
   * @param url 资源路径
   * @returns
   */
  loadBinary(url: string): Promise<BufferAsset | null>;

  /**
   * 加载 astc 图像
   * @param url 资源路径
   * @returns
   */
  loadASTC(url: string): Promise<SpriteFrame | null>;

  /**
   * 加载 ttf 字体
   * @param url 资源路径
   * @returns
   */
  loadTTFFont(url: string): Promise<TTFFont | null>;

  /**
   * 加载位图字体
   * @param url 资源路径
   */
  loadBitmapFont(url: string): Promise<BitmapFont | null>;

  /**
   * 加载图片
   * @param url 资源路径
   * @returns
   */
  loadImage(url: string): Promise<ImageAsset | null>;

  /**
   * 加载 JSON
   * @param url 资源路径
   * @returns
   */
  loadJson(url: string): Promise<JsonAsset | null>;

  /**
   * 加载骨骼动画
   * @param url 资源路径
   * @returns
   */
  loadSpine(url: string): Promise<sp.SkeletonData | null>;

  /**
   * 加载图集
   * @param url 资源路径
   * @returns
   */
  loadSpriteAtlas(url: string): Promise<SpriteAtlas | null>;

  /**
   * 加载精灵
   * @param url 资源路径
   * @returns
   */
  loadSpriteFrame(url: string): Promise<SpriteFrame | null>;

  /**
   * 加载纹理
   * @param url 资源路径
   * @returns
   */
  loadTexture(url: string): Promise<Texture2D | null>;

  /**
   * 加载文本
   * @param url 资源路径
   * @returns
   */
  loadText(url: string): Promise<TextAsset | null>;

  /**
   * 加载视频
   * @param url 资源路径
   * @returns
   */
  loadVideo(url: string): Promise<VideoClip | null>;

  /**
   * 加载远程资源
   * @param type 资源类型
   * @param path 资源路径
   * @returns 资源实例
   */
  load<T extends Asset>(type: Constructor<T>, path: string): Promise<T | null>;
}

/**
 * 资源加载器接口
 */
export interface IResLoader extends IService {
  /** 本地资源容器 */
  readonly local: ILocalContainer;

  /** 远程资源容器 */
  readonly remote: IRemoteContainer;

  /**
   * 判断是否为远程资源
   * @param path 资源路径
   * @returns 是否为远程资源
   */
  isRemote(path: string): boolean;

  /**
   * 判断是否为本地资源
   * @param path 资源路径
   * @returns 是否为本地资源
   */
  isLocal(path: string): boolean;

  /**
   * 加载资源包
   * @param bundle 包名称
   * @returns 资源包实例
   */
  loadBundle(bundle: string): Promise<AssetManager.Bundle | null>;

  /**
   * 卸载资源包
   * @param bundle 包名称
   * @param releaseAll 是否释放所有资源
   */
  unloadBundle(bundle: string, releaseAll?: boolean): void;

  /**
   * 通用资源加载方法
   * @note 仅加载资源,引用计数需要用户在加载完成后自行处理 `ResCache.addRef`
   * @param type 资源类型构造函数
   * @param options 加载选项
   * @returns 资源实例
   */
  load<T extends Asset>(type: Constructor<T>, options: ILoadOptions): Promise<T | null>;

  /**
   * 加载图片资源
   * @param path 资源路径
   * @returns 图片资源实例
   */
  loadImage(path: string): Promise<ImageAsset | null>;

  /**
   * 加载精灵帧
   * @param path 资源路径
   * @returns 精灵帧实例
   */
  loadSpriteFrame(path: string): Promise<SpriteFrame | null>;

  /**
   * 加载图集
   * @param path 资源路径
   * @returns 图集实例
   */
  loadAtlas(path: string): Promise<SpriteAtlas | null>;

  /**
   * 加载纹理
   * @param path 资源路径
   * @returns 纹理实例
   */
  loadTexture(path: string): Promise<Texture2D | null>;

  /**
   * 加载预制体
   * @param path 资源路径
   * @returns 预制体实例
   */
  loadPrefab(path: string): Promise<Prefab | null>;

  /**
   * 加载文本
   * @param path 资源路径
   * @returns 文本资源实例
   */
  loadText(path: string): Promise<TextAsset | null>;

  /**
   * 加载 JSON
   * @param path 资源路径
   * @returns JSON 资源实例
   */
  loadJson(path: string): Promise<JsonAsset | null>;

  /**
   * 加载骨骼动画
   * @param path 资源路径
   * @returns 骨骼动画资源实例
   */
  loadSpine(path: string): Promise<sp.SkeletonData | null>;

  /**
   * 加载字体
   * @param path 资源路径
   * @returns 字体资源实例
   */
  loadFont(path: string): Promise<Font | null>;

  /**
   * 加载文图字体
   * @param path 资源路径
   * @returns 位图字体资源实例
   */
  loadBitmapFont(path: string): Promise<BitmapFont | null>;

  /**
   * 加载音频
   * @param path 资源路径
   * @returns 音频资源实例
   */
  loadAudio(path: string): Promise<AudioClip | null>;

  /**
   * 加载粒子
   * @param path 资源路径
   * @returns 粒子资源实例
   */
  loadParticle(path: string): Promise<ParticleAsset | null>;

  /**
   * 加载瓦片地图
   * @param path 资源路径
   * @returns 瓦片地图资源实例
   */
  loadTmx(path: string): Promise<TiledMapAsset | null>;

  /**
   * 加载二进制文件
   * @param path 资源路径
   * @returns 二进制资源实例
   */
  loadBinary(path: string): Promise<BufferAsset | null>;

  /**
   * 加载视频
   * @param path 资源路径
   * @returns 视频资源实例
   */
  loadVideo(path: string): Promise<VideoClip | null>;

  /**
   * 加载动画
   * @param path 资源路径
   * @returns 动画资源实例
   */
  loadAnimation(path: string): Promise<AnimationClip | null>;

  /**
   * 释放资源
   * @param path 资源路径
   */
  release(path: string): void;

  /**
   * 预加载资源列表
   * @param items 资源项列表 [路径, 类型, bundle(可选)]
   * @param onProgress 进度回调
   * @returns 加载结果
   * @example
   * ```typescript
   * // 使用默认 bundle (shared)
   * await ioc.loader.preload([
   *   [SpriteFrame, "l:img-hero"],
   *   [AudioClip, "l:aud-bgm"],
   * ]);
   *
   * // 指定不同的 bundle
   * await ioc.loader.preload([
   *   [SpriteFrame, "l:resources@img-logo"],
   *   [SpriteFrame, "l:img-hero"],
   *   [AudioClip, "l:shared@aud-bgm"],
   * ]);
   * ```
   */
  preload(
    items: PreloadItem[],
    onProgress?: (finished: number, total: number, path: string, loaded: boolean) => void,
  ): Promise<void>;

  /**
   * 批量顺序加载资源（串行）
   * @param items 资源项列表
   * @param onProgress 进度回调
   */
  loadMany(
    items: LoadItem[],
    onProgress?: (finished: number, total: number, path?: string, loaded?: boolean) => void,
  ): Promise<void>;

  /**
   * 批量并行加载资源（不带进度）
   * @description 适合一股脑丢进去，不管成功还是失败
   * @param items 资源项列表
   */
  loadBatch(items: LoadItem[]): Promise<PromiseSettledResult<Asset>[]>;

  /**
   * 顺序加载资源队列（串行，可取消）
   * @param items 资源项列表
   * @param onProgress 进度回调
   * @param onComplete 完成回调
   * @returns 取消加载函数
   */
  loadSequence(
    tasks: LoadItem[],
    onProgress?: (finished: number, total: number, path: string, success: boolean) => void,
    onComplete?: (finished: number, total: number) => void | Promise<void>,
  ): () => void;

  /**
   * 加载资源队列（并行，可取消）
   * @param items 资源项列表
   * @param onProgress 进度回调
   * @param onComplete 完成回调
   * @param concurrency 并发数
   * @returns 取消加载函数
   */
  loadParallel(
    items: LoadItem[],
    onProgress?: (finished: number, total: number, path: string, success: boolean) => void,
    onComplete?: (finished: number, total: number) => void | Promise<void>,
    concurrency?: number,
  ): () => void;
}

/**
 * 加载任务接口
 */
export interface ILoadTask {
  /** 资源类型 */
  type: Constructor<Asset>;
  /** 加载选项 */
  options: ILoadOptions;
  /** 完成回调 */
  onComplete?: (asset: Asset | null) => void;
  /** 成功回调 */
  onSuccess?: (asset: Asset) => void;
  /** 失败回调 */
  onFail?: () => void;
  /** 任务是否已取消 */
  get aborted(): boolean;
  /** 任务是否加载中 */
  get loading(): boolean;
  /** 加载任务 */
  load(): void;
  /** 取消任务 */
  abort(): void;
}
