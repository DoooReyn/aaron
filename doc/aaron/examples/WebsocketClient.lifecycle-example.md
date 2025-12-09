# WebSocket 生命周期管理示例

本文档展示如何使用 WebSocket 客户端的生命周期管理功能，包括在用户从后台返回时检测连接活性。

## 基本使用

WebSocket 客户端会自动监听应用的生命周期事件，在应用进入后台和返回前台时自动处理连接状态。

### 1. 自动监听生命周期

```typescript
import { ServiceContainer } from '../core';
import { WebsocketClient } from './WebsocketClient';

// 获取 WebSocket 客户端实例
const container = ServiceContainer.Shared;
container.registerFactory('WebsocketClient', WebsocketClient);
const wsClient = container.get<WebsocketClient>('WebsocketClient');

// 连接到服务器
await wsClient.connect('ws://game-server.example.com', {
  autoReconnect: true,
  heartbeatInterval: 30000,
});

// 从现在开始，WebSocket 客户端会自动处理：
// - 应用进入后台时：暂停心跳，记录连接状态
// - 应用返回前台时：检测连接活性，必要时重连
```

### 2. 手动检测连接状态

```typescript
// 手动检测连接是否正常
const isHealthy = await wsClient.checkConnection();
if (!isHealthy) {
  console.log('连接不健康');
}

// 获取详细的连接统计信息
const stats = wsClient.getConnectionStats();
console.log('连接统计:', {
  isConnected: stats.isConnected,
  activeRequests: stats.activeRequests,
  pendingRequests: stats.pendingRequests,
  lastHeartbeat: new Date(stats.lastHeartbeat).toLocaleTimeString(),
  lastConnectionCheck: new Date(stats.lastConnectionCheck).toLocaleTimeString(),
  connectionStateBeforeBackground: stats.connectionStateBeforeBackground,
});
```

### 3. 生命周期事件处理细节

```typescript
// WebSocket 客户端内部会自动处理以下场景：

// 场景 1：应用进入后台
// - 暂停心跳发送（节省资源）
// - 记录当前连接状态
// - 清理心跳超时计时器

// 场景 2：应用返回前台
// - 如果之前已连接：发送 Ping 检测连接活性
// - 如果 Ping 失败：自动重连
// - 如果连接已断开：自动重连
// - 重连成功后：恢复心跳机制
```

## 高级使用

### 1. 结合游戏状态管理

```typescript
class GameNetworkManager {
  private wsClient: WebsocketClient;
  private isGameActive: boolean = false;

  constructor() {
    const container = ServiceContainer.Shared;
    this.wsClient = container.get<WebsocketClient>('WebsocketClient');

    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring() {
    // 监听连接状态变化
    this.wsClient.on('open', () => {
      console.log('WebSocket 已连接');
      this.updateConnectionStatus(true);
    });

    this.wsClient.on('close', () => {
      console.log('WebSocket 已断开');
      this.updateConnectionStatus(false);
    });

    // 监听重连事件
    this.wsClient.on('reconnecting', (event) => {
      console.log(`重连中 (${event.attempt}/${event.maxAttempts})`);
      this.showReconnectingUI(true);
    });

    this.wsClient.on('reconnected', (event) => {
      console.log(`重连成功，第 ${event.attempt} 次尝试`);
      this.showReconnectingUI(false);
    });
  }

  // 游戏进入前台时
  async onGameResume() {
    this.isGameActive = true;

    // 检查连接状态
    const stats = this.wsClient.getConnectionStats();

    if (!stats.isConnected) {
      this.showConnectionErrorUI();
      return;
    }

    // 手动检测连接活性
    const isHealthy = await this.wsClient.checkConnection();
    if (!isHealthy) {
      console.log('连接不健康，等待自动重连...');
    }
  }

  // 游戏进入后台时
  onGamePause() {
    this.isGameActive = false;
    // WebSocket 客户端会自动处理后台逻辑
  }

  private updateConnectionStatus(connected: boolean) {
    if (this.isGameActive) {
      // 更新游戏 UI 中的连接状态
      this.updateUIConnectionStatus(connected);
    }
  }

  private showReconnectingUI(show: boolean) {
    // 显示/隐藏重连提示
  }

  private showConnectionErrorUI() {
    // 显示连接错误提示
  }

  private updateUIConnectionStatus(connected: boolean) {
    // 更新 UI 中的连接状态图标
  }
}
```

### 2. 定期连接健康检查

```typescript
class ConnectionHealthMonitor {
  private wsClient: WebsocketClient;
  private healthCheckInterval?: number;
  private isMonitoring: boolean = false;

  constructor(wsClient: WebsocketClient) {
    this.wsClient = wsClient;
  }

  // 开始定期健康检查
  startHealthCheck(intervalMs: number = 60000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.healthCheckInterval = setInterval(async () => {
      try {
        const isHealthy = await this.wsClient.checkConnection();

        if (!isHealthy) {
          console.warn('连接健康检查失败');
          this.onConnectionUnhealthy();
        } else {
          console.log('连接健康检查通过');
        }
      } catch (error) {
        console.error('健康检查异常:', error);
        this.onHealthCheckError(error);
      }
    }, intervalMs) as any;

    console.log('连接健康检查已启动');
  }

  // 停止健康检查
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('连接健康检查已停止');
  }

  private onConnectionUnhealthy() {
    // 连接不健康时的处理逻辑
    // 可以显示提示、记录日志等
  }

  private onHealthCheckError(error: any) {
    // 健康检查出错时的处理逻辑
  }
}
```

### 3. 连接状态持久化

```typescript
class ConnectionStateManager {
  private wsClient: WebsocketClient;
  private storageKey = 'websocket_connection_state';

  constructor(wsClient: WebsocketClient) {
    this.wsClient = wsClient;
    this.restoreConnectionState();
  }

  // 保存连接状态
  private saveConnectionState() {
    const stats = this.wsClient.getConnectionStats();
    const state = {
      url: stats.url,
      lastConnected: Date.now(),
      options: stats.options
    };

    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  // 恢复连接状态
  private restoreConnectionState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state = JSON.parse(saved);

        // 如果距离上次连接时间不久，自动重连
        const timeSinceLastConnection = Date.now() - state.lastConnected;
        if (timeSinceLastConnection < 5 * 60 * 1000 && state.url) { // 5分钟内
          console.log('检测到最近的连接记录，尝试恢复...');
          this.wsClient.connect(state.url, state.options);
        }
      }
    } catch (error) {
      console.error('恢复连接状态失败:', error);
    }
  }

  // 清除保存的状态
  clearSavedState() {
    localStorage.removeItem(this.storageKey);
  }
}
```

## 服务器端配合

为了让前台的 Ping/Pong 机制正常工作，服务器需要支持对 `ping` 消息的响应：

### Node.js (ws) 服务器示例

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('新的 WebSocket 连接');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // 处理 ping 消息
      if (data.type === 'ping') {
        const pong = {
          type: 'pong',
          data: {
            timestamp: data.data.timestamp,
            serverTimestamp: Date.now()
          }
        };
        ws.send(JSON.stringify(pong));
        return;
      }

      // 处理心跳消息
      if (data.type === 'heartbeat') {
        const response = {
          type: 'heartbeat',
          data: {
            timestamp: data.data.timestamp,
            serverTimestamp: Date.now()
          }
        };
        ws.send(JSON.stringify(response));
        return;
      }

      // 处理其他业务消息
      handleBusinessMessage(ws, data);

    } catch (error) {
      console.error('处理消息错误:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket 连接关闭');
  });
});

function handleBusinessMessage(ws, message) {
  // 处理业务逻辑消息
}
```

## 最佳实践

1. **合理设置心跳间隔**：根据网络环境调整，一般 30-60 秒为宜
2. **避免频繁重连**：设置合理的重连延迟和最大重连次数
3. **记录连接状态**：保存用户的连接偏好，下次启动时自动恢复
4. **UI 提示**：在网络状况不佳时给用户适当的提示
5. **优雅降级**：在连接失败时提供离线模式或重试机制

## 注意事项

- 生命周期监听需要依赖 `EventBus` 服务，确保它已正确初始化
- Ping/Pong 机制需要服务器端支持
- 在 Web 环境中，浏览器的限制可能会影响后台运行
- 建议在游戏暂停时减少网络请求频率
- 长时间在后台可能会导致被系统杀死进程