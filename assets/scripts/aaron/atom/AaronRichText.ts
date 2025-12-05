import { tween, _decorator, Color, Enum, EventTouch, Node, Sprite, Tween, TTFFont, UITransform, Vec2 } from 'cc';

import { aaron } from '../core';
import { Triggers } from '../foundation';
import {
  AtlasLevel,
  HorizontalAlign,
  ILaidOutGlyph,
  IRichGlyph,
  IRichTextStyle,
  RichTextAtlasLevel,
  VerticalAlign
} from '../interfaces';
import { COLOR } from '../macro';
import { color, grapheme } from '../utils';
import { Atom } from './Atom';

const { property, ccclass, menu } = _decorator;

/**
 * 富文本组件（低 DC 版本）
 */
@ccclass('AaronRichText')
@menu('Aaron/Gui/RichText')
export class AaronRichText extends Atom {
  @property({ multiline: true, tooltip: '文本内容' })
  public text: string = '';

  @property({ tooltip: '最大宽度' })
  public maxWidth: number = 0;

  @property({ tooltip: '行高' })
  public lineHeight: number = 30;

  @property({ tooltip: '自动图集标识（请合理区分不同用途文本，避免所有文本使用同一个标识）' })
  public atlasKey: string = 'richtext-default';

  @property({ type: TTFFont, tooltip: '字体' })
  public ttfFont: TTFFont | null = null;

  @property({ tooltip: '字体名称' })
  public fontFamily: string = 'sans-serif';

  @property({ tooltip: '字间距' })
  public letterSpacing: number = 0;

  @property({ type: Enum(HorizontalAlign), tooltip: '水平对齐方式' })
  public horizontalAlign: HorizontalAlign = HorizontalAlign.LEFT;

  @property({ type: Enum(VerticalAlign), tooltip: '垂直对齐方式' })
  public verticalAlign: VerticalAlign = VerticalAlign.TOP;

  @property({ type: Enum(AtlasLevel), tooltip: '图集等级（控制单个图集纹理尺寸）' })
  public atlasLevel: AtlasLevel = AtlasLevel.Medium;

  @property({ tooltip: '打字机效果单字出字时间，单位毫秒' })
  public typewriterTime: number = 0;

  /** 节点列表 */
  private _glyphNodes: Node[] = [];

  /** 链接点击事件 */
  public readonly onLinkClick: Triggers = new Triggers();

  /** 打字机动画进度 */
  private _typewriterProgress: { progress: number } = { progress: 0 };

  onLaunch(): void {
    // 根据组件配置为当前图集标识设置等级
    aaron.richTextAtlas.configureAtlas(this.atlasKey, this.atlasLevel as unknown as RichTextAtlasLevel);
    aaron.richTextAtlas.addRef(this.atlasKey);
    super.onLaunch();
    this.updateView();
  }

  onRegisterEvent(): void {
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnded, this);
    super.onRegisterEvent();
  }

  onUnregisterEvent(): void {
    this.node.off(Node.EventType.TOUCH_END, this.onTouchEnded, this);
    super.onUnregisterEvent();
  }

  onDeactivate(): void {
    this.clearNodes();
    super.onDeactivate();
  }

  onTerminate(): void {
    this.clearNodes();
    this.onLinkClick.clear();
    aaron.richTextAtlas.decRef(this.atlasKey);
    super.onTerminate();
  }

  /**
   * 设置文本并刷新
   */
  public setString(str: string): void {
    if (this.text === str) {
      return;
    }
    this.text = str;
    this.updateView();
  }

  /** 刷新显示 */
  private updateView(): void {
    this.clearNodes();

    if (!this.node || !this.node.isValid) {
      return;
    }

    if (this.text.length == 0) {
      return;
    }

    // 计算布局
    const glyphs = this.parseText(this.text);
    const laidOut = this.layoutGlyphs(glyphs);

    for (const g of laidOut) {
      const glyphKey = g.glyphKey;
      const frame = aaron.richTextAtlas.acquireGlyph(this.atlasKey, glyphKey, g.ch, g.style);
      if (!frame || !frame.isValid) {
        continue;
      }

      const n = new Node('rich-text-glyph');
      const ui = n.addComponent(UITransform);
      const sp = n.addComponent(Sprite);
      sp.spriteFrame = frame;
      ui.setContentSize(frame.rect.width, frame.rect.height);
      ui.setAnchorPoint(0, 0);
      n.setPosition(g.x, g.y);
      n.parent = this.node;
      (n as Node & { _richStyle?: IRichTextStyle })._richStyle = g.style;
      this._glyphNodes.push(n);
    }

    // 执行打字机动画
    Tween.stopAllByTarget(this._typewriterProgress);
    this._typewriterProgress.progress = 0;
    if (this.typewriterTime > 0) {
      const self = this;
      const total = this._glyphNodes.length;
      const time = (total * this.typewriterTime) / 1000;
      let last = 0;
      this._glyphNodes.forEach((n) => {
        n.active = false;
      });
      tween(this._typewriterProgress)
        .set({ progress: 0 })
        .to(
          time,
          { progress: 1 },
          {
            onUpdate(t, r) {
              const range = (total * r) | 0;
              for (let i = last; i < range; i++) {
                const item = self._glyphNodes[i];
                if (item && item.isValid) {
                  item.active = true;
                }
              }
              last = range;
            },
          },
        )
        .start();
    }
  }

  /** 清理节点 */
  private clearNodes(): void {
    // 停止所有打字机动画
    Tween.stopAllByTarget(this._typewriterProgress);
    // 清空节点
    for (const n of this._glyphNodes) {
      if (n && n.isValid) {
        n.destroy();
      }
    }
    this._glyphNodes.length = 0;
  }

  /**
   * 触摸结束
   * @param event 触摸事件
   */
  private onTouchEnded(event: EventTouch): void {
    if (!this._glyphNodes.length) {
      return;
    }

    const pos = event.getLocation();

    for (const glyphNode of this._glyphNodes) {
      if (!glyphNode || !glyphNode.isValid) {
        continue;
      }

      if (!glyphNode.uiTransform) {
        continue;
      }

      const style = (glyphNode as Node & { _richStyle?: IRichTextStyle })._richStyle;
      if (style && style.linkId && glyphNode.uiTransform.hitTest(pos)) {
        aaron.logger.i('🖱 点击链接: ' + style.linkId);
        this.onLinkClick.runWith(style.linkId);
        break;
      }
    }
  }

  /**
   * 解析富文本标记为 glyph 列表
   * 支持标签：
   * [color=#rrggbb] [/color]
   * [size=20] [/size]
   * [i] [/i]
   * [u] [/u]
   * [stroke=#rrggbb,width] [/stroke]
   * [shadow=#rrggbb,offset_x,offset_y,blur] [/shadow]
   */
  private parseText(text: string): IRichGlyph[] {
    const result: IRichGlyph[] = [];

    const defaultStyle: IRichTextStyle = {
      fontSize: 24,
      fontFamily: this.getFontFamily(),
      color: new Color(255, 255, 255, 255),
      bold: false,
      italic: false,
      underline: false,
      strokeColor: null,
      strokeWidth: 0,
      shadowColor: null,
      shadowOffset: new Vec2(0, 0),
      shadowBlur: 0,
      linkId: null,
    };

    const styleStack: IRichTextStyle[] = [defaultStyle];
    const units = grapheme.splitGraphemes(text);
    let i = 0;

    while (i < units.length) {
      const unit = units[i];

      // 处理转义换行："\n" / "\r"
      if (unit === '\\' && i + 1 < units.length) {
        const nextUnit = units[i + 1];
        if (nextUnit === 'n') {
          const topStyle = styleStack[styleStack.length - 1];
          result.push({ ch: '\n', style: topStyle });
          i += 2;
          continue;
        } else if (nextUnit === 'r') {
          const topStyle = styleStack[styleStack.length - 1];
          result.push({ ch: '\r', style: topStyle });
          i += 2;
          continue;
        }
      }

      // 标签解析，以 "[" 开头，直到下一个 "]" 为止
      if (unit === '[') {
        let closeIndex = -1;
        for (let j = i + 1; j < units.length; j++) {
          if (units[j] === ']') {
            closeIndex = j;
            break;
          }
        }

        if (closeIndex > i) {
          const tagContent = units
            .slice(i + 1, closeIndex)
            .join('')
            .trim();
          if (tagContent.length > 0) {
            const isEnd = tagContent[0] === '/';
            if (isEnd) {
              const name = tagContent.substring(1).toLowerCase();
              if (
                name === 'color' ||
                name === 'size' ||
                name === 'i' ||
                name === 'italic' ||
                name === 'u' ||
                name === 'underline' ||
                name === 'stroke' ||
                name === 'outline' ||
                name === 'shadow' ||
                name === 'link'
              ) {
                if (styleStack.length > 1) {
                  styleStack.pop();
                }
              }
            } else {
              const eqIdx = tagContent.indexOf('=');
              const name = (eqIdx >= 0 ? tagContent.substring(0, eqIdx) : tagContent).toLowerCase();
              const param = eqIdx >= 0 ? tagContent.substring(eqIdx + 1) : '';
              const top = styleStack[styleStack.length - 1];
              const next: IRichTextStyle = { ...top, shadowOffset: top.shadowOffset.clone() };

              if (name === 'color') {
                const c = this.parseColor(param);
                if (c) {
                  next.color = c;
                }
                styleStack.push(next);
              } else if (name === 'size') {
                const v = parseInt(param);
                if (!isNaN(v) && v > 0) {
                  next.fontSize = v;
                }
                styleStack.push(next);
              } else if (name === 'i' || name === 'italic') {
                next.italic = true;
                styleStack.push(next);
              } else if (name === 'u' || name === 'underline') {
                next.underline = true;
                styleStack.push(next);
              } else if (name === 'stroke' || name === 'outline') {
                const parts = param.split(',');
                const c = this.parseColor(parts[0]);
                const w = parts.length > 1 ? parseFloat(parts[1]) : 1;
                next.strokeColor = c;
                next.strokeWidth = isNaN(w) ? 1 : w;
                styleStack.push(next);
              } else if (name === 'shadow') {
                const parts = param.split(',');
                const c = this.parseColor(parts[0]);
                const ox = parts.length > 1 ? parseFloat(parts[1]) : 1;
                const oy = parts.length > 2 ? parseFloat(parts[2]) : 1;
                const blur = parts.length > 3 ? parseFloat(parts[3]) : 0;
                next.shadowColor = c;
                next.shadowOffset.set(ox, oy);
                next.shadowBlur = isNaN(blur) ? 0 : blur;
                styleStack.push(next);
              } else if (name === 'link') {
                next.linkId = param.trim() || null;
                styleStack.push(next);
              } else {
                // 未知标签，忽略
              }
            }
          }

          i = closeIndex + 1;
          continue;
        }
      }

      const top = styleStack[styleStack.length - 1];

      // 若当前样式为下划线，则尽量把连续的字素合并为一个 glyph
      if (top.underline && unit !== '\n' && unit !== '\r') {
        const last = result[result.length - 1];
        if (last && last.style === top) {
          last.ch += unit;
        } else {
          result.push({ ch: unit, style: top });
        }
      } else {
        result.push({ ch: unit, style: top });
      }
      i++;
    }

    return result;
  }

  /** 获取字体名称 */
  private getFontFamily(): string {
    if (this.ttfFont) {
      const fam = this.ttfFont._fontFamily;
      if (fam) {
        return fam;
      }
    }
    return this.fontFamily || 'sans-serif';
  }

  /**
   * 解析颜色
   * @param str 颜色字符串
   * @returns 颜色
   */
  private parseColor(str: string): Color | null {
    const s = str.trim();
    if (!s) {
      return null;
    }
    if (s[0] === '#') {
      return color.from(s);
    }
    return color.from(COLOR.WHITE);
  }

  /**
   * 布局 glyph
   * @param glyphs glyph 列表
   * @returns 布局后的 glyph 列表
   */
  private layoutGlyphs(glyphs: IRichGlyph[]): ILaidOutGlyph[] {
    const laidOut: ILaidOutGlyph[] = [];
    if (!glyphs.length) {
      return laidOut;
    }

    const maxWidth = this.maxWidth > 0 ? this.maxWidth : Number.MAX_SAFE_INTEGER;
    const minLineHeight = this.lineHeight > 0 ? this.lineHeight : 30;

    type LineGlyph = IRichGlyph & {
      width: number;
      height: number;
      glyphKey: string;
    };
    const lines: { glyphs: LineGlyph[]; width: number; height: number }[] = [];

    let currentLine: LineGlyph[] = [];
    let lineWidth = 0;

    const pushLine = () => {
      if (!currentLine.length) {
        return;
      }
      let maxGlyphHeight = 0;
      for (const g of currentLine) {
        if (g.height > maxGlyphHeight) {
          maxGlyphHeight = g.height;
        }
      }
      const lineBoxHeight = Math.max(minLineHeight, maxGlyphHeight);
      lines.push({ glyphs: currentLine, width: lineWidth, height: lineBoxHeight });
      currentLine = [];
      lineWidth = 0;
    };

    for (const g of glyphs) {
      if (g.ch === '\n' || g.ch === '\r') {
        pushLine();
        continue;
      }

      const glyphKey = this.makeGlyphKey(g.ch, g.style);
      const frame = aaron.richTextAtlas.acquireGlyph(this.atlasKey, glyphKey, g.ch, g.style);
      if (!frame) {
        continue;
      }
      const metrics = {
        width: frame.rect.width,
        height: frame.rect.height,
      };
      const width = metrics.width + this.letterSpacing;
      if (lineWidth + width > maxWidth && currentLine.length > 0) {
        pushLine();
      }

      currentLine.push({
        ch: g.ch,
        style: g.style,
        height: metrics.height,
        width,
        glyphKey,
      });
      lineWidth += width;
    }

    pushLine();

    if (!lines.length) {
      return laidOut;
    }

    // 计算排版结果的实际宽高（以文本包围盒为准）
    const contentWidth = lines.reduce((m, l) => Math.max(m, l.width), 0);
    const totalHeight = lines.reduce((sum, l) => sum + l.height, 0);

    const trans = this.getComponent(UITransform);
    if (trans) {
      trans.setContentSize(contentWidth, totalHeight);
    }

    const layoutWidth = trans?.width ?? contentWidth;
    const layoutHeight = trans?.height ?? totalHeight;

    // 以节点锚点在中心的坐标系来排版
    const originX = -layoutWidth * 0.5;
    const originY = layoutHeight * 0.5;

    let verticalOffset = 0;
    if (layoutHeight > totalHeight) {
      if (this.verticalAlign === VerticalAlign.MIDDLE) {
        verticalOffset = (layoutHeight - totalHeight) * 0.5;
      } else if (this.verticalAlign === VerticalAlign.BOTTOM) {
        verticalOffset = layoutHeight - totalHeight;
      }
    }

    let cursorY = originY - verticalOffset;

    lines.forEach((line) => {
      cursorY -= line.height;

      let offsetX = 0;
      if (layoutWidth > line.width) {
        if (this.horizontalAlign === HorizontalAlign.CENTER) {
          offsetX = (layoutWidth - line.width) * 0.5;
        } else if (this.horizontalAlign === HorizontalAlign.RIGHT) {
          offsetX = layoutWidth - line.width;
        }
      }

      let x = originX + offsetX;
      const lineBottomY = cursorY - line.height;

      for (const g of line.glyphs) {
        laidOut.push({
          ch: g.ch,
          style: g.style,
          x,
          y: lineBottomY + g.height,
          glyphKey: g.glyphKey,
        });
        x += g.width;
      }
    });

    return laidOut;
  }

  /**
   * 生成 glyph key
   * @param ch 字符
   * @param s 样式
   * @returns glyph key
   */
  private makeGlyphKey(ch: string, s: IRichTextStyle): string {
    const colorHex = color.toHEX4(s.color);
    const strokeHex = s.strokeColor ? color.toHEX4(s.strokeColor) : 'none';
    const shadowHex = s.shadowColor ? color.toHEX4(s.shadowColor) : 'none';
    return [
      s.fontFamily,
      s.fontSize,
      colorHex,
      s.italic ? 1 : 0,
      s.underline ? 1 : 0,
      strokeHex,
      s.strokeWidth,
      shadowHex,
      s.shadowOffset.x,
      s.shadowOffset.y,
      s.shadowBlur,
      ch.codePointAt(0) ?? 0,
    ].join('|');
  }
}
