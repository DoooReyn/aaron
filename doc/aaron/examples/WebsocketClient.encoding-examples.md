# WebSocket 自定义编码使用示例

本文档提供了各种自定义编码方案的实际使用示例。

## 基础使用

### 1. 使用 JSON 编码（默认）

```typescript
import { WebsocketClient } from './WebsocketClient';
import { Parsers } from './WebsocketParsers';

// JSON 是默认编码，无需特殊配置
const wsClient = new WebsocketClient();

await wsClient.connect('ws://server.com');

// 发送消息（自动使用 JSON 编码）
await wsClient.send({
  message: {
    type: 'chat',
    data: { text: 'Hello, World!' }
  }
});
```

### 2. 使用二进制协议

```typescript
import { Parsers } from './WebsocketParsers';

// 使用二进制协议，适合性能敏感场景
await wsClient.connect('ws://game-server.com', {
  parser: Parsers.Binary,
  maxConcurrency: 50
});

// 发送移动指令
await wsClient.send({
  message: {
    type: 'move',
    data: { x: 100.5, y: 200.3 }
  }
});

// 发送聊天消息
await wsClient.send({
  message: {
    type: 'chat',
    data: { text: 'Let\'s play together!' }
  }
});
```

### 3. 使用压缩编码

```typescript
// 适合传输大量数据的场景
await wsClient.connect('ws://data-server.com', {
  parser: Parsers.Compressed,
  heartbeatInterval: 60000 // 大数据传输时减少心跳频率
});

// 发送大量数据
const largeData = {
  type: 'updateWorld',
  data: {
    // 包含大量游戏数据
    players: generatePlayers(1000),
    items: generateItems(5000),
    map: generateMapData()
  }
};

await wsClient.send({ message: largeData });
```

### 4. 使用加密编码

```typescript
// 需要安全传输的场景
const secretKey = 'your-secret-key-2024';

await wsClient.connect('ws://secure-server.com', {
  parser: Parsers.Encrypted(secretKey),
  protocols: ['wss'] // 使用 wss 协议
});

// 发送敏感数据
await wsClient.send({
  message: {
    type: 'login',
    data: {
      username: 'player1',
      password: 'secret123'
    }
  }
});
```

## 高级使用

### 1. 调试编码性能

```typescript
// 包装任何编码器以获取调试信息
const debugParser = Parsers.Debug(Parsers.Binary, 'GameProtocol');

await wsClient.connect('ws://server.com', {
  parser: debugParser
});

// 发送一些消息
await wsClient.send({ message: { type: 'test', data: 'Hello' } });
await wsClient.send({ message: { type: 'test', data: 'World' } });

// 查看编码统计
const stats = debugParser.getStats();
console.log('编码统计:', stats);
/*
输出示例:
{
  encodedCount: 2,
  decodedCount: 0,
  totalEncodedSize: 45,
  totalDecodedSize: 0,
  averageEncodedSize: 22.5,
  errorCount: 0
}
*/

// 获取详细的编码日志
// 每次编码都会打印详细信息
```

### 2. 动态切换编码器

```typescript
class SmartWebSocket {
  private wsClient: WebsocketClient;
  private currentParser: any;

  constructor() {
    this.wsClient = new WebsocketClient();
    this.currentParser = Parsers.JSON;
  }

  async connect(url: string) {
    await this.wsClient.connect(url, {
      parser: this.currentParser
    });

    // 监听网络状态变化
    this.setupNetworkMonitoring();
  }

  private setupNetworkMonitoring() {
    // 模拟网络状态检测
    setInterval(() => {
      const networkSpeed = this.detectNetworkSpeed();
      this.adjustParser(networkSpeed);
    }, 10000);
  }

  private detectNetworkSpeed(): 'fast' | 'medium' | 'slow' {
    // 实际实现中应该检测真实的网络速度
    const random = Math.random();
    if (random < 0.3) return 'fast';
    if (random < 0.7) return 'medium';
    return 'slow';
  }

  private adjustParser(networkSpeed: string) {
    let newParser: any;

    switch (networkSpeed) {
      case 'fast':
        // 快速网络使用压缩减少流量
        newParser = Parsers.Compressed;
        break;
      case 'medium':
        // 中等网络使用二进制协议
        newParser = Parsers.Binary;
        break;
      case 'slow':
        // 慢速网络使用最高效的编码
        newParser = Parsers.Adaptive;
        break;
      default:
        newParser = Parsers.JSON;
    }

    if (newParser !== this.currentParser) {
      console.log(`网络状况: ${networkSpeed}, 切换编码器`);
      this.currentParser = newParser;

      // 注意：实际切换可能需要重新连接
      // 这里只是示例，展示如何动态选择
    }
  }

  async send(message: any) {
    // 使用当前选择的编码器
    return this.wsClient.send({
      message,
      // 可以临时覆盖编码器
      // parser: this.currentParser
    });
  }
}

// 使用智能 WebSocket
const smartWs = new SmartWebSocket();
await smartWs.connect('ws://game-server.com');
```

### 3. 版本兼容处理

```typescript
import { VersionedParser } from './WebsocketParsers';

const versionedParser = new VersionedParser();

await wsClient.connect('ws://server.com', {
  parser: versionedParser
});

// 发送消息（自动添加版本号）
await wsClient.send({
  message: {
    type: 'playerAction',
    data: { action: 'jump', height: 10 }
  }
});

// 服务器可能会返回不同版本的消息
// 客户端会自动处理版本迁移
```

### 4. 自定义编码器

```typescript
// 自定义游戏专用编码器
class GameMessageParser {
  // 游戏消息类型
  static readonly TYPES = {
    PING: 0x01,
    PONG: 0x02,
    LOGIN: 0x10,
    LOGOUT: 0x11,
    CHAT: 0x12,
    MOVE: 0x20,
    ATTACK: 0x21,
    SKILL: 0x22,
    UPDATE_HP: 0x30,
    UPDATE_POS: 0x31,
  } as const;

  static stringify = (message: WSMessage): string => {
    const typeCode = this.getTypeCode(message.type);
    const timestamp = message.timestamp || Date.now();

    // 根据消息类型处理数据
    let encodedData: ArrayBuffer;
    switch (message.type) {
      case 'move':
        encodedData = this.encodeMove(message.data);
        break;
      case 'chat':
        encodedData = this.encodeChat(message.data);
        break;
      case 'login':
        encodedData = this.encodeLogin(message.data);
        break;
      default:
        // 通用 JSON 编码
        const json = JSON.stringify(message.data);
        encodedData = new TextEncoder().encode(json).buffer;
    }

    // 组装最终消息
    const totalLength = 1 + 8 + 4 + encodedData.byteLength;
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);

    let offset = 0;
    view.setUint8(offset++, typeCode);
    view.setBigUint64(offset, BigInt(timestamp), false);
    offset += 8;
    view.setUint32(offset, encodedData.byteLength, false);
    offset += 4;

    if (encodedData.byteLength > 0) {
      const dataView = new Uint8Array(buffer, offset);
      const sourceView = new Uint8Array(encodedData);
      dataView.set(sourceView);
    }

    // 转换为 base64
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  };

  static parse = (data: string): WSMessage => {
    // 从 base64 解码
    const binaryString = atob(data);
    const buffer = new ArrayBuffer(binaryString.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      view[i] = binaryString.charCodeAt(i);
    }

    const dataView = new DataView(buffer);
    let offset = 0;

    // 解析头部
    const typeCode = dataView.getUint8(offset++);
    const timestamp = Number(dataView.getBigUint64(offset, false));
    offset += 8;
    const dataLength = dataView.getUint32(offset, false);
    offset += 8;

    // 解析数据
    const type = this.getTypeName(typeCode);
    let messageData: any;

    if (dataLength > 0) {
      const dataBuffer = buffer.slice(offset, offset + dataLength);

      switch (type) {
        case 'move':
          messageData = this.decodeMove(dataBuffer);
          break;
        case 'chat':
          messageData = this.decodeChat(dataBuffer);
          break;
        case 'login':
          messageData = this.decodeLogin(dataBuffer);
          break;
        default:
          // 通用 JSON 解码
          const text = new TextDecoder().decode(dataBuffer);
          try {
            messageData = JSON.parse(text);
          } catch (e) {
            messageData = text;
          }
      }
    }

    return {
      type,
      data: messageData,
      timestamp
    };
  };

  private static getTypeCode(typeName: string): number {
    const codeMap: { [key: string]: number } = {
      'ping': this.TYPES.PING,
      'pong': this.TYPES.PONG,
      'login': this.TYPES.LOGIN,
      'logout': this.TYPES.LOGOUT,
      'chat': this.TYPES.CHAT,
      'move': this.TYPES.MOVE,
      'attack': this.TYPES.ATTACK,
      'skill': this.TYPES.SKILL,
    };
    return codeMap[typeName] || 0xFF;
  }

  private static getTypeName(code: number): string {
    const nameMap: { [key: number]: string } = {
      [this.TYPES.PING]: 'ping',
      [this.TYPES.PONG]: 'pong',
      [this.TYPES.LOGIN]: 'login',
      [this.TYPES.LOGOUT]: 'logout',
      [this.TYPES.CHAT]: 'chat',
      [this.TYPES.MOVE]: 'move',
      [this.TYPES.ATTACK]: 'attack',
      [this.TYPES.SKILL]: 'skill',
    };
    return nameMap[code] || 'unknown';
  }

  // 特定消息类型的编码/解码
  private static encodeMove(data: any): ArrayBuffer {
    const buffer = new ArrayBuffer(12); // x(4) + y(4) + z(4)
    const view = new DataView(buffer);
    view.setFloat32(0, data.x || 0, false);
    view.setFloat32(4, data.y || 0, false);
    view.setFloat32(8, data.z || 0, false);
    return buffer;
  }

  private static decodeMove(buffer: ArrayBuffer): any {
    const view = new DataView(buffer);
    return {
      x: view.getFloat32(0, false),
      y: view.getFloat32(4, false),
      z: view.getFloat32(8, false)
    };
  }

  private static encodeChat(data: any): ArrayBuffer {
    const text = data.text || '';
    const textBytes = new TextEncoder().encode(text);
    const buffer = new ArrayBuffer(2 + textBytes.length);
    const view = new DataView(buffer);
    view.setUint16(0, textBytes.length, false);
    const textView = new Uint8Array(buffer, 2);
    textView.set(textBytes);
    return buffer;
  }

  private static decodeChat(buffer: ArrayBuffer): any {
    const view = new DataView(buffer);
    const length = view.getUint16(0, false);
    const textView = new Uint8Array(buffer, 2, length);
    const text = new TextDecoder().decode(textView);
    return { text };
  }

  private static encodeLogin(data: any): ArrayBuffer {
    const username = data.username || '';
    const token = data.token || '';

    const usernameBytes = new TextEncoder().encode(username);
    const tokenBytes = new TextEncoder().encode(token);

    const buffer = new ArrayBuffer(2 + usernameBytes.length + 2 + tokenBytes.length);
    const view = new DataView(buffer);
    let offset = 0;

    view.setUint16(offset, usernameBytes.length, false);
    offset += 2;
    const usernameView = new Uint8Array(buffer, offset, usernameBytes.length);
    usernameView.set(usernameBytes);
    offset += usernameBytes.length;

    view.setUint16(offset, tokenBytes.length, false);
    offset += 2;
    const tokenView = new Uint8Array(buffer, offset, tokenBytes.length);
    tokenView.set(tokenBytes);

    return buffer;
  }

  private static decodeLogin(buffer: ArrayBuffer): any {
    const view = new DataView(buffer);
    let offset = 0;

    const usernameLength = view.getUint16(offset, false);
    offset += 2;
    const usernameView = new Uint8Array(buffer, offset, usernameLength);
    const username = new TextDecoder().decode(usernameView);
    offset += usernameLength;

    const tokenLength = view.getUint16(offset, false);
    offset += 2;
    const tokenView = new Uint8Array(buffer, offset, tokenLength);
    const token = new TextDecoder().decode(tokenView);

    return { username, token };
  }
}

// 使用游戏专用编码器
await wsClient.connect('ws://game-server.com', {
  parser: GameMessageParser
});

// 发送移动消息（使用高效的二进制编码）
await wsClient.send({
  message: {
    type: 'move',
    data: { x: 100.5, y: 200.3, z: 50.0 }
  }
});
```

## 性能对比示例

```typescript
// 测试不同编码器的性能
async function benchmarkParsers() {
  const testMessage = {
    type: 'update',
    data: {
      players: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Player${i}`,
        position: { x: Math.random() * 1000, y: Math.random() * 1000 },
        health: 100,
        score: Math.floor(Math.random() * 10000)
      })),
      timestamp: Date.now()
    }
  };

  const parsers = [
    { name: 'JSON', parser: Parsers.JSON },
    { name: 'Binary', parser: Parsers.Binary },
    { name: 'Compressed', parser: Parsers.Compressed },
  ];

  for (const { name, parser } of parsers) {
    const iterations = 1000;
    const startTime = performance.now();
    let totalSize = 0;

    for (let i = 0; i < iterations; i++) {
      const encoded = parser.stringify(testMessage);
      totalSize += encoded.length;

      // 测试解码
      const decoded = parser.parse(encoded);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`\n${name} 编码器测试结果:`);
    console.log(`- 总耗时: ${duration.toFixed(2)}ms`);
    console.log(`- 平均耗时: ${(duration / iterations).toFixed(3)}ms`);
    console.log(`- 平均大小: ${(totalSize / iterations).toFixed(0)} bytes`);
    console.log(`- 原始大小: ${JSON.stringify(testMessage).length} bytes`);
    console.log(`- 压缩比: ${(totalSize / iterations / JSON.stringify(testMessage).length * 100).toFixed(1)}%`);
  }
}

// 运行基准测试
await benchmarkParsers();

/*
可能的输出示例:

JSON 编码器测试结果:
- 总耗时: 45.23ms
- 平均耗时: 0.045ms
- 平均大小: 12450 bytes
- 原始大小: 12450 bytes
- 压缩比: 100.0%

Binary 编码器测试结果:
- 总耗时: 78.91ms
- 平均耗时: 0.079ms
- 平均大小: 9876 bytes
- 原始大小: 12450 bytes
- 压缩比: 79.3%

Compressed 编码器测试结果:
- 总耗时: 234.56ms
- 平均耗时: 0.235ms
- 平均大小: 3456 bytes
- 原始大小: 12450 bytes
- 压缩比: 27.8%
*/
```

## 错误处理示例

```typescript
// 包装编码器以添加错误处理
function createRobustParser(parser: any) {
  return {
    stringify: (message: WSMessage): string => {
      try {
        const result = parser.stringify(message);
        return result;
      } catch (error) {
        console.error('编码失败，回退到 JSON:', error);
        return JSON.stringify(message);
      }
    },

    parse: (data: string): WSMessage => {
      try {
        const result = parser.parse(data);
        return result;
      } catch (error) {
        console.error('解码失败，尝试 JSON:', error);
        try {
          return JSON.parse(data);
        } catch (jsonError) {
          throw new Error(`所有解码方案都失败: ${error.message}`);
        }
      }
    }
  };
}

// 使用健壮的编码器
const robustParser = createRobustParser(Parsers.Binary);

await wsClient.connect('ws://server.com', {
  parser: robustParser
});
```

## 最佳实践总结

1. **根据场景选择编码器**
   - 简单数据：JSON
   - 性能敏感：Binary 或 MessagePack
   - 大量数据：Compressed
   - 安全要求：Encrypted

2. **错误处理**
   - 总是提供回退方案
   - 记录编码/解码错误
   - 验证解码后的数据

3. **性能优化**
   - 使用基准测试选择最优方案
   - 监控编码性能指标
   - 根据网络状况动态调整

4. **版本管理**
   - 在消息中包含版本信息
   - 保持向后兼容性
   - 提供平滑升级路径

5. **安全性**
   - 敏感数据使用加密
   - 验证消息完整性
   - 使用安全的密钥管理