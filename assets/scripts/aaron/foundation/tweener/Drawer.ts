import { ITweenArgs, ITweenEntry } from '../../interfaces';
import { tween, Node, view } from 'cc';

/** 抽屉入场动画 */
export const DrawerInTw: ITweenEntry = {
  lib: 'drawer-in',
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITweenArgs) {
    const time = args.duration;
    const oy = view.getVisibleSize().height >> 1;
    const nh = node.h >> 1;
    const y1 = oy + nh + 10;
    const y2 = oy - nh - 10;
    node.y = y1;
    return tween(node).set({ y: y1 }).to(time, { y: y2 }, { easing: 'sineInOut' });
  },
};

/** 抽屉出场动画 */
export const DrawerOutTw: ITweenEntry = {
  lib: 'drawer-out',
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITweenArgs) {
    const time = args.duration;
    const oy = view.getVisibleSize().height >> 1;
    const nh = node.h >> 1;
    const y1 = oy + nh + 10;
    const y2 = oy - nh - 10;
    node.y = y2;
    return tween(node).set({ y: y2 }).to(time, { y: y1 }, { easing: 'sineInOut' });
  },
};
