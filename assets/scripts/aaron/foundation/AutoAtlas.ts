import { gfx, warnID, ImageAsset, Rect, SpriteFrame, Texture2D } from 'cc';
import { MaxRectsPacker } from 'maxrects-packer';

import { IAutoAtlas, IAutoAtlasOptions } from '../interfaces';
import { list } from '../utils';

/**
 * 动态纹理
 */
export class AutoTexture extends Texture2D {
  /**
   * 初始化
   * @param width 宽度
   * @param height 过渡
   * @param format 格式
   */
  public initWithSize(width: number, height: number, format: number = 35): void {
    this.reset({
      width,
      height,
      format,
    });
  }

  /**
   * 将指定的图片渲染到指定的位置上
   * @param image 图片
   * @param x X 坐标
   * @param y Y 坐标
   */
  public drawTextureAt(image: ImageAsset, x: number, y: number): void {
    const gfxTexture = this.getGFXTexture();
    if (!image || !gfxTexture) {
      return;
    }

    const gfxDevice = this._getGFXDevice();
    if (!gfxDevice) {
      warnID(16363);
      return;
    }

    const region = new gfx.BufferTextureCopy();
    region.texOffset.x = x;
    region.texOffset.y = y;
    region.texExtent.width = image.width;
    region.texExtent.height = image.height;
    gfxDevice.copyTexImagesToTexture([image.data as HTMLCanvasElement], gfxTexture, [region]);
  }
}

/**
 * 自动图集
 */
export class AutoAtlas implements IAutoAtlas {
  /** 分页列表 */
  private _pages: AutoTexture[];
  /** 图像与区域映射 */
  private _region: Map<string, [page: number, region: Rect]>;
  /** 图集打包器 */
  private _packer: MaxRectsPacker;
  /** 配置 */
  private _options: IAutoAtlasOptions;

  /**
   * 自动图集构造
   * @param token 图集标识
   * @param options 配置
   */
  public constructor(public readonly token: string, options: Partial<IAutoAtlasOptions>) {
    options = {
      width: 1024,
      height: 1024,
      smart: true,
      border: 1,
      padding: 2,
      ...options,
    };
    this._pages = [];
    this._region = new Map();
    this._packer = new MaxRectsPacker(options.width, options.height, options.padding, {
      smart: options.smart,
      border: options.border,
      allowRotation: false,
    });
    this._options = { ...options } as IAutoAtlasOptions;
  }

  /**
   * 添加分页
   * @returns
   */
  private addPage() {
    const texture = new AutoTexture();
    texture.initWithSize(this._options.width, this._options.height);
    this._pages.push(texture);
    return texture;
  }

  /**
   * 查询图像
   * @param uuid 标识
   * @returns
   */
  public has(uuid: string) {
    return this._region.has(uuid);
  }

  /**
   * 获取可用图像
   * @param uuid 标识
   * @returns
   */
  public acquire(uuid: string) {
    if (this.has(uuid)) {
      const [pageId, region] = this._region.get(uuid);
      const page = this._pages[pageId];
      const frame = new SpriteFrame();
      frame.packable = false;
      frame.texture = page;
      frame.rect = region;
      return frame;
    }
    return null;
  }

  /**
   * 添加图像
   * @param uuid 标识
   * @param image 图像
   */
  public add(uuid: string, image: ImageAsset) {
    if (!this.has(uuid)) {
      const rect = this._packer.add(image.width, image.height, image.uuid);
      const pageId = this._packer.bins.length - 1;
      const region = new Rect(rect.x, rect.y, rect.width, rect.height);
      this._region.set(uuid, [pageId, region]);
      const page = this._pages[pageId] ?? this.addPage();
      page.drawTextureAt(image, region.x, region.y);
    }
  }

  /**
   * 删除所有纹理
   * @warn 你必须很清楚自己在做什么
   */
  public destroy() {
    this._region.clear();
    list.clear(this._pages, (page: AutoTexture) => page.destroy());
  }
}
