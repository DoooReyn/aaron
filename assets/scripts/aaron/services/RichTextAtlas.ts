import { ImageAsset, Label, Node, SpriteFrame, Texture2D } from 'cc';

import { Service } from '../core';
import { AutoAtlas } from '../foundation';
import {
  IAppLauncher,
  IProfiler,
  IRichAtlasInfo,
  IRichTextAtlas,
  IRichTextStyle,
  RichTextAtlasLevel
} from '../interfaces';
import { MESSAGES, PRESET, SERVICES } from '../macro';
import { be } from '../utils';

/**
 * 富文本模板
 */
class RichTextTemplate extends Node {
  /** 文本组件 */
  private _renderer: Label;

  constructor() {
    super('rich-text-template');
    this.layer = 0;
    this._renderer = this.addComponent(Label);
  }

  /**
   * 将文本和样式应用到渲染组件，并返回生成的图像资源
   */
  apply(ch: string, glyphKey: string, style: IRichTextStyle) {
    const renderer = this._renderer;
    renderer.enabled = true;
    renderer.string = ch;
    renderer.fontFamily = style.fontFamily;
    renderer.fontSize = style.fontSize;
    renderer.color = style.color;
    renderer.isBold = style.bold;
    renderer.isItalic = style.italic;
    renderer.isUnderline = style.underline;
    if ((renderer.enableOutline = !!style.strokeColor)) {
      renderer.outlineColor = style.strokeColor;
      renderer.outlineWidth = style.strokeWidth;
    }
    if ((renderer.enableShadow = !!style.shadowColor)) {
      renderer.shadowColor = style.shadowColor;
      renderer.shadowOffset = style.shadowOffset;
      renderer.shadowBlur = style.shadowBlur;
    }
    renderer.updateRenderData(true);
    renderer.markForUpdateRenderData(false);

    const image = (renderer.ttfSpriteFrame!.texture as Texture2D).image;
    image._uuid = glyphKey;

    return image;
  }

  /**
   * 释放资源
   */
  dismiss() {
    // @ts-ignore
    this._renderer?.destroyTtfSpriteFrame();
    this._renderer.enabled = false;
  }
}

/**
 * 富文本图集服务
 */
export class RichTextAtlas extends Service implements IRichTextAtlas {
  public readonly token: string = MESSAGES.RICH_TEXT_ATLAS.CATEGORY;
  /** atlasKey -> 图集信息 */
  private _atlases: Map<string, IRichAtlasInfo> = new Map();

  /** atlasKey -> 图集等级（控制 AutoAtlas 尺寸） */
  private _atlasLevels: Map<string, RichTextAtlasLevel> = new Map();

  /** 用于生成 glyph 的临时节点 */
  private _template: RichTextTemplate;

  initialize() {
    this.resolve<IProfiler>(SERVICES.PROFILER).addDebugItem(PRESET.RICH_TEXT_ATLAS, '富文本图集', () => {
      const usage = this.getUsage();
      return [`数量: ${usage.atlasCount}`, `占用内存: ${usage.totalMemoryBytes / 1024 / 1024} MB`].join('\n');
    });

    this.configureAtlas(PRESET.RICH_TEXT_ATLAS, RichTextAtlasLevel.XLarge);
    this._template = new RichTextTemplate();
    this.resolve<IAppLauncher>(SERVICES.APP_LAUNCHER).root.addChild(this._template);
  }

  configureAtlas(atlasKey: string, level: RichTextAtlasLevel): void {
    if (this._atlasLevels.has(atlasKey)) {
      const oldLevel = RichTextAtlasLevel[this._atlasLevels.get(atlasKey)];
      this.logger.w(`📚 富文本图集：${atlasKey} 已配置为 ${oldLevel}，请注意合理分配图集标识和等级`);
      return;
    }
    this._atlasLevels.set(atlasKey, level);
    this.logger.i(`📚 添加富文本图集: ${atlasKey} ${RichTextAtlasLevel[level]}`);
  }

  destroy() {
    this.resolve<IProfiler>(SERVICES.PROFILER).removeDebugItem(PRESET.RICH_TEXT_ATLAS);
    this._template.destroy();
    this._template = null;
    this.shrinkAll();
  }

  /**
   * 获取或创建图集信息
   * @param atlasKey 图集标识
   */
  private _getOrCreateAtlas(atlasKey: string): IRichAtlasInfo {
    let info = this._atlases.get(atlasKey);
    if (!info) {
      const level = this._atlasLevels.get(atlasKey) ?? RichTextAtlasLevel.Medium;
      const size = level as number;
      const atlas = new AutoAtlas(atlasKey, {
        width: size,
        height: size,
        smart: true,
        border: 1,
        padding: 2,
      });
      info = {
        atlas,
        glyphs: new Map(),
        refCount: 0,
      };
      this._atlases.set(atlasKey, info);
    }
    return info;
  }

  measureGlyphMetrics(atlasKey: string, glyphKey: string) {
    const info = this._getOrCreateAtlas(atlasKey);

    const cached = info.glyphs.get(glyphKey);
    if (cached && cached.frame && cached.frame.isValid) {
      return {
        width: cached.frame.rect.width,
        height: cached.frame.rect.height,
      };
    }

    return null;
  }

  addRef(atlasKey: string): void {
    const info = this._getOrCreateAtlas(atlasKey);
    info.refCount++;
  }

  decRef(atlasKey: string): void {
    const info = this._atlases.get(atlasKey);
    if (!info) {
      return;
    }
    info.refCount--;
    if (info.refCount <= 0) {
      // 延迟实际清理交给 shrink / clearUnused
      info.refCount = 0;
    }
  }

  acquireGlyph(atlasKey: string, glyphKey: string, ch: string, style: IRichTextStyle): SpriteFrame | null {
    const info = this._getOrCreateAtlas(atlasKey);

    const cached = info.glyphs.get(glyphKey);
    if (cached && cached.frame && cached.frame.isValid) {
      cached.lastUsed = Date.now();
      return cached.frame;
    }

    const image = this.createGlyphImage(ch, glyphKey, style);
    if (!info.atlas.has(glyphKey)) {
      info.atlas.add(glyphKey, image);
      this._template.dismiss();
    }

    const frame = info.atlas.acquire(glyphKey);
    if (!frame) {
      return null;
    }

    info.glyphs.set(glyphKey, {
      frame,
      lastUsed: Date.now(),
    });

    return frame;
  }

  createGlyphImage(ch: string, glyphKey: string, style: IRichTextStyle): ImageAsset {
    return this._template.apply(ch, glyphKey, style);
  }

  clearUnused(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this._atlases.forEach((info, key) => {
      if (info.refCount > 0) {
        return;
      }
      // 简单策略：如果 30 秒内未被访问过，则销毁
      let latest = 0;
      info.glyphs.forEach((entry) => {
        if (entry.lastUsed > latest) {
          latest = entry.lastUsed;
        }
      });
      if (be.isEmpty(info.glyphs) || now - latest > 30_000) {
        info.atlas.destroy();
        info.glyphs.clear();
        toDelete.push(key);
      }
    });

    toDelete.forEach((key) => this._atlases.delete(key));
  }

  shrinkAll(): void {
    this.clearUnused();
  }

  getUsage() {
    const atlases: {
      atlasKey: string;
      width: number;
      height: number;
      memoryBytes: number;
      glyphCount: number;
      refCount: number;
    }[] = [];

    let totalMemoryBytes = 0;

    this._atlases.forEach((info, key) => {
      const level = this._atlasLevels.get(key) ?? RichTextAtlasLevel.Medium;
      const size = level as number;
      const width = size;
      const height = size;
      const memoryBytes = width * height * 4; // RGBA8888 4 字节/像素
      const glyphCount = info.glyphs.size;

      totalMemoryBytes += memoryBytes;

      atlases.push({
        atlasKey: key,
        width,
        height,
        memoryBytes,
        glyphCount,
        refCount: info.refCount,
      });
    });

    return {
      atlasCount: atlases.length,
      totalMemoryBytes,
      atlases,
    };
  }
}
