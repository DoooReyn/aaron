import { WebSocketServerImpl } from './server';

// 创建服务器实例
export const server = new WebSocketServerImpl({ port: 8080 });

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n收到 SIGTERM 信号，正在关闭服务器...');
  server.close();
  process.exit(0);
});
