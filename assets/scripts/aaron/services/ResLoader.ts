import { Constructor } from 'cc';
import {
  sp,
  __private,
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
  SpriteAtlas,
  SpriteFrame,
  Texture2D,
  TextAsset,
  TiledMapAsset,
  VideoClip,
} from 'cc';
import {
  CacheSource,
  PreloadItem,
  ILoadOptions,
  LoadItem,
  ILoadTask,
  IResLoader,
  IResCache,
  ILogger,
} from '../interfaces';
import { PRESET, SERVICES } from '../macro';
import { list } from '../utils';
import { Service } from '../core';
import { LoadTask, ResLocal, ResRemote } from '../foundation';

/**
 * 资源加载服务
 * @description 统一管理本地和远程资源的加载，自动处理缓存
 */
export class ResLoader extends Service implements IResLoader {
  readonly local: ResLocal = new ResLocal();
  readonly remote: ResRemote = new ResRemote();

  /**
   * 解析资源路径
   * @param path 资源路径
   * @returns [缓存key, 原始路径]
   */
  private parsePath(path: string): [CacheSource, string, string] {
    let raw = path.slice(2);
    if (this.isLocal(path)) {
      raw = this.local.parsePath(raw).join('@');
      return [CacheSource.Local, 'l:' + raw, raw];
    } else if (this.isRemote(path)) {
      return [CacheSource.Remote, path, raw];
    } else {
      return [CacheSource.Unknown, '', ''];
    }
  }

  isRemote(path: string): boolean {
    return path.startsWith('r:');
  }

  isLocal(path: string) {
    return path.startsWith('l:');
  }

  loadBundle(bundle: string): Promise<AssetManager.Bundle | null> {
    return this.local.loadAB(bundle);
  }

  unloadBundle(bundle: string, releaseAll: boolean = false): void {
    // 清理该包的所有缓存
    const cache = this.resolve<IResCache>(SERVICES.RES_CACHE);
    const prefix = `l:${bundle}@`;
    const keys = cache.keys(CacheSource.Local);
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        cache.delete(key, true);
      }
    });

    // 卸载资源包
    this.local.unloadAB(bundle, releaseAll);

    this.resolve<ILogger>(SERVICES.LOGGER).df('⛔ 资源加载器: 卸载资源包 {0}', bundle);
  }

  async preload(
    items: PreloadItem[],
    onProgress?: (finished: number, total: number, path?: string, loaded?: boolean) => void,
  ): Promise<void> {
    const logger = this.resolve<ILogger>(SERVICES.LOGGER);
    const total = items.length;
    let finished = 0;

    for (const item of items) {
      const [type, path] = item;
      const loaded = await this.local.preload(type, path);

      if (loaded) {
        finished++;
      }

      if (onProgress) {
        onProgress(finished, total, path, loaded);
      }

      if (!loaded) {
        logger.ef('❌ 资源加载器: 预加载失败 {0}', path);
      }
    }

    logger.df('✅ 资源加载器: 预加载完成 {0}/{1}', finished, total);
  }

  async load<T extends Asset>(type: Constructor<T>, options: ILoadOptions): Promise<T | null> {
    const { path, cacheExpires = PRESET.ASSET_EXPIRES_MS } = options;
    const [source, key, raw] = this.parsePath(path);
    if (source == CacheSource.Unknown) {
      this.resolve<ILogger>(SERVICES.LOGGER).wf('⚠️ 资源加载器: 跳过无效路径 {0}', path);
      return null;
    }

    // 检查缓存
    const cache = this.resolve<IResCache>(SERVICES.RES_CACHE);
    if (cache.has(key)) {
      this.resolve<ILogger>(SERVICES.LOGGER).df('✅ 资源加载器: 命中缓存 {0}', key);
      return cache.get<T>(key);
    }

    // 加载资源
    let asset: T | null = null;
    if (source == CacheSource.Remote) {
      asset = await this.remote.load<T>(type, raw);
    } else {
      asset = await this.local.load<T>(type, raw);
    }

    // 缓存资源
    if (asset) {
      cache.set({
        key,
        asset,
        source,
        expires: cacheExpires,
        refCount: 0,
      });

      this.resolve<ILogger>(SERVICES.LOGGER).df('✅ 资源加载器: 加载并缓存 {0}', key);
    }

    return asset;
  }

  loadImage(path: string): Promise<ImageAsset | null> {
    return this.load(ImageAsset, { path });
  }

  loadSpriteFrame(path: string): Promise<SpriteFrame | null> {
    return this.load(SpriteFrame, { path });
  }

  loadAtlas(path: string): Promise<SpriteAtlas | null> {
    return this.load(SpriteAtlas, { path });
  }

  loadTexture(path: string): Promise<Texture2D | null> {
    return this.load(Texture2D, { path });
  }

  loadPrefab(path: string): Promise<Prefab | null> {
    return this.load(Prefab, { path });
  }

  loadText(path: string): Promise<TextAsset | null> {
    return this.load(TextAsset, { path });
  }

  loadJson(path: string): Promise<JsonAsset | null> {
    return this.load(JsonAsset, { path });
  }

  loadSpine(path: string): Promise<sp.SkeletonData | null> {
    return this.load(sp.SkeletonData, { path });
  }

  loadFont(path: string): Promise<Font | null> {
    return this.load(Font, { path });
  }

  loadBitmapFont(path: string): Promise<BitmapFont | null> {
    return this.load(BitmapFont, { path });
  }

  loadAudio(path: string): Promise<AudioClip | null> {
    return this.load(AudioClip, { path });
  }

  loadParticle(path: string): Promise<ParticleAsset | null> {
    return this.load(ParticleAsset, { path });
  }

  loadTmx(path: string): Promise<TiledMapAsset | null> {
    return this.load(TiledMapAsset, { path });
  }

  loadBinary(path: string): Promise<BufferAsset | null> {
    return this.load(BufferAsset, { path });
  }

  loadVideo(path: string): Promise<VideoClip | null> {
    return this.load(VideoClip, { path });
  }

  loadAnimation(path: string): Promise<AnimationClip | null> {
    return this.load(AnimationClip, { path });
  }

  release(path: string): void {
    const [source, key] = this.parsePath(path);
    if (source !== CacheSource.Unknown) {
      this.resolve<IResCache>(SERVICES.RES_CACHE).delete(key, true);
      this.resolve<ILogger>(SERVICES.LOGGER).df('⛔ 资源加载器: 释放资源 {0}', key);
    }
  }

  async loadMany(
    items: LoadItem[],
    onProgress?: (finished: number, total: number, path?: string, loaded?: boolean) => void,
  ): Promise<void> {
    const logger = this.resolve<ILogger>(SERVICES.LOGGER);
    const total = items.length;
    let finished = 0;
    let finishedList = [];

    for (const item of items) {
      const [type, options] = item;
      const asset = await this.load(type, options);
      const url = this.parsePath(options.path)[1];

      if (asset) {
        finished++;
        finishedList.push('✅ ' + url);
      } else {
        finishedList.push('❌ ' + url);
        logger.ef('❌ 资源加载器: 加载失败 {0}', url);
      }

      if (onProgress) {
        onProgress(finished, total, url, asset != null);
      }
    }

    logger.df('✅ 资源加载器: 加载完成 {0}/{1} 资源列表:\n {2}', finished, total, finishedList.join('\n '));
  }

  loadBatch(items: LoadItem[]) {
    return Promise.allSettled(items.map((v) => this.load(...v)));
  }

  loadSequence(
    tasks: LoadItem[],
    onProgress?: (finished: number, total: number, path: string, success: boolean) => void,
    onComplete?: (finished: number, total: number) => void | Promise<void>,
  ): () => void {
    const total = tasks.length;
    let index = 0;
    let finished = 0;
    let aborted = false;
    let current: ILoadTask | undefined = undefined;

    const next = () => {
      if (aborted) {
        return;
      }

      if (index >= total) {
        onComplete?.(finished, total);
        return;
      }

      const task = tasks[index++];
      const [type, options] = task;
      current = new LoadTask(type, options, (asset) => {
        if (asset) {
          finished++;
        }

        const url = this.parsePath(options.path)[1];

        if (onProgress) {
          onProgress(finished, total, url, asset != null);
        }

        if (!asset) {
          this.resolve<ILogger>(SERVICES.LOGGER).ef('资源加载器: 加载失败 {0}', url);
        }

        next();
      });
      current.load();
    };

    next();

    return function abort() {
      if (!aborted) {
        aborted = true;
        current?.abort();
        current = undefined;
      }
    };
  }

  loadParallel(
    items: LoadItem[],
    onProgress?: (finished: number, total: number, path: string, success: boolean) => void,
    onComplete?: (finished: number, total: number) => void,
    concurrency: number = 0,
  ) {
    let finished = 0;
    let total = items.length;
    let aborted = false;

    if (concurrency <= 0) {
      const tasks = items.map(
        (item) =>
          new LoadTask(...item, (asset) => {
            finished++;

            const options = item[1];
            const url = this.parsePath(options.path)[1];

            if (onProgress) {
              onProgress(finished, total, url, asset != null);
            }

            if (finished >= total && onComplete) {
              onComplete(finished, total);
            }

            if (!asset) {
              this.resolve<ILogger>(SERVICES.LOGGER).ef('❌ 资源加载器: 加载失败 {0}', url);
            }
          }),
      );
      tasks.forEach((task) => task.load());

      return function abort() {
        if (!aborted) {
          aborted = true;
          tasks.forEach((task) => task.abort());
        }
      };
    } else {
      const tasks = items.map(
        (item) =>
          new LoadTask(...item, (asset) => {
            finished++;

            const options = item[1];
            const url = this.parsePath(options.path)[1];

            if (onProgress) {
              onProgress(finished, total, url, asset != null);
            }

            if (finished >= total && onComplete) {
              onComplete(finished, total);
            }

            if (!asset) {
              this.resolve<ILogger>(SERVICES.LOGGER).ef('❌ 资源加载器: 加载失败 {0}', url);
            }
          }),
      );

      const queue = list.split(tasks, concurrency);
      const next = () => {
        if (aborted) return;
        const tasks = queue.shift();
        if (tasks) {
          tasks.forEach((v) => v.load());
        }
      };

      next();

      return function abort() {
        if (!aborted) {
          aborted = true;
          queue.forEach((tasks) => {
            tasks.forEach((task) => {
              task.abort();
            });
          });
        }
      };
    }
  }
}
