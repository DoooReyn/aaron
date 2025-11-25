import { _decorator, Enum, Layout, UITransform, Vec3 } from 'cc';

const { ccclass, property, disallowMultiple, menu } = _decorator;

/**
 * 水平居中布局方向枚举
 * 定义了子节点在水平方向上的排列顺序和居中方式
 */
export enum CenterHorizontalDirection {
  /** 从左到右排列 */
  LEFT_TO_RIGHT = 0,
  /** 从右到左排列 */
  RIGHT_TO_LEFT = 1,
  /** 从中心向两侧排列 */
  CENTER_TO_SIDE = 2,
}

/**
 * 自定义居中布局组件
 * 扩展了Layout类，提供更灵活的居中布局功能，支持多种水平排列方向
 * @extends Layout
 */
@ccclass('CenterLayout')
@menu('Aaron/UI/CenterLayout')
@disallowMultiple()
export class CenterLayout extends Layout {
  /**
   * 水平居中方向属性
   * 控制子节点在水平方向上的排列方式
   * @default CenterHorizontalDirection.CENTER_TO_SIDE
   */
  @property({ type: Enum(CenterHorizontalDirection) })
  public readonly centerHorizontalDirection: CenterHorizontalDirection = CenterHorizontalDirection.CENTER_TO_SIDE;

  /**
   * 处理水平方向布局逻辑
   * 重写父类方法，实现自定义的水平居中布局，支持不同排列方向和换行处理
   * @param baseWidth 布局基准宽度
   * @param rowBreak 是否允许换行
   * @param fnPositionY 计算Y轴位置的回调函数
   * @param applyChildren 是否应用计算出的位置到子节点
   * @returns 容器调整后的边界值
   */
  protected _doLayoutHorizontally(
    baseWidth: number,
    rowBreak: boolean,
    fnPositionY: (...args: any[]) => number,
    applyChildren: boolean
  ): number {
    const trans = this.node._uiProps.uiTransformComp!;
    const layoutAnchor = trans.anchorPoint;
    const limit = this._getFixedBreakingNum();

    // 确定排列方向符号（1:从左到右，-1:从右到左）和初始内边距
    let sign = 1;
    let paddingX = this._paddingLeft;
    if (this._horizontalDirection === Layout.HorizontalDirection.RIGHT_TO_LEFT) {
      sign = -1;
      paddingX = this._paddingRight;
    }

    // 计算起始位置
    const startPos = (this._horizontalDirection - layoutAnchor.x) * baseWidth + sign * paddingX;
    let nextX = startPos - sign * this._spacingX;
    let totalHeight = 0; // 总内容高度（不包括间距）
    let rowMaxHeight = 0; // 单行最大高度
    let tempMaxHeight = 0; // 临时最大高度
    let maxHeight = 0; // 最大高度
    let isBreak = false; // 是否需要换行
    const activeChildCount = this._usefulLayoutObj.length;
    let newChildWidth = this._cellSize.width;
    const paddingH = this._getPaddingH();

    // 如果需要调整子节点大小且不是网格布局，则计算子节点宽度
    if (this._layoutType !== Layout.Type.GRID && this._resizeMode === Layout.ResizeMode.CHILDREN) {
      newChildWidth = (baseWidth - paddingH - (activeChildCount - 1) * this._spacingX) / activeChildCount;
    }

    const children = this._usefulLayoutObj;
    for (let i = 0; i < children.length; ++i) {
      const childTrans = children[i];
      const child = childTrans.node;
      const scale = child.scale;
      const childScaleX = this.getUsedScaleValue(scale.x);
      const childScaleY = this.getUsedScaleValue(scale.y);

      // 调整子节点大小（如果需要）
      if (this._resizeMode === Layout.ResizeMode.CHILDREN) {
        childTrans.width = newChildWidth / childScaleX;
        if (this._layoutType === Layout.Type.GRID) {
          childTrans.height = this._cellSize.height / childScaleY;
        }
      }

      const anchorX = Math.abs(this._horizontalDirection - childTrans.anchorX);
      const childBoundingBoxWidth = childTrans.width * childScaleX;
      const childBoundingBoxHeight = childTrans.height * childScaleY;

      // 更新临时最大高度和行最大高度
      if (childBoundingBoxHeight > tempMaxHeight) {
        maxHeight = Math.max(tempMaxHeight, maxHeight);
        rowMaxHeight = tempMaxHeight || childBoundingBoxHeight;
        tempMaxHeight = childBoundingBoxHeight;
      }

      // 计算下一个X位置
      nextX += sign * (anchorX * childBoundingBoxWidth + this._spacingX);
      const rightBoundaryOfChild = sign * (1 - anchorX) * childBoundingBoxWidth;

      // 判断是否需要换行
      if (rowBreak) {
        if (limit > 0) {
          // 限制每行子节点数量时的换行判断
          isBreak = i / limit > 0 && i % limit === 0;
          if (isBreak) {
            rowMaxHeight = tempMaxHeight > childBoundingBoxHeight ? tempMaxHeight : rowMaxHeight;
          }
        } else if (childBoundingBoxWidth > baseWidth - paddingH) {
          // 子节点宽度超过可用宽度时的换行判断
          if (nextX > startPos + sign * (anchorX * childBoundingBoxWidth)) {
            isBreak = true;
          }
        } else {
          // 计算边界并判断是否需要换行
          const boundary = (1 - this._horizontalDirection - layoutAnchor.x) * baseWidth;
          const rowBreakBoundary =
            nextX + rightBoundaryOfChild + sign * (sign > 0 ? this._paddingRight : this._paddingLeft);
          isBreak = Math.abs(rowBreakBoundary) > Math.abs(boundary);
        }

        // 处理换行逻辑
        if (isBreak) {
          nextX = startPos + sign * (anchorX * childBoundingBoxWidth);
          if (childBoundingBoxHeight !== tempMaxHeight) {
            rowMaxHeight = tempMaxHeight;
          }
          // 累加总高度（包含间距）
          totalHeight += rowMaxHeight + this._spacingY;
          rowMaxHeight = tempMaxHeight = childBoundingBoxHeight;
        }
      }

      // 计算Y轴位置并应用到子节点
      const finalPositionY = fnPositionY(child, childTrans, totalHeight);
      if (applyChildren) {
        child.setPosition(nextX, finalPositionY);
      }

      nextX += rightBoundaryOfChild;
    }

    // 计算最终容器边界
    rowMaxHeight = Math.max(rowMaxHeight, tempMaxHeight);
    const containerResizeBoundary = Math.max(maxHeight, totalHeight + rowMaxHeight) + this._getPaddingV();

    // 处理 CENTER_TO_SIDE 方向的特殊布局逻辑
    if (children.length > 0 && this.centerHorizontalDirection == CenterHorizontalDirection.CENTER_TO_SIDE) {
      let centerX = (0.5 - layoutAnchor.x) * baseWidth; // 计算中心X坐标
      let rowWidth = 0; // 行宽度
      let nextRowX = -1; // 下一行X位置
      let lastRowY = Number.MIN_SAFE_INTEGER; // 上一行Y坐标
      sign = -1; // 重置符号用于从右向左计算

      // 从右向左遍历子节点，调整位置以实现中心向两侧排列
      for (let i = children.length - 1; i >= 0; i--) {
        let child = children[i];
        let childScaleX = this.getUsedScaleValue(child.node.scale.x);
        var anchorX = child.getComponent(UITransform)!.anchorX;
        var childBoundingBoxWidth = child.getComponent(UITransform)!.width * childScaleX;

        // 检测换行（当Y坐标变化超过1时认为是新行）
        if (Math.abs(child.node.position.y - lastRowY) > 1) {
          lastRowY = child.node.position.y;
          rowWidth = child.node.position.x + (1 - anchorX) * childBoundingBoxWidth + this.paddingRight;
          rowWidth = baseWidth * layoutAnchor.x + rowWidth;
          let lastRowEndX = centerX + rowWidth * 0.5;
          nextRowX = lastRowEndX + sign * paddingX - sign * this.spacingX;
        }

        if (!child.node.activeInHierarchy) {
          continue;
        }

        // 计算并设置子节点X位置
        nextRowX = nextRowX + sign * anchorX * childBoundingBoxWidth + sign * this.spacingX;
        child.node.setPosition(new Vec3(nextRowX, child.node.position.y, 0));
        var rightBoundaryOfChild = sign * (1 - anchorX) * childBoundingBoxWidth;
        nextRowX += rightBoundaryOfChild;
      }
    }

    return containerResizeBoundary;
  }

  /**
   * 获取有效的缩放值
   * 根据是否受缩放影响返回相应的缩放值，用于准确计算布局尺寸
   * @param value 原始缩放值
   * @returns 有效的缩放值（绝对值或1）
   */
  protected getUsedScaleValue(value: number) {
    return this.affectedByScale ? Math.abs(value) : 1;
  }
}
