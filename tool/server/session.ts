import { ProtocolHandler } from 'handlers';
import { WebSocket } from 'ws';

import { ErrCode, HeartBeatResp, MsgId, PingReq, PongResp } from './proto/game';

/**
 * 基础消息接口
 */
export interface BaseMessage<T> {
  cmd: MsgId;
  data: T;
  timestamp?: number;
  id?: number;
}

/**
 * WebSocket 连接
 */
export class WebSocketSession {
  public readonly socket: WebSocket;
  public readonly id: string;
  public lastPingTime: number = 0;
  public lastPongTime: number = 0;

  constructor(private protocolHandler: ProtocolHandler, socket: WebSocket, id: string) {
    this.socket = socket;
    this.socket.binaryType = 'arraybuffer';
    this.id = id;
  }

  handle<T>(message: BaseMessage<T>): boolean {
    let handled = true;

    switch (message.cmd) {
      case MsgId.HEART_BEAT:
        this.send<HeartBeatResp>({
          cmd: MsgId.HEART_BEAT,
          data: {
            respCode: {
              errCode: ErrCode.SUCCESS,
            },
          },
          id: message.id,
          timestamp: Date.now(),
        });
        break;
      case MsgId.PING:
        this.send<PongResp>({
          cmd: MsgId.PONG,
          id: message.id,
          data: {
            timestamp: (message.data as PingReq).timestamp,
          },
        });
        break;
      default:
        handled = false;
        break;
    }

    return handled;
  }

  send<T>(message: BaseMessage<T>): void {
    try {
      const encoded = this.protocolHandler.encode(message);
      this.socket.send(encoded);
      console.log('发送消息成功', message);
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  }

  close(code?: number, reason?: string): void {
    this.socket.close(code, reason);
  }

  isConnected(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }
}
