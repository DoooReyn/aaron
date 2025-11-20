# 依赖注入示例

本文档提供了 Aaron 框架依赖注入系统的实际应用示例。

## 目录

- [基础示例](#基础示例)
- [游戏开发示例](#游戏开发示例)
- [复杂场景示例](#复杂场景示例)
- [测试示例](#测试示例)

## 基础示例

### 简单的配置服务

```typescript
// 1. 定义接口
export interface IConfigService {
    get(key: string): any;
    set(key: string, value: any): void;
    has(key: string): boolean;
}

// 2. 实现服务
export class ConfigService implements IConfigService {
    private _data: Record<string, any> = {};

    get(key: string): any {
        return this._data[key];
    }

    set(key: string, value: any): void {
        this._data[key] = value;
    }

    has(key: string): boolean {
        return key in this._data;
    }
}

// 3. 注册和使用
const di = DIManager.GetInstance();

di.registerService(
    'IConfigService',
    ConfigService,
    [], // 无依赖
    ServiceLifetime.SINGLETON
);

const config = di.resolve<IConfigService>('IConfigService');
config.set('game.difficulty', 'normal');
console.log(config.get('game.difficulty')); // 'normal'
```

## 游戏开发示例

### 游戏数据管理

```typescript
// 接口定义
export interface IGameDataService {
    getPlayerLevel(): number;
    setPlayerLevel(level: number): void;
    getScore(): number;
    addScore(points: number): void;
}

export interface ISaveService {
    save(key: string, data: any): void;
    load<T>(key: string): T | null;
}

export interface IEventService {
    emit(event: string, data?: any): void;
    on(event: string, handler: Function): void;
}

// 实现
export class GameDataService implements IGameDataService {
    private _level: number = 1;
    private _score: number = 0;

    constructor(
        private _saveService: ISaveService,
        private _eventService: IEventService
    ) {
        // 加载存档数据
        const saved = this._saveService.load<Partial<GameDataService>>('gameData');
        if (saved) {
            this._level = saved._level || 1;
            this._score = saved._score || 0;
        }
    }

    getPlayerLevel(): number {
        return this._level;
    }

    setPlayerLevel(level: number): void {
        const oldLevel = this._level;
        this._level = level;

        this._eventService.emit('LEVEL_UP', { oldLevel, newLevel: level });
        this._saveService.save('gameData', { _level: level, _score: this._score });
    }

    getScore(): number {
        return this._score;
    }

    addScore(points: number): void {
        this._score += points;
        this._eventService.emit('SCORE_CHANGED', { score: this._score, added: points });
        this._saveService.save('gameData', { _level: this._level, _score: this._score });
    }
}

// 注册依赖
const di = DIManager.GetInstance();

di.registerServices([
    {
        token: 'ISaveService',
        implementation: LocalStorageSaveService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: []
    },
    {
        token: 'IEventService',
        implementation: EventService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: []
    },
    {
        token: 'IGameDataService',
        implementation: GameDataService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: ['ISaveService', 'IEventService']
    }
]);
```

### 玩家管理系统

```typescript
// 接口
export interface IPlayerService {
    createPlayer(name: string): IPlayer;
    getPlayer(id: string): IPlayer | null;
    getAllPlayers(): IPlayer[];
}

export interface IPlayer {
    readonly id: string;
    readonly name: string;
    health: number;
    position: Vec3;
}

// 实现
export class PlayerService implements IPlayerService {
    private _players: Map<string, IPlayer> = new Map();

    constructor(private _logger: ILoggerService) {}

    createPlayer(name: string): IPlayer {
        const player: IPlayer = {
            id: `player_${Date.now()}`,
            name,
            health: 100,
            position: new Vec3(0, 0, 0)
        };

        this._players.set(player.id, player);
        this._logger.log(`创建玩家: ${name} (${player.id})`);

        return player;
    }

    getPlayer(id: string): IPlayer | null {
        return this._players.get(id) || null;
    }

    getAllPlayers(): IPlayer[] {
        return Array.from(this._players.values());
    }
}
```

## 复杂场景示例

### 插件系统集成

```typescript
// 插件接口
export interface IGamePlugin {
    readonly name: string;
    readonly version: string;
    initialize(di: DIManager): Promise<void>;
    shutdown(): Promise<void>;
}

// 插件管理器
export class PluginManager implements IPluginManager {
    private _plugins: Map<string, IGamePlugin> = new Map();

    constructor(private _di: DIManager, private _logger: ILoggerService) {}

    async loadPlugin(plugin: IGamePlugin): Promise<void> {
        if (this._plugins.has(plugin.name)) {
            throw new Error(`插件 ${plugin.name} 已经加载`);
        }

        this._logger.log(`正在加载插件: ${plugin.name} v${plugin.version}`);

        // 让插件注册自己的服务
        await plugin.initialize(this._di);

        this._plugins.set(plugin.name, plugin);
        this._logger.log(`插件加载成功: ${plugin.name}`);
    }

    getPlugin(name: string): IGamePlugin | null {
        return this._plugins.get(name) || null;
    }
}

// 示例插件
export class AudioPlugin implements IGamePlugin {
    readonly name = 'AudioPlugin';
    readonly version = '1.0.0';

    async initialize(di: DIManager): Promise<void> {
        // 注册音频相关服务
        di.registerService(
            'IAudioService',
            AudioService,
            [],
            ServiceLifetime.SINGLETON
        );
    }

    async shutdown(): Promise<void> {
        console.log('音频插件关闭');
    }
}

// 使用插件系统
const di = DIManager.GetInstance();
const pluginManager = di.resolve<IPluginManager>('IPluginManager');
await pluginManager.loadPlugin(new AudioPlugin());

// 现在可以使用音频服务
const audioService = di.tryResolve<IAudioService>('IAudioService');
if (audioService) {
    audioService.playBgm('main-theme.mp3');
}
```

### 多层依赖架构

```typescript
// 网络服务
export interface INetworkService {
    request<T>(url: string, data?: any): Promise<T>;
}

export interface IApiService {
    getUserProfile(userId: string): Promise<IUser>;
    updateScore(score: number): Promise<void>;
}

export interface IGameService {
    login(username: string, password: string): Promise<boolean>;
    getLeaderboard(): Promise<IUser[]>;
}

// 实现
export class NetworkService implements INetworkService {
    async request<T>(url: string, data?: any): Promise<T> {
        // 网络请求实现
        console.log(`请求: ${url}`, data);
        return {} as T;
    }
}

export class ApiService implements IApiService {
    constructor(private _network: INetworkService) {}

    async getUserProfile(userId: string): Promise<IUser> {
        return this._network.request<IUser>(`/api/users/${userId}`);
    }

    async updateScore(score: number): Promise<void> {
        await this._network.request('/api/score', { score });
    }
}

export class GameService implements IGameService {
    constructor(
        private _api: IApiService,
        private _logger: ILoggerService,
        private _config: IConfigService
    ) {}

    async login(username: string, password: string): Promise<boolean> {
        this._logger.log(`尝试登录: ${username}`);

        try {
            const response = await this._api.request<{token: string}>('/api/login', {
                username,
                password
            });

            // 保存 token
            this._config.set('auth.token', response.token);
            this._logger.log('登录成功');
            return true;
        } catch (error) {
            this._logger.log(`登录失败: ${error.message}`);
            return false;
        }
    }

    async getLeaderboard(): Promise<IUser[]> {
        const cacheTimeout = this._config.get('leaderboard.cacheTimeout', 300000);
        // 实现排行榜逻辑
        return [];
    }
}

// 注册复杂依赖
di.registerServices([
    {
        token: 'INetworkService',
        implementation: NetworkService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: []
    },
    {
        token: 'IApiService',
        implementation: ApiService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: ['INetworkService']
    },
    {
        token: 'IGameService',
        implementation: GameService,
        lifetime: ServiceLifetime.SINGLETON,
        dependencies: ['IApiService', 'ILoggerService', 'IConfigService']
    }
]);
```

## 测试示例

### 单元测试

```typescript
describe('GameDataService', () => {
    let gameDataService: IGameDataService;
    let mockSaveService: jest.Mocked<ISaveService>;
    let mockEventService: jest.Mocked<IEventService>;

    beforeEach(() => {
        // 重置 DI 容器
        DIManager.ResetInstance();

        const di = DIManager.GetInstance();

        // 创建模拟对象
        mockSaveService = {
            save: jest.fn(),
            load: jest.fn().mockReturnValue(null)
        };

        mockEventService = {
            emit: jest.fn(),
            on: jest.fn()
        };

        // 注册模拟服务
        di.registerInstance('ISaveService', mockSaveService);
        di.registerInstance('IEventService', mockEventService);

        // 注册测试目标
        di.registerService(
            'IGameDataService',
            GameDataService,
            ['ISaveService', 'IEventService']
        );

        // 解析服务
        gameDataService = di.resolve<IGameDataService>('IGameDataService');
    });

    it('should initialize with default values', () => {
        expect(gameDataService.getPlayerLevel()).toBe(1);
        expect(gameDataService.getScore()).toBe(0);
    });

    it('should level up and emit event', () => {
        gameDataService.setPlayerLevel(5);

        expect(gameDataService.getPlayerLevel()).toBe(5);
        expect(mockEventService.emit).toHaveBeenCalledWith('LEVEL_UP', {
            oldLevel: 1,
            newLevel: 5
        });
        expect(mockSaveService.save).toHaveBeenCalledWith('gameData', {
            _level: 5,
            _score: 0
        });
    });

    it('should add score and emit event', () => {
        gameDataService.addScore(100);

        expect(gameDataService.getScore()).toBe(100);
        expect(mockEventService.emit).toHaveBeenCalledWith('SCORE_CHANGED', {
            score: 100,
            added: 100
        });
    });
});
```

### 集成测试

```typescript
describe('Game Integration', () => {
    let di: DIManager;

    beforeAll(() => {
        DIManager.ResetInstance();
        di = DIManager.GetInstance();

        // 注册所有服务
        di.registerServices([
            {
                token: 'IConfigService',
                implementation: ConfigService,
                lifetime: ServiceLifetime.SINGLETON,
                dependencies: []
            },
            {
                token: 'ILoggerService',
                implementation: LoggerService,
                lifetime: ServiceLifetime.SINGLETON,
                dependencies: []
            },
            {
                token: 'IGameDataService',
                implementation: GameDataService,
                lifetime: ServiceLifetime.SINGLETON,
                dependencies: ['ISaveService', 'IEventService']
            },
            {
                token: 'IPlayerService',
                implementation: PlayerService,
                lifetime: ServiceLifetime.SINGLETON,
                dependencies: ['ILoggerService']
            }
        ]);
    });

    it('should create complete game flow', () => {
        const gameData = di.resolve<IGameDataService>('IGameDataService');
        const playerService = di.resolve<IPlayerService>('IPlayerService');

        // 创建玩家
        const player = playerService.createPlayer('TestPlayer');
        expect(player.name).toBe('TestPlayer');
        expect(player.health).toBe(100);

        // 增加分数
        gameData.addScore(1000);
        expect(gameData.getScore()).toBe(1000);

        // 升级
        gameData.setPlayerLevel(2);
        expect(gameData.getPlayerLevel()).toBe(2);
    });
});
```

---

*示例文档 - Aaron 框架依赖注入系统*