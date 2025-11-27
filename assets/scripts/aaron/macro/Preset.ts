/**
 * 一些预设值
 */
export const PRESET = {
  /** 启动场景根节点名称 */
  ROOT: 'root',
  /** 启动场景2D相机名称 */
  CAMERA_2D: 'camera-2d',
  /** 默认富文本图集名称 */
  RICH_TEXT_ATLAS: 'richtext-default',
  /** 懒清理间隔时间（秒） */
  LAZY_CLEANUP_S: 30,
  /** 自动释放池过期时间（毫秒） */
  AUTO_RELEASE_MS: 120_000,
  /** 每次点击最短间隔时间（毫秒） */
  CLICK_INTERVAL_MS: 200,
} as const;
