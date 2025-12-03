import { Vec3, tween, v3, Node } from 'cc';
import { ITweenArgs, ITweenEntry } from '../../interfaces';
import { random } from '../../utils';
import { Noise } from '../Noise';

/**
 * 创建抖动缓动
 * @param node 目标节点
 * @param args 缓动参数
 * @returns 缓动
 */
function createShakeTweener(node: Node, args: ITweenArgs) {
  const time = args.duration;
  const intensity = args.intensity;
  const frequency = args.frequency;
  const { x, y, z } = node.position;

  const target = node as Node & { progress: number };
  target['progress'] = 0;
  const noise = new Noise();
  noise.seed(random.random());

  return tween(target).to(
    time,
    { progress: 1 },
    {
      onUpdate: (_, ratio) => {
        const fadeout = 1 - ratio;
        const time = ratio * frequency;
        const noiseX = noise.perlin2(time, 0) * intensity * fadeout;
        const noiseY = noise.perlin2(time, 2000) * intensity * fadeout;
        node.setPosition(x + noiseX, y + noiseY, z);
      },
      onComplete: () => {
        node.setPosition(x, y, z);
        delete target.progress;
      },
    },
  );
}

/**
 * 节点抖动动画（使用噪声图使抖动更顺滑）
 * @description
 * ### 强度 (Intensity)
 *  - **1-3**: 轻微抖动，适合UI反馈
 *  - **4-8**: 中等抖动，适合一般游戏效果
 *  - **9-15**: 强烈抖动，适合爆炸、撞击
 *  - **16+**: 极强抖动，适合地震、大爆炸
 *
 *  ### 持续时间 (Duration)
 *  - **0.1-0.2s**: 快速反馈
 *  - **0.3-0.6s**: 常规效果
 *  - **0.7-1.5s**: 长时间效果
 *  - **1.5s+**: 持续性效果（如地震）
 *
 *  ### 频率 (Frequency)
 *  - **10-20**: 慢速抖动，适合重物撞击
 *  - **20-35**: 中速抖动，通用效果
 *  - **35-50**: 快速抖动，适合机械振动
 *  - **50+**: 极快抖动，适合电子干扰
 * @param target 目标节点
 * @param intensity 抖动强度
 * @param duration 抖动持续时间（秒）
 * @param frequency 抖动频率
 */
export const ShakeTw: ITweenEntry = {
  lib: 'shake-normal',
  args: {
    duration: 0.2,
    intensity: 1,
    frequency: 10,
  },
  create: createShakeTweener,
};

/**
 * 轻微震动 - 适用于UI点击反馈
 */
export const WaveTw: ITweenEntry = {
  lib: 'shake-wave',
  args: {
    duration: 0.2,
    intensity: 3,
    frequency: 40,
  },
  create: createShakeTweener,
};

/**
 * 快速震动 - 适用于机械故障效果
 * @param target 目标节点
 * @returns
 */
export const VibrationTw: ITweenEntry = {
  lib: 'shake-vibration',
  args: {
    duration: 0.4,
    intensity: 6,
    frequency: 45,
  },
  create: createShakeTweener,
};

/**
 * 中等震动 - 适用于普通爆炸效果
 * @param target 目标节点
 * @returns
 */
export const ExplosionTw: ITweenEntry = {
  lib: 'shake-explosion',
  args: {
    duration: 0.6,
    intensity: 10,
    frequency: 25,
  },
  create: createShakeTweener,
};

/**
 * 强烈震动 - 适用于大型爆炸或地震效果
 * @param target 目标节点
 * @returns
 */
export const EarthquakeTw: ITweenEntry = {
  lib: 'shake-earthquake',
  args: {
    duration: 1.5,
    intensity: 12,
    frequency: 15,
  },
  create: createShakeTweener,
};

/**
 * 果冻效果动画
 * @param target 目标节点
 * @param duration 动画时长
 * @param strength 强度 0-1
 */
export const JellyTw: ITweenEntry = {
  lib: 'shake-jelly',
  args: {
    duration: 0.6,
    strength: 0.16,
  },
  create: (target: Node, args: ITweenArgs) => {
    // 保存原始状态
    const originalScale = new Vec3(target.scale.x, target.scale.y, 1);
    const originalPos = target.position.clone();
    const { duration, strength } = args;

    // 第一阶段：快速收缩 + 左偏移
    // 第二阶段：弹性扩张 + 右偏移
    // 第三阶段：恢复状态 + 微抖动
    return tween(target)
      .to(
        duration * 0.2,
        {
          scale: v3(originalScale.x - strength, originalScale.y + strength, 1),
          position: v3(originalPos.x - strength * 10, originalPos.y),
        },
        { easing: 'sineOut' },
      )
      .to(
        duration * 0.3,
        {
          scale: v3(originalScale.x + strength * 0.8, originalScale.y - strength * 0.8, 1),
          position: v3(originalPos.x + strength * 15, originalPos.y),
        },
        { easing: 'quadInOut' },
      )
      .to(
        duration * 0.5,
        {
          scale: originalScale,
          position: originalPos,
        },
        {
          easing: 'elasticOut',
          onUpdate: (target, ratio) => {
            // 添加恢复阶段的微抖动
            target.x = originalPos.x + Math.sin(ratio * Math.PI * 8) * strength * 3;
          },
        },
      );
  },
};
