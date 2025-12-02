import { ILoadOptions } from '../../aaron';

export const ResPath: Record<string, Record<string, ILoadOptions>> = {
  Tbl: {
    Dialogue: { path: 'l:resources@TableDialogue', cacheExpires: 1_000 },
    Role: { path: 'l:resources@TableRole', cacheExpires: 1_000 },
  },
  Audio: {
    Msc1: { path: 'l:resources@Msc1', cacheExpires: 30_000 },
    Msc2: { path: 'l:resources@Msc2', cacheExpires: 30_000 },
    SfxClick: { path: 'l:resources@SfxClick', cacheExpires: 60_000 },
  },
};
