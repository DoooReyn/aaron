/**
 * Aaron 框架依赖注入系统测试
 */

import { DIManager, ServiceLifetime } from '../aaron';
import {
    IDatabaseConnection,
    IConfigService,
    IUserService,
    ILoggerService,
    IAuthService,
    IUser
} from './interfaces/services';

// ==================== 示例服务类 ====================

/**
 * 数据库连接服务实现
 */
export class DatabaseConnection implements IDatabaseConnection {
    private connectionId: string;

    constructor() {
        this.connectionId = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`✅ 数据库连接已建立: ${this.connectionId}`);
    }

    query(sql: string): any[] {
        console.log(`🔍 执行查询: ${sql}`);
        return [`查询结果: ${sql}`];
    }

    getConnectionId(): string {
        return this.connectionId;
    }
}

/**
 * 配置服务实现
 */
export class ConfigService implements IConfigService {
    private config: Record<string, any> = {
        app: {
            name: 'Aaron Framework',
            version: '1.0.0',
            debug: true
        }
    };

    get(key: string): any {
        return this.config[key];
    }

    set(key: string, value: any): void {
        this.config[key] = value;
    }
}

/**
 * 用户服务实现
 */
export class UserService implements IUserService {
    constructor(
        private db: IDatabaseConnection,
        private config: IConfigService
    ) {
        console.log('✅ UserService 已初始化');
    }

    getUserById(id: number): IUser {
        const config = this.config.get('app');
        console.log(`👤 获取用户 ${id}，应用: ${config.name}`);

        const results = this.db.query(`SELECT * FROM users WHERE id = ${id}`);
        return { id, name: `User ${id}`, ...results[0] };
    }
}

/**
 * 日志服务实现
 */
export class LoggerService implements ILoggerService {
    private db: IDatabaseConnection;
    private config: IConfigService;

    private logs: string[] = [];

    // 手动设置依赖的方法（使用接口类型）
    setDependencies(db: IDatabaseConnection, config: IConfigService): void {
        this.db = db;
        this.config = config;
        console.log('✅ LoggerService 依赖已设置');
    }

    log(message: string): void {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        console.log(`📝 ${logEntry}`);

        // 使用注入的服务
        const config = this.config.get('app');
        if (config.debug) {
            console.log(`🐛 调试模式：记录到数据库 ${this.db.getConnectionId()}`);
        }
    }

    getLogs(): string[] {
        return this.logs;
    }
}

/**
 * 认证服务实现
 */
export class AuthService implements IAuthService {
    constructor(
        private userService: IUserService,
        private logger: ILoggerService
    ) {
        console.log('✅ AuthService 已初始化');
    }

    login(username: string, password: string): boolean {
        this.logger.log(`用户登录尝试: ${username}`);

        // 模拟认证逻辑
        const user = this.userService.getUserById(1);
        const success = username === 'admin' && password === 'password';

        this.logger.log(`用户 ${username} 登录${success ? '成功' : '失败'}`);
        return success;
    }
}

// ==================== 测试函数 ====================

/**
 * 测试基于接口的依赖注入功能
 */
export function testSimpleDI(): void {
    console.log('\n🧪 开始测试基于接口的依赖注入功能...\n');

    const diManager = DIManager.getInstance();

    // 1. 批量注册服务并配置依赖关系（使用接口标识符）
    console.log('📝 注册服务并配置依赖关系（基于接口）...');
    diManager.registerServices([
        {
            token: 'IDatabaseConnection',
            implementation: DatabaseConnection,
            lifetime: ServiceLifetime.SINGLETON,
            dependencies: []
        },
        {
            token: 'IConfigService',
            implementation: ConfigService,
            lifetime: ServiceLifetime.SINGLETON,
            dependencies: []
        },
        {
            token: 'IUserService',
            implementation: UserService,
            lifetime: ServiceLifetime.SINGLETON,
            dependencies: ['IDatabaseConnection', 'IConfigService']
        },
        {
            token: 'ILoggerService',
            implementation: LoggerService,
            lifetime: ServiceLifetime.SINGLETON,
            dependencies: []
        },
        {
            token: 'IAuthService',
            implementation: AuthService,
            lifetime: ServiceLifetime.SINGLETON,
            dependencies: ['IUserService', 'ILoggerService']
        }
    ]);

    // 2. 手动设置 LoggerService 的依赖（因为它需要特殊处理）
    console.log('\n🔧 手动设置 LoggerService 属性依赖...');
    const logger = diManager.resolve<ILoggerService>('ILoggerService');
    const db = diManager.resolve<IDatabaseConnection>('IDatabaseConnection');
    const config = diManager.resolve<IConfigService>('IConfigService');

    // 类型检查，确保实现了正确的方法
    if ('setDependencies' in logger) {
        (logger as LoggerService).setDependencies(db, config);
    }

    // 3. 验证依赖关系
    console.log('\n🔍 验证依赖关系...');
    const validation = diManager.validateDependencies();
    if (validation.isValid) {
        console.log('✅ 所有依赖关系验证通过');
    } else {
        console.log('❌ 发现依赖问题:');
        validation.errors.forEach(error => console.log(`  - ${error}`));
    }

    // 4. 测试服务解析（使用接口标识符）
    console.log('\n🔧 测试服务解析...');
    console.log('🔍 检查服务是否已注册...');
    console.log('IAuthService 是否注册:', diManager.isRegistered('IAuthService'));
    console.log('IUserService 是否注册:', diManager.isRegistered('IUserService'));
    console.log('ILoggerService 是否注册:', diManager.isRegistered('ILoggerService'));

    // 5. 解析并使用 AuthService（通过接口）
    console.log('\n⚡ 解析并测试 AuthService（通过接口）...');
    const authService = diManager.resolve<IAuthService>('IAuthService');
    console.log('✅ IAuthService 解析成功:', authService);

    // 测试登录功能
    console.log('\n🔐 测试登录功能...');
    const loginResult = authService.login('admin', 'password');
    console.log(`登录结果: ${loginResult}`);

    // 6. 测试单例行为
    console.log('\n🔄 测试单例行为...');
    const authService2 = diManager.resolve<IAuthService>('IAuthService');
    const logger1 = diManager.resolve<ILoggerService>('ILoggerService');
    const logger2 = diManager.resolve<ILoggerService>('ILoggerService');

    console.log(`IAuthService 是否为同一实例: ${authService === authService2}`);
    console.log(`ILoggerService 是否为同一实例: ${logger1 === logger2}`);

    // 7. 显示统计信息
    console.log('\n📊 服务统计信息:');
    const stats = diManager.getStats();
    console.log(`已注册服务数: ${stats.registeredServices}`);
    console.log(`单例实例数: ${stats.singletonInstances}`);
    console.log('服务列表:');
    stats.services.forEach(s => {
        console.log(`  - ${s.token} (${s.lifetime}) -> [${s.dependencies.join(', ')}]`);
    });
}

/**
 * 运行所有测试
 */
export function runAllTests(): void {
    console.log('🚀 开始运行简化依赖注入系统测试...\n');

    try {
        testSimpleDI();

        console.log('\n🎉 所有测试完成！');
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 启动提示
console.log('💡 Aaron 框架依赖注入系统已准备就绪，调用 runAllTests() 来运行测试');
(window as any).runAllTests = runAllTests;