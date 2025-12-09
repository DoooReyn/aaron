# WebSocket 未发送请求处理机制

本文档详细说明 WebSocket 客户端在连接断开后如何处理未发送的请求。

## 请求分类

当连接断开时，请求分为两类：

### 1. 待处理请求 (Pending Requests)
- **定义**：已发送但未收到响应的请求
- **存储位置**：`_pendingRequests` Map
- **处理方式**：立即拒绝，返回 `CONNECTION_CLOSED` 错误

### 2. 队列请求 (Queued Requests)
- **定义**：因并发限制未发送的请求
- **存储位置**：`_requestQueue` 数组
- **处理方式**：根据配置决定是否保留和重发

## 配置选项

```typescript
interface WSOptions {
  /** 连接断开后是否保留未发送的请求，默认 true */
  retainPendingRequests?: boolean;

  /** 连接恢复后是否自动重发保留的请求，默认 true */
  autoRetryPendingRequests?: boolean;
}
```

## 处理流程

### 连接断开时 (_handleClose)

```typescript
// 1. 处理已发送但未响应的请求
for (const task of this._pendingRequests.values()) {
  task.reject(new WSError(WSErrorCodes.CONNECTION_CLOSED, '连接已关闭'));
}
this._pendingRequests.clear();

// 2. 处理队列中的请求
if (!this._options?.retainPendingRequests) {
  // 不保留：拒绝所有队列请求
  this._rejectQueuedRequests(new WSError(WSErrorCodes.CONNECTION_CLOSED, '未发送的请求已丢弃'));
} else {
  // 保留：记录日志，等待重连后处理
  this.logger.df(`保留 ${this._requestQueue.length} 个未发送的请求`);
}
```

### 连接恢复时 (_retryQueuedRequests)

```typescript
private _retryQueuedRequests(): void {
  if (!this._options?.autoRetryPendingRequests || this._requestQueue.length === 0) {
    return;
  }

  const pendingTasks = this._requestQueue.splice(0);
  this.logger.i(`重发 ${pendingTasks.length} 个保留的请求`);

  // 延迟 100ms 执行，确保连接稳定
  setTimeout(() => {
    for (const task of pendingTasks) {
      this._executeRequest(task, task.config);
    }
  }, 100);
}
```

## 使用示例

### 场景 1：保留并自动重发（默认行为）

```typescript
await wsClient.connect('ws://server.com', {
  retainPendingRequests: true,        // 保留未发送的请求
  autoRetryPendingRequests: true,    // 自动重发
  maxConcurrency: 5                  // 限制并发数
});

// 快速发送 10 个请求
const requests = Array.from({ length: 10 }, (_, i) =>
  wsClient.send({ message: { type: 'test', data: i } })
);

// 如果此时连接断开：
// - 前 5 个请求已发送，会被立即拒绝
// - 后 5 个请求在队列中，会被保留

// 连接恢复后：
// - 后 5 个请求会自动重发
```

### 场景 2：不保留未发送的请求

```typescript
await wsClient.connect('ws://server.com', {
  retainPendingRequests: false,       // 不保留未发送的请求
  autoRetryPendingRequests: false,   // 不自动重发
  maxConcurrency: 5
});

// 如果连接断开，所有请求（包括队列中的）都会被立即拒绝
```

### 场景 3：保留但手动重发

```typescript
await wsClient.connect('ws://server.com', {
  retainPendingRequests: true,        // 保留未发送的请求
  autoRetryPendingRequests: false,   // 不自动重发
});

// 连接恢复后，手动检查并决定是否重发
const stats = wsClient.getConnectionStats();
if (stats.queuedRequests > 0) {
  console.log(`有 ${stats.queuedRequests} 个请求等待处理`);
  // 可以选择重新发送这些请求
}
```

## 监控请求状态

### 获取统计信息

```typescript
const stats = wsClient.getConnectionStats();
console.log('请求状态:', {
  activeRequests: stats.activeRequests,      // 正在处理的请求数
  pendingRequests: stats.pendingRequests,    // 已发送但未响应的请求数
  queuedRequests: stats.queuedRequests,      // 队列中的请求数
});
```

### 监听事件

```typescript
// 监听连接关闭事件
wsClient.on('close', (event) => {
  console.log('连接关闭，代码:', event.code);

  // 检查是否有请求被保留
  const stats = wsClient.getConnectionStats();
  if (stats.queuedRequests > 0) {
    console.log(`${stats.queuedRequests} 个请求被保留`);
  }
});

// 监听重连事件
wsClient.on('reconnected', (event) => {
  console.log('重连成功');

  // 检查是否有请求被重发
  const stats = wsClient.getConnectionStats();
  if (stats.options.autoRetryPendingRequests) {
    console.log('保留的请求会自动重发');
  }
});
```

## 错误处理

### 请求被拒绝时的错误类型

```typescript
try {
  await wsClient.send({ message: { type: 'test' } });
} catch (error) {
  if (error instanceof WSError) {
    switch (error.code) {
      case WSErrorCodes.CONNECTION_CLOSED:
        console.log('连接已关闭');
        // 如果 retainPendingRequests 为 true，请求可能在队列中等待重发
        break;

      case WSErrorCodes.REQUEST_CANCELLED:
        console.log('请求被取消（主动断开连接）');
        break;
    }
  }
}
```

## 最佳实践

1. **合理设置并发限制**
   ```typescript
   // 根据服务器处理能力设置合理的并发数
   maxConcurrency: 10
   ```

2. **启用请求保留和自动重发**
   ```typescript
   // 对于游戏等实时应用，建议启用
   retainPendingRequests: true,
   autoRetryPendingRequests: true
   ```

3. **监控请求队列状态**
   ```typescript
   // 定期检查请求状态
   setInterval(() => {
     const stats = wsClient.getConnectionStats();
     if (stats.queuedRequests > 100) {
       console.warn('请求队列积压过多:', stats.queuedRequests);
     }
   }, 5000);
   ```

4. **处理重复请求**
   ```typescript
   // 如果请求是幂等的，可以安全重发
   // 如果不是幂等的，需要在请求中添加唯一ID进行去重
   const message = {
     type: 'updateScore',
     data: { score: 100, requestId: generateUniqueId() }
   };
   ```

5. **优雅降级**
   ```typescript
   // 当连接不稳定时，可以临时禁用某些非关键功能
   wsClient.on('close', () => {
     if (!wsClient.isConnected) {
       disableRealTimeFeatures();
       enableOfflineMode();
     }
   });
   ```

## 注意事项

1. **内存管理**：长时间保留大量请求可能会占用较多内存
2. **请求过期**：某些请求可能有时间敏感性，重发前应检查是否仍然有效
3. **服务器压力**：自动重发可能导致请求集中，给服务器造成压力
4. **幂等性**：确保重发的请求是幂等的，避免重复操作
5. **用户体验**：在连接恢复时，给用户适当的反馈

## 性能优化建议

1. **批量处理**：对于多个相似请求，考虑合并为批量请求
2. **请求去重**：在队列中避免重复的请求
3. **优先级队列**：为不同类型的请求设置不同的优先级
4. **请求过期清理**：定期清理过期的请求
5. **动态调整**：根据网络状况动态调整并发限制和重试策略