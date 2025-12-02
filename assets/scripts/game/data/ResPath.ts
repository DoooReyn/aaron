import { UserInfoController } from '../controller/UserInfoController';

/**
 * 资源加载选项映射
 * @note 项目需符合 ILoadOptions
 */
export const ResPath = {
  Tbl: {
    Dialogue: { path: 'l:resources@TableDialogue', cacheExpires: 1_000 },
    Role: { path: 'l:resources@TableRole', cacheExpires: 1_000 },
  },
  Audio: {
    Msc1: { path: 'l:resources@Msc1', cacheExpires: 30_000 },
    Msc2: { path: 'l:resources@Msc2', cacheExpires: 30_000 },
    SfxClick: { path: 'l:resources@SfxClick', cacheExpires: 60_000 },
  },
  View: {
    Popup: {
      UserInfo: {
        token: 'PopupUserInfo',
        prefab: 'l:resources@PopupUserInfo',
        cacheExpires: 60_000,
        controller: UserInfoController,
        interface: 'Popup',
      },
    },
  },
} as const;
