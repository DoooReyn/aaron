import { WebSocketServerImpl } from 'server';
import { WebSocket } from 'ws';

import { MsgId } from './proto/game';

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

  constructor(private server: WebSocketServerImpl, socket: WebSocket, id: string) {
    this.socket = socket;
    this.socket.binaryType = 'arraybuffer';
    this.id = id;
  }

  send<T>(message: BaseMessage<T>, protocol?: string): void {
    protocol ??= this.server.defaultProtocol;
    const handler = this.server.getProtocolHandler(protocol);

    if (!handler) {
      console.error(`协议 ${protocol} 未注册`);
      return;
    }

    try {
      const encoded = handler.encode(message);
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
