import { Scene, Canvas, Camera, Node } from 'cc';
import { IService } from '../../core';

/**
 * 应用启动器服务接口
 */
export interface IAppnLauncher extends IService {
  /** 场景 */
  scene: Scene;
  /** 舞台（画布） */
  stage: Canvas;
  /** 根节点 */
  root: Node;
  /** UI 相机 */
  camera2D: Camera;
  /** 获取从后台返回前台耗时（开发者可以根据时长决定是否执行某些操作） */
  get elapsed(): number;
  /** 初始化 */
  initialize(): Promise<void>;
}
