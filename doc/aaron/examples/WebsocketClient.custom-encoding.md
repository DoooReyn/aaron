# WebSocket 自定义消息编码和解码

本文档介绍如何在 WebSocket 客户端中实现自定义的消息编码和解码方案。

## 内置编码方案

### 1. JSON 编码（默认）

```typescript
// 默认使用 JSON 编码
await wsClient.connect('ws://server.com');

// 消息格式
interface WSMessage {
  id?: string;
  type: string;
  data: any;
  timestamp?: number;
}

// 发送的消息
{
  "id": "msg_123",
  "type": "getUserInfo",
  "data": { userId: 1001 },
  "timestamp": 1703123456789
}
```

### 2. MessagePack 编码

MessagePack 是一种高效的二进制序列化格式，比 JSON 更紧凑、更快。

```typescript
// 首先安装 msgpack 库
// npm install msgpack-lite

import * as msgpack from 'msgpack-lite';

const msgpackParser = {
  stringify: (message: WSMessage): string => {
    // MessagePack 编码为二进制，需要转换为 base64 或 ArrayBuffer
    const packed = msgpack.encode(message);
    // 返回 base64 字符串（WebSocket 支持字符串）
    return btoa(String.fromCharCode(...packed));
  },

  parse: (data: string): WSMessage => {
    // 从 base64 解码
    const binaryString = atob(data);
    const packed = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      packed[i] = binaryString.charCodeAt(i);
    }
    // MessagePack 解码
    return msgpack.decode(packed) as WSMessage;
  }
};

// 使用 MessagePack 编码
await wsClient.connect('ws://server.com', {
  parser: msgpackParser
});
```

### 3. Protocol Buffers 编码

Protocol Buffers (Protobuf) 是 Google 开发的高效序列化协议。

```typescript
// 首先定义 .proto 文件
// message.proto
/*
syntax = "proto3";

message WSMessage {
  optional string id = 1;
  string type = 2;
  bytes data = 3;
  optional int64 timestamp = 4;
}
*/

// 安装依赖
// npm install protobufjs @types/protobufjs

import * as protobuf from 'protobufjs';

const protobufParser = async () => {
  const root = await protobuf.load('message.proto');
  const WSMessage = root.lookupType('WSMessage');

  return {
    stringify: (message: WSMessage): string => {
      // 编码为 Uint8Array
      const buffer = WSMessage.encode(message).finish();
      // 转换为 base64 字符串
      return btoa(String.fromCharCode(...buffer));
    },

    parse: (data: string): WSMessage => {
      // 从 base64 解码
      const binaryString = atob(data);
      const buffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        buffer[i] = binaryString.charCodeAt(i);
      }
      // 解码
      return WSMessage.decode(buffer) as WSMessage;
    }
  };
};

// 使用 Protocol Buffers
const parser = await protobufParser();
await wsClient.connect('ws://server.com', {
  parser
});
```

## 自定义二进制协议

### 1. 简单二进制协议

```typescript
interface BinaryHeader {
  id: number;        // 4 bytes
  type: number;      // 2 bytes
  length: number;    // 4 bytes
  timestamp: number; // 8 bytes
}

const binaryParser = {
  stringify: (message: WSMessage): string => {
    // 创建缓冲区
    const id = message.id ? parseInt(message.id.split('_')[1]) || 0 : 0;
    const type = message.type.charCodeAt(0); // 简化：只取第一个字符的 ASCII
    const data = JSON.stringify(message.data);
    const timestamp = message.timestamp || Date.now();

    // 计算总长度
    const headerSize = 18; // 4 + 2 + 4 + 8
    const dataBuffer = new TextEncoder().encode(data);
    const totalLength = headerSize + dataBuffer.length;

    // 创建总缓冲区
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);
    let offset = 0;

    // 写入头部
    view.setUint32(offset, id, false); offset += 4;      // ID
    view.setUint16(offset, type, false); offset += 2;    // Type
    view.setUint32(offset, dataBuffer.length, false); offset += 4; // Data Length
    view.setBigInt64(offset, BigInt(timestamp), false); offset += 8; // Timestamp

    // 写入数据
    const dataView = new Uint8Array(buffer, offset);
    dataView.set(dataBuffer);

    // 转换为 base64
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  },

  parse: (data: string): WSMessage => {
    // 从 base64 解码
    const binaryString = atob(data);
    const buffer = new ArrayBuffer(binaryString.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      view[i] = binaryString.charCodeAt(i);
    }

    // 读取头部
    const dataView = new DataView(buffer);
    let offset = 0;

    const id = dataView.getUint32(offset, false); offset += 4;
    const typeCode = dataView.getUint16(offset, false); offset += 2;
    const dataLength = dataView.getUint32(offset, false); offset += 4;
    const timestamp = Number(dataView.getBigInt64(offset, false)); offset += 8;

    // 读取数据
    const dataBytes = new Uint8Array(buffer, offset, dataLength);
    const dataString = new TextDecoder().decode(dataBytes);
    const data = JSON.parse(dataString);

    return {
      id: `msg_${id}`,
      type: String.fromCharCode(typeCode),
      data,
      timestamp
    };
  }
};

// 使用自定义二进制协议
await wsClient.connect('ws://server.com', {
  parser: binaryParser
});
```

### 2. 压缩协议

结合压缩算法来减少传输数据量。

```typescript
import * as pako from 'pako'; // zlib 的 JavaScript 实现

const compressedParser = {
  stringify: (message: WSMessage): string => {
    // 先序列化为 JSON
    const json = JSON.stringify(message);

    // 压缩
    const compressed = pako.deflate(json);

    // 转换为 base64
    return btoa(String.fromCharCode(...compressed));
  },

  parse: (data: string): WSMessage => {
    // 从 base64 解码
    const binaryString = atob(data);
    const compressed = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      compressed[i] = binaryString.charCodeAt(i);
    }

    // 解压缩
    const decompressed = pako.inflate(compressed);

    // 解析 JSON
    const json = new TextDecoder().decode(decompressed);
    return JSON.parse(json) as WSMessage;
  }
};

// 使用压缩协议
await wsClient.connect('ws://server.com', {
  parser: compressedParser
});
```

## 加密协议

### 1. AES 加密

```typescript
import * as CryptoJS from 'crypto-js';

class EncryptedParser {
  private key: string;

  constructor(secretKey: string) {
    this.key = secretKey;
  }

  stringify = (message: WSMessage): string => {
    // 序列化为 JSON
    const json = JSON.stringify(message);

    // AES 加密
    const encrypted = CryptoJS.AES.encrypt(json, this.key).toString();

    return encrypted;
  }

  parse = (data: string): WSMessage => {
    try {
      // AES 解密
      const decrypted = CryptoJS.AES.decrypt(data, this.key);
      const json = decrypted.toString(CryptoJS.enc.Utf8);

      // 解析 JSON
      return JSON.parse(json) as WSMessage;
    } catch (error) {
      throw new Error('解密失败：' + error.message);
    }
  }
}

// 使用加密协议
const encryptedParser = new EncryptedParser('your-secret-key-here');
await wsClient.connect('ws://server.com', {
  parser: encryptedParser
});
```

### 2. 签名验证

```typescript
interface SignedMessage extends WSMessage {
  signature: string;
}

class SignedParser {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  stringify = (message: WSMessage): string => {
    // 生成签名
    const messageJson = JSON.stringify(message);
    const signature = CryptoJS.HmacSHA256(messageJson, this.secretKey).toString();

    // 添加签名
    const signedMessage: SignedMessage = {
      ...message,
      signature
    };

    return JSON.stringify(signedMessage);
  }

  parse = (data: string): WSMessage => {
    const signedMessage: SignedMessage = JSON.parse(data);

    // 验证签名
    const { signature, ...message } = signedMessage;
    const messageJson = JSON.stringify(message);
    const expectedSignature = CryptoJS.HmacSHA256(messageJson, this.secretKey).toString();

    if (signature !== expectedSignature) {
      throw new Error('签名验证失败');
    }

    return message;
  }
}

// 使用签名验证
const signedParser = new SignedParser('your-signing-secret');
await wsClient.connect('ws://server.com', {
  parser: signedParser
});
```

## 高级编码方案

### 1. 自定义类型系统

```typescript
// 定义消息类型枚举
enum MessageType {
  // 系统消息
  PING = 0x01,
  PONG = 0x02,
  HEARTBEAT = 0x03,

  // 用户消息
  LOGIN = 0x10,
  LOGOUT = 0x11,
  CHAT = 0x12,
  MOVE = 0x13,

  // 游戏消息
  GAME_START = 0x20,
  GAME_END = 0x21,
  PLAYER_ACTION = 0x22,
}

// 消息接口
interface GameMessage {
  type: MessageType;
  data: any;
  timestamp?: number;
}

// 高效二进制编码器
class GameMessageEncoder {
  // 类型到编码器的映射
  private encoders = new Map<MessageType, (data: any) => ArrayBuffer>();
  private decoders = new Map<MessageType, (buffer: ArrayBuffer) => any>();

  constructor() {
    this.registerEncoders();
  }

  private registerEncoders() {
    // PING 消息
    this.encoders.set(MessageType.PING, () => new ArrayBuffer(0));
    this.decoders.set(MessageType.PING, () => null);

    // CHAT 消息
    this.encoders.set(MessageType.CHAT, (data) => {
      const text = data.text || '';
      const textBytes = new TextEncoder().encode(text);
      const buffer = new ArrayBuffer(2 + textBytes.length); // 2 bytes length + text
      const view = new DataView(buffer);
      view.setUint16(0, textBytes.length, false);
      const textView = new Uint8Array(buffer, 2);
      textView.set(textBytes);
      return buffer;
    });

    this.decoders.set(MessageType.CHAT, (buffer) => {
      const view = new DataView(buffer);
      const length = view.getUint16(0, false);
      const textView = new Uint8Array(buffer, 2, length);
      const text = new TextDecoder().decode(textView);
      return { text };
    });

    // MOVE 消息
    this.encoders.set(MessageType.MOVE, (data) => {
      const buffer = new ArrayBuffer(8); // x:4, y:4
      const view = new DataView(buffer);
      view.setFloat32(0, data.x || 0, false);
      view.setFloat32(4, data.y || 0, false);
      return buffer;
    });

    this.decoders.set(MessageType.MOVE, (buffer) => {
      const view = new DataView(buffer);
      const x = view.getFloat32(0, false);
      const y = view.getFloat32(4, false);
      return { x, y };
    });
  }

  encode(message: GameMessage): ArrayBuffer {
    const encoder = this.encoders.get(message.type);
    if (!encoder) {
      throw new Error(`未知的消息类型: ${message.type}`);
    }

    const dataBuffer = encoder(message.data);

    // 创建最终消息格式
    const totalLength = 1 + 8 + dataBuffer.byteLength; // type:1, timestamp:8, data
    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);

    let offset = 0;

    // 写入消息类型
    view.setUint8(offset++, message.type);

    // 写入时间戳
    view.setBigUint64(offset, BigInt(message.timestamp || Date.now()), false);
    offset += 8;

    // 写入数据
    if (dataBuffer.byteLength > 0) {
      const dataView = new Uint8Array(buffer, offset);
      const sourceView = new Uint8Array(dataBuffer);
      dataView.set(sourceView);
    }

    return buffer;
  }

  decode(buffer: ArrayBuffer): GameMessage {
    const view = new DataView(buffer);
    let offset = 0;

    // 读取消息类型
    const type = view.getUint8(offset++) as MessageType;

    // 读取时间戳
    const timestamp = Number(view.getBigUint64(offset, false));
    offset += 8;

    // 读取数据
    const dataBuffer = buffer.slice(offset);
    const decoder = this.decoders.get(type);
    const data = decoder ? decoder(dataBuffer) : null;

    return {
      type,
      data,
      timestamp
    };
  }
}

// 使用游戏消息编码器
const gameEncoder = new GameMessageEncoder();

const gameParser = {
  stringify: (message: WSMessage): string => {
    // 将 WSMessage 转换为 GameMessage
    const gameMessage: GameMessage = {
      type: this.getMessageType(message.type),
      data: message.data,
      timestamp: message.timestamp
    };

    // 编码为二进制
    const binary = gameEncoder.encode(gameMessage);

    // 转换为 base64
    const bytes = new Uint8Array(binary);
    return btoa(String.fromCharCode(...bytes));
  },

  parse: (data: string): WSMessage => {
    // 从 base64 解码
    const binaryString = atob(data);
    const buffer = new ArrayBuffer(binaryString.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      view[i] = binaryString.charCodeAt(i);
    }

    // 解码
    const gameMessage = gameEncoder.decode(buffer);

    // 转换为 WSMessage
    return {
      type: this.getMessageName(gameMessage.type),
      data: gameMessage.data,
      timestamp: gameMessage.timestamp
    };
  },

  private getMessageType(typeName: string): MessageType {
    const typeMap: { [key: string]: MessageType } = {
      'ping': MessageType.PING,
      'chat': MessageType.CHAT,
      'move': MessageType.MOVE,
      // 添加更多映射...
    };
    return typeMap[typeName] || MessageType.PING;
  },

  private getMessageName(type: MessageType): string {
    const nameMap: { [key in MessageType]: string } = {
      [MessageType.PING]: 'ping',
      [MessageType.CHAT]: 'chat',
      [MessageType.MOVE]: 'move',
      // 添加更多映射...
    };
    return nameMap[type] || 'unknown';
  }
};

// 使用游戏消息协议
await wsClient.connect('ws://game-server.com', {
  parser: gameParser
});
```

### 2. 版本兼容协议

```typescript
interface VersionedMessage extends WSMessage {
  version: number;
  compatibility?: number;
}

class VersionedParser {
  private currentVersion: number = 2;
  private compatibilityLevel: number = 1;

  stringify = (message: WSMessage): string => {
    const versionedMessage: VersionedMessage = {
      ...message,
      version: this.currentVersion,
      compatibility: this.compatibilityLevel
    };

    return JSON.stringify(versionedMessage);
  };

  parse = (data: string): WSMessage {
    const versionedMessage: VersionedMessage = JSON.parse(data);

    // 检查版本兼容性
    if (versionedMessage.version &&
        versionedMessage.version > this.currentVersion) {
      console.warn('收到更新版本的消息，可能不兼容');
    }

    // 处理不同版本的消息格式
    return this.migrateMessage(versionedMessage);
  };

  private migrateMessage(message: VersionedMessage): WSMessage {
    switch (message.version) {
      case 1:
        // 从版本 1 迁移到当前版本
        return this.migrateFromV1(message);

      case 2:
        // 版本 2 兼容当前版本
        return message;

      default:
        // 默认处理
        return message;
    }
  }

  private migrateFromV1(message: VersionedMessage): WSMessage {
    // 版本 1 的 data 是字符串，需要解析
    if (typeof message.data === 'string') {
      try {
        message.data = JSON.parse(message.data);
      } catch (e) {
        // 解析失败，保持原样
      }
    }
    return message;
  }
}

// 使用版本兼容协议
const versionedParser = new VersionedParser();
await wsClient.connect('ws://server.com', {
  parser: versionedParser
});
```

## 使用示例

### 1. 动态切换编码器

```typescript
class DynamicParser {
  private currentParser: any;
  private parsers: Map<string, any> = new Map();

  constructor() {
    // 注册不同的解析器
    this.parsers.set('json', {
      stringify: JSON.stringify,
      parse: JSON.parse
    });

    this.parsers.set('msgpack', msgpackParser);
    this.parsers.set('binary', binaryParser);
    this.parsers.set('encrypted', new EncryptedParser('secret'));

    // 默认使用 JSON
    this.currentParser = this.parsers.get('json');
  }

  setParser(type: string, options?: any) {
    const parser = this.parsers.get(type);
    if (parser) {
      this.currentParser = parser;
      console.log(`切换到 ${type} 编码器`);
    } else {
      throw new Error(`未知的编码器类型: ${type}`);
    }
  }

  get stringify() {
    return this.currentParser.stringify;
  }

  get parse() {
    return this.currentParser.parse;
  }
}

// 使用动态解析器
const dynamicParser = new DynamicParser();

// 初始连接使用 JSON
await wsClient.connect('ws://server.com', {
  parser: dynamicParser
});

// 根据网络条件切换编码
if (networkCondition === 'poor') {
  dynamicParser.setParser('compressed');
} else if (securityLevel === 'high') {
  dynamicParser.setParser('encrypted');
}
```

### 2. 自适应编码

```typescript
class AdaptiveParser {
  private metrics = {
    messageSize: 0,
    encodingTime: 0,
    decodingTime: 0
  };

  private parsers = {
    json: { parser: jsonParser, efficiency: 1 },
    compressed: { parser: compressedParser, efficiency: 0.6 },
    binary: { parser: binaryParser, efficiency: 0.8 },
    msgpack: { parser: msgpackParser, efficiency: 0.7 }
  };

  private currentType = 'json';

  async selectBestParser(message: WSMessage): Promise<any> {
    const messageSize = JSON.stringify(message).length;

    // 根据消息大小选择最合适的编码器
    if (messageSize < 100) {
      this.currentType = 'json'; // 小消息用 JSON
    } else if (messageSize < 1000) {
      this.currentType = 'msgpack'; // 中等消息用 MessagePack
    } else {
      this.currentType = 'compressed'; // 大消息用压缩
    }

    return this.parsers[this.currentType as keyof typeof this.parsers].parser;
  }

  stringify = async (message: WSMessage): Promise<string> => {
    const startTime = performance.now();
    const parser = await this.selectBestParser(message);
    const result = parser.stringify(message);
    const endTime = performance.now();

    this.metrics.encodingTime = endTime - startTime;
    this.metrics.messageSize = result.length;

    return result;
  };

  parse = (data: string): WSMessage => {
    const startTime = performance.now();
    const parser = this.parsers[this.currentType as keyof typeof this.parsers].parser;
    const result = parser.parse(data);
    const endTime = performance.now();

    this.metrics.decodingTime = endTime - startTime;

    return result;
  };

  getMetrics() {
    return {
      ...this.metrics,
      currentParser: this.currentType
    };
  }
}

// 使用自适应编码
const adaptiveParser = new AdaptiveParser();
await wsClient.connect('ws://server.com', {
  parser: adaptiveParser
});
```

## 最佳实践

1. **根据场景选择编码方案**
   - 简单场景：使用 JSON
   - 性能敏感：使用 MessagePack 或自定义二进制
   - 安全需求：使用加密协议

2. **处理编码错误**
   ```typescript
   try {
     await wsClient.send({ message });
   } catch (error) {
     if (error.message.includes('编码')) {
       // 编码错误，可能需要切换编码器
       console.error('编码失败:', error);
     }
   }
   ```

3. **版本管理**
   - 在消息中包含版本信息
   - 保持向后兼容性
   - 提供平滑的升级路径

4. **性能监控**
   ```typescript
   // 监控编码性能
   const parser = {
     stringify: (message: WSMessage): string => {
       const start = performance.now();
       const result = originalStringify(message);
       const end = performance.now();

       // 记录编码时间
       metrics.record('encoding_time', end - start);

       return result;
     }
   };
   ```

5. **测试覆盖**
   - 测试各种消息类型的编码/解码
   - 测试边界条件（空消息、超大消息等）
   - 测试错误恢复机制

通过选择合适的编码方案，可以显著提升 WebSocket 应用的性能和安全性。