# WebSocket 客户端使用示例

本文档提供了 WebSocket 客户端服务的详细使用示例。

## 基本使用

### 1. 获取服务实例

```typescript
import { aaron } from '../core/Aaron';

// 获取实例
const wsc = aaron.wsc;
```

### 2. 连接到服务器

```typescript
try {
  await wsc.connect('ws://localhost:8080', {
    maxConcurrency: 5, // 最大并发请求数
    autoReconnect: true, // 自动重连
    maxReconnectAttempts: 3, // 最大重连次数
    reconnectDelay: 2000, // 重连延迟
    heartbeatInterval: 30000, // 心跳间隔
    heartbeatTimeout: 5000, // 心跳超时
  });

  console.log('WebSocket 连接成功');
} catch (error) {
  console.error('连接失败:', error);
}
```

### 3. 发送消息

#### 发送需要响应的消息

```typescript
try {
  const response = await wsc.send({
    message: {
      type: 'getUserInfo',
      data: { userId: 123 },
    },
    timeout: 5000,
    retryCount: 2,
    retryDelay: 1000,
  });

  console.log('收到响应:', response.data);
} catch (error) {
  console.error('请求失败:', error);
}
```

#### 发送单向消息

```typescript
wsc.sendOneWay({
  type: 'notification',
  data: { message: 'Hello Server!' },
});
```

#### 批量发送消息

```typescript
const requests = [
  {
    message: { type: 'getUserInfo', data: { userId: 1 } },
  },
  {
    message: { type: 'getUserInfo', data: { userId: 2 } },
  },
  {
    message: { type: 'getUserInfo', data: { userId: 3 } },
  },
];

try {
  const responses = await wsc.sendBatch(requests);
  console.log('批量响应:', responses);
} catch (error) {
  console.error('批量请求失败:', error);
}
```

## 高级功能

### 1. 拦截器使用

#### 添加请求拦截器

```typescript
const removeRequestInterceptor = wsc.addRequestInterceptor(async (config) => {
  // 添加认证 token
  config.meta = {
    ...config.meta,
    token: 'your-auth-token',
  };

  // 添加时间戳
  config.message.timestamp = Date.now();

  console.log('发送请求:', config.message.type);
  return config;
});
```

#### 添加响应拦截器

```typescript
const removeResponseInterceptor = wsc.addResponseInterceptor(async (response) => {
  console.log('收到响应:', response.requestId);

  // 可以对响应数据进行转换
  if (response.success && response.data) {
    response.data = transformResponseData(response.data);
  }

  return response;
});
```

#### 添加错误拦截器

```typescript
const removeErrorInterceptor = wsc.addErrorInterceptor(async (error) => {
  // 统一错误处理
  if (error.code === 'NETWORK_ERROR') {
    console.log('网络错误，尝试重连...');
  }

  // 记录错误日志
  console.error('WebSocket 错误:', error);

  return error;
});
```

### 2. 事件监听

```typescript
// 监听连接成功
const removeOpenListener = wsc.on('open', (event) => {
  console.log('连接已建立');
});

// 监听连接关闭
const removeCloseListener = wsc.on('close', (event) => {
  console.log('连接已关闭，代码:', event.code, '原因:', event.reason);
});

// 监听连接错误
const removeErrorListener = wsc.on('error', (event) => {
  console.error('连接错误:', event);
});

// 监听消息
const removeMessageListener = wsc.on('message', (event) => {
  console.log('收到消息:', event.data);
});

// 监听重连事件
const removeReconnectingListener = wsc.on('reconnecting', (event) => {
  console.log(`重连中 (${event.attempt}/${event.maxAttempts})`);
});

const removeReconnectedListener = wsc.on('reconnected', (event) => {
  console.log(`重连成功，第 ${event.attempt} 次尝试`);
});

// 监听心跳
const removeHeartbeatListener = wsc.on('heartbeat', (event) => {
  console.log(`心跳延迟: ${event.latency}ms`);
});

// 使用一次性监听器
wsc.once('open', (event) => {
  console.log('这是第一次连接成功');
});
```

### 3. 自定义消息解析器

```typescript
// 使用自定义消息格式
await wsc.connect('ws://localhost:8080', {
  parser: {
    stringify: (message) => {
      // 自定义序列化逻辑
      return JSON.stringify({
        cmd: message.type,
        payload: message.data,
        id: message.id,
        ts: message.timestamp,
      });
    },
    parse: (data) => {
      // 自定义反序列化逻辑
      const parsed = JSON.parse(data);
      return {
        type: parsed.cmd,
        data: parsed.payload,
        id: parsed.id,
        timestamp: parsed.ts,
      };
    },
  },
});
```

### 4. 并发控制和状态监控

```typescript
// 检查当前状态
console.log('连接状态:', wsc.state);
console.log('是否已连接:', wsc.isConnected);
console.log('活跃请求数:', wsc.getActiveRequestCount());
console.log('待处理请求数:', wsc.getPendingRequestCount());

// 清理所有待处理的请求
wsc.clearPendingRequests();
```

### 5. 取消请求

```typescript
// 发送一个可以取消的请求
const requestTask = wsc.send({
  message: {
    type: 'longRunningTask',
    data: { duration: 10000 },
  },
  timeout: 15000,
});

// 在需要时取消请求
setTimeout(() => {
  // 注意：当前实现中，取消队列中的请求是通过 task.cancel() 实现的
  // 已经发送的请求无法真正取消，但可以忽略响应
  wsc.clearPendingRequests();
}, 2000);
```

## 错误处理

### 错误类型

```typescript
import { WSError, WSErrorCodes } from '../interfaces/services/IWebsocket';

try {
  await wsc.send({ message: { type: 'test' } });
} catch (error) {
  if (error instanceof WSError) {
    switch (error.code) {
      case WSErrorCodes.NETWORK_ERROR:
        console.error('网络错误');
        break;
      case WSErrorCodes.REQUEST_TIMEOUT:
        console.error('请求超时');
        break;
      case WSErrorCodes.CONNECTION_CLOSED:
        console.error('连接已关闭');
        break;
      case WSErrorCodes.REQUEST_CANCELLED:
        console.error('请求已取消');
        break;
      default:
        console.error('未知错误:', error.message);
    }
  }
}
```

## 完整示例

```typescript
import { aaron } from '../core/Aaron';
import { WSErrorCodes } from '../interfaces/services/IWebsocket';

class GameNetwork {
  private wsc: WebsocketClient;

  constructor() {
    // 注册并获取 WebSocket 客户端
    this.wsc = aaron.wsc;

    this.setupInterceptors();
    this.setupEventListeners();
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加认证
    this.wsc.addRequestInterceptor(async (config) => {
      config.meta = { ...config.meta, token: this.getAuthToken() };
      return config;
    });

    // 错误拦截器 - 统一错误处理
    this.wsc.addErrorInterceptor(async (error) => {
      if (error.code === WSErrorCodes.AUTH_FAILED) {
        this.handleAuthError();
      }
      return error;
    });
  }

  private setupEventListeners() {
    this.wsc.on('open', () => {
      console.log('游戏服务器连接成功');
      this.sendPlayerInfo();
    });

    this.wsc.on('close', () => {
      console.log('与游戏服务器断开连接');
      this.showReconnectUI();
    });

    this.wsc.on('message', (event) => {
      const message = JSON.parse(event.data);
      this.handleServerMessage(message);
    });
  }

  async connect() {
    try {
      await this.wsc.connect('ws://game-server.example.com', {
        maxConcurrency: 10,
        autoReconnect: true,
        maxReconnectAttempts: 5,
        heartbeatInterval: 20000,
      });
    } catch (error) {
      console.error('连接游戏服务器失败:', error);
      this.showConnectionError();
    }
  }

  async sendPlayerAction(action: string, data: any) {
    try {
      const response = await this.wsc.send({
        message: {
          type: 'playerAction',
          data: { action, ...data },
        },
        timeout: 3000,
        retryCount: 2,
      });

      return response.data;
    } catch (error) {
      console.error('发送玩家动作失败:', error);
      throw error;
    }
  }

  private getAuthToken(): string {
    // 获取认证 token
    return localStorage.getItem('authToken') || '';
  }

  private handleAuthError() {
    // 处理认证错误
    console.log('认证失败，需要重新登录');
  }

  private sendPlayerInfo() {
    // 发送玩家信息
    this.wsc.sendOneWay({
      type: 'playerInfo',
      data: { playerId: this.getCurrentPlayerId() },
    });
  }

  private handleServerMessage(message: any) {
    // 处理服务器消息
    switch (message.type) {
      case 'gameState':
        this.updateGameState(message.data);
        break;
      case 'playerUpdate':
        this.updatePlayer(message.data);
        break;
      // 其他消息类型...
    }
  }

  private showReconnectUI() {
    // 显示重连界面
  }

  private showConnectionError() {
    // 显示连接错误界面
  }

  private getCurrentPlayerId(): string {
    // 获取当前玩家 ID
    return 'player123';
  }

  private updateGameState(state: any) {
    // 更新游戏状态
  }

  private updatePlayer(player: any) {
    // 更新玩家信息
  }
}

// 使用示例
const gameNetwork = new GameNetwork();
gameNetwork.connect();
```

## 注意事项

1. **生命周期管理**：在游戏场景切换或组件销毁时，记得清理事件监听器和断开连接
2. **错误处理**：始终对网络请求进行适当的错误处理
3. **并发控制**：根据服务器性能设置合适的并发限制
4. **心跳机制**：合理设置心跳间隔，避免过多的网络开销
5. **重连策略**：根据网络环境调整重连参数

## 常见问题

### Q: 如何处理大文件传输？

A: 对于大文件，建议分块传输，并在消息中包含块索引和总数信息。

### Q: 如何实现消息压缩？

A: 可以在自定义解析器中添加压缩逻辑，如使用 gzip 压缩。

### Q: 如何处理断网重连后的数据同步？

A: 在重连成功后，发送同步请求获取最新的状态数据。

### Q: 如何实现消息优先级？

A: 可以创建多个 WebSocket 实例，或实现优先级队列来处理不同优先级的消息。
