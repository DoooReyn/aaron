# Aaron WebSocket Server

基于 ts-proto 的高性能 WebSocket 服务器，支持 Protocol Buffers 协议编解码。

## 功能特性

- 🚀 高性能 Protocol Buffers 二进制协议
- 🔌 可插拔的协议处理器系统
- 🎮 游戏专用协议支持
- 💬 实时聊天功能
- 🏠 房间管理系统
- ❤️ 心跳检测机制
- 📡 广播消息支持
- 🔐 安全的连接管理

## 安装

```bash
# 安装依赖
npm install

# 构建 Protocol Buffers
npm run build:proto

# 编译 TypeScript
npm run build

# 或者直接运行开发模式
npm run dev
```

## 快速开始

### 1. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

服务器将在 `ws://localhost:8080` 启动。

### 2. 客户端连接示例

```typescript
// 使用 WebSocket 客户端连接
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('已连接到服务器');

  // 发送登录消息
  ws.send(JSON.stringify({
    type: 10, // LOGIN
    data: {
      username: 'Player1',
      userId: 'user123'
    },
    timestamp: Date.now(),
    requestId: 'req_1'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到消息:', message);
};
```

## 协议支持

### JSON 协议（默认）
```typescript
// 发送 JSON 格式消息
{
  "type": 10,
  "data": { "username": "Player1", "userId": "user123" },
  "timestamp": 1703123456789,
  "requestId": "req_1"
}
```

### Protocol Buffers 协议
```typescript
// 使用 ts-proto 协议
ws.send(protobufEncodedMessage);
```

## 消息类型

### 系统消息
- `0` - PING：心跳检测
- `1` - PONG：心跳响应
- `2` - HEARTBEAT：心跳包

### 用户消息
- `10` - LOGIN：用户登录
- `11` - LOGOUT：用户登出
- `12` - CHAT：聊天消息

### 游戏消息
- `20` - PLAYER_JOIN：玩家加入
- `21` - PLAYER_LEAVE：玩家离开
- `22` - PLAYER_MOVE：玩家移动
- `23` - PLAYER_ACTION：玩家动作

### 房间消息
- `30` - ROOM_CREATE：创建房间
- `31` - ROOM_JOIN：加入房间
- `32` - ROOM_LEAVE：离开房间
- `33` - ROOM_UPDATE：房间更新

## API 文档

### 服务器类

```typescript
class WebSocketServerImpl {
  constructor(options?: { port: number; host?: string });

  // 注册协议处理器
  registerProtocolHandler(protocol: string, handler: ProtocolHandler): void;

  // 广播消息
  broadcast(message: BaseMessage, roomId?: string, excludeClientId?: string): void;

  // 房间管理
  joinRoom(clientId: string, roomId: string): void;
  leaveRoom(clientId: string, roomId: string): void;
  getRoomInfo(roomId: string): RoomMember[];

  // 获取统计信息
  getStats(): ServerStats;

  // 关闭服务器
  close(): void;
}
```

### 客户端类

```typescript
class WebSocketClient {
  // 发送消息
  send(message: BaseMessage, protocol?: string): void;

  // 关闭连接
  close(code?: number, reason?: string): void;

  // 检查连接状态
  isConnected(): boolean;
}
```

## 使用示例

### 1. 聊天室示例

```typescript
// 服务器端已内置聊天功能

// 客户端发送聊天消息
ws.send(JSON.stringify({
  type: 12, // CHAT
  data: {
    message: "Hello, everyone!"
  },
  timestamp: Date.now()
}));

// 服务器会自动广播给所有客户端
```

### 2. 游戏示例

```typescript
// 客户端加入游戏
ws.send(JSON.stringify({
  type: 20, // PLAYER_JOIN
  data: {
    username: "GamePlayer",
    characterClass: "warrior"
  },
  timestamp: Date.now()
}));

// 移动角色
ws.send(JSON.stringify({
  type: 22, // PLAYER_MOVE
  data: {
    x: 100.5,
    y: 200.3,
    z: 0,
    speed: 5.0
  },
  timestamp: Date.now()
}));

// 执行动作
ws.send(JSON.stringify({
  type: 23, // PLAYER_ACTION
  data: {
    action: "attack",
    target: "monster_123",
    params: { damage: 50 }
  },
  timestamp: Date.now()
}));
```

### 3. 房间系统示例

```typescript
// 创建房间
ws.send(JSON.stringify({
  type: 30, // ROOM_CREATE
  data: {
    roomName: "Battle Room",
    maxPlayers: 4,
    isPrivate: false
  },
  timestamp: Date.now()
}));

// 加入房间
ws.send(JSON.stringify({
  type: 31, // ROOM_JOIN
  data: {
    roomId: "room_123456",
    password: null // 如果是私有房间
  },
  timestamp: Date.now()
}));

// 离开房间
ws.send(JSON.stringify({
  type: 32, // ROOM_LEAVE
  data: {
    roomId: "room_123456"
  },
  timestamp: Date.now()
}));
```

## 性能优化

### 1. 使用 Protocol Buffers
```typescript
// 切换到二进制协议以提高性能
client.send({
  type: 22,
  data: moveData,
  timestamp: Date.now()
}, 'tsproto');
```

### 2. 批量发送
```typescript
// 批量发送多个消息
const messages = [
  { type: 22, data: move1 },
  { type: 22, data: move2 },
  { type: 23, data: action }
];

// 服务器支持批量处理
```

### 3. 压缩
服务器默认启用 WebSocket 的 permessage-deflate 压缩。

## 开发指南

### 添加自定义协议

```typescript
// 实现协议处理器
class MyCustomProtocol implements ProtocolHandler {
  name = 'custom';

  encode(message: BaseMessage): Buffer {
    // 自定义编码逻辑
    return encodedData;
  }

  decode(data: Buffer): BaseMessage {
    // 自定义解码逻辑
    return decodedMessage;
  }

  async handleRequest(client: WebSocketClient, message: BaseMessage) {
    // 处理请求
    return response;
  }
}

// 注册协议
server.registerProtocolHandler('custom', new MyCustomProtocol());
```

### 添加中间件

```typescript
// 在 handleMessage 中添加中间件逻辑
private async handleMessage(client: WebSocketClient, data: Buffer) {
  // 鉴权中间件
  if (!this.authenticate(client, data)) {
    client.close(4001, '未授权');
    return;
  }

  // 限流中间件
  if (this.rateLimitExceeded(client)) {
    client.close(4002, '请求过于频繁');
    return;
  }

  // 处理消息
  await this.processMessage(client, data);
}
```

## 监控和调试

### 查看服务器状态

```typescript
// 获取服务器统计
const stats = server.getStats();
console.log(stats);
/*
{
  totalClients: 100,
  activeClients: 95,
  rooms: [
    { id: 'room1', clientCount: 4 },
    { id: 'room2', clientCount: 6 }
  ],
  protocols: ['json', 'tsproto', 'game']
}
```

### 启用调试日志

```typescript
// 在代码中添加调试信息
console.log(`客户端 ${client.id} 发送消息:`, message.type);

// 使用环境变量控制日志级别
const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) {
  console.debug('详细调试信息');
}
```

## 部署

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY proto ./proto

EXPOSE 8080

CMD ["node", "dist/index.js"]
```

### 环境变量

```bash
# 设置端口
PORT=8080

# 启用调试
DEBUG=true

# 设置最大连接数
MAX_CONNECTIONS=1000

# 心跳间隔（毫秒）
HEARTBEAT_INTERVAL=30000
```

## 故障排除

### 常见问题

1. **连接被拒绝**
   - 检查端口是否被占用
   - 确认防火墙设置

2. **消息解码失败**
   - 检查协议是否正确
   - 确认客户端编码格式

3. **性能问题**
   - 使用 Protocol Buffers
   - 启用消息压缩
   - 限制广播频率

### 日志分析

```bash
# 查看服务器日志
tail -f logs/server.log

# 查看错误日志
grep "ERROR" logs/server.log

# 分析连接统计
grep "客户端连接" logs/server.log | wc -l
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License