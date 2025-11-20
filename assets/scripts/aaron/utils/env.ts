/**
 * 全局环境工具
 *
 * 提供跨环境的全局对象访问
 */

/**
 * 全局环境管理器
 */
export class Env {
    /** @ts-ignorer 全局对象 */
    private static $Env = globalThis || window || self || frames || global || {};
    
    /***
     * 设置全局对象
     * @description 用于在不同环境下设置全局对象（某些环境可能存在特殊的全局对象，并不限于默认的 $Env 中）
     * @param env 全局对象
     */
    public static use(env: Record<string|symbol, any>): void {
        Env.$Env = env;
    }

    /**
     * 在全局对象上设置值
     */
    static set(key: string, value: any): void {
        Env.$Env[key] = value;
    }

    /**
     * 从全局对象获取值
     */
    static getValue(key: string): any {
        Env.$Env[key];
    }

    /**
     * 检查全局对象是否有指定属性
     */
    static has(key: string): boolean {
        return Env.$Env.hasOwnProperty(key);
    }

    /**
     * 从全局对象删除属性
     */
    static delete(key: string): boolean {
        const globalObj = Env.$Env;
        if (key in globalObj) {
            delete globalObj[key];
            return true;
        }
        return false;
    }
}