import { WebSocket, WebSocketServer } from 'ws';

import { ProtocolHandler } from './handlers';
import { HeartBeatReq, HeartBeatResp, MessageFns, MsgId, PingReq, PongResp } from './proto/game';
import { BaseMessage, WebSocketSession } from './session';

/**
 * WebSocket 服务器类
 */
export class WebSocketServerImpl {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketSession> = new Map();
  private protocolHandlers: Map<string, ProtocolHandler> = new Map();
  public defaultProtocol: string = 'proto';
  private readonly headLength: number = 6;

  /** 协议映射，存储命令和对应的请求和响应处理函数 */
  private readonly protocols: Map<number, [MessageFns<unknown>?, MessageFns<unknown>?]> = new Map();

  constructor(options: { port: number; host?: string } = { port: 8080 }) {
    this.wss = new WebSocketServer({
      port: options.port,
      host: options.host || '0.0.0.0',
      perMessageDeflate: {
        zlibDeflateOptions: {
          level: 3,
        },
        zlibInflateOptions: {
          level: 3,
        },
      },
    });

    this.registerDefaultProtocolHandlers();
    this.registerProtocolCmd();
    this.setupWebSocketServer();
  }

  /**
   * 设置 WebSocket 服务器事件
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const handler = this.getProtocolHandler(this.defaultProtocol)!;
      const clientId = this.generateClientId();
      const client = new WebSocketSession(handler, ws, clientId);

      console.log(`客户端连接: ${clientId} (${req.socket.remoteAddress})`);
      this.clients.set(clientId, client);

      ws.on('message', async (data) => {
        // 处理不同类型的数据
        let buffer: Buffer;

        // 检查数据类型
        if (Buffer.isBuffer(data)) {
          // Buffer 类型
          buffer = data;
        } else if (data instanceof ArrayBuffer) {
          // ArrayBuffer 类型
          buffer = Buffer.from(data);
        } else if (typeof data === 'string') {
          // 字符串类型
          buffer = Buffer.from(data, 'utf8');
        } else if (data && typeof (data as any).arrayBuffer === 'function') {
          // Blob 类型或其他有 arrayBuffer 方法的类型
          try {
            const blob = data as any;
            const arrayBuffer = await blob.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
          } catch (error) {
            console.error('转换 Blob 到 ArrayBuffer 失败:', error);
            return;
          }
        } else {
          console.error('未知的数据类型:', typeof data);
          return;
        }

        await this.handleMessage(client, buffer);
      });

      ws.on('close', (code, reason) => {
        console.log(`客户端断开: ${clientId}, code: ${code}, reason: ${reason}`);
        this.handleClientDisconnect(client);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`客户端错误 ${clientId}:`, error);
      });
    });

    this.wss.on('listening', () => {
      console.log(`WebSocket 服务器启动成功，监听端口: ${this.wss.options.port}`);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket 服务器错误:', error);
    });

    // 定期清理断开的连接
    setInterval(() => {
      this.cleanupDeadConnections();
    }, 30000); // 每30秒清理一次
  }

  /**
   * 处理客户端断开连接
   */
  private handleClientDisconnect(client: WebSocketSession): void {
    // todo
  }

  /**
   * 生成客户端 ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 注册协议处理器
   */
  registerProtocolHandler(protocol: string, handler: ProtocolHandler): void {
    this.protocolHandlers.set(protocol, handler);
    console.log(`注册协议处理器: ${protocol}`);
  }

  /**
   * 获取协议处理器
   */
  getProtocolHandler(protocol: string): ProtocolHandler | undefined {
    return this.protocolHandlers.get(protocol);
  }

  /**
   * 处理消息
   */
  private async handleMessage(client: WebSocketSession, data: Buffer): Promise<void> {
    try {
      // 尝试使用默认协议解码
      const handler = this.protocolHandlers.get(this.defaultProtocol);

      if (!handler) {
        console.error('未找到默认协议处理器');
        return;
      }

      let message: BaseMessage<unknown>;
      try {
        message = handler.decode(data);
      } catch (error) {
        console.error('消息解码失败:', error);
        return;
      }

      // 设置时间戳
      if (!message.timestamp) {
        message.timestamp = Date.now();
      }

      // 记录请求 ID
      if (message.id != undefined) {
        console.log(`收到请求 ${message.id} from ${client.id}`, message);
      }

      // 处理消息
      if (client.handle(message)) return;

      // 调用协议处理器
      if (handler.handleRequest) {
        const response = await handler.handleRequest(client, message);

        // 如果有响应，发送回客户端
        if (response) {
          client.send(response);
        }
      }

      // 处理广播消息
      if (handler.handleBroadcast) {
        const broadcastMessage = handler.handleBroadcast(message);
        if (broadcastMessage) {
          this.broadcast(broadcastMessage, [client.id]);
        }
      }
    } catch (error) {
      console.error('处理消息时出错:', error);
    }
  }

  /**
   * 广播消息
   */
  public broadcast<T>(message: BaseMessage<T>, excludeClientIds?: string[]): void {
    const targets: WebSocketSession[] = [];

    // 广播到所有客户端
    this.clients.forEach((client, clientId) => {
      if (!excludeClientIds?.includes(clientId) && client.isConnected()) {
        targets.push(client);
      }
    });

    // 发送消息
    targets.forEach((client) => {
      client.send(message);
    });

    console.log(`广播消息到 ${targets.length} 个客户端:`, message.cmd);
  }

  /**
   * 获取服务器统计信息
   */
  public getStats() {
    return {
      totalClients: this.clients.size,
      activeClients: Array.from(this.clients.values()).filter((c) => c.isConnected()).length,
      protocols: Array.from(this.protocolHandlers.keys()),
    };
  }

  /**
   * 清理死连接
   */
  private cleanupDeadConnections(): void {
    const now = Date.now();
    const deadClients: string[] = [];

    this.clients.forEach((client, id) => {
      // 检查连接状态
      if (!client.isConnected()) {
        deadClients.push(id);
        return;
      }

      // 检查心跳超时（60秒）
      if (client.lastPingTime > 0 && now - client.lastPongTime > 60000) {
        console.log(`客户端 ${id} 心跳超时，断开连接`);
        client.close(1000, '心跳超时');
        deadClients.push(id);
      }
    });

    // 移除断开的客户端
    deadClients.forEach((id) => {
      this.clients.delete(id);
    });

    if (deadClients.length > 0) {
      console.log(`清理了 ${deadClients.length} 个断开的连接`);
    }
  }

  /**
   * 关闭服务器
   */
  public close(): void {
    console.log('关闭 WebSocket 服务器...');

    // 断开所有客户端
    this.clients.forEach((client) => {
      client.close(1001, '服务器关闭');
    });
    this.clients.clear();

    // 关闭服务器
    this.wss.close();
  }

  /**
   * 注册默认的协议处理器
   */
  private registerDefaultProtocolHandlers(): void {
    // 注册 JSON 协议
    this.registerProtocolHandler('json', {
      name: 'json',
      encode: (message: BaseMessage<unknown>): Buffer => {
        return Buffer.from(JSON.stringify(message), 'utf8');
      },
      decode: (data: Buffer | Uint8Array): BaseMessage<unknown> => {
        const str = Buffer.isBuffer(data) ? data.toString('utf8') : new TextDecoder().decode(data);
        return JSON.parse(str) as BaseMessage<unknown>;
      },
      handleRequest: async (
        client: WebSocketSession,
        message: BaseMessage<unknown>
      ): Promise<BaseMessage<unknown> | void> => {
        console.warn(`未处理的消息类型: ${message.cmd}`);
      },
      handleBroadcast: (message: BaseMessage<unknown>): BaseMessage<unknown> | null => {
        console.warn(`未处理的广播消息类型: ${message.cmd}`);
        return null;
      },
    });
    // 注册 Protocol Buffers 协议
    this.registerProtocolHandler('proto', {
      name: 'proto',
      encode: (data: BaseMessage<unknown>): Uint8Array<ArrayBuffer> => {
        const cmd = data.cmd;
        if (!this.protocols.has(cmd)) {
          throw new Error(`协议消息号未注册 ${cmd}`);
        }

        const rid = data.id!;
        const resp = this.protocols.get(cmd)![1];
        if (resp == undefined) {
          return new Uint8Array(0);
        }

        let length = this.headLength;
        const abHead = new ArrayBuffer(length);
        const dvHead = new DataView(abHead);
        const bytes = resp.encode(data.data).finish();
        dvHead.setUint16(0, cmd, true);
        dvHead.setUint16(2, rid, true);
        dvHead.setUint16(4, bytes.length, true);
        length += bytes.length;
        const u8head = new Uint8Array(abHead);
        const buffer = new Uint8Array(length);
        buffer.set(u8head, 0);
        buffer.set(bytes, this.headLength);

        return buffer;
      },
      decode: (msg: Buffer): BaseMessage<unknown> => {
        const cmd = msg.readUint16LE(0);
        if (!this.protocols.has(cmd)) {
          throw new Error(`协议消息号未注册 ${cmd}`);
        }

        const req: MessageFns<unknown> = this.protocols.get(cmd)![0]!;
        const rid = msg.readUint16LE(2);
        const bytes = new Uint8Array(msg.buffer, this.headLength, msg.byteLength - this.headLength);
        const data = req.decode(bytes, bytes.byteLength);

        return {
          cmd: cmd,
          id: rid,
          data: data,
          timestamp: Date.now(),
        };
      },
      handleRequest: async (
        client: WebSocketSession,
        message: BaseMessage<unknown>
      ): Promise<BaseMessage<unknown> | void> => {
        console.warn(`未处理的消息类型: ${message.cmd}`);
      },
      handleBroadcast: (message: BaseMessage<unknown>): BaseMessage<unknown> | null => {
        console.warn(`未处理的广播消息类型: ${message.cmd}`);
        return null;
      },
    });
  }

  private registerProtocolCmd() {
    this.protocols.set(MsgId.HEART_BEAT, [HeartBeatReq, HeartBeatResp]);
    this.protocols.set(MsgId.PING, [PingReq, PongResp]);
    this.protocols.set(MsgId.PONG, [undefined, PongResp]);
  }
}
