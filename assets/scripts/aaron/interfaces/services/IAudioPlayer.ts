import { IService } from '../IService';

/**
 * 音频播放服务接口
 */
export interface IAudioPlayer extends IService {
  /** 初始化 */
  initialize(): void;
}
