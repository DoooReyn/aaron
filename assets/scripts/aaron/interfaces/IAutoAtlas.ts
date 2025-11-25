import { SpriteFrame, ImageAsset } from 'cc';

/**
 * 自动图集接口
 */
export interface IAutoAtlas {
  /** 图集标识 */
  readonly flag: string;
  /**
   * 查询图像
   * @param uuid 标识
   * @returns 是否存在图像
   */
  has(uuid: string): boolean;
  /**
   * 获取可用图像
   * @param uuid 标识
   * @returns 图像实例
   */
  acquire(uuid: string): SpriteFrame;
  /**
   * 添加图像
   * @param uuid 标识
   * @param image 图像
   */
  add(uuid: string, image: ImageAsset): void;
  /**
   * 删除所有纹理
   * @warn 你必须很清楚自己在做什么
   */
  destroy(): void;
}

/**
 * 自动图集配置
 */
export interface IAutoAtlasOptions {
  width: number;
  height: number;
  smart: boolean;
  border: number;
  padding: number;
}
