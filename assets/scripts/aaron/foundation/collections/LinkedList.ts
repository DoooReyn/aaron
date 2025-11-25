/**
 * 链表节点类
 */
export class ListNode<T> {
  public value: T;
  public next: ListNode<T> | null;

  public constructor(value: T) {
    this.value = value;
    this.next = null;
  }
}

/**
 * 普通链表实现
 * @description 适用于栈、队列等只需要顺序访问的场景
 */
export class LinkedList<T> {
  protected $head: ListNode<T> | null;
  protected $tail: ListNode<T> | null;
  protected $size: number;

  public constructor() {
    this.$head = null;
    this.$tail = null;
    this.$size = 0;
  }

  /**
   * 获取链表长度
   */
  public get size(): number {
    return this.$size;
  }

  /**
   * 添加元素到末尾
   */
  public append(value: T): void {
    const newNode = new ListNode(value);

    if (!this.$head) {
      this.$head = newNode;
      this.$tail = newNode;
    } else {
      this.$tail!.next = newNode;
      this.$tail = newNode;
    }
    this.$size++;
  }

  /**
   * 添加元素到头部
   */
  public prepend(value: T): void {
    const newNode = new ListNode(value);

    if (!this.$head) {
      this.$head = newNode;
      this.$tail = newNode;
    } else {
      newNode.next = this.$head;
      this.$head = newNode;
    }
    this.$size++;
  }

  /**
   * 在指定位置插入元素
   */
  public insertAt(index: number, value: T): boolean {
    if (index < 0 || index > this.$size) return false;

    if (index === 0) {
      this.prepend(value);
      return true;
    }

    if (index === this.$size) {
      this.append(value);
      return true;
    }

    const newNode = new ListNode(value);
    let current = this.$head;
    for (let i = 0; i < index - 1; i++) {
      current = current!.next;
    }

    newNode.next = current!.next;
    current!.next = newNode;
    this.$size++;
    return true;
  }

  /**
   * 删除指定位置的元素
   */
  public removeAt(index: number): T | null {
    if (index < 0 || index >= this.$size) return null;

    let removedValue: T;
    if (index === 0) {
      removedValue = this.$head!.value;
      this.$head = this.$head!.next;
      if (!this.$head) this.$tail = null;
    } else {
      let current = this.$head;
      for (let i = 0; i < index - 1; i++) {
        current = current!.next;
      }
      removedValue = current!.next!.value;
      current!.next = current!.next!.next;

      if (index === this.$size - 1) {
        this.$tail = current;
      }
    }

    this.$size--;
    return removedValue;
  }

  /**
   * 获取指定元素的节点
   */
  public getNode(value: T): ListNode<T> | null {
    let current = this.$head;
    while (current) {
      if (current.value === value) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * 获取指定位置的元素
   */
  public getAt(index: number): T | null {
    if (index < 0 || index >= this.$size) return null;

    let current = this.$head;
    for (let i = 0; i < index; i++) {
      current = current!.next;
    }
    return current!.value;
  }

  /**
   * 查找元素索引
   */
  public indexOf(value: T): number {
    let current = this.$head;
    let index = 0;

    while (current) {
      if (current.value === value) {
        return index;
      }
      current = current.next;
      index++;
    }
    return -1;
  }

  /**
   * 判断是否包含元素
   */
  public contains(value: T): boolean {
    return this.indexOf(value) !== -1;
  }

  /**
   * 清空链表
   */
  public clear(): void {
    this.$head = null;
    this.$tail = null;
    this.$size = 0;
  }

  /**
   * 转换为数组
   */
  public toArray(): T[] {
    const result: T[] = [];
    let current = this.$head;

    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  /**
   * 传入数组，转换为链表
   */
  public fromArray(arr: T[]): void {
    this.clear(); // 清空当前链表，避免重复添加元素
    for (const value of arr) {
      // 遍历传入的数组，将元素添加到链表中，保持顺序不变。
      this.append(value); // 调用 append 方法添加元素到链表末尾。由于 append 方法已经更新了链表的大小，因此不需要额外更新 this._size。
    }
  }

  /**
   * 遍历链表
   */
  public forEach(callback: (value: T, index: number) => void): void {
    let current = this.$head;
    let index = 0;

    while (current) {
      callback(current.value, index);
      current = current.next;
      index++;
    }
  }
}
