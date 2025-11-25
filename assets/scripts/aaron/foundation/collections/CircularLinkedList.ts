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

    if (!this.$head) {
      this.$head = newNode;
      this.$tail = newNode;
      newNode.next = newNode; // 环形指向自己
    } else {
      this.$tail!.next = newNode;
      newNode.next = this.$head; // 新节点指向头节点形成环
      this.$tail = newNode;
    }
    this.$size++;
  }

  /**
   * 添加元素到头部（环形处理）
   */
  public prepend(value: T): void {
    const newNode = new ListNode(value);

    if (!this.$head) {
      this.$head = newNode;
      this.$tail = newNode;
      newNode.next = newNode; // 环形指向自己
    } else {
      newNode.next = this.$head;
      this.$tail!.next = newNode; // 尾节点指向新头节点
      this.$head = newNode;
    }
    this.$size++;
  }

  /**
   * 清空链表（解除环形引用）
   */
  public clear(): void {
    if (this.$tail) {
      this.$tail.next = null; // 解除环形引用
    }
    super.clear();
  }

  /**
   * 检测链表是否成环
   */
  public isCircular(): boolean {
    if (!this.$head) return false;

    let slow = this.$head;
    let fast = this.$head;

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
    if (!this.$head) return result;

    let current = this.$head;
    let count = 0;

    while (current && count < this.$size) {
      result.push(current.value);
      current = current.next!;
      count++;
    }
    return result;
  }
}
