/**
 * Aaron 框架依赖注入容器
 *
 * 不使用 reflect-metadata，采用配置驱动的依赖注入
 */

/**
 * 服务生命周期枚举
 */
export enum ServiceLifetime {
    TRANSIENT = 'transient',  // 每次都创建新实例
    SINGLETON = 'singleton'   // 单例
}

/**
 * 服务描述符
 */
export interface IServiceDescriptor {
    /** 服务标识（通常是接口名称或标识符） */
    token: string;

    /** 服务实现类 */
    implementation: new (...args: any[]) => any;

    /** 服务生命周期 */
    lifetime: ServiceLifetime;

    /** 依赖的服务标识列表（接口标识符） */
    dependencies: string[];

    /** 工厂函数（可选） */
    factory?: (container: Container) => any;

    /** 预创建的实例（可选） */
    instance?: any;
}

/**
 * 依赖注入容器
 */
export class Container {
    /** 服务注册表 */
    private services: Map<string, IServiceDescriptor> = new Map();

    /** 单例实例缓存 */
    private singletons: Map<string, any> = new Map();

    /** 正在解析的服务（用于循环依赖检测） */
    private resolving: Set<string> = new Set();

    /**
     * 注册服务
     */
    register<T>(
        token: string,
        implementation: new (...args: any[]) => T,
        lifetime: ServiceLifetime = ServiceLifetime.TRANSIENT,
        dependencies: string[] = []
    ): void {
        if (this.services.has(token)) {
            throw new Error(`服务 '${token}' 已经注册`);
        }

        const descriptor: IServiceDescriptor = {
            token,
            implementation,
            lifetime,
            dependencies
        };

        this.services.set(token, descriptor);
        console.log(`✅ 注册服务 ${token}，依赖: [${dependencies.join(', ')}]`);
    }

    /**
     * 注册单例服务
     */
    registerSingleton<T>(token: string, implementation: new (...args: any[]) => T, dependencies: string[] = []): void {
        this.register(token, implementation, ServiceLifetime.SINGLETON, dependencies);
    }

    /**
     * 注册服务实例
     */
    registerInstance<T>(token: string, instance: T): void {
        if (this.services.has(token)) {
            throw new Error(`服务 '${token}' 已经注册`);
        }

        const descriptor: IServiceDescriptor = {
            token,
            implementation: instance.constructor as new (...args: any[]) => T,
            lifetime: ServiceLifetime.SINGLETON,
            dependencies: [],
            instance
        };

        this.services.set(token, descriptor);
        this.singletons.set(token, instance);
        console.log(`✅ 注册服务实例 ${token}`);
    }

    /**
     * 注册工厂函数
     */
    registerFactory<T>(
        token: string,
        factory: (container: Container) => T,
        lifetime: ServiceLifetime = ServiceLifetime.TRANSIENT
    ): void {
        if (this.services.has(token)) {
            throw new Error(`服务 '${token}' 已经注册`);
        }

        const descriptor: IServiceDescriptor = {
            token,
            implementation: null as any,
            lifetime,
            dependencies: [],
            factory
        };

        this.services.set(token, descriptor);
        console.log(`✅ 注册工厂服务 ${token}`);
    }

    /**
     * 解析服务
     */
    resolve<T>(token: string): T {
        return this.resolveInternal(token);
    }

    /**
     * 尝试解析服务
     */
    tryResolve<T>(token: string): T | null {
        try {
            return this.resolveInternal(token);
        } catch {
            return null;
        }
    }

    /**
     * 检查服务是否已注册
     */
    isRegistered(token: string): boolean {
        return this.services.has(token);
    }

    /**
     * 移除服务
     */
    remove(token: string): boolean {
        const removed = this.services.delete(token);
        if (removed) {
            this.singletons.delete(token);
        }
        return removed;
    }

    /**
     * 清除所有服务
     */
    clear(): void {
        this.services.clear();
        this.singletons.clear();
        this.resolving.clear();
    }

    /**
     * 获取已注册服务列表
     */
    getRegisteredServices(): string[] {
        return Array.from(this.services.keys());
    }

    /**
     * 获取服务统计信息
     */
    getStats(): {
        registeredServices: number;
        singletonInstances: number;
        services: Array<{ token: string; lifetime: string; dependencies: string[] }>;
    } {
        const services = Array.from(this.services.values()).map(s => ({
            token: s.token,
            lifetime: s.lifetime,
            dependencies: s.dependencies
        }));

        return {
            registeredServices: this.services.size,
            singletonInstances: this.singletons.size,
            services
        };
    }

    /**
     * 内部解析方法
     */
    private resolveInternal<T>(token: string): T {
        // 检查循环依赖
        if (this.resolving.has(token)) {
            const stack = Array.from(this.resolving).join(' -> ');
            throw new Error(`检测到循环依赖: ${stack} -> ${token}`);
        }

        // 查找服务描述符
        const descriptor = this.services.get(token);
        if (!descriptor) {
            throw new Error(`服务 '${token}' 未注册`);
        }

        // 检查单例缓存
        if (descriptor.lifetime === ServiceLifetime.SINGLETON && this.singletons.has(token)) {
            return this.singletons.get(token);
        }

        // 标记正在解析
        this.resolving.add(token);

        try {
            // 创建实例
            const instance = this.createInstance<T>(descriptor);

            // 缓存单例
            if (descriptor.lifetime === ServiceLifetime.SINGLETON) {
                this.singletons.set(token, instance);
            }

            return instance;
        } finally {
            this.resolving.delete(token);
        }
    }

    /**
     * 创建服务实例
     */
    private createInstance<T>(descriptor: IServiceDescriptor): T {
        if (descriptor.factory) {
            return descriptor.factory(this);
        }

        if (descriptor.instance) {
            return descriptor.instance;
        }

        if (!descriptor.implementation) {
            throw new Error(`服务 '${descriptor.token}' 没有有效的实现`);
        }

        // 解析依赖
        const dependencies = descriptor.dependencies.map(dep => this.resolveInternal(dep));

        // 创建实例
        const instance = new descriptor.implementation(...dependencies);

        console.log(`🔧 创建 ${descriptor.token} 实例，注入依赖: [${descriptor.dependencies.join(', ')}]`);

        return instance;
    }
}