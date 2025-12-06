import {
  assetManager,
  js,
  sp,
  AnimationClip,
  Asset,
  AssetManager,
  AudioClip,
  BitmapFont,
  BufferAsset,
  Constructor,
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
  VideoClip
} from 'cc';

import { aaron } from '../core/Aaron';
import { ILocalContainer } from '../interfaces';
import { MESSAGES } from '../macro';

/**
 * 本地资源容器
 */
export class ResLocal implements ILocalContainer {
  parsePath(path: string): [string, string] {
    const arr = path.split('@');
    if (arr.length == 1) {
      return ['resources', arr[0]];
    } else {
      arr[0] ||= 'resources';
      return arr as [string, string];
    }
  }

  pathOf(uuid: string) {
    let path = '';
    assetManager.bundles.find((ab) => {
      // @ts-ignore
      return ab.config.assetInfos.find((cfg: any) => {
        if (cfg.uuid === uuid) {
          path = cfg.path;
          return true;
        }
        return false;
      });
    });
    return path;
  }

  uuidOf(path: string) {
    let uuid = '';
    assetManager.bundles.find((bun) => {
      // @ts-ignore
      return bun.config.assetInfos.find((cfg: any) => {
        if (cfg.path === path) {
          uuid = cfg.uuid;
          return true;
        }
        return false;
      });
    });
    return uuid;
  }

  hasAB(ab: string): boolean {
    return assetManager.bundles.has(ab) || (<any>assetManager)._projectBundles.includes(ab);
  }

  loadAB(ab: string) {
    return new Promise<AssetManager.Bundle | null>((resolve) => {
      if (!this.hasAB(ab)) {
        aaron.resLoader.logger.ef(MESSAGES.RES_LOADER.LOAD_BAD_2, ab);
        resolve(null);
      } else {
        const bun = assetManager.getBundle(ab);
        if (bun) {
          resolve(bun);
        } else {
          assetManager.loadBundle(ab, (err, bun) => {
            if (err) {
              aaron.resLoader.logger.ef(MESSAGES.RES_LOADER.LOAD_BAD_3, err);
              resolve(null);
            } else {
              resolve(bun);
            }
          });
        }
      }
    });
  }

  unloadAB(ab: string, releaseAll: boolean = false) {
    const bun = assetManager.getBundle(ab);
    if (bun) {
      if (releaseAll) {
        bun.releaseAll();
      }
    }
  }

  has(path: string) {
    return new Promise<boolean>(async (resolve) => {
      const [ab, raw] = this.parsePath(path);
      const bun = await this.loadAB(ab);
      if (bun) {
        const info = bun.getInfoWithPath(raw);
        resolve(info == null ? false : true);
      } else {
        resolve(false);
      }
    });
  }

  preload<T extends Asset>(type: Constructor<T>, path: string) {
    return new Promise<boolean>(async (resolve) => {
      const [ab, raw] = this.parsePath(path);
      const bun = await this.loadAB(ab);
      if (bun) {
        let url = raw;
        const typeName = js.getClassName(type);
        if (typeName === 'cc.SpriteFrame') {
          url += '/spriteFrame';
        } else if (typeName === 'cc.Texture2D') {
          url += '/texture';
        }
        const info = bun.getInfoWithPath(url, type);
        if (info) {
          bun.preload(url, type, (err, data) => {
            resolve(err ? false : true);
          });
        }
      }
    });
  }

  load<T extends Asset>(type: Constructor<T>, path: string) {
    return new Promise<T | null>(async (resolve) => {
      const [ab, raw] = this.parsePath(path);
      const bun = await this.loadAB(ab);
      if (bun) {
        let url = raw;
        const typeName = js.getClassName(type);
        if (typeName === 'cc.SpriteFrame') {
          url += '/spriteFrame';
        } else if (typeName === 'cc.Texture2D') {
          url += '/texture';
        }
        const info = bun.getInfoWithPath(url, type);
        if (info) {
          bun.load(url, type, (err, res) => {
            if (err) {
              aaron.resLoader.logger.ef(MESSAGES.RES_LOADER.LOAD_BAD_4, ab, url);
              resolve(null);
            } else {
              resolve(res);
            }
          });
        } else {
          aaron.resLoader.logger.ef(MESSAGES.RES_LOADER.LOAD_BAD_4, ab, url);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  }

  loadImage(path: string) {
    return this.load<ImageAsset>(ImageAsset, path);
  }

  loadTexture(path: string) {
    return this.load(Texture2D, path);
  }

  loadSpriteFrame(path: string) {
    return this.load(SpriteFrame, path);
  }

  loadAtlas(path: string) {
    return this.load(SpriteAtlas, path);
  }

  loadPrefab(path: string) {
    return this.load(Prefab, path);
  }

  loadText(path: string) {
    return this.load(TextAsset, path);
  }

  loadJson(path: string) {
    return this.load(JsonAsset, path);
  }

  loadSpine(path: string) {
    return this.load(sp.SkeletonData, path);
  }

  loadFont(path: string) {
    return this.load(Font, path);
  }

  loadBitmapFont(path: string) {
    return this.load(BitmapFont, path);
  }

  loadAudio(path: string) {
    return this.load(AudioClip, path);
  }

  loadParticle(path: string) {
    return this.load(ParticleAsset, path);
  }

  loadTmx(path: string) {
    return this.load(TiledMapAsset, path);
  }

  loadBinary(path: string) {
    return this.load(BufferAsset, path);
  }

  loadVideo(path: string) {
    return this.load(VideoClip, path);
  }

  loadAnimation(path: string) {
    return this.load(AnimationClip, path);
  }
}
