import { sys } from 'cc';
import { IPlatform } from '../interfaces';
import { Service } from '../core';

/**
 * 平台鉴定服务
 */
export class Platform extends Service implements IPlatform {
  readonly os = sys.os;
  readonly platform = sys.platform;
  readonly littleEndian = sys.isLittleEndian;
  readonly native = sys.isNative;
  readonly mobile = sys.isMobile;
  readonly browser = sys.isBrowser;
  readonly macos = sys.OS.OSX === this.os;
  readonly windows = sys.OS.WINDOWS === this.os;
  readonly linux = sys.OS.LINUX === this.os;
  readonly ios = sys.OS.IOS === this.os;
  readonly android = sys.OS.ANDROID === this.os;
  readonly ohos = sys.OS.OHOS === this.os;
  readonly desktop = this.macos || this.windows || this.linux;
  readonly mobileNative = this.mobile && this.native;
  readonly desktopNative = this.desktop && this.native;
  readonly iosNative = this.ios && this.native;
  readonly androidNative = this.android && this.native;
  readonly ohosNative = this.ohos && this.native;
  readonly mobileBrowser = this.mobile && this.browser;
  readonly desktopBrowser = this.desktop && this.browser;
  readonly iosBrowser = this.ios && this.browser;
  readonly androidBrowser = this.android && this.browser;
  readonly ohosBrowser = this.ohos && this.browser;
  readonly wxGame = this.platform === sys.Platform.WECHAT_GAME;
  readonly hwGame = this.platform === sys.Platform.HUAWEI_QUICK_GAME;
  readonly zfbGame = this.platform === sys.Platform.ALIPAY_MINI_GAME;
  readonly xmGame = this.platform === sys.Platform.XIAOMI_QUICK_GAME;
  readonly dyGame = this.platform === sys.Platform.BYTEDANCE_MINI_GAME;
  readonly tbGame = this.platform === sys.Platform.TAOBAO_MINI_GAME;
  readonly honorGame = this.platform === sys.Platform.HONOR_MINI_GAME;
  readonly oppoGame = this.platform === sys.Platform.OPPO_MINI_GAME;
  readonly vivoGame = this.platform === sys.Platform.VIVO_MINI_GAME;
}
