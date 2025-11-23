import { __private } from 'cc';

/** 内置事件 */
export const EVENTS = {
  APP: {
    /** 应用进入前台 */
    ENTER_FOREGROUND: 'app:enter-foreground',
    /** 应用进入后台 */
    ENTER_BACKGROUND: 'app:enter-background',
    /** 应用退出 */
    EXIT: 'app:exit',
    /** 应用内存不足 */
    LOW_MEMORY: 'app:low-memory',
    /** 应用窗口尺寸变化 */
    SCREEN_SIZE_CHANGED: 'window-resize' as __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent,
    /** 应用全屏状态变化 */
    SCREEN_FULL_CHANGED: 'fullscreen-change' as __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent,
    /** 应用设备朝向变化 */
    SCREEN_ORIENTATION_CHANGED:
      'orientation-change' as __private._pal_screen_adapter_enum_type_screen_event__PalScreenEvent,
    /** 应用屏幕点击 */
    SCREEN_TAPPED: 'app:screen-tapped',
    /** 应用语种变化 */
    LANGUAGE_CHANGED: 'app:language-changed',
  },
  GUI: {
    /** 应用屏幕点击 */
    SCREEN_TAPPED: 'gui:screen-tapped',
  },
} as const;
