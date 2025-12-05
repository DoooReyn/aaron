import { Sprite, SpriteFrame } from 'cc';

import { ReferBase } from './ReferBase';

/**
 * 图片资源引用
 */
export class ReferImage extends ReferBase<Sprite, SpriteFrame> {
  constructor(public readonly container: Sprite) {
    super(container, SpriteFrame);
  }

  protected apply(): void {
    this.container.spriteFrame = this.$asset;
  }

  protected discard(): void {
    this.container.spriteFrame = null;
  }
}
