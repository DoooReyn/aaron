import { tween, Node } from 'cc';

import { ITweenArgs, ITweenEntry } from '../../interfaces';

/**
 * 数字滚动动画
 * @param target 目标节点
 * @param duration 滚动时间
 * @param start 开始数值
 * @param end 结束数值
 * @param prefix 前缀
 * @param suffix 后缀
 * @returns
 */
export const ScrollNumberTw: ITweenEntry = {
  lib: 'scroll-number',
  args: {
    duration: 1,
    start: 0,
    end: 100,
    prefix: '',
    suffix: '',
  },
  create: (node: Node, args: ITweenArgs) => {
    const { duration, start, end, prefix, suffix } = args;

    const uiLabel = node.uiLabel;
    if (!uiLabel || !uiLabel.isValid) {
      throw new Error('必须挂载 Label 组件！');
      return tween(node);
    }

    // 边界情况处理
    if (start === end || duration <= 0) {
      uiLabel.string = prefix + end.toString() + suffix;
      return tween(node);
    }

    const diff = end - start;
    let oldNum = start;

    // 创建控制对象用于tween
    const target = node as Node & { progress: number };
    target['progress'] = 0;

    return tween(target)
      .to(
        duration,
        { progress: 1 },
        {
          // 使用线性插值确保时间精确
          easing: 'linear',
          onUpdate: (target) => {
            // 计算当前精确值
            const current = start + diff * target.progress;
            // 四舍五入取整显示
            const displayNum = Math.round(current);
            // 仅当数值变化时更新显示
            if (displayNum !== oldNum) {
              uiLabel.string = prefix + displayNum.toString() + suffix;
              oldNum = displayNum;
            }
          },
        },
      )
      .call(() => {
        // 确保最终值准确
        uiLabel.string = prefix + end.toString() + suffix;
      });
  },
};
