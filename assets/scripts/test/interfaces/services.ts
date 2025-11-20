/**
 * Aaron 框架服务接口定义
 *
 * 所有接口都使用 I 前缀，所有服务都必须实现对应的接口
 */

// ==================== 数据库相关接口 ====================

/**
 * 数据库连接接口
 */
export interface IDatabaseConnection {
    /**
     * 执行 SQL 查询
     * @param sql SQL 语句
     * @returns 查询结果
     */
    query(sql: string): any[];

    /**
     * 获取连接 ID
     * @returns 连接 ID
     */
    getConnectionId(): string;
}

// ==================== 配置相关接口 ====================

/**
 * 配置服务接口
 */
export interface IConfigService {
    /**
     * 获取配置值
     * @param key 配置键
     * @returns 配置值
     */
    get(key: string): any;

    /**
     * 设置配置值
     * @param key 配置键
     * @param value 配置值
     */
    set(key: string, value: any): void;
}

// ==================== 用户相关接口 ====================

/**
 * 用户信息接口
 */
export interface IUser {
    id: number;
    name: string;
}

/**
 * 用户服务接口
 */
export interface IUserService {
    /**
     * 根据 ID 获取用户
     * @param id 用户 ID
     * @returns 用户信息
     */
    getUserById(id: number): IUser;
}

// ==================== 日志相关接口 ====================

/**
 * 日志服务接口
 */
export interface ILoggerService {
    /**
     * 记录日志
     * @param message 日志消息
     */
    log(message: string): void;

    /**
     * 获取所有日志
     * @returns 日志列表
     */
    getLogs(): string[];
}

// ==================== 认证相关接口 ====================

/**
 * 认证服务接口
 */
export interface IAuthService {
    /**
     * 用户登录
     * @param username 用户名
     * @param password 密码
     * @returns 登录是否成功
     */
    login(username: string, password: string): boolean;
}