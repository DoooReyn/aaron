/**
 * Aaron 框架依赖注入管理器
 */
import { Container, ServiceLifetime } from './container';

/**
 * 服务注册配置
 */
export interface IServiceRegistration {
    /** 服务标识 */
    token: string;

    /** 服务实现类 */
    implementation: new (...args: any[]) => any;

    /** 服务生命周期 */
    lifetime?: ServiceLifetime;

    /** 依赖的服务标识列表 */
    dependencies?: string[];
}

/**
 * 依赖注入管理器
 */
export class DIManager {
    /** 容器实例 */
    private container: Container;

    /** 全局单例实例 */
    private static instance: DIManager;

    constructor() {
        this.container = new Container();
    }

    /**
     * 获取单例实例
     */
    static getInstance(): DIManager {
        if (!DIManager.instance) {
            DIManager.instance = new DIManager();
        }
        return DIManager.instance;
    }

    /**
     * 重置单例实例
     */
    static resetInstance(): void {
        DIManager.instance = new DIManager();
    }

    /**
     * 批量注册服务
     */
    registerServices(registrations: IServiceRegistration[]): void {
        console.log('📝 批量注册服务...');

        for (const reg of registrations) {
            const { token, implementation, lifetime = ServiceLifetime.SINGLETON, dependencies = [] } = reg;

            if (lifetime === ServiceLifetime.SINGLETON) {
                this.container.registerSingleton(token, implementation, dependencies);
            } else {
                this.container.register(token, implementation, lifetime, dependencies);
            }
        }
    }

    /**
     * 注册单个服务
     */
    registerService(
        token: string,
        implementation: new (...args: any[]) => any,
        dependencies: string[] = [],
        lifetime: ServiceLifetime = ServiceLifetime.SINGLETON
    ): void {
        if (lifetime === ServiceLifetime.SINGLETON) {
            this.container.registerSingleton(token, implementation, dependencies);
        } else {
            this.container.register(token, implementation, lifetime, dependencies);
        }
    }

    /**
     * 注册服务实例
     */
    registerInstance<T>(token: string, instance: T): void {
        this.container.registerInstance(token, instance);
    }

    /**
     * 注册工厂函数
     */
    registerFactory<T>(
        token: string,
        factory: (container: Container) => T,
        lifetime: ServiceLifetime = ServiceLifetime.TRANSIENT
    ): void {
        this.container.registerFactory(token, factory, lifetime);
    }

    /**
     * 解析服务
     */
    resolve<T>(token: string): T {
        return this.container.resolve<T>(token);
    }

    /**
     * 尝试解析服务
     */
    tryResolve<T>(token: string): T | null {
        return this.container.tryResolve<T>(token);
    }

    /**
     * 检查服务是否已注册
     */
    isRegistered(token: string): boolean {
        return this.container.isRegistered(token);
    }

    /**
     * 移除服务
     */
    remove(token: string): boolean {
        return this.container.remove(token);
    }

    /**
     * 清除所有服务
     */
    clear(): void {
        this.container.clear();
    }

    /**
     * 获取容器实例
     */
    getContainer(): Container {
        return this.container;
    }

    /**
     * 获取统计信息
     */
    getStats(): {
        registeredServices: number;
        singletonInstances: number;
        services: Array<{ token: string; lifetime: string; dependencies: string[] }>;
    } {
        return this.container.getStats();
    }

    /**
     * 验证依赖关系
     */
    validateDependencies(): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } {
        const errors: string[] = [];
        const warnings: string[] = [];
        const stats = this.getStats();
        const registeredTokens = new Set(stats.services.map(s => s.token));

        // 检查每个服务的依赖
        for (const service of stats.services) {
            for (const dep of service.dependencies) {
                if (!registeredTokens.has(dep)) {
                    errors.push(`服务 ${service.token} 依赖的服务 ${dep} 未注册`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

/**
 * 全局简化 DI 管理器实例
 */
export const diManager = DIManager.getInstance();