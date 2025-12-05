

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
  LAZY_CLEANUP_S: 10,
  /** 资源默认过期时间（毫秒） */
  ASSET_EXPIRES_MS: 120_000,
  /** 每次点击最短间隔时间（毫秒） */
  CLICK_INTERVAL_MS: 200,
  /**
   * 音乐资源池条目参数
   * @note 音乐一般同时只能存在一个实例，因此 expands 和 capacity 保持短小精悍，可用即可
   * @note 音乐一般不会经常切换，因此过期时间可以设短一些，这样资源可以尽快释放
   */
  MUSIC_ENTRY_OPTIONS: {
    token: 'music-entry',
    expands: 1,
    capacity: 2,
    expires: 10_000,
  },
  /**
   * 音效资源池条目参数
   * @note 音效同时可以存在多个实例，因此 expands 和 capacity 可以适当加大一点
   * @note 音效一般会频繁播放，因此过期时间较音乐可以适当延长一些
   */
  SOUND_ENTRY_OPTIONS: {
    token: 'sound-entry',
    expands: 4,
    capacity: 16,
    expires: 30_000,
  },
} as const;
