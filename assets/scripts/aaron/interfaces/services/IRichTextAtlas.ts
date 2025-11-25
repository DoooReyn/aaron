import { Color, Vec2, SpriteFrame, ImageAsset } from "cc";
import { IService } from "../../core";
import { IAutoAtlas } from "../IAutoAtlas";

/**
 * 富文本图集条目尺寸
 */
export interface IRichGlyphMetrics {
  width: number;
  height: number;
}

/**
 * 富文本图集等级
 * @description 控制 AutoAtlas 的纹理尺寸
 */
export enum RichTextAtlasLevel {
  /** 微型：128x128 */
  Micro = 128,
  /** 小型：256x256 */
  Small = 256,
  /** 中型：512x512（默认） */
  Medium = 512,
  /** 大型：1024x1024 */
  Large = 1024,
  /** 超大型：2048x2048 */
  XLarge = 2048,
}

/**
 * 单个图集的占用信息
 */
export interface IRichAtlasUsageItem {
  /** 图集标识 */
  atlasKey: string;
  /** 图集纹理宽度（像素） */
  width: number;
  /** 图集纹理高度（像素） */
  height: number;
  /** 估算内存占用（字节，按 RGBA8888 4 字节/像素计算） */
  memoryBytes: number;
  /** 当前缓存的 glyph 数量 */
  glyphCount: number;
  /** 引用计数 */
  refCount: number;
}

/**
 * 富文本图集整体占用信息
 */
export interface IRichAtlasUsageSummary {
  /** 当前有效图集数量 */
  atlasCount: number;
  /** 所有图集估算内存占用总和（字节） */
  totalMemoryBytes: number;
  /** 各图集的详细占用信息 */
  atlases: IRichAtlasUsageItem[];
}

/**
 * 水平对齐方式
 */
export enum HorizontalAlign {
  LEFT,
  CENTER,
  RIGHT,
}

/**
 * 垂直对齐方式
 */
export enum VerticalAlign {
  TOP,
  MIDDLE,
  BOTTOM,
}

/**
 * 图集等级
 */
export enum AtlasLevel {
  Micro = RichTextAtlasLevel.Micro,
  Small = RichTextAtlasLevel.Small,
  Medium = RichTextAtlasLevel.Medium,
  Large = RichTextAtlasLevel.Large,
  XLarge = RichTextAtlasLevel.XLarge,
}

/**
 * 富文本样式
 */
export interface IRichTextStyle {
  fontFamily: string;
  fontSize: number;
  color: Color;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strokeColor: Color | null;
  strokeWidth: number;
  shadowColor: Color | null;
  shadowOffset: Vec2;
  shadowBlur: number;
  linkId: string | null;
}

/**
 * 富文本字符信息
 */
export interface IRichGlyph {
  ch: string;
  style: IRichTextStyle;
}

/**
 * 布局后的 glyph
 */
export interface ILaidOutGlyph extends IRichGlyph {
  x: number;
  y: number;
  glyphKey: string;
}


/**
 * 富文本图集信息
 */
export interface IRichAtlasInfo {
  /** 自动图集 */
  atlas: IAutoAtlas;
  /** glyphKey -> SpriteFrame */
  glyphs: Map<string, IRichGlyphEntry>;
  /** 引用计数，来自各个 RichText 组件 */
  refCount: number;
}

/**
 * 富文本图集条目
 */
export interface IRichGlyphEntry {
  /** 引用的 SpriteFrame */
  frame: SpriteFrame;
  /** 最近一次被访问的时间戳，用于简单 LRU */
  lastUsed: number;
}

/**
 * 富文本图集依赖接口
 */
export interface IRichTextAtlas extends IService {
  /** 初始化 */
  initialize(): void;

  /**
   * 为指定图集标识配置等级（纹理尺寸）
   * - 同一个 atlasKey 多次配置时，以最后一次为准
   */
  configureAtlas(atlasKey: string, level: RichTextAtlasLevel): void;

  /**
   * 获取 glyph 的尺寸（如果已在图集中缓存）
   * @param atlasKey 图集标识
   * @param glyphKey glyph 样式标识（包含字体、字号、颜色、描边等）
   * @returns glyph 的尺寸，如果未缓存则返回 null
   */
  measureGlyphMetrics(atlasKey: string, glyphKey: string): IRichGlyphMetrics | null;

  /**
   * 增加图集引用计数
   */
  addRef(atlasKey: string): void;

  /**
   * 减少图集引用计数
   */
  decRef(atlasKey: string): void;

  /**
   * 获取或创建 glyph 的 SpriteFrame
   * @param atlasKey 图集标识
   * @param glyphKey glyph 样式标识（包含字体、字号、颜色、描边等）
   * @param ch 字符（可能是合并后的下划线片段）
   * @param style 样式
   */
  acquireGlyph(atlasKey: string, glyphKey: string, ch: string, style: IRichTextStyle): SpriteFrame | null;

  /**
   * 创建 glyph 图片（底层实现使用 Label 渲染成图像）
   * @param ch 字符
   * @param glyphKey glyph 样式标识
   * @param style 样式
   */
  createGlyphImage(ch: string, glyphKey: string, style: IRichTextStyle): ImageAsset;

  /**
   * 清理引用计数为 0 的图集（根据简单 LRU 策略）
   */
  clearUnused(): void;

  /**
   * 收紧所有图集（当前等价于 clearUnused，预留扩展）
   */
  shrinkAll(): void;

  /**
   * 查询当前所有图集的占用情况，包括图集数量和总内存占用
   */
  getUsage(): IRichAtlasUsageSummary;
}
