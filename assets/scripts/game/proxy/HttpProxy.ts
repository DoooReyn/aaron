import { aaron, literal } from '../../aaron';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: Address;
  phone: string;
  website: string;
  company: Company;
}

interface Address {
  street: string;
  suite: string;
  city: string;
  zipcode: string;
  geo: Geo;
}

interface Geo {
  lat: string;
  lng: string;
}

interface Company {
  name: string;
  catchPhrase: string;
  bs: string;
}

interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

interface Comment {
  id: number;
  postId: number;
  name: string;
  body: string;
  email: string;
}

const ROUTER = {
  users: '/users',
  posts: '/posts',
  comments: '/comments',
  user: '/users/{0}',
  post: '/posts/{0}',
} as const;

type Router = keyof typeof ROUTER;

export class HttpProxy {
  /**
   * 初始化
   */
  public static initialize() {
    aaron.http.defaults.url = 'https://jsonplaceholder.typicode.com';
  }

  /**
   * 组织路由
   * @param router 路由
   * @param params 参数列表
   * @returns
   */
  private static makeRoute(router: Router, ...params: any[]) {
    if (params.length == 0) {
      return ROUTER[router];
    }
    return literal.fmt(ROUTER[router], ...params);
  }

  /**
   * 获取用户信息
   * @param id 用户编号
   * @returns
   */
  public static async getUserInfo(id: number): Promise<User | null> {
    try {
      const router = this.makeRoute('user', id);
      const response = await aaron.http.get<User>(router);
      aaron.http.logger.d('获取用户信息成功:', response.data);
      return response.data;
    } catch (error) {
      aaron.http.logger.e('获取用户信息失败:', error);
      return null;
    }
  }

  /**
   * 获取推文列表
   * @returns
   */
  public static async getPosts(): Promise<Post[]> {
    try {
      const router = this.makeRoute('posts');
      const response = await aaron.http.get<Post[]>(router);
      aaron.http.logger.d('获取推文列表成功:', response.data);
      return response.data;
    } catch (error) {
      aaron.http.logger.e('获取推文列表失败:', error);
      return [];
    }
  }

  /**
   * 发布推文
   * @param post 推文内容
   * @returns
   */
  public static async publishPost(post: Omit<Post, 'id'>): Promise<Post | null> {
    try {
      const router = this.makeRoute('posts');
      const response = await aaron.http.post<Post>(router, post, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
      aaron.http.logger.d('发布推文成功:', response.data);
      return response.data;
    } catch (error) {
      aaron.http.logger.e('发布推文失败:', error);
      return null;
    }
  }

  /**
   * 全量修改推文
   * @param id 推文编号
   * @param post 推文内容
   * @returns
   */
  public static async modifyPost(id: number, post: Post) {
    try {
      const router = this.makeRoute('post', id);
      const response = await aaron.http.put<Post>(router, post, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
      aaron.http.logger.d('修改推文成功:', response.data);
      return response.data;
    } catch (error) {
      aaron.http.logger.e('修改推文失败:', error);
      return null;
    }
  }

  /**
   * 增量修改推文
   * @param id 推文编号
   * @param post 推文内容
   * @returns
   */
  public static async patchPost(id: number, post: Partial<Post>): Promise<Post | null> {
    try {
      const router = this.makeRoute('post', id);
      const response = await aaron.http.put<Post>(router, post, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      });
      aaron.http.logger.d('更新推文成功:', response.data);
      return response.data;
    } catch (error) {
      aaron.http.logger.e('更新推文失败:', error);
      return null;
    }
  }

  /**
   * 删除推文
   * @param id 推文编号
   * @returns
   */
  public static async deletePost(id: number): Promise<boolean> {
    try {
      const router = this.makeRoute('post', id);
      const response = await aaron.http.delete<{}>(router);
      aaron.http.logger.d('删除推文成功:', response.data);
      return true;
    } catch (error) {
      aaron.http.logger.e('删除推文失败:', error);
      return false;
    }
  }

  /**
   * 获取指定用户的推文
   * @param userId 用户编号
   * @returns
   */
  public static async getUserPosts(userId: number): Promise<Post[]> {
    try {
      const router = this.makeRoute('posts');
      const response = await aaron.http.get<Post[]>(router, {
        data: { userId },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      aaron.http.logger.d('筛选推文成功:', response.data);
      return response.data;
    } catch (error) {
      aaron.http.logger.e('筛选推文失败:', error);
      return [];
    }
  }

  /**
   * 获取推文评论
   * @param id 推文编号
   * @returns
   */
  public static async getPostComments(id: number): Promise<Comment[]> {
    try {
      const router = this.makeRoute('comments');
      const response = await aaron.http.get<Comment[]>(router, {
        data: { postId: id },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      aaron.http.logger.d('获取推文评论成功:', response.data);
      return response.data;
    } catch (error) {
      aaron.http.logger.e('获取推文评论失败:', error);
      return [];
    }
  }
}

(<any>window).hp = HttpProxy;
