import { IService } from '../IService';

/**
 * 平台鉴定服务接口
 */
export interface IPlatform extends IService {
  /** 操作系统名称 */
  os: string;
  /** 平台名称 */
  platform: string;
  /** 是否原生设备环境 */
  native: boolean;
  /** 是否为移动设备环境 */
  mobile: boolean;
  /** 是否为浏览器环境 */
  browser: boolean;
  /** 是否为桌面环境 */
  desktop: boolean;
  /** 是否为macos环境 */
  macos: boolean;
  /** 是否为windows环境 */
  windows: boolean;
  /** 是否为linux环境 */
  linux: boolean;
  /** 是否为android环境 */
  android: boolean;
  /** 是否为ios环境 */
  ios: boolean;
  /** 是否为移动设备原生环境 */
  mobileNative: boolean;
  /** 是否为桌面设备原生环境 */
  desktopNative: boolean;
  /** 是否为ios设备原生环境 */
  iosNative: boolean;
  /** 是否为android设备原生环境 */
  androidNative: boolean;
  /** 是否为ohos设备原生环境 */
  ohosNative: boolean;
  /** 是否为移动设备浏览器环境 */
  mobileBrowser: boolean;
  /** 是否为桌面设备浏览器环境 */
  desktopBrowser: boolean;
  /** 是否为ios设备浏览器环境 */
  iosBrowser: boolean;
  /** 是否为android设备浏览器环境 */
  androidBrowser: boolean;
  /** 是否为ohos设备浏览器环境 */
  ohosBrowser: boolean;
  /** 是否为微信小游戏环境 */
  wxGame: boolean;
  /** 是否为华为小游戏环境 */
  hwGame: boolean;
  /** 是否为支付宝小游戏环境 */
  zfbGame: boolean;
  /** 是否为小米小游戏环境 */
  xmGame: boolean;
  /** 是否为抖音小游戏环境 */
  dyGame: boolean;
  /** 是否为淘宝小游戏环境 */
  tbGame: boolean;
  /** 是否为荣耀小游戏环境 */
  honorGame: boolean;
  /** 是否为OPPO小游戏环境 */
  oppoGame: boolean;
  /** 是否为VIVO小游戏环境 */
  vivoGame: boolean;
  /** 是否小端字节序 */
  littleEndian: boolean;
}
