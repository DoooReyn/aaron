import { BaseMessage, WebSocketSession } from './session';

/**
 * 协议处理器接口
 */
export interface ProtocolHandler {
  name: string;
  encode(message: BaseMessage<unknown>): Buffer | Uint8Array;
  decode(data: Buffer | Uint8Array): BaseMessage<unknown>;
  handleRequest?(ws: WebSocketSession, message: BaseMessage<unknown>): Promise<BaseMessage<unknown> | void>;
  handleBroadcast?(message: BaseMessage<unknown>): BaseMessage<unknown> | null;
}
