import { IService } from "../../core";
import { Dict } from "../../types";

/**
 * 参数解析器服务接口
 */
export interface IArgParser extends IService {
  /** 输出参数 */
  args: Dict;
  /**
   * 解析参数
   * @param args 输入参数
   */
  parse(args: Dict): void;
}
