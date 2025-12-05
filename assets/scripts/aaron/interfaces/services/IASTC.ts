import { gfx, ImageAsset, SpriteFrame } from 'cc';

import { IMemoryImageSource } from '../../types';
import { IService } from '../IService';

/** 允许的 ASTC 格式 */
export type ASTC_FORMAT =
  | gfx.Format.ASTC_RGBA_4X4
  | gfx.Format.ASTC_RGBA_5X4
  | gfx.Format.ASTC_RGBA_5X5
  | gfx.Format.ASTC_RGBA_6X5
  | gfx.Format.ASTC_RGBA_6X6
  | gfx.Format.ASTC_RGBA_8X5
  | gfx.Format.ASTC_RGBA_8X6
  | gfx.Format.ASTC_RGBA_8X8
  | gfx.Format.ASTC_RGBA_10X5
  | gfx.Format.ASTC_RGBA_10X6
  | gfx.Format.ASTC_RGBA_10X8
  | gfx.Format.ASTC_RGBA_10X10
  | gfx.Format.ASTC_RGBA_12X10
  | gfx.Format.ASTC_RGBA_12X12;

/**
 * ASTC 压缩纹理支持
 */
export interface IAstc extends IService {
  /** 目标纹理格式 */
  targetFormat: ASTC_FORMAT;
  /** 初始化 */
  initialize(): void;
  /**
   * 是否支持指定的纹理格式
   * @param format 纹理格式
   * @returns
   */
  isFormatSupported(format: ASTC_FORMAT): boolean;
  /**
   * 平台是否支持目标纹理格式
   * @returns
   */
  isPlatformSupported(): boolean;
  /**
   * 创建精灵帧
   * @param info 压缩纹理原始信息
   */
  createSpriteFrameByInfo(info: IMemoryImageSource | ImageAsset): SpriteFrame | null;
  /** 创建 ImageAsset */
  createImageAsset(info: IMemoryImageSource | ImageAsset): ImageAsset;
}
