import { LinkedList, ListNode } from './LinkedList';

/**
 * 环形链表
 * @description 适用于循环队列、轮询调度、约瑟夫问题等需要循环处理数据的场景
 */
export class CircularLinkedList<T> extends LinkedList<T> {
  /**
   * 添加元素到末尾（环形处理）
   */
  public append(value: T): void {
    const newNode = new ListNode(value);

    if (!this._head) {
      this._head = newNode;
      this._tail = newNode;
      newNode.next = newNode; // 环形指向自己
    } else {
      this._tail!.next = newNode;
      newNode.next = this._head; // 新节点指向头节点形成环
      this._tail = newNode;
    }
    this._size++;
  }

  /**
   * 添加元素到头部（环形处理）
   */
  public prepend(value: T): void {
    const newNode = new ListNode(value);

    if (!this._head) {
      this._head = newNode;
      this._tail = newNode;
      newNode.next = newNode; // 环形指向自己
    } else {
      newNode.next = this._head;
      this._tail!.next = newNode; // 尾节点指向新头节点
      this._head = newNode;
    }
    this._size++;
  }

  /**
   * 清空链表（解除环形引用）
   */
  public clear(): void {
    if (this._tail) {
      this._tail.next = null; // 解除环形引用
    }
    super.clear();
  }

  /**
   * 检测链表是否成环
   */
  public isCircular(): boolean {
    if (!this._head) return false;

    let slow = this._head;
    let fast = this._head;

    while (fast && fast.next) {
      slow = slow.next!;
      fast = fast.next.next!;

      if (slow === fast) {
        return true;
      }
    }
    return false;
  }

  /**
   * 转换为数组（防止无限循环）
   */
  public toArray(): T[] {
    const result: T[] = [];
    if (!this._head) return result;

    let current = this._head;
    let count = 0;

    while (current && count < this._size) {
      result.push(current.value);
      current = current.next!;
      count++;
    }
    return result;
  }
}
