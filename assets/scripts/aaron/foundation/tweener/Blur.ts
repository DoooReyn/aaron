import { tween, Node } from 'cc';
import { ITweenArgs, ITweenEntry } from '../../interfaces';

/** 模糊入场动画 */
export const BlurInTw: ITweenEntry = {
  lib: 'blur-in',
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITweenArgs) {
    const time = args.duration;
    node.opacity = 0;
    return tween(node).set({ opacity: 0 }).to(time, { opacity: 255 }, { easing: 'sineInOut' });
  },
};

/** 模糊出场动画 */
export const BlurOutTw: ITweenEntry = {
  lib: 'blur-out',
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITweenArgs) {
    const time = args.duration;
    node.opacity = 255;
    return tween(node).set({ opacity: 255 }).to(time, { opacity: 0 }, { easing: 'sineInOut' });
  },
};
