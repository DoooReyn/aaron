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
    /** 应用语种变化 */
    LANGUAGE_CHANGED: 'app:language-changed',
  },
  GUI: {
    /** 应用屏幕点击 */
    SCREEN_TAPPED: 'gui:screen-tapped',
    /** 红点变化 */
    RED_DOT_CHANGED: 'gui:red-dot-changed@',
    /** 弹窗层遮罩点击事件 */
    POPUP_MASK_CLICKED: 'gui:popup-mask-clicked',
    /** 弹窗层遮罩点击事件 */
    ALERT_MASK_CLICKED: 'gui:alert-mask-clicked',
  },
} as const;
