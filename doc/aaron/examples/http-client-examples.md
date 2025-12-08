# HTTP 请求服务使用示例

本文档提供了 HttpClient 服务的各种使用场景示例，帮助开发者快速上手。

## 基础准备

### 1. 获取 HttpClient 实例

```typescript
import { aaron } from '../core/Aaron';

const httpClient = aaron.http;

httpClient.defaults.url = 'https://jsonplaceholder.typicode.com';
```

### 2. 基础类型定义

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}
```

## 基础请求示例

### 1. GET 请求 - 获取用户信息

```typescript
async function getUserInfo(userId: number): Promise<User | null> {
  try {
    const response = await httpClient.get<User>(`/api/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
}

// 使用示例
const user = await getUserInfo(123);
if (user) {
  console.log(`用户名: ${user.name}, 邮箱: ${user.email}`);
}
```

### 2. POST 请求 - 用户登录

```typescript
async function login(username: string, password: string): Promise<LoginResponse | null> {
  const loginData: LoginRequest = { username, password };

  try {
    const response = await httpClient.post<ApiResponse<LoginResponse>>('/api/auth/login', loginData);

    // 检查业务状态码
    if (response.data.code === 0) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('登录失败:', error);
    return null;
  }
}

// 使用示例
const loginResult = await login('admin', 'password123');
if (loginResult) {
  localStorage.setItem('token', loginResult.token);
  console.log('登录成功:', loginResult.user.name);
}
```

### 3. 带查询参数的请求

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

async function searchProducts(
  keyword: string,
  category?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<Product[]> {
  try {
    const response = await httpClient.get<Product[]>('/api/products', {
      params: {
        q: keyword,
        category,
        page,
        pageSize,
      },
    });
    return response.data;
  } catch (error) {
    console.error('搜索商品失败:', error);
    return [];
  }
}

// 使用示例
const products = await searchProducts('手机', 'electronics', 1, 10);
```

### 4. PUT 请求 - 更新用户信息

```typescript
async function updateUserInfo(userId: number, updates: Partial<User>): Promise<boolean> {
  try {
    const response = await httpClient.put(`/api/users/${userId}`, updates);
    return response.status === 200;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return false;
  }
}

// 使用示例
const success = await updateUserInfo(123, {
  name: '新名字',
  email: 'newemail@example.com',
});
```

### 5. DELETE 请求 - 删除资源

```typescript
async function deletePost(postId: number): Promise<boolean> {
  try {
    const response = await httpClient.delete(`/api/posts/${postId}`);
    return response.status === 204;
  } catch (error) {
    console.error('删除文章失败:', error);
    return false;
  }
}

// 使用示例
const deleted = await deletePost(456);
if (deleted) {
  console.log('文章已删除');
}
```

## 高级功能示例

### 1. 拦截器使用

#### 请求拦截器 - 添加认证头

```typescript
// 添加认证拦截器
const authInterceptorId = httpClient.interceptors.request(async (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  // 添加时间戳防止缓存
  config.params = {
    ...config.params,
    _t: Date.now(),
  };

  return config;
});

// 移除拦截器
// httpClient.interceptors.ejectRequest(authInterceptorId);
```

#### 响应拦截器 - 统一处理响应格式

```typescript
const responseInterceptorId = httpClient.interceptors.response(async (response) => {
  // 假设 API 统一返回格式为 { code, message, data }
  if (typeof response.data === 'object' && 'code' in response.data) {
    const apiResponse = response.data as ApiResponse<any>;

    if (apiResponse.code !== 0) {
      // 业务错误
      throw new Error(apiResponse.message);
    }

    // 提取实际数据
    response.data = apiResponse.data;
  }

  return response;
});
```

#### 错误拦截器 - 统一错误处理

```typescript
const errorInterceptorId = httpClient.interceptors.responseError(async (error) => {
  // 处理 401 认证失败
  if (error.status === 401) {
    localStorage.removeItem('token');
    // 跳转到登录页
    cc.director.loadScene('login');
    return error;
  }

  // 处理 403 权限不足
  if (error.status === 403) {
    showToast('权限不足');
    return error;
  }

  // 处理网络错误
  if (error.code === HttpErrorCode.NETWORK_ERROR) {
    showToast('网络连接失败，请检查网络');
    return error;
  }

  // 处理超时
  if (error.code === HttpErrorCode.TIMEOUT) {
    showToast('请求超时，请稍后重试');
    return error;
  }

  // 其他错误
  showToast(error.message || '请求失败');
  return error;
});

function showToast(message: string) {
  // 实现显示提示的逻辑
  console.log(message);
}
```

### 2. 文件上传

```typescript
async function uploadAvatar(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('avatar', file);

  try {
    const response = await httpClient.post<{ url: string }>('/api/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progress) => {
        console.log(`上传进度: ${Math.round(progress * 100)}%`);
        // 更新 UI 进度条
        updateProgressBar(progress);
      },
      timeout: 60000, // 60秒超时
    });

    return response.data.url;
  } catch (error) {
    console.error('上传头像失败:', error);
    return null;
  }
}

function updateProgressBar(progress: number) {
  // 更新进度条 UI
  const progressBar = document.getElementById('upload-progress') as HTMLProgressElement;
  if (progressBar) {
    progressBar.value = progress;
  }
}

// 使用示例
const fileInput = document.getElementById('avatar-input') as HTMLInputElement;
if (fileInput.files && fileInput.files[0]) {
  const avatarUrl = await uploadAvatar(fileInput.files[0]);
  if (avatarUrl) {
    console.log('头像上传成功:', avatarUrl);
  }
}
```

### 3. 文件下载

```typescript
async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await httpClient.get<Blob>(url, {
      responseType: 'blob',
      onDownloadProgress: (progress) => {
        console.log(`下载进度: ${Math.round(progress * 100)}%`);
      },
    });

    // 创建下载链接
    const blob = response.data;
    const downloadUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 清理 URL
    URL.revokeObjectURL(downloadUrl);

    console.log('文件下载完成');
  } catch (error) {
    console.error('下载文件失败:', error);
  }
}

// 使用示例
await downloadFile('https://example.com/report.pdf', '月度报表.pdf');
```

### 4. 请求取消

```typescript
// 创建可取消的请求
async function fetchUserData(cancelToken?: CancelToken): Promise<User | null> {
  try {
    const response = await httpClient.get<User>('/api/user/profile', {
      cancelToken,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    if (error instanceof HttpError && error.code === HttpErrorCode.CANCELLED) {
      console.log('请求已取消');
    } else {
      console.error('获取用户数据失败:', error);
    }
    return null;
  }
}

// 使用示例1：手动取消
const token1 = httpClient.createCancelToken();
const promise1 = fetchUserData(token1);

// 5秒后取消
setTimeout(() => {
  token1.cancel('用户主动取消');
}, 5000);

// 使用示例2：批量取消
async function loadDashboardData() {
  const requests = [
    httpClient.get('/api/user/profile', { tag: 'dashboard' }),
    httpClient.get('/api/user/stats', { tag: 'dashboard' }),
    httpClient.get('/api/user/recent', { tag: 'dashboard' }),
  ];

  try {
    const results = await Promise.all(requests);
    return results;
  } catch (error) {
    console.error('加载数据失败:', error);
    return null;
  }
}

// 取消所有 dashboard 相关请求
httpClient.cancelByTag('dashboard', '页面切换');

// 取消所有请求
httpClient.cancelAll('应用退出');
```

### 5. 并发控制

```typescript
// 调整并发配置
httpClient.concurrency.maxConcurrent = 3; // 最大3个并发
httpClient.concurrency.queueLimit = 50; // 队列限制50个

// 监控请求状态
function printRequestStatus() {
  console.log(`活跃请求: ${httpClient.activeRequestCount}`);
  console.log(`队列中请求: ${httpClient.queuedRequestCount}`);
}

// 定时打印状态
setInterval(printRequestStatus, 1000);
```

### 6. 重试配置

```typescript
// 单次请求配置
await httpClient.get('/api/unstable-endpoint', {
  retryCount: 5, // 重试5次
  retryDelay: 2000, // 重试间隔2秒
  timeout: 15000, // 15秒超时
});

// 修改全局默认配置
httpClient.defaults = {
  ...httpClient.defaults,
  retryCount: 5,
  retryDelay: 2000,
  timeout: 15000,
};
```

## Cocos Creator 集成示例

### 1. 游戏数据管理器

```typescript
const { ccclass, property } = cc._decorator;

@ccclass
export class GameManager extends cc.Component {
  private httpClient: HttpClient;
  private userData: User | null = null;

  onLoad() {
    this.httpClient = ServiceContainer.Shared.get<HttpClient>(SERVICES.HTTP_CLIENT);
    this.setupInterceptors();
    this.loadUserData();
  }

  private setupInterceptors() {
    // 自动添加版本号到请求
    this.httpClient.interceptors.request(async (config) => {
      config.headers = {
        ...config.headers,
        'X-Game-Version': '1.0.0',
      };
      return config;
    });
  }

  async loadUserData() {
    try {
      const response = await this.httpClient.get<ApiResponse<User>>('/api/game/user');
      this.userData = response.data.data;
      this.updateUI();
    } catch (error) {
      console.error('加载用户数据失败:', error);
      // 显示错误提示
      this.showErrorMessage('加载用户数据失败，请检查网络');
    }
  }

  async saveGameProgress(progress: any) {
    try {
      await this.httpClient.post('/api/game/progress', progress);
      console.log('游戏进度保存成功');
    } catch (error) {
      console.error('保存进度失败:', error);
      // 本地缓存进度
      this.cacheProgressLocally(progress);
    }
  }

  private updateUI() {
    if (this.userData) {
      // 更新游戏 UI
      console.log(`欢迎回来，${this.userData.name}!`);
    }
  }

  private showErrorMessage(message: string) {
    // 实现错误提示 UI
    console.error(message);
  }

  private cacheProgressLocally(progress: any) {
    localStorage.setItem('game_progress', JSON.stringify(progress));
  }

  onDestroy() {
    // 清理资源
    this.httpClient.cancelAll('游戏退出');
  }
}
```

### 2. 资源预加载器

```typescript
@ccclass
export class ResourcePreloader extends cc.Component {
  @property(cc.Label)
  progressLabel: cc.Label = null;

  @property(cc.ProgressBar)
  progressBar: cc.ProgressBar = null;

  private httpClient: HttpClient;

  onLoad() {
    this.httpClient = ServiceContainer.Shared.get<HttpClient>(SERVICES.HTTP_CLIENT);
    this.preloadResources();
  }

  async preloadResources() {
    const resources = [
      { url: 'assets/config/game-config.json', type: 'config' },
      { url: 'assets/textures/ui.atlas', type: 'texture' },
      { url: 'assets/audio/bgm.mp3', type: 'audio' },
    ];

    let loadedCount = 0;
    const totalCount = resources.length;

    // 限制并发数为2，避免过多请求
    this.httpClient.concurrency.maxConcurrent = 2;

    try {
      for (const resource of resources) {
        this.progressLabel.string = `加载 ${resource.type}...`;

        await this.httpClient.get(resource.url, {
          responseType: resource.type === 'config' ? 'json' : 'blob',
          onDownloadProgress: (progress) => {
            const totalProgress = (loadedCount + progress) / totalCount;
            this.progressBar.progress = totalProgress;
            this.progressLabel.string = `加载中... ${Math.round(totalProgress * 100)}%`;
          },
        });

        loadedCount++;
        console.log(`${resource.type} 加载完成`);
      }

      // 所有资源加载完成
      this.progressLabel.string = '加载完成，进入游戏...';
      setTimeout(() => {
        cc.director.loadScene('main');
      }, 1000);
    } catch (error) {
      this.progressLabel.string = '资源加载失败';
      console.error('预加载失败:', error);
    }
  }
}
```

### 3. 实时游戏数据同步

```typescript
@ccclass
export class GameSync extends cc.Component {
  private httpClient: HttpClient;
  private syncInterval: number = 5000; // 5秒同步一次
  private syncTimer: number = 0;

  onLoad() {
    this.httpClient = ServiceContainer.Shared.get<HttpClient>(SERVICES.HTTP_CLIENT);
    this.startSync();
  }

  private startSync() {
    this.syncTimer = setInterval(async () => {
      await this.syncGameData();
    }, this.syncInterval);
  }

  private async syncGameData() {
    try {
      const gameState = this.getCurrentGameState();

      await this.httpClient.post('/api/game/sync', gameState, {
        timeout: 3000, // 3秒超时
        retryCount: 1, // 只重试1次
      });

      console.log('游戏数据同步成功');
    } catch (error) {
      console.error('数据同步失败:', error);
      // 离线模式，本地存储
      this.saveToLocalStorage();
    }
  }

  private getCurrentGameState(): any {
    // 获取当前游戏状态
    return {
      score: 1000,
      level: 5,
      timestamp: Date.now(),
    };
  }

  private saveToLocalStorage() {
    const state = this.getCurrentGameState();
    localStorage.setItem('game_state', JSON.stringify(state));
  }

  onDestroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    this.httpClient.cancelAll('游戏同步停止');
  }
}
```

## 最佳实践总结

1. **使用拦截器统一处理**

   - 认证信息自动添加
   - 响应格式统一处理
   - 错误统一处理和提示

2. **合理使用取消机制**

   - 组件销毁时取消请求
   - 页面切换时批量取消
   - 避免内存泄漏

3. **并发控制**

   - 根据应用场景调整并发数
   - 避免过多请求影响性能

4. **错误处理**

   - 区分网络错误和业务错误
   - 提供友好的错误提示
   - 实现离线模式支持

5. **性能优化**
   - 合理设置超时时间
   - 使用请求缓存
   - 避免重复请求

通过这些示例，您应该能够充分了解如何在不同场景下使用 HttpClient 服务。记住根据实际需求调整配置，并充分利用拦截器系统来简化代码。
