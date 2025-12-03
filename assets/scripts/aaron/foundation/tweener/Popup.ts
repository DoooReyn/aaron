import { tween, Node, Vec3 } from 'cc';
import { ITweenArgs, ITweenEntry } from '../../interfaces';

/**
 * 弹窗入场动画
 */
export const PopupInTw: ITweenEntry = {
  lib: 'popup-in',
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITweenArgs) {
    const s1 = new Vec3(0.1, 0.1, 1);
    const s2 = new Vec3(1.15, 1.15, 1);
    const time = args.duration;
    const t1 = time * 0.725;
    const t2 = time - t1;
    node.setScale(s1);
    return tween(node)
      .set({ opacity: 0, scale: s1 })
      .to(t1, { opacity: 255, scale: s2 }, { easing: 'sineIn' })
      .to(t2, { scale: Vec3.ONE }, { easing: 'sineIn' });
  },
};

/**
 * 弹窗出场动画
 */
export const PopupOutTw: ITweenEntry = {
  lib: 'popup-out',
  args: {
    duration: 0.2,
  },
  create(node: Node, args: ITweenArgs) {
    const s1 = new Vec3(1.15, 1.15, 1);
    const s2 = new Vec3(0.1, 0.1, 1);
    const time = args.duration;
    const t1 = time * 0.275;
    const t2 = time - t1;
    return tween(node)
      .set({ opacity: 255 })
      .to(t1, { scale: s1 }, { easing: 'sineOut' })
      .to(t2, { opacity: 0, scale: s2 }, { easing: 'sineOut' });
  },
};
